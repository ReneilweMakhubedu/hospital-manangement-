package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.entity.Complaint;
import za.gov.mpumalanga.rfh.entity.QueueEntry;
import za.gov.mpumalanga.rfh.entity.TheatreSession;
import za.gov.mpumalanga.rfh.repository.AppointmentRepository;
import za.gov.mpumalanga.rfh.repository.ComplaintRepository;
import za.gov.mpumalanga.rfh.repository.MedicineRepository;
import za.gov.mpumalanga.rfh.repository.QueueRepository;
import za.gov.mpumalanga.rfh.repository.SurgicalWaitlistRepository;
import za.gov.mpumalanga.rfh.repository.TheatreRepository;
import za.gov.mpumalanga.rfh.repository.TheatreSessionRepository;
import za.gov.mpumalanga.rfh.repository.VacancyRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/monitoring/kpis")
public class MonitoringKpisController {

	private static final Set<String> OPEN_COMPLAINT = Set.of("OPEN", "ACKNOWLEDGED", "IN_PROGRESS");
	private static final int AVAILABLE_MINUTES_PER_DAY = 8 * 60;

	private final QueueRepository queueRepository;
	private final AppointmentRepository appointmentRepository;
	private final SurgicalWaitlistRepository waitlistRepository;
	private final ComplaintRepository complaintRepository;
	private final MedicineRepository medicineRepository;
	private final TheatreRepository theatreRepository;
	private final TheatreSessionRepository theatreSessionRepository;
	private final VacancyRepository vacancyRepository;
	private final SecurityUtils securityUtils;

	public MonitoringKpisController(
			QueueRepository queueRepository,
			AppointmentRepository appointmentRepository,
			SurgicalWaitlistRepository waitlistRepository,
			ComplaintRepository complaintRepository,
			MedicineRepository medicineRepository,
			TheatreRepository theatreRepository,
			TheatreSessionRepository theatreSessionRepository,
			VacancyRepository vacancyRepository,
			SecurityUtils securityUtils) {
		this.queueRepository = queueRepository;
		this.appointmentRepository = appointmentRepository;
		this.waitlistRepository = waitlistRepository;
		this.complaintRepository = complaintRepository;
		this.medicineRepository = medicineRepository;
		this.theatreRepository = theatreRepository;
		this.theatreSessionRepository = theatreSessionRepository;
		this.vacancyRepository = vacancyRepository;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public Map<String, Object> snapshot() {
		securityUtils.requireStaff();
		LocalDate today = LocalDate.now();
		Instant now = Instant.now();

		List<QueueEntry> todayQueue = queueRepository.findByQueueDateOrderByQueueNumberAsc(today);
		long queueWaiting = todayQueue.stream().filter(q -> "waiting".equalsIgnoreCase(q.getStatus())).count();
		long queueInProgress = todayQueue.stream().filter(q -> "in_progress".equalsIgnoreCase(q.getStatus())
				|| "called".equalsIgnoreCase(q.getStatus())).count();
		long queueCompleted = todayQueue.stream().filter(q -> "completed".equalsIgnoreCase(q.getStatus())).count();

		long appointmentsToday = appointmentRepository.findByDate(today.toString()).size();
		long waitlistOverdue = waitlistRepository.findAll().stream()
				.filter(e -> e.isOverdue())
				.count();

		List<Complaint> complaints = complaintRepository.findAll();
		long openComplaints = complaints.stream()
				.filter(c -> OPEN_COMPLAINT.contains(norm(c.getStatus())))
				.count();
		long complaintsAckOverdue = complaints.stream().filter(c -> isAckOverdue(c, now)).count();
		long complaintsResolveOverdue = complaints.stream().filter(c -> isResolveOverdue(c, now)).count();

		long pharmacyLowStock = medicineRepository.findAll().stream()
				.filter(m -> {
					int qty = m.getQuantity() == null ? 0 : m.getQuantity();
					int reorder = m.getReorderLevel() == null ? 0 : m.getReorderLevel();
					return qty <= reorder;
				})
				.count();

		List<TheatreSession> todaySessions = theatreSessionRepository.findBySessionDate(today);
		long theatreCount = Math.max(1, theatreRepository.count());
		long availableMinutes = theatreCount * AVAILABLE_MINUTES_PER_DAY;
		int completedMinutes = todaySessions.stream()
				.filter(s -> "COMPLETED".equalsIgnoreCase(s.getStatus()))
				.mapToInt(s -> s.getUtilisationMinutes() == null ? 0 : s.getUtilisationMinutes())
				.sum();
		double theatreUtilisationTodayPercent = availableMinutes == 0
				? 0.0
				: Math.round((completedMinutes * 1000.0) / availableMinutes) / 10.0;

		int vacancyGap = vacancyRepository.findAll().stream()
				.mapToInt(v -> Math.max(0,
						(v.getPostsApproved() == null ? 0 : v.getPostsApproved())
								- (v.getPostsFilled() == null ? 0 : v.getPostsFilled())))
				.sum();

		Map<String, Object> queue = new LinkedHashMap<>();
		queue.put("waiting", queueWaiting);
		queue.put("inProgress", queueInProgress);
		queue.put("completed", queueCompleted);

		Map<String, Object> complaintsMap = new LinkedHashMap<>();
		complaintsMap.put("open", openComplaints);
		complaintsMap.put("ackOverdue", complaintsAckOverdue);
		complaintsMap.put("resolveOverdue", complaintsResolveOverdue);

		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("generatedAt", now.toString());
		payload.put("facilityName", "Rob Ferreira Hospital");
		payload.put("queue", queue);
		payload.put("appointmentsToday", appointmentsToday);
		payload.put("waitlistOverdue", waitlistOverdue);
		payload.put("complaints", complaintsMap);
		payload.put("pharmacyLowStock", pharmacyLowStock);
		payload.put("theatreUtilisationTodayPercent", theatreUtilisationTodayPercent);
		payload.put("theatreSessionsToday", todaySessions.size());
		payload.put("vacancyGap", vacancyGap);
		return payload;
	}

	private static boolean isAckOverdue(Complaint c, Instant now) {
		String status = norm(c.getStatus());
		if ("ACKNOWLEDGED".equals(status) || "IN_PROGRESS".equals(status)
				|| "RESOLVED".equals(status) || "CLOSED".equals(status)) {
			return false;
		}
		return c.getAcknowledgedAt() == null
				&& c.getSlaAckDueAt() != null
				&& now.isAfter(c.getSlaAckDueAt());
	}

	private static boolean isResolveOverdue(Complaint c, Instant now) {
		String status = norm(c.getStatus());
		if ("RESOLVED".equals(status) || "CLOSED".equals(status)) {
			return false;
		}
		return c.getResolvedAt() == null
				&& c.getSlaResolveDueAt() != null
				&& now.isAfter(c.getSlaResolveDueAt());
	}

	private static String norm(String status) {
		return status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
	}
}

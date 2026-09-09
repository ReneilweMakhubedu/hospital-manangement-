package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.entity.Complaint;
import za.gov.mpumalanga.rfh.entity.Medicine;
import za.gov.mpumalanga.rfh.entity.QueueEntry;
import za.gov.mpumalanga.rfh.entity.SurgicalWaitlistEntry;
import za.gov.mpumalanga.rfh.repository.AppointmentRepository;
import za.gov.mpumalanga.rfh.repository.ComplaintRepository;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.MedicineRepository;
import za.gov.mpumalanga.rfh.repository.QueueRepository;
import za.gov.mpumalanga.rfh.repository.SurgicalWaitlistRepository;
import za.gov.mpumalanga.rfh.repository.VacancyRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/reporting/exports")
public class ReportingExportsController {

	private static final Set<String> OPEN_COMPLAINT = Set.of("OPEN", "ACKNOWLEDGED", "IN_PROGRESS");

	private final AppointmentRepository appointmentRepository;
	private final QueueRepository queueRepository;
	private final SurgicalWaitlistRepository waitlistRepository;
	private final ComplaintRepository complaintRepository;
	private final MedicineRepository medicineRepository;
	private final DoctorRepository doctorRepository;
	private final VacancyRepository vacancyRepository;
	private final SecurityUtils securityUtils;

	public ReportingExportsController(
			AppointmentRepository appointmentRepository,
			QueueRepository queueRepository,
			SurgicalWaitlistRepository waitlistRepository,
			ComplaintRepository complaintRepository,
			MedicineRepository medicineRepository,
			DoctorRepository doctorRepository,
			VacancyRepository vacancyRepository,
			SecurityUtils securityUtils) {
		this.appointmentRepository = appointmentRepository;
		this.queueRepository = queueRepository;
		this.waitlistRepository = waitlistRepository;
		this.complaintRepository = complaintRepository;
		this.medicineRepository = medicineRepository;
		this.doctorRepository = doctorRepository;
		this.vacancyRepository = vacancyRepository;
		this.securityUtils = securityUtils;
	}

	@GetMapping("/dhis2-pack")
	public Map<String, Object> dhis2Pack() {
		securityUtils.requireStaff();
		Map<String, Object> indicators = buildIndicators();
		Map<String, Object> pack = new LinkedHashMap<>();
		pack.put("facilityName", "Rob Ferreira Hospital");
		pack.put("facilityCode", "RFH-MP");
		pack.put("generatedAt", Instant.now().toString());
		pack.put("indicators", indicators);
		pack.putAll(indicators);
		return pack;
	}

	@GetMapping("/mapping")
	public List<Map<String, String>> mapping() {
		securityUtils.requireStaff();
		List<Map<String, String>> rows = new ArrayList<>();
		rows.add(mapRow("outpatientVisitsToday", "OPD.VISITS.DAY", "appointments.date = today count"));
		rows.add(mapRow("queueWaiting", "RECEPTION.QUEUE.WAITING", "queue status=waiting today"));
		rows.add(mapRow("queueCompletedToday", "RECEPTION.QUEUE.COMPLETED", "queue status=completed today"));
		rows.add(mapRow("surgicalWaiting", "SURG.WAITLIST.WAITING", "surgical_waitlist status=WAITING"));
		rows.add(mapRow("surgicalOverdue", "SURG.WAITLIST.OVERDUE", "surgical_waitlist overdue TTG"));
		rows.add(mapRow("openComplaints", "PX.COMPLAINTS.OPEN", "complaints open statuses"));
		rows.add(mapRow("complaintsSlaBreaches", "PX.COMPLAINTS.SLA_BREACH", "ack or resolve overdue"));
		rows.add(mapRow("pharmacyLowStockCount", "PHARM.STOCK.LOW", "medicines qty <= reorderLevel"));
		rows.add(mapRow("doctorsOnEstablishment", "HR.DOCTORS.COUNT", "doctors table count"));
		rows.add(mapRow("vacancyGap", "HR.VACANCY.GAP", "sum(postsApproved-postsFilled)"));
		return rows;
	}

	@GetMapping("/quality-checks")
	public List<Map<String, Object>> qualityChecks() {
		securityUtils.requireStaff();
		Map<String, Object> indicators = buildIndicators();
		List<Map<String, Object>> checks = new ArrayList<>();

		long outpatient = ((Number) indicators.get("outpatientVisitsToday")).longValue();
		checks.add(check("Outpatient visits captured today",
				outpatient > 0 ? "PASS" : "WARN",
				outpatient + " appointments today"));

		long lowStock = ((Number) indicators.get("pharmacyLowStockCount")).longValue();
		checks.add(check("Pharmacy stock levels",
				lowStock == 0 ? "PASS" : (lowStock <= 2 ? "WARN" : "FAIL"),
				lowStock + " medicines at/below reorder level"));

		long slaBreaches = ((Number) indicators.get("complaintsSlaBreaches")).longValue();
		checks.add(check("Complaints SLA compliance",
				slaBreaches == 0 ? "PASS" : "FAIL",
				slaBreaches + " open complaints breaching ack/resolve SLA"));

		long surgicalOverdue = ((Number) indicators.get("surgicalOverdue")).longValue();
		checks.add(check("Surgical TTG overdue",
				surgicalOverdue == 0 ? "PASS" : "WARN",
				surgicalOverdue + " waiting entries past TTG"));

		long vacancyGap = ((Number) indicators.get("vacancyGap")).longValue();
		checks.add(check("Establishment vacancy gap",
				vacancyGap == 0 ? "PASS" : (vacancyGap <= 5 ? "WARN" : "FAIL"),
				vacancyGap + " unfilled approved posts"));

		long doctors = ((Number) indicators.get("doctorsOnEstablishment")).longValue();
		checks.add(check("Doctor master data present",
				doctors > 0 ? "PASS" : "FAIL",
				doctors + " doctors on establishment"));

		return checks;
	}

	private Map<String, Object> buildIndicators() {
		LocalDate today = LocalDate.now();
		Instant now = Instant.now();

		long outpatientVisitsToday = appointmentRepository.findByDate(today.toString()).size();

		List<QueueEntry> todayQueue = queueRepository.findByQueueDateOrderByQueueNumberAsc(today);
		long queueWaiting = todayQueue.stream().filter(q -> "waiting".equalsIgnoreCase(q.getStatus())).count();
		long queueCompletedToday = todayQueue.stream().filter(q -> "completed".equalsIgnoreCase(q.getStatus())).count();

		List<SurgicalWaitlistEntry> waitlist = waitlistRepository.findAll();
		long surgicalWaiting = waitlist.stream().filter(e -> "WAITING".equalsIgnoreCase(e.getStatus())).count();
		long surgicalOverdue = waitlist.stream().filter(SurgicalWaitlistEntry::isOverdue).count();

		List<Complaint> complaints = complaintRepository.findAll();
		long openComplaints = complaints.stream()
				.filter(c -> OPEN_COMPLAINT.contains(norm(c.getStatus())))
				.count();
		long complaintsSlaBreaches = complaints.stream()
				.filter(c -> isAckOverdue(c, now) || isResolveOverdue(c, now))
				.count();

		long pharmacyLowStockCount = medicineRepository.findAll().stream()
				.filter(this::isLowStock)
				.count();

		long doctorsOnEstablishment = doctorRepository.count();
		int vacancyGap = vacancyRepository.findAll().stream()
				.mapToInt(v -> Math.max(0,
						(v.getPostsApproved() == null ? 0 : v.getPostsApproved())
								- (v.getPostsFilled() == null ? 0 : v.getPostsFilled())))
				.sum();

		Map<String, Object> map = new LinkedHashMap<>();
		map.put("outpatientVisitsToday", outpatientVisitsToday);
		map.put("queueWaiting", queueWaiting);
		map.put("queueCompletedToday", queueCompletedToday);
		map.put("surgicalWaiting", surgicalWaiting);
		map.put("surgicalOverdue", surgicalOverdue);
		map.put("openComplaints", openComplaints);
		map.put("complaintsSlaBreaches", complaintsSlaBreaches);
		map.put("pharmacyLowStockCount", pharmacyLowStockCount);
		map.put("doctorsOnEstablishment", doctorsOnEstablishment);
		map.put("vacancyGap", vacancyGap);
		return map;
	}

	private boolean isLowStock(Medicine medicine) {
		int qty = medicine.getQuantity() == null ? 0 : medicine.getQuantity();
		int reorder = medicine.getReorderLevel() == null ? 0 : medicine.getReorderLevel();
		return qty <= reorder;
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

	private static Map<String, String> mapRow(String indicator, String hint, String source) {
		Map<String, String> row = new LinkedHashMap<>();
		row.put("indicator", indicator);
		row.put("dhis2DataElementHint", hint);
		row.put("source", source);
		return row;
	}

	private static Map<String, Object> check(String name, String status, String detail) {
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("check", name);
		row.put("status", status);
		row.put("detail", detail);
		return row;
	}
}

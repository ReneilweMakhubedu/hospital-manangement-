package za.gov.mpumalanga.rfh.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.gov.mpumalanga.rfh.entity.Appointment;
import za.gov.mpumalanga.rfh.entity.BiomedAsset;
import za.gov.mpumalanga.rfh.entity.Complaint;
import za.gov.mpumalanga.rfh.entity.EdVisit;
import za.gov.mpumalanga.rfh.entity.ImagingOrder;
import za.gov.mpumalanga.rfh.entity.LabOrder;
import za.gov.mpumalanga.rfh.entity.Medicine;
import za.gov.mpumalanga.rfh.entity.NursingMedAdmin;
import za.gov.mpumalanga.rfh.entity.PharmacyQueueTicket;
import za.gov.mpumalanga.rfh.entity.SmsReminder;
import za.gov.mpumalanga.rfh.entity.StaffAlert;
import za.gov.mpumalanga.rfh.entity.User;
import za.gov.mpumalanga.rfh.repository.AppointmentRepository;
import za.gov.mpumalanga.rfh.repository.ComplaintRepository;
import za.gov.mpumalanga.rfh.repository.MedicineRepository;
import za.gov.mpumalanga.rfh.repository.PharmacyQueueTicketRepository;
import za.gov.mpumalanga.rfh.repository.SmsReminderRepository;
import za.gov.mpumalanga.rfh.repository.SupportStore;
import za.gov.mpumalanga.rfh.repository.UserRepository;

@Service
public class AutomationService {

	private final SupportStore supportStore;
	private final ComplaintRepository complaintRepository;
	private final MedicineRepository medicineRepository;
	private final PharmacyQueueTicketRepository ticketRepository;
	private final SmsReminderRepository smsReminderRepository;
	private final AppointmentRepository appointmentRepository;
	private final UserRepository userRepository;

	public AutomationService(
			SupportStore supportStore,
			ComplaintRepository complaintRepository,
			MedicineRepository medicineRepository,
			PharmacyQueueTicketRepository ticketRepository,
			SmsReminderRepository smsReminderRepository,
			AppointmentRepository appointmentRepository,
			UserRepository userRepository) {
		this.supportStore = supportStore;
		this.complaintRepository = complaintRepository;
		this.medicineRepository = medicineRepository;
		this.ticketRepository = ticketRepository;
		this.smsReminderRepository = smsReminderRepository;
		this.appointmentRepository = appointmentRepository;
		this.userRepository = userRepository;
	}

	@Transactional
	public Map<String, Object> runAll() {
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("ranAt", Instant.now().toString());
		result.put("sms", flushSmsReminders());
		result.put("alertsCreated", scanOperationalAlerts());
		return result;
	}

	@Transactional
	public Map<String, Object> flushSmsReminders() {
		LocalDate tomorrow = LocalDate.now().plusDays(1);
		List<Appointment> appointments = appointmentRepository.findByDate(tomorrow.toString());
		int created = 0;
		int skipped = 0;
		for (Appointment appointment : appointments) {
			if (appointment.getId() != null
					&& smsReminderRepository.existsByAppointmentIdAndStatusNot(appointment.getId(), "OPTED_OUT")) {
				skipped++;
				continue;
			}
			User patient = userRepository.findById(appointment.getPatientId()).orElse(null);
			if (patient == null
					|| patient.getPhoneNumber() == null
					|| patient.getPhoneNumber().isBlank()
					|| !Boolean.TRUE.equals(patient.getSmsConsent())) {
				skipped++;
				continue;
			}
			SmsReminder reminder = new SmsReminder();
			reminder.setAppointmentId(appointment.getId());
			reminder.setPatientId(patient.getId());
			reminder.setPhoneNumber(patient.getPhoneNumber().trim());
			reminder.setMessage("RFH reminder: appointment on " + appointment.getDate()
					+ " at " + appointment.getTime() + ". Reply STOP to opt out.");
			LocalTime time = LocalTime.of(8, 0);
			try {
				time = LocalTime.parse(appointment.getTime());
			} catch (Exception ignored) {
				// default
			}
			reminder.setScheduledFor(LocalDateTime.of(tomorrow, time.minusHours(2))
					.atZone(ZoneId.systemDefault()).toInstant());
			reminder.setStatus("PENDING");
			reminder.setConsentRecorded(true);
			smsReminderRepository.save(reminder);
			created++;
		}

		Instant now = Instant.now();
		int sent = 0;
		for (SmsReminder reminder : smsReminderRepository.findAll()) {
			if (!"PENDING".equalsIgnoreCase(reminder.getStatus())) {
				continue;
			}
			if (!Boolean.TRUE.equals(reminder.getConsentRecorded())) {
				continue;
			}
			if (reminder.getScheduledFor() != null && reminder.getScheduledFor().isAfter(now)) {
				continue;
			}
			reminder.setStatus("SENT");
			reminder.setSentAt(now);
			smsReminderRepository.save(reminder);
			sent++;
		}

		Map<String, Object> sms = new LinkedHashMap<>();
		sms.put("remindersCreated", created);
		sms.put("skipped", skipped);
		sms.put("remindersSent", sent);
		sms.put("targetDate", tomorrow.toString());
		return sms;
	}

	@Transactional
	public int scanOperationalAlerts() {
		int created = 0;
		Instant now = Instant.now();

		// Complaints SLA
		for (Complaint c : complaintRepository.findAll()) {
			String status = c.getStatus() == null ? "" : c.getStatus().toUpperCase(Locale.ROOT);
			if (status.contains("CLOSED") || status.contains("RESOLVED")) {
				continue;
			}
			if (c.getAcknowledgedAt() == null && c.getSlaAckDueAt() != null && c.getSlaAckDueAt().isBefore(now)) {
				created += upsert("admin", "HIGH", "Complaint acknowledgement overdue",
						"Complaint #" + c.getId() + " past 5-day ack SLA.",
						"complaints-sla", "complaint-ack-" + c.getId());
			}
			if (c.getResolvedAt() == null && c.getSlaResolveDueAt() != null && c.getSlaResolveDueAt().isBefore(now)) {
				created += upsert("admin", "CRITICAL", "Complaint resolution overdue",
						"Complaint #" + c.getId() + " past 25-day resolve SLA.",
						"complaints-sla", "complaint-resolve-" + c.getId());
			}
		}

		// Lab STAT / long pending / critical results
		for (LabOrder order : supportStore.all(LabOrder.class)) {
			String status = norm(order.status);
			if ("CANCELLED".equals(status)) {
				continue;
			}
			if ("RESULTED".equals(status)) {
				if (order.resultSummary != null
						&& order.resultSummary.toLowerCase(Locale.ROOT).contains("critical")) {
					created += upsert("doctor", "CRITICAL", "Critical lab result",
							order.patientName + ": " + order.resultSummary,
							"lab-critical", "lab-crit-" + order.id);
					created += upsert("nurse", "CRITICAL", "Critical lab result",
							order.patientName + ": " + order.resultSummary,
							"lab-critical", "lab-crit-n-" + order.id);
				}
				continue;
			}
			boolean stat = "STAT".equalsIgnoreCase(order.priority);
			boolean stale = order.orderedAt != null && order.orderedAt.isBefore(now.minus(6, ChronoUnit.HOURS));
			if (stat || stale) {
				String sev = stat ? "CRITICAL" : "HIGH";
				created += upsert("lab", sev, stat ? "STAT lab order pending" : "Lab TAT breach risk",
						order.testName + " for " + order.patientName + " (" + order.accessionNumber + ")",
						"lab-tat", "lab-" + order.id);
				if (stat) {
					created += upsert("doctor", "CRITICAL", "STAT lab result awaited",
							order.testName + " — " + order.patientName,
							"lab-tat", "lab-doc-" + order.id);
					created += upsert("nurse", "HIGH", "STAT lab pending for ward patient",
							order.testName + " — " + order.patientName,
							"lab-tat", "lab-nurse-" + order.id);
				}
			}
		}

		// Radiology STAT
		for (ImagingOrder order : supportStore.all(ImagingOrder.class)) {
			String status = norm(order.status);
			if ("REPORTED".equals(status) || "CANCELLED".equals(status)) {
				continue;
			}
			if ("STAT".equalsIgnoreCase(order.priority)) {
				created += upsert("radiology", "CRITICAL", "STAT imaging pending",
						order.studyName + " (" + order.modality + ") — " + order.patientName,
						"rad-tat", "rad-" + order.id);
				created += upsert("doctor", "HIGH", "STAT imaging awaited",
						order.studyName + " — " + order.patientName,
						"rad-tat", "rad-doc-" + order.id);
			}
		}

		// ED wait times (>90 min still waiting / in triage)
		for (EdVisit visit : supportStore.all(EdVisit.class)) {
			String status = norm(visit.status);
			if (!"WAITING".equals(status) && !"IN_TRIAGE".equals(status)) {
				continue;
			}
			if (visit.arrivedAt == null) {
				continue;
			}
			long minutes = ChronoUnit.MINUTES.between(visit.arrivedAt, now);
			boolean red = "RED".equalsIgnoreCase(visit.triageCategory) || "ORANGE".equalsIgnoreCase(visit.triageCategory);
			long limit = red ? 30 : 90;
			if (minutes >= limit) {
				created += upsert("casualty", red ? "CRITICAL" : "HIGH",
						"ED wait breach — " + (visit.triageCategory == null ? "untriaged" : visit.triageCategory),
						visit.patientName + " waiting " + minutes + " min (" + visit.ticketNumber + ")",
						"ed-wait", "ed-" + visit.id);
			}
		}

		// Nursing meds not given
		long heldOrMissed = supportStore.all(NursingMedAdmin.class).stream()
				.filter(m -> !"GIVEN".equalsIgnoreCase(m.status))
				.count();
		if (heldOrMissed > 0) {
			created += upsert("nurse", "HIGH", "Medication doses outstanding",
					heldOrMissed + " held/missed/due administrations need attention.",
					"nursing-meds", "nursing-meds-open");
			created += upsert("nurse_manager", "HIGH", "Medication doses outstanding",
					heldOrMissed + " held/missed/due administrations need attention.",
					"nursing-meds", "nursing-meds-mgr");
		}

		// Facilities PM due within 14 days or assets DOWN
		LocalDate horizon = LocalDate.now().plusDays(14);
		for (BiomedAsset asset : supportStore.all(BiomedAsset.class)) {
			if ("DOWN".equalsIgnoreCase(asset.status)) {
				created += upsert("facilities", "CRITICAL", "Asset down",
						asset.name + " (" + asset.assetTag + ") at " + asset.location,
						"facilities-down", "asset-down-" + asset.id);
			}
			if (asset.nextPmDate != null && !asset.nextPmDate.isAfter(horizon)) {
				created += upsert("facilities", "MEDIUM", "Planned maintenance due",
						asset.name + " PM due " + asset.nextPmDate,
						"facilities-pm", "asset-pm-" + asset.id);
			}
		}

		// Pharmacy low stock + queue backlog
		List<Medicine> medicines = medicineRepository.findAll();
		long low = medicines.stream()
				.filter(m -> m.getQuantity() != null && m.getReorderLevel() != null
						&& m.getQuantity() <= m.getReorderLevel())
				.count();
		if (low > 0) {
			created += upsert("pharmacy", "HIGH", "Pharmacy stock below reorder",
					low + " medicine(s) at or below reorder level — review replenishment.",
					"pharmacy-stock", "pharmacy-low-stock");
		}
		long waiting = ticketRepository.findAll().stream()
				.filter(t -> "WAITING".equalsIgnoreCase(t.getStatus()))
				.count();
		if (waiting >= 3) {
			created += upsert("pharmacy", "HIGH", "Dispense queue backlog",
					waiting + " patients waiting at pharmacy counter.",
					"pharmacy-queue", "pharmacy-queue-backlog");
		}

		return created;
	}

	public List<Map<String, Object>> alertsForRole(String role, boolean includeAcked) {
		String r = role == null ? "" : role.toLowerCase(Locale.ROOT);
		List<Map<String, Object>> out = new ArrayList<>();
		for (StaffAlert alert : supportStore.all(StaffAlert.class)) {
			if (!includeAcked && alert.acknowledged) {
				continue;
			}
			String audience = alert.audienceRole == null ? "" : alert.audienceRole.toLowerCase(Locale.ROOT);
			boolean match = audience.equals(r)
					|| "admin".equals(r)
					|| "super_admin".equals(r)
					|| ("nurse_manager".equals(r) && "nurse".equals(audience));
			if (!match) {
				continue;
			}
			out.add(mapAlert(alert));
		}
		return out;
	}

	@Transactional
	public Map<String, Object> acknowledge(Long id) {
		StaffAlert alert = supportStore.find(StaffAlert.class, id)
				.orElseThrow(() -> new za.gov.mpumalanga.rfh.exception.ApiException(404, "Alert not found"));
		alert.acknowledged = true;
		alert.acknowledgedAt = Instant.now();
		return mapAlert(supportStore.save(alert));
	}

	private int upsert(String audience, String severity, String title, String detail, String source, String fingerprint) {
		for (StaffAlert existing : supportStore.all(StaffAlert.class)) {
			if (fingerprint.equals(existing.fingerprint) && !existing.acknowledged) {
				return 0;
			}
		}
		StaffAlert alert = new StaffAlert();
		alert.audienceRole = audience;
		alert.severity = severity;
		alert.title = title;
		alert.detail = detail;
		alert.source = source;
		alert.fingerprint = fingerprint;
		alert.acknowledged = false;
		alert.createdAt = Instant.now();
		supportStore.save(alert);
		return 1;
	}

	private static Map<String, Object> mapAlert(StaffAlert alert) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", alert.id);
		map.put("audienceRole", alert.audienceRole);
		map.put("severity", alert.severity);
		map.put("title", alert.title);
		map.put("detail", alert.detail);
		map.put("source", alert.source);
		map.put("fingerprint", alert.fingerprint);
		map.put("acknowledged", alert.acknowledged);
		map.put("createdAt", alert.createdAt == null ? null : alert.createdAt.toString());
		map.put("acknowledgedAt", alert.acknowledgedAt == null ? null : alert.acknowledgedAt.toString());
		return map;
	}

	private static String norm(String value) {
		return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
	}
}

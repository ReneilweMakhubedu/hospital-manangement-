package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.Appointment;
import za.gov.mpumalanga.rfh.entity.SmsReminder;
import za.gov.mpumalanga.rfh.entity.User;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.AppointmentRepository;
import za.gov.mpumalanga.rfh.repository.SmsReminderRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/sms")
public class SmsController {

	private final SmsReminderRepository smsReminderRepository;
	private final AppointmentRepository appointmentRepository;
	private final UserRepository userRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public SmsController(
			SmsReminderRepository smsReminderRepository,
			AppointmentRepository appointmentRepository,
			UserRepository userRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.smsReminderRepository = smsReminderRepository;
		this.appointmentRepository = appointmentRepository;
		this.userRepository = userRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requireStaff();
		return smsReminderRepository.findTop100ByOrderByCreatedAtDesc().stream()
				.map(responseMapper::smsReminder)
				.toList();
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		securityUtils.requireStaff();
		List<SmsReminder> all = smsReminderRepository.findAll();
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("pending", all.stream().filter(r -> "PENDING".equalsIgnoreCase(r.getStatus())).count());
		map.put("sent", all.stream().filter(r -> "SENT".equalsIgnoreCase(r.getStatus())).count());
		map.put("failed", all.stream().filter(r -> "FAILED".equalsIgnoreCase(r.getStatus())).count());
		map.put("optedOut", all.stream().filter(r -> "OPTED_OUT".equalsIgnoreCase(r.getStatus())).count());
		return map;
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> schedule(@RequestBody Map<String, Object> body) {
		securityUtils.requireStaff();
		boolean consent = asBoolean(body.get("consentRecorded"), false);
		if (!consent) {
			throw new ApiException(400, "SMS consent must be recorded (consentRecorded=true)");
		}
		Long patientId = asLong(body.get("patientId"));
		if (patientId == null || userRepository.findByIdAndRole(patientId, "patient").isEmpty()) {
			throw new ApiException(400, "Select a valid patient");
		}
		String phoneNumber = requireText(str(body.get("phoneNumber")), "phoneNumber");
		String message = requireText(str(body.get("message")), "message");
		Instant scheduledFor = parseInstant(str(body.get("scheduledFor")), "scheduledFor");

		SmsReminder reminder = new SmsReminder();
		reminder.setAppointmentId(asLong(body.get("appointmentId")));
		reminder.setPatientId(patientId);
		reminder.setPhoneNumber(phoneNumber.trim());
		reminder.setMessage(message.trim());
		reminder.setScheduledFor(scheduledFor);
		reminder.setStatus("PENDING");
		reminder.setConsentRecorded(true);
		reminder = smsReminderRepository.save(reminder);
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.smsReminder(reminder));
	}

	@PostMapping("/{id}/send")
	public Map<String, Object> send(@PathVariable Long id) {
		securityUtils.requireStaff();
		SmsReminder reminder = smsReminderRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "SMS reminder not found"));
		if ("OPTED_OUT".equalsIgnoreCase(reminder.getStatus())) {
			throw new ApiException(400, "Cannot send — patient opted out");
		}
		if (!Boolean.TRUE.equals(reminder.getConsentRecorded())) {
			throw new ApiException(400, "Cannot send without recorded consent");
		}
		reminder.setStatus("SENT");
		reminder.setSentAt(Instant.now());
		return responseMapper.smsReminder(smsReminderRepository.save(reminder));
	}

	@PutMapping("/{id}/opt-out")
	public Map<String, Object> optOut(@PathVariable Long id) {
		securityUtils.requireStaff();
		SmsReminder reminder = smsReminderRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "SMS reminder not found"));
		reminder.setStatus("OPTED_OUT");
		return responseMapper.smsReminder(smsReminderRepository.save(reminder));
	}

	@PostMapping("/generate-for-tomorrow")
	public Map<String, Object> generateForTomorrow() {
		securityUtils.requireStaff();
		LocalDate tomorrow = LocalDate.now().plusDays(1);
		List<Appointment> appointments = appointmentRepository.findByDate(tomorrow.toString());
		int created = 0;
		int skippedNoConsent = 0;
		int skippedNoPhone = 0;
		int skippedExisting = 0;

		for (Appointment appointment : appointments) {
			if (appointment.getId() != null
					&& smsReminderRepository.existsByAppointmentIdAndStatusNot(appointment.getId(), "OPTED_OUT")) {
				skippedExisting++;
				continue;
			}
			User patient = userRepository.findById(appointment.getPatientId()).orElse(null);
			if (patient == null) {
				continue;
			}
			if (patient.getPhoneNumber() == null || patient.getPhoneNumber().isBlank()) {
				skippedNoPhone++;
				continue;
			}
			if (!Boolean.TRUE.equals(patient.getSmsConsent())) {
				skippedNoConsent++;
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
				// keep default
			}
			reminder.setScheduledFor(LocalDateTime.of(tomorrow, time.minusHours(2))
					.atZone(ZoneId.systemDefault()).toInstant());
			reminder.setStatus("PENDING");
			reminder.setConsentRecorded(true);
			smsReminderRepository.save(reminder);
			created++;
		}

		Map<String, Object> result = new LinkedHashMap<>();
		result.put("date", tomorrow.toString());
		result.put("created", created);
		result.put("skippedNoConsent", skippedNoConsent);
		result.put("skippedNoPhone", skippedNoPhone);
		result.put("skippedExisting", skippedExisting);
		return result;
	}

	private static Instant parseInstant(String value, String label) {
		if (value == null || value.isBlank()) {
			throw new ApiException(400, label + " is required");
		}
		try {
			return Instant.parse(value.trim());
		} catch (DateTimeParseException ex) {
			try {
				return LocalDateTime.parse(value.trim()).atZone(ZoneId.systemDefault()).toInstant();
			} catch (DateTimeParseException ex2) {
				throw new ApiException(400, label + " must be ISO-8601 datetime");
			}
		}
	}

	private static String requireText(String value, String label) {
		if (value == null || value.isBlank()) {
			throw new ApiException(400, label + " is required");
		}
		return value;
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}

	private static Long asLong(Object value) {
		if (value == null || String.valueOf(value).isBlank()) {
			return null;
		}
		if (value instanceof Number number) {
			return number.longValue();
		}
		try {
			return Long.parseLong(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private static boolean asBoolean(Object value, boolean fallback) {
		if (value == null) {
			return fallback;
		}
		if (value instanceof Boolean bool) {
			return bool;
		}
		String s = String.valueOf(value).trim().toLowerCase(Locale.ROOT);
		if ("true".equals(s) || "1".equals(s) || "yes".equals(s)) {
			return true;
		}
		if ("false".equals(s) || "0".equals(s) || "no".equals(s)) {
			return false;
		}
		return fallback;
	}
}

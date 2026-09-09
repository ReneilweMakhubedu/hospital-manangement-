package za.gov.mpumalanga.rfh.controller;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.SurgicalWaitlistEntry;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.SurgicalWaitlistRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/clinical/waitlist")
public class SurgicalWaitlistController {

	private static final Set<String> URGENCIES = Set.of("EMERGENCY", "URGENT", "ROUTINE");
	private static final Set<String> STATUSES = Set.of("WAITING", "SCHEDULED", "COMPLETED", "CANCELLED");

	private final SurgicalWaitlistRepository waitlistRepository;
	private final UserRepository userRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public SurgicalWaitlistController(
			SurgicalWaitlistRepository waitlistRepository,
			UserRepository userRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.waitlistRepository = waitlistRepository;
		this.userRepository = userRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requireStaff();
		return waitlistRepository.findAllByOrderByDecisionToTreatDateAsc().stream()
				.map(this::enriched)
				.toList();
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		securityUtils.requireStaff();
		List<SurgicalWaitlistEntry> all = waitlistRepository.findAll();
		long emergency = all.stream().filter(e -> "EMERGENCY".equalsIgnoreCase(e.getUrgency())).count();
		long urgent = all.stream().filter(e -> "URGENT".equalsIgnoreCase(e.getUrgency())).count();
		long routine = all.stream().filter(e -> "ROUTINE".equalsIgnoreCase(e.getUrgency())).count();
		long waiting = all.stream().filter(e -> "WAITING".equalsIgnoreCase(e.getStatus())).count();
		long overdue = all.stream().filter(SurgicalWaitlistEntry::isOverdue).count();

		Map<String, Object> byUrgency = new LinkedHashMap<>();
		byUrgency.put("EMERGENCY", emergency);
		byUrgency.put("URGENT", urgent);
		byUrgency.put("ROUTINE", routine);

		Map<String, Object> map = new LinkedHashMap<>();
		map.put("total", all.size());
		map.put("waiting", waiting);
		map.put("overdue", overdue);
		map.put("byUrgency", byUrgency);
		return map;
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireStaff();
		Long patientId = asLong(body.get("patientId"));
		String procedureName = str(body.get("procedureName"));
		String specialty = str(body.get("specialty"));
		String urgency = normalizeUrgency(str(body.get("urgency")));
		LocalDate decisionToTreatDate = parseDate(str(body.get("decisionToTreatDate")), "decisionToTreatDate");

		if (patientId == null || !isPresent(procedureName) || !isPresent(specialty) || urgency == null
				|| decisionToTreatDate == null) {
			throw new ApiException(400, "patientId, procedureName, specialty, urgency, and decisionToTreatDate are required");
		}
		if (userRepository.findByIdAndRole(patientId, "patient").isEmpty()) {
			throw new ApiException(400, "Select a valid patient");
		}

		Integer ttgDays = body.containsKey("ttgDays") ? asInt(body.get("ttgDays")) : null;
		if (ttgDays == null) {
			ttgDays = defaultTtgDays(urgency);
		}
		if (ttgDays < 0) {
			throw new ApiException(400, "ttgDays must be zero or more");
		}

		SurgicalWaitlistEntry entry = new SurgicalWaitlistEntry();
		entry.setPatientId(patientId);
		entry.setProcedureName(procedureName.trim());
		entry.setSpecialty(specialty.trim());
		entry.setUrgency(urgency);
		entry.setDecisionToTreatDate(decisionToTreatDate);
		entry.setTtgDays(ttgDays);
		entry.setStatus(normalizeStatus(str(body.get("status")), "WAITING"));
		entry.setScheduledDate(blankToNull(str(body.get("scheduledDate"))));
		entry.setNotes(blankToNull(str(body.get("notes"))));
		entry = waitlistRepository.save(entry);
		auditService.log(auth, "CREATE", "SurgicalWaitlist", entry.getId(),
				procedureName.trim() + " for patient " + patientId);
		return ResponseEntity.status(HttpStatus.CREATED).body(enriched(entry));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		securityUtils.requireStaff();
		SurgicalWaitlistEntry entry = waitlistRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Waitlist entry not found"));

		if (body.containsKey("patientId")) {
			Long patientId = asLong(body.get("patientId"));
			if (patientId == null || userRepository.findByIdAndRole(patientId, "patient").isEmpty()) {
				throw new ApiException(400, "Select a valid patient");
			}
			entry.setPatientId(patientId);
		}
		if (body.containsKey("procedureName")) {
			String procedureName = requireText(str(body.get("procedureName")), "procedureName");
			entry.setProcedureName(procedureName.trim());
		}
		if (body.containsKey("specialty")) {
			String specialty = requireText(str(body.get("specialty")), "specialty");
			entry.setSpecialty(specialty.trim());
		}
		if (body.containsKey("urgency")) {
			String urgency = normalizeUrgency(str(body.get("urgency")));
			if (urgency == null) {
				throw new ApiException(400, "urgency must be EMERGENCY, URGENT, or ROUTINE");
			}
			entry.setUrgency(urgency);
		}
		if (body.containsKey("decisionToTreatDate")) {
			LocalDate dtt = parseDate(str(body.get("decisionToTreatDate")), "decisionToTreatDate");
			if (dtt == null) {
				throw new ApiException(400, "decisionToTreatDate is required");
			}
			entry.setDecisionToTreatDate(dtt);
		}
		if (body.containsKey("ttgDays")) {
			Integer ttgDays = asInt(body.get("ttgDays"));
			if (ttgDays == null || ttgDays < 0) {
				throw new ApiException(400, "ttgDays must be zero or more");
			}
			entry.setTtgDays(ttgDays);
		}
		if (body.containsKey("status")) {
			entry.setStatus(normalizeStatus(str(body.get("status")), null));
		}
		if (body.containsKey("scheduledDate")) {
			entry.setScheduledDate(blankToNull(str(body.get("scheduledDate"))));
		}
		if (body.containsKey("notes")) {
			entry.setNotes(blankToNull(str(body.get("notes"))));
		}
		return enriched(waitlistRepository.save(entry));
	}

	@DeleteMapping("/{id}")
	public Map<String, String> delete(@PathVariable Long id) {
		securityUtils.requireAdmin();
		if (!waitlistRepository.existsById(id)) {
			throw new ApiException(404, "Waitlist entry not found");
		}
		waitlistRepository.deleteById(id);
		return Map.of("message", "Waitlist entry deleted");
	}

	private Map<String, Object> enriched(SurgicalWaitlistEntry entry) {
		Map<String, Object> map = responseMapper.waitlistEntry(entry);
		userRepository.findById(entry.getPatientId()).ifPresent(p ->
				map.put("patientName", p.getFirstName() + " " + p.getLastName()));
		LocalDate dtt = entry.getDecisionToTreatDate();
		long daysWaiting = dtt == null ? 0 : Math.max(0, ChronoUnit.DAYS.between(dtt, LocalDate.now()));
		map.put("daysWaiting", daysWaiting);
		LocalDate due = entry.dueDate();
		map.put("dueDate", due == null ? null : due.toString());
		map.put("overdue", entry.isOverdue());
		return map;
	}

	private static int defaultTtgDays(String urgency) {
		return switch (urgency) {
			case "EMERGENCY" -> 0;
			case "URGENT" -> 14;
			default -> 90;
		};
	}

	private static String normalizeUrgency(String value) {
		if (!isPresent(value)) {
			return null;
		}
		String normalized = value.trim().toUpperCase(Locale.ROOT);
		if (!URGENCIES.contains(normalized)) {
			throw new ApiException(400, "urgency must be EMERGENCY, URGENT, or ROUTINE");
		}
		return normalized;
	}

	private static String normalizeStatus(String value, String fallback) {
		if (!isPresent(value)) {
			if (fallback == null) {
				throw new ApiException(400, "status must be WAITING, SCHEDULED, COMPLETED, or CANCELLED");
			}
			return fallback;
		}
		String normalized = value.trim().toUpperCase(Locale.ROOT);
		if (!STATUSES.contains(normalized)) {
			throw new ApiException(400, "status must be WAITING, SCHEDULED, COMPLETED, or CANCELLED");
		}
		return normalized;
	}

	private static LocalDate parseDate(String value, String label) {
		if (!isPresent(value)) {
			return null;
		}
		try {
			return LocalDate.parse(value.trim());
		} catch (Exception ex) {
			throw new ApiException(400, label + " must be yyyy-MM-dd");
		}
	}

	private static String requireText(String value, String label) {
		if (!isPresent(value)) {
			throw new ApiException(400, label + " is required");
		}
		return value;
	}

	private static String blankToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}

	private static boolean isPresent(String value) {
		return value != null && !value.isBlank();
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}

	private static Long asLong(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof Number number) {
			return number.longValue();
		}
		try {
			return Long.parseLong(String.valueOf(value));
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private static Integer asInt(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof Number number) {
			double d = number.doubleValue();
			if (d != Math.rint(d)) {
				return null;
			}
			return number.intValue();
		}
		try {
			return Integer.valueOf(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			return null;
		}
	}
}

package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
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
import za.gov.mpumalanga.rfh.entity.Complaint;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.ComplaintRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintsController {

	private static final Set<String> CHANNELS = Set.of("WALK_IN", "PHONE", "EMAIL", "LETTER");
	private static final Set<String> STATUSES = Set.of(
			"OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED");
	private static final Set<String> OPEN_STATUSES = Set.of("OPEN", "ACKNOWLEDGED", "IN_PROGRESS");

	private final ComplaintRepository complaintRepository;
	private final UserRepository userRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public ComplaintsController(
			ComplaintRepository complaintRepository,
			UserRepository userRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.complaintRepository = complaintRepository;
		this.userRepository = userRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requireStaff();
		Instant now = Instant.now();
		return complaintRepository.findAllByOrderByLoggedAtDesc().stream()
				.map(c -> enriched(c, now))
				.toList();
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		securityUtils.requireStaff();
		Instant now = Instant.now();
		List<Complaint> all = complaintRepository.findAll();
		long open = all.stream().filter(c -> OPEN_STATUSES.contains(norm(c.getStatus()))).count();
		long ackOverdue = all.stream().filter(c -> isAckOverdue(c, now)).count();
		long resolveOverdue = all.stream().filter(c -> isResolveOverdue(c, now)).count();
		LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
		Instant monthStartInstant = monthStart.atStartOfDay().toInstant(ZoneOffset.UTC);
		long resolvedThisMonth = all.stream()
				.filter(c -> c.getResolvedAt() != null && !c.getResolvedAt().isBefore(monthStartInstant))
				.count();

		Map<String, Object> map = new LinkedHashMap<>();
		map.put("open", open);
		map.put("ackOverdue", ackOverdue);
		map.put("resolveOverdue", resolveOverdue);
		map.put("resolvedThisMonth", resolvedThisMonth);
		return map;
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireStaff();
		String complainantName = requireText(str(body.get("complainantName")), "complainantName");
		String channel = normalizeChannel(str(body.get("channel")));
		String subject = requireText(str(body.get("subject")), "subject");
		String description = requireText(str(body.get("description")), "description");

		Long patientId = asLong(body.get("patientId"));
		if (patientId != null && userRepository.findByIdAndRole(patientId, "patient").isEmpty()) {
			throw new ApiException(400, "Select a valid patient");
		}

		Instant loggedAt = Instant.now();
		Complaint complaint = new Complaint();
		complaint.setReferenceNumber(nextReference(loggedAt));
		complaint.setPatientId(patientId);
		complaint.setComplainantName(complainantName.trim());
		complaint.setChannel(channel);
		complaint.setSubject(subject.trim());
		complaint.setDescription(description.trim());
		complaint.setStatus("OPEN");
		complaint.setLoggedAt(loggedAt);
		complaint.setSlaAckDueAt(loggedAt.plus(5, ChronoUnit.DAYS));
		complaint.setSlaResolveDueAt(loggedAt.plus(25, ChronoUnit.DAYS));
		complaint.setAssignedTo(blankToNull(str(body.get("assignedTo"))));
		complaint = complaintRepository.save(complaint);

		auditService.log(auth, "CREATE", "Complaint", complaint.getId(),
				"Logged complaint " + complaint.getReferenceNumber());
		return ResponseEntity.status(HttpStatus.CREATED).body(enriched(complaint, Instant.now()));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		securityUtils.requireStaff();
		Complaint complaint = complaintRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Complaint not found"));

		if (body.containsKey("complainantName")) {
			complaint.setComplainantName(requireText(str(body.get("complainantName")), "complainantName").trim());
		}
		if (body.containsKey("channel")) {
			complaint.setChannel(normalizeChannel(str(body.get("channel"))));
		}
		if (body.containsKey("subject")) {
			complaint.setSubject(requireText(str(body.get("subject")), "subject").trim());
		}
		if (body.containsKey("description")) {
			complaint.setDescription(requireText(str(body.get("description")), "description").trim());
		}
		if (body.containsKey("assignedTo")) {
			complaint.setAssignedTo(blankToNull(str(body.get("assignedTo"))));
		}
		if (body.containsKey("resolutionNotes")) {
			complaint.setResolutionNotes(blankToNull(str(body.get("resolutionNotes"))));
		}
		if (body.containsKey("patientId")) {
			Long patientId = asLong(body.get("patientId"));
			if (patientId != null && userRepository.findByIdAndRole(patientId, "patient").isEmpty()) {
				throw new ApiException(400, "Select a valid patient");
			}
			complaint.setPatientId(patientId);
		}
		if (body.containsKey("status")) {
			applyStatus(complaint, normalizeStatus(str(body.get("status"))));
		}

		return enriched(complaintRepository.save(complaint), Instant.now());
	}

	@DeleteMapping("/{id}")
	public Map<String, String> delete(@PathVariable Long id) {
		securityUtils.requireAdmin();
		if (!complaintRepository.existsById(id)) {
			throw new ApiException(404, "Complaint not found");
		}
		complaintRepository.deleteById(id);
		return Map.of("message", "Complaint deleted");
	}

	private void applyStatus(Complaint complaint, String status) {
		Instant now = Instant.now();
		complaint.setStatus(status);
		if ("ACKNOWLEDGED".equals(status) && complaint.getAcknowledgedAt() == null) {
			complaint.setAcknowledgedAt(now);
		}
		if ("RESOLVED".equals(status) && complaint.getResolvedAt() == null) {
			complaint.setResolvedAt(now);
			if (complaint.getAcknowledgedAt() == null) {
				complaint.setAcknowledgedAt(now);
			}
		}
		if ("CLOSED".equals(status)) {
			if (complaint.getClosedAt() == null) {
				complaint.setClosedAt(now);
			}
			if (complaint.getResolvedAt() == null) {
				complaint.setResolvedAt(now);
			}
			if (complaint.getAcknowledgedAt() == null) {
				complaint.setAcknowledgedAt(now);
			}
		}
	}

	private String nextReference(Instant loggedAt) {
		String day = DateTimeFormatter.ofPattern("yyyyMMdd")
				.withZone(ZoneOffset.UTC)
				.format(loggedAt);
		String prefix = "CMP-" + day + "-";
		long seq = complaintRepository.countByReferenceNumberStartingWith(prefix) + 1;
		return prefix + String.format("%04d", seq);
	}

	private Map<String, Object> enriched(Complaint complaint, Instant now) {
		Map<String, Object> map = responseMapper.complaint(complaint);
		boolean ackOverdue = isAckOverdue(complaint, now);
		boolean resolveOverdue = isResolveOverdue(complaint, now);
		map.put("ackOverdue", ackOverdue);
		map.put("resolveOverdue", resolveOverdue);
		map.put("daysToAck", daysRemaining(complaint.getSlaAckDueAt(), now));
		map.put("daysToResolve", daysRemaining(complaint.getSlaResolveDueAt(), now));
		if (complaint.getPatientId() != null) {
			userRepository.findById(complaint.getPatientId()).ifPresent(p ->
					map.put("patientName", p.getFirstName() + " " + p.getLastName()));
		} else {
			map.put("patientName", null);
		}
		return map;
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

	private static long daysRemaining(Instant due, Instant now) {
		if (due == null) {
			return 0;
		}
		return ChronoUnit.DAYS.between(now, due);
	}

	private static String normalizeChannel(String value) {
		String normalized = requireText(value, "channel").trim().toUpperCase(Locale.ROOT);
		if (!CHANNELS.contains(normalized)) {
			throw new ApiException(400, "channel must be WALK_IN, PHONE, EMAIL, or LETTER");
		}
		return normalized;
	}

	private static String normalizeStatus(String value) {
		String normalized = requireText(value, "status").trim().toUpperCase(Locale.ROOT);
		if (!STATUSES.contains(normalized)) {
			throw new ApiException(400, "status must be OPEN, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, or CLOSED");
		}
		return normalized;
	}

	private static String norm(String status) {
		return status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
	}

	private static String requireText(String value, String label) {
		if (value == null || value.isBlank()) {
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
}

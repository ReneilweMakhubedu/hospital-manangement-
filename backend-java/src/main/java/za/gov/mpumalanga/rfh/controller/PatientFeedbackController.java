package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.Complaint;
import za.gov.mpumalanga.rfh.entity.PatientFeedback;
import za.gov.mpumalanga.rfh.entity.User;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.ComplaintRepository;
import za.gov.mpumalanga.rfh.repository.PatientFeedbackRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/patient/feedback")
public class PatientFeedbackController {

	private static final Set<String> TYPES = Set.of("RATING", "COMPLAINT", "SUGGESTION", "SURVEY");

	private final PatientFeedbackRepository patientFeedbackRepository;
	private final ComplaintRepository complaintRepository;
	private final UserRepository userRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public PatientFeedbackController(
			PatientFeedbackRepository patientFeedbackRepository,
			ComplaintRepository complaintRepository,
			UserRepository userRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.patientFeedbackRepository = patientFeedbackRepository;
		this.complaintRepository = complaintRepository;
		this.userRepository = userRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		AuthUser auth = securityUtils.requirePatient();
		return patientFeedbackRepository.findByPatientIdOrderByCreatedAtDesc(auth.id()).stream()
				.map(responseMapper::patientFeedback)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requirePatient();
		User patient = userRepository.findByIdAndRole(auth.id(), "patient")
				.orElseThrow(() -> new ApiException(404, "Patient not found"));

		String type = normalizeType(str(body.get("type")));
		String message = requireText(str(body.get("message")), "message");
		String subject = blankToNull(str(body.get("subject")));
		if (subject == null) {
			subject = type.equals("COMPLAINT") ? "Patient complaint" : "Patient feedback";
		}
		Integer rating = asInteger(body.get("rating"));
		if (rating != null && (rating < 1 || rating > 5)) {
			throw new ApiException(400, "rating must be between 1 and 5");
		}

		Instant now = Instant.now();
		String referenceNumber = nextReference(type, now);

		PatientFeedback feedback = new PatientFeedback();
		feedback.setPatientId(auth.id());
		feedback.setType(type);
		feedback.setRating(rating);
		feedback.setCategory(blankToNull(str(body.get("category"))));
		feedback.setSubject(subject);
		feedback.setMessage(message.trim());
		feedback.setStatus("OPEN");
		feedback.setReferenceNumber(referenceNumber);
		feedback = patientFeedbackRepository.save(feedback);

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("feedback", responseMapper.patientFeedback(feedback));

		if ("COMPLAINT".equals(type)) {
			Complaint complaint = new Complaint();
			complaint.setReferenceNumber(referenceNumber);
			complaint.setPatientId(auth.id());
			complaint.setComplainantName(patient.getFirstName() + " " + patient.getLastName());
			complaint.setChannel("EMAIL");
			complaint.setSubject(subject);
			complaint.setDescription(message.trim());
			complaint.setStatus("OPEN");
			complaint.setLoggedAt(now);
			complaint.setSlaAckDueAt(now.plus(5, ChronoUnit.DAYS));
			complaint.setSlaResolveDueAt(now.plus(25, ChronoUnit.DAYS));
			complaint.setAssignedTo("Patient Experience desk");
			complaint = complaintRepository.save(complaint);
			response.put("complaint", responseMapper.complaint(complaint));
			auditService.log(auth, "CREATE", "Complaint", complaint.getId(),
					"Patient logged complaint " + complaint.getReferenceNumber());
		}

		auditService.log(auth, "CREATE", "PatientFeedback", feedback.getId(),
				"Patient submitted feedback " + feedback.getReferenceNumber());
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	private String nextReference(String type, Instant now) {
		String day = DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneOffset.UTC).format(now);
		String prefix = "COMPLAINT".equals(type) ? ("CMP-" + day + "-") : ("FB-" + day + "-");
		long seq;
		if ("COMPLAINT".equals(type)) {
			seq = Math.max(
					complaintRepository.countByReferenceNumberStartingWith(prefix),
					patientFeedbackRepository.countByReferenceNumberStartingWith(prefix)) + 1;
		} else {
			seq = patientFeedbackRepository.countByReferenceNumberStartingWith(prefix) + 1;
		}
		return prefix + String.format("%04d", seq);
	}

	private static String normalizeType(String value) {
		String normalized = requireText(value, "type").trim().toUpperCase(Locale.ROOT);
		if (!TYPES.contains(normalized)) {
			throw new ApiException(400, "type must be RATING, COMPLAINT, SUGGESTION, or SURVEY");
		}
		return normalized;
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

	private static Integer asInteger(Object value) {
		if (value == null || String.valueOf(value).isBlank()) {
			return null;
		}
		if (value instanceof Number number) {
			return number.intValue();
		}
		try {
			return Integer.parseInt(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			throw new ApiException(400, "rating must be a number");
		}
	}
}

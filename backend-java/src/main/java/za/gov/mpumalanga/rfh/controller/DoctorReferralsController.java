package za.gov.mpumalanga.rfh.controller;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
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
import za.gov.mpumalanga.rfh.entity.ReferralLetter;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.ReferralLetterRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/doctor/referrals")
public class DoctorReferralsController {

	private static final Set<String> STATUSES = Set.of("DRAFT", "SENT", "ACKNOWLEDGED");

	private final ReferralLetterRepository referralLetterRepository;
	private final UserRepository userRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public DoctorReferralsController(
			ReferralLetterRepository referralLetterRepository,
			UserRepository userRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.referralLetterRepository = referralLetterRepository;
		this.userRepository = userRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		AuthUser auth = securityUtils.requireDoctor();
		return referralLetterRepository.findByDoctorIdOrderByCreatedAtDesc(auth.id()).stream()
				.map(responseMapper::referralLetter)
				.toList();
	}

	@GetMapping("/{id}")
	public Map<String, Object> get(@PathVariable Long id) {
		AuthUser auth = securityUtils.requireDoctor();
		ReferralLetter referral = referralLetterRepository.findByIdAndDoctorId(id, auth.id())
				.orElseThrow(() -> new ApiException(404, "Referral not found"));
		return responseMapper.referralLetter(referral);
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireDoctor();
		Long patientId = asLong(body.get("patientId"));
		if (patientId == null || userRepository.findByIdAndRole(patientId, "patient").isEmpty()) {
			throw new ApiException(400, "Select a valid patient");
		}
		String toFacility = str(body.get("toFacility"));
		String reason = str(body.get("reason"));
		if (toFacility == null || toFacility.isBlank() || reason == null || reason.isBlank()) {
			throw new ApiException(400, "toFacility and reason are required");
		}

		String status = str(body.get("status"));
		if (status == null || status.isBlank()) {
			status = "DRAFT";
		} else {
			status = requireEnum(status, STATUSES, "status");
		}

		ReferralLetter referral = new ReferralLetter();
		referral.setPatientId(patientId);
		referral.setDoctorId(auth.id());
		referral.setToFacility(toFacility.trim());
		referral.setToSpecialty(blankToNull(str(body.get("toSpecialty"))));
		String urgency = str(body.get("urgency"));
		referral.setUrgency(urgency == null || urgency.isBlank() ? "ROUTINE" : urgency.trim().toUpperCase(Locale.ROOT));
		referral.setReason(reason.trim());
		referral.setClinicalSummary(blankToNull(str(body.get("clinicalSummary"))));
		referral.setStatus(status);
		referral.setReferenceNumber(blankToNull(str(body.get("referenceNumber"))));
		if (referral.getReferenceNumber() == null) {
			referral.setReferenceNumber(nextReference());
		}
		referral = referralLetterRepository.save(referral);

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("message", "Referral created");
		response.put("referral", responseMapper.referralLetter(referral));
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireDoctor();
		ReferralLetter referral = referralLetterRepository.findByIdAndDoctorId(id, auth.id())
				.orElseThrow(() -> new ApiException(404, "Referral not found"));

		if (body.containsKey("toFacility")) {
			String toFacility = str(body.get("toFacility"));
			if (toFacility == null || toFacility.isBlank()) {
				throw new ApiException(400, "toFacility is required");
			}
			referral.setToFacility(toFacility.trim());
		}
		if (body.containsKey("toSpecialty")) {
			referral.setToSpecialty(blankToNull(str(body.get("toSpecialty"))));
		}
		if (body.containsKey("urgency")) {
			String urgency = str(body.get("urgency"));
			referral.setUrgency(urgency == null || urgency.isBlank() ? "ROUTINE" : urgency.trim().toUpperCase(Locale.ROOT));
		}
		if (body.containsKey("reason")) {
			String reason = str(body.get("reason"));
			if (reason == null || reason.isBlank()) {
				throw new ApiException(400, "reason is required");
			}
			referral.setReason(reason.trim());
		}
		if (body.containsKey("clinicalSummary")) {
			referral.setClinicalSummary(blankToNull(str(body.get("clinicalSummary"))));
		}
		if (body.containsKey("status")) {
			referral.setStatus(requireEnum(str(body.get("status")), STATUSES, "status"));
		}
		if (body.containsKey("referenceNumber")) {
			referral.setReferenceNumber(blankToNull(str(body.get("referenceNumber"))));
		}
		return responseMapper.referralLetter(referralLetterRepository.save(referral));
	}

	private String nextReference() {
		String day = LocalDate.now().toString().replace("-", "");
		long seq = referralLetterRepository.count() + 1;
		return "REF-" + day + "-" + String.format("%04d", seq);
	}

	private static String requireEnum(String value, Set<String> allowed, String field) {
		if (value == null || value.isBlank()) {
			throw new ApiException(400, field + " is required");
		}
		String normalized = value.trim().toUpperCase(Locale.ROOT);
		if (!allowed.contains(normalized)) {
			throw new ApiException(400, field + " must be one of " + allowed);
		}
		return normalized;
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
}

package za.gov.mpumalanga.rfh.controller;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.HrApplicant;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.HrApplicantRepository;
import za.gov.mpumalanga.rfh.repository.VacancyRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/hr/applicants")
public class HrApplicantsController {

	private static final Set<String> STATUSES = Set.of(
			"APPLIED", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED", "REJECTED", "TALENT_POOL");

	private final HrApplicantRepository applicantRepository;
	private final VacancyRepository vacancyRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public HrApplicantsController(
			HrApplicantRepository applicantRepository,
			VacancyRepository vacancyRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.applicantRepository = applicantRepository;
		this.vacancyRepository = vacancyRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping
	public List<Map<String, Object>> list(@RequestParam(required = false) String status) {
		securityUtils.requireHr();
		List<HrApplicant> applicants;
		if (status != null && !status.isBlank()) {
			applicants = applicantRepository.findByStatusIgnoreCaseOrderByAppliedAtDesc(status.trim());
		} else {
			applicants = applicantRepository.findAllByOrderByAppliedAtDesc();
		}
		return applicants.stream().map(responseMapper::hrApplicant).toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireHr();
		HrApplicant applicant = new HrApplicant();
		applyFields(applicant, body, true);
		applicant = applicantRepository.save(applicant);
		auditService.log(auth, "CREATE", "HrApplicant", applicant.getId(), applicant.getAppliedPost());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.hrApplicant(applicant));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireHr();
		HrApplicant applicant = applicantRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Applicant not found"));
		applyFields(applicant, body, false);
		applicant = applicantRepository.save(applicant);
		auditService.log(auth, "UPDATE", "HrApplicant", applicant.getId(), applicant.getStatus());
		return responseMapper.hrApplicant(applicant);
	}

	private void applyFields(HrApplicant applicant, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("vacancyId")) {
			Long vacancyId = asLong(body.get("vacancyId"));
			if (vacancyId != null && vacancyRepository.findById(vacancyId).isEmpty()) {
				throw new ApiException(400, "Select a valid vacancy");
			}
			applicant.setVacancyId(vacancyId);
		}
		if (creating || body.containsKey("firstName")) {
			applicant.setFirstName(requireText(str(body.get("firstName")), "firstName").trim());
		}
		if (creating || body.containsKey("lastName")) {
			applicant.setLastName(requireText(str(body.get("lastName")), "lastName").trim());
		}
		if (creating || body.containsKey("email")) {
			applicant.setEmail(requireText(str(body.get("email")), "email").trim().toLowerCase(Locale.ROOT));
		}
		if (creating || body.containsKey("phone")) {
			applicant.setPhone(blankToNull(str(body.get("phone"))));
		}
		if (creating || body.containsKey("appliedPost")) {
			applicant.setAppliedPost(requireText(str(body.get("appliedPost")), "appliedPost").trim());
		}
		if (creating || body.containsKey("specialty")) {
			applicant.setSpecialty(blankToNull(str(body.get("specialty"))));
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "APPLIED"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!STATUSES.contains(status)) {
				throw new ApiException(400,
						"status must be APPLIED, SHORTLISTED, INTERVIEW, OFFER, HIRED, REJECTED, or TALENT_POOL");
			}
			applicant.setStatus(status);
		}
		if (creating || body.containsKey("source")) {
			applicant.setSource(blankToNull(str(body.get("source"))));
		}
		if (creating || body.containsKey("notes")) {
			applicant.setNotes(blankToNull(str(body.get("notes"))));
		}
	}

	private static String requireText(String value, String label) {
		if (blank(value)) {
			throw new ApiException(400, label + " is required");
		}
		return value;
	}

	private static String blankToNull(String value) {
		return blank(value) ? null : value.trim();
	}

	private static boolean blank(String value) {
		return value == null || value.isBlank();
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

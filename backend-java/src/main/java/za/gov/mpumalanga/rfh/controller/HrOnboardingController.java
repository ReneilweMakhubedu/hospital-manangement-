package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
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
import za.gov.mpumalanga.rfh.entity.HrEmployee;
import za.gov.mpumalanga.rfh.entity.OnboardingChecklist;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.HrEmployeeRepository;
import za.gov.mpumalanga.rfh.repository.OnboardingChecklistRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/hr/onboarding")
public class HrOnboardingController {

	private static final Set<String> STATUSES = Set.of("IN_PROGRESS", "COMPLETED");

	private final OnboardingChecklistRepository onboardingRepository;
	private final HrEmployeeRepository employeeRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public HrOnboardingController(
			OnboardingChecklistRepository onboardingRepository,
			HrEmployeeRepository employeeRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.onboardingRepository = onboardingRepository;
		this.employeeRepository = employeeRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requireHr();
		return onboardingRepository.findAllByOrderByStartedAtDesc().stream()
				.map(responseMapper::onboardingChecklist)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireHr();
		OnboardingChecklist checklist = new OnboardingChecklist();
		applyFields(checklist, body, true);
		checklist = onboardingRepository.save(checklist);
		auditService.log(auth, "CREATE", "OnboardingChecklist", checklist.getId(), checklist.getEmployeeName());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.onboardingChecklist(checklist));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireHr();
		OnboardingChecklist checklist = onboardingRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Onboarding checklist not found"));
		applyFields(checklist, body, false);
		checklist = onboardingRepository.save(checklist);
		auditService.log(auth, "UPDATE", "OnboardingChecklist", checklist.getId(), checklist.getStatus());
		return responseMapper.onboardingChecklist(checklist);
	}

	private void applyFields(OnboardingChecklist checklist, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("employeeId")) {
			Long employeeId = asLong(body.get("employeeId"));
			HrEmployee employee = employeeRepository.findById(employeeId == null ? -1L : employeeId)
					.orElseThrow(() -> new ApiException(400, "Select a valid employee"));
			checklist.setEmployeeId(employee.getId());
			if (creating && blank(str(body.get("employeeName")))) {
				checklist.setEmployeeName(employee.getFirstName() + " " + employee.getLastName());
			}
			if (creating && blank(str(body.get("department")))) {
				checklist.setDepartment(employee.getDepartment());
			}
		}
		if (creating || body.containsKey("employeeName")) {
			if (!blank(str(body.get("employeeName")))) {
				checklist.setEmployeeName(str(body.get("employeeName")).trim());
			} else if (creating && blank(checklist.getEmployeeName())) {
				throw new ApiException(400, "employeeName is required");
			}
		}
		if (creating || body.containsKey("department")) {
			if (!blank(str(body.get("department")))) {
				checklist.setDepartment(str(body.get("department")).trim());
			} else if (creating && blank(checklist.getDepartment())) {
				throw new ApiException(400, "department is required");
			}
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "IN_PROGRESS"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!STATUSES.contains(status)) {
				throw new ApiException(400, "status must be IN_PROGRESS or COMPLETED");
			}
			checklist.setStatus(status);
			if ("COMPLETED".equals(status) && checklist.getCompletedAt() == null) {
				checklist.setCompletedAt(Instant.now());
			}
		}
		if (creating || body.containsKey("documentsCollected")) {
			checklist.setDocumentsCollected(asBoolean(body.get("documentsCollected"), false));
		}
		if (creating || body.containsKey("orientationScheduled")) {
			checklist.setOrientationScheduled(asBoolean(body.get("orientationScheduled"), false));
		}
		if (creating || body.containsKey("accountCreated")) {
			checklist.setAccountCreated(asBoolean(body.get("accountCreated"), false));
		}
		if (creating || body.containsKey("hpcsaVerified")) {
			checklist.setHpcsaVerified(asBoolean(body.get("hpcsaVerified"), false));
		}
		if (body.containsKey("completedAt")) {
			String completed = str(body.get("completedAt"));
			checklist.setCompletedAt(blank(completed) ? null : Instant.parse(completed.trim()));
		}
	}

	private static String requireText(String value, String label) {
		if (blank(value)) {
			throw new ApiException(400, label + " is required");
		}
		return value;
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

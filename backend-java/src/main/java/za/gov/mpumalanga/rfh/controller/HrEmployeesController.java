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
import za.gov.mpumalanga.rfh.entity.HrEmployee;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.HrEmployeeRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/hr/employees")
public class HrEmployeesController {

	private static final Set<String> CATEGORIES = Set.of(
			"PERMANENT", "CONTRACT", "INTERN", "COMMUNITY_SERVICE");
	private static final Set<String> STATUSES = Set.of(
			"ACTIVE", "ON_LEAVE", "RESIGNED", "RETIRED");

	private final HrEmployeeRepository employeeRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public HrEmployeesController(
			HrEmployeeRepository employeeRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.employeeRepository = employeeRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requireHr();
		return employeeRepository.findAllByOrderByLastNameAscFirstNameAsc().stream()
				.map(responseMapper::hrEmployee)
				.toList();
	}

	@GetMapping("/compliance")
	public List<Map<String, Object>> compliance() {
		securityUtils.requireHr();
		return employeeRepository.findAll().stream()
				.filter(HrEmployeesController::needsCompliance)
				.map(e -> {
					Map<String, Object> map = new LinkedHashMap<>(responseMapper.hrEmployee(e));
					map.put("complianceIssue", complianceIssue(e));
					return map;
				})
				.toList();
	}

	@GetMapping("/{id}")
	public Map<String, Object> get(@PathVariable Long id) {
		securityUtils.requireHr();
		HrEmployee employee = employeeRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Employee not found"));
		return responseMapper.hrEmployee(employee);
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireHr();
		HrEmployee employee = new HrEmployee();
		applyFields(employee, body, true);
		employee = employeeRepository.save(employee);
		auditService.log(auth, "CREATE", "HrEmployee", employee.getId(),
				employee.getFirstName() + " " + employee.getLastName());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.hrEmployee(employee));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireHr();
		HrEmployee employee = employeeRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Employee not found"));
		applyFields(employee, body, false);
		employee = employeeRepository.save(employee);
		auditService.log(auth, "UPDATE", "HrEmployee", employee.getId(),
				employee.getFirstName() + " " + employee.getLastName());
		return responseMapper.hrEmployee(employee);
	}

	private void applyFields(HrEmployee employee, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("employeeNumber")) {
			employee.setEmployeeNumber(requireText(str(body.get("employeeNumber")), "employeeNumber").trim());
		}
		if (creating || body.containsKey("firstName")) {
			employee.setFirstName(requireText(str(body.get("firstName")), "firstName").trim());
		}
		if (creating || body.containsKey("lastName")) {
			employee.setLastName(requireText(str(body.get("lastName")), "lastName").trim());
		}
		if (creating || body.containsKey("email")) {
			employee.setEmail(requireText(str(body.get("email")), "email").trim().toLowerCase(Locale.ROOT));
		}
		if (creating || body.containsKey("phone")) {
			employee.setPhone(blankToNull(str(body.get("phone"))));
		}
		if (creating || body.containsKey("department")) {
			employee.setDepartment(requireText(str(body.get("department")), "department").trim());
		}
		if (creating || body.containsKey("jobTitle")) {
			employee.setJobTitle(requireText(str(body.get("jobTitle")), "jobTitle").trim());
		}
		if (creating || body.containsKey("employmentCategory")) {
			String cat = creating && blank(str(body.get("employmentCategory")))
					? "PERMANENT"
					: requireText(str(body.get("employmentCategory")), "employmentCategory")
							.trim().toUpperCase(Locale.ROOT);
			if (!CATEGORIES.contains(cat)) {
				throw new ApiException(400, "employmentCategory must be PERMANENT, CONTRACT, INTERN, or COMMUNITY_SERVICE");
			}
			employee.setEmploymentCategory(cat);
		}
		if (creating || body.containsKey("startDate")) {
			employee.setStartDate(parseDate(str(body.get("startDate")), "startDate"));
		}
		if (creating || body.containsKey("endDate")) {
			String end = str(body.get("endDate"));
			employee.setEndDate(blank(end) ? null : parseDate(end, "endDate"));
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "ACTIVE"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!STATUSES.contains(status)) {
				throw new ApiException(400, "status must be ACTIVE, ON_LEAVE, RESIGNED, or RETIRED");
			}
			employee.setStatus(status);
		}
		if (creating || body.containsKey("hpcsaNumber")) {
			employee.setHpcsaNumber(blankToNull(str(body.get("hpcsaNumber"))));
		}
		if (creating || body.containsKey("qualifications")) {
			employee.setQualifications(blankToNull(str(body.get("qualifications"))));
		}
		if (creating || body.containsKey("managerName")) {
			employee.setManagerName(blankToNull(str(body.get("managerName"))));
		}
		if (creating || body.containsKey("yearsOfService")) {
			employee.setYearsOfService(asInt(body.get("yearsOfService")));
		}
		if (creating || body.containsKey("dateOfBirth")) {
			String dob = str(body.get("dateOfBirth"));
			employee.setDateOfBirth(blank(dob) ? null : parseDate(dob, "dateOfBirth"));
		}
	}

	private static boolean needsCompliance(HrEmployee e) {
		if (!"ACTIVE".equalsIgnoreCase(e.getStatus()) && !"ON_LEAVE".equalsIgnoreCase(e.getStatus())) {
			return false;
		}
		boolean missingQuals = e.getQualifications() == null || e.getQualifications().isBlank();
		String title = e.getJobTitle() == null ? "" : e.getJobTitle().toLowerCase(Locale.ROOT);
		boolean isClinicalTitle = title.contains("nurse")
				|| title.contains("doctor")
				|| title.contains("medical")
				|| title.contains("pharmacist")
				|| title.contains("radiographer")
				|| title.contains("clinician")
				|| title.contains("specialist");
		return (isClinicalTitle && (e.getHpcsaNumber() == null || e.getHpcsaNumber().isBlank())) || missingQuals;
	}

	private static String complianceIssue(HrEmployee e) {
		boolean missingHpcsa = e.getHpcsaNumber() == null || e.getHpcsaNumber().isBlank();
		boolean missingQuals = e.getQualifications() == null || e.getQualifications().isBlank();
		if (missingHpcsa && missingQuals) {
			return "Missing HPCSA number and qualifications";
		}
		if (missingHpcsa) {
			return "Missing HPCSA number";
		}
		return "Missing qualifications";
	}

	private static LocalDate parseDate(String value, String label) {
		if (blank(value)) {
			throw new ApiException(400, label + " is required");
		}
		try {
			return LocalDate.parse(value.trim());
		} catch (Exception ex) {
			throw new ApiException(400, label + " must be yyyy-MM-dd");
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

	private static Integer asInt(Object value) {
		if (value == null || String.valueOf(value).isBlank()) {
			return null;
		}
		if (value instanceof Number number) {
			return number.intValue();
		}
		try {
			return Integer.valueOf(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			return null;
		}
	}
}

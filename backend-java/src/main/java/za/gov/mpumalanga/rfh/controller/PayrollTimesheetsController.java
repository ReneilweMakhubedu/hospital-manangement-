package za.gov.mpumalanga.rfh.controller;

import java.time.LocalDate;
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
import za.gov.mpumalanga.rfh.entity.TimesheetEntry;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.TimesheetEntryRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.PayrollAuditService;

@RestController
@RequestMapping("/api/payroll/timesheets")
public class PayrollTimesheetsController {

	private static final Set<String> SHIFT_TYPES = Set.of("MORNING", "EVENING", "NIGHT", "EMERGENCY");
	private static final Set<String> STATUSES = Set.of("DRAFT", "SUBMITTED", "APPROVED", "REJECTED");

	private final TimesheetEntryRepository timesheetRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final PayrollAuditService payrollAuditService;

	public PayrollTimesheetsController(
			TimesheetEntryRepository timesheetRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			PayrollAuditService payrollAuditService) {
		this.timesheetRepository = timesheetRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.payrollAuditService = payrollAuditService;
	}

	@GetMapping
	public List<Map<String, Object>> list(
			@RequestParam(required = false) String department,
			@RequestParam(required = false) String status) {
		securityUtils.requirePayroll();
		boolean hasDept = department != null && !department.isBlank();
		boolean hasStatus = status != null && !status.isBlank();
		List<TimesheetEntry> entries;
		if (hasDept && hasStatus) {
			entries = timesheetRepository.findByDepartmentIgnoreCaseAndStatusIgnoreCaseOrderByCreatedAtDesc(
					department.trim(), status.trim());
		} else if (hasDept) {
			entries = timesheetRepository.findByDepartmentIgnoreCaseOrderByCreatedAtDesc(department.trim());
		} else if (hasStatus) {
			entries = timesheetRepository.findByStatusIgnoreCaseOrderByCreatedAtDesc(status.trim());
		} else {
			entries = timesheetRepository.findAllByOrderByCreatedAtDesc();
		}
		return entries.stream().map(responseMapper::timesheetEntry).toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requirePayroll();
		TimesheetEntry entry = new TimesheetEntry();
		applyFields(entry, body, true);
		entry = timesheetRepository.save(entry);
		payrollAuditService.log(auth, "CREATE", "TimesheetEntry", entry.getId(), entry.getEmployeeNumber());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.timesheetEntry(entry));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requirePayroll();
		TimesheetEntry entry = timesheetRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Timesheet entry not found"));
		applyFields(entry, body, false);
		entry = timesheetRepository.save(entry);
		payrollAuditService.log(auth, "UPDATE", "TimesheetEntry", entry.getId(), entry.getStatus());
		return responseMapper.timesheetEntry(entry);
	}

	private void applyFields(TimesheetEntry entry, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("employeeNumber")) {
			entry.setEmployeeNumber(requireText(str(body.get("employeeNumber")), "employeeNumber").trim());
		}
		if (creating || body.containsKey("employeeName")) {
			entry.setEmployeeName(requireText(str(body.get("employeeName")), "employeeName").trim());
		}
		if (creating || body.containsKey("department")) {
			entry.setDepartment(requireText(str(body.get("department")), "department").trim());
		}
		if (creating || body.containsKey("workDate")) {
			entry.setWorkDate(parseDate(str(body.get("workDate")), creating ? LocalDate.now() : entry.getWorkDate()));
		}
		if (creating || body.containsKey("shiftType")) {
			String shift = creating && blank(str(body.get("shiftType")))
					? "MORNING"
					: requireText(str(body.get("shiftType")), "shiftType").trim().toUpperCase(Locale.ROOT);
			if (!SHIFT_TYPES.contains(shift)) {
				throw new ApiException(400, "shiftType must be MORNING, EVENING, NIGHT, or EMERGENCY");
			}
			entry.setShiftType(shift);
		}
		if (creating || body.containsKey("hoursWorked")) {
			entry.setHoursWorked(asDouble(body.get("hoursWorked"), 8.0));
		}
		if (creating || body.containsKey("overtimeHours")) {
			entry.setOvertimeHours(asDouble(body.get("overtimeHours"), 0.0));
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "DRAFT"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!STATUSES.contains(status)) {
				throw new ApiException(400, "status must be DRAFT, SUBMITTED, APPROVED, or REJECTED");
			}
			entry.setStatus(status);
		}
	}

	private static LocalDate parseDate(String value, LocalDate fallback) {
		if (value == null || value.isBlank()) {
			return fallback;
		}
		try {
			return LocalDate.parse(value.trim());
		} catch (Exception ex) {
			throw new ApiException(400, "workDate must be yyyy-MM-dd");
		}
	}

	private static Double asDouble(Object value, double fallback) {
		if (value == null || String.valueOf(value).isBlank()) {
			return fallback;
		}
		if (value instanceof Number number) {
			return number.doubleValue();
		}
		try {
			return Double.parseDouble(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			throw new ApiException(400, "Invalid hours value");
		}
	}

	private static boolean blank(String value) {
		return value == null || value.isBlank();
	}

	private static String requireText(String value, String label) {
		if (blank(value)) {
			throw new ApiException(400, label + " is required");
		}
		return value;
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}
}

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
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.LeaveRequest;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.HrEmployeeRepository;
import za.gov.mpumalanga.rfh.repository.LeaveRequestRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/hr/leave")
public class HrLeaveController {

	private static final Set<String> LEAVE_TYPES = Set.of("ANNUAL", "SICK", "FAMILY", "STUDY", "UNPAID");
	private static final Set<String> STATUSES = Set.of("PENDING", "APPROVED", "REJECTED", "CANCELLED");

	private final LeaveRequestRepository leaveRequestRepository;
	private final HrEmployeeRepository employeeRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public HrLeaveController(
			LeaveRequestRepository leaveRequestRepository,
			HrEmployeeRepository employeeRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.leaveRequestRepository = leaveRequestRepository;
		this.employeeRepository = employeeRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requireHr();
		return leaveRequestRepository.findAllByOrderByCreatedAtDesc().stream()
				.map(responseMapper::leaveRequest)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireHr();
		LeaveRequest leave = new LeaveRequest();
		applyFields(leave, body, true);
		leave = leaveRequestRepository.save(leave);
		auditService.log(auth, "CREATE", "LeaveRequest", leave.getId(), leave.getLeaveType());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.leaveRequest(leave));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireHr();
		LeaveRequest leave = leaveRequestRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Leave request not found"));
		applyFields(leave, body, false);
		leave = leaveRequestRepository.save(leave);
		auditService.log(auth, "UPDATE", "LeaveRequest", leave.getId(), leave.getStatus());
		return responseMapper.leaveRequest(leave);
	}

	private void applyFields(LeaveRequest leave, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("employeeId")) {
			Long employeeId = asLong(body.get("employeeId"));
			if (employeeId == null || employeeRepository.findById(employeeId).isEmpty()) {
				throw new ApiException(400, "Select a valid employee");
			}
			leave.setEmployeeId(employeeId);
		}
		if (creating || body.containsKey("leaveType")) {
			String type = creating && blank(str(body.get("leaveType")))
					? "ANNUAL"
					: requireText(str(body.get("leaveType")), "leaveType").trim().toUpperCase(Locale.ROOT);
			if (!LEAVE_TYPES.contains(type)) {
				throw new ApiException(400, "leaveType must be ANNUAL, SICK, FAMILY, STUDY, or UNPAID");
			}
			leave.setLeaveType(type);
		}
		if (creating || body.containsKey("startDate")) {
			leave.setStartDate(parseDate(str(body.get("startDate")), "startDate"));
		}
		if (creating || body.containsKey("endDate")) {
			leave.setEndDate(parseDate(str(body.get("endDate")), "endDate"));
		}
		if (creating || body.containsKey("days")) {
			Integer days = asInt(body.get("days"));
			if (days == null || days < 1) {
				throw new ApiException(400, "days must be 1 or more");
			}
			leave.setDays(days);
		}
		if (creating || body.containsKey("reason")) {
			leave.setReason(blankToNull(str(body.get("reason"))));
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "PENDING"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!STATUSES.contains(status)) {
				throw new ApiException(400, "status must be PENDING, APPROVED, REJECTED, or CANCELLED");
			}
			leave.setStatus(status);
		}
		if (creating || body.containsKey("approverName")) {
			leave.setApproverName(blankToNull(str(body.get("approverName"))));
		}
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

	private static Integer asInt(Object value) {
		if (value == null) {
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

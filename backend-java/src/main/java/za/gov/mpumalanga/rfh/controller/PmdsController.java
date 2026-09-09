package za.gov.mpumalanga.rfh.controller;

import java.time.LocalDate;
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
import za.gov.mpumalanga.rfh.entity.InternAssignment;
import za.gov.mpumalanga.rfh.entity.PmdsCycle;
import za.gov.mpumalanga.rfh.entity.SupervisionLog;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.InternAssignmentRepository;
import za.gov.mpumalanga.rfh.repository.PmdsCycleRepository;
import za.gov.mpumalanga.rfh.repository.SupervisionLogRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/hr/pmds")
public class PmdsController {

	private static final Set<String> PROGRAMMES = Set.of("INTERN", "COMMUNITY_SERVICE");
	private static final Set<String> ASSIGNMENT_STATUSES = Set.of("ACTIVE", "COMPLETED");
	private static final Set<String> PMDS_STATUSES = Set.of("NOT_STARTED", "IN_PROGRESS", "COMPLETE");

	private final InternAssignmentRepository assignmentRepository;
	private final SupervisionLogRepository supervisionLogRepository;
	private final PmdsCycleRepository pmdsCycleRepository;
	private final DoctorRepository doctorRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public PmdsController(
			InternAssignmentRepository assignmentRepository,
			SupervisionLogRepository supervisionLogRepository,
			PmdsCycleRepository pmdsCycleRepository,
			DoctorRepository doctorRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.assignmentRepository = assignmentRepository;
		this.supervisionLogRepository = supervisionLogRepository;
		this.pmdsCycleRepository = pmdsCycleRepository;
		this.doctorRepository = doctorRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		securityUtils.requireRoles("admin", "hr", "doctor");
		LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
		LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);
		long activeInterns = assignmentRepository.findAll().stream()
				.filter(a -> "ACTIVE".equalsIgnoreCase(a.getStatus()))
				.count();
		long pendingPmds = pmdsCycleRepository.findAll().stream()
				.filter(c -> !"COMPLETE".equalsIgnoreCase(c.getStatus()))
				.count();
		long supervisionSessionsThisMonth = supervisionLogRepository
				.findBySessionDateBetween(monthStart, monthEnd)
				.size();

		Map<String, Object> map = new LinkedHashMap<>();
		map.put("activeInterns", activeInterns);
		map.put("pendingPmds", pendingPmds);
		map.put("supervisionSessionsThisMonth", supervisionSessionsThisMonth);
		return map;
	}

	@GetMapping("/assignments")
	public List<Map<String, Object>> listAssignments() {
		securityUtils.requireRoles("admin", "hr", "doctor");
		return assignmentRepository.findAllByOrderByStartDateDesc().stream()
				.map(responseMapper::internAssignment)
				.toList();
	}

	@PostMapping("/assignments")
	public ResponseEntity<Map<String, Object>> createAssignment(@RequestBody Map<String, Object> body) {
		securityUtils.requireHr();
		InternAssignment assignment = new InternAssignment();
		applyAssignment(assignment, body, true);
		assignment = assignmentRepository.save(assignment);
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.internAssignment(assignment));
	}

	@PutMapping("/assignments/{id}")
	public Map<String, Object> updateAssignment(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		securityUtils.requireHr();
		InternAssignment assignment = assignmentRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Assignment not found"));
		applyAssignment(assignment, body, false);
		return responseMapper.internAssignment(assignmentRepository.save(assignment));
	}

	@DeleteMapping("/assignments/{id}")
	public Map<String, String> deleteAssignment(@PathVariable Long id) {
		securityUtils.requireHr();
		if (!assignmentRepository.existsById(id)) {
			throw new ApiException(404, "Assignment not found");
		}
		assignmentRepository.deleteById(id);
		return Map.of("message", "Assignment deleted");
	}

	@GetMapping("/logs")
	public List<Map<String, Object>> listLogs() {
		securityUtils.requireRoles("admin", "hr", "doctor");
		return supervisionLogRepository.findAllByOrderBySessionDateDesc().stream()
				.map(responseMapper::supervisionLog)
				.toList();
	}

	@PostMapping("/logs")
	public ResponseEntity<Map<String, Object>> createLog(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireRoles("admin", "hr", "doctor");
		Long assignmentId = asLong(body.get("assignmentId"));
		InternAssignment assignment = assignmentRepository.findById(assignmentId == null ? -1L : assignmentId)
				.orElseThrow(() -> new ApiException(400, "Select a valid assignment"));
		if ("doctor".equalsIgnoreCase(auth.role())
				&& !auth.id().equals(assignment.getSupervisorDoctorId())) {
			throw new ApiException(403, "Doctors may only log supervision for their assignments");
		}

		SupervisionLog log = new SupervisionLog();
		log.setAssignmentId(assignment.getId());
		log.setSessionDate(parseDate(str(body.get("sessionDate")), "sessionDate"));
		log.setTopic(requireText(str(body.get("topic")), "topic").trim());
		Double hours = asDouble(body.get("hours"));
		if (hours == null || hours < 0) {
			throw new ApiException(400, "hours must be zero or more");
		}
		log.setHours(hours);
		log.setSupervisorNotes(blankToNull(str(body.get("supervisorNotes"))));
		log.setInternAcknowledged(asBoolean(body.get("internAcknowledged"), false));
		log = supervisionLogRepository.save(log);
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.supervisionLog(log));
	}

	@PutMapping("/logs/{id}")
	public Map<String, Object> updateLog(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireRoles("admin", "hr", "doctor");
		SupervisionLog log = supervisionLogRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Supervision log not found"));
		InternAssignment assignment = assignmentRepository.findById(log.getAssignmentId())
				.orElseThrow(() -> new ApiException(404, "Assignment not found"));
		if ("doctor".equalsIgnoreCase(auth.role())
				&& !auth.id().equals(assignment.getSupervisorDoctorId())) {
			throw new ApiException(403, "Doctors may only update their supervision logs");
		}
		if (body.containsKey("sessionDate")) {
			log.setSessionDate(parseDate(str(body.get("sessionDate")), "sessionDate"));
		}
		if (body.containsKey("topic")) {
			log.setTopic(requireText(str(body.get("topic")), "topic").trim());
		}
		if (body.containsKey("hours")) {
			Double hours = asDouble(body.get("hours"));
			if (hours == null || hours < 0) {
				throw new ApiException(400, "hours must be zero or more");
			}
			log.setHours(hours);
		}
		if (body.containsKey("supervisorNotes")) {
			log.setSupervisorNotes(blankToNull(str(body.get("supervisorNotes"))));
		}
		if (body.containsKey("internAcknowledged")) {
			log.setInternAcknowledged(asBoolean(body.get("internAcknowledged"), false));
		}
		return responseMapper.supervisionLog(supervisionLogRepository.save(log));
	}

	@DeleteMapping("/logs/{id}")
	public Map<String, String> deleteLog(@PathVariable Long id) {
		securityUtils.requireHr();
		if (!supervisionLogRepository.existsById(id)) {
			throw new ApiException(404, "Supervision log not found");
		}
		supervisionLogRepository.deleteById(id);
		return Map.of("message", "Supervision log deleted");
	}

	@GetMapping("/cycles")
	public List<Map<String, Object>> listCycles() {
		securityUtils.requireRoles("admin", "hr", "doctor");
		return pmdsCycleRepository.findAllByOrderByCycleYearDescStaffNameAsc().stream()
				.map(responseMapper::pmdsCycle)
				.toList();
	}

	@PostMapping("/cycles")
	public ResponseEntity<Map<String, Object>> createCycle(@RequestBody Map<String, Object> body) {
		securityUtils.requireHr();
		PmdsCycle cycle = new PmdsCycle();
		applyCycle(cycle, body, true);
		cycle = pmdsCycleRepository.save(cycle);
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.pmdsCycle(cycle));
	}

	@PutMapping("/cycles/{id}")
	public Map<String, Object> updateCycle(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		securityUtils.requireHr();
		PmdsCycle cycle = pmdsCycleRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "PMDS cycle not found"));
		applyCycle(cycle, body, false);
		return responseMapper.pmdsCycle(pmdsCycleRepository.save(cycle));
	}

	@DeleteMapping("/cycles/{id}")
	public Map<String, String> deleteCycle(@PathVariable Long id) {
		securityUtils.requireHr();
		if (!pmdsCycleRepository.existsById(id)) {
			throw new ApiException(404, "PMDS cycle not found");
		}
		pmdsCycleRepository.deleteById(id);
		return Map.of("message", "PMDS cycle deleted");
	}

	private void applyAssignment(InternAssignment assignment, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("internName")) {
			assignment.setInternName(requireText(str(body.get("internName")), "internName").trim());
		}
		if (creating || body.containsKey("internEmail")) {
			assignment.setInternEmail(requireText(str(body.get("internEmail")), "internEmail").trim().toLowerCase());
		}
		if (creating || body.containsKey("programme")) {
			String programme = requireText(str(body.get("programme")), "programme").trim().toUpperCase(Locale.ROOT);
			if (!PROGRAMMES.contains(programme)) {
				throw new ApiException(400, "programme must be INTERN or COMMUNITY_SERVICE");
			}
			assignment.setProgramme(programme);
		}
		if (creating || body.containsKey("department")) {
			assignment.setDepartment(requireText(str(body.get("department")), "department").trim());
		}
		if (creating || body.containsKey("supervisorDoctorId")) {
			Long doctorId = asLong(body.get("supervisorDoctorId"));
			if (doctorId == null || doctorRepository.findById(doctorId).isEmpty()) {
				throw new ApiException(400, "Select a valid supervisor doctor");
			}
			assignment.setSupervisorDoctorId(doctorId);
		}
		if (creating || body.containsKey("startDate")) {
			assignment.setStartDate(parseDate(str(body.get("startDate")), "startDate"));
		}
		if (creating || body.containsKey("endDate")) {
			String end = str(body.get("endDate"));
			assignment.setEndDate(end == null || end.isBlank() ? null : parseDate(end, "endDate"));
		}
		if (creating || body.containsKey("status")) {
			String status = creating && (str(body.get("status")) == null || str(body.get("status")).isBlank())
					? "ACTIVE"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!ASSIGNMENT_STATUSES.contains(status)) {
				throw new ApiException(400, "status must be ACTIVE or COMPLETED");
			}
			assignment.setStatus(status);
		}
	}

	private void applyCycle(PmdsCycle cycle, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("staffName")) {
			cycle.setStaffName(requireText(str(body.get("staffName")), "staffName").trim());
		}
		if (creating || body.containsKey("staffRole")) {
			cycle.setStaffRole(requireText(str(body.get("staffRole")), "staffRole").trim());
		}
		if (creating || body.containsKey("cycleYear")) {
			Integer year = asInt(body.get("cycleYear"));
			if (year == null || year < 2000) {
				throw new ApiException(400, "cycleYear is required");
			}
			cycle.setCycleYear(year);
		}
		if (creating || body.containsKey("agreementSigned")) {
			cycle.setAgreementSigned(asBoolean(body.get("agreementSigned"), false));
		}
		if (creating || body.containsKey("midYearReview")) {
			cycle.setMidYearReview(asBoolean(body.get("midYearReview"), false));
		}
		if (creating || body.containsKey("annualReview")) {
			cycle.setAnnualReview(asBoolean(body.get("annualReview"), false));
		}
		if (creating || body.containsKey("status")) {
			String status = creating && (str(body.get("status")) == null || str(body.get("status")).isBlank())
					? "NOT_STARTED"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!PMDS_STATUSES.contains(status)) {
				throw new ApiException(400, "status must be NOT_STARTED, IN_PROGRESS, or COMPLETE");
			}
			cycle.setStatus(status);
		}
		if (creating || body.containsKey("notes")) {
			cycle.setNotes(blankToNull(str(body.get("notes"))));
		}
	}

	private static LocalDate parseDate(String value, String label) {
		if (value == null || value.isBlank()) {
			throw new ApiException(400, label + " is required");
		}
		try {
			return LocalDate.parse(value.trim());
		} catch (Exception ex) {
			throw new ApiException(400, label + " must be yyyy-MM-dd");
		}
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

	private static Double asDouble(Object value) {
		if (value == null || String.valueOf(value).isBlank()) {
			return null;
		}
		if (value instanceof Number number) {
			return number.doubleValue();
		}
		try {
			return Double.valueOf(String.valueOf(value).trim());
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

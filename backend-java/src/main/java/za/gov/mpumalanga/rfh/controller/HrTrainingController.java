package za.gov.mpumalanga.rfh.controller;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
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
import za.gov.mpumalanga.rfh.entity.TrainingCourse;
import za.gov.mpumalanga.rfh.entity.TrainingEnrolment;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.HrEmployeeRepository;
import za.gov.mpumalanga.rfh.repository.TrainingCourseRepository;
import za.gov.mpumalanga.rfh.repository.TrainingEnrolmentRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/hr/training")
public class HrTrainingController {

	private static final Set<String> CATEGORIES = Set.of("CPD", "MANDATORY", "LEADERSHIP", "CLINICAL", "WSP");
	private static final Set<String> COURSE_STATUSES = Set.of("PLANNED", "OPEN", "COMPLETED", "CANCELLED");
	private static final Set<String> ATTENDANCE = Set.of("REGISTERED", "ATTENDED", "ABSENT");

	private final TrainingCourseRepository courseRepository;
	private final TrainingEnrolmentRepository enrolmentRepository;
	private final HrEmployeeRepository employeeRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public HrTrainingController(
			TrainingCourseRepository courseRepository,
			TrainingEnrolmentRepository enrolmentRepository,
			HrEmployeeRepository employeeRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.courseRepository = courseRepository;
		this.enrolmentRepository = enrolmentRepository;
		this.employeeRepository = employeeRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping("/courses")
	public List<Map<String, Object>> listCourses() {
		securityUtils.requireHr();
		return courseRepository.findAllByOrderByScheduledDateAscTitleAsc().stream()
				.map(responseMapper::trainingCourse)
				.toList();
	}

	@PostMapping("/courses")
	public ResponseEntity<Map<String, Object>> createCourse(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireHr();
		TrainingCourse course = new TrainingCourse();
		applyCourse(course, body, true);
		course = courseRepository.save(course);
		auditService.log(auth, "CREATE", "TrainingCourse", course.getId(), course.getTitle());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.trainingCourse(course));
	}

	@PutMapping("/courses/{id}")
	public Map<String, Object> updateCourse(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireHr();
		TrainingCourse course = courseRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Training course not found"));
		applyCourse(course, body, false);
		course = courseRepository.save(course);
		auditService.log(auth, "UPDATE", "TrainingCourse", course.getId(), course.getTitle());
		return responseMapper.trainingCourse(course);
	}

	@GetMapping("/enrolments")
	public List<Map<String, Object>> listEnrolments() {
		securityUtils.requireHr();
		return enrolmentRepository.findAllByOrderByCreatedAtDesc().stream()
				.map(responseMapper::trainingEnrolment)
				.toList();
	}

	@PostMapping("/enrolments")
	public ResponseEntity<Map<String, Object>> createEnrolment(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireHr();
		TrainingEnrolment enrolment = new TrainingEnrolment();
		applyEnrolment(enrolment, body, true);
		enrolment = enrolmentRepository.save(enrolment);
		auditService.log(auth, "CREATE", "TrainingEnrolment", enrolment.getId(), enrolment.getEmployeeName());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.trainingEnrolment(enrolment));
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		securityUtils.requireHr();
		List<TrainingCourse> courses = courseRepository.findAll();
		List<TrainingEnrolment> enrolments = enrolmentRepository.findAll();

		Map<String, Long> byCategory = courses.stream()
				.collect(Collectors.groupingBy(
						c -> c.getCategory() == null ? "UNSPECIFIED" : c.getCategory(),
						Collectors.counting()));

		long wspTotal = courses.stream().filter(c -> "WSP".equalsIgnoreCase(c.getCategory())).count();
		long wspCompleted = courses.stream()
				.filter(c -> "WSP".equalsIgnoreCase(c.getCategory()) && "COMPLETED".equalsIgnoreCase(c.getStatus()))
				.count();
		double wspProgressHint = wspTotal == 0 ? 0.0 : Math.round((wspCompleted * 100.0) / wspTotal * 10.0) / 10.0;

		long attended = enrolments.stream().filter(e -> "ATTENDED".equalsIgnoreCase(e.getAttendance())).count();
		double trainingCompletionHint = enrolments.isEmpty()
				? 0.0
				: Math.round((attended * 100.0) / enrolments.size() * 10.0) / 10.0;

		Map<String, Object> map = new LinkedHashMap<>();
		map.put("courseCount", courses.size());
		map.put("enrolmentCount", enrolments.size());
		map.put("openCount", courses.stream().filter(c -> "OPEN".equalsIgnoreCase(c.getStatus())).count());
		map.put("byCategory", byCategory);
		map.put("wspProgressHint", wspProgressHint);
		map.put("trainingCompletionHint", trainingCompletionHint);
		return map;
	}

	private void applyCourse(TrainingCourse course, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("title")) {
			course.setTitle(requireText(str(body.get("title")), "title").trim());
		}
		if (creating || body.containsKey("category")) {
			String category = creating && blank(str(body.get("category")))
					? "MANDATORY"
					: requireText(str(body.get("category")), "category").trim().toUpperCase(Locale.ROOT);
			if (!CATEGORIES.contains(category)) {
				throw new ApiException(400, "category must be CPD, MANDATORY, LEADERSHIP, CLINICAL, or WSP");
			}
			course.setCategory(category);
		}
		if (creating || body.containsKey("provider")) {
			course.setProvider(blankToNull(str(body.get("provider"))));
		}
		if (creating || body.containsKey("scheduledDate")) {
			String date = str(body.get("scheduledDate"));
			course.setScheduledDate(blank(date) ? null : parseDate(date, "scheduledDate"));
		}
		if (creating || body.containsKey("cpdPoints")) {
			course.setCpdPoints(asInt(body.get("cpdPoints")));
		}
		if (creating || body.containsKey("capacity")) {
			course.setCapacity(asInt(body.get("capacity")));
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "PLANNED"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!COURSE_STATUSES.contains(status)) {
				throw new ApiException(400, "status must be PLANNED, OPEN, COMPLETED, or CANCELLED");
			}
			course.setStatus(status);
		}
	}

	private void applyEnrolment(TrainingEnrolment enrolment, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("courseId")) {
			Long courseId = asLong(body.get("courseId"));
			if (courseId == null || courseRepository.findById(courseId).isEmpty()) {
				throw new ApiException(400, "Select a valid course");
			}
			enrolment.setCourseId(courseId);
		}
		if (creating || body.containsKey("employeeId")) {
			Long employeeId = asLong(body.get("employeeId"));
			HrEmployee employee = employeeRepository.findById(employeeId == null ? -1L : employeeId)
					.orElseThrow(() -> new ApiException(400, "Select a valid employee"));
			enrolment.setEmployeeId(employee.getId());
			if (creating && blank(str(body.get("employeeName")))) {
				enrolment.setEmployeeName(employee.getFirstName() + " " + employee.getLastName());
			}
		}
		if (creating || body.containsKey("employeeName")) {
			if (!blank(str(body.get("employeeName")))) {
				enrolment.setEmployeeName(str(body.get("employeeName")).trim());
			} else if (creating && blank(enrolment.getEmployeeName())) {
				throw new ApiException(400, "employeeName is required");
			}
		}
		if (creating || body.containsKey("attendance")) {
			String attendance = creating && blank(str(body.get("attendance")))
					? "REGISTERED"
					: requireText(str(body.get("attendance")), "attendance").trim().toUpperCase(Locale.ROOT);
			if (!ATTENDANCE.contains(attendance)) {
				throw new ApiException(400, "attendance must be REGISTERED, ATTENDED, or ABSENT");
			}
			enrolment.setAttendance(attendance);
		}
		if (creating || body.containsKey("evaluationScore")) {
			enrolment.setEvaluationScore(asInt(body.get("evaluationScore")));
		}
	}

	private static LocalDate parseDate(String value, String label) {
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

package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
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
import za.gov.mpumalanga.rfh.entity.Vacancy;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.VacancyRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/hr/vacancies")
public class HrVacanciesController {

	private static final Set<String> ALLOWED_STATUSES = Set.of(
			"OPEN", "IN_RECRUITMENT", "FILLED", "ON_HOLD");

	private final VacancyRepository vacancyRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public HrVacanciesController(
			VacancyRepository vacancyRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.vacancyRepository = vacancyRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requireRoles("admin", "hr", "doctor");
		return vacancyRepository.findAllByOrderByCriticalDescTitleAsc().stream()
				.map(responseMapper::vacancy)
				.toList();
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		securityUtils.requireRoles("admin", "hr", "doctor");
		List<Vacancy> all = vacancyRepository.findAll();
		int total = all.size();
		long open = all.stream().filter(v -> isOpenStatus(v.getStatus())).count();
		long critical = all.stream().filter(v -> Boolean.TRUE.equals(v.getCritical())).count();
		int approved = all.stream().mapToInt(v -> safeInt(v.getPostsApproved())).sum();
		int filled = all.stream().mapToInt(v -> safeInt(v.getPostsFilled())).sum();
		double vacancyRateApprox = approved == 0 ? 0.0 : ((approved - filled) * 100.0) / approved;

		Map<String, Object> map = new LinkedHashMap<>();
		map.put("total", total);
		map.put("open", open);
		map.put("critical", critical);
		map.put("vacancyRateApprox", Math.round(vacancyRateApprox * 10.0) / 10.0);
		map.put("postsApproved", approved);
		map.put("postsFilled", filled);
		map.put("gap", Math.max(0, approved - filled));
		return map;
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireHr();
		Vacancy vacancy = new Vacancy();
		applyFields(vacancy, body, true);
		vacancy = vacancyRepository.save(vacancy);
		auditService.log(auth, "CREATE", "Vacancy", vacancy.getId(), vacancy.getTitle());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.vacancy(vacancy));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireHr();
		Vacancy vacancy = vacancyRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Vacancy not found"));
		applyFields(vacancy, body, false);
		vacancy = vacancyRepository.save(vacancy);
		auditService.log(auth, "UPDATE", "Vacancy", vacancy.getId(), vacancy.getTitle());
		return responseMapper.vacancy(vacancy);
	}

	@DeleteMapping("/{id}")
	public Map<String, String> delete(@PathVariable Long id) {
		var auth = securityUtils.requireHr();
		if (!vacancyRepository.existsById(id)) {
			throw new ApiException(404, "Vacancy not found");
		}
		vacancyRepository.deleteById(id);
		auditService.log(auth, "DELETE", "Vacancy", id, "Vacancy deleted");
		return Map.of("message", "Vacancy deleted");
	}

	private void applyFields(Vacancy vacancy, Map<String, Object> body, boolean creating) {
		String title = creating || body.containsKey("title")
				? requireText(str(body.get("title")), "Title")
				: vacancy.getTitle();
		String department = creating || body.containsKey("department")
				? requireText(str(body.get("department")), "Department")
				: vacancy.getDepartment();

		Integer postsApproved = creating || body.containsKey("postsApproved")
				? requireNonNegative(asInt(body.get("postsApproved")), "postsApproved")
				: vacancy.getPostsApproved();
		Integer postsFilled = creating
				? (body.containsKey("postsFilled")
						? requireNonNegative(asInt(body.get("postsFilled")), "postsFilled")
						: 0)
				: (body.containsKey("postsFilled")
						? requireNonNegative(asInt(body.get("postsFilled")), "postsFilled")
						: vacancy.getPostsFilled());

		String status = creating
				? (isPresent(str(body.get("status"))) ? str(body.get("status")) : "OPEN")
				: (body.containsKey("status")
						? requireText(str(body.get("status")), "Status")
						: vacancy.getStatus());
		status = status.trim().toUpperCase(Locale.ROOT);
		if (!ALLOWED_STATUSES.contains(status)) {
			throw new ApiException(400, "Status must be OPEN, IN_RECRUITMENT, FILLED, or ON_HOLD");
		}
		if (postsFilled > postsApproved) {
			throw new ApiException(400, "postsFilled cannot exceed postsApproved");
		}

		vacancy.setTitle(title.trim());
		vacancy.setDepartment(department.trim());
		if (creating || body.containsKey("specialty")) {
			vacancy.setSpecialty(blankToNull(str(body.get("specialty"))));
		}
		if (creating || body.containsKey("gradeOrRank")) {
			vacancy.setGradeOrRank(blankToNull(str(body.get("gradeOrRank"))));
		}
		vacancy.setPostsApproved(postsApproved);
		vacancy.setPostsFilled(postsFilled);
		if (creating || body.containsKey("critical")) {
			vacancy.setCritical(asBoolean(body.get("critical"), false));
		}
		vacancy.setStatus(status);
		if (creating || body.containsKey("notes")) {
			vacancy.setNotes(blankToNull(str(body.get("notes"))));
		}
		if (creating || body.containsKey("advertisedAt")) {
			vacancy.setAdvertisedAt(parseInstant(str(body.get("advertisedAt"))));
		} else if (creating && vacancy.getAdvertisedAt() == null) {
			vacancy.setAdvertisedAt(Instant.now());
		}
		if (creating || body.containsKey("filledAt")) {
			vacancy.setFilledAt(parseInstant(str(body.get("filledAt"))));
		}
	}

	private static Instant parseInstant(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		try {
			return Instant.parse(value.trim());
		} catch (Exception ex) {
			throw new ApiException(400, "Instant fields must be ISO-8601");
		}
	}

	private static String requireText(String value, String label) {
		if (!isPresent(value)) {
			throw new ApiException(400, label + " is required");
		}
		return value;
	}

	private static Integer requireNonNegative(Integer value, String label) {
		if (value == null || value < 0) {
			throw new ApiException(400, label + " must be zero or more");
		}
		return value;
	}

	private static boolean isOpenStatus(String status) {
		if (status == null) {
			return false;
		}
		String normalized = status.trim().toUpperCase(Locale.ROOT);
		return "OPEN".equals(normalized) || "IN_RECRUITMENT".equals(normalized);
	}

	private static int safeInt(Integer value) {
		return value == null ? 0 : value;
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

	private static boolean isPresent(String value) {
		return value != null && !value.isBlank();
	}

	private static Integer asInt(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof Number number) {
			double d = number.doubleValue();
			if (d != Math.rint(d)) {
				return null;
			}
			return number.intValue();
		}
		try {
			return Integer.valueOf(String.valueOf(value).trim());
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

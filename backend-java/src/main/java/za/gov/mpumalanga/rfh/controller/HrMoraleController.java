package za.gov.mpumalanga.rfh.controller;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.MoralePulse;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.MoralePulseRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/hr/morale")
public class HrMoraleController {

	private final MoralePulseRepository moralePulseRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public HrMoraleController(
			MoralePulseRepository moralePulseRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.moralePulseRepository = moralePulseRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requireHr();
		return moralePulseRepository.findAllByOrderByCapturedAtDesc().stream()
				.map(responseMapper::moralePulse)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireHr();
		MoralePulse pulse = new MoralePulse();
		pulse.setPeriodLabel(requireText(str(body.get("periodLabel")), "periodLabel").trim());
		Double score = asDouble(body.get("score"));
		if (score == null || score < 1.0 || score > 5.0) {
			throw new ApiException(400, "score must be between 1 and 5");
		}
		pulse.setScore(score);
		Integer responses = asInt(body.get("responseCount"));
		pulse.setResponseCount(responses == null ? 0 : Math.max(0, responses));
		pulse.setDepartment(blankToNull(str(body.get("department"))));
		pulse.setNotes(blankToNull(str(body.get("notes"))));
		pulse = moralePulseRepository.save(pulse);
		auditService.log(auth, "CREATE", "MoralePulse", pulse.getId(), pulse.getPeriodLabel());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.moralePulse(pulse));
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
}

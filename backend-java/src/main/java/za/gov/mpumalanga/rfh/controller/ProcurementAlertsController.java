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
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.ProcRiskAlert;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.ProcRiskAlertRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/procurement/alerts")
public class ProcurementAlertsController {

	private static final Set<String> SEVERITIES = Set.of("LOW", "MEDIUM", "HIGH", "CRITICAL");
	private static final Set<String> STATUSES = Set.of("OPEN", "ACKNOWLEDGED", "RESOLVED");

	private final ProcRiskAlertRepository riskAlertRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public ProcurementAlertsController(
			ProcRiskAlertRepository riskAlertRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.riskAlertRepository = riskAlertRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requireProcurement();
		return riskAlertRepository.findAllByOrderByCreatedAtDesc().stream()
				.map(responseMapper::procRiskAlert)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		securityUtils.requireProcurement();
		ProcRiskAlert alert = new ProcRiskAlert();
		applyFields(alert, body, true);
		alert = riskAlertRepository.save(alert);
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.procRiskAlert(alert));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		securityUtils.requireProcurement();
		ProcRiskAlert alert = riskAlertRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Risk alert not found"));
		applyFields(alert, body, false);
		alert = riskAlertRepository.save(alert);
		return responseMapper.procRiskAlert(alert);
	}

	private void applyFields(ProcRiskAlert alert, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("severity")) {
			String severity = creating && blank(str(body.get("severity")))
					? "MEDIUM"
					: requireText(str(body.get("severity")), "severity").trim().toUpperCase(Locale.ROOT);
			if (!SEVERITIES.contains(severity)) {
				throw new ApiException(400, "Invalid severity");
			}
			alert.setSeverity(severity);
		}
		if (creating || body.containsKey("title")) {
			alert.setTitle(requireText(str(body.get("title")), "title").trim());
		}
		if (creating || body.containsKey("detail")) {
			alert.setDetail(blankToNull(str(body.get("detail"))));
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "OPEN"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!STATUSES.contains(status)) {
				throw new ApiException(400, "Invalid alert status");
			}
			alert.setStatus(status);
		}
		if (creating || body.containsKey("relatedEntityType")) {
			alert.setRelatedEntityType(blankToNull(str(body.get("relatedEntityType"))));
		}
		if (creating || body.containsKey("relatedEntityId")) {
			alert.setRelatedEntityId(asLong(body.get("relatedEntityId")));
		}
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
			throw new ApiException(400, "Invalid relatedEntityId");
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

	private static String blankToNull(String value) {
		return blank(value) ? null : value.trim();
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}
}

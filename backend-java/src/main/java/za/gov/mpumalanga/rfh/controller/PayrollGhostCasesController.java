package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
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
import za.gov.mpumalanga.rfh.entity.GhostWorkerCase;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.GhostWorkerCaseRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.PayrollAuditService;

@RestController
@RequestMapping("/api/payroll/ghost-cases")
public class PayrollGhostCasesController {

	private static final Set<String> STATUSES = Set.of("FLAGGED", "UNDER_REVIEW", "CLEARED", "CONFIRMED", "ESCALATED");
	private static final Set<String> OPEN_STATUSES = Set.of("FLAGGED", "UNDER_REVIEW", "ESCALATED");

	private final GhostWorkerCaseRepository ghostCaseRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final PayrollAuditService payrollAuditService;

	public PayrollGhostCasesController(
			GhostWorkerCaseRepository ghostCaseRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			PayrollAuditService payrollAuditService) {
		this.ghostCaseRepository = ghostCaseRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.payrollAuditService = payrollAuditService;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requirePayroll();
		return ghostCaseRepository.findAllByOrderByFlaggedAtDesc().stream()
				.map(responseMapper::ghostWorkerCase)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requirePayroll();
		GhostWorkerCase item = new GhostWorkerCase();
		applyFields(item, body, true);
		item = ghostCaseRepository.save(item);
		payrollAuditService.log(auth, "CREATE", "GhostWorkerCase", item.getId(), item.getReferenceNumber());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.ghostWorkerCase(item));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requirePayroll();
		GhostWorkerCase item = ghostCaseRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Ghost worker case not found"));
		applyFields(item, body, false);
		item = ghostCaseRepository.save(item);
		payrollAuditService.log(auth, "UPDATE", "GhostWorkerCase", item.getId(), item.getStatus());
		return responseMapper.ghostWorkerCase(item);
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		securityUtils.requirePayroll();
		int openCount = 0;
		int clearedCount = 0;
		int confirmedCount = 0;
		BigDecimal amountAtRisk = BigDecimal.ZERO;
		for (GhostWorkerCase item : ghostCaseRepository.findAll()) {
			String status = item.getStatus() == null ? "" : item.getStatus().toUpperCase(Locale.ROOT);
			BigDecimal amount = item.getAmountAtRisk() == null ? BigDecimal.ZERO : item.getAmountAtRisk();
			if (OPEN_STATUSES.contains(status)) {
				openCount++;
				amountAtRisk = amountAtRisk.add(amount);
			} else if ("CLEARED".equals(status)) {
				clearedCount++;
			} else if ("CONFIRMED".equals(status)) {
				confirmedCount++;
			}
		}
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("openCount", openCount);
		result.put("clearedCount", clearedCount);
		result.put("confirmedCount", confirmedCount);
		result.put("amountAtRisk", amountAtRisk);
		result.put("totalCases", ghostCaseRepository.count());
		return result;
	}

	private void applyFields(GhostWorkerCase item, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("referenceNumber")) {
			String ref = blankToNull(str(body.get("referenceNumber")));
			if (ref == null && creating) {
				ref = "GW-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
			}
			if (ref != null) {
				item.setReferenceNumber(ref);
			}
		}
		if (creating || body.containsKey("employeeNumber")) {
			item.setEmployeeNumber(requireText(str(body.get("employeeNumber")), "employeeNumber").trim());
		}
		if (creating || body.containsKey("employeeName")) {
			item.setEmployeeName(requireText(str(body.get("employeeName")), "employeeName").trim());
		}
		if (creating || body.containsKey("department")) {
			item.setDepartment(requireText(str(body.get("department")), "department").trim());
		}
		if (creating || body.containsKey("riskScore")) {
			item.setRiskScore(asInt(body.get("riskScore"), creating ? 50 : item.getRiskScore()));
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "FLAGGED"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!STATUSES.contains(status)) {
				throw new ApiException(400, "Invalid ghost-case status");
			}
			item.setStatus(status);
		}
		if (creating || body.containsKey("amountAtRisk")) {
			item.setAmountAtRisk(asBigDecimal(body.get("amountAtRisk"), BigDecimal.ZERO));
		}
		if (creating || body.containsKey("notes")) {
			item.setNotes(blankToNull(str(body.get("notes"))));
		}
	}

	private static BigDecimal asBigDecimal(Object value, BigDecimal fallback) {
		if (value == null || String.valueOf(value).isBlank()) {
			return fallback;
		}
		try {
			return new BigDecimal(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			throw new ApiException(400, "Invalid decimal amount");
		}
	}

	private static Integer asInt(Object value, Integer fallback) {
		if (value == null || String.valueOf(value).isBlank()) {
			return fallback == null ? 0 : fallback;
		}
		if (value instanceof Number number) {
			return number.intValue();
		}
		try {
			return Integer.parseInt(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			throw new ApiException(400, "Invalid riskScore");
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

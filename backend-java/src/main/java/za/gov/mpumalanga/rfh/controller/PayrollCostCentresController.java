package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
import za.gov.mpumalanga.rfh.entity.PayrollCostCentre;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.PayrollCostCentreRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.PayrollAuditService;

@RestController
@RequestMapping("/api/payroll/cost-centres")
public class PayrollCostCentresController {

	private final PayrollCostCentreRepository costCentreRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final PayrollAuditService payrollAuditService;

	public PayrollCostCentresController(
			PayrollCostCentreRepository costCentreRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			PayrollAuditService payrollAuditService) {
		this.costCentreRepository = costCentreRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.payrollAuditService = payrollAuditService;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requirePayroll();
		return costCentreRepository.findAllByOrderByDepartmentAsc().stream()
				.map(responseMapper::payrollCostCentre)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requirePayroll();
		PayrollCostCentre centre = new PayrollCostCentre();
		applyFields(centre, body, true);
		centre = costCentreRepository.save(centre);
		payrollAuditService.log(auth, "CREATE", "PayrollCostCentre", centre.getId(), centre.getCode());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.payrollCostCentre(centre));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requirePayroll();
		PayrollCostCentre centre = costCentreRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Payroll cost centre not found"));
		applyFields(centre, body, false);
		centre = costCentreRepository.save(centre);
		payrollAuditService.log(auth, "UPDATE", "PayrollCostCentre", centre.getId(), centre.getDepartment());
		return responseMapper.payrollCostCentre(centre);
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		securityUtils.requirePayroll();
		BigDecimal budgetTotal = BigDecimal.ZERO;
		BigDecimal actualTotal = BigDecimal.ZERO;
		BigDecimal overtimeTotal = BigDecimal.ZERO;
		int fteApproved = 0;
		int fteFilled = 0;
		for (PayrollCostCentre c : costCentreRepository.findAll()) {
			budgetTotal = budgetTotal.add(nz(c.getBudgetAnnual()));
			actualTotal = actualTotal.add(nz(c.getActualYtd()));
			overtimeTotal = overtimeTotal.add(nz(c.getOvertimeYtd()));
			fteApproved += c.getFteApproved() == null ? 0 : c.getFteApproved();
			fteFilled += c.getFteFilled() == null ? 0 : c.getFteFilled();
		}
		BigDecimal variance = actualTotal.subtract(budgetTotal);
		double variancePercent = budgetTotal.compareTo(BigDecimal.ZERO) == 0
				? 0.0
				: variance.multiply(BigDecimal.valueOf(100)).divide(budgetTotal, 1, RoundingMode.HALF_UP).doubleValue();
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("budgetTotal", budgetTotal);
		result.put("actualTotal", actualTotal);
		result.put("overtimeTotal", overtimeTotal);
		result.put("variance", variance);
		result.put("variancePercent", variancePercent);
		result.put("fteApproved", fteApproved);
		result.put("fteFilled", fteFilled);
		result.put("vacancyGap", Math.max(0, fteApproved - fteFilled));
		result.put("centres", costCentreRepository.findAllByOrderByDepartmentAsc().stream()
				.map(responseMapper::payrollCostCentre)
				.toList());
		return result;
	}

	private void applyFields(PayrollCostCentre centre, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("code")) {
			centre.setCode(requireText(str(body.get("code")), "code").trim().toUpperCase(Locale.ROOT));
		}
		if (creating || body.containsKey("department")) {
			centre.setDepartment(requireText(str(body.get("department")), "department").trim());
		}
		if (creating || body.containsKey("budgetAnnual")) {
			centre.setBudgetAnnual(asBigDecimal(body.get("budgetAnnual"), BigDecimal.ZERO));
		}
		if (creating || body.containsKey("actualYtd")) {
			centre.setActualYtd(asBigDecimal(body.get("actualYtd"), BigDecimal.ZERO));
		}
		if (creating || body.containsKey("fteApproved")) {
			centre.setFteApproved(asInt(body.get("fteApproved"), 0));
		}
		if (creating || body.containsKey("fteFilled")) {
			centre.setFteFilled(asInt(body.get("fteFilled"), 0));
		}
		if (creating || body.containsKey("overtimeYtd")) {
			centre.setOvertimeYtd(asBigDecimal(body.get("overtimeYtd"), BigDecimal.ZERO));
		}
	}

	private static BigDecimal nz(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
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

	private static Integer asInt(Object value, int fallback) {
		if (value == null || String.valueOf(value).isBlank()) {
			return fallback;
		}
		if (value instanceof Number number) {
			return number.intValue();
		}
		try {
			return Integer.parseInt(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			throw new ApiException(400, "Invalid integer value");
		}
	}

	private static String requireText(String value, String label) {
		if (value == null || value.isBlank()) {
			throw new ApiException(400, label + " is required");
		}
		return value;
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}
}

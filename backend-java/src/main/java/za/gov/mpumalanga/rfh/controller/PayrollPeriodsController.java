package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
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
import za.gov.mpumalanga.rfh.entity.PayrollPeriod;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.PayrollPeriodRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.PayrollAuditService;

@RestController
@RequestMapping("/api/payroll/periods")
public class PayrollPeriodsController {

	private static final Set<String> STATUSES = Set.of("OPEN", "PROCESSING", "CLOSED", "PAID");

	private final PayrollPeriodRepository periodRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final PayrollAuditService payrollAuditService;

	public PayrollPeriodsController(
			PayrollPeriodRepository periodRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			PayrollAuditService payrollAuditService) {
		this.periodRepository = periodRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.payrollAuditService = payrollAuditService;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requirePayroll();
		return periodRepository.findAllByOrderByCreatedAtDesc().stream()
				.map(responseMapper::payrollPeriod)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requirePayroll();
		PayrollPeriod period = new PayrollPeriod();
		applyFields(period, body, true);
		period = periodRepository.save(period);
		payrollAuditService.log(auth, "CREATE", "PayrollPeriod", period.getId(), period.getPeriodLabel());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.payrollPeriod(period));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requirePayroll();
		PayrollPeriod period = periodRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Payroll period not found"));
		applyFields(period, body, false);
		period = periodRepository.save(period);
		payrollAuditService.log(auth, "UPDATE", "PayrollPeriod", period.getId(), period.getStatus());
		return responseMapper.payrollPeriod(period);
	}

	private void applyFields(PayrollPeriod period, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("periodLabel")) {
			period.setPeriodLabel(requireText(str(body.get("periodLabel")), "periodLabel").trim());
		}
		if (creating || body.containsKey("startDate")) {
			period.setStartDate(parseDate(str(body.get("startDate")), creating ? LocalDate.now().withDayOfMonth(1) : period.getStartDate()));
		}
		if (creating || body.containsKey("endDate")) {
			period.setEndDate(parseDate(str(body.get("endDate")),
					creating ? LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth()) : period.getEndDate()));
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "OPEN"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!STATUSES.contains(status)) {
				throw new ApiException(400, "status must be OPEN, PROCESSING, CLOSED, or PAID");
			}
			period.setStatus(status);
		}
		if (creating || body.containsKey("budgetAmount")) {
			period.setBudgetAmount(asBigDecimal(body.get("budgetAmount"), BigDecimal.ZERO));
		}
		if (creating || body.containsKey("actualAmount")) {
			period.setActualAmount(asBigDecimal(body.get("actualAmount"), BigDecimal.ZERO));
		}
		if (creating || body.containsKey("overtimeAmount")) {
			period.setOvertimeAmount(asBigDecimal(body.get("overtimeAmount"), BigDecimal.ZERO));
		}
	}

	private static LocalDate parseDate(String value, LocalDate fallback) {
		if (value == null || value.isBlank()) {
			return fallback;
		}
		try {
			return LocalDate.parse(value.trim());
		} catch (Exception ex) {
			throw new ApiException(400, "Date must be yyyy-MM-dd");
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

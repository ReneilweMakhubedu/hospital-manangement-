package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
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
import za.gov.mpumalanga.rfh.entity.BudgetForecast;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.BudgetForecastRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/finance/budget")
public class FinanceBudgetController {

	private final BudgetForecastRepository budgetForecastRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public FinanceBudgetController(
			BudgetForecastRepository budgetForecastRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.budgetForecastRepository = budgetForecastRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping("/forecasts")
	public List<Map<String, Object>> listForecasts() {
		securityUtils.requireFinance();
		return budgetForecastRepository.findAllByOrderByUpdatedAtDesc().stream()
				.map(responseMapper::budgetForecast)
				.toList();
	}

	@PostMapping("/forecasts")
	public ResponseEntity<Map<String, Object>> createForecast(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireFinance();
		BudgetForecast forecast = new BudgetForecast();
		applyForecast(forecast, body, true);
		forecast = budgetForecastRepository.save(forecast);
		auditService.log(auth, "CREATE", "BudgetForecast", forecast.getId(), forecast.getDepartment());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.budgetForecast(forecast));
	}

	@PutMapping("/forecasts/{id}")
	public Map<String, Object> updateForecast(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireFinance();
		BudgetForecast forecast = budgetForecastRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Forecast not found"));
		applyForecast(forecast, body, false);
		forecast = budgetForecastRepository.save(forecast);
		auditService.log(auth, "UPDATE", "BudgetForecast", forecast.getId(), forecast.getPeriodLabel());
		return responseMapper.budgetForecast(forecast);
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		securityUtils.requireFinance();
		List<Map<String, Object>> departments = new ArrayList<>();
		BigDecimal budgetTotal = BigDecimal.ZERO;
		BigDecimal forecastTotal = BigDecimal.ZERO;
		BigDecimal actualTotal = BigDecimal.ZERO;
		for (BudgetForecast f : budgetForecastRepository.findAllByOrderByUpdatedAtDesc()) {
			BigDecimal budget = nz(f.getBudgetAmount());
			BigDecimal forecast = nz(f.getForecastAmount());
			BigDecimal actual = nz(f.getActualAmount());
			budgetTotal = budgetTotal.add(budget);
			forecastTotal = forecastTotal.add(forecast);
			actualTotal = actualTotal.add(actual);
			double variance = f.getVariancePercent() != null
					? f.getVariancePercent()
					: (budget.compareTo(BigDecimal.ZERO) == 0
							? 0.0
							: actual.subtract(budget).multiply(BigDecimal.valueOf(100))
									.divide(budget, 1, RoundingMode.HALF_UP)
									.doubleValue());
			Map<String, Object> row = new LinkedHashMap<>();
			row.put("id", f.getId());
			row.put("periodLabel", f.getPeriodLabel());
			row.put("department", f.getDepartment());
			row.put("budgetAmount", budget);
			row.put("forecastAmount", forecast);
			row.put("actualAmount", actual);
			row.put("variancePercent", variance);
			departments.add(row);
		}
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("budgetTotal", budgetTotal);
		result.put("forecastTotal", forecastTotal);
		result.put("actualTotal", actualTotal);
		result.put("departments", departments);
		return result;
	}

	private void applyForecast(BudgetForecast forecast, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("periodLabel")) {
			forecast.setPeriodLabel(requireText(str(body.get("periodLabel")), "periodLabel").trim());
		}
		if (creating || body.containsKey("department")) {
			forecast.setDepartment(requireText(str(body.get("department")), "department").trim());
		}
		if (creating || body.containsKey("budgetAmount")) {
			forecast.setBudgetAmount(asBigDecimal(body.get("budgetAmount"), BigDecimal.ZERO));
		}
		if (creating || body.containsKey("forecastAmount")) {
			forecast.setForecastAmount(asBigDecimal(body.get("forecastAmount"), BigDecimal.ZERO));
		}
		if (creating || body.containsKey("actualAmount")) {
			forecast.setActualAmount(asBigDecimal(body.get("actualAmount"), BigDecimal.ZERO));
		}
		if (creating || body.containsKey("variancePercent")
				|| body.containsKey("budgetAmount")
				|| body.containsKey("actualAmount")) {
			if (body.containsKey("variancePercent") && body.get("variancePercent") != null
					&& !String.valueOf(body.get("variancePercent")).isBlank()) {
				forecast.setVariancePercent(asDouble(body.get("variancePercent")));
			} else {
				BigDecimal budget = nz(forecast.getBudgetAmount());
				BigDecimal actual = nz(forecast.getActualAmount());
				forecast.setVariancePercent(budget.compareTo(BigDecimal.ZERO) == 0
						? 0.0
						: actual.subtract(budget).multiply(BigDecimal.valueOf(100))
								.divide(budget, 1, RoundingMode.HALF_UP)
								.doubleValue());
			}
		}
		if (creating || body.containsKey("notes")) {
			forecast.setNotes(blankToNull(str(body.get("notes"))));
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

	private static Double asDouble(Object value) {
		if (value == null || String.valueOf(value).isBlank()) {
			return null;
		}
		if (value instanceof Number number) {
			return number.doubleValue();
		}
		try {
			return Double.parseDouble(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			throw new ApiException(400, "Invalid variancePercent");
		}
	}

	private static String requireText(String value, String label) {
		if (value == null || value.isBlank()) {
			throw new ApiException(400, label + " is required");
		}
		return value;
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}
}

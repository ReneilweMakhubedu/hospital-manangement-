package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
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
import za.gov.mpumalanga.rfh.entity.ProcSpendRecord;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.ProcSpendRecordRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/procurement/spend")
public class ProcurementSpendController {

	private final ProcSpendRecordRepository spendRecordRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public ProcurementSpendController(
			ProcSpendRecordRepository spendRecordRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.spendRecordRepository = spendRecordRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requireProcurement();
		return spendRecordRepository.findAllByOrderByRecordedAtDesc().stream()
				.map(responseMapper::procSpendRecord)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		securityUtils.requireProcurement();
		ProcSpendRecord record = new ProcSpendRecord();
		record.setCategory(requireText(str(body.get("category")), "category").trim());
		record.setDepartment(blankToNull(str(body.get("department"))));
		record.setAmount(asBigDecimal(body.get("amount"), BigDecimal.ZERO));
		record.setPeriodLabel(blankToNull(str(body.get("periodLabel"))));
		record.setBudgetAmount(asBigDecimal(body.get("budgetAmount"), BigDecimal.ZERO));
		record.setSavingsAmount(asBigDecimal(body.get("savingsAmount"), BigDecimal.ZERO));
		record.setNotes(blankToNull(str(body.get("notes"))));
		record = spendRecordRepository.save(record);
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.procSpendRecord(record));
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		securityUtils.requireProcurement();
		Map<String, Map<String, Object>> byCategory = new LinkedHashMap<>();
		BigDecimal totalAmount = BigDecimal.ZERO;
		BigDecimal totalBudget = BigDecimal.ZERO;
		BigDecimal totalSavings = BigDecimal.ZERO;
		for (ProcSpendRecord row : spendRecordRepository.findAll()) {
			String cat = row.getCategory() == null || row.getCategory().isBlank() ? "Uncategorised" : row.getCategory();
			Map<String, Object> agg = byCategory.computeIfAbsent(cat, k -> {
				Map<String, Object> m = new LinkedHashMap<>();
				m.put("category", k);
				m.put("amount", BigDecimal.ZERO);
				m.put("budgetAmount", BigDecimal.ZERO);
				m.put("savingsAmount", BigDecimal.ZERO);
				m.put("count", 0);
				return m;
			});
			BigDecimal amount = nz(row.getAmount());
			BigDecimal budget = nz(row.getBudgetAmount());
			BigDecimal savings = nz(row.getSavingsAmount());
			agg.put("amount", ((BigDecimal) agg.get("amount")).add(amount));
			agg.put("budgetAmount", ((BigDecimal) agg.get("budgetAmount")).add(budget));
			agg.put("savingsAmount", ((BigDecimal) agg.get("savingsAmount")).add(savings));
			agg.put("count", ((Integer) agg.get("count")) + 1);
			totalAmount = totalAmount.add(amount);
			totalBudget = totalBudget.add(budget);
			totalSavings = totalSavings.add(savings);
		}
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("byCategory", byCategory.values());
		result.put("totalAmount", totalAmount);
		result.put("totalBudget", totalBudget);
		result.put("totalSavings", totalSavings);
		result.put("recordCount", spendRecordRepository.count());
		return result;
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

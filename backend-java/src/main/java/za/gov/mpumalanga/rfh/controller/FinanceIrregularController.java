package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import za.gov.mpumalanga.rfh.entity.IrregularExpenditure;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.IrregularExpenditureRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/finance/irregular")
public class FinanceIrregularController {

	private static final Set<String> CATEGORIES = Set.of("IRREGULAR", "FRUITLESS", "WASTEFUL");
	private static final Set<String> STATUSES = Set.of("OPEN", "UNDER_INVESTIGATION", "RESOLVED", "WRITTEN_OFF");
	private static final Set<String> OPEN_STATUSES = Set.of("OPEN", "UNDER_INVESTIGATION");

	private final IrregularExpenditureRepository irregularExpenditureRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public FinanceIrregularController(
			IrregularExpenditureRepository irregularExpenditureRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.irregularExpenditureRepository = irregularExpenditureRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requireFinance();
		return irregularExpenditureRepository.findAllByOrderByCreatedAtDesc().stream()
				.map(responseMapper::irregularExpenditure)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireFinance();
		IrregularExpenditure item = new IrregularExpenditure();
		applyFields(item, body, true);
		item = irregularExpenditureRepository.save(item);
		auditService.log(auth, "CREATE", "IrregularExpenditure", item.getId(), item.getReferenceNumber());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.irregularExpenditure(item));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireFinance();
		IrregularExpenditure item = irregularExpenditureRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Irregular expenditure record not found"));
		applyFields(item, body, false);
		item = irregularExpenditureRepository.save(item);
		auditService.log(auth, "UPDATE", "IrregularExpenditure", item.getId(), item.getStatus());
		return responseMapper.irregularExpenditure(item);
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		securityUtils.requireFinance();
		BigDecimal irregularOpen = BigDecimal.ZERO;
		BigDecimal fruitlessOpen = BigDecimal.ZERO;
		BigDecimal wastefulOpen = BigDecimal.ZERO;
		int openCount = 0;
		int resolvedCount = 0;
		for (IrregularExpenditure item : irregularExpenditureRepository.findAll()) {
			String status = item.getStatus() == null ? "" : item.getStatus().toUpperCase(Locale.ROOT);
			BigDecimal amount = item.getAmount() == null ? BigDecimal.ZERO : item.getAmount();
			String category = item.getCategory() == null ? "" : item.getCategory().toUpperCase(Locale.ROOT);
			if (OPEN_STATUSES.contains(status)) {
				openCount++;
				switch (category) {
					case "FRUITLESS" -> fruitlessOpen = fruitlessOpen.add(amount);
					case "WASTEFUL" -> wastefulOpen = wastefulOpen.add(amount);
					default -> irregularOpen = irregularOpen.add(amount);
				}
			} else if ("RESOLVED".equals(status) || "WRITTEN_OFF".equals(status)) {
				resolvedCount++;
			}
		}
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("openCount", openCount);
		result.put("resolvedCount", resolvedCount);
		result.put("irregularOpenAmount", irregularOpen);
		result.put("fruitlessOpenAmount", fruitlessOpen);
		result.put("wastefulOpenAmount", wastefulOpen);
		result.put("openTotalAmount", irregularOpen.add(fruitlessOpen).add(wastefulOpen));
		return result;
	}

	private void applyFields(IrregularExpenditure item, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("referenceNumber")) {
			String ref = blankToNull(str(body.get("referenceNumber")));
			if (ref == null && creating) {
				ref = "IE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
			}
			if (ref != null) {
				item.setReferenceNumber(ref);
			}
		}
		if (creating || body.containsKey("category")) {
			String category = creating && blank(str(body.get("category")))
					? "IRREGULAR"
					: requireText(str(body.get("category")), "category").trim().toUpperCase(Locale.ROOT);
			if (!CATEGORIES.contains(category)) {
				throw new ApiException(400, "category must be IRREGULAR, FRUITLESS, or WASTEFUL");
			}
			item.setCategory(category);
		}
		if (creating || body.containsKey("amount")) {
			BigDecimal amount = asBigDecimal(body.get("amount"), null);
			if (amount == null) {
				throw new ApiException(400, "amount is required");
			}
			item.setAmount(amount);
		}
		if (creating || body.containsKey("description")) {
			item.setDescription(requireText(str(body.get("description")), "description").trim());
		}
		if (creating || body.containsKey("department")) {
			item.setDepartment(requireText(str(body.get("department")), "department").trim());
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "OPEN"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!STATUSES.contains(status)) {
				throw new ApiException(400, "Invalid status");
			}
			item.setStatus(status);
		}
		if (creating || body.containsKey("reportedDate")) {
			item.setReportedDate(parseDate(str(body.get("reportedDate")), creating ? LocalDate.now() : item.getReportedDate()));
		}
	}

	private static LocalDate parseDate(String value, LocalDate fallback) {
		if (value == null || value.isBlank()) {
			return fallback;
		}
		try {
			return LocalDate.parse(value.trim());
		} catch (Exception ex) {
			throw new ApiException(400, "reportedDate must be yyyy-MM-dd");
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

	private static String blankToNull(String value) {
		return blank(value) ? null : value.trim();
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}
}

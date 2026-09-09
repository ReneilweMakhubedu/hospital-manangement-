package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.CostCentre;
import za.gov.mpumalanga.rfh.entity.DebtAccount;
import za.gov.mpumalanga.rfh.entity.FinanceTransaction;
import za.gov.mpumalanga.rfh.entity.IrregularExpenditure;
import za.gov.mpumalanga.rfh.entity.PatientInvoice;
import za.gov.mpumalanga.rfh.entity.PurchaseRequisition;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.CostCentreRepository;
import za.gov.mpumalanga.rfh.repository.DebtAccountRepository;
import za.gov.mpumalanga.rfh.repository.FinanceTransactionRepository;
import za.gov.mpumalanga.rfh.repository.IrregularExpenditureRepository;
import za.gov.mpumalanga.rfh.repository.PatientInvoiceRepository;
import za.gov.mpumalanga.rfh.repository.PurchaseRequisitionRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

	private static final Set<String> TXN_TYPES = Set.of("COMMITMENT", "ACTUAL", "REVENUE");
	private static final Set<String> OPEN_IRREGULAR = Set.of("OPEN", "UNDER_INVESTIGATION");
	private static final Set<String> OPEN_DEBT = Set.of("OPEN", "IN_COLLECTION", "ESCALATED");

	private final CostCentreRepository costCentreRepository;
	private final FinanceTransactionRepository financeTransactionRepository;
	private final PatientInvoiceRepository patientInvoiceRepository;
	private final DebtAccountRepository debtAccountRepository;
	private final IrregularExpenditureRepository irregularExpenditureRepository;
	private final PurchaseRequisitionRepository purchaseRequisitionRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public FinanceController(
			CostCentreRepository costCentreRepository,
			FinanceTransactionRepository financeTransactionRepository,
			PatientInvoiceRepository patientInvoiceRepository,
			DebtAccountRepository debtAccountRepository,
			IrregularExpenditureRepository irregularExpenditureRepository,
			PurchaseRequisitionRepository purchaseRequisitionRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.costCentreRepository = costCentreRepository;
		this.financeTransactionRepository = financeTransactionRepository;
		this.patientInvoiceRepository = patientInvoiceRepository;
		this.debtAccountRepository = debtAccountRepository;
		this.irregularExpenditureRepository = irregularExpenditureRepository;
		this.purchaseRequisitionRepository = purchaseRequisitionRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping("/dashboard")
	public Map<String, Object> dashboard() {
		securityUtils.requireFinance();

		List<FinanceTransaction> txns = financeTransactionRepository.findAll();
		BigDecimal budgetTotal = BigDecimal.ZERO;
		for (CostCentre cc : costCentreRepository.findAll()) {
			budgetTotal = budgetTotal.add(nz(cc.getBudgetAnnual()));
		}
		BigDecimal commitmentTotal = BigDecimal.ZERO;
		BigDecimal actualTotal = BigDecimal.ZERO;
		BigDecimal revenueCollected = BigDecimal.ZERO;
		for (FinanceTransaction txn : txns) {
			BigDecimal amount = nz(txn.getAmount());
			String type = txn.getType() == null ? "" : txn.getType().toUpperCase(Locale.ROOT);
			switch (type) {
				case "COMMITMENT" -> commitmentTotal = commitmentTotal.add(amount);
				case "ACTUAL" -> actualTotal = actualTotal.add(amount);
				case "REVENUE" -> revenueCollected = revenueCollected.add(amount);
				default -> {
				}
			}
		}
		for (PatientInvoice inv : patientInvoiceRepository.findAll()) {
			revenueCollected = revenueCollected.add(nz(inv.getAmountPaid()));
		}

		BigDecimal underspendAmount = budgetTotal.subtract(commitmentTotal).subtract(actualTotal);
		double underspendPercent = budgetTotal.compareTo(BigDecimal.ZERO) == 0
				? 0.0
				: underspendAmount.multiply(BigDecimal.valueOf(100))
						.divide(budgetTotal, 1, RoundingMode.HALF_UP)
						.doubleValue();

		Map<String, BigDecimal> debtTotals = new LinkedHashMap<>();
		BigDecimal debtorsOutstanding = BigDecimal.ZERO;
		BigDecimal municipalOpen = BigDecimal.ZERO;
		for (DebtAccount debt : debtAccountRepository.findAll()) {
			String status = debt.getStatus() == null ? "" : debt.getStatus().toUpperCase(Locale.ROOT);
			if (!OPEN_DEBT.contains(status)) {
				continue;
			}
			BigDecimal amount = nz(debt.getAmount());
			debtorsOutstanding = debtorsOutstanding.add(amount);
			String cat = debt.getDebtorCategory() == null ? "OTHER" : debt.getDebtorCategory().toUpperCase(Locale.ROOT);
			debtTotals.merge(cat, amount, BigDecimal::add);
			if ("MUNICIPAL".equals(cat)) {
				municipalOpen = municipalOpen.add(amount);
			}
		}

		List<Map<String, Object>> debtByCategory = new ArrayList<>();
		for (Map.Entry<String, BigDecimal> entry : debtTotals.entrySet()) {
			Map<String, Object> row = new LinkedHashMap<>();
			row.put("category", entry.getKey());
			row.put("amount", entry.getValue());
			row.put("percent", debtorsOutstanding.compareTo(BigDecimal.ZERO) == 0
					? 0.0
					: entry.getValue().multiply(BigDecimal.valueOf(100))
							.divide(debtorsOutstanding, 1, RoundingMode.HALF_UP)
							.doubleValue());
			debtByCategory.add(row);
		}

		BigDecimal irregularOpenAmount = BigDecimal.ZERO;
		BigDecimal fruitlessOpenAmount = BigDecimal.ZERO;
		int irregularOpenCount = 0;
		for (IrregularExpenditure item : irregularExpenditureRepository.findAll()) {
			String status = item.getStatus() == null ? "" : item.getStatus().toUpperCase(Locale.ROOT);
			if (!OPEN_IRREGULAR.contains(status)) {
				continue;
			}
			irregularOpenCount++;
			BigDecimal amount = nz(item.getAmount());
			String category = item.getCategory() == null ? "" : item.getCategory().toUpperCase(Locale.ROOT);
			if ("FRUITLESS".equals(category) || "WASTEFUL".equals(category)) {
				fruitlessOpenAmount = fruitlessOpenAmount.add(amount);
			} else {
				irregularOpenAmount = irregularOpenAmount.add(amount);
			}
		}

		List<String> alerts = new ArrayList<>();
		if (underspendPercent < 0) {
			alerts.add("Budget overspend of R " + underspendAmount.abs().setScale(2, RoundingMode.HALF_UP));
		}
		if (irregularOpenCount > 0) {
			alerts.add(irregularOpenCount + " open irregular / fruitless expenditure case(s)");
		}
		if (municipalOpen.compareTo(BigDecimal.ZERO) > 0) {
			alerts.add("Municipal debtor balance outstanding: R " + municipalOpen.setScale(2, RoundingMode.HALF_UP));
		}
		if (debtorsOutstanding.compareTo(new BigDecimal("500000")) > 0) {
			alerts.add("Debtors outstanding exceed R 500,000 — review collections");
		}

		List<Map<String, Object>> recentInvoices = patientInvoiceRepository.findAllByOrderByCreatedAtDesc().stream()
				.limit(5)
				.map(responseMapper::patientInvoice)
				.toList();
		List<Map<String, Object>> recentRequisitions = purchaseRequisitionRepository.findAllByOrderByCreatedAtDesc().stream()
				.limit(5)
				.map(responseMapper::purchaseRequisition)
				.toList();

		Map<String, Object> dash = new LinkedHashMap<>();
		dash.put("budgetTotal", budgetTotal);
		dash.put("commitmentTotal", commitmentTotal);
		dash.put("actualTotal", actualTotal);
		dash.put("underspendAmount", underspendAmount);
		dash.put("underspendPercent", underspendPercent);
		dash.put("revenueCollected", revenueCollected);
		dash.put("debtorsOutstanding", debtorsOutstanding);
		dash.put("debtByCategory", debtByCategory);
		dash.put("irregularOpenAmount", irregularOpenAmount);
		dash.put("fruitlessOpenAmount", fruitlessOpenAmount);
		dash.put("irregularOpenCount", irregularOpenCount);
		dash.put("cashOutflowDueHint", municipalOpen);
		dash.put("alerts", alerts);
		dash.put("recentInvoices", recentInvoices);
		dash.put("recentRequisitions", recentRequisitions);
		return dash;
	}

	@GetMapping("/cost-centres")
	public List<Map<String, Object>> listCostCentres() {
		securityUtils.requireFinance();
		return costCentreRepository.findAllByOrderByCodeAsc().stream()
				.map(responseMapper::costCentre)
				.toList();
	}

	@PostMapping("/cost-centres")
	public ResponseEntity<Map<String, Object>> createCostCentre(@RequestBody Map<String, Object> body) {
		securityUtils.requireFinance();
		String code = requireText(str(body.get("code")), "code").trim().toUpperCase(Locale.ROOT);
		if (costCentreRepository.findByCodeIgnoreCase(code).isPresent()) {
			throw new ApiException(400, "Cost centre code already exists");
		}
		CostCentre cc = new CostCentre();
		cc.setCode(code);
		cc.setName(requireText(str(body.get("name")), "name").trim());
		cc.setDepartment(requireText(str(body.get("department")), "department").trim());
		cc.setBudgetAnnual(asBigDecimal(body.get("budgetAnnual"), BigDecimal.ZERO));
		cc.setActive(asBoolean(body.get("active"), true));
		cc = costCentreRepository.save(cc);
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.costCentre(cc));
	}

	@PutMapping("/cost-centres/{id}")
	public Map<String, Object> updateCostCentre(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		securityUtils.requireFinance();
		CostCentre cc = costCentreRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Cost centre not found"));
		if (body.containsKey("code")) {
			String code = requireText(str(body.get("code")), "code").trim().toUpperCase(Locale.ROOT);
			costCentreRepository.findByCodeIgnoreCase(code).ifPresent(existing -> {
				if (!existing.getId().equals(id)) {
					throw new ApiException(400, "Cost centre code already exists");
				}
			});
			cc.setCode(code);
		}
		if (body.containsKey("name")) {
			cc.setName(requireText(str(body.get("name")), "name").trim());
		}
		if (body.containsKey("department")) {
			cc.setDepartment(requireText(str(body.get("department")), "department").trim());
		}
		if (body.containsKey("budgetAnnual")) {
			cc.setBudgetAnnual(asBigDecimal(body.get("budgetAnnual"), BigDecimal.ZERO));
		}
		if (body.containsKey("active")) {
			cc.setActive(asBoolean(body.get("active"), true));
		}
		return responseMapper.costCentre(costCentreRepository.save(cc));
	}

	@GetMapping("/transactions")
	public List<Map<String, Object>> listTransactions(@RequestParam(required = false) Long costCentreId) {
		securityUtils.requireFinance();
		List<FinanceTransaction> txns = costCentreId == null
				? financeTransactionRepository.findAllByOrderByTxnDateDescCreatedAtDesc()
				: financeTransactionRepository.findByCostCentreIdOrderByTxnDateDescCreatedAtDesc(costCentreId);
		return txns.stream().map(responseMapper::financeTransaction).toList();
	}

	@PostMapping("/transactions")
	public ResponseEntity<Map<String, Object>> createTransaction(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireFinance();
		Long costCentreId = asLong(body.get("costCentreId"));
		if (costCentreId == null || costCentreRepository.findById(costCentreId).isEmpty()) {
			throw new ApiException(400, "Select a valid cost centre");
		}
		LocalDate txnDate = parseDate(str(body.get("txnDate")), "txnDate");
		String description = requireText(str(body.get("description")), "description");
		BigDecimal amount = asBigDecimal(body.get("amount"), null);
		if (amount == null) {
			throw new ApiException(400, "amount is required");
		}
		String type = normalizeType(str(body.get("type")));

		FinanceTransaction txn = new FinanceTransaction();
		txn.setCostCentreId(costCentreId);
		txn.setTxnDate(txnDate);
		txn.setDescription(description.trim());
		txn.setAmount(amount);
		txn.setType(type);
		txn.setReference(blankToNull(str(body.get("reference"))));
		txn.setCreatedBy(blankToNull(str(body.get("createdBy"))) != null
				? blankToNull(str(body.get("createdBy")))
				: "finance#" + auth.id());
		txn = financeTransactionRepository.save(txn);

		auditService.log(auth, "CREATE", "FinanceTransaction", txn.getId(),
				type + " " + amount + " on cost centre " + costCentreId);
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.financeTransaction(txn));
	}

	@GetMapping("/summary")
	public List<Map<String, Object>> summary() {
		securityUtils.requireFinance();
		List<FinanceTransaction> txns = financeTransactionRepository.findAll();
		List<Map<String, Object>> rows = new ArrayList<>();
		for (CostCentre cc : costCentreRepository.findAllByOrderByCodeAsc()) {
			BigDecimal commitments = BigDecimal.ZERO;
			BigDecimal actuals = BigDecimal.ZERO;
			BigDecimal revenue = BigDecimal.ZERO;
			for (FinanceTransaction txn : txns) {
				if (!cc.getId().equals(txn.getCostCentreId())) {
					continue;
				}
				BigDecimal amount = nz(txn.getAmount());
				String type = txn.getType() == null ? "" : txn.getType().toUpperCase(Locale.ROOT);
				switch (type) {
					case "COMMITMENT" -> commitments = commitments.add(amount);
					case "ACTUAL" -> actuals = actuals.add(amount);
					case "REVENUE" -> revenue = revenue.add(amount);
					default -> {
					}
				}
			}
			BigDecimal budget = nz(cc.getBudgetAnnual());
			BigDecimal remaining = budget.subtract(commitments).subtract(actuals);
			Map<String, Object> row = new LinkedHashMap<>();
			row.put("costCentreId", cc.getId());
			row.put("code", cc.getCode());
			row.put("name", cc.getName());
			row.put("department", cc.getDepartment());
			row.put("budgetAnnual", budget);
			row.put("commitments", commitments);
			row.put("actuals", actuals);
			row.put("revenue", revenue);
			row.put("remainingBudget", remaining);
			row.put("spentPercent", budget.compareTo(BigDecimal.ZERO) == 0
					? 0.0
					: commitments.add(actuals)
							.multiply(BigDecimal.valueOf(100))
							.divide(budget, 1, RoundingMode.HALF_UP)
							.doubleValue());
			rows.add(row);
		}
		return rows;
	}

	private static BigDecimal nz(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}

	private static String normalizeType(String value) {
		String normalized = requireText(value, "type").trim().toUpperCase(Locale.ROOT);
		if (!TXN_TYPES.contains(normalized)) {
			throw new ApiException(400, "type must be COMMITMENT, ACTUAL, or REVENUE");
		}
		return normalized;
	}

	private static LocalDate parseDate(String value, String label) {
		if (value == null || value.isBlank()) {
			throw new ApiException(400, label + " is required");
		}
		try {
			return LocalDate.parse(value.trim());
		} catch (Exception ex) {
			throw new ApiException(400, label + " must be yyyy-MM-dd");
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

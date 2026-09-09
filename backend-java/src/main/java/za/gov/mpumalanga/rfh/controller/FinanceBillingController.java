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
import za.gov.mpumalanga.rfh.entity.DebtAccount;
import za.gov.mpumalanga.rfh.entity.PatientInvoice;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.DebtAccountRepository;
import za.gov.mpumalanga.rfh.repository.PatientInvoiceRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/finance/billing")
public class FinanceBillingController {

	private static final Set<String> CLASSIFICATIONS = Set.of("SELF_PAY", "MEDICAL_SCHEME", "GOVERNMENT", "FREE_CARE");
	private static final Set<String> INVOICE_STATUSES = Set.of(
			"DRAFT", "ISSUED", "PART_PAID", "PAID", "WRITTEN_OFF", "IN_COLLECTION");
	private static final Set<String> DEBTOR_CATEGORIES = Set.of(
			"SELF_PAYING", "GOVERNMENT", "MEDICAL_SCHEME", "MUNICIPAL", "OTHER");
	private static final Set<String> AGE_BUCKETS = Set.of("CURRENT", "30", "60", "90", "120_PLUS");
	private static final Set<String> DEBT_STATUSES = Set.of("OPEN", "IN_COLLECTION", "ESCALATED", "CLOSED");
	private static final Set<String> OPEN_DEBT = Set.of("OPEN", "IN_COLLECTION", "ESCALATED");

	private final PatientInvoiceRepository patientInvoiceRepository;
	private final DebtAccountRepository debtAccountRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public FinanceBillingController(
			PatientInvoiceRepository patientInvoiceRepository,
			DebtAccountRepository debtAccountRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.patientInvoiceRepository = patientInvoiceRepository;
		this.debtAccountRepository = debtAccountRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping("/invoices")
	public List<Map<String, Object>> listInvoices() {
		securityUtils.requireFinance();
		return patientInvoiceRepository.findAllByOrderByCreatedAtDesc().stream()
				.map(responseMapper::patientInvoice)
				.toList();
	}

	@PostMapping("/invoices")
	public ResponseEntity<Map<String, Object>> createInvoice(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireFinance();
		PatientInvoice invoice = new PatientInvoice();
		applyInvoice(invoice, body, true);
		invoice = patientInvoiceRepository.save(invoice);
		auditService.log(auth, "CREATE", "PatientInvoice", invoice.getId(), invoice.getReferenceNumber());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.patientInvoice(invoice));
	}

	@PutMapping("/invoices/{id}")
	public Map<String, Object> updateInvoice(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireFinance();
		PatientInvoice invoice = patientInvoiceRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Invoice not found"));
		applyInvoice(invoice, body, false);
		invoice = patientInvoiceRepository.save(invoice);
		auditService.log(auth, "UPDATE", "PatientInvoice", invoice.getId(), invoice.getStatus());
		return responseMapper.patientInvoice(invoice);
	}

	@GetMapping("/debts")
	public List<Map<String, Object>> listDebts() {
		securityUtils.requireFinance();
		return debtAccountRepository.findAllByOrderByUpdatedAtDesc().stream()
				.map(responseMapper::debtAccount)
				.toList();
	}

	@PostMapping("/debts")
	public ResponseEntity<Map<String, Object>> createDebt(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireFinance();
		DebtAccount debt = new DebtAccount();
		applyDebt(debt, body, true);
		debt = debtAccountRepository.save(debt);
		auditService.log(auth, "CREATE", "DebtAccount", debt.getId(), debt.getDebtorName());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.debtAccount(debt));
	}

	@PutMapping("/debts/{id}")
	public Map<String, Object> updateDebt(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireFinance();
		DebtAccount debt = debtAccountRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Debt account not found"));
		applyDebt(debt, body, false);
		debt = debtAccountRepository.save(debt);
		auditService.log(auth, "UPDATE", "DebtAccount", debt.getId(), debt.getStatus());
		return responseMapper.debtAccount(debt);
	}

	@GetMapping("/debtors-summary")
	public Map<String, Object> debtorsSummary() {
		securityUtils.requireFinance();
		Map<String, BigDecimal> totals = new LinkedHashMap<>();
		for (String cat : DEBTOR_CATEGORIES) {
			totals.put(cat, BigDecimal.ZERO);
		}
		BigDecimal outstanding = BigDecimal.ZERO;
		for (DebtAccount debt : debtAccountRepository.findAll()) {
			String status = debt.getStatus() == null ? "" : debt.getStatus().toUpperCase(Locale.ROOT);
			if (!OPEN_DEBT.contains(status)) {
				continue;
			}
			BigDecimal amount = debt.getAmount() == null ? BigDecimal.ZERO : debt.getAmount();
			outstanding = outstanding.add(amount);
			String cat = debt.getDebtorCategory() == null ? "OTHER" : debt.getDebtorCategory().toUpperCase(Locale.ROOT);
			totals.merge(cat, amount, BigDecimal::add);
		}
		List<Map<String, Object>> byCategory = new ArrayList<>();
		for (Map.Entry<String, BigDecimal> entry : totals.entrySet()) {
			Map<String, Object> row = new LinkedHashMap<>();
			row.put("category", entry.getKey());
			row.put("amount", entry.getValue());
			row.put("percent", outstanding.compareTo(BigDecimal.ZERO) == 0
					? 0.0
					: entry.getValue().multiply(BigDecimal.valueOf(100))
							.divide(outstanding, 1, RoundingMode.HALF_UP)
							.doubleValue());
			byCategory.add(row);
		}
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("outstandingTotal", outstanding);
		result.put("byCategory", byCategory);
		return result;
	}

	private void applyInvoice(PatientInvoice invoice, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("patientId")) {
			invoice.setPatientId(asLong(body.get("patientId")));
		}
		if (creating || body.containsKey("patientName")) {
			invoice.setPatientName(requireText(str(body.get("patientName")), "patientName").trim());
		}
		if (creating || body.containsKey("classification")) {
			String classification = creating && blank(str(body.get("classification")))
					? "SELF_PAY"
					: requireText(str(body.get("classification")), "classification").trim().toUpperCase(Locale.ROOT);
			if (!CLASSIFICATIONS.contains(classification)) {
				throw new ApiException(400, "classification must be SELF_PAY, MEDICAL_SCHEME, GOVERNMENT, or FREE_CARE");
			}
			invoice.setClassification(classification);
		}
		if (creating || body.containsKey("medicalScheme")) {
			invoice.setMedicalScheme(blankToNull(str(body.get("medicalScheme"))));
		}
		if (creating || body.containsKey("amount")) {
			BigDecimal amount = asBigDecimal(body.get("amount"), creating ? BigDecimal.ZERO : invoice.getAmount());
			if (amount == null) {
				throw new ApiException(400, "amount is required");
			}
			invoice.setAmount(amount);
		}
		if (creating || body.containsKey("amountPaid")) {
			invoice.setAmountPaid(asBigDecimal(body.get("amountPaid"), creating ? BigDecimal.ZERO : invoice.getAmountPaid()));
		}
		BigDecimal amount = invoice.getAmount() == null ? BigDecimal.ZERO : invoice.getAmount();
		BigDecimal paid = invoice.getAmountPaid() == null ? BigDecimal.ZERO : invoice.getAmountPaid();
		if (creating || body.containsKey("balance") || body.containsKey("amount") || body.containsKey("amountPaid")) {
			invoice.setBalance(amount.subtract(paid));
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "DRAFT"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!INVOICE_STATUSES.contains(status)) {
				throw new ApiException(400, "Invalid invoice status");
			}
			invoice.setStatus(status);
		}
		if (creating || body.containsKey("invoiceDate")) {
			invoice.setInvoiceDate(parseDateOptional(str(body.get("invoiceDate")), creating ? LocalDate.now() : invoice.getInvoiceDate()));
		}
		if (creating || body.containsKey("dueDate")) {
			invoice.setDueDate(parseDateOptional(str(body.get("dueDate")),
					creating ? LocalDate.now().plusDays(30) : invoice.getDueDate()));
		}
		if (creating || body.containsKey("referenceNumber")) {
			String ref = blankToNull(str(body.get("referenceNumber")));
			if (ref == null && creating) {
				ref = "INV-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
			}
			if (ref != null) {
				final String checkRef = ref;
				patientInvoiceRepository.findByReferenceNumberIgnoreCase(checkRef).ifPresent(existing -> {
					if (invoice.getId() == null || !existing.getId().equals(invoice.getId())) {
						throw new ApiException(400, "Invoice reference already exists");
					}
				});
				invoice.setReferenceNumber(ref);
			}
		}
		if (creating || body.containsKey("notes")) {
			invoice.setNotes(blankToNull(str(body.get("notes"))));
		}
	}

	private void applyDebt(DebtAccount debt, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("debtorCategory")) {
			String cat = creating && blank(str(body.get("debtorCategory")))
					? "OTHER"
					: requireText(str(body.get("debtorCategory")), "debtorCategory").trim().toUpperCase(Locale.ROOT);
			if (!DEBTOR_CATEGORIES.contains(cat)) {
				throw new ApiException(400, "Invalid debtorCategory");
			}
			debt.setDebtorCategory(cat);
		}
		if (creating || body.containsKey("debtorName")) {
			debt.setDebtorName(requireText(str(body.get("debtorName")), "debtorName").trim());
		}
		if (creating || body.containsKey("amount")) {
			BigDecimal amount = asBigDecimal(body.get("amount"), null);
			if (amount == null) {
				throw new ApiException(400, "amount is required");
			}
			debt.setAmount(amount);
		}
		if (creating || body.containsKey("ageBucket")) {
			String bucket = creating && blank(str(body.get("ageBucket")))
					? "CURRENT"
					: requireText(str(body.get("ageBucket")), "ageBucket").trim().toUpperCase(Locale.ROOT);
			if (!AGE_BUCKETS.contains(bucket)) {
				throw new ApiException(400, "ageBucket must be CURRENT, 30, 60, 90, or 120_PLUS");
			}
			debt.setAgeBucket(bucket);
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "OPEN"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!DEBT_STATUSES.contains(status)) {
				throw new ApiException(400, "Invalid debt status");
			}
			debt.setStatus(status);
		}
		if (creating || body.containsKey("notes")) {
			debt.setNotes(blankToNull(str(body.get("notes"))));
		}
	}

	private static LocalDate parseDateOptional(String value, LocalDate fallback) {
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

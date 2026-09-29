package za.gov.mpumalanga.rfh.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.gov.mpumalanga.rfh.entity.ApprovalRequest;
import za.gov.mpumalanga.rfh.entity.FinanceTransaction;
import za.gov.mpumalanga.rfh.entity.Medicine;
import za.gov.mpumalanga.rfh.entity.PatientInvoice;
import za.gov.mpumalanga.rfh.entity.PayrollPeriod;
import za.gov.mpumalanga.rfh.entity.WardBed;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.ApprovalRequestRepository;
import za.gov.mpumalanga.rfh.repository.FinanceTransactionRepository;
import za.gov.mpumalanga.rfh.repository.MedicineRepository;
import za.gov.mpumalanga.rfh.repository.PatientInvoiceRepository;
import za.gov.mpumalanga.rfh.repository.PayrollPeriodRepository;
import za.gov.mpumalanga.rfh.repository.SupportStore;
import za.gov.mpumalanga.rfh.security.AuthUser;

@Service
public class GovernanceService {
	public static final String BILLING = "BILLING_ADJUSTMENT";
	public static final String STOCK = "STOCK_WRITE_OFF";
	public static final String DISCHARGE = "EMERGENCY_DISCHARGE";
	public static final String PAYROLL = "PAYROLL_CHANGE";
	private static final Set<String> TYPES = Set.of(BILLING, STOCK, DISCHARGE, PAYROLL);

	private final ApprovalRequestRepository approvalRequestRepository;
	private final FinanceTransactionRepository financeTransactionRepository;
	private final PatientInvoiceRepository patientInvoiceRepository;
	private final MedicineRepository medicineRepository;
	private final PayrollPeriodRepository payrollPeriodRepository;
	private final SupportStore supportStore;
	private final StayFlowService stayFlowService;
	private final AuditService auditService;

	public GovernanceService(
			ApprovalRequestRepository approvalRequestRepository,
			FinanceTransactionRepository financeTransactionRepository,
			PatientInvoiceRepository patientInvoiceRepository,
			MedicineRepository medicineRepository,
			PayrollPeriodRepository payrollPeriodRepository,
			SupportStore supportStore,
			StayFlowService stayFlowService,
			AuditService auditService) {
		this.approvalRequestRepository = approvalRequestRepository;
		this.financeTransactionRepository = financeTransactionRepository;
		this.patientInvoiceRepository = patientInvoiceRepository;
		this.medicineRepository = medicineRepository;
		this.payrollPeriodRepository = payrollPeriodRepository;
		this.supportStore = supportStore;
		this.stayFlowService = stayFlowService;
		this.auditService = auditService;
	}

	public List<Map<String, Object>> list(AuthUser actor) {
		return approvalRequestRepository.findAllByOrderByRequestedAtDesc().stream()
				.filter(row -> visible(actor, row))
				.map(this::view)
				.toList();
	}

	@Transactional
	public Map<String, Object> request(AuthUser actor, String actionType, String summary, String reason, Map<String, Object> payload) {
		String type = actionType == null ? "" : actionType.trim().toUpperCase(Locale.ROOT);
		if (!TYPES.contains(type)) throw new ApiException(400, "Unknown approval type");
		if (!canRequest(actor.role(), type)) {
			throw new ApiException(403, "Your role cannot request this approval");
		}
		String why = reason == null ? "" : reason.trim();
		if (why.length() < 8) throw new ApiException(400, "A reason of at least 8 characters is required");
		ApprovalRequest request = new ApprovalRequest();
		request.setActionType(type);
		request.setSummary(summary == null || summary.isBlank() ? type : summary.trim());
		request.setReason(why);
		request.setStatus("PENDING");
		request.setRequestedByEmail(auditService.actorEmail(actor));
		request.setRequestedByRole(actor.role());
		request.setRequestedAt(Instant.now());
		request.setPayloadJson(writePayload(payload));
		request = approvalRequestRepository.save(request);
		auditService.logChange(actor, "REQUEST", "ApprovalRequest", request.getId(), request.getSummary(), why);
		Map<String, Object> view = view(request);
		view.put("message", "Submitted for approval. A different authorised person must sign it off before it is applied.");
		view.put("pendingApproval", true);
		return view;
	}

	@Transactional
	public Map<String, Object> decide(AuthUser actor, Long id, String decision, String note) {
		ApprovalRequest request = approvalRequestRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Approval request not found"));
		if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
			throw new ApiException(409, "This request is already " + request.getStatus());
		}
		if (!canApprove(actor.role(), request.getActionType())) {
			throw new ApiException(403, "Your role cannot approve this request");
		}
		String actorEmail = auditService.actorEmail(actor);
		if (actorEmail != null && actorEmail.equalsIgnoreCase(request.getRequestedByEmail())) {
			throw new ApiException(403, "The person who requested this change cannot approve it");
		}
		String choice = decision == null ? "" : decision.trim().toUpperCase(Locale.ROOT);
		if (!"APPROVED".equals(choice) && !"REJECTED".equals(choice)) {
			throw new ApiException(400, "decision must be APPROVED or REJECTED");
		}
		String why = note == null ? "" : note.trim();
		if (why.length() < 8) throw new ApiException(400, "A decision note of at least 8 characters is required");
		request.setStatus(choice);
		request.setDecidedByEmail(actorEmail);
		request.setDecidedByRole(actor.role());
		request.setDecidedAt(Instant.now());
		request.setDecisionNote(why);
		if ("APPROVED".equals(choice)) apply(request);
		approvalRequestRepository.save(request);
		auditService.logChange(actor, choice, "ApprovalRequest", request.getId(), request.getSummary(), why);
		Map<String, Object> view = view(request);
		view.put("message", "APPROVED".equals(choice) ? "Approved and applied." : "Rejected. The change was not applied.");
		return view;
	}

	private void apply(ApprovalRequest request) {
		Map<String, Object> payload = readPayload(request.getPayloadJson());
		switch (request.getActionType()) {
			case BILLING -> applyBilling(payload);
			case STOCK -> applyStock(payload);
			case DISCHARGE -> applyDischarge(payload);
			case PAYROLL -> applyPayroll(payload);
			default -> throw new ApiException(400, "Unknown approval type");
		}
	}

	private void applyBilling(Map<String, Object> payload) {
		if (payload.get("invoiceId") != null) {
			Long invoiceId = asLong(payload.get("invoiceId"));
			PatientInvoice invoice = patientInvoiceRepository.findById(invoiceId)
					.orElseThrow(() -> new ApiException(404, "Invoice not found"));
			if (payload.get("amount") != null) invoice.setAmount(asDecimal(payload.get("amount")));
			if (payload.get("amountPaid") != null) invoice.setAmountPaid(asDecimal(payload.get("amountPaid")));
			BigDecimal amount = invoice.getAmount() == null ? BigDecimal.ZERO : invoice.getAmount();
			BigDecimal paid = invoice.getAmountPaid() == null ? BigDecimal.ZERO : invoice.getAmountPaid();
			invoice.setBalance(amount.subtract(paid));
			patientInvoiceRepository.save(invoice);
			return;
		}
		FinanceTransaction txn = new FinanceTransaction();
		txn.setCostCentreId(asLong(payload.get("costCentreId")));
		txn.setTxnDate(LocalDate.parse(String.valueOf(payload.get("txnDate"))));
		txn.setDescription(String.valueOf(payload.get("description")));
		txn.setAmount(asDecimal(payload.get("amount")));
		txn.setType(String.valueOf(payload.get("type")));
		Object reference = payload.get("reference");
		txn.setReference(reference == null ? null : String.valueOf(reference));
		txn.setCreatedBy(String.valueOf(payload.get("createdBy")));
		financeTransactionRepository.save(txn);
	}

	private void applyStock(Map<String, Object> payload) {
		Medicine medicine = medicineRepository.findById(asLong(payload.get("medicineId")))
				.orElseThrow(() -> new ApiException(404, "Medicine not found"));
		medicine.setQuantity(asLong(payload.get("quantity")).intValue());
		medicineRepository.save(medicine);
	}

	private void applyDischarge(Map<String, Object> payload) {
		Long bedId = asLong(payload.get("bedId"));
		WardBed bed = supportStore.find(WardBed.class, bedId)
				.orElseThrow(() -> new ApiException(404, "Bed not found"));
		String previousStatus = bed.status;
		String previousPatient = bed.patientName;
		bed.status = "CLEANING";
		stayFlowService.prepare(bed, previousStatus, previousPatient);
		bed.patientName = null;
		bed.patientId = null;
		bed.allocatedByEmail = null;
		bed.admittedAt = null;
		WardBed saved = supportStore.save(bed);
		stayFlowService.afterSave(saved, previousStatus, previousPatient, payload.get("actorEmail") == null ? null : String.valueOf(payload.get("actorEmail")));
	}

	private void applyPayroll(Map<String, Object> payload) {
		PayrollPeriod period = payrollPeriodRepository.findById(asLong(payload.get("periodId")))
				.orElseThrow(() -> new ApiException(404, "Payroll period not found"));
		period.setStatus(String.valueOf(payload.get("status")));
		payrollPeriodRepository.save(period);
	}

	private static String writePayload(Map<String, Object> payload) {
		StringBuilder builder = new StringBuilder();
		if (payload == null) return "";
		for (Map.Entry<String, Object> entry : payload.entrySet()) {
			String value = entry.getValue() == null ? "" : String.valueOf(entry.getValue()).replace("\n", " ");
			builder.append(entry.getKey()).append('=').append(value).append('\n');
		}
		return builder.toString();
	}

	private Map<String, Object> readPayload(String json) {
		Map<String, Object> payload = new LinkedHashMap<>();
		if (json == null || json.isBlank()) return payload;
		for (String line : json.split("\n")) {
			int split = line.indexOf('=');
			if (split < 1) continue;
			payload.put(line.substring(0, split), line.substring(split + 1));
		}
		return payload;
	}

	private boolean visible(AuthUser actor, ApprovalRequest row) {
		String role = actor.role() == null ? "" : actor.role().toLowerCase(Locale.ROOT);
		if ("admin".equals(role) || "super_admin".equals(role) || "quality".equals(role)) return true;
		String email = auditService.actorEmail(actor);
		if (email != null && email.equalsIgnoreCase(row.getRequestedByEmail())) return true;
		return "PENDING".equalsIgnoreCase(row.getStatus()) && canApprove(role, row.getActionType());
	}

	private static boolean canRequest(String role, String type) {
		String value = role == null ? "" : role.toLowerCase(Locale.ROOT);
		return switch (type) {
			case BILLING -> value.equals("finance");
			case STOCK -> value.equals("pharmacy");
			case PAYROLL -> value.equals("payroll");
			case DISCHARGE -> value.equals("nurse") || value.equals("nurse_manager") || value.equals("doctor");
			default -> false;
		};
	}

	private static boolean canApprove(String role, String type) {
		String value = role == null ? "" : role.toLowerCase(Locale.ROOT);
		boolean admin = value.equals("admin") || value.equals("super_admin");
		return switch (type) {
			case BILLING, STOCK, PAYROLL -> admin;
			case DISCHARGE -> value.equals("nurse_manager") || value.equals("doctor");
			default -> false;
		};
	}

	private Map<String, Object> view(ApprovalRequest request) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", request.getId());
		map.put("actionType", request.getActionType());
		map.put("summary", request.getSummary());
		map.put("reason", request.getReason());
		map.put("status", request.getStatus());
		map.put("requestedByEmail", request.getRequestedByEmail());
		map.put("requestedByRole", request.getRequestedByRole());
		map.put("requestedAt", request.getRequestedAt());
		map.put("decidedByEmail", request.getDecidedByEmail());
		map.put("decidedByRole", request.getDecidedByRole());
		map.put("decidedAt", request.getDecidedAt());
		map.put("decisionNote", request.getDecisionNote());
		return map;
	}

	private static Long asLong(Object value) {
		if (value instanceof Number number) return number.longValue();
		return Long.valueOf(String.valueOf(value));
	}

	private static BigDecimal asDecimal(Object value) {
		if (value instanceof BigDecimal decimal) return decimal;
		if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
		return new BigDecimal(String.valueOf(value));
	}
}

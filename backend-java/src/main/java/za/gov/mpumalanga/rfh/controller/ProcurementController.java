package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.ProcSpendRecord;
import za.gov.mpumalanga.rfh.entity.ProcTender;
import za.gov.mpumalanga.rfh.entity.ProcVendor;
import za.gov.mpumalanga.rfh.repository.ProcAiInsightRepository;
import za.gov.mpumalanga.rfh.repository.ProcBidRepository;
import za.gov.mpumalanga.rfh.repository.ProcContractRepository;
import za.gov.mpumalanga.rfh.repository.ProcLedgerEventRepository;
import za.gov.mpumalanga.rfh.repository.ProcRiskAlertRepository;
import za.gov.mpumalanga.rfh.repository.ProcSpendRecordRepository;
import za.gov.mpumalanga.rfh.repository.ProcTenderRepository;
import za.gov.mpumalanga.rfh.repository.ProcVendorRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/procurement")
public class ProcurementController {

	private static final Set<String> ACTIVE_TENDER = Set.of("PUBLISHED", "BIDDING_CLOSED", "EVALUATION");
	private static final Set<String> PENDING_TENDER = Set.of("DRAFT", "PUBLISHED", "BIDDING_CLOSED", "EVALUATION");

	private final ProcTenderRepository tenderRepository;
	private final ProcBidRepository bidRepository;
	private final ProcVendorRepository vendorRepository;
	private final ProcContractRepository contractRepository;
	private final ProcSpendRecordRepository spendRecordRepository;
	private final ProcLedgerEventRepository ledgerEventRepository;
	private final ProcRiskAlertRepository riskAlertRepository;
	private final ProcAiInsightRepository aiInsightRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public ProcurementController(
			ProcTenderRepository tenderRepository,
			ProcBidRepository bidRepository,
			ProcVendorRepository vendorRepository,
			ProcContractRepository contractRepository,
			ProcSpendRecordRepository spendRecordRepository,
			ProcLedgerEventRepository ledgerEventRepository,
			ProcRiskAlertRepository riskAlertRepository,
			ProcAiInsightRepository aiInsightRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.tenderRepository = tenderRepository;
		this.bidRepository = bidRepository;
		this.vendorRepository = vendorRepository;
		this.contractRepository = contractRepository;
		this.spendRecordRepository = spendRecordRepository;
		this.ledgerEventRepository = ledgerEventRepository;
		this.riskAlertRepository = riskAlertRepository;
		this.aiInsightRepository = aiInsightRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping("/dashboard")
	public Map<String, Object> dashboard() {
		securityUtils.requireProcurement();

		List<ProcTender> tenders = tenderRepository.findAll();
		long activeTenders = tenders.stream().filter(t -> ACTIVE_TENDER.contains(upper(t.getStatus()))).count();
		long awardedCount = tenders.stream().filter(t -> "AWARDED".equalsIgnoreCase(t.getStatus())).count();
		long pendingCount = tenders.stream().filter(t -> PENDING_TENDER.contains(upper(t.getStatus()))).count();
		BigDecimal tenderValueTotal = tenders.stream()
				.map(t -> nz(t.getEstimatedValue()))
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		List<ProcVendor> vendors = vendorRepository.findAll();
		double avgVendorScore = vendors.isEmpty()
				? 0.0
				: round1(vendors.stream()
						.mapToInt(v -> v.getPerformanceScore() == null ? 0 : v.getPerformanceScore())
						.average()
						.orElse(0.0));

		BigDecimal procurementSavings = spendRecordRepository.findAll().stream()
				.map(s -> nz(s.getSavingsAmount()))
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		long compliantVendors = vendors.stream()
				.filter(v -> v.getComplianceScore() != null && v.getComplianceScore() >= 70)
				.count();
		double complianceRateHint = vendors.isEmpty()
				? 0.0
				: round1((compliantVendors * 100.0) / vendors.size());

		long riskAlertCount = riskAlertRepository.findAll().stream()
				.filter(a -> "OPEN".equalsIgnoreCase(a.getStatus()))
				.count();
		long ledgerEventCount = ledgerEventRepository.count();

		Map<String, Long> statusDistribution = new TreeMap<>();
		for (ProcTender t : tenders) {
			String status = upper(t.getStatus());
			if (status.isBlank()) {
				status = "UNKNOWN";
			}
			statusDistribution.merge(status, 1L, Long::sum);
		}

		Map<String, Object> map = new LinkedHashMap<>();
		map.put("activeTenders", activeTenders);
		map.put("tenderValueTotal", tenderValueTotal);
		map.put("awardedCount", awardedCount);
		map.put("pendingCount", pendingCount);
		map.put("avgVendorScore", avgVendorScore);
		map.put("procurementSavings", procurementSavings);
		map.put("complianceRateHint", complianceRateHint);
		map.put("riskAlertCount", riskAlertCount);
		map.put("ledgerEventCount", ledgerEventCount);
		map.put("statusDistribution", statusDistribution);
		map.put("recentTenders", tenderRepository.findTop5ByOrderByCreatedAtDesc().stream()
				.map(responseMapper::procTender)
				.toList());
		map.put("openAlerts", riskAlertRepository.findTop5ByStatusIgnoreCaseOrderByCreatedAtDesc("OPEN").stream()
				.map(responseMapper::procRiskAlert)
				.toList());
		map.put("recentInsights", aiInsightRepository.findTop3ByOrderByCreatedAtDesc().stream()
				.map(responseMapper::procAiInsight)
				.toList());
		map.put("bidCount", bidRepository.count());
		map.put("contractCount", contractRepository.count());
		map.put("vendorCount", vendors.size());
		return map;
	}

	@GetMapping("/reports/summary")
	public Map<String, Object> reportsSummary() {
		securityUtils.requireProcurement();

		List<ProcTender> tenders = tenderRepository.findAll();
		List<ProcSpendRecord> spend = spendRecordRepository.findAll();
		BigDecimal spendTotal = spend.stream().map(s -> nz(s.getAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
		BigDecimal budgetTotal = spend.stream().map(s -> nz(s.getBudgetAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
		BigDecimal savingsTotal = spend.stream().map(s -> nz(s.getSavingsAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);

		Map<String, Object> byCategory = new LinkedHashMap<>();
		Map<String, BigDecimal[]> categoryAgg = new LinkedHashMap<>();
		for (ProcSpendRecord row : spend) {
			String cat = row.getCategory() == null || row.getCategory().isBlank() ? "Uncategorised" : row.getCategory();
			BigDecimal[] agg = categoryAgg.computeIfAbsent(cat, k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO});
			agg[0] = agg[0].add(nz(row.getAmount()));
			agg[1] = agg[1].add(nz(row.getBudgetAmount()));
			agg[2] = agg[2].add(nz(row.getSavingsAmount()));
		}
		for (Map.Entry<String, BigDecimal[]> entry : categoryAgg.entrySet()) {
			Map<String, Object> row = new LinkedHashMap<>();
			row.put("amount", entry.getValue()[0]);
			row.put("budgetAmount", entry.getValue()[1]);
			row.put("savingsAmount", entry.getValue()[2]);
			byCategory.put(entry.getKey(), row);
		}

		Map<String, Object> result = new LinkedHashMap<>();
		result.put("tenderCount", tenders.size());
		result.put("awardedTenders", tenders.stream().filter(t -> "AWARDED".equalsIgnoreCase(t.getStatus())).count());
		result.put("publishedTenders", tenders.stream().filter(t -> "PUBLISHED".equalsIgnoreCase(t.getStatus())).count());
		result.put("evaluationTenders", tenders.stream().filter(t -> "EVALUATION".equalsIgnoreCase(t.getStatus())).count());
		result.put("bidCount", bidRepository.count());
		result.put("vendorCount", vendorRepository.count());
		result.put("contractCount", contractRepository.count());
		result.put("activeContracts", contractRepository.findAll().stream()
				.filter(c -> "ACTIVE".equalsIgnoreCase(c.getStatus()) || "MILESTONE_PENDING".equalsIgnoreCase(c.getStatus()))
				.count());
		result.put("spendTotal", spendTotal);
		result.put("budgetTotal", budgetTotal);
		result.put("savingsTotal", savingsTotal);
		result.put("openRiskAlerts", riskAlertRepository.findAll().stream()
				.filter(a -> "OPEN".equalsIgnoreCase(a.getStatus()))
				.count());
		result.put("ledgerEventCount", ledgerEventRepository.count());
		result.put("spendByCategory", byCategory);
		return result;
	}

	private static BigDecimal nz(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}

	private static String upper(String value) {
		return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
	}

	private static double round1(double value) {
		return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
	}
}

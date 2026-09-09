package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.ProcAiInsight;
import za.gov.mpumalanga.rfh.entity.ProcBid;
import za.gov.mpumalanga.rfh.entity.ProcSpendRecord;
import za.gov.mpumalanga.rfh.entity.ProcTender;
import za.gov.mpumalanga.rfh.entity.ProcVendor;
import za.gov.mpumalanga.rfh.repository.ProcAiInsightRepository;
import za.gov.mpumalanga.rfh.repository.ProcBidRepository;
import za.gov.mpumalanga.rfh.repository.ProcSpendRecordRepository;
import za.gov.mpumalanga.rfh.repository.ProcTenderRepository;
import za.gov.mpumalanga.rfh.repository.ProcVendorRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/procurement/insights")
public class ProcurementInsightsController {

	private static final Set<String> OPEN_TENDER = Set.of("PUBLISHED", "BIDDING_CLOSED", "EVALUATION");

	private final ProcAiInsightRepository aiInsightRepository;
	private final ProcTenderRepository tenderRepository;
	private final ProcBidRepository bidRepository;
	private final ProcVendorRepository vendorRepository;
	private final ProcSpendRecordRepository spendRecordRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public ProcurementInsightsController(
			ProcAiInsightRepository aiInsightRepository,
			ProcTenderRepository tenderRepository,
			ProcBidRepository bidRepository,
			ProcVendorRepository vendorRepository,
			ProcSpendRecordRepository spendRecordRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.aiInsightRepository = aiInsightRepository;
		this.tenderRepository = tenderRepository;
		this.bidRepository = bidRepository;
		this.vendorRepository = vendorRepository;
		this.spendRecordRepository = spendRecordRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requireProcurement();
		return aiInsightRepository.findAllByOrderByCreatedAtDesc().stream()
				.map(responseMapper::procAiInsight)
				.toList();
	}

	@PostMapping("/generate")
	public Map<String, Object> generate() {
		securityUtils.requireProcurement();
		List<ProcAiInsight> created = new ArrayList<>();

		List<ProcTender> openTenders = tenderRepository.findAll().stream()
				.filter(t -> OPEN_TENDER.contains(upper(t.getStatus())))
				.toList();
		if (!openTenders.isEmpty()) {
			ProcTender focus = openTenders.get(0);
			created.add(saveInsight(
					"DEMAND",
					"Demand hint for " + focus.getCategory(),
					"Procurement assistant notes sustained demand in " + focus.getCategory()
							+ " based on open tender " + focus.getReferenceNumber()
							+ ". Consider consolidating related requisitions before award.",
					0.78,
					"ProcTender",
					focus.getId()));
		}

		for (ProcTender tender : openTenders) {
			List<ProcBid> bids = bidRepository.findByTenderIdOrderBySubmittedAtDesc(tender.getId());
			for (ProcBid bid : bids) {
				if (bid.getVendorId() == null) {
					continue;
				}
				ProcVendor vendor = vendorRepository.findById(bid.getVendorId()).orElse(null);
				if (vendor != null && "HIGH".equalsIgnoreCase(vendor.getRiskRating())) {
					created.add(saveInsight(
							"RISK",
							"High-risk supplier on open tender",
							"Vendor " + vendor.getName() + " (risk HIGH) has a bid on tender "
									+ tender.getReferenceNumber()
									+ ". Apply enhanced due diligence before evaluation.",
							0.86,
							"ProcVendor",
							vendor.getId()));
					break;
				}
			}
		}

		for (ProcSpendRecord spend : spendRecordRepository.findAll()) {
			BigDecimal amount = nz(spend.getAmount());
			BigDecimal budget = nz(spend.getBudgetAmount());
			if (budget.compareTo(BigDecimal.ZERO) > 0 && amount.compareTo(budget) > 0) {
				created.add(saveInsight(
						"SPEND",
						"Spend above budget in " + spend.getCategory(),
						"Category " + spend.getCategory() + " recorded spend of R " + amount
								+ " against budget R " + budget + " for period "
								+ (spend.getPeriodLabel() == null ? "current" : spend.getPeriodLabel())
								+ ". Review commitments and savings opportunities.",
						0.81,
						"ProcSpendRecord",
						spend.getId()));
				break;
			}
		}

		List<ProcBid> scored = bidRepository.findAll().stream()
				.filter(b -> "SCORED".equalsIgnoreCase(b.getStatus()) && b.getTotalScore() != null)
				.sorted(Comparator.comparing(ProcBid::getTotalScore).reversed())
				.toList();
		if (!scored.isEmpty()) {
			ProcBid best = scored.get(0);
			created.add(saveInsight(
					"BID_EVAL",
					"Bid recommendation",
					"Procurement assistant recommends reviewing bid from " + best.getVendorName()
							+ " (total score " + best.getTotalScore()
							+ ") as the strongest scored proposal currently on file.",
					0.74,
					"ProcBid",
					best.getId()));
			created.add(saveInsight(
					"RECOMMENDATION",
					"Next procurement action",
					"Confirm evaluation panel notes, validate sealed-hash integrity on opened bids, "
							+ "and prepare a draft award pack for the highest-scoring compliant supplier.",
					0.7,
					"ProcBid",
					best.getId()));
		} else {
			created.add(saveInsight(
					"SUPPLIER",
					"Supplier readiness",
					"No scored bids are available yet. Focus on prequalifying active suppliers and "
							+ "completing sealed bid opening after closing dates.",
					0.68,
					"ProcVendor",
					null));
		}

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("assistant", true);
		response.put("source", "Procurement assistant");
		response.put("note", "Rule-based insights only; not an external AI vendor and not a live blockchain network.");
		response.put("generated", created.size());
		response.put("insights", created.stream().map(responseMapper::procAiInsight).toList());
		return response;
	}

	private ProcAiInsight saveInsight(
			String type,
			String title,
			String body,
			double confidence,
			String relatedType,
			Long relatedId) {
		ProcAiInsight insight = new ProcAiInsight();
		insight.setInsightType(type);
		insight.setTitle(title);
		insight.setBody(body);
		insight.setConfidence(confidence);
		insight.setRelatedEntityType(relatedType);
		insight.setRelatedEntityId(relatedId);
		return aiInsightRepository.save(insight);
	}

	private static BigDecimal nz(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}

	private static String upper(String value) {
		return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
	}
}

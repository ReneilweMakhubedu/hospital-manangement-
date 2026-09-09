package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
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
import za.gov.mpumalanga.rfh.entity.ProcBid;
import za.gov.mpumalanga.rfh.entity.ProcContract;
import za.gov.mpumalanga.rfh.entity.ProcLedgerEvent;
import za.gov.mpumalanga.rfh.entity.ProcTender;
import za.gov.mpumalanga.rfh.entity.ProcVendor;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.ProcBidRepository;
import za.gov.mpumalanga.rfh.repository.ProcContractRepository;
import za.gov.mpumalanga.rfh.repository.ProcTenderRepository;
import za.gov.mpumalanga.rfh.repository.ProcVendorRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.ProcLedgerService;

@RestController
@RequestMapping("/api/procurement/tenders")
public class ProcurementTendersController {

	private static final Set<String> STATUSES = Set.of(
			"DRAFT", "PUBLISHED", "BIDDING_CLOSED", "EVALUATION", "AWARDED", "CANCELLED");

	private final ProcTenderRepository tenderRepository;
	private final ProcBidRepository bidRepository;
	private final ProcVendorRepository vendorRepository;
	private final ProcContractRepository contractRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final ProcLedgerService ledgerService;

	public ProcurementTendersController(
			ProcTenderRepository tenderRepository,
			ProcBidRepository bidRepository,
			ProcVendorRepository vendorRepository,
			ProcContractRepository contractRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			ProcLedgerService ledgerService) {
		this.tenderRepository = tenderRepository;
		this.bidRepository = bidRepository;
		this.vendorRepository = vendorRepository;
		this.contractRepository = contractRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.ledgerService = ledgerService;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requireProcurement();
		return tenderRepository.findAllByOrderByCreatedAtDesc().stream()
				.map(responseMapper::procTender)
				.toList();
	}

	@GetMapping("/{id}")
	public Map<String, Object> get(@PathVariable Long id) {
		securityUtils.requireProcurement();
		ProcTender tender = tenderRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Tender not found"));
		return responseMapper.procTender(tender);
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireProcurement();
		ProcTender tender = new ProcTender();
		applyFields(tender, body, true, auth);
		tender = tenderRepository.save(tender);
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.procTender(tender));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireProcurement();
		ProcTender tender = tenderRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Tender not found"));
		applyFields(tender, body, false, auth);
		tender = tenderRepository.save(tender);
		return responseMapper.procTender(tender);
	}

	@PostMapping("/{id}/publish")
	public Map<String, Object> publish(@PathVariable Long id) {
		AuthUser auth = securityUtils.requireProcurement();
		ProcTender tender = tenderRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Tender not found"));
		if (!"DRAFT".equalsIgnoreCase(tender.getStatus()) && !"CANCELLED".equalsIgnoreCase(tender.getStatus())) {
			throw new ApiException(400, "Only draft or cancelled tenders can be published");
		}
		tender.setStatus("PUBLISHED");
		tender.setPublishedAt(Instant.now());
		if (tender.getClosingAt() == null) {
			tender.setClosingAt(Instant.now().plusSeconds(14L * 24 * 3600));
		}
		tender = tenderRepository.save(tender);
		ledgerService.append(auth, "BID_OPEN", "ProcTender", tender.getId(),
				"Tender published for bidding: " + tender.getReferenceNumber());
		return responseMapper.procTender(tender);
	}

	@PostMapping("/{id}/close-bidding")
	public Map<String, Object> closeBidding(@PathVariable Long id) {
		AuthUser auth = securityUtils.requireProcurement();
		ProcTender tender = tenderRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Tender not found"));
		if (!"PUBLISHED".equalsIgnoreCase(tender.getStatus())) {
			throw new ApiException(400, "Only published tenders can close bidding");
		}
		tender.setStatus("BIDDING_CLOSED");
		tender = tenderRepository.save(tender);
		ledgerService.append(auth, "BID_OPEN", "ProcTender", tender.getId(),
				"Bidding closed: " + tender.getReferenceNumber());
		tender.setStatus("EVALUATION");
		tender = tenderRepository.save(tender);
		ledgerService.append(auth, "EVALUATION", "ProcTender", tender.getId(),
				"Tender moved to evaluation: " + tender.getReferenceNumber());
		return responseMapper.procTender(tender);
	}

	@PostMapping("/{id}/award")
	public Map<String, Object> award(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireProcurement();
		ProcTender tender = tenderRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Tender not found"));
		String status = upper(tender.getStatus());
		if (!Set.of("BIDDING_CLOSED", "EVALUATION", "PUBLISHED").contains(status)) {
			throw new ApiException(400, "Tender is not eligible for award");
		}
		Long vendorId = asLong(body.get("vendorId"));
		if (vendorId == null) {
			throw new ApiException(400, "vendorId is required");
		}
		ProcVendor vendor = vendorRepository.findById(vendorId)
				.orElseThrow(() -> new ApiException(404, "Vendor not found"));
		Long bidId = asLong(body.get("bidId"));
		ProcBid winningBid = null;
		if (bidId != null) {
			winningBid = bidRepository.findById(bidId)
					.orElseThrow(() -> new ApiException(404, "Bid not found"));
			if (!tender.getId().equals(winningBid.getTenderId())) {
				throw new ApiException(400, "Bid does not belong to this tender");
			}
			if (!vendorId.equals(winningBid.getVendorId())) {
				throw new ApiException(400, "vendorId does not match selected bid");
			}
		}

		Double awardScore = winningBid != null ? winningBid.getTotalScore() : asDouble(body.get("awardScore"));
		tender.setStatus("AWARDED");
		tender.setAwardedVendorId(vendorId);
		tender.setAwardScore(awardScore);
		tender = tenderRepository.save(tender);

		if (winningBid != null) {
			winningBid.setStatus("AWARDED");
			bidRepository.save(winningBid);
			for (ProcBid bid : bidRepository.findByTenderIdOrderBySubmittedAtDesc(tender.getId())) {
				if (!bid.getId().equals(winningBid.getId()) && !"REJECTED".equalsIgnoreCase(bid.getStatus())) {
					bid.setStatus("REJECTED");
					bidRepository.save(bid);
				}
			}
		}

		ProcContract contract = new ProcContract();
		contract.setReferenceNumber("CTR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		contract.setTenderId(tender.getId());
		contract.setVendorId(vendorId);
		contract.setVendorName(vendor.getName());
		contract.setTitle(tender.getTitle());
		contract.setValue(winningBid != null ? winningBid.getBidAmount() : tender.getEstimatedValue());
		contract.setStartDate(LocalDate.now());
		contract.setEndDate(LocalDate.now().plusYears(1));
		contract.setStatus("DRAFT");
		contract.setMilestoneCount(4);
		contract.setMilestonesCompleted(0);
		contract = contractRepository.save(contract);

		ProcLedgerEvent awardEvent = ledgerService.append(auth, "AWARD", "ProcTender", tender.getId(),
				"Awarded to " + vendor.getName() + " (" + tender.getReferenceNumber() + ")");
		ProcLedgerEvent contractEvent = ledgerService.append(auth, "CONTRACT", "ProcContract", contract.getId(),
				"Draft contract created from award " + tender.getReferenceNumber());
		contract.setLedgerHash(contractEvent.getPayloadHash());
		contractRepository.save(contract);

		Map<String, Object> response = responseMapper.procTender(tender);
		response.put("contract", responseMapper.procContract(contract));
		response.put("awardLedgerHash", awardEvent.getPayloadHash());
		return response;
	}

	private void applyFields(ProcTender tender, Map<String, Object> body, boolean creating, AuthUser auth) {
		if (creating || body.containsKey("referenceNumber")) {
			String ref = blankToNull(str(body.get("referenceNumber")));
			if (ref == null && creating) {
				ref = "TND-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
			}
			if (ref != null) {
				tender.setReferenceNumber(ref);
			}
		}
		if (creating || body.containsKey("title")) {
			tender.setTitle(requireText(str(body.get("title")), "title").trim());
		}
		if (creating || body.containsKey("description")) {
			tender.setDescription(blankToNull(str(body.get("description"))));
		}
		if (creating || body.containsKey("category")) {
			tender.setCategory(requireText(str(body.get("category")), "category").trim());
		}
		if (creating || body.containsKey("estimatedValue")) {
			tender.setEstimatedValue(asBigDecimal(body.get("estimatedValue"), BigDecimal.ZERO));
		}
		if (creating || body.containsKey("evaluationCriteria")) {
			tender.setEvaluationCriteria(blankToNull(str(body.get("evaluationCriteria"))));
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "DRAFT"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!STATUSES.contains(status)) {
				throw new ApiException(400, "Invalid tender status");
			}
			tender.setStatus(status);
		}
		if (body.containsKey("publishedAt")) {
			tender.setPublishedAt(parseInstant(body.get("publishedAt"), "publishedAt"));
		}
		if (body.containsKey("closingAt") || creating) {
			if (body.containsKey("closingAt")) {
				tender.setClosingAt(parseInstant(body.get("closingAt"), "closingAt"));
			}
		}
		if (body.containsKey("awardedVendorId")) {
			tender.setAwardedVendorId(asLong(body.get("awardedVendorId")));
		}
		if (body.containsKey("awardScore")) {
			tender.setAwardScore(asDouble(body.get("awardScore")));
		}
		if (creating && (tender.getCreatedBy() == null || tender.getCreatedBy().isBlank())) {
			tender.setCreatedBy("procurement");
		}
		if (creating || body.containsKey("createdBy")) {
			String createdBy = blankToNull(str(body.get("createdBy")));
			if (createdBy != null) {
				tender.setCreatedBy(createdBy);
			} else if (creating && auth != null) {
				tender.setCreatedBy("user:" + auth.id());
			}
		}
	}

	private static Instant parseInstant(Object value, String label) {
		String raw = str(value);
		if (blank(raw)) {
			return null;
		}
		try {
			return Instant.parse(raw.trim());
		} catch (Exception ex) {
			throw new ApiException(400, label + " must be an ISO-8601 instant");
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
			throw new ApiException(400, "Invalid id value");
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
			throw new ApiException(400, "Invalid score value");
		}
	}

	private static String upper(String value) {
		return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
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

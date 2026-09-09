package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
import java.time.Instant;
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
import za.gov.mpumalanga.rfh.entity.ProcBid;
import za.gov.mpumalanga.rfh.entity.ProcTender;
import za.gov.mpumalanga.rfh.entity.ProcVendor;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.ProcBidRepository;
import za.gov.mpumalanga.rfh.repository.ProcTenderRepository;
import za.gov.mpumalanga.rfh.repository.ProcVendorRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.ProcLedgerService;
import za.gov.mpumalanga.rfh.util.HashUtil;

@RestController
@RequestMapping("/api/procurement/bids")
public class ProcurementBidsController {

	private static final Set<String> OPENABLE_TENDER = Set.of("BIDDING_CLOSED", "EVALUATION", "AWARDED");

	private final ProcBidRepository bidRepository;
	private final ProcTenderRepository tenderRepository;
	private final ProcVendorRepository vendorRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final ProcLedgerService ledgerService;

	public ProcurementBidsController(
			ProcBidRepository bidRepository,
			ProcTenderRepository tenderRepository,
			ProcVendorRepository vendorRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			ProcLedgerService ledgerService) {
		this.bidRepository = bidRepository;
		this.tenderRepository = tenderRepository;
		this.vendorRepository = vendorRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.ledgerService = ledgerService;
	}

	@GetMapping
	public List<Map<String, Object>> list(@RequestParam(required = false) Long tenderId) {
		securityUtils.requireProcurement();
		List<ProcBid> bids = tenderId == null
				? bidRepository.findAllByOrderBySubmittedAtDesc()
				: bidRepository.findByTenderIdOrderBySubmittedAtDesc(tenderId);
		return bids.stream().map(responseMapper::procBid).toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> submit(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireProcurement();
		Long tenderId = asLong(body.get("tenderId"));
		if (tenderId == null) {
			throw new ApiException(400, "tenderId is required");
		}
		ProcTender tender = tenderRepository.findById(tenderId)
				.orElseThrow(() -> new ApiException(404, "Tender not found"));
		if (!"PUBLISHED".equalsIgnoreCase(tender.getStatus())) {
			throw new ApiException(400, "Bids can only be submitted while tender is published");
		}
		Long vendorId = asLong(body.get("vendorId"));
		if (vendorId == null) {
			throw new ApiException(400, "vendorId is required");
		}
		ProcVendor vendor = vendorRepository.findById(vendorId)
				.orElseThrow(() -> new ApiException(404, "Vendor not found"));

		BigDecimal bidAmount = asBigDecimal(body.get("bidAmount"), null);
		if (bidAmount == null) {
			throw new ApiException(400, "bidAmount is required");
		}
		String proposal = blankToNull(str(body.get("proposalSummary")));
		String vendorName = blankToNull(str(body.get("vendorName")));
		if (vendorName == null) {
			vendorName = vendor.getName();
		}

		Instant submittedAt = Instant.now();
		String sealPayload = tenderId + "|" + vendorId + "|" + bidAmount.toPlainString() + "|"
				+ nullToEmpty(proposal) + "|" + submittedAt;
		String sealedHash = HashUtil.sha256Hex(sealPayload);

		ProcBid bid = new ProcBid();
		bid.setTenderId(tenderId);
		bid.setVendorId(vendorId);
		bid.setVendorName(vendorName);
		bid.setBidAmount(bidAmount);
		bid.setProposalSummary(proposal);
		bid.setStatus("SEALED");
		bid.setSubmittedAt(submittedAt);
		bid.setSealedHash(sealedHash);
		bid = bidRepository.save(bid);

		ledgerService.append(auth, "BID_SUBMIT", "ProcBid", bid.getId(),
				"Sealed bid submitted for " + tender.getReferenceNumber() + " by " + vendorName);
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.procBid(bid));
	}

	@PutMapping("/{id}/open")
	public Map<String, Object> open(@PathVariable Long id) {
		AuthUser auth = securityUtils.requireProcurement();
		ProcBid bid = bidRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Bid not found"));
		ProcTender tender = tenderRepository.findById(bid.getTenderId())
				.orElseThrow(() -> new ApiException(404, "Tender not found"));
		if (!OPENABLE_TENDER.contains(upper(tender.getStatus()))) {
			throw new ApiException(400, "Bids may only be opened after tender bidding is closed");
		}
		if (!"SEALED".equalsIgnoreCase(bid.getStatus()) && !"SUBMITTED".equalsIgnoreCase(bid.getStatus())) {
			throw new ApiException(400, "Only sealed or submitted bids can be opened");
		}
		bid.setStatus("OPENED");
		bid.setOpenedAt(Instant.now());
		bid = bidRepository.save(bid);
		ledgerService.append(auth, "BID_OPEN", "ProcBid", bid.getId(),
				"Bid opened for tender " + tender.getReferenceNumber());
		return responseMapper.procBid(bid);
	}

	@PutMapping("/{id}/score")
	public Map<String, Object> score(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireProcurement();
		ProcBid bid = bidRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Bid not found"));
		if (!Set.of("OPENED", "SCORED").contains(upper(bid.getStatus()))) {
			throw new ApiException(400, "Bid must be opened before scoring");
		}
		Double technical = asDouble(body.get("technicalScore"));
		Double price = asDouble(body.get("priceScore"));
		if (technical == null || price == null) {
			throw new ApiException(400, "technicalScore and priceScore are required");
		}
		Double total = asDouble(body.get("totalScore"));
		if (total == null) {
			total = (technical * 0.6) + (price * 0.4);
		}
		bid.setTechnicalScore(technical);
		bid.setPriceScore(price);
		bid.setTotalScore(total);
		bid.setStatus("SCORED");
		bid = bidRepository.save(bid);
		ledgerService.append(auth, "EVALUATION", "ProcBid", bid.getId(),
				"Bid scored total=" + total);
		return responseMapper.procBid(bid);
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

	private static String blankToNull(String value) {
		return blank(value) ? null : value.trim();
	}

	private static String nullToEmpty(String value) {
		return value == null ? "" : value;
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}
}

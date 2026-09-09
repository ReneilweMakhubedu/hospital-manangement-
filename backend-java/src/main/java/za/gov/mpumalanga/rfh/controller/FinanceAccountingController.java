package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.FixedAsset;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.FixedAssetRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/finance/accounting")
public class FinanceAccountingController {

	private static final Set<String> STATUSES = Set.of("ACTIVE", "DISPOSED", "TRANSFER");

	private final FixedAssetRepository fixedAssetRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public FinanceAccountingController(
			FixedAssetRepository fixedAssetRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.fixedAssetRepository = fixedAssetRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping("/assets")
	public List<Map<String, Object>> listAssets() {
		securityUtils.requireFinance();
		return fixedAssetRepository.findAllByOrderByCreatedAtDesc().stream()
				.map(responseMapper::fixedAsset)
				.toList();
	}

	@PostMapping("/assets")
	public ResponseEntity<Map<String, Object>> createAsset(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireFinance();
		FixedAsset asset = new FixedAsset();
		applyAsset(asset, body, true);
		asset = fixedAssetRepository.save(asset);
		auditService.log(auth, "CREATE", "FixedAsset", asset.getId(), asset.getAssetTag());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.fixedAsset(asset));
	}

	@PutMapping("/assets/{id}")
	public Map<String, Object> updateAsset(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireFinance();
		FixedAsset asset = fixedAssetRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Asset not found"));
		applyAsset(asset, body, false);
		asset = fixedAssetRepository.save(asset);
		auditService.log(auth, "UPDATE", "FixedAsset", asset.getId(), asset.getStatus());
		return responseMapper.fixedAsset(asset);
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		securityUtils.requireFinance();
		BigDecimal acquisitionTotal = BigDecimal.ZERO;
		BigDecimal bookValueTotal = BigDecimal.ZERO;
		long activeCount = 0;
		long disposedCount = 0;
		for (FixedAsset asset : fixedAssetRepository.findAll()) {
			acquisitionTotal = acquisitionTotal.add(asset.getAcquisitionCost() == null ? BigDecimal.ZERO : asset.getAcquisitionCost());
			bookValueTotal = bookValueTotal.add(asset.getBookValue() == null ? BigDecimal.ZERO : asset.getBookValue());
			String status = asset.getStatus() == null ? "" : asset.getStatus().toUpperCase(Locale.ROOT);
			if ("ACTIVE".equals(status)) {
				activeCount++;
			} else if ("DISPOSED".equals(status)) {
				disposedCount++;
			}
		}
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("assetCount", fixedAssetRepository.count());
		result.put("activeCount", activeCount);
		result.put("disposedCount", disposedCount);
		result.put("acquisitionTotal", acquisitionTotal);
		result.put("bookValueTotal", bookValueTotal);
		return result;
	}

	private void applyAsset(FixedAsset asset, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("assetTag")) {
			asset.setAssetTag(requireText(str(body.get("assetTag")), "assetTag").trim());
		}
		if (creating || body.containsKey("name")) {
			asset.setName(requireText(str(body.get("name")), "name").trim());
		}
		if (creating || body.containsKey("category")) {
			asset.setCategory(requireText(str(body.get("category")), "category").trim());
		}
		if (creating || body.containsKey("acquisitionDate")) {
			asset.setAcquisitionDate(parseDate(str(body.get("acquisitionDate")), creating));
		}
		if (creating || body.containsKey("acquisitionCost")) {
			BigDecimal cost = asBigDecimal(body.get("acquisitionCost"), null);
			if (cost == null) {
				throw new ApiException(400, "acquisitionCost is required");
			}
			asset.setAcquisitionCost(cost);
			if (creating && !body.containsKey("bookValue")) {
				asset.setBookValue(cost);
			}
		}
		if (creating || body.containsKey("bookValue")) {
			asset.setBookValue(asBigDecimal(body.get("bookValue"), asset.getAcquisitionCost()));
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "ACTIVE"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!STATUSES.contains(status)) {
				throw new ApiException(400, "status must be ACTIVE, DISPOSED, or TRANSFER");
			}
			asset.setStatus(status);
		}
		if (creating || body.containsKey("department")) {
			asset.setDepartment(requireText(str(body.get("department")), "department").trim());
		}
	}

	private static LocalDate parseDate(String value, boolean creating) {
		if (value == null || value.isBlank()) {
			if (creating) {
				return LocalDate.now();
			}
			return null;
		}
		try {
			return LocalDate.parse(value.trim());
		} catch (Exception ex) {
			throw new ApiException(400, "acquisitionDate must be yyyy-MM-dd");
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

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}
}

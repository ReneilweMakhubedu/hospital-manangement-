package za.gov.mpumalanga.rfh.controller;

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
import za.gov.mpumalanga.rfh.entity.ProcVendor;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.ProcVendorRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/procurement/vendors")
public class ProcurementVendorsController {

	private static final Set<String> STATUSES = Set.of(
			"REGISTERED", "PREQUALIFIED", "ACTIVE", "SUSPENDED", "BLACKLISTED");
	private static final Set<String> RISK = Set.of("LOW", "MEDIUM", "HIGH");

	private final ProcVendorRepository vendorRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public ProcurementVendorsController(
			ProcVendorRepository vendorRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.vendorRepository = vendorRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requireProcurement();
		return vendorRepository.findAllByOrderByCreatedAtDesc().stream()
				.map(responseMapper::procVendor)
				.toList();
	}

	@GetMapping("/scorecard")
	public List<Map<String, Object>> scorecard() {
		securityUtils.requireProcurement();
		return vendorRepository.findAllByOrderByCreatedAtDesc().stream()
				.map(responseMapper::procVendor)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		securityUtils.requireProcurement();
		ProcVendor vendor = new ProcVendor();
		applyFields(vendor, body, true);
		vendor = vendorRepository.save(vendor);
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.procVendor(vendor));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		securityUtils.requireProcurement();
		ProcVendor vendor = vendorRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Vendor not found"));
		applyFields(vendor, body, false);
		vendor = vendorRepository.save(vendor);
		return responseMapper.procVendor(vendor);
	}

	@PostMapping("/{id}/prequalify")
	public Map<String, Object> prequalify(@PathVariable Long id) {
		securityUtils.requireProcurement();
		ProcVendor vendor = vendorRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Vendor not found"));
		if ("BLACKLISTED".equalsIgnoreCase(vendor.getStatus()) || "SUSPENDED".equalsIgnoreCase(vendor.getStatus())) {
			throw new ApiException(400, "Suspended or blacklisted vendors cannot be prequalified");
		}
		vendor.setStatus("PREQUALIFIED");
		if (vendor.getComplianceScore() == null || vendor.getComplianceScore() < 70) {
			vendor.setComplianceScore(75);
		}
		vendor = vendorRepository.save(vendor);
		return responseMapper.procVendor(vendor);
	}

	private void applyFields(ProcVendor vendor, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("name")) {
			vendor.setName(requireText(str(body.get("name")), "name").trim());
		}
		if (creating || body.containsKey("registrationNumber")) {
			vendor.setRegistrationNumber(blankToNull(str(body.get("registrationNumber"))));
		}
		if (creating || body.containsKey("csdNumber")) {
			vendor.setCsdNumber(blankToNull(str(body.get("csdNumber"))));
		}
		if (creating || body.containsKey("category")) {
			vendor.setCategory(requireText(str(body.get("category")), "category").trim());
		}
		if (creating || body.containsKey("contactEmail")) {
			vendor.setContactEmail(blankToNull(str(body.get("contactEmail"))));
		}
		if (creating || body.containsKey("contactPhone")) {
			vendor.setContactPhone(blankToNull(str(body.get("contactPhone"))));
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "REGISTERED"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!STATUSES.contains(status)) {
				throw new ApiException(400, "Invalid vendor status");
			}
			vendor.setStatus(status);
		}
		if (creating || body.containsKey("riskRating")) {
			String risk = creating && blank(str(body.get("riskRating")))
					? "MEDIUM"
					: requireText(str(body.get("riskRating")), "riskRating").trim().toUpperCase(Locale.ROOT);
			if (!RISK.contains(risk)) {
				throw new ApiException(400, "riskRating must be LOW, MEDIUM, or HIGH");
			}
			vendor.setRiskRating(risk);
		}
		if (creating || body.containsKey("performanceScore")) {
			vendor.setPerformanceScore(clampScore(asInt(body.get("performanceScore"), vendor.getPerformanceScore())));
		}
		if (creating || body.containsKey("deliveryScore")) {
			vendor.setDeliveryScore(clampScore(asInt(body.get("deliveryScore"), vendor.getDeliveryScore())));
		}
		if (creating || body.containsKey("qualityScore")) {
			vendor.setQualityScore(clampScore(asInt(body.get("qualityScore"), vendor.getQualityScore())));
		}
		if (creating || body.containsKey("costScore")) {
			vendor.setCostScore(clampScore(asInt(body.get("costScore"), vendor.getCostScore())));
		}
		if (creating || body.containsKey("complianceScore")) {
			vendor.setComplianceScore(clampScore(asInt(body.get("complianceScore"), vendor.getComplianceScore())));
		}
		if (creating || body.containsKey("notes")) {
			vendor.setNotes(blankToNull(str(body.get("notes"))));
		}
	}

	private static Integer clampScore(Integer score) {
		if (score == null) {
			return 50;
		}
		if (score < 1 || score > 100) {
			throw new ApiException(400, "Scores must be between 1 and 100");
		}
		return score;
	}

	private static Integer asInt(Object value, Integer fallback) {
		if (value == null || String.valueOf(value).isBlank()) {
			return fallback == null ? 50 : fallback;
		}
		if (value instanceof Number number) {
			return number.intValue();
		}
		try {
			return Integer.parseInt(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			throw new ApiException(400, "Invalid score");
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

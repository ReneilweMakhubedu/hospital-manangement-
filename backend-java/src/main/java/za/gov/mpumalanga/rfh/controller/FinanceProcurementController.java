package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
import java.time.Instant;
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
import za.gov.mpumalanga.rfh.entity.PurchaseRequisition;
import za.gov.mpumalanga.rfh.entity.Vendor;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.PurchaseRequisitionRepository;
import za.gov.mpumalanga.rfh.repository.VendorRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/finance/procurement")
public class FinanceProcurementController {

	private static final Set<String> REQ_STATUSES = Set.of(
			"DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "ORDERED", "RECEIVED", "CANCELLED");
	private static final Set<String> VENDOR_STATUSES = Set.of("ACTIVE", "SUSPENDED", "BLACKLISTED");

	private final PurchaseRequisitionRepository purchaseRequisitionRepository;
	private final VendorRepository vendorRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public FinanceProcurementController(
			PurchaseRequisitionRepository purchaseRequisitionRepository,
			VendorRepository vendorRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.purchaseRequisitionRepository = purchaseRequisitionRepository;
		this.vendorRepository = vendorRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping("/requisitions")
	public List<Map<String, Object>> listRequisitions() {
		securityUtils.requireFinance();
		return purchaseRequisitionRepository.findAllByOrderByCreatedAtDesc().stream()
				.map(responseMapper::purchaseRequisition)
				.toList();
	}

	@PostMapping("/requisitions")
	public ResponseEntity<Map<String, Object>> createRequisition(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireFinance();
		PurchaseRequisition req = new PurchaseRequisition();
		applyRequisition(req, body, true);
		req = purchaseRequisitionRepository.save(req);
		auditService.log(auth, "CREATE", "PurchaseRequisition", req.getId(), req.getReferenceNumber());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.purchaseRequisition(req));
	}

	@PutMapping("/requisitions/{id}")
	public Map<String, Object> updateRequisition(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireFinance();
		PurchaseRequisition req = purchaseRequisitionRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Requisition not found"));
		String previous = req.getStatus();
		applyRequisition(req, body, false);
		if ("APPROVED".equalsIgnoreCase(req.getStatus()) && !"APPROVED".equalsIgnoreCase(previous) && req.getApprovedAt() == null) {
			req.setApprovedAt(Instant.now());
		}
		req = purchaseRequisitionRepository.save(req);
		auditService.log(auth, "UPDATE", "PurchaseRequisition", req.getId(), req.getStatus());
		return responseMapper.purchaseRequisition(req);
	}

	@GetMapping("/vendors")
	public List<Map<String, Object>> listVendors() {
		securityUtils.requireFinance();
		return vendorRepository.findAllByOrderByCreatedAtDesc().stream()
				.map(responseMapper::vendor)
				.toList();
	}

	@PostMapping("/vendors")
	public ResponseEntity<Map<String, Object>> createVendor(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireFinance();
		Vendor vendor = new Vendor();
		applyVendor(vendor, body, true);
		vendor = vendorRepository.save(vendor);
		auditService.log(auth, "CREATE", "Vendor", vendor.getId(), vendor.getName());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.vendor(vendor));
	}

	@PutMapping("/vendors/{id}")
	public Map<String, Object> updateVendor(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requireFinance();
		Vendor vendor = vendorRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Vendor not found"));
		applyVendor(vendor, body, false);
		vendor = vendorRepository.save(vendor);
		auditService.log(auth, "UPDATE", "Vendor", vendor.getId(), vendor.getStatus());
		return responseMapper.vendor(vendor);
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		securityUtils.requireFinance();
		long openReqs = purchaseRequisitionRepository.findAll().stream()
				.filter(r -> {
					String s = r.getStatus() == null ? "" : r.getStatus().toUpperCase(Locale.ROOT);
					return Set.of("DRAFT", "SUBMITTED", "APPROVED", "ORDERED").contains(s);
				})
				.count();
		BigDecimal openValue = purchaseRequisitionRepository.findAll().stream()
				.filter(r -> {
					String s = r.getStatus() == null ? "" : r.getStatus().toUpperCase(Locale.ROOT);
					return Set.of("SUBMITTED", "APPROVED", "ORDERED").contains(s);
				})
				.map(r -> r.getEstimatedAmount() == null ? BigDecimal.ZERO : r.getEstimatedAmount())
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		long activeVendors = vendorRepository.findAll().stream()
				.filter(v -> "ACTIVE".equalsIgnoreCase(v.getStatus()))
				.count();
		long suspendedVendors = vendorRepository.findAll().stream()
				.filter(v -> "SUSPENDED".equalsIgnoreCase(v.getStatus()) || "BLACKLISTED".equalsIgnoreCase(v.getStatus()))
				.count();
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("openRequisitions", openReqs);
		result.put("openRequisitionValue", openValue);
		result.put("activeVendors", activeVendors);
		result.put("flaggedVendors", suspendedVendors);
		result.put("totalVendors", vendorRepository.count());
		return result;
	}

	private void applyRequisition(PurchaseRequisition req, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("referenceNumber")) {
			String ref = blankToNull(str(body.get("referenceNumber")));
			if (ref == null && creating) {
				ref = "REQ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
			}
			if (ref != null) {
				req.setReferenceNumber(ref);
			}
		}
		if (creating || body.containsKey("requestedBy")) {
			req.setRequestedBy(requireText(str(body.get("requestedBy")), "requestedBy").trim());
		}
		if (creating || body.containsKey("department")) {
			req.setDepartment(requireText(str(body.get("department")), "department").trim());
		}
		if (creating || body.containsKey("description")) {
			req.setDescription(requireText(str(body.get("description")), "description").trim());
		}
		if (creating || body.containsKey("estimatedAmount")) {
			BigDecimal amount = asBigDecimal(body.get("estimatedAmount"), null);
			if (amount == null) {
				throw new ApiException(400, "estimatedAmount is required");
			}
			req.setEstimatedAmount(amount);
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "DRAFT"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!REQ_STATUSES.contains(status)) {
				throw new ApiException(400, "Invalid requisition status");
			}
			req.setStatus(status);
		}
		if (creating || body.containsKey("vendorName")) {
			req.setVendorName(blankToNull(str(body.get("vendorName"))));
		}
		if (body.containsKey("approvedAt")) {
			String approved = str(body.get("approvedAt"));
			if (blank(approved)) {
				req.setApprovedAt(null);
			} else {
				try {
					req.setApprovedAt(Instant.parse(approved.trim()));
				} catch (Exception ex) {
					throw new ApiException(400, "approvedAt must be an ISO-8601 instant");
				}
			}
		}
	}

	private void applyVendor(Vendor vendor, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("name")) {
			vendor.setName(requireText(str(body.get("name")), "name").trim());
		}
		if (creating || body.containsKey("registrationNumber")) {
			vendor.setRegistrationNumber(blankToNull(str(body.get("registrationNumber"))));
		}
		if (creating || body.containsKey("category")) {
			vendor.setCategory(requireText(str(body.get("category")), "category").trim());
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "ACTIVE"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!VENDOR_STATUSES.contains(status)) {
				throw new ApiException(400, "status must be ACTIVE, SUSPENDED, or BLACKLISTED");
			}
			vendor.setStatus(status);
		}
		if (creating || body.containsKey("performanceScore")) {
			Integer score = asInt(body.get("performanceScore"));
			if (score != null && (score < 1 || score > 5)) {
				throw new ApiException(400, "performanceScore must be between 1 and 5");
			}
			vendor.setPerformanceScore(score);
		}
		if (creating || body.containsKey("notes")) {
			vendor.setNotes(blankToNull(str(body.get("notes"))));
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

	private static Integer asInt(Object value) {
		if (value == null || String.valueOf(value).isBlank()) {
			return null;
		}
		if (value instanceof Number number) {
			return number.intValue();
		}
		try {
			return Integer.parseInt(String.valueOf(value).trim());
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

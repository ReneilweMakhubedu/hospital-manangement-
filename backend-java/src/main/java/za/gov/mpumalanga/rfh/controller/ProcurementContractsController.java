package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
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
import za.gov.mpumalanga.rfh.entity.ProcContract;
import za.gov.mpumalanga.rfh.entity.ProcLedgerEvent;
import za.gov.mpumalanga.rfh.entity.ProcVendor;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.ProcContractRepository;
import za.gov.mpumalanga.rfh.repository.ProcVendorRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.ProcLedgerService;

@RestController
@RequestMapping("/api/procurement/contracts")
public class ProcurementContractsController {

	private static final Set<String> STATUSES = Set.of(
			"DRAFT", "ACTIVE", "MILESTONE_PENDING", "COMPLETED", "TERMINATED", "EXPIRED");

	private final ProcContractRepository contractRepository;
	private final ProcVendorRepository vendorRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final ProcLedgerService ledgerService;

	public ProcurementContractsController(
			ProcContractRepository contractRepository,
			ProcVendorRepository vendorRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			ProcLedgerService ledgerService) {
		this.contractRepository = contractRepository;
		this.vendorRepository = vendorRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.ledgerService = ledgerService;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requireProcurement();
		return contractRepository.findAllByOrderByCreatedAtDesc().stream()
				.map(responseMapper::procContract)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireProcurement();
		ProcContract contract = new ProcContract();
		applyFields(contract, body, true);
		contract = contractRepository.save(contract);
		ProcLedgerEvent event = ledgerService.append(auth, "CONTRACT", "ProcContract", contract.getId(),
				"Contract created: " + contract.getReferenceNumber());
		contract.setLedgerHash(event.getPayloadHash());
		contract = contractRepository.save(contract);
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.procContract(contract));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireProcurement();
		ProcContract contract = contractRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Contract not found"));
		applyFields(contract, body, false);
		contract = contractRepository.save(contract);
		ProcLedgerEvent event = ledgerService.append(auth, "AMENDMENT", "ProcContract", contract.getId(),
				"Contract updated: " + contract.getReferenceNumber() + " status=" + contract.getStatus());
		contract.setLedgerHash(event.getPayloadHash());
		contract = contractRepository.save(contract);
		return responseMapper.procContract(contract);
	}

	@PutMapping("/{id}/milestone")
	public Map<String, Object> milestone(@PathVariable Long id) {
		AuthUser auth = securityUtils.requireProcurement();
		ProcContract contract = contractRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Contract not found"));
		int count = contract.getMilestoneCount() == null ? 0 : contract.getMilestoneCount();
		int completed = contract.getMilestonesCompleted() == null ? 0 : contract.getMilestonesCompleted();
		if (count <= 0) {
			throw new ApiException(400, "Contract has no milestones configured");
		}
		if (completed >= count) {
			throw new ApiException(400, "All milestones already completed");
		}
		completed++;
		contract.setMilestonesCompleted(completed);
		if (completed >= count) {
			contract.setStatus("COMPLETED");
		} else {
			contract.setStatus("MILESTONE_PENDING");
		}
		contract = contractRepository.save(contract);
		ProcLedgerEvent event = ledgerService.append(auth, "PAYMENT", "ProcContract", contract.getId(),
				"Milestone " + completed + "/" + count + " completed for " + contract.getReferenceNumber());
		contract.setLedgerHash(event.getPayloadHash());
		contract = contractRepository.save(contract);
		return responseMapper.procContract(contract);
	}

	private void applyFields(ProcContract contract, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("referenceNumber")) {
			String ref = blankToNull(str(body.get("referenceNumber")));
			if (ref == null && creating) {
				ref = "CTR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
			}
			if (ref != null) {
				contract.setReferenceNumber(ref);
			}
		}
		if (creating || body.containsKey("tenderId")) {
			contract.setTenderId(asLong(body.get("tenderId")));
		}
		if (creating || body.containsKey("vendorId")) {
			Long vendorId = asLong(body.get("vendorId"));
			if (creating && vendorId == null) {
				throw new ApiException(400, "vendorId is required");
			}
			if (vendorId != null) {
				contract.setVendorId(vendorId);
				if (!body.containsKey("vendorName") || blank(str(body.get("vendorName")))) {
					ProcVendor vendor = vendorRepository.findById(vendorId).orElse(null);
					if (vendor != null) {
						contract.setVendorName(vendor.getName());
					}
				}
			}
		}
		if (creating || body.containsKey("vendorName")) {
			String name = blankToNull(str(body.get("vendorName")));
			if (name != null) {
				contract.setVendorName(name);
			} else if (creating && blank(contract.getVendorName())) {
				throw new ApiException(400, "vendorName is required");
			}
		}
		if (creating || body.containsKey("title")) {
			contract.setTitle(requireText(str(body.get("title")), "title").trim());
		}
		if (creating || body.containsKey("value")) {
			contract.setValue(asBigDecimal(body.get("value"), BigDecimal.ZERO));
		}
		if (creating || body.containsKey("startDate")) {
			contract.setStartDate(parseDate(body.get("startDate"), "startDate", creating ? LocalDate.now() : contract.getStartDate()));
		}
		if (creating || body.containsKey("endDate")) {
			contract.setEndDate(parseDate(body.get("endDate"), "endDate",
					creating ? LocalDate.now().plusYears(1) : contract.getEndDate()));
		}
		if (creating || body.containsKey("status")) {
			String status = creating && blank(str(body.get("status")))
					? "DRAFT"
					: requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!STATUSES.contains(status)) {
				throw new ApiException(400, "Invalid contract status");
			}
			contract.setStatus(status);
		}
		if (creating || body.containsKey("milestoneCount")) {
			contract.setMilestoneCount(asInt(body.get("milestoneCount"), creating ? 4 : contract.getMilestoneCount()));
		}
		if (creating || body.containsKey("milestonesCompleted")) {
			contract.setMilestonesCompleted(asInt(body.get("milestonesCompleted"), creating ? 0 : contract.getMilestonesCompleted()));
		}
	}

	private static LocalDate parseDate(Object value, String label, LocalDate fallback) {
		String raw = str(value);
		if (blank(raw)) {
			return fallback;
		}
		try {
			return LocalDate.parse(raw.trim());
		} catch (Exception ex) {
			throw new ApiException(400, label + " must be YYYY-MM-DD");
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

	private static Integer asInt(Object value, Integer fallback) {
		if (value == null || String.valueOf(value).isBlank()) {
			return fallback == null ? 0 : fallback;
		}
		if (value instanceof Number number) {
			return number.intValue();
		}
		try {
			return Integer.parseInt(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			throw new ApiException(400, "Invalid integer value");
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

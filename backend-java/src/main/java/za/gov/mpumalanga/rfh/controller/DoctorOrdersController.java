package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
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
import za.gov.mpumalanga.rfh.entity.ClinicalOrder;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.ClinicalOrderRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/doctor/orders")
public class DoctorOrdersController {

	private static final Set<String> ORDER_TYPES = Set.of("LAB", "IMAGING");
	private static final Set<String> PRIORITIES = Set.of("ROUTINE", "URGENT", "STAT");
	private static final Set<String> STATUSES = Set.of("ORDERED", "IN_PROGRESS", "RESULTED", "CANCELLED");

	private final ClinicalOrderRepository clinicalOrderRepository;
	private final UserRepository userRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public DoctorOrdersController(
			ClinicalOrderRepository clinicalOrderRepository,
			UserRepository userRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.clinicalOrderRepository = clinicalOrderRepository;
		this.userRepository = userRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		AuthUser auth = securityUtils.requireDoctor();
		return clinicalOrderRepository.findByDoctorIdOrderByOrderedAtDesc(auth.id()).stream()
				.map(responseMapper::clinicalOrder)
				.toList();
	}

	@GetMapping("/patient/{patientId}")
	public List<Map<String, Object>> forPatient(@PathVariable Long patientId) {
		AuthUser auth = securityUtils.requireDoctor();
		return clinicalOrderRepository.findByDoctorIdAndPatientIdOrderByOrderedAtDesc(auth.id(), patientId).stream()
				.map(responseMapper::clinicalOrder)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireDoctor();
		Long patientId = asLong(body.get("patientId"));
		if (patientId == null || userRepository.findByIdAndRole(patientId, "patient").isEmpty()) {
			throw new ApiException(400, "Select a valid patient");
		}
		String orderType = requireEnum(str(body.get("orderType")), ORDER_TYPES, "orderType");
		String testName = str(body.get("testName"));
		if (testName == null || testName.isBlank()) {
			throw new ApiException(400, "testName is required");
		}
		String priority = str(body.get("priority"));
		if (priority == null || priority.isBlank()) {
			priority = "ROUTINE";
		} else {
			priority = requireEnum(priority, PRIORITIES, "priority");
		}

		ClinicalOrder order = new ClinicalOrder();
		order.setPatientId(patientId);
		order.setDoctorId(auth.id());
		order.setOrderType(orderType);
		order.setTestName(testName.trim());
		order.setPriority(priority);
		order.setClinicalIndication(blankToNull(str(body.get("clinicalIndication"))));
		order.setStatus("ORDERED");
		order.setProviderHint(blankToNull(str(body.get("providerHint"))));
		order.setReferenceNumber(blankToNull(str(body.get("referenceNumber"))));
		if (order.getReferenceNumber() == null) {
			order.setReferenceNumber(nextReference(orderType));
		}
		order = clinicalOrderRepository.save(order);

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("message", "Clinical order created");
		response.put("order", responseMapper.clinicalOrder(order));
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PutMapping("/{id}")
	public Map<String, Object> updateStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireDoctor();
		ClinicalOrder order = clinicalOrderRepository.findByIdAndDoctorId(id, auth.id())
				.orElseThrow(() -> new ApiException(404, "Clinical order not found"));

		if (body.containsKey("status")) {
			order.setStatus(requireEnum(str(body.get("status")), STATUSES, "status"));
		}
		if (body.containsKey("resultSummary")) {
			order.setResultSummary(blankToNull(str(body.get("resultSummary"))));
		}
		if (body.containsKey("providerHint")) {
			order.setProviderHint(blankToNull(str(body.get("providerHint"))));
		}
		if (body.containsKey("priority")) {
			order.setPriority(requireEnum(str(body.get("priority")), PRIORITIES, "priority"));
		}
		if (body.containsKey("clinicalIndication")) {
			order.setClinicalIndication(blankToNull(str(body.get("clinicalIndication"))));
		}
		order.setUpdatedAt(Instant.now());
		return responseMapper.clinicalOrder(clinicalOrderRepository.save(order));
	}

	private String nextReference(String orderType) {
		String day = LocalDate.now().toString().replace("-", "");
		long seq = clinicalOrderRepository.count() + 1;
		String prefix = "LAB".equals(orderType) ? "ORD-LAB" : "ORD-IMG";
		return prefix + "-" + day + "-" + String.format("%04d", seq);
	}

	private static String requireEnum(String value, Set<String> allowed, String field) {
		if (value == null || value.isBlank()) {
			throw new ApiException(400, field + " is required");
		}
		String normalized = value.trim().toUpperCase(Locale.ROOT);
		if (!allowed.contains(normalized)) {
			throw new ApiException(400, field + " must be one of " + allowed);
		}
		return normalized;
	}

	private static String blankToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}

	private static Long asLong(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof Number number) {
			return number.longValue();
		}
		try {
			return Long.parseLong(String.valueOf(value));
		} catch (NumberFormatException ex) {
			return null;
		}
	}
}

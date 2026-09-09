package za.gov.mpumalanga.rfh.controller;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.StaffCertification;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.StaffCertificationRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.PayrollAuditService;

@RestController
@RequestMapping("/api/payroll/certifications")
public class PayrollCertificationsController {

	private static final Set<String> CERT_TYPES = Set.of("HPCSA", "SANC", "OTHER");
	private static final Set<String> STATUSES = Set.of("VALID", "EXPIRING", "EXPIRED");

	private final StaffCertificationRepository certificationRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final PayrollAuditService payrollAuditService;

	public PayrollCertificationsController(
			StaffCertificationRepository certificationRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			PayrollAuditService payrollAuditService) {
		this.certificationRepository = certificationRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.payrollAuditService = payrollAuditService;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		securityUtils.requirePayroll();
		return certificationRepository.findAllByOrderByExpiryDateAsc().stream()
				.map(responseMapper::staffCertification)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		var auth = securityUtils.requirePayroll();
		StaffCertification cert = new StaffCertification();
		applyFields(cert, body, true);
		refreshStatus(cert);
		cert = certificationRepository.save(cert);
		payrollAuditService.log(auth, "CREATE", "StaffCertification", cert.getId(), cert.getLicenceNumber());
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.staffCertification(cert));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		var auth = securityUtils.requirePayroll();
		StaffCertification cert = certificationRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Certification not found"));
		applyFields(cert, body, false);
		if (!body.containsKey("status") || blank(str(body.get("status")))) {
			refreshStatus(cert);
		}
		cert = certificationRepository.save(cert);
		payrollAuditService.log(auth, "UPDATE", "StaffCertification", cert.getId(), cert.getStatus());
		return responseMapper.staffCertification(cert);
	}

	@GetMapping("/expiring")
	public Map<String, Object> expiring(@RequestParam(required = false) Integer days) {
		securityUtils.requirePayroll();
		int window = days == null || days <= 0 ? 90 : days;
		LocalDate horizon = LocalDate.now().plusDays(window);
		List<Map<String, Object>> items = certificationRepository.findAllByOrderByExpiryDateAsc().stream()
				.filter(c -> c.getExpiryDate() != null)
				.filter(c -> !c.getExpiryDate().isBefore(LocalDate.now()))
				.filter(c -> !c.getExpiryDate().isAfter(horizon))
				.map(responseMapper::staffCertification)
				.toList();
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("days", window);
		result.put("count", items.size());
		result.put("items", items);
		return result;
	}

	private void applyFields(StaffCertification cert, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("employeeNumber")) {
			cert.setEmployeeNumber(requireText(str(body.get("employeeNumber")), "employeeNumber").trim());
		}
		if (creating || body.containsKey("employeeName")) {
			cert.setEmployeeName(requireText(str(body.get("employeeName")), "employeeName").trim());
		}
		if (creating || body.containsKey("certType")) {
			String type = creating && blank(str(body.get("certType")))
					? "OTHER"
					: requireText(str(body.get("certType")), "certType").trim().toUpperCase(Locale.ROOT);
			if (!CERT_TYPES.contains(type)) {
				throw new ApiException(400, "certType must be HPCSA, SANC, or OTHER");
			}
			cert.setCertType(type);
		}
		if (creating || body.containsKey("licenceNumber")) {
			cert.setLicenceNumber(requireText(str(body.get("licenceNumber")), "licenceNumber").trim());
		}
		if (creating || body.containsKey("expiryDate")) {
			cert.setExpiryDate(parseDate(str(body.get("expiryDate")), creating ? LocalDate.now().plusYears(1) : cert.getExpiryDate()));
		}
		if (creating || body.containsKey("status")) {
			if (!blank(str(body.get("status")))) {
				String status = requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
				if (!STATUSES.contains(status)) {
					throw new ApiException(400, "status must be VALID, EXPIRING, or EXPIRED");
				}
				cert.setStatus(status);
			}
		}
		if (creating || body.containsKey("department")) {
			cert.setDepartment(requireText(str(body.get("department")), "department").trim());
		}
	}

	private static void refreshStatus(StaffCertification cert) {
		if (cert.getExpiryDate() == null) {
			cert.setStatus("VALID");
			return;
		}
		LocalDate today = LocalDate.now();
		if (cert.getExpiryDate().isBefore(today)) {
			cert.setStatus("EXPIRED");
		} else if (!cert.getExpiryDate().isAfter(today.plusDays(90))) {
			cert.setStatus("EXPIRING");
		} else {
			cert.setStatus("VALID");
		}
	}

	private static LocalDate parseDate(String value, LocalDate fallback) {
		if (value == null || value.isBlank()) {
			return fallback;
		}
		try {
			return LocalDate.parse(value.trim());
		} catch (Exception ex) {
			throw new ApiException(400, "expiryDate must be yyyy-MM-dd");
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

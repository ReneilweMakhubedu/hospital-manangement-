package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.AuditEvent;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.AuditEventRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

	private final AuditEventRepository auditEventRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public AuditController(
			AuditEventRepository auditEventRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.auditEventRepository = auditEventRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public List<Map<String, Object>> list(
			@RequestParam(required = false) String resourceType,
			@RequestParam(required = false) String from,
			@RequestParam(required = false) String to) {
		securityUtils.requireAdmin();
		Instant fromInstant = parseDayStart(from, "from");
		Instant toInstant = parseDayEnd(to, "to");

		List<AuditEvent> events;
		boolean hasType = resourceType != null && !resourceType.isBlank();
		boolean hasRange = fromInstant != null && toInstant != null;

		if (hasType && hasRange) {
			events = auditEventRepository.findByResourceTypeIgnoreCaseAndCreatedAtBetweenOrderByCreatedAtDesc(
					resourceType.trim(), fromInstant, toInstant);
		} else if (hasType) {
			events = auditEventRepository.findByResourceTypeIgnoreCaseOrderByCreatedAtDesc(resourceType.trim());
		} else if (hasRange) {
			events = auditEventRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(fromInstant, toInstant);
		} else if (fromInstant != null || toInstant != null) {
			Instant start = fromInstant != null ? fromInstant : Instant.EPOCH;
			Instant end = toInstant != null ? toInstant : Instant.now().plusSeconds(3600);
			events = auditEventRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end);
		} else {
			events = auditEventRepository.findAllByOrderByCreatedAtDesc();
		}
		return events.stream().map(responseMapper::auditEvent).toList();
	}

	@GetMapping("/recent")
	public List<Map<String, Object>> recent() {
		securityUtils.requireStaff();
		return auditEventRepository.findTop50ByOrderByCreatedAtDesc().stream()
				.map(responseMapper::auditEvent)
				.toList();
	}

	private static Instant parseDayStart(String value, String label) {
		if (value == null || value.isBlank()) {
			return null;
		}
		try {
			return LocalDate.parse(value.trim()).atStartOfDay().toInstant(ZoneOffset.UTC);
		} catch (Exception ex) {
			throw new ApiException(400, label + " must be yyyy-MM-dd");
		}
	}

	private static Instant parseDayEnd(String value, String label) {
		if (value == null || value.isBlank()) {
			return null;
		}
		try {
			return LocalDate.parse(value.trim()).plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC).minusMillis(1);
		} catch (Exception ex) {
			throw new ApiException(400, label + " must be yyyy-MM-dd");
		}
	}
}

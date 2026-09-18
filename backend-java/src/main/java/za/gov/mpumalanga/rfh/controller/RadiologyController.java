package za.gov.mpumalanga.rfh.controller;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.gov.mpumalanga.rfh.entity.ImagingOrder;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.SupportStore;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/radiology")
public class RadiologyController {
	private static final Set<String> MODALITIES = Set.of("XRAY", "CT", "US", "MRI");
	private static final Set<String> PRIORITIES = Set.of("ROUTINE", "URGENT", "STAT");
	private static final Set<String> STATUSES = Set.of("ORDERED", "SCHEDULED", "IN_PROGRESS", "REPORTED", "CANCELLED");
	private final SupportStore store; private final SecurityUtils security;
	public RadiologyController(SupportStore store, SecurityUtils security) { this.store = store; this.security = security; }

	@GetMapping("/dashboard")
	public Map<String, Object> dashboard() {
		security.requireRadiology();
		List<ImagingOrder> rows = store.all(ImagingOrder.class);
		List<ImagingOrder> completed = rows.stream().filter(o -> o.orderedAt != null && o.reportedAt != null).toList();
		double tat = completed.stream().mapToLong(o -> Duration.between(o.orderedAt, o.reportedAt).toMinutes()).average().orElse(0) / 60.0;
		LocalDate today = LocalDate.now();
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("pending", rows.stream().filter(RadiologyController::pending).count());
		result.put("statPending", rows.stream().filter(RadiologyController::pending).filter(o -> "STAT".equalsIgnoreCase(o.priority)).count());
		result.put("avgTatHours", Math.round(tat * 10.0) / 10.0);
		result.put("reportedToday", rows.stream().filter(o -> o.reportedAt != null && LocalDate.ofInstant(o.reportedAt, ZoneId.systemDefault()).equals(today)).count());
		return result;
	}

	@GetMapping("/orders")
	public List<Map<String, Object>> orders() { security.requireRadiology(); return store.all(ImagingOrder.class).stream().map(SupportApi::map).toList(); }

	@PostMapping("/orders")
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		security.requireRadiology();
		ImagingOrder order = SupportApi.apply(new ImagingOrder(), body);
		order.patientName = SupportApi.required(body, "patientName");
		order.studyName = SupportApi.required(body, "studyName");
		order.modality = SupportApi.choice(SupportApi.required(body, "modality"), "modality", MODALITIES);
		order.priority = SupportApi.optionalChoice(body, "priority", PRIORITIES, "ROUTINE");
		order.status = SupportApi.optionalChoice(body, "status", STATUSES, "ORDERED");
		if (order.accessionNumber == null || order.accessionNumber.isBlank()) order.accessionNumber = "RAD-" + System.currentTimeMillis() % 1_000_000;
		if (order.orderedAt == null) order.orderedAt = Instant.now();
		return ResponseEntity.status(HttpStatus.CREATED).body(SupportApi.map(store.save(order)));
	}

	@PutMapping("/orders/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		security.requireRadiology();
		ImagingOrder order = store.find(ImagingOrder.class, id).orElseThrow(() -> new ApiException(404, "Imaging order not found"));
		SupportApi.apply(order, body);
		if (body.containsKey("modality")) order.modality = SupportApi.choice(order.modality, "modality", MODALITIES);
		if (body.containsKey("priority")) order.priority = SupportApi.choice(order.priority, "priority", PRIORITIES);
		if (body.containsKey("status")) order.status = SupportApi.choice(order.status, "status", STATUSES);
		if ("REPORTED".equals(order.status) && order.reportedAt == null) order.reportedAt = Instant.now();
		return SupportApi.map(store.save(order));
	}
	private static boolean pending(ImagingOrder order) { return !"REPORTED".equalsIgnoreCase(order.status) && !"CANCELLED".equalsIgnoreCase(order.status); }
}

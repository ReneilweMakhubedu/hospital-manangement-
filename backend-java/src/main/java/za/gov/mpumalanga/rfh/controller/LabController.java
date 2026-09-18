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
import za.gov.mpumalanga.rfh.entity.LabOrder;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.SupportStore;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/lab")
public class LabController {
	private static final Set<String> PRIORITIES = Set.of("ROUTINE", "STAT");
	private static final Set<String> STATUSES = Set.of("ORDERED", "IN_PROGRESS", "RESULTED", "CANCELLED");
	private final SupportStore store; private final SecurityUtils security;
	public LabController(SupportStore store, SecurityUtils security) { this.store = store; this.security = security; }

	@GetMapping("/dashboard")
	public Map<String, Object> dashboard() {
		security.requireLab();
		List<LabOrder> rows = store.all(LabOrder.class);
		List<LabOrder> completed = rows.stream().filter(o -> o.orderedAt != null && o.resultedAt != null).toList();
		double tat = completed.stream().mapToLong(o -> Duration.between(o.orderedAt, o.resultedAt).toMinutes()).average().orElse(0) / 60.0;
		LocalDate today = LocalDate.now();
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("pending", rows.stream().filter(LabController::pending).count());
		result.put("statPending", rows.stream().filter(LabController::pending).filter(o -> "STAT".equalsIgnoreCase(o.priority)).count());
		result.put("avgTatHours", Math.round(tat * 10.0) / 10.0);
		result.put("resultedToday", rows.stream().filter(o -> o.resultedAt != null && LocalDate.ofInstant(o.resultedAt, ZoneId.systemDefault()).equals(today)).count());
		return result;
	}

	@GetMapping("/orders")
	public List<Map<String, Object>> orders() { security.requireLab(); return store.all(LabOrder.class).stream().map(SupportApi::map).toList(); }

	@PostMapping("/orders")
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		security.requireLab();
		LabOrder order = SupportApi.apply(new LabOrder(), body);
		order.patientName = SupportApi.required(body, "patientName");
		order.testName = SupportApi.required(body, "testName");
		order.priority = SupportApi.optionalChoice(body, "priority", PRIORITIES, "ROUTINE");
		order.status = SupportApi.optionalChoice(body, "status", STATUSES, "ORDERED");
		if (order.accessionNumber == null || order.accessionNumber.isBlank()) order.accessionNumber = "NHLS-" + System.currentTimeMillis() % 1_000_000;
		if (order.orderedAt == null) order.orderedAt = Instant.now();
		return ResponseEntity.status(HttpStatus.CREATED).body(SupportApi.map(store.save(order)));
	}

	@PutMapping("/orders/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		security.requireLab();
		LabOrder order = store.find(LabOrder.class, id).orElseThrow(() -> new ApiException(404, "Lab order not found"));
		SupportApi.apply(order, body);
		if (body.containsKey("priority")) order.priority = SupportApi.choice(order.priority, "priority", PRIORITIES);
		if (body.containsKey("status")) order.status = SupportApi.choice(order.status, "status", STATUSES);
		if ("RESULTED".equals(order.status) && order.resultedAt == null) order.resultedAt = Instant.now();
		return SupportApi.map(store.save(order));
	}
	private static boolean pending(LabOrder order) { return !"RESULTED".equalsIgnoreCase(order.status) && !"CANCELLED".equalsIgnoreCase(order.status); }
}

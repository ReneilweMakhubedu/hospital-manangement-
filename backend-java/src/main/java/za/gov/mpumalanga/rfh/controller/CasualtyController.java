package za.gov.mpumalanga.rfh.controller;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.gov.mpumalanga.rfh.entity.EdVisit;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.SupportStore;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/casualty")
public class CasualtyController {
	private static final Set<String> CATEGORIES = Set.of("RED", "ORANGE", "YELLOW", "GREEN", "BLUE");
	private static final Set<String> STATUSES = Set.of("WAITING", "IN_TRIAGE", "IN_TREATMENT", "DISCHARGED", "ADMITTED");
	private final SupportStore store;
	private final SecurityUtils security;

	public CasualtyController(SupportStore store, SecurityUtils security) { this.store = store; this.security = security; }

	@GetMapping("/dashboard")
	public Map<String, Object> dashboard() {
		security.requireCasualty();
		List<EdVisit> visits = store.all(EdVisit.class);
		Map<String, Long> byCategory = new LinkedHashMap<>();
		for (String category : CATEGORIES) {
			byCategory.put(category, visits.stream().filter(v -> category.equalsIgnoreCase(v.triageCategory) && active(v)).count());
		}
		double average = visits.stream().filter(CasualtyController::active).filter(v -> v.arrivedAt != null)
				.mapToLong(v -> Duration.between(v.arrivedAt, v.triageAt == null ? Instant.now() : v.triageAt).toMinutes())
				.average().orElse(0.0);
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("waitingByCategory", byCategory);
		result.put("avgWaitMinutes", Math.round(average * 10.0) / 10.0);
		result.put("resusCount", visits.stream().filter(v -> "RED".equalsIgnoreCase(v.triageCategory) && active(v)).count());
		result.put("boardedCount", visits.stream().filter(v -> "ADMITTED".equalsIgnoreCase(v.status)).count());
		return result;
	}

	@GetMapping("/visits")
	public List<Map<String, Object>> visits() { security.requireCasualty(); return store.all(EdVisit.class).stream().map(SupportApi::map).toList(); }

	@PostMapping("/visits")
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		security.requireCasualty();
		EdVisit visit = SupportApi.apply(new EdVisit(), body);
		visit.patientName = SupportApi.required(body, "patientName");
		visit.chiefComplaint = SupportApi.required(body, "chiefComplaint");
		visit.triageCategory = SupportApi.choice(SupportApi.required(body, "triageCategory"), "triageCategory", CATEGORIES);
		visit.status = SupportApi.optionalChoice(body, "status", STATUSES, "WAITING");
		if (visit.ticketNumber == null || visit.ticketNumber.isBlank()) visit.ticketNumber = "ED-" + System.currentTimeMillis() % 1_000_000;
		if (visit.arrivedAt == null) visit.arrivedAt = Instant.now();
		return ResponseEntity.status(HttpStatus.CREATED).body(SupportApi.map(store.save(visit)));
	}

	@PutMapping("/visits/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		security.requireCasualty();
		EdVisit visit = store.find(EdVisit.class, id).orElseThrow(() -> new ApiException(404, "ED visit not found"));
		SupportApi.apply(visit, body);
		if (body.containsKey("triageCategory")) visit.triageCategory = SupportApi.choice(visit.triageCategory, "triageCategory", CATEGORIES);
		if (body.containsKey("status")) visit.status = SupportApi.choice(visit.status, "status", STATUSES);
		if ("IN_TRIAGE".equals(visit.status) && visit.triageAt == null) visit.triageAt = Instant.now();
		return SupportApi.map(store.save(visit));
	}

	private static boolean active(EdVisit visit) {
		return !"DISCHARGED".equalsIgnoreCase(visit.status) && !"ADMITTED".equalsIgnoreCase(visit.status);
	}
}

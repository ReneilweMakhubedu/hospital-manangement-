package za.gov.mpumalanga.rfh.controller;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.gov.mpumalanga.rfh.entity.AlliedReferral;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.SupportStore;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/allied")
public class AlliedController {
	private static final Set<String> DISCIPLINES = Set.of("PHYSIO", "OT", "DIETETICS", "SOCIAL_WORK", "PSYCHOLOGY", "SPEECH");
	private static final Set<String> STATUSES = Set.of("NEW", "ACTIVE", "COMPLETED");
	private final SupportStore store; private final SecurityUtils security;
	public AlliedController(SupportStore store, SecurityUtils security) { this.store = store; this.security = security; }

	@GetMapping("/dashboard")
	public Map<String, Object> dashboard() {
		security.requireAllied();
		List<AlliedReferral> rows = store.all(AlliedReferral.class);
		Map<String, Long> byDiscipline = new LinkedHashMap<>();
		for (String discipline : DISCIPLINES) {
			byDiscipline.put(discipline, rows.stream().filter(r -> discipline.equalsIgnoreCase(r.discipline) && !"COMPLETED".equalsIgnoreCase(r.status)).count());
		}
		LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
		long completed = rows.stream().filter(r -> "COMPLETED".equalsIgnoreCase(r.status) && r.createdAt != null)
				.filter(r -> !LocalDate.ofInstant(r.createdAt, ZoneId.systemDefault()).isBefore(monday)).count();
		return Map.of("openByDiscipline", byDiscipline, "completedThisWeek", completed);
	}

	@GetMapping("/referrals")
	public List<Map<String, Object>> referrals() { security.requireAllied(); return store.all(AlliedReferral.class).stream().map(SupportApi::map).toList(); }
	@PostMapping("/referrals")
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		security.requireAllied();
		AlliedReferral item = SupportApi.apply(new AlliedReferral(), body);
		item.patientName = SupportApi.required(body, "patientName"); item.reason = SupportApi.required(body, "reason");
		item.discipline = SupportApi.choice(SupportApi.required(body, "discipline"), "discipline", DISCIPLINES);
		item.status = SupportApi.optionalChoice(body, "status", STATUSES, "NEW");
		if (item.createdAt == null) item.createdAt = Instant.now();
		return ResponseEntity.status(HttpStatus.CREATED).body(SupportApi.map(store.save(item)));
	}
	@PutMapping("/referrals/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		security.requireAllied();
		AlliedReferral item = store.find(AlliedReferral.class, id).orElseThrow(() -> new ApiException(404, "Allied referral not found"));
		SupportApi.apply(item, body);
		if (body.containsKey("discipline")) item.discipline = SupportApi.choice(item.discipline, "discipline", DISCIPLINES);
		if (body.containsKey("status")) item.status = SupportApi.choice(item.status, "status", STATUSES);
		return SupportApi.map(store.save(item));
	}
}

package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.gov.mpumalanga.rfh.entity.*;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.SupportStore;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/nursing")
public class NursingController {
	private static final Set<String> BED_STATUSES = Set.of("AVAILABLE", "OCCUPIED", "CLEANING", "BLOCKED");
	private static final Set<String> ACUITIES = Set.of("LOW", "MEDIUM", "HIGH");
	private static final Set<String> SHIFTS = Set.of("DAY", "NIGHT");
	private static final Set<String> MED_STATUSES = Set.of("GIVEN", "HELD", "MISSED");
	private final SupportStore store;
	private final SecurityUtils security;

	public NursingController(SupportStore store, SecurityUtils security) {
		this.store = store;
		this.security = security;
	}

	@GetMapping("/dashboard")
	public Map<String, Object> dashboard() {
		security.requireNurse();
		List<WardBed> beds = store.all(WardBed.class);
		List<NursingHandover> handovers = store.all(NursingHandover.class);
		List<NursingVital> vitals = store.all(NursingVital.class);
		List<NursingMedAdmin> meds = store.all(NursingMedAdmin.class);
		long occupied = beds.stream().filter(b -> "OCCUPIED".equalsIgnoreCase(b.status)).count();
		long available = beds.stream().filter(b -> "AVAILABLE".equalsIgnoreCase(b.status)).count();
		Instant dayAgo = Instant.now().minus(24, ChronoUnit.HOURS);
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("occupiedBeds", occupied);
		result.put("availableBeds", available);
		result.put("occupancyPercent", beds.isEmpty() ? 0.0 : BigDecimal.valueOf(occupied * 100.0 / beds.size()).setScale(1, RoundingMode.HALF_UP));
		result.put("openHandovers", handovers.stream().filter(h -> h.createdAt != null && !h.createdAt.isBefore(dayAgo)).count());
		result.put("vitalsLast24h", vitals.stream().filter(v -> v.recordedAt != null && !v.recordedAt.isBefore(dayAgo)).count());
		result.put("medsDueCount", meds.stream().filter(m -> !"GIVEN".equalsIgnoreCase(m.status)).count());
		result.put("highAcuityCount", beds.stream().filter(b -> "OCCUPIED".equalsIgnoreCase(b.status) && "HIGH".equalsIgnoreCase(b.acuity)).count());
		return result;
	}

	@GetMapping("/beds")
	public List<Map<String, Object>> beds() { security.requireNurse(); return maps(store.all(WardBed.class)); }

	@PostMapping("/beds")
	public ResponseEntity<Map<String, Object>> createBed(@RequestBody Map<String, Object> body) {
		security.requireNurse();
		WardBed bed = SupportApi.apply(new WardBed(), body);
		bed.wardName = SupportApi.required(body, "wardName");
		bed.bedNumber = SupportApi.required(body, "bedNumber");
		bed.status = SupportApi.optionalChoice(body, "status", BED_STATUSES, "AVAILABLE");
		bed.acuity = SupportApi.optionalChoice(body, "acuity", ACUITIES, "LOW");
		return created(store.save(bed));
	}

	@PutMapping("/beds/{id}")
	public Map<String, Object> updateBed(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		security.requireNurse();
		WardBed bed = store.find(WardBed.class, id).orElseThrow(() -> new ApiException(404, "Bed not found"));
		SupportApi.apply(bed, body);
		if (body.containsKey("status")) bed.status = SupportApi.choice(bed.status, "status", BED_STATUSES);
		if (body.containsKey("acuity")) bed.acuity = SupportApi.choice(bed.acuity, "acuity", ACUITIES);
		return SupportApi.map(store.save(bed));
	}

	@GetMapping("/handovers")
	public List<Map<String, Object>> handovers() { security.requireNurse(); return maps(store.all(NursingHandover.class)); }

	@PostMapping("/handovers")
	public ResponseEntity<Map<String, Object>> createHandover(@RequestBody Map<String, Object> body) {
		security.requireNurse();
		NursingHandover item = SupportApi.apply(new NursingHandover(), body);
		item.wardName = SupportApi.required(body, "wardName");
		item.summary = SupportApi.required(body, "summary");
		item.shift = SupportApi.choice(SupportApi.required(body, "shift"), "shift", SHIFTS);
		if (item.createdAt == null) item.createdAt = Instant.now();
		return created(store.save(item));
	}

	@GetMapping("/vitals")
	public List<Map<String, Object>> vitals() { security.requireNurse(); return maps(store.all(NursingVital.class)); }

	@PostMapping("/vitals")
	public ResponseEntity<Map<String, Object>> createVital(@RequestBody Map<String, Object> body) {
		security.requireNurse();
		NursingVital item = SupportApi.apply(new NursingVital(), body);
		item.patientName = SupportApi.required(body, "patientName");
		if (item.recordedAt == null) item.recordedAt = Instant.now();
		return created(store.save(item));
	}

	@GetMapping("/meds")
	public List<Map<String, Object>> meds() { security.requireNurse(); return maps(store.all(NursingMedAdmin.class)); }

	@PostMapping("/meds")
	public ResponseEntity<Map<String, Object>> createMed(@RequestBody Map<String, Object> body) {
		security.requireNurse();
		NursingMedAdmin item = SupportApi.apply(new NursingMedAdmin(), body);
		item.patientName = SupportApi.required(body, "patientName");
		item.medication = SupportApi.required(body, "medication");
		item.status = SupportApi.optionalChoice(body, "status", MED_STATUSES, "GIVEN");
		if (item.givenAt == null && "GIVEN".equals(item.status)) item.givenAt = Instant.now();
		return created(store.save(item));
	}

	private static List<Map<String, Object>> maps(List<? extends SupportEntity> rows) {
		return rows.stream().map(SupportApi::map).toList();
	}
	private static ResponseEntity<Map<String, Object>> created(SupportEntity row) {
		return ResponseEntity.status(HttpStatus.CREATED).body(SupportApi.map(row));
	}
}

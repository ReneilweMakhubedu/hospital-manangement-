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
import za.gov.mpumalanga.rfh.repository.AdminRepository;
import za.gov.mpumalanga.rfh.repository.SupportStore;
import za.gov.mpumalanga.rfh.security.AuthUser;
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
	private final AdminRepository adminRepository;
	private final za.gov.mpumalanga.rfh.service.StayFlowService stayFlow;
	private final za.gov.mpumalanga.rfh.service.MedicationSafetyService medicationSafety;
	private final za.gov.mpumalanga.rfh.service.GovernanceService governanceService;
	private final za.gov.mpumalanga.rfh.service.AuditService auditService;

	public NursingController(SupportStore store, SecurityUtils security, AdminRepository adminRepository, za.gov.mpumalanga.rfh.service.StayFlowService stayFlow, za.gov.mpumalanga.rfh.service.MedicationSafetyService medicationSafety, za.gov.mpumalanga.rfh.service.GovernanceService governanceService, za.gov.mpumalanga.rfh.service.AuditService auditService) {
		this.store = store;
		this.security = security;
		this.adminRepository = adminRepository;
		this.stayFlow = stayFlow;
		this.medicationSafety = medicationSafety;
		this.governanceService = governanceService;
		this.auditService = auditService;
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
		result.put("totalBeds", beds.size());
		result.put("occupiedBeds", occupied);
		result.put("availableBeds", available);
		result.put("occupancyPercent", beds.isEmpty() ? 0.0 : BigDecimal.valueOf(occupied * 100.0 / beds.size()).setScale(1, RoundingMode.HALF_UP));
		result.put("byFloorWard", floorWardCounts(beds));
		result.put("openHandovers", handovers.stream().filter(h -> h.createdAt != null && !h.createdAt.isBefore(dayAgo)).count());
		result.put("vitalsLast24h", vitals.stream().filter(v -> v.recordedAt != null && !v.recordedAt.isBefore(dayAgo)).count());
		result.put("medsDueCount", meds.stream().filter(m -> !"GIVEN".equalsIgnoreCase(m.status)).count());
		result.put("highAcuityCount", beds.stream().filter(b -> "OCCUPIED".equalsIgnoreCase(b.status) && "HIGH".equalsIgnoreCase(b.acuity)).count());
		result.put("pendingBedRequests", store.all(za.gov.mpumalanga.rfh.entity.OpsItem.class).stream()
				.filter(item -> "reception".equalsIgnoreCase(item.desk))
				.filter(item -> "WAITING".equalsIgnoreCase(item.status) || "BED_REQUESTED".equalsIgnoreCase(item.status))
				.count());
		return result;
	}

	@GetMapping("/beds/summary")
	public Map<String, Object> bedSummary() {
		security.requireNurse();
		List<WardBed> beds = store.all(WardBed.class);
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("totalBeds", beds.size());
		result.put("occupiedBeds", countStatus(beds, "OCCUPIED"));
		result.put("availableBeds", countStatus(beds, "AVAILABLE"));
		result.put("cleaningBeds", countStatus(beds, "CLEANING"));
		result.put("blockedBeds", countStatus(beds, "BLOCKED"));
		result.put("byFloorWard", floorWardCounts(beds));
		return result;
	}

	@GetMapping("/beds/locate")
	public List<Map<String, Object>> locate(@RequestParam(name = "q", defaultValue = "") String query) {
		security.requireNurse();
		String needle = query == null ? "" : query.trim().toLowerCase(java.util.Locale.ROOT);
		if (needle.isBlank()) return List.of();
		return store.all(WardBed.class).stream()
				.filter(bed -> "OCCUPIED".equalsIgnoreCase(bed.status))
				.filter(bed -> matchesPatient(bed, needle))
				.map(this::bedView)
				.toList();
	}

	@GetMapping("/beds")
	public List<Map<String, Object>> beds() {
		security.requireNurse();
		return store.all(WardBed.class).stream().map(this::bedView).toList();
	}

	@PostMapping("/beds")
	public ResponseEntity<Map<String, Object>> createBed(@RequestBody Map<String, Object> body) {
		security.requireRoles("nurse_manager", "admin", "super_admin");
		WardBed bed = new WardBed();
		bed.floor = SupportApi.required(body, "floor");
		bed.wardName = SupportApi.required(body, "wardName");
		bed.bedNumber = SupportApi.required(body, "bedNumber");
		bed.status = SupportApi.optionalChoice(body, "status", BED_STATUSES, "AVAILABLE");
		bed.acuity = SupportApi.optionalChoice(body, "acuity", ACUITIES, "LOW");
		bed.patientName = text(body.get("patientName"));
		bed.patientId = asLong(body.get("patientId"));
		bed.createdByEmail = currentEmail();
		stayFlow.prepare(bed, null, null);
		applyOccupancy(bed, null, null, true);
		ensureUniqueLocation(bed, null);
		ensureSinglePatient(bed);
		WardBed saved = store.save(bed);
		Map<String, Object> view = bedView(saved);
		view.put("stayNote", stayFlow.afterSave(saved, null, null, currentEmail()));
		return ResponseEntity.status(HttpStatus.CREATED).body(view);
	}

	@PutMapping("/beds/{id}")
	public Map<String, Object> updateBed(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		AuthUser user = security.requireNurse();
		WardBed bed = store.find(WardBed.class, id).orElseThrow(() -> new ApiException(404, "Bed not found"));
		String oldStatus = bed.status;
		String oldFloor = bed.floor;
		String oldWard = bed.wardName;
		String oldNumber = bed.bedNumber;
		String oldPatient = bed.patientName;
		Long oldPatientId = bed.patientId;
		boolean manager = isBedManager(user);
		if (body.containsKey("floor")) bed.floor = SupportApi.required(body, "floor");
		if (body.containsKey("wardName")) bed.wardName = SupportApi.required(body, "wardName");
		if (body.containsKey("bedNumber")) bed.bedNumber = SupportApi.required(body, "bedNumber");
		if (!manager && (!same(oldFloor, bed.floor) || !same(oldWard, bed.wardName) || !same(oldNumber, bed.bedNumber))) {
			throw new ApiException(403, "Only a nurse manager can change floor, ward, or bed number");
		}
		if (body.containsKey("status")) bed.status = SupportApi.choice(String.valueOf(body.get("status")), "status", BED_STATUSES);
		if (body.containsKey("acuity")) bed.acuity = SupportApi.choice(String.valueOf(body.get("acuity")), "acuity", ACUITIES);
		if (body.containsKey("patientName")) bed.patientName = text(body.get("patientName"));
		if (body.containsKey("patientId")) bed.patientId = asLong(body.get("patientId"));
		boolean patientChanged = !same(oldPatient, bed.patientName) || !java.util.Objects.equals(oldPatientId, bed.patientId);
		stayFlow.prepare(bed, oldStatus, oldPatient);
		applyOccupancy(bed, oldPatient, oldPatientId, patientChanged);
		ensureUniqueLocation(bed, bed.id);
		ensureSinglePatient(bed);
		WardBed saved = store.save(bed);
		Map<String, Object> view = bedView(saved);
		view.put("stayNote", stayFlow.afterSave(saved, oldStatus, oldPatient, currentEmail()));
		return view;
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
		if ("GIVEN".equals(item.status)) {
			za.gov.mpumalanga.rfh.service.MedicationSafetyService.Review review = medicationSafety.reviewByName(item.patientName, item.medication, item.dose);
			medicationSafety.enforce(review, za.gov.mpumalanga.rfh.service.ClinicalSignOff.acknowledged(body.get("acknowledgeSafety")));
		}
		if (item.givenAt == null && "GIVEN".equals(item.status)) item.givenAt = Instant.now();
		NursingMedAdmin saved = store.save(item);
		auditService.logChange(security.requireUser(), "CREATE", "NursingMedAdmin", saved.id, item.medication, item.status);
		return created(saved);
	}

	@PostMapping("/beds/{id}/emergency-discharge")
	public Map<String, Object> emergencyDischarge(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		AuthUser auth = security.requireRoles("nurse", "nurse_manager", "doctor");
		WardBed bed = store.find(WardBed.class, id).orElseThrow(() -> new ApiException(404, "Bed not found"));
		if (!"OCCUPIED".equalsIgnoreCase(bed.status)) throw new ApiException(409, "Only an occupied bed can be discharged this way");
		String reason = body.get("reason") == null ? "" : String.valueOf(body.get("reason"));
		return governanceService.request(auth, za.gov.mpumalanga.rfh.service.GovernanceService.DISCHARGE,
				"Emergency discharge " + bed.patientName + " from " + bed.wardName + " bed " + bed.bedNumber,
				reason,
				Map.of("bedId", id, "actorEmail", auditService.actorEmail(auth) == null ? "" : auditService.actorEmail(auth)));
	}

	private void applyOccupancy(WardBed bed, String oldPatient, Long oldPatientId, boolean patientChanged) {
		if (!"OCCUPIED".equalsIgnoreCase(bed.status)) {
			bed.patientName = null;
			bed.patientId = null;
			bed.allocatedByEmail = null;
			bed.admittedAt = null;
			return;
		}
		if (bed.patientName == null || bed.patientName.isBlank()) {
			throw new ApiException(400, "An occupied bed needs a patient");
		}
		if (patientChanged || bed.allocatedByEmail == null) {
			bed.allocatedByEmail = currentEmail();
		}
		if (patientChanged || bed.admittedAt == null || !same(oldPatient, bed.patientName) || !java.util.Objects.equals(oldPatientId, bed.patientId)) {
			if (patientChanged || bed.admittedAt == null) bed.admittedAt = Instant.now();
		}
	}

	private void ensureUniqueLocation(WardBed bed, Long ignoreId) {
		String key = locationKey(bed);
		for (WardBed other : store.all(WardBed.class)) {
			if (other.id != null && other.id.equals(ignoreId)) continue;
			if (locationKey(other).equals(key)) {
				throw new ApiException(409, "Floor " + bed.floor + ", " + bed.wardName + ", bed " + bed.bedNumber + " already exists");
			}
		}
	}

	private void ensureSinglePatient(WardBed bed) {
		if (!"OCCUPIED".equalsIgnoreCase(bed.status)) return;
		String name = norm(bed.patientName);
		for (WardBed other : store.all(WardBed.class)) {
			if (other.id != null && other.id.equals(bed.id)) continue;
			if (!"OCCUPIED".equalsIgnoreCase(other.status)) continue;
			boolean sameId = bed.patientId != null && bed.patientId.equals(other.patientId);
			boolean sameName = !name.isEmpty() && name.equals(norm(other.patientName));
			if (sameId || sameName) {
				throw new ApiException(409, bed.patientName + " is already in " + place(other));
			}
		}
	}

	private List<Map<String, Object>> floorWardCounts(List<WardBed> beds) {
		Map<String, Map<String, Object>> groups = new LinkedHashMap<>();
		for (WardBed bed : beds) {
			String key = norm(bed.floor) + "|" + norm(bed.wardName);
			Map<String, Object> row = groups.computeIfAbsent(key, ignored -> {
				Map<String, Object> created = new LinkedHashMap<>();
				created.put("floor", bed.floor == null || bed.floor.isBlank() ? "1" : bed.floor);
				created.put("wardName", bed.wardName);
				created.put("totalBeds", 0);
				created.put("occupiedBeds", 0);
				created.put("availableBeds", 0);
				return created;
			});
			row.put("totalBeds", ((Integer) row.get("totalBeds")) + 1);
			if ("OCCUPIED".equalsIgnoreCase(bed.status)) row.put("occupiedBeds", ((Integer) row.get("occupiedBeds")) + 1);
			if ("AVAILABLE".equalsIgnoreCase(bed.status)) row.put("availableBeds", ((Integer) row.get("availableBeds")) + 1);
		}
		return List.copyOf(groups.values());
	}

	private Map<String, Object> bedView(WardBed bed) {
		Map<String, Object> map = new LinkedHashMap<>(SupportApi.map(bed));
		map.put("location", place(bed));
		return map;
	}

	private String place(WardBed bed) {
		return "Floor " + (bed.floor == null || bed.floor.isBlank() ? "1" : bed.floor)
				+ " · " + bed.wardName + " · Bed " + bed.bedNumber;
	}

	private boolean matchesPatient(WardBed bed, String needle) {
		if (bed.patientId != null && String.valueOf(bed.patientId).equals(needle)) return true;
		return norm(bed.patientName).contains(needle) || place(bed).toLowerCase(java.util.Locale.ROOT).contains(needle);
	}

	private String currentEmail() {
		AuthUser user = security.requireUser();
		return adminRepository.findById(user.id()).map(admin -> admin.getEmail()).orElse("staff-" + user.id());
	}

	private static boolean isBedManager(AuthUser user) {
		String role = user.role() == null ? "" : user.role();
		return "nurse_manager".equalsIgnoreCase(role) || "admin".equalsIgnoreCase(role) || "super_admin".equalsIgnoreCase(role);
	}

	private static long countStatus(List<WardBed> beds, String status) {
		return beds.stream().filter(bed -> status.equalsIgnoreCase(bed.status)).count();
	}

	private static String locationKey(WardBed bed) {
		return norm(bed.floor) + "|" + norm(bed.wardName) + "|" + norm(bed.bedNumber);
	}

	private static boolean same(String left, String right) {
		return norm(left).equals(norm(right));
	}

	private static String norm(String value) {
		return value == null ? "" : value.trim().toLowerCase(java.util.Locale.ROOT);
	}

	private static String text(Object value) {
		if (value == null) return null;
		String text = String.valueOf(value).trim();
		return text.isEmpty() ? null : text;
	}

	private static Long asLong(Object value) {
		if (value == null || String.valueOf(value).isBlank()) return null;
		if (value instanceof Number number) return number.longValue();
		try {
			return Long.parseLong(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private static List<Map<String, Object>> maps(List<? extends SupportEntity> rows) {
		return rows.stream().map(SupportApi::map).toList();
	}
	private static ResponseEntity<Map<String, Object>> created(SupportEntity row) {
		return ResponseEntity.status(HttpStatus.CREATED).body(SupportApi.map(row));
	}
}

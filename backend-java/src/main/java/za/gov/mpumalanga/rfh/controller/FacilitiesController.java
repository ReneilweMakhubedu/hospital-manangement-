package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.gov.mpumalanga.rfh.entity.BiomedAsset;
import za.gov.mpumalanga.rfh.entity.FacilityWorkOrder;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.SupportStore;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/facilities")
public class FacilitiesController {
	private static final Set<String> CATEGORIES = Set.of("HVAC", "ELECTRICAL", "PLUMBING", "BIOMED", "GENERAL");
	private static final Set<String> PRIORITIES = Set.of("LOW", "MEDIUM", "HIGH", "CRITICAL");
	private static final Set<String> WORK_STATUSES = Set.of("OPEN", "IN_PROGRESS", "DONE");
	private static final Set<String> ASSET_STATUSES = Set.of("IN_SERVICE", "DOWN", "MAINTENANCE");
	private final SupportStore store; private final SecurityUtils security;
	public FacilitiesController(SupportStore store, SecurityUtils security) { this.store = store; this.security = security; }

	@GetMapping("/dashboard")
	public Map<String, Object> dashboard() {
		security.requireFacilities();
		List<FacilityWorkOrder> work = store.all(FacilityWorkOrder.class);
		List<BiomedAsset> assets = store.all(BiomedAsset.class);
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("openWorkOrders", work.stream().filter(FacilitiesController::open).count());
		result.put("criticalOpen", work.stream().filter(FacilitiesController::open).filter(w -> "CRITICAL".equalsIgnoreCase(w.priority)).count());
		result.put("assetsDown", assets.stream().filter(a -> "DOWN".equalsIgnoreCase(a.status)).count());
		result.put("pmDueSoon", assets.stream().filter(a -> a.nextPmDate != null && !a.nextPmDate.isAfter(LocalDate.now().plusDays(30))).count());
		return result;
	}

	@GetMapping("/work-orders")
	public List<Map<String, Object>> workOrders() { security.requireFacilities(); return store.all(FacilityWorkOrder.class).stream().map(SupportApi::map).toList(); }
	@PostMapping("/work-orders")
	public ResponseEntity<Map<String, Object>> createWork(@RequestBody Map<String, Object> body) {
		security.requireFacilities();
		FacilityWorkOrder item = SupportApi.apply(new FacilityWorkOrder(), body);
		item.title = SupportApi.required(body, "title"); item.location = SupportApi.required(body, "location");
		item.category = SupportApi.choice(SupportApi.required(body, "category"), "category", CATEGORIES);
		item.priority = SupportApi.optionalChoice(body, "priority", PRIORITIES, "MEDIUM");
		item.status = SupportApi.optionalChoice(body, "status", WORK_STATUSES, "OPEN");
		if (item.referenceNumber == null || item.referenceNumber.isBlank()) item.referenceNumber = "FM-" + System.currentTimeMillis() % 1_000_000;
		if (item.createdAt == null) item.createdAt = Instant.now();
		return ResponseEntity.status(HttpStatus.CREATED).body(SupportApi.map(store.save(item)));
	}
	@PutMapping("/work-orders/{id}")
	public Map<String, Object> updateWork(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		security.requireFacilities();
		FacilityWorkOrder item = store.find(FacilityWorkOrder.class, id).orElseThrow(() -> new ApiException(404, "Work order not found"));
		SupportApi.apply(item, body);
		if (body.containsKey("category")) item.category = SupportApi.choice(item.category, "category", CATEGORIES);
		if (body.containsKey("priority")) item.priority = SupportApi.choice(item.priority, "priority", PRIORITIES);
		if (body.containsKey("status")) item.status = SupportApi.choice(item.status, "status", WORK_STATUSES);
		if ("DONE".equals(item.status) && item.completedAt == null) item.completedAt = Instant.now();
		return SupportApi.map(store.save(item));
	}

	@GetMapping("/assets")
	public List<Map<String, Object>> assets() { security.requireFacilities(); return store.all(BiomedAsset.class).stream().map(SupportApi::map).toList(); }
	@PostMapping("/assets")
	public ResponseEntity<Map<String, Object>> createAsset(@RequestBody Map<String, Object> body) {
		security.requireFacilities();
		BiomedAsset item = SupportApi.apply(new BiomedAsset(), body);
		item.assetTag = SupportApi.required(body, "assetTag"); item.name = SupportApi.required(body, "name");
		item.location = SupportApi.required(body, "location");
		item.status = SupportApi.optionalChoice(body, "status", ASSET_STATUSES, "IN_SERVICE");
		return ResponseEntity.status(HttpStatus.CREATED).body(SupportApi.map(store.save(item)));
	}
	@PutMapping("/assets/{id}")
	public Map<String, Object> updateAsset(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		security.requireFacilities();
		BiomedAsset item = store.find(BiomedAsset.class, id).orElseThrow(() -> new ApiException(404, "Biomedical asset not found"));
		SupportApi.apply(item, body);
		if (body.containsKey("status")) item.status = SupportApi.choice(item.status, "status", ASSET_STATUSES);
		return SupportApi.map(store.save(item));
	}
	private static boolean open(FacilityWorkOrder item) { return !"DONE".equalsIgnoreCase(item.status); }
}

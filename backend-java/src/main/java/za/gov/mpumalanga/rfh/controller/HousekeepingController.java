package za.gov.mpumalanga.rfh.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.entity.WardBed;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.SupportStore;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/housekeeping")
public class HousekeepingController {
	private final SupportStore store;
	private final SecurityUtils security;
	private final za.gov.mpumalanga.rfh.service.StayFlowService stayFlow;

	public HousekeepingController(SupportStore store, SecurityUtils security, za.gov.mpumalanga.rfh.service.StayFlowService stayFlow) {
		this.store = store;
		this.security = security;
		this.stayFlow = stayFlow;
	}

	@GetMapping("/beds")
	public List<Map<String, Object>> beds() {
		security.requireRoles("housekeeping", "admin", "super_admin");
		return store.all(WardBed.class).stream().map(this::view).toList();
	}

	@PostMapping("/beds/{id}/ready")
	public Map<String, Object> markReady(@PathVariable Long id) {
		security.requireRoles("housekeeping", "admin", "super_admin");
		WardBed bed = store.find(WardBed.class, id).orElseThrow(() -> new ApiException(404, "Bed not found"));
		if (!"CLEANING".equalsIgnoreCase(bed.status)) {
			throw new ApiException(409, "Only a bed that is being cleaned can be marked available");
		}
		bed.status = "AVAILABLE";
		bed.patientName = null;
		bed.patientId = null;
		bed.allocatedByEmail = null;
		bed.admittedAt = null;
		WardBed saved = store.save(bed);
		stayFlow.onReady(saved);
		return view(saved);
	}

	private Map<String, Object> view(WardBed bed) {
		Map<String, Object> map = new LinkedHashMap<>(SupportApi.map(bed));
		String floor = bed.floor == null || bed.floor.isBlank() ? "1" : bed.floor;
		map.put("location", "Floor " + floor + " · " + bed.wardName + " · Bed " + bed.bedNumber);
		return map;
	}
}

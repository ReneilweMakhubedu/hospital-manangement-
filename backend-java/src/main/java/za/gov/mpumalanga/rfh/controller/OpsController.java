package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
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
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.entity.Complaint;
import za.gov.mpumalanga.rfh.entity.OpsItem;
import za.gov.mpumalanga.rfh.entity.WardBed;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.AdminRepository;
import za.gov.mpumalanga.rfh.repository.ComplaintRepository;
import za.gov.mpumalanga.rfh.repository.SupportStore;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/ops")
public class OpsController {
	private static final Map<String, Set<String>> STATUSES = Map.ofEntries(
			Map.entry("reception", Set.of("WAITING", "BED_REQUESTED", "ADMITTED", "CANCELLED")),
			Map.entry("housekeeping", Set.of("OPEN", "IN_PROGRESS", "DONE")),
			Map.entry("porter", Set.of("REQUESTED", "IN_TRANSIT", "DONE")),
			Map.entry("records", Set.of("REQUESTED", "PULLED", "FILED")),
			Map.entry("midwife", Set.of("ANTENATAL", "LABOUR", "POSTNATAL", "DISCHARGED")),
			Map.entry("theatre", Set.of("BOOKED", "IN_THEATRE", "RECOVERY", "DONE")),
			Map.entry("infection", Set.of("SUSPECTED", "CONFIRMED", "CLEARED")),
			Map.entry("social", Set.of("OPEN", "ACTIVE", "CLOSED")),
			Map.entry("security", Set.of("OPEN", "CLOSED")),
			Map.entry("catering", Set.of("ORDERED", "SERVED", "CANCELLED")),
			Map.entry("mortuary", Set.of("RECEIVED", "RELEASED")));
	private static final Map<String, Set<String>> CLOSED = Map.ofEntries(
			Map.entry("reception", Set.of("ADMITTED", "CANCELLED")),
			Map.entry("housekeeping", Set.of("DONE")),
			Map.entry("porter", Set.of("DONE")),
			Map.entry("records", Set.of("FILED")),
			Map.entry("midwife", Set.of("DISCHARGED")),
			Map.entry("theatre", Set.of("DONE")),
			Map.entry("infection", Set.of("CLEARED")),
			Map.entry("social", Set.of("CLOSED")),
			Map.entry("security", Set.of("CLOSED")),
			Map.entry("catering", Set.of("SERVED", "CANCELLED")),
			Map.entry("mortuary", Set.of("RELEASED")));
	private static final Map<String, String> DEFAULT_STATUS = Map.ofEntries(
			Map.entry("reception", "WAITING"),
			Map.entry("housekeeping", "OPEN"),
			Map.entry("porter", "REQUESTED"),
			Map.entry("records", "REQUESTED"),
			Map.entry("midwife", "ANTENATAL"),
			Map.entry("theatre", "BOOKED"),
			Map.entry("infection", "SUSPECTED"),
			Map.entry("social", "OPEN"),
			Map.entry("security", "OPEN"),
			Map.entry("catering", "ORDERED"),
			Map.entry("mortuary", "RECEIVED"));
	private static final Set<String> NAME_OPTIONAL = Set.of("security", "housekeeping", "catering");
	private static final Set<String> OPEN_COMPLAINTS = Set.of("OPEN", "ACKNOWLEDGED", "IN_PROGRESS");

	private final SupportStore store;
	private final SecurityUtils security;
	private final AdminRepository adminRepository;
	private final ComplaintRepository complaintRepository;

	public OpsController(SupportStore store, SecurityUtils security, AdminRepository adminRepository, ComplaintRepository complaintRepository) {
		this.store = store;
		this.security = security;
		this.adminRepository = adminRepository;
		this.complaintRepository = complaintRepository;
	}

	@GetMapping("/{desk}/dashboard")
	public Map<String, Object> dashboard(@PathVariable String desk) {
		requireDesk(desk, false);
		if ("quality".equals(desk)) {
			List<Complaint> complaints = complaintRepository.findAll();
			Map<String, Object> result = new LinkedHashMap<>();
			result.put("openComplaints", complaints.stream().filter(c -> OPEN_COMPLAINTS.contains(norm(c.getStatus()))).count());
			result.put("awaitingAck", complaints.stream().filter(c -> "OPEN".equalsIgnoreCase(c.getStatus())).count());
			result.put("inProgress", complaints.stream().filter(c -> "IN_PROGRESS".equalsIgnoreCase(c.getStatus())).count());
			result.put("resolved", complaints.stream().filter(c -> "RESOLVED".equalsIgnoreCase(c.getStatus()) || "CLOSED".equalsIgnoreCase(c.getStatus())).count());
			return result;
		}
		List<OpsItem> rows = forDesk(desk);
		Set<String> closed = CLOSED.get(desk);
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("openItems", rows.stream().filter(row -> !closed.contains(norm(row.status))).count());
		result.put("totalItems", rows.size());
		if ("reception".equals(desk)) {
			result.put("waiting", countStatus(rows, "WAITING"));
			result.put("bedRequested", countStatus(rows, "BED_REQUESTED"));
		}
		if ("housekeeping".equals(desk)) {
			result.put("cleaningBeds", store.all(WardBed.class).stream().filter(bed -> "CLEANING".equalsIgnoreCase(bed.status)).count());
		}
		if ("porter".equals(desk)) {
			result.put("inTransit", countStatus(rows, "IN_TRANSIT"));
		}
		return result;
	}

	@GetMapping("/{desk}/items")
	public List<Map<String, Object>> items(@PathVariable String desk) {
		requireDesk(desk, false);
		if ("quality".equals(desk)) throw new ApiException(404, "Quality work is kept on the complaints desk");
		return forDesk(desk).stream().map(SupportApi::map).toList();
	}

	@PostMapping("/{desk}/items")
	public ResponseEntity<Map<String, Object>> create(@PathVariable String desk, @RequestBody Map<String, Object> body) {
		requireDesk(desk, true);
		Set<String> statuses = statuses(desk);
		OpsItem item = new OpsItem();
		item.desk = desk;
		item.patientName = NAME_OPTIONAL.contains(desk) ? text(body.get("patientName")) : SupportApi.required(body, "patientName");
		item.location = SupportApi.required(body, "location");
		item.detail = SupportApi.required(body, "detail");
		item.status = SupportApi.optionalChoice(body, "status", statuses, DEFAULT_STATUS.get(desk));
		item.createdAt = Instant.now();
		item.ownerEmail = currentEmail();
		return ResponseEntity.status(HttpStatus.CREATED).body(SupportApi.map(store.save(item)));
	}

	@PutMapping("/{desk}/items/{id}")
	public Map<String, Object> update(@PathVariable String desk, @PathVariable Long id, @RequestBody Map<String, Object> body) {
		requireDesk(desk, true);
		OpsItem item = store.find(OpsItem.class, id)
				.filter(row -> desk.equalsIgnoreCase(row.desk))
				.orElseThrow(() -> new ApiException(404, "Record not found"));
		if (body.containsKey("patientName")) {
			item.patientName = NAME_OPTIONAL.contains(desk) ? text(body.get("patientName")) : SupportApi.required(body, "patientName");
		}
		if (body.containsKey("location")) item.location = SupportApi.required(body, "location");
		if (body.containsKey("detail")) item.detail = SupportApi.required(body, "detail");
		if (body.containsKey("status")) item.status = SupportApi.choice(String.valueOf(body.get("status")), "status", statuses(desk));
		return SupportApi.map(store.save(item));
	}

	private void requireDesk(String desk, boolean write) {
		if ("quality".equals(desk)) {
			security.requireRoles("quality", "admin", "super_admin");
			if (write) throw new ApiException(403, "Quality complaints are updated on the complaints desk");
			return;
		}
		if (!STATUSES.containsKey(desk)) throw new ApiException(404, "Unknown desk");
		if ("reception".equals(desk) && !write) {
			security.requireRoles("reception", "nurse", "nurse_manager", "admin", "super_admin");
			return;
		}
		if ("theatre".equals(desk)) {
			security.requireRoles("theatre", "anaesthetist", "admin", "super_admin");
			return;
		}
		security.requireRoles(desk, "admin", "super_admin");
	}

	private Set<String> statuses(String desk) {
		Set<String> statuses = STATUSES.get(desk);
		if (statuses == null) throw new ApiException(404, "Unknown desk");
		return statuses;
	}

	private List<OpsItem> forDesk(String desk) {
		return store.all(OpsItem.class).stream().filter(row -> desk.equalsIgnoreCase(row.desk)).toList();
	}

	private String currentEmail() {
		AuthUser user = security.requireUser();
		return adminRepository.findById(user.id()).map(admin -> admin.getEmail()).orElse("staff-" + user.id());
	}

	private static long countStatus(List<OpsItem> rows, String status) {
		return rows.stream().filter(row -> status.equalsIgnoreCase(row.status)).count();
	}

	private static String norm(String value) {
		return value == null ? "" : value.trim().toUpperCase();
	}

	private static String text(Object value) {
		if (value == null) return null;
		String text = String.valueOf(value).trim();
		return text.isEmpty() ? null : text;
	}
}

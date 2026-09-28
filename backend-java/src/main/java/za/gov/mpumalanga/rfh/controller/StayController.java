package za.gov.mpumalanga.rfh.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.entity.User;
import za.gov.mpumalanga.rfh.entity.WardBed;
import za.gov.mpumalanga.rfh.repository.SupportStore;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/stay")
public class StayController {
	private final SupportStore store;
	private final SecurityUtils security;
	private final UserRepository userRepository;

	public StayController(SupportStore store, SecurityUtils security, UserRepository userRepository) {
		this.store = store;
		this.security = security;
		this.userRepository = userRepository;
	}

	@GetMapping("/locate")
	public List<Map<String, Object>> locate(@RequestParam(name = "q", defaultValue = "") String query) {
		AuthUser auth = security.requireUser();
		String needle = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
		boolean staff = auth.role() != null && !"patient".equalsIgnoreCase(auth.role());
		User me = userRepository.findById(auth.id()).orElse(null);
		String myName = fullName(me);
		List<Map<String, Object>> matches = new ArrayList<>();
		for (WardBed bed : store.all(WardBed.class)) {
			if (!"OCCUPIED".equalsIgnoreCase(bed.status) || bed.patientName == null || bed.patientName.isBlank()) continue;
			if (staff) {
				if (!needle.isBlank() && !matchesPatient(bed, needle)) continue;
				if (needle.isBlank()) continue;
				matches.add(view(bed, true));
				continue;
			}
			if (!canSee(bed, auth, myName)) continue;
			if (!needle.isBlank() && !matchesPatient(bed, needle)) continue;
			matches.add(view(bed, false));
		}
		return matches;
	}

	private boolean canSee(WardBed bed, AuthUser auth, String myName) {
		if (bed.patientId != null && bed.patientId.equals(auth.id())) return true;
		if (!myName.isBlank() && bed.patientName.trim().equalsIgnoreCase(myName)) return true;
		User occupant = occupant(bed);
		if (occupant == null || myName.isBlank()) return false;
		String kin = occupant.getNextOfKin() == null ? "" : occupant.getNextOfKin().toLowerCase(Locale.ROOT);
		return kin.contains(myName.toLowerCase(Locale.ROOT));
	}

	private User occupant(WardBed bed) {
		if (bed.patientId != null) {
			User byId = userRepository.findById(bed.patientId).orElse(null);
			if (byId != null) return byId;
		}
		String wanted = bed.patientName.trim().toLowerCase(Locale.ROOT);
		for (User user : userRepository.findAll()) {
			if (fullName(user).equalsIgnoreCase(wanted)) return user;
		}
		return null;
	}

	private static Map<String, Object> view(WardBed bed, boolean staff) {
		String floor = bed.floor == null || bed.floor.isBlank() ? "1" : bed.floor;
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("patientName", bed.patientName);
		map.put("location", "Floor " + floor + " · " + bed.wardName + " · Bed " + bed.bedNumber);
		map.put("floor", floor);
		map.put("wardName", bed.wardName);
		map.put("bedNumber", bed.bedNumber);
		if (staff) map.put("acuity", bed.acuity);
		return map;
	}

	private static boolean matchesPatient(WardBed bed, String needle) {
		if (bed.patientId != null && String.valueOf(bed.patientId).equals(needle)) return true;
		return bed.patientName.toLowerCase(Locale.ROOT).contains(needle);
	}

	private static String fullName(User user) {
		if (user == null) return "";
		return ((user.getFirstName() == null ? "" : user.getFirstName()) + " " + (user.getLastName() == null ? "" : user.getLastName())).trim();
	}
}

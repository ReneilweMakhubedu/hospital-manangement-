package za.gov.mpumalanga.rfh.controller;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.GovernanceService;

@RestController
@RequestMapping("/api/governance/approvals")
public class GovernanceController {
	private final GovernanceService governanceService;
	private final SecurityUtils securityUtils;

	public GovernanceController(GovernanceService governanceService, SecurityUtils securityUtils) {
		this.governanceService = governanceService;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		return governanceService.list(securityUtils.requireHospitalStaff());
	}

	@PostMapping("/{id}/decide")
	public Map<String, Object> decide(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		return governanceService.decide(
				securityUtils.requireHospitalStaff(),
				id,
				body.get("decision") == null ? null : String.valueOf(body.get("decision")),
				body.get("note") == null ? null : String.valueOf(body.get("note")));
	}
}

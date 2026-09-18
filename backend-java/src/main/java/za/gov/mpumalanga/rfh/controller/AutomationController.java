package za.gov.mpumalanga.rfh.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AssistService;
import za.gov.mpumalanga.rfh.service.AutomationService;

@RestController
@RequestMapping("/api")
public class AutomationController {

	private final AutomationService automationService;
	private final AssistService assistService;
	private final SecurityUtils security;

	public AutomationController(AutomationService automationService, AssistService assistService, SecurityUtils security) {
		this.automationService = automationService;
		this.assistService = assistService;
		this.security = security;
	}

	@GetMapping("/automation/alerts")
	public List<Map<String, Object>> alerts(@RequestParam(defaultValue = "false") boolean includeAcked) {
		AuthUser user = security.requireHospitalStaff();
		return automationService.alertsForRole(user.role(), includeAcked);
	}

	@PostMapping("/automation/alerts/{id}/ack")
	public Map<String, Object> acknowledge(@PathVariable Long id) {
		security.requireHospitalStaff();
		return automationService.acknowledge(id);
	}

	@PostMapping("/automation/run")
	public Map<String, Object> runNow() {
		security.requireAdmin();
		return automationService.runAll();
	}

	@GetMapping("/automation/status")
	public Map<String, Object> status() {
		security.requireHospitalStaff();
		AuthUser user = security.requireUser();
		List<Map<String, Object>> open = automationService.alertsForRole(user.role(), false);
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("openAlertCount", open.size());
		map.put("criticalCount", open.stream().filter(a -> "CRITICAL".equalsIgnoreCase(String.valueOf(a.get("severity")))).count());
		map.put("engine", "rfh-automation-v1");
		map.put("schedulerEnabled", true);
		return map;
	}

	@PostMapping("/assist")
	public Map<String, Object> assist(@RequestBody Map<String, Object> body) {
		security.requireHospitalStaff();
		String action = str(body.get("action"));
		String portal = str(body.get("portal"));
		String text = str(body.get("text"));
		if (text == null || text.isBlank()) {
			text = str(body.get("transcript"));
		}
		if (text == null || text.isBlank()) {
			text = str(body.get("spokenText"));
		}
		@SuppressWarnings("unchecked")
		Map<String, Object> context = body.get("context") instanceof Map<?, ?> m
				? (Map<String, Object>) m
				: Map.of();
		return assistService.assist(action, portal, text, context);
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}
}

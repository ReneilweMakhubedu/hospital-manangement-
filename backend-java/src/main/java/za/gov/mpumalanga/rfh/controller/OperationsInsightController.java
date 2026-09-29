package za.gov.mpumalanga.rfh.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.OperationsInsightService;

@RestController
@RequestMapping("/api/insights/operations")
public class OperationsInsightController {
	private final OperationsInsightService operationsInsightService;
	private final SecurityUtils securityUtils;

	public OperationsInsightController(OperationsInsightService operationsInsightService, SecurityUtils securityUtils) {
		this.operationsInsightService = operationsInsightService;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public Map<String, Object> report(
			@RequestParam(required = false) String department,
			@RequestParam(required = false) String ward,
			@RequestParam(required = false, defaultValue = "7d") String period) {
		securityUtils.requireHospitalStaff();
		return operationsInsightService.report(department, ward, period);
	}
}

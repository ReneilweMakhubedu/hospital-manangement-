package za.gov.mpumalanga.rfh.controller;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

	@Value("${server.port:5000}")
	private int port;

	@GetMapping("/")
	public Map<String, Object> root() {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("message", "Welcome to the Rob Ferreira Hospital Management System API");
		body.put("hospital", "Rob Ferreira Hospital");
		body.put("programme", "#OperationAsiphileni");
		body.put("status", "Server is running");
		body.put("port", port);
		return body;
	}

	@GetMapping("/api/health")
	public Map<String, Object> health() {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("success", true);
		body.put("message", "API is running successfully");
		return body;
	}
}

package za.gov.mpumalanga.rfh.controller;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.service.AuthService;

@RestController
@RequestMapping("/api")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/login")
	public Map<String, Object> login(@RequestBody Map<String, Object> body) {
		return authService.login(
				asString(body.get("email")),
				asString(body.get("password")),
				asString(body.get("role")));
	}

	@PostMapping("/signup")
	public ResponseEntity<Map<String, Object>> signup(@RequestBody Map<String, Object> body) {
		return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(
				asString(body.get("firstName")),
				asString(body.get("lastName")),
				asString(body.get("email")),
				asString(body.get("password")),
				asString(body.get("role"))));
	}

	private static String asString(Object value) {
		return value == null ? null : String.valueOf(value);
	}
}

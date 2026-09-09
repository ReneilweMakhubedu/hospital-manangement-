package za.gov.mpumalanga.rfh.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import za.gov.mpumalanga.rfh.entity.User;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.AdminRepository;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.JwtService;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final DoctorRepository doctorRepository;
	private final AdminRepository adminRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	public AuthService(
			UserRepository userRepository,
			DoctorRepository doctorRepository,
			AdminRepository adminRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService) {
		this.userRepository = userRepository;
		this.doctorRepository = doctorRepository;
		this.adminRepository = adminRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
	}

	public Map<String, Object> login(String email, String password, String role) {
		String emailValue = email == null ? "" : email.trim().toLowerCase();
		if (emailValue.isBlank() || password == null || password.isBlank()) {
			throw new ApiException(400, "Email and password are required");
		}

		List<String> order = new ArrayList<>(List.of("admin", "hr", "finance", "payroll", "procurement", "pharmacy", "doctor", "patient"));
		String requestedRole = role == null ? "" : role.trim().toLowerCase();
		if ("super_admin".equals(requestedRole)) {
			requestedRole = "admin";
		}
		if (!requestedRole.isBlank()) {
			order.remove(requestedRole);
			order.add(0, requestedRole);
		}

		for (String candidate : order) {
			Optional<AuthCandidate> found = findCandidate(candidate, emailValue);
			if (found.isEmpty()) {
				continue;
			}
			AuthCandidate user = found.get();
			if (!passwordEncoder.matches(password, user.password())) {
				continue;
			}
			String token = jwtService.generateToken(user.id(), user.role());
			Map<String, Object> response = new LinkedHashMap<>();
			response.put("token", token);
			response.put("role", user.role());
			response.put("onboardingComplete", "patient".equals(user.role()) ? user.onboardingComplete() != null && user.onboardingComplete() != 0 : true);
			return response;
		}

		throw new ApiException(400, "Invalid email or password");
	}

	public Map<String, Object> signup(String firstName, String lastName, String email, String password, String role) {
		String requestedRole = (role == null || role.isBlank()) ? "patient" : role.trim().toLowerCase();
		if (firstName == null || lastName == null || email == null || password == null
				|| firstName.isBlank() || lastName.isBlank() || email.isBlank() || password.isBlank()) {
			throw new ApiException(400, "First name, last name, email, and password are required");
		}
		if (password.length() < 6) {
			throw new ApiException(400, "Password must be at least 6 characters");
		}
		// Public signup is patient-only; staff accounts are created by hospital admin / HR
		if (!"patient".equals(requestedRole)) {
			throw new ApiException(400, "Staff accounts must be created by hospital administration");
		}

		try {
			User user = new User();
			user.setFirstName(firstName.trim());
			user.setLastName(lastName.trim());
			user.setEmail(email.trim().toLowerCase());
			user.setPassword(passwordEncoder.encode(password));
			user.setRole(requestedRole);
			user.setOnboardingComplete(0);
			user = userRepository.save(user);

			String token = jwtService.generateToken(user.getId(), requestedRole);
			Map<String, Object> response = new LinkedHashMap<>();
			response.put("message", "User registered successfully");
			response.put("patientId", user.getId());
			response.put("role", requestedRole);
			response.put("token", token);
			response.put("onboardingComplete", false);
			return response;
		} catch (DataIntegrityViolationException ex) {
			throw new ApiException(400, "Email already exists");
		}
	}

	private Optional<AuthCandidate> findCandidate(String role, String email) {
		return switch (role) {
			case "patient" -> userRepository.findByEmailIgnoreCase(email)
					.filter(u -> "patient".equalsIgnoreCase(u.getRole() != null ? u.getRole() : "patient"))
					.map(u -> new AuthCandidate(u.getId(), u.getPassword(), "patient", u.getOnboardingComplete()));
			case "doctor" -> doctorRepository.findByEmailIgnoreCase(email)
					.map(d -> new AuthCandidate(d.getId(), d.getPassword(), d.getRole() != null ? d.getRole() : "doctor", null));
			case "admin" -> adminRepository.findByEmailIgnoreCase(email)
					.filter(a -> {
						String r = a.getRole() == null ? "admin" : a.getRole();
						return "admin".equalsIgnoreCase(r) || "super_admin".equalsIgnoreCase(r);
					})
					.map(a -> new AuthCandidate(a.getId(), a.getPassword(), a.getRole() != null ? a.getRole() : "admin", null));
			case "hr" -> adminRepository.findByEmailIgnoreCase(email)
					.filter(a -> "hr".equalsIgnoreCase(a.getRole()))
					.map(a -> new AuthCandidate(a.getId(), a.getPassword(), "hr", null));
			case "finance" -> adminRepository.findByEmailIgnoreCase(email)
					.filter(a -> "finance".equalsIgnoreCase(a.getRole()))
					.map(a -> new AuthCandidate(a.getId(), a.getPassword(), "finance", null));
			case "payroll" -> adminRepository.findByEmailIgnoreCase(email)
					.filter(a -> "payroll".equalsIgnoreCase(a.getRole()))
					.map(a -> new AuthCandidate(a.getId(), a.getPassword(), "payroll", null));
			case "procurement" -> adminRepository.findByEmailIgnoreCase(email)
					.filter(a -> "procurement".equalsIgnoreCase(a.getRole()))
					.map(a -> new AuthCandidate(a.getId(), a.getPassword(), "procurement", null));
			case "pharmacy" -> adminRepository.findByEmailIgnoreCase(email)
					.filter(a -> "pharmacy".equalsIgnoreCase(a.getRole()))
					.map(a -> new AuthCandidate(a.getId(), a.getPassword(), "pharmacy", null));
			default -> Optional.empty();
		};
	}

	private record AuthCandidate(Long id, String password, String role, Integer onboardingComplete) {
	}
}

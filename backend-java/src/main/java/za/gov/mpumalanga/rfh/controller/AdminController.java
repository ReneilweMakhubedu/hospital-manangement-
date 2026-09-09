package za.gov.mpumalanga.rfh.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.HpcsaCatalog;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.Admin;
import za.gov.mpumalanga.rfh.entity.Appointment;
import za.gov.mpumalanga.rfh.entity.Doctor;
import za.gov.mpumalanga.rfh.entity.User;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.AdminRepository;
import za.gov.mpumalanga.rfh.repository.AppointmentRepository;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private final AdminRepository adminRepository;
	private final DoctorRepository doctorRepository;
	private final UserRepository userRepository;
	private final AppointmentRepository appointmentRepository;
	private final PasswordEncoder passwordEncoder;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public AdminController(
			AdminRepository adminRepository,
			DoctorRepository doctorRepository,
			UserRepository userRepository,
			AppointmentRepository appointmentRepository,
			PasswordEncoder passwordEncoder,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.adminRepository = adminRepository;
		this.doctorRepository = doctorRepository;
		this.userRepository = userRepository;
		this.appointmentRepository = appointmentRepository;
		this.passwordEncoder = passwordEncoder;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping("/doctor-catalog")
	public Map<String, Object> doctorCatalog() {
		securityUtils.requireHr();
		return HpcsaCatalog.fullCatalog();
	}

	@GetMapping("/doctors")
	public List<Map<String, Object>> listDoctors() {
		securityUtils.requireHr();
		return doctorRepository.findAll().stream().map(responseMapper::doctor).toList();
	}

	@PostMapping("/add-doctor")
	public ResponseEntity<Map<String, Object>> addDoctor(@RequestBody Map<String, Object> body) {
		securityUtils.requireHr();
		String firstName = str(body.get("firstName"));
		String lastName = str(body.get("lastName"));
		String email = str(body.get("email"));
		String specialty = str(body.get("specialty"));
		String licenseNumber = str(body.get("licenseNumber"));
		String phoneNumber = str(body.get("phoneNumber"));
		String password = str(body.get("password"));
		if (!allPresent(firstName, lastName, email, specialty, licenseNumber, phoneNumber, password)) {
			throw new ApiException(400, "All required doctor details must be provided");
		}
		try {
			Doctor doctor = new Doctor();
			applyDoctorCredentials(doctor, body, true);
			doctor.setFirstName(firstName.trim());
			doctor.setLastName(lastName.trim());
			doctor.setEmail(email.trim().toLowerCase(Locale.ROOT));
			doctor.setLicenseNumber(licenseNumber.trim());
			doctor.setPhoneNumber(phoneNumber.trim());
			doctor.setPassword(passwordEncoder.encode(password));
			doctor.setRole("doctor");
			doctor = doctorRepository.save(doctor);
			Map<String, Object> response = new LinkedHashMap<>();
			response.put("message", "Doctor added successfully");
			response.put("doctor", responseMapper.doctor(doctor));
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (DataIntegrityViolationException ex) {
			throw new ApiException(400, "Email or HPCSA / licence number already exists");
		} catch (ApiException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new ApiException(400, "Unable to add doctor");
		}
	}

	@PutMapping("/doctors/{id}")
	public Map<String, Object> updateDoctor(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		securityUtils.requireHr();
		Doctor doctor = doctorRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Doctor not found"));
		try {
			if (body.containsKey("firstName")) {
				doctor.setFirstName(str(body.get("firstName")).trim());
			}
			if (body.containsKey("lastName")) {
				doctor.setLastName(str(body.get("lastName")).trim());
			}
			if (body.containsKey("email")) {
				doctor.setEmail(str(body.get("email")).trim().toLowerCase(Locale.ROOT));
			}
			if (body.containsKey("licenseNumber")) {
				doctor.setLicenseNumber(str(body.get("licenseNumber")).trim());
			}
			if (body.containsKey("phoneNumber")) {
				doctor.setPhoneNumber(str(body.get("phoneNumber")).trim());
			}
			if (body.containsKey("password") && str(body.get("password")) != null && !str(body.get("password")).isBlank()) {
				doctor.setPassword(passwordEncoder.encode(str(body.get("password"))));
			}
			applyDoctorCredentials(doctor, body, false);
			doctor = doctorRepository.save(doctor);
			return responseMapper.doctor(doctor);
		} catch (DataIntegrityViolationException ex) {
			throw new ApiException(400, "Email or HPCSA / licence number already exists");
		} catch (ApiException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new ApiException(400, "Unable to update doctor");
		}
	}

	@PostMapping("/add-admin")
	public ResponseEntity<Map<String, String>> addAdmin(@RequestBody Map<String, Object> body) {
		securityUtils.requireAdmin();
		try {
			Admin admin = new Admin();
			admin.setFirstName(str(body.get("firstName")));
			admin.setLastName(str(body.get("lastName")));
			admin.setEmail(str(body.get("email")).toLowerCase());
			admin.setPassword(passwordEncoder.encode(str(body.get("password"))));
			admin.setRole("admin");
			adminRepository.save(admin);
			return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Admin added successfully"));
		} catch (DataIntegrityViolationException ex) {
			throw new ApiException(400, "Email already exists");
		} catch (Exception ex) {
			throw new ApiException(400, "Unable to add admin");
		}
	}

	@GetMapping("/hr-users")
	public List<Map<String, Object>> listHrUsers() {
		securityUtils.requireAdmin();
		return adminRepository.findAll().stream()
				.filter(a -> "hr".equalsIgnoreCase(a.getRole()))
				.map(responseMapper::admin)
				.toList();
	}

	@PostMapping("/add-hr")
	public ResponseEntity<Map<String, Object>> addHrUser(@RequestBody Map<String, Object> body) {
		securityUtils.requireAdmin();
		String firstName = str(body.get("firstName"));
		String lastName = str(body.get("lastName"));
		String email = str(body.get("email"));
		String password = str(body.get("password"));
		if (!allPresent(firstName, lastName, email, password)) {
			throw new ApiException(400, "First name, last name, email, and password are required");
		}
		try {
			Admin hr = new Admin();
			hr.setFirstName(firstName.trim());
			hr.setLastName(lastName.trim());
			hr.setEmail(email.trim().toLowerCase(Locale.ROOT));
			hr.setPassword(passwordEncoder.encode(password));
			hr.setRole("hr");
			hr = adminRepository.save(hr);
			Map<String, Object> response = new LinkedHashMap<>();
			response.put("message", "HR user created successfully");
			response.put("user", responseMapper.admin(hr));
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (DataIntegrityViolationException ex) {
			throw new ApiException(400, "Email already exists");
		} catch (Exception ex) {
			throw new ApiException(400, "Unable to create HR user");
		}
	}

	@GetMapping("/finance-users")
	public List<Map<String, Object>> listFinanceUsers() {
		securityUtils.requireAdmin();
		return adminRepository.findAll().stream()
				.filter(a -> "finance".equalsIgnoreCase(a.getRole()))
				.map(responseMapper::admin)
				.toList();
	}

	@PostMapping("/add-finance")
	public ResponseEntity<Map<String, Object>> addFinanceUser(@RequestBody Map<String, Object> body) {
		securityUtils.requireAdmin();
		String firstName = str(body.get("firstName"));
		String lastName = str(body.get("lastName"));
		String email = str(body.get("email"));
		String password = str(body.get("password"));
		if (!allPresent(firstName, lastName, email, password)) {
			throw new ApiException(400, "First name, last name, email, and password are required");
		}
		try {
			Admin finance = new Admin();
			finance.setFirstName(firstName.trim());
			finance.setLastName(lastName.trim());
			finance.setEmail(email.trim().toLowerCase(Locale.ROOT));
			finance.setPassword(passwordEncoder.encode(password));
			finance.setRole("finance");
			finance = adminRepository.save(finance);
			Map<String, Object> response = new LinkedHashMap<>();
			response.put("message", "Finance user created successfully");
			response.put("user", responseMapper.admin(finance));
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (DataIntegrityViolationException ex) {
			throw new ApiException(400, "Email already exists");
		} catch (Exception ex) {
			throw new ApiException(400, "Unable to create finance user");
		}
	}

	@GetMapping("/payroll-users")
	public List<Map<String, Object>> listPayrollUsers() {
		securityUtils.requireAdmin();
		return adminRepository.findAll().stream()
				.filter(a -> "payroll".equalsIgnoreCase(a.getRole()))
				.map(responseMapper::admin)
				.toList();
	}

	@PostMapping("/add-payroll")
	public ResponseEntity<Map<String, Object>> addPayrollUser(@RequestBody Map<String, Object> body) {
		securityUtils.requireAdmin();
		String firstName = str(body.get("firstName"));
		String lastName = str(body.get("lastName"));
		String email = str(body.get("email"));
		String password = str(body.get("password"));
		if (!allPresent(firstName, lastName, email, password)) {
			throw new ApiException(400, "First name, last name, email, and password are required");
		}
		try {
			Admin payroll = new Admin();
			payroll.setFirstName(firstName.trim());
			payroll.setLastName(lastName.trim());
			payroll.setEmail(email.trim().toLowerCase(Locale.ROOT));
			payroll.setPassword(passwordEncoder.encode(password));
			payroll.setRole("payroll");
			payroll = adminRepository.save(payroll);
			Map<String, Object> response = new LinkedHashMap<>();
			response.put("message", "Payroll user created successfully");
			response.put("user", responseMapper.admin(payroll));
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (DataIntegrityViolationException ex) {
			throw new ApiException(400, "Email already exists");
		} catch (Exception ex) {
			throw new ApiException(400, "Unable to create payroll user");
		}
	}

	@GetMapping("/procurement-users")
	public List<Map<String, Object>> listProcurementUsers() {
		securityUtils.requireAdmin();
		return adminRepository.findAll().stream()
				.filter(a -> "procurement".equalsIgnoreCase(a.getRole()))
				.map(responseMapper::admin)
				.toList();
	}

	@PostMapping("/add-procurement")
	public ResponseEntity<Map<String, Object>> addProcurementUser(@RequestBody Map<String, Object> body) {
		securityUtils.requireAdmin();
		String firstName = str(body.get("firstName"));
		String lastName = str(body.get("lastName"));
		String email = str(body.get("email"));
		String password = str(body.get("password"));
		if (!allPresent(firstName, lastName, email, password)) {
			throw new ApiException(400, "First name, last name, email, and password are required");
		}
		try {
			Admin procurement = new Admin();
			procurement.setFirstName(firstName.trim());
			procurement.setLastName(lastName.trim());
			procurement.setEmail(email.trim().toLowerCase(Locale.ROOT));
			procurement.setPassword(passwordEncoder.encode(password));
			procurement.setRole("procurement");
			procurement = adminRepository.save(procurement);
			Map<String, Object> response = new LinkedHashMap<>();
			response.put("message", "Procurement user created successfully");
			response.put("user", responseMapper.admin(procurement));
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (DataIntegrityViolationException ex) {
			throw new ApiException(400, "Email already exists");
		} catch (Exception ex) {
			throw new ApiException(400, "Unable to create procurement user");
		}
	}

	@GetMapping("/pharmacy-users")
	public List<Map<String, Object>> listPharmacyUsers() {
		securityUtils.requireAdmin();
		return adminRepository.findAll().stream()
				.filter(a -> "pharmacy".equalsIgnoreCase(a.getRole()))
				.map(responseMapper::admin)
				.toList();
	}

	@PostMapping("/add-pharmacy")
	public ResponseEntity<Map<String, Object>> addPharmacyUser(@RequestBody Map<String, Object> body) {
		securityUtils.requireAdmin();
		String firstName = str(body.get("firstName"));
		String lastName = str(body.get("lastName"));
		String email = str(body.get("email"));
		String password = str(body.get("password"));
		if (!allPresent(firstName, lastName, email, password)) {
			throw new ApiException(400, "First name, last name, email, and password are required");
		}
		try {
			Admin pharmacy = new Admin();
			pharmacy.setFirstName(firstName.trim());
			pharmacy.setLastName(lastName.trim());
			pharmacy.setEmail(email.trim().toLowerCase(Locale.ROOT));
			pharmacy.setPassword(passwordEncoder.encode(password));
			pharmacy.setRole("pharmacy");
			pharmacy = adminRepository.save(pharmacy);
			Map<String, Object> response = new LinkedHashMap<>();
			response.put("message", "Pharmacy user created successfully");
			response.put("user", responseMapper.admin(pharmacy));
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (DataIntegrityViolationException ex) {
			throw new ApiException(400, "Email already exists");
		} catch (Exception ex) {
			throw new ApiException(400, "Unable to create pharmacy user");
		}
	}

	@GetMapping("/profile")
	public Map<String, Object> getProfile() {
		AuthUser auth = securityUtils.requireAdmin();
		Admin admin = adminRepository.findById(auth.id())
				.orElseThrow(() -> new ApiException(404, "Admin not found"));
		return responseMapper.admin(admin);
	}

	@PutMapping("/profile")
	public Map<String, Object> updateProfile(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireAdmin();
		Admin admin = adminRepository.findById(auth.id())
				.orElseThrow(() -> new ApiException(404, "Admin not found"));
		try {
			admin.setFirstName(str(body.get("firstName")));
			admin.setLastName(str(body.get("lastName")));
			admin.setEmail(str(body.get("email")).toLowerCase());
			admin = adminRepository.save(admin);
			Map<String, Object> response = new LinkedHashMap<>();
			response.put("message", "Profile updated successfully");
			response.put("admin", responseMapper.admin(admin));
			return response;
		} catch (Exception ex) {
			throw new ApiException(400, "Unable to update profile");
		}
	}

	@GetMapping("/total-doctors")
	public Map<String, Long> totalDoctors() {
		securityUtils.requireAdmin();
		return Map.of("totalDoctors", doctorRepository.count());
	}

	@GetMapping("/total-patients")
	public Map<String, Long> totalPatients() {
		securityUtils.requireAdmin();
		return Map.of("totalPatients", userRepository.countByRole("patient"));
	}

	@GetMapping("/doctor-overview")
	public List<Map<String, Object>> doctorOverview() {
		securityUtils.requireAdmin();
		List<Appointment> allAppointments = appointmentRepository.findAll();
		return doctorRepository.findAll().stream().map(doctor -> {
			long patients = allAppointments.stream()
					.filter(a -> doctor.getId().equals(a.getDoctorId()))
					.map(Appointment::getPatientId)
					.distinct()
					.count();
			Map<String, Object> map = new LinkedHashMap<>();
			map.put("name", doctor.getFirstName() + " " + doctor.getLastName());
			map.put("specialty", doctor.getSpecialty());
			map.put("designation", doctor.getDesignation());
			map.put("clinicianCategory", doctor.getClinicianCategory());
			map.put("specialistGrade", doctor.getSpecialistGrade());
			map.put("systemRoleCode", doctor.getSystemRoleCode());
			map.put("patients", patients);
			return map;
		}).toList();
	}

	@GetMapping("/patient-overview")
	public List<Map<String, Object>> patientOverview() {
		securityUtils.requireAdmin();
		List<Appointment> allAppointments = appointmentRepository.findAll();
		return userRepository.findByRoleOrderByCreatedAtDesc("patient").stream().map(user -> {
			long count = allAppointments.stream().filter(a -> user.getId().equals(a.getPatientId())).count();
			Map<String, Object> map = new LinkedHashMap<>();
			map.put("name", user.getFirstName() + " " + user.getLastName());
			map.put("appointments", count);
			return map;
		}).toList();
	}

	private void applyDoctorCredentials(Doctor doctor, Map<String, Object> body, boolean creating) {
		String specialty = str(body.get("specialty"));
		if (specialty != null && !specialty.isBlank()) {
			doctor.setSpecialty(specialty.trim());
		} else if (creating) {
			throw new ApiException(400, "Specialty is required");
		}
		specialty = doctor.getSpecialty();

		String clinicianCategory = str(body.get("clinicianCategory"));
		if (clinicianCategory != null && !clinicianCategory.isBlank()) {
			doctor.setClinicianCategory(clinicianCategory.trim().toUpperCase(Locale.ROOT));
		} else if (creating && (doctor.getClinicianCategory() == null || doctor.getClinicianCategory().isBlank())) {
			doctor.setClinicianCategory("SPECIALIST");
		}

		String designation = str(body.get("designation"));
		if (designation != null && !designation.isBlank()) {
			doctor.setDesignation(designation.trim());
		} else if (creating || doctor.getDesignation() == null || doctor.getDesignation().isBlank()) {
			doctor.setDesignation(HpcsaCatalog.designationFor(specialty));
		}

		if (body.containsKey("subSpecialty")) {
			String sub = str(body.get("subSpecialty"));
			doctor.setSubSpecialty(sub == null || sub.isBlank() ? null : sub.trim());
		}

		Integer grade = asInteger(body.get("specialistGrade"));
		String category = doctor.getClinicianCategory();
		boolean gradeApplicable = category != null && List.of(
				"MEDICAL_OFFICER", "SPECIALIST", "SUB_SPECIALIST", "DENTAL_SPECIALIST").contains(category);
		if (body.containsKey("specialistGrade")) {
			doctor.setSpecialistGrade(gradeApplicable ? grade : null);
		} else if (creating && gradeApplicable && doctor.getSpecialistGrade() == null) {
			doctor.setSpecialistGrade(1);
		}
		if (!gradeApplicable) {
			doctor.setSpecialistGrade(null);
		}

		if (body.containsKey("department")) {
			doctor.setDepartment(blankToNull(str(body.get("department"))));
		}
		if (body.containsKey("qualifications")) {
			doctor.setQualifications(blankToNull(str(body.get("qualifications"))));
		}
		if (body.containsKey("yearsExperience")) {
			doctor.setYearsExperience(asInteger(body.get("yearsExperience")));
		}
		if (body.containsKey("workingHours")) {
			doctor.setWorkingHours(blankToNull(str(body.get("workingHours"))));
		}

		String systemRole = str(body.get("systemRoleCode"));
		if (systemRole != null && !systemRole.isBlank()) {
			doctor.setSystemRoleCode(systemRole.trim().toUpperCase(Locale.ROOT));
		} else {
			doctor.setSystemRoleCode(HpcsaCatalog.deriveSystemRoleCode(
					doctor.getClinicianCategory(), doctor.getSpecialistGrade(), specialty));
		}

		String hpcsa = str(body.get("hpcsaRegistrationCategory"));
		if (hpcsa != null && !hpcsa.isBlank()) {
			doctor.setHpcsaRegistrationCategory(hpcsa.trim());
		} else {
			doctor.setHpcsaRegistrationCategory(
					HpcsaCatalog.hpcsaCategoryLabel(doctor.getClinicianCategory(), specialty));
		}

		if (body.containsKey("requiresCosign")) {
			doctor.setRequiresCosign(asBoolean(body.get("requiresCosign")));
		} else {
			doctor.setRequiresCosign(HpcsaCatalog.requiresCosign(doctor.getClinicianCategory()));
		}
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}

	private static Integer asInteger(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof Number number) {
			return number.intValue();
		}
		String text = String.valueOf(value).trim();
		if (text.isEmpty()) {
			return null;
		}
		try {
			return Integer.parseInt(text);
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private static boolean asBoolean(Object value) {
		if (value instanceof Boolean bool) {
			return bool;
		}
		return value != null && Boolean.parseBoolean(String.valueOf(value));
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}

	private static boolean allPresent(String... values) {
		for (String value : values) {
			if (value == null || value.isBlank()) {
				return false;
			}
		}
		return true;
	}
}

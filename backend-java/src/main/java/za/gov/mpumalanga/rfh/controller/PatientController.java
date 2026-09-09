package za.gov.mpumalanga.rfh.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import za.gov.mpumalanga.rfh.config.AppointmentSlots;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.Appointment;
import za.gov.mpumalanga.rfh.entity.Doctor;
import za.gov.mpumalanga.rfh.entity.PatientMedication;
import za.gov.mpumalanga.rfh.entity.QueueEntry;
import za.gov.mpumalanga.rfh.entity.User;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.AppointmentRepository;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.PatientFeedbackRepository;
import za.gov.mpumalanga.rfh.repository.PatientMedicationRepository;
import za.gov.mpumalanga.rfh.repository.PatientNotificationRepository;
import za.gov.mpumalanga.rfh.repository.PrescriptionRepository;
import za.gov.mpumalanga.rfh.repository.QueueRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/patient")
public class PatientController {

	private static final List<String> DEPARTMENTS = List.of(
			"Outpatient",
			"Cardiology",
			"Antenatal",
			"Diabetic",
			"HIV/ART",
			"Oncology",
			"Physiotherapy",
			"Dental",
			"Emergency");

	private static final Set<String> PREFERRED_CHANNELS = Set.of("SMS", "WHATSAPP", "APP", "EMAIL");

	private static final List<String> RED_KEYWORDS = List.of(
			"chest pain", "breathing", "bleeding", "stroke", "unconscious");
	private static final List<String> ORANGE_KEYWORDS = List.of(
			"fever", "severe headache", "abdominal pain", "pregnancy");

	private static final List<String> HEALTH_TIPS = List.of(
			"Take chronic medicines at the same time every day and keep your CCMDD collection date.",
			"Bring your ID, clinic card, and current medication list to every outpatient visit.",
			"Seek emergency care immediately for chest pain, severe bleeding, stroke signs, or difficulty breathing.");

	private final UserRepository userRepository;
	private final DoctorRepository doctorRepository;
	private final AppointmentRepository appointmentRepository;
	private final PrescriptionRepository prescriptionRepository;
	private final QueueRepository queueRepository;
	private final PatientMedicationRepository patientMedicationRepository;
	private final PatientNotificationRepository patientNotificationRepository;
	private final PatientFeedbackRepository patientFeedbackRepository;
	private final PasswordEncoder passwordEncoder;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;
	private final Path uploadDirectory;

	public PatientController(
			UserRepository userRepository,
			DoctorRepository doctorRepository,
			AppointmentRepository appointmentRepository,
			PrescriptionRepository prescriptionRepository,
			QueueRepository queueRepository,
			PatientMedicationRepository patientMedicationRepository,
			PatientNotificationRepository patientNotificationRepository,
			PatientFeedbackRepository patientFeedbackRepository,
			PasswordEncoder passwordEncoder,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) throws IOException {
		this.userRepository = userRepository;
		this.doctorRepository = doctorRepository;
		this.appointmentRepository = appointmentRepository;
		this.prescriptionRepository = prescriptionRepository;
		this.queueRepository = queueRepository;
		this.patientMedicationRepository = patientMedicationRepository;
		this.patientNotificationRepository = patientNotificationRepository;
		this.patientFeedbackRepository = patientFeedbackRepository;
		this.passwordEncoder = passwordEncoder;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
		this.uploadDirectory = Paths.get("uploads").toAbsolutePath().normalize();
		Files.createDirectories(this.uploadDirectory);
	}

	@GetMapping("/records")
	public List<Map<String, Object>> records() {
		securityUtils.requireStaff();
		return userRepository.findByRoleOrderByCreatedAtDesc("patient").stream()
				.map(responseMapper::patient)
				.toList();
	}

	@PostMapping("/records")
	public ResponseEntity<Map<String, Object>> createRecord(@RequestBody Map<String, Object> body) {
		securityUtils.requireStaff();
		String firstName = str(body.get("firstName"));
		String lastName = str(body.get("lastName"));
		String email = str(body.get("email"));
		String password = str(body.get("password"));
		String idNumber = str(body.get("idNumber"));
		String phoneNumber = str(body.get("phoneNumber"));
		String address = str(body.get("address"));
		if (!allPresent(firstName, lastName, email, password, idNumber, phoneNumber, address)) {
			throw new ApiException(400, "All patient details are required");
		}
		if (password.length() < 6) {
			throw new ApiException(400, "Temporary password must be at least 6 characters");
		}
		try {
			User user = new User();
			user.setFirstName(firstName.trim());
			user.setLastName(lastName.trim());
			user.setEmail(email.trim().toLowerCase());
			user.setPassword(passwordEncoder.encode(password));
			user.setRole("patient");
			user.setIdNumber(idNumber.trim());
			user.setPhoneNumber(phoneNumber.trim());
			user.setAddress(address.trim());
			user = userRepository.save(user);
			Map<String, Object> response = new LinkedHashMap<>();
			response.put("message", "Patient registered successfully");
			response.put("patient", responseMapper.patient(user));
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (DataIntegrityViolationException ex) {
			throw new ApiException(400, "A patient with that email address or ID number already exists");
		}
	}

	@GetMapping("/profile")
	public Map<String, Object> getProfile() {
		return responseMapper.patient(requirePatientEntity());
	}

	@PutMapping("/profile")
	public Map<String, Object> updateProfile(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requirePatient();
		User patient = userRepository.findByIdAndRole(auth.id(), "patient")
				.orElseThrow(() -> new ApiException(404, "Patient not found"));

		String email = str(body.get("email"));
		String idNumber = str(body.get("idNumber"));
		String normalizedIdNumber = (idNumber != null && !idNumber.isBlank()) ? idNumber.trim() : null;

		if (email != null && !email.isBlank()
				&& userRepository.existsByEmailIgnoreCaseAndIdNotAndRole(email.toLowerCase(), auth.id(), "patient")) {
			throw new ApiException(400, "Email already in use by another patient");
		}
		if (normalizedIdNumber != null
				&& userRepository.existsByIdNumberAndIdNotAndRole(normalizedIdNumber, auth.id(), "patient")) {
			throw new ApiException(400, "ID number already in use by another patient");
		}

		if (body.containsKey("firstName")) patient.setFirstName(str(body.get("firstName")));
		if (body.containsKey("lastName")) patient.setLastName(str(body.get("lastName")));
		if (email != null) patient.setEmail(email.toLowerCase());
		if (body.containsKey("idNumber")) patient.setIdNumber(normalizedIdNumber);
		if (body.containsKey("phoneNumber")) patient.setPhoneNumber(str(body.get("phoneNumber")));
		if (body.containsKey("address")) patient.setAddress(str(body.get("address")));
		if (body.containsKey("dob")) patient.setDob(str(body.get("dob")));
		if (body.containsKey("gender")) patient.setGender(str(body.get("gender")));
		if (body.containsKey("emergencyContact")) patient.setEmergencyContact(str(body.get("emergencyContact")));
		if (body.containsKey("allergies")) patient.setAllergies(str(body.get("allergies")));
		if (body.containsKey("existingConditions")) patient.setExistingConditions(str(body.get("existingConditions")));
		if (body.containsKey("currentMedications")) patient.setCurrentMedications(str(body.get("currentMedications")));
		if (body.containsKey("previousMedicalInfo")) patient.setPreviousMedicalInfo(str(body.get("previousMedicalInfo")));
		if (body.containsKey("nextOfKin")) patient.setNextOfKin(str(body.get("nextOfKin")));
		if (body.containsKey("bloodType")) patient.setBloodType(str(body.get("bloodType")));
		if (body.containsKey("languagePreference")) patient.setLanguagePreference(blankToDefault(str(body.get("languagePreference")), "English"));
		if (body.containsKey("accessibilityNeeds")) patient.setAccessibilityNeeds(str(body.get("accessibilityNeeds")));
		if (body.containsKey("primaryFacility")) patient.setPrimaryFacility(blankToDefault(str(body.get("primaryFacility")), "Rob Ferreira Hospital"));
		if (body.containsKey("nextOfKinPhone")) patient.setNextOfKinPhone(str(body.get("nextOfKinPhone")));
		if (body.containsKey("nextOfKinRelation")) patient.setNextOfKinRelation(str(body.get("nextOfKinRelation")));
		if (body.containsKey("ccmddEnrolled")) patient.setCcmddEnrolled(asBoolean(body.get("ccmddEnrolled")));
		if (body.containsKey("ccmddPickupPoint")) patient.setCcmddPickupPoint(str(body.get("ccmddPickupPoint")));
		if (body.containsKey("nextCollectionDate")) patient.setNextCollectionDate(str(body.get("nextCollectionDate")));
		if (body.containsKey("whatsappConsent")) patient.setWhatsappConsent(asBoolean(body.get("whatsappConsent")));
		if (body.containsKey("marketingConsent")) patient.setMarketingConsent(asBoolean(body.get("marketingConsent")));
		if (body.containsKey("dataSharingConsent")) patient.setDataSharingConsent(asBoolean(body.get("dataSharingConsent")));
		if (body.containsKey("popiaConsent")) patient.setPopiaConsent(asBoolean(body.get("popiaConsent")));
		if (body.containsKey("preferredChannel")) {
			patient.setPreferredChannel(normalizePreferredChannel(str(body.get("preferredChannel"))));
		}
		if (body.containsKey("smsConsent")) {
			patient.setSmsConsent(asBoolean(body.get("smsConsent")));
		}
		if (body.containsKey("onboardingComplete")) {
			patient.setOnboardingComplete(asBoolean(body.get("onboardingComplete")) ? 1 : 0);
		}

		try {
			patient = userRepository.save(patient);
			auditService.log(auth, "UPDATE", "Patient", patient.getId(), "Patient profile updated");
			return responseMapper.patient(patient);
		} catch (DataIntegrityViolationException ex) {
			throw new ApiException(400, "Email or ID number already exists");
		}
	}

	@PostMapping("/documents")
	public Map<String, Object> uploadDocuments(@RequestParam("documents") List<MultipartFile> files) {
		AuthUser auth = securityUtils.requirePatient();
		User patient = userRepository.findByIdAndRole(auth.id(), "patient")
				.orElseThrow(() -> new ApiException(404, "Patient not found"));

		List<Object> existing = new ArrayList<>(responseMapper.parseDocuments(patient.getDocuments()));
		List<Object> merged = new ArrayList<>(existing);
		try {
			for (MultipartFile file : files == null ? List.<MultipartFile>of() : files) {
				if (file == null || file.isEmpty()) {
					continue;
				}
				String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
				String safe = original.replaceAll("[^a-zA-Z0-9.]", "_");
				String filename = System.currentTimeMillis() + "-" + safe;
				Path target = uploadDirectory.resolve(filename);
				Files.copy(file.getInputStream(), target);
				Map<String, Object> doc = new LinkedHashMap<>();
				doc.put("originalName", original);
				doc.put("filename", filename);
				doc.put("url", "/uploads/" + filename);
				doc.put("uploadedAt", Instant.now().toString());
				merged.add(doc);
			}
			patient.setDocuments(responseMapper.writeDocuments(merged));
			userRepository.save(patient);
			return Map.of("documents", merged);
		} catch (IOException ex) {
			throw new ApiException(500, "Unable to upload documents");
		}
	}

	@GetMapping("/departments")
	public List<String> departments() {
		securityUtils.requirePatient();
		return DEPARTMENTS;
	}

	@PostMapping("/book-appointment")
	public ResponseEntity<Map<String, Object>> bookAppointment(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requirePatient();
		try {
			String reason = str(body.get("reason"));
			String purpose = str(body.get("purpose"));
			String department = str(body.get("department"));
			String urgency = triageUrgency(reason);

			Appointment appointment = new Appointment();
			appointment.setPatientId(auth.id());
			appointment.setDoctorId(asLong(body.get("doctorId")));
			appointment.setDate(str(body.get("date")));
			appointment.setTime(str(body.get("time")));
			appointment.setReason(reason == null ? "" : reason);
			appointment.setPurpose(purpose);
			appointment.setDepartment(department);
			appointment.setUrgency(urgency);
			appointment.setVisitPrep(str(body.get("visitPrep")));
			appointment.setReferenceNumber(nextAppointmentReference());
			appointment = appointmentRepository.save(appointment);

			Map<String, Object> response = new LinkedHashMap<>();
			response.put("message", "Appointment booked successfully");
			response.put("urgency", urgency);
			response.put("appointment", responseMapper.appointment(appointment));
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (ApiException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new ApiException(500, "Server error");
		}
	}

	@GetMapping("/available-slots")
	public List<String> availableSlots(@RequestParam Long doctorId, @RequestParam String date) {
		securityUtils.requirePatient();
		List<String> booked = appointmentRepository.findByDoctorIdAndDate(doctorId, date).stream()
				.map(Appointment::getTime)
				.toList();
		return AppointmentSlots.FIXED_SLOTS.stream().filter(slot -> !booked.contains(slot)).toList();
	}

	@GetMapping("/appointments")
	public List<Map<String, Object>> todayAppointments() {
		AuthUser auth = securityUtils.requirePatient();
		String today = LocalDate.now().toString();
		return appointmentRepository.findByPatientIdAndDateOrderByTimeAsc(auth.id(), today).stream()
				.map(a -> {
					Map<String, Object> map = responseMapper.appointment(a);
					doctorRepository.findById(a.getDoctorId()).ifPresent(d -> {
						map.put("doctorFirstName", d.getFirstName());
						map.put("doctorLastName", d.getLastName());
					});
					return map;
				})
				.toList();
	}

	@GetMapping("/care-team")
	public List<Map<String, Object>> careTeam() {
		AuthUser auth = securityUtils.requirePatient();
		return appointmentRepository.findDistinctDoctorIdsByPatientId(auth.id()).stream()
				.map(doctorRepository::findById)
				.filter(java.util.Optional::isPresent)
				.map(java.util.Optional::get)
				.map(d -> {
					Map<String, Object> map = new LinkedHashMap<>();
					map.put("_id", d.getId());
					map.put("firstName", d.getFirstName());
					map.put("lastName", d.getLastName());
					map.put("specialty", d.getSpecialty());
					return map;
				})
				.toList();
	}

	@GetMapping("/prescriptions")
	public List<Map<String, Object>> prescriptions() {
		AuthUser auth = securityUtils.requirePatient();
		return prescriptionRepository.findByPatientId(auth.id()).stream()
				.map(p -> {
					Map<String, Object> map = responseMapper.prescription(p);
					doctorRepository.findById(p.getDoctorId()).ifPresent(d -> {
						map.put("doctorFirstName", d.getFirstName());
						map.put("doctorLastName", d.getLastName());
					});
					return map;
				})
				.toList();
	}

	@GetMapping("/my-appointments")
	public List<Map<String, Object>> myAppointments() {
		AuthUser auth = securityUtils.requirePatient();
		return appointmentRepository.findByPatientIdOrderByDateDescTimeDesc(auth.id()).stream()
				.map(this::appointmentWithDoctor)
				.toList();
	}

	@PutMapping("/appointments/{id}/reschedule")
	public Map<String, Object> reschedule(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requirePatient();
		String date = str(body.get("date"));
		String time = str(body.get("time"));
		if (date == null || time == null || date.isBlank() || time.isBlank()) {
			throw new ApiException(400, "Date and time are required");
		}
		Appointment appointment = appointmentRepository.findByIdAndPatientId(id, auth.id())
				.orElseThrow(() -> new ApiException(404, "Appointment not found"));
		if (appointmentRepository.existsByDoctorIdAndDateAndTimeAndIdNot(
				appointment.getDoctorId(), date, time, appointment.getId())) {
			throw new ApiException(400, "That time slot is not available. Please choose another.");
		}
		appointment.setDate(date);
		appointment.setTime(time);
		appointmentRepository.save(appointment);
		return appointmentWithDoctor(appointment);
	}

	@DeleteMapping("/appointments/{id}")
	public Map<String, String> cancel(@PathVariable Long id) {
		AuthUser auth = securityUtils.requirePatient();
		Appointment appointment = appointmentRepository.findByIdAndPatientId(id, auth.id())
				.orElseThrow(() -> new ApiException(404, "Appointment not found"));
		appointmentRepository.delete(appointment);
		return Map.of("message", "Appointment cancelled. The time slot is now available for other patients.");
	}

	@GetMapping("/queue-status")
	public Map<String, Object> queueStatus() {
		AuthUser auth = securityUtils.requirePatient();
		return buildQueueStatus(auth.id());
	}

	@GetMapping("/dashboard")
	public Map<String, Object> dashboard() {
		AuthUser auth = securityUtils.requirePatient();
		User patient = userRepository.findByIdAndRole(auth.id(), "patient")
				.orElseThrow(() -> new ApiException(404, "Patient not found"));

		String today = LocalDate.now().toString();
		List<Map<String, Object>> upcoming = appointmentRepository
				.findByPatientIdAndDateGreaterThanEqualOrderByDateAscTimeAsc(auth.id(), today).stream()
				.limit(3)
				.map(this::appointmentWithDoctor)
				.toList();

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("firstName", patient.getFirstName());
		response.put("profile", responseMapper.patient(patient));
		response.put("upcomingAppointments", upcoming);
		response.put("medicationSummary", buildMedicationSummary(auth.id(), patient));
		response.put("unreadNotifications", patientNotificationRepository.countByPatientIdAndReadFlagFalse(auth.id()));
		response.put("openFeedbackCount", patientFeedbackRepository.countByPatientIdAndStatus(auth.id(), "OPEN"));
		response.put("queueStatus", buildQueueStatus(auth.id()));
		response.put("healthTips", HEALTH_TIPS);
		return response;
	}

	private Map<String, Object> buildQueueStatus(Long patientId) {
		LocalDate today = LocalDate.now();
		var entryOpt = queueRepository.findByPatientIdAndQueueDateAndStatusIn(
				patientId, today, List.of("waiting", "called"));
		if (entryOpt.isEmpty()) {
			Map<String, Object> empty = new LinkedHashMap<>();
			empty.put("inQueue", false);
			empty.put("queueNumber", null);
			empty.put("status", null);
			empty.put("estimatedWaitMinutes", null);
			return empty;
		}
		QueueEntry entry = entryOpt.get();
		long waitingBefore = "waiting".equalsIgnoreCase(entry.getStatus())
				? queueRepository.countWaitingBefore(today, entry.getQueueNumber())
				: 0;
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("inQueue", true);
		map.put("_id", entry.getId());
		map.put("queueNumber", entry.getQueueNumber());
		map.put("status", entry.getStatus());
		map.put("reason", entry.getReason());
		map.put("estimatedWaitMinutes", waitingBefore * 12);
		return map;
	}

	private Map<String, Object> buildMedicationSummary(Long patientId, User patient) {
		List<PatientMedication> active = patientMedicationRepository.findByPatientIdAndStatus(patientId, "ACTIVE");
		String nextCollection = patient.getNextCollectionDate();
		for (PatientMedication med : active) {
			if (med.getNextCollectionDate() == null || med.getNextCollectionDate().isBlank()) {
				continue;
			}
			if (nextCollection == null || nextCollection.isBlank()
					|| med.getNextCollectionDate().compareTo(nextCollection) < 0) {
				nextCollection = med.getNextCollectionDate();
			}
		}
		String today = LocalDate.now().toString();
		boolean ready = nextCollection != null && !nextCollection.isBlank() && nextCollection.compareTo(today) <= 0;
		long missed = active.stream()
				.filter(m -> Boolean.TRUE.equals(m.getCcmdd()))
				.filter(m -> m.getNextCollectionDate() != null && !m.getNextCollectionDate().isBlank())
				.filter(m -> m.getNextCollectionDate().compareTo(today) < 0)
				.filter(m -> m.getLastCollectedDate() == null
						|| m.getLastCollectedDate().compareTo(m.getNextCollectionDate()) < 0)
				.count();

		Map<String, Object> map = new LinkedHashMap<>();
		map.put("activeCount", active.size());
		map.put("nextCollectionDate", nextCollection);
		map.put("readyForCollection", ready);
		map.put("missedCollections", missed);
		return map;
	}

	private User requirePatientEntity() {
		AuthUser auth = securityUtils.requirePatient();
		return userRepository.findByIdAndRole(auth.id(), "patient")
				.orElseThrow(() -> new ApiException(404, "Patient not found"));
	}

	private String nextAppointmentReference() {
		String day = DateTimeFormatter.ofPattern("yyyyMMdd")
				.withZone(ZoneOffset.systemDefault())
				.format(Instant.now());
		String prefix = "APT-" + day + "-";
		long seq = appointmentRepository.countByReferenceNumberStartingWith(prefix) + 1;
		return prefix + String.format("%04d", seq);
	}

	private static String triageUrgency(String reason) {
		String text = reason == null ? "" : reason.toLowerCase(Locale.ROOT);
		for (String keyword : RED_KEYWORDS) {
			if (text.contains(keyword)) {
				return "RED";
			}
		}
		for (String keyword : ORANGE_KEYWORDS) {
			if (text.contains(keyword)) {
				return "ORANGE";
			}
		}
		return "GREEN";
	}

	private Map<String, Object> appointmentWithDoctor(Appointment appointment) {
		Map<String, Object> map = responseMapper.appointment(appointment);
		Doctor doctor = doctorRepository.findById(appointment.getDoctorId()).orElse(null);
		if (doctor != null) {
			map.put("doctorName", doctor.getFirstName() + " " + doctor.getLastName());
			map.put("specialty", doctor.getSpecialty());
		}
		return map;
	}

	private static String normalizePreferredChannel(String value) {
		if (value == null || value.isBlank()) {
			return "SMS";
		}
		String normalized = value.trim().toUpperCase(Locale.ROOT);
		if (!PREFERRED_CHANNELS.contains(normalized)) {
			throw new ApiException(400, "preferredChannel must be SMS, WHATSAPP, APP, or EMAIL");
		}
		return normalized;
	}

	private static String blankToDefault(String value, String defaultValue) {
		if (value == null || value.isBlank()) {
			return defaultValue;
		}
		return value.trim();
	}

	private static boolean asBoolean(Object value) {
		if (value instanceof Boolean b) {
			return b;
		}
		if (value instanceof Number n) {
			return n.intValue() != 0;
		}
		return value != null && Boolean.parseBoolean(String.valueOf(value));
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}

	private static Long asLong(Object value) {
		if (value instanceof Number number) {
			return number.longValue();
		}
		return value == null ? null : Long.parseLong(String.valueOf(value));
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

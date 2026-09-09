package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.AppointmentSlots;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.Appointment;
import za.gov.mpumalanga.rfh.entity.ClinicalNote;
import za.gov.mpumalanga.rfh.entity.Doctor;
import za.gov.mpumalanga.rfh.entity.Prescription;
import za.gov.mpumalanga.rfh.entity.QueueEntry;
import za.gov.mpumalanga.rfh.entity.User;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.AppointmentRepository;
import za.gov.mpumalanga.rfh.repository.ClinicalNoteRepository;
import za.gov.mpumalanga.rfh.repository.ClinicalOrderRepository;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.PrescriptionRepository;
import za.gov.mpumalanga.rfh.repository.QueueRepository;
import za.gov.mpumalanga.rfh.repository.ReferralLetterRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/doctor")
public class DoctorController {

	private static final int WAIT_MINUTES_PER_PATIENT = 15;
	private static final List<String> OPEN_ORDER_STATUSES = List.of("ORDERED", "IN_PROGRESS");
	private static final List<String> OPEN_REFERRAL_STATUSES = List.of("DRAFT", "SENT");

	private final DoctorRepository doctorRepository;
	private final UserRepository userRepository;
	private final AppointmentRepository appointmentRepository;
	private final PrescriptionRepository prescriptionRepository;
	private final QueueRepository queueRepository;
	private final ClinicalNoteRepository clinicalNoteRepository;
	private final ClinicalOrderRepository clinicalOrderRepository;
	private final ReferralLetterRepository referralLetterRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public DoctorController(
			DoctorRepository doctorRepository,
			UserRepository userRepository,
			AppointmentRepository appointmentRepository,
			PrescriptionRepository prescriptionRepository,
			QueueRepository queueRepository,
			ClinicalNoteRepository clinicalNoteRepository,
			ClinicalOrderRepository clinicalOrderRepository,
			ReferralLetterRepository referralLetterRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.doctorRepository = doctorRepository;
		this.userRepository = userRepository;
		this.appointmentRepository = appointmentRepository;
		this.prescriptionRepository = prescriptionRepository;
		this.queueRepository = queueRepository;
		this.clinicalNoteRepository = clinicalNoteRepository;
		this.clinicalOrderRepository = clinicalOrderRepository;
		this.referralLetterRepository = referralLetterRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping("/profile")
	public Map<String, Object> getProfile() {
		AuthUser auth = securityUtils.requireDoctor();
		Doctor doctor = doctorRepository.findById(auth.id())
				.orElseThrow(() -> new ApiException(404, "Doctor not found"));
		return responseMapper.doctor(doctor);
	}

	@PutMapping("/profile")
	public Map<String, Object> updateProfile(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireDoctor();
		Doctor doctor = doctorRepository.findById(auth.id())
				.orElseThrow(() -> new ApiException(404, "Doctor not found"));
		try {
			if (body.containsKey("firstName")) {
				doctor.setFirstName(str(body.get("firstName")));
			}
			if (body.containsKey("lastName")) {
				doctor.setLastName(str(body.get("lastName")));
			}
			if (body.containsKey("email")) {
				doctor.setEmail(str(body.get("email")).toLowerCase(Locale.ROOT));
			}
			if (body.containsKey("specialty")) {
				doctor.setSpecialty(str(body.get("specialty")));
			}
			if (body.containsKey("licenseNumber")) {
				doctor.setLicenseNumber(str(body.get("licenseNumber")));
			}
			if (body.containsKey("phoneNumber")) {
				doctor.setPhoneNumber(str(body.get("phoneNumber")));
			}
			if (body.containsKey("department")) {
				doctor.setDepartment(str(body.get("department")));
			}
			if (body.containsKey("qualifications")) {
				doctor.setQualifications(str(body.get("qualifications")));
			}
			if (body.containsKey("yearsExperience")) {
				doctor.setYearsExperience(asInteger(body.get("yearsExperience")));
			}
			if (body.containsKey("workingHours")) {
				doctor.setWorkingHours(str(body.get("workingHours")));
			}
			if (body.containsKey("availableToday")) {
				doctor.setAvailableToday(asBoolean(body.get("availableToday"), true));
			}
			if (body.containsKey("consultationNotesTemplate")) {
				doctor.setConsultationNotesTemplate(str(body.get("consultationNotesTemplate")));
			}
			doctor = doctorRepository.save(doctor);
			return responseMapper.doctor(doctor);
		} catch (ApiException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new ApiException(400, "Unable to update profile");
		}
	}

	@GetMapping("/dashboard")
	public Map<String, Object> dashboard() {
		AuthUser auth = securityUtils.requireDoctor();
		Doctor doctor = doctorRepository.findById(auth.id())
				.orElseThrow(() -> new ApiException(404, "Doctor not found"));
		LocalDate today = LocalDate.now();
		String todayStr = today.toString();
		LocalDate weekStart = today.minusDays(6);

		List<Appointment> todayAppointments = appointmentRepository.findByDoctorIdAndDateOrderByTimeAsc(auth.id(), todayStr);
		List<QueueEntry> todayQueue = queueRepository.findByQueueDateOrderByQueueNumberAsc(today);
		Set<Long> doctorPatientIds = todayAppointments.stream()
				.map(Appointment::getPatientId)
				.collect(Collectors.toSet());

		long waitingLinked = todayQueue.stream()
				.filter(q -> "waiting".equalsIgnoreCase(q.getStatus()))
				.filter(q -> doctorPatientIds.contains(q.getPatientId()))
				.count();
		long waitingTotal = todayQueue.stream()
				.filter(q -> "waiting".equalsIgnoreCase(q.getStatus()))
				.count();
		long waitingQueueCount = waitingLinked > 0 ? waitingLinked : waitingTotal;

		long patientsSeenToday = todayAppointments.stream()
				.filter(a -> a.getStatus() != null && a.getStatus().equalsIgnoreCase("completed"))
				.count();

		long criticalFromAppts = todayAppointments.stream()
				.filter(a -> a.getUrgency() != null && "RED".equalsIgnoreCase(a.getUrgency()))
				.count();
		long criticalFromNotes = clinicalNoteRepository.findAll().stream()
				.filter(n -> Objects.equals(n.getDoctorId(), auth.id()))
				.filter(n -> todayStr.equals(n.getVisitDate()))
				.filter(this::noteLooksCritical)
				.count();
		long criticalFlagsCount = criticalFromAppts + criticalFromNotes;

		List<Map<String, Object>> upcoming = todayAppointments.stream()
				.filter(a -> a.getStatus() == null
						|| (!a.getStatus().equalsIgnoreCase("completed")
						&& !a.getStatus().equalsIgnoreCase("cancelled")))
				.map(a -> enrichAppointment(a, todayQueue))
				.toList();

		long openOrdersCount = clinicalOrderRepository.countByDoctorIdAndStatusIn(auth.id(), OPEN_ORDER_STATUSES);
		long openReferralsCount = referralLetterRepository.countByDoctorIdAndStatusIn(auth.id(), OPEN_REFERRAL_STATUSES);

		List<Appointment> weekAppointments = appointmentRepository.findByDoctorId(auth.id()).stream()
				.filter(a -> {
					LocalDate d = parseDate(a.getDate());
					return !d.isBefore(weekStart) && !d.isAfter(today);
				})
				.toList();
		long patientsThisWeek = weekAppointments.stream().map(Appointment::getPatientId).distinct().count();

		Instant weekStartInstant = weekStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
		long prescriptionsThisWeek = prescriptionRepository.findByDoctorId(auth.id()).stream()
				.filter(p -> p.getCreatedAt() != null && !p.getCreatedAt().isBefore(weekStartInstant))
				.count();

		Map<String, Object> metrics = new LinkedHashMap<>();
		metrics.put("patientsThisWeek", patientsThisWeek);
		metrics.put("prescriptionsThisWeek", prescriptionsThisWeek);

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("profile", responseMapper.doctor(doctor));
		response.put("todayAppointmentsCount", todayAppointments.size());
		response.put("waitingQueueCount", waitingQueueCount);
		response.put("patientsSeenToday", patientsSeenToday);
		response.put("criticalFlagsCount", criticalFlagsCount);
		response.put("upcomingAppointments", upcoming);
		response.put("openOrdersCount", openOrdersCount);
		response.put("openReferralsCount", openReferralsCount);
		response.put("metrics", metrics);
		return response;
	}

	@GetMapping("/queue")
	public List<Map<String, Object>> doctorQueue() {
		AuthUser auth = securityUtils.requireDoctor();
		LocalDate today = LocalDate.now();
		String todayStr = today.toString();
		Set<Long> minePatientIds = appointmentRepository.findByDoctorIdAndDate(auth.id(), todayStr).stream()
				.map(Appointment::getPatientId)
				.collect(Collectors.toSet());

		List<QueueEntry> entries = queueRepository.findByQueueDateOrderByQueueNumberAsc(today);
		List<Map<String, Object>> result = new ArrayList<>();
		for (QueueEntry entry : entries) {
			User patient = userRepository.findById(entry.getPatientId()).orElse(null);
			if (patient == null) {
				continue;
			}
			Map<String, Object> map = responseMapper.queue(entry, patient);
			map.put("patientName", patient.getFirstName() + " " + patient.getLastName());
			map.put("mine", minePatientIds.contains(entry.getPatientId()));
			long ahead = queueRepository.countWaitingBefore(today, entry.getQueueNumber());
			map.put("waitMinutesEstimate", ahead * WAIT_MINUTES_PER_PATIENT);
			result.add(map);
		}
		return result;
	}

	@GetMapping("/governance")
	public Map<String, Object> governance() {
		AuthUser auth = securityUtils.requireDoctor();
		LocalDate today = LocalDate.now();
		String todayStr = today.toString();
		LocalDate weekStart = today.minusDays(6);
		Instant weekStartInstant = weekStart.atStartOfDay(ZoneId.systemDefault()).toInstant();

		List<Appointment> todayAppointments = appointmentRepository.findByDoctorIdAndDateOrderByTimeAsc(auth.id(), todayStr);
		long patientsSeenToday = todayAppointments.stream()
				.filter(a -> a.getStatus() != null && a.getStatus().equalsIgnoreCase("completed"))
				.count();

		List<QueueEntry> waiting = queueRepository.findByQueueDateOrderByQueueNumberAsc(today).stream()
				.filter(q -> "waiting".equalsIgnoreCase(q.getStatus()))
				.toList();
		int averageWaitHint = waiting.isEmpty() ? 0 : waiting.size() * WAIT_MINUTES_PER_PATIENT / 2;

		long prescriptionsIssuedWeek = prescriptionRepository.findByDoctorId(auth.id()).stream()
				.filter(p -> p.getCreatedAt() != null && !p.getCreatedAt().isBefore(weekStartInstant))
				.count();

		long openReferrals = referralLetterRepository.countByDoctorIdAndStatusIn(auth.id(), OPEN_REFERRAL_STATUSES);
		long labOrdersPending = clinicalOrderRepository.countByDoctorIdAndStatusIn(auth.id(), OPEN_ORDER_STATUSES);

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("patientsSeenToday", patientsSeenToday);
		response.put("averageWaitHint", averageWaitHint);
		response.put("prescriptionsIssuedWeek", prescriptionsIssuedWeek);
		response.put("openReferrals", openReferrals);
		response.put("labOrdersPending", labOrdersPending);
		response.put("chronicFocusTips", List.of(
				"Review CCMDD pickup adherence for hypertensive and diabetic patients each clinic day.",
				"Confirm ART refill dates and viral-load follow-up before discharging stable HIV patients.",
				"Document allergy status and current medicines before issuing new prescriptions."));
		response.put("guidelines", List.of(
				Map.of(
						"title", "SEMDSA diabetes guidance (adult type 2)",
						"blurb", "Screen for complications, escalate therapy stepwise, and reinforce lifestyle counselling at every visit."),
				Map.of(
						"title", "NDoH HIV ART clinical guidelines",
						"blurb", "Prioritise same-day ART start where eligible, monitor VL, and manage side effects promptly."),
				Map.of(
						"title", "SA hypertension practice guideline",
						"blurb", "Confirm elevated BP readings, prefer combination therapy when indicated, and track home BP where available.")));
		return response;
	}

	@GetMapping("/all")
	public List<Map<String, Object>> allDoctors() {
		return doctorRepository.findAll().stream().map(responseMapper::doctorPublic).toList();
	}

	@GetMapping("/patients-with-appointments")
	public List<Map<String, Object>> patientsWithAppointments() {
		AuthUser auth = securityUtils.requireDoctor();
		LocalDate today = LocalDate.now();
		List<Appointment> appointments = appointmentRepository.findByDoctorId(auth.id());
		Map<Long, List<Appointment>> byPatient = appointments.stream()
				.collect(Collectors.groupingBy(Appointment::getPatientId));

		return byPatient.entrySet().stream()
				.map(entry -> {
					User user = userRepository.findById(entry.getKey()).orElse(null);
					if (user == null) {
						return null;
					}
					List<Appointment> list = entry.getValue();
					String lastVisit = list.stream()
							.filter(a -> parseDate(a.getDate()).isBefore(today))
							.map(Appointment::getDate)
							.max(Comparator.naturalOrder())
							.orElse(null);
					String nextAppointment = list.stream()
							.filter(a -> !parseDate(a.getDate()).isBefore(today))
							.map(Appointment::getDate)
							.min(Comparator.naturalOrder())
							.orElse(null);
					Map<String, Object> map = new LinkedHashMap<>();
					map.put("_id", user.getId());
					map.put("firstName", user.getFirstName());
					map.put("lastName", user.getLastName());
					map.put("email", user.getEmail());
					map.put("idNumber", user.getIdNumber());
					map.put("phoneNumber", user.getPhoneNumber());
					map.put("address", user.getAddress());
					map.put("lastVisit", lastVisit);
					map.put("nextAppointment", nextAppointment);
					return map;
				})
				.filter(m -> m != null)
				.toList();
	}

	@GetMapping("/available-slots")
	public List<String> availableSlots(@RequestParam String date) {
		AuthUser auth = securityUtils.requireDoctor();
		List<String> booked = appointmentRepository.findByDoctorIdAndDate(auth.id(), date).stream()
				.map(Appointment::getTime)
				.toList();
		return AppointmentSlots.FIXED_SLOTS.stream().filter(slot -> !booked.contains(slot)).toList();
	}

	@PostMapping("/schedule-appointment")
	public ResponseEntity<Map<String, Object>> schedule(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireDoctor();
		try {
			Appointment appointment = new Appointment();
			appointment.setPatientId(asLong(body.get("patientId")));
			appointment.setDoctorId(auth.id());
			appointment.setDate(str(body.get("date")));
			appointment.setTime(str(body.get("time")));
			appointment.setReason(str(body.get("reason")));
			appointment = appointmentRepository.save(appointment);
			Map<String, Object> response = new LinkedHashMap<>();
			response.put("message", "Appointment scheduled successfully");
			response.put("appointment", responseMapper.appointment(appointment));
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (Exception ex) {
			throw new ApiException(400, "Unable to schedule appointment");
		}
	}

	@PostMapping("/prescribe-medication")
	public ResponseEntity<Map<String, Object>> prescribe(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireDoctor();
		try {
			Prescription prescription = new Prescription();
			prescription.setPatientId(asLong(body.get("patientId")));
			prescription.setDoctorId(auth.id());
			prescription.setMedication(str(body.get("medication")));
			prescription.setDosage(str(body.get("dosage")));
			prescription.setFrequency(str(body.get("frequency")));
			prescription = prescriptionRepository.save(prescription);
			Map<String, Object> response = new LinkedHashMap<>();
			response.put("message", "Medication prescribed successfully");
			response.put("prescription", responseMapper.prescription(prescription));
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (Exception ex) {
			throw new ApiException(400, "Unable to save prescription");
		}
	}

	@GetMapping("/prescriptions")
	public List<Map<String, Object>> prescriptions() {
		AuthUser auth = securityUtils.requireDoctor();
		return prescriptionRepository.findByDoctorId(auth.id()).stream()
				.map(responseMapper::prescription)
				.toList();
	}

	@GetMapping("/prescriptions/{patientId}")
	public List<Map<String, Object>> prescriptionsForPatient(@PathVariable Long patientId) {
		AuthUser auth = securityUtils.requireDoctor();
		return prescriptionRepository.findByDoctorIdAndPatientId(auth.id(), patientId).stream()
				.map(responseMapper::prescription)
				.toList();
	}

	@PutMapping("/prescriptions/{id}")
	public Map<String, Object> updatePrescription(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireDoctor();
		Prescription prescription = prescriptionRepository.findByIdAndDoctorId(id, auth.id())
				.orElseThrow(() -> new ApiException(404, "Prescription not found"));
		prescription.setMedication(str(body.get("medication")));
		prescription.setDosage(str(body.get("dosage")));
		prescription.setFrequency(str(body.get("frequency")));
		return responseMapper.prescription(prescriptionRepository.save(prescription));
	}

	@DeleteMapping("/prescriptions/{id}")
	public Map<String, String> deletePrescription(@PathVariable Long id) {
		AuthUser auth = securityUtils.requireDoctor();
		Prescription prescription = prescriptionRepository.findByIdAndDoctorId(id, auth.id())
				.orElseThrow(() -> new ApiException(404, "Prescription not found"));
		prescriptionRepository.delete(prescription);
		return Map.of("message", "Prescription deleted successfully");
	}

	@GetMapping("/appointments")
	public List<Map<String, Object>> todayAppointments() {
		AuthUser auth = securityUtils.requireDoctor();
		String today = LocalDate.now().toString();
		return appointmentRepository.findByDoctorIdAndDateOrderByTimeAsc(auth.id(), today).stream()
				.map(a -> {
					Map<String, Object> map = responseMapper.appointment(a);
					userRepository.findById(a.getPatientId()).ifPresent(u -> {
						map.put("patientFirstName", u.getFirstName());
						map.put("patientLastName", u.getLastName());
					});
					return map;
				})
				.toList();
	}

	private Map<String, Object> enrichAppointment(Appointment appointment, List<QueueEntry> todayQueue) {
		Map<String, Object> map = responseMapper.appointment(appointment);
		userRepository.findById(appointment.getPatientId()).ifPresent(u -> {
			map.put("patientName", u.getFirstName() + " " + u.getLastName());
			map.put("patientFirstName", u.getFirstName());
			map.put("patientLastName", u.getLastName());
		});
		int waitEstimate = todayQueue.stream()
				.filter(q -> Objects.equals(q.getPatientId(), appointment.getPatientId()))
				.filter(q -> "waiting".equalsIgnoreCase(q.getStatus()))
				.findFirst()
				.map(q -> (int) (queueRepository.countWaitingBefore(q.getQueueDate(), q.getQueueNumber())
						* WAIT_MINUTES_PER_PATIENT))
				.orElse(WAIT_MINUTES_PER_PATIENT);
		map.put("waitEstimateMinutes", waitEstimate);
		return map;
	}

	private boolean noteLooksCritical(ClinicalNote note) {
		String blob = String.join(" ",
				nullToEmpty(note.getChiefComplaint()),
				nullToEmpty(note.getDiagnosis()),
				nullToEmpty(note.getNotes()),
				nullToEmpty(note.getSoapAssessment())).toLowerCase(Locale.ROOT);
		return blob.contains("critical")
				|| blob.contains("red flag")
				|| blob.contains("emergency")
				|| blob.contains("urgent");
	}

	private static String nullToEmpty(String value) {
		return value == null ? "" : value;
	}

	private static LocalDate parseDate(String value) {
		try {
			return LocalDate.parse(value);
		} catch (Exception ex) {
			return LocalDate.MIN;
		}
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}

	private static Long asLong(Object value) {
		if (value instanceof Number number) {
			return number.longValue();
		}
		return Long.parseLong(String.valueOf(value));
	}

	private static Integer asInteger(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof Number number) {
			return number.intValue();
		}
		return Integer.parseInt(String.valueOf(value));
	}

	private static boolean asBoolean(Object value, boolean defaultValue) {
		if (value == null) {
			return defaultValue;
		}
		if (value instanceof Boolean b) {
			return b;
		}
		return Boolean.parseBoolean(String.valueOf(value));
	}
}

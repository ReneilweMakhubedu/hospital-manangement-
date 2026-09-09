package za.gov.mpumalanga.rfh.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
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
import za.gov.mpumalanga.rfh.entity.Appointment;
import za.gov.mpumalanga.rfh.entity.Doctor;
import za.gov.mpumalanga.rfh.entity.User;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.AppointmentRepository;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentsController {

	private final AppointmentRepository appointmentRepository;
	private final UserRepository userRepository;
	private final DoctorRepository doctorRepository;
	private final SecurityUtils securityUtils;

	public AppointmentsController(
			AppointmentRepository appointmentRepository,
			UserRepository userRepository,
			DoctorRepository doctorRepository,
			SecurityUtils securityUtils) {
		this.appointmentRepository = appointmentRepository;
		this.userRepository = userRepository;
		this.doctorRepository = doctorRepository;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		requireStaff();
		try {
			return appointmentRepository.findAllByOrderByDateAscTimeAsc().stream()
					.map(this::enriched)
					.toList();
		} catch (Exception ex) {
			throw new ApiException(500, "Unable to load appointments");
		}
	}

	@GetMapping("/available-slots")
	public List<String> availableSlots(@RequestParam Long doctorId, @RequestParam String date) {
		requireStaff();
		if (doctorId == null || date == null || date.isBlank()) {
			throw new ApiException(400, "doctorId and date are required");
		}
		if (!doctorRepository.existsById(doctorId)) {
			throw new ApiException(400, "Select a valid doctor");
		}
		List<String> booked = appointmentRepository.findByDoctorIdAndDate(doctorId, date.trim()).stream()
				.map(Appointment::getTime)
				.toList();
		return AppointmentSlots.FIXED_SLOTS.stream().filter(slot -> !booked.contains(slot)).toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		requireStaff();
		Long patientId = asLong(body.get("patientId"));
		Long doctorId = asLong(body.get("doctorId"));
		String date = str(body.get("date"));
		String time = str(body.get("time"));
		String reason = str(body.get("reason"));
		if (patientId == null || doctorId == null || !allPresent(date, time, reason)) {
			throw new ApiException(400, "Patient, doctor, date, time, and reason are required");
		}
		User patient = userRepository.findByIdAndRole(patientId, "patient").orElse(null);
		Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
		if (patient == null || doctor == null) {
			throw new ApiException(400, "Select a valid patient and doctor");
		}
		String normalizedDate = date.trim();
		String normalizedTime = time.trim();
		if (appointmentRepository.existsByDoctorIdAndDateAndTime(doctorId, normalizedDate, normalizedTime)) {
			throw new ApiException(400, "That doctor already has an appointment at this time");
		}
		try {
			Appointment appointment = new Appointment();
			appointment.setPatientId(patientId);
			appointment.setDoctorId(doctorId);
			appointment.setDate(normalizedDate);
			appointment.setTime(normalizedTime);
			appointment.setReason(reason.trim());
			appointment = appointmentRepository.save(appointment);
			Map<String, Object> response = new LinkedHashMap<>();
			response.put("message", "Appointment scheduled successfully");
			response.put("appointment", enriched(appointment));
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (DataIntegrityViolationException ex) {
			throw new ApiException(400, "That doctor already has an appointment at this time");
		} catch (Exception ex) {
			throw new ApiException(400, "Unable to schedule appointment");
		}
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		requireStaff();
		Appointment appointment = appointmentRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Appointment not found"));

		Long doctorId = body.containsKey("doctorId")
				? asLong(body.get("doctorId"))
				: appointment.getDoctorId();
		String date = body.containsKey("date") ? str(body.get("date")) : appointment.getDate();
		String time = body.containsKey("time") ? str(body.get("time")) : appointment.getTime();
		String reason = body.containsKey("reason") ? str(body.get("reason")) : appointment.getReason();
		String status = body.containsKey("status") ? str(body.get("status")) : appointment.getStatus();

		if (doctorId == null || !allPresent(date, time, reason, status)) {
			throw new ApiException(400, "Doctor, date, time, reason, and status are required");
		}
		if (!doctorRepository.existsById(doctorId)) {
			throw new ApiException(400, "Select a valid doctor");
		}

		String normalizedDate = date.trim();
		String normalizedTime = time.trim();
		String normalizedStatus = status.trim();
		if (appointmentRepository.existsByDoctorIdAndDateAndTimeAndIdNot(
				doctorId, normalizedDate, normalizedTime, id)) {
			throw new ApiException(400, "That doctor already has an appointment at this time");
		}

		appointment.setDoctorId(doctorId);
		appointment.setDate(normalizedDate);
		appointment.setTime(normalizedTime);
		appointment.setReason(reason.trim());
		appointment.setStatus(normalizedStatus);
		try {
			return enriched(appointmentRepository.save(appointment));
		} catch (DataIntegrityViolationException ex) {
			throw new ApiException(400, "That doctor already has an appointment at this time");
		}
	}

	@DeleteMapping("/{id}")
	public Map<String, String> delete(@PathVariable Long id) {
		requireStaff();
		Appointment appointment = appointmentRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Appointment not found"));
		appointmentRepository.delete(appointment);
		return Map.of("message", "Appointment cancelled");
	}

	private Map<String, Object> enriched(Appointment appointment) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", appointment.getId());
		map.put("patientId", appointment.getPatientId());
		map.put("doctorId", appointment.getDoctorId());
		map.put("date", appointment.getDate());
		map.put("time", appointment.getTime());
		map.put("reason", appointment.getReason());
		map.put("status", appointment.getStatus());
		map.put("createdAt", appointment.getCreatedAt());
		userRepository.findById(appointment.getPatientId()).ifPresent(p ->
				map.put("patientName", p.getFirstName() + " " + p.getLastName()));
		doctorRepository.findById(appointment.getDoctorId()).ifPresent(d -> {
			map.put("doctorName", d.getFirstName() + " " + d.getLastName());
			map.put("specialty", d.getSpecialty());
		});
		return map;
	}

	private void requireStaff() {
		securityUtils.requireStaff();
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}

	private static Long asLong(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof Number number) {
			return number.longValue();
		}
		try {
			return Long.parseLong(String.valueOf(value));
		} catch (NumberFormatException ex) {
			return null;
		}
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

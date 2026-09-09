package za.gov.mpumalanga.rfh.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.AppointmentSlots;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.Appointment;
import za.gov.mpumalanga.rfh.entity.Doctor;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.AppointmentRepository;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/doctor/schedule")
public class DoctorScheduleController {

	private final DoctorRepository doctorRepository;
	private final AppointmentRepository appointmentRepository;
	private final UserRepository userRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public DoctorScheduleController(
			DoctorRepository doctorRepository,
			AppointmentRepository appointmentRepository,
			UserRepository userRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.doctorRepository = doctorRepository;
		this.appointmentRepository = appointmentRepository;
		this.userRepository = userRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping("/availability")
	public Map<String, Object> availability() {
		AuthUser auth = securityUtils.requireDoctor();
		Doctor doctor = doctorRepository.findById(auth.id())
				.orElseThrow(() -> new ApiException(404, "Doctor not found"));
		String today = LocalDate.now().toString();
		List<String> booked = appointmentRepository.findByDoctorIdAndDate(auth.id(), today).stream()
				.map(Appointment::getTime)
				.toList();
		List<String> free = AppointmentSlots.FIXED_SLOTS.stream()
				.filter(slot -> !booked.contains(slot))
				.toList();

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("workingHours", doctor.getWorkingHours() == null ? "08:00-16:00" : doctor.getWorkingHours());
		response.put("availableToday", doctor.getAvailableToday() == null || Boolean.TRUE.equals(doctor.getAvailableToday()));
		response.put("date", today);
		response.put("bookedSlots", booked);
		response.put("freeSlots", free);
		response.put("bookedCount", booked.size());
		response.put("freeCount", free.size());
		return response;
	}

	@PutMapping("/availability")
	public Map<String, Object> updateAvailability(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireDoctor();
		Doctor doctor = doctorRepository.findById(auth.id())
				.orElseThrow(() -> new ApiException(404, "Doctor not found"));
		if (body.containsKey("availableToday")) {
			doctor.setAvailableToday(asBoolean(body.get("availableToday"), true));
		}
		if (body.containsKey("workingHours")) {
			String hours = str(body.get("workingHours"));
			if (hours != null && !hours.isBlank()) {
				doctor.setWorkingHours(hours.trim());
			}
		}
		doctor = doctorRepository.save(doctor);
		Map<String, Object> response = availability();
		response.put("profile", responseMapper.doctor(doctor));
		return response;
	}

	@GetMapping("/week")
	public Map<String, Object> week() {
		AuthUser auth = securityUtils.requireDoctor();
		LocalDate start = LocalDate.now();
		LocalDate end = start.plusDays(6);
		List<Map<String, Object>> appointments = new ArrayList<>();
		for (Appointment appointment : appointmentRepository.findByDoctorId(auth.id())) {
			LocalDate date;
			try {
				date = LocalDate.parse(appointment.getDate());
			} catch (Exception ex) {
				continue;
			}
			if (date.isBefore(start) || date.isAfter(end)) {
				continue;
			}
			Map<String, Object> map = responseMapper.appointment(appointment);
			userRepository.findById(appointment.getPatientId()).ifPresent(u ->
					map.put("patientName", u.getFirstName() + " " + u.getLastName()));
			appointments.add(map);
		}
		appointments.sort((a, b) -> {
			String d1 = String.valueOf(a.get("date")) + " " + String.valueOf(a.get("time"));
			String d2 = String.valueOf(b.get("date")) + " " + String.valueOf(b.get("time"));
			return d1.compareToIgnoreCase(d2);
		});

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("from", start.toString());
		response.put("to", end.toString());
		response.put("appointments", appointments);
		return response;
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}

	private static boolean asBoolean(Object value, boolean defaultValue) {
		if (value == null) {
			return defaultValue;
		}
		if (value instanceof Boolean b) {
			return b;
		}
		String text = String.valueOf(value).trim().toLowerCase(Locale.ROOT);
		if ("true".equals(text) || "1".equals(text) || "yes".equals(text)) {
			return true;
		}
		if ("false".equals(text) || "0".equals(text) || "no".equals(text)) {
			return false;
		}
		return defaultValue;
	}
}

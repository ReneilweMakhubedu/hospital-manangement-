package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.MedicationDoseLog;
import za.gov.mpumalanga.rfh.entity.PatientMedication;
import za.gov.mpumalanga.rfh.entity.User;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.MedicationDoseLogRepository;
import za.gov.mpumalanga.rfh.repository.PatientMedicationRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/patient/medications")
public class PatientMedicationsController {

	private final PatientMedicationRepository patientMedicationRepository;
	private final MedicationDoseLogRepository medicationDoseLogRepository;
	private final UserRepository userRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public PatientMedicationsController(
			PatientMedicationRepository patientMedicationRepository,
			MedicationDoseLogRepository medicationDoseLogRepository,
			UserRepository userRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.patientMedicationRepository = patientMedicationRepository;
		this.medicationDoseLogRepository = medicationDoseLogRepository;
		this.userRepository = userRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		AuthUser auth = securityUtils.requirePatient();
		return patientMedicationRepository.findByPatientIdOrderByCreatedAtDesc(auth.id()).stream()
				.map(responseMapper::patientMedication)
				.toList();
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		AuthUser auth = securityUtils.requirePatient();
		User patient = userRepository.findByIdAndRole(auth.id(), "patient")
				.orElseThrow(() -> new ApiException(404, "Patient not found"));
		List<PatientMedication> active = patientMedicationRepository.findByPatientIdAndStatus(auth.id(), "ACTIVE");

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

	@PostMapping("/dose-log")
	public ResponseEntity<Map<String, Object>> doseLog(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requirePatient();
		Long medicationId = asLong(body.get("medicationId"));
		String scheduledTime = str(body.get("scheduledTime"));
		if (medicationId == null || scheduledTime == null || scheduledTime.isBlank()) {
			throw new ApiException(400, "medicationId and scheduledTime are required");
		}

		PatientMedication med = patientMedicationRepository.findById(medicationId)
				.orElseThrow(() -> new ApiException(404, "Medication not found"));
		if (!med.getPatientId().equals(auth.id())) {
			throw new ApiException(403, "Not authorized");
		}

		MedicationDoseLog log = medicationDoseLogRepository
				.findByMedicationIdAndPatientIdAndScheduledTime(medicationId, auth.id(), scheduledTime)
				.orElseGet(MedicationDoseLog::new);
		log.setMedicationId(medicationId);
		log.setPatientId(auth.id());
		log.setScheduledTime(scheduledTime.trim());
		log.setTakenAt(Instant.now());
		log.setStatus("TAKEN");
		log = medicationDoseLogRepository.save(log);

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("message", "Dose marked as taken");
		response.put("doseLog", responseMapper.medicationDoseLog(log));
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@GetMapping("/dose-logs")
	public List<Map<String, Object>> doseLogs(@RequestParam(required = false) String date) {
		AuthUser auth = securityUtils.requirePatient();
		String day = (date == null || date.isBlank()) ? LocalDate.now().toString() : date.trim();
		return medicationDoseLogRepository
				.findByPatientIdAndScheduledTimeStartingWithOrderByScheduledTimeAsc(auth.id(), day)
				.stream()
				.map(responseMapper::medicationDoseLog)
				.toList();
	}

	@PutMapping("/pickup-point")
	public Map<String, Object> updatePickupPoint(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requirePatient();
		User patient = userRepository.findByIdAndRole(auth.id(), "patient")
				.orElseThrow(() -> new ApiException(404, "Patient not found"));
		String pickupPoint = str(body.get("ccmddPickupPoint"));
		if (pickupPoint == null || pickupPoint.isBlank()) {
			pickupPoint = str(body.get("pickupPoint"));
		}
		if (pickupPoint == null || pickupPoint.isBlank()) {
			throw new ApiException(400, "ccmddPickupPoint is required");
		}
		patient.setCcmddPickupPoint(pickupPoint.trim());
		patient = userRepository.save(patient);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("message", "Pickup point updated");
		response.put("ccmddPickupPoint", patient.getCcmddPickupPoint());
		return response;
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}

	private static Long asLong(Object value) {
		if (value == null || String.valueOf(value).isBlank()) {
			return null;
		}
		if (value instanceof Number number) {
			return number.longValue();
		}
		try {
			return Long.parseLong(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			return null;
		}
	}
}

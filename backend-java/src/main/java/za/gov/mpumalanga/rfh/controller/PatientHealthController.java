package za.gov.mpumalanga.rfh.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.User;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.AppointmentRepository;
import za.gov.mpumalanga.rfh.repository.ClinicalNoteRepository;
import za.gov.mpumalanga.rfh.repository.LabResultRepository;
import za.gov.mpumalanga.rfh.repository.PrescriptionRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/patient/health")
public class PatientHealthController {

	private final UserRepository userRepository;
	private final ClinicalNoteRepository clinicalNoteRepository;
	private final PrescriptionRepository prescriptionRepository;
	private final AppointmentRepository appointmentRepository;
	private final LabResultRepository labResultRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public PatientHealthController(
			UserRepository userRepository,
			ClinicalNoteRepository clinicalNoteRepository,
			PrescriptionRepository prescriptionRepository,
			AppointmentRepository appointmentRepository,
			LabResultRepository labResultRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.userRepository = userRepository;
		this.clinicalNoteRepository = clinicalNoteRepository;
		this.prescriptionRepository = prescriptionRepository;
		this.appointmentRepository = appointmentRepository;
		this.labResultRepository = labResultRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		AuthUser auth = securityUtils.requirePatient();
		User patient = userRepository.findByIdAndRole(auth.id(), "patient")
				.orElseThrow(() -> new ApiException(404, "Patient not found"));

		Map<String, Object> map = new LinkedHashMap<>();
		map.put("bloodType", patient.getBloodType());
		map.put("allergies", patient.getAllergies());
		map.put("existingConditions", patient.getExistingConditions());
		map.put("currentMedications", patient.getCurrentMedications());
		map.put("ccmddEnrolled", Boolean.TRUE.equals(patient.getCcmddEnrolled()));
		map.put("nextCollectionDate", patient.getNextCollectionDate());
		map.put("notesCount", clinicalNoteRepository.countByPatientId(auth.id()));
		map.put("prescriptionsCount", prescriptionRepository.countByPatientId(auth.id()));
		map.put("appointmentsCount", appointmentRepository.countByPatientId(auth.id()));
		map.put("labsCount", labResultRepository.findByPatientIdOrderByResultDateDesc(auth.id()).size());
		return map;
	}

	@GetMapping("/notes")
	public List<Map<String, Object>> notes() {
		AuthUser auth = securityUtils.requirePatient();
		return clinicalNoteRepository.findByPatientIdOrderByVisitDateDescCreatedAtDesc(auth.id()).stream()
				.map(responseMapper::clinicalNote)
				.toList();
	}

	@GetMapping("/labs")
	public List<Map<String, Object>> labs() {
		AuthUser auth = securityUtils.requirePatient();
		return labResultRepository.findByPatientIdOrderByResultDateDesc(auth.id()).stream()
				.map(responseMapper::labResult)
				.toList();
	}
}

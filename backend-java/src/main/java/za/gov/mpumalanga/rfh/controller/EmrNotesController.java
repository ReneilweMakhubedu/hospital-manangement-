package za.gov.mpumalanga.rfh.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
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
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.ClinicalNote;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.ClinicalNoteRepository;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;

@RestController
@RequestMapping("/api/emr/notes")
public class EmrNotesController {

	private final ClinicalNoteRepository clinicalNoteRepository;
	private final UserRepository userRepository;
	private final DoctorRepository doctorRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final AuditService auditService;

	public EmrNotesController(
			ClinicalNoteRepository clinicalNoteRepository,
			UserRepository userRepository,
			DoctorRepository doctorRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			AuditService auditService) {
		this.clinicalNoteRepository = clinicalNoteRepository;
		this.userRepository = userRepository;
		this.doctorRepository = doctorRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.auditService = auditService;
	}

	@GetMapping
	public List<Map<String, Object>> list(@RequestParam(required = false) Long patientId) {
		securityUtils.requireStaff();
		List<ClinicalNote> notes = patientId == null
				? clinicalNoteRepository.findAllByOrderByVisitDateDescCreatedAtDesc()
				: clinicalNoteRepository.findByPatientIdOrderByVisitDateDescCreatedAtDesc(patientId);
		return notes.stream().map(this::enriched).toList();
	}

	@GetMapping("/patient/{patientId}")
	public List<Map<String, Object>> forPatient(@PathVariable Long patientId) {
		securityUtils.requireStaff();
		return clinicalNoteRepository.findByPatientIdOrderByVisitDateDescCreatedAtDesc(patientId).stream()
				.map(this::enriched)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireRoles("doctor", "admin");
		Long patientId = asLong(body.get("patientId"));
		Long doctorId = "doctor".equalsIgnoreCase(auth.role())
				? auth.id()
				: asLong(body.get("doctorId"));
		String visitDate = str(body.get("visitDate"));
		if (patientId == null || doctorId == null || visitDate == null || visitDate.isBlank()) {
			throw new ApiException(400, "patientId, doctorId, and visitDate are required");
		}
		if (userRepository.findByIdAndRole(patientId, "patient").isEmpty()) {
			throw new ApiException(400, "Select a valid patient");
		}
		if (doctorRepository.findById(doctorId).isEmpty()) {
			throw new ApiException(400, "Select a valid doctor");
		}
		parseVisitDate(visitDate);

		ClinicalNote note = new ClinicalNote();
		note.setPatientId(patientId);
		note.setDoctorId(doctorId);
		note.setVisitDate(visitDate.trim());
		note.setChiefComplaint(blankToNull(str(body.get("chiefComplaint"))));
		note.setDiagnosis(blankToNull(str(body.get("diagnosis"))));
		note.setTreatmentPlan(blankToNull(str(body.get("treatmentPlan"))));
		note.setNotes(blankToNull(str(body.get("notes"))));
		note = clinicalNoteRepository.save(note);
		auditService.log(auth, "CREATE", "ClinicalNote", note.getId(),
				"EMR note created for patient " + patientId);
		return ResponseEntity.status(HttpStatus.CREATED).body(enriched(note));
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		securityUtils.requireRoles("doctor", "admin");
		ClinicalNote note = clinicalNoteRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Clinical note not found"));

		if (body.containsKey("patientId")) {
			Long patientId = asLong(body.get("patientId"));
			if (patientId == null || userRepository.findByIdAndRole(patientId, "patient").isEmpty()) {
				throw new ApiException(400, "Select a valid patient");
			}
			note.setPatientId(patientId);
		}
		if (body.containsKey("doctorId")) {
			Long doctorId = asLong(body.get("doctorId"));
			if (doctorId == null || doctorRepository.findById(doctorId).isEmpty()) {
				throw new ApiException(400, "Select a valid doctor");
			}
			note.setDoctorId(doctorId);
		}
		if (body.containsKey("visitDate")) {
			String visitDate = str(body.get("visitDate"));
			if (visitDate == null || visitDate.isBlank()) {
				throw new ApiException(400, "visitDate is required");
			}
			parseVisitDate(visitDate);
			note.setVisitDate(visitDate.trim());
		}
		if (body.containsKey("chiefComplaint")) {
			note.setChiefComplaint(blankToNull(str(body.get("chiefComplaint"))));
		}
		if (body.containsKey("diagnosis")) {
			note.setDiagnosis(blankToNull(str(body.get("diagnosis"))));
		}
		if (body.containsKey("treatmentPlan")) {
			note.setTreatmentPlan(blankToNull(str(body.get("treatmentPlan"))));
		}
		if (body.containsKey("notes")) {
			note.setNotes(blankToNull(str(body.get("notes"))));
		}
		return enriched(clinicalNoteRepository.save(note));
	}

	@DeleteMapping("/{id}")
	public Map<String, String> delete(@PathVariable Long id) {
		securityUtils.requireAdmin();
		if (!clinicalNoteRepository.existsById(id)) {
			throw new ApiException(404, "Clinical note not found");
		}
		clinicalNoteRepository.deleteById(id);
		return Map.of("message", "Clinical note deleted");
	}

	private Map<String, Object> enriched(ClinicalNote note) {
		Map<String, Object> map = responseMapper.clinicalNote(note);
		userRepository.findById(note.getPatientId()).ifPresent(p ->
				map.put("patientName", p.getFirstName() + " " + p.getLastName()));
		doctorRepository.findById(note.getDoctorId()).ifPresent(d ->
				map.put("doctorName", d.getFirstName() + " " + d.getLastName()));
		return map;
	}

	private static void parseVisitDate(String visitDate) {
		try {
			LocalDate.parse(visitDate.trim());
		} catch (Exception ex) {
			throw new ApiException(400, "visitDate must be yyyy-MM-dd");
		}
	}

	private static String blankToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
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
}

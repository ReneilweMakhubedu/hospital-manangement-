package za.gov.mpumalanga.rfh.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.Appointment;
import za.gov.mpumalanga.rfh.entity.ClinicalNote;
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
@RequestMapping("/api/doctor/consult")
public class DoctorConsultController {

	private static final Pattern SENTENCE_SPLIT = Pattern.compile("(?<=[.!?])\\s+");

	private final UserRepository userRepository;
	private final ClinicalNoteRepository clinicalNoteRepository;
	private final PrescriptionRepository prescriptionRepository;
	private final LabResultRepository labResultRepository;
	private final AppointmentRepository appointmentRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public DoctorConsultController(
			UserRepository userRepository,
			ClinicalNoteRepository clinicalNoteRepository,
			PrescriptionRepository prescriptionRepository,
			LabResultRepository labResultRepository,
			AppointmentRepository appointmentRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.userRepository = userRepository;
		this.clinicalNoteRepository = clinicalNoteRepository;
		this.prescriptionRepository = prescriptionRepository;
		this.labResultRepository = labResultRepository;
		this.appointmentRepository = appointmentRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping("/patient/{patientId}")
	public Map<String, Object> patientChart(@PathVariable Long patientId) {
		securityUtils.requireDoctor();
		User patient = userRepository.findByIdAndRole(patientId, "patient")
				.orElseThrow(() -> new ApiException(404, "Patient not found"));

		List<Appointment> appointments = appointmentRepository.findByPatientIdOrderByDateDescTimeDesc(patientId);
		String triageFlag = resolveTriageFlag(patient, appointments);

		Map<String, Object> chart = new LinkedHashMap<>();
		chart.put("profile", responseMapper.patient(patient));
		chart.put("clinicalNotes", clinicalNoteRepository.findByPatientIdOrderByVisitDateDescCreatedAtDesc(patientId)
				.stream().map(responseMapper::clinicalNote).toList());
		chart.put("prescriptions", prescriptionRepository.findByPatientId(patientId).stream()
				.map(responseMapper::prescription).toList());
		chart.put("labs", labResultRepository.findByPatientIdOrderByResultDateDesc(patientId).stream()
				.map(responseMapper::labResult).toList());
		chart.put("appointments", appointments.stream().map(responseMapper::appointment).toList());
		chart.put("allergies", patient.getAllergies());
		chart.put("conditions", patient.getExistingConditions());
		chart.put("triageFlag", triageFlag);
		return chart;
	}

	@PostMapping("/notes")
	public ResponseEntity<Map<String, Object>> createNote(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireDoctor();
		Long patientId = asLong(body.get("patientId"));
		if (patientId == null || userRepository.findByIdAndRole(patientId, "patient").isEmpty()) {
			throw new ApiException(400, "Select a valid patient");
		}

		String visitDate = str(body.get("visitDate"));
		if (visitDate == null || visitDate.isBlank()) {
			visitDate = LocalDate.now().toString();
		} else {
			try {
				LocalDate.parse(visitDate.trim());
			} catch (Exception ex) {
				throw new ApiException(400, "visitDate must be yyyy-MM-dd");
			}
			visitDate = visitDate.trim();
		}

		String template = str(body.get("noteTemplate"));
		if (template == null || template.isBlank()) {
			template = "SOAP";
		}
		template = template.trim().toUpperCase(Locale.ROOT);
		if (!List.of("SOAP", "NARRATIVE", "BRIEF").contains(template)) {
			throw new ApiException(400, "noteTemplate must be SOAP, NARRATIVE, or BRIEF");
		}

		String soapSubjective = blankToNull(str(body.get("soapSubjective")));
		String soapObjective = blankToNull(str(body.get("soapObjective")));
		String soapAssessment = blankToNull(str(body.get("soapAssessment")));
		String soapPlan = blankToNull(str(body.get("soapPlan")));

		String chiefComplaint = blankToNull(str(body.get("chiefComplaint")));
		String diagnosis = blankToNull(str(body.get("diagnosis")));
		String treatmentPlan = blankToNull(str(body.get("treatmentPlan")));
		String notes = blankToNull(str(body.get("notes")));

		if (chiefComplaint == null && soapSubjective != null) {
			chiefComplaint = soapSubjective;
		}
		if (diagnosis == null && soapAssessment != null) {
			diagnosis = soapAssessment;
		}
		if (treatmentPlan == null && soapPlan != null) {
			treatmentPlan = soapPlan;
		}
		if (notes == null && soapObjective != null) {
			notes = soapObjective;
		}

		ClinicalNote note = new ClinicalNote();
		note.setPatientId(patientId);
		note.setDoctorId(auth.id());
		note.setVisitDate(visitDate);
		note.setNoteTemplate(template);
		note.setSoapSubjective(soapSubjective);
		note.setSoapObjective(soapObjective);
		note.setSoapAssessment(soapAssessment);
		note.setSoapPlan(soapPlan);
		note.setChiefComplaint(chiefComplaint);
		note.setDiagnosis(diagnosis);
		note.setTreatmentPlan(treatmentPlan);
		note.setNotes(notes);
		note = clinicalNoteRepository.save(note);
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.clinicalNote(note));
	}

	@GetMapping("/templates")
	public Map<String, Object> templates() {
		securityUtils.requireDoctor();
		Map<String, Object> soap = new LinkedHashMap<>();
		soap.put("id", "SOAP");
		soap.put("label", "SOAP");
		soap.put("subjective", "Patient reports...");
		soap.put("objective", "Vitals / examination...");
		soap.put("assessment", "Working diagnosis...");
		soap.put("plan", "Investigations, treatment, follow-up...");

		Map<String, Object> narrative = new LinkedHashMap<>();
		narrative.put("id", "NARRATIVE");
		narrative.put("label", "Narrative");
		narrative.put("skeleton", "History:\nExamination:\nImpression:\nPlan:\n");

		Map<String, Object> brief = new LinkedHashMap<>();
		brief.put("id", "BRIEF");
		brief.put("label", "Brief");
		brief.put("skeleton", "CC:\nDx:\nRx / plan:");

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("templates", List.of(soap, narrative, brief));
		return response;
	}

	@PostMapping("/scribe-draft")
	public Map<String, Object> scribeDraft(@RequestBody Map<String, Object> body) {
		securityUtils.requireDoctor();
		String transcript = str(body.get("transcript"));
		if (transcript == null || transcript.isBlank()) {
			transcript = str(body.get("spokenText"));
		}
		if (transcript == null || transcript.isBlank()) {
			throw new ApiException(400, "transcript or spokenText is required");
		}

		List<String> sentences = splitSentences(transcript.trim());
		List<String> subjective = new ArrayList<>();
		List<String> objective = new ArrayList<>();
		List<String> assessment = new ArrayList<>();
		List<String> plan = new ArrayList<>();

		for (String sentence : sentences) {
			String lower = sentence.toLowerCase(Locale.ROOT);
			if (containsAny(lower, "plan", "prescribe", "follow-up", "follow up", "refer", "return", "advise")) {
				plan.add(sentence);
			} else if (containsAny(lower, "diagnos", "impression", "likely", "suspect", "assessment")) {
				assessment.add(sentence);
			} else if (containsAny(lower, "bp", "pulse", "temp", "exam", "vitals", "lab", "x-ray", "oxygen", "weight")) {
				objective.add(sentence);
			} else {
				subjective.add(sentence);
			}
		}

		if (subjective.isEmpty() && !sentences.isEmpty()) {
			subjective.add(sentences.get(0));
		}

		String subjectiveText = joinOrDefault(subjective, "Patient history captured from spoken draft.");
		String objectiveText = joinOrDefault(objective, "Objective findings to be completed.");
		String assessmentText = joinOrDefault(assessment, "Assessment to be confirmed by clinician.");
		String planText = joinOrDefault(plan, "Plan to be completed by clinician.");

		Map<String, Object> draft = new LinkedHashMap<>();
		draft.put("draftAssistant", true);
		draft.put("label", "Clinical note assistant (draft)");
		draft.put("subjective", subjectiveText);
		draft.put("objective", objectiveText);
		draft.put("assessment", assessmentText);
		draft.put("plan", planText);
		draft.put("summary", subjectiveText + " " + assessmentText);
		return draft;
	}

	private String resolveTriageFlag(User patient, List<Appointment> appointments) {
		if (!appointments.isEmpty()) {
			Appointment latest = appointments.get(0);
			if (latest.getUrgency() != null && !latest.getUrgency().isBlank()) {
				return latest.getUrgency().toUpperCase(Locale.ROOT);
			}
		}
		String blob = String.join(" ",
				nullToEmpty(patient.getExistingConditions()),
				nullToEmpty(patient.getAllergies()),
				nullToEmpty(patient.getPreviousMedicalInfo())).toLowerCase(Locale.ROOT);
		if (containsAny(blob, "chest pain", "stroke", "seizure", "haemorrhage", "hemorrhage", "critical")) {
			return "RED";
		}
		if (containsAny(blob, "fever", "infection", "asthma", "diabetes", "hypertension")) {
			return "ORANGE";
		}
		return "GREEN";
	}

	private static List<String> splitSentences(String text) {
		String[] parts = SENTENCE_SPLIT.split(text);
		List<String> sentences = new ArrayList<>();
		for (String part : parts) {
			String trimmed = part.trim();
			if (!trimmed.isEmpty()) {
				sentences.add(trimmed);
			}
		}
		return sentences;
	}

	private static boolean containsAny(String haystack, String... needles) {
		for (String needle : needles) {
			if (haystack.contains(needle)) {
				return true;
			}
		}
		return false;
	}

	private static String joinOrDefault(List<String> parts, String fallback) {
		if (parts.isEmpty()) {
			return fallback;
		}
		return String.join(" ", parts);
	}

	private static String nullToEmpty(String value) {
		return value == null ? "" : value;
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

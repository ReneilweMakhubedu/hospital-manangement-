package za.gov.mpumalanga.rfh.controller;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/patient/education")
public class PatientEducationController {

	private static final List<Map<String, Object>> GUIDES = List.of(
			Map.of(
					"id", "diabetes",
					"title", "Living well with diabetes",
					"summary", "Monitor blood sugar, take medicines as prescribed, and attend diabetic clinic reviews.",
					"topics", List.of("Diet and portion control", "Foot care", "Hypoglycaemia warning signs")),
			Map.of(
					"id", "hypertension",
					"title", "Managing high blood pressure",
					"summary", "Reduce salt, stay active, and never stop blood pressure tablets without clinical advice.",
					"topics", List.of("Home BP checks", "Medication adherence", "When to seek urgent care")),
			Map.of(
					"id", "hiv-adherence",
					"title", "HIV treatment adherence",
					"summary", "Take ART every day, keep clinic appointments, and collect CCMDD packs on time.",
					"topics", List.of("Viral load monitoring", "Side-effect reporting", "Disclosure support")),
			Map.of(
					"id", "medication-tips",
					"title", "Medication safety tips",
					"summary", "Keep a current medicine list, store tablets safely, and mark doses in the patient app.",
					"topics", List.of("Dose reminders", "Missed dose guidance", "CCMDD pickup checklist")));

	private final SecurityUtils securityUtils;

	public PatientEducationController(SecurityUtils securityUtils) {
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public List<Map<String, Object>> guides() {
		securityUtils.requirePatient();
		return GUIDES;
	}
}

package za.gov.mpumalanga.rfh.config;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * HPCSA-aligned speciality / grade / system-role catalog for Rob Ferreira clinician credentialing.
 */
public final class HpcsaCatalog {

	private HpcsaCatalog() {
	}

	public static List<Map<String, String>> specialities() {
		List<Map<String, String>> list = new ArrayList<>();
		add(list, "Anaesthesiology", "Anaesthesiologist", "ANAES", "MEDICAL");
		add(list, "Cardiothoracic Surgery", "Cardiothoracic Surgeon", "CTS", "MEDICAL");
		add(list, "Clinical Pharmacology", "Clinical Pharmacologist", "CLINPHARM", "MEDICAL");
		add(list, "Community Health", "Specialist in Community Health", "COMMHEALTH", "MEDICAL");
		add(list, "Dermatology", "Dermatologist", "DERM", "MEDICAL");
		add(list, "Diagnostic Radiology", "Diagnostic Radiologist", "RAD", "MEDICAL");
		add(list, "Family Medicine", "Family Physician", "FAMMED", "MEDICAL");
		add(list, "Internal Medicine", "Physician", "PHYS", "MEDICAL");
		add(list, "Neurology", "Neurologist", "NEURO", "MEDICAL");
		add(list, "Neurosurgery", "Neurosurgeon", "NSURG", "MEDICAL");
		add(list, "Nuclear Medicine", "Specialist in Nuclear Medicine", "NUCMED", "MEDICAL");
		add(list, "Obstetrics and Gynaecology", "Obstetrician and Gynaecologist", "OANDG", "MEDICAL");
		add(list, "Ophthalmology", "Ophthalmologist", "OPHTH", "MEDICAL");
		add(list, "Orthopaedics", "Orthopaedic Surgeon", "ORTHO", "MEDICAL");
		add(list, "Otorhinolaryngology (ENT)", "Otorhinolaryngologist", "ENT", "MEDICAL");
		add(list, "Paediatrics", "Paediatrician", "PAEDS", "MEDICAL");
		add(list, "Pathology", "Pathologist", "PATH", "MEDICAL");
		add(list, "Plastic and Reconstructive Surgery", "Plastic and Reconstructive Surgeon", "PLAST", "MEDICAL");
		add(list, "Psychiatry", "Psychiatrist", "PSYCH", "MEDICAL");
		add(list, "Radiation Oncology", "Radiation Oncologist", "RADONC", "MEDICAL");
		add(list, "Sports and Exercise Medicine", "Specialist in Sports and Exercise Medicine", "SEM", "MEDICAL");
		add(list, "Surgery", "Surgeon", "SURG", "MEDICAL");
		add(list, "Urology", "Urologist", "UROL", "MEDICAL");
		add(list, "Maxillo-facial and Oral Surgery", "Maxillo-facial and Oral Surgeon", "MFOS", "DENTAL");
		add(list, "Oral Medicine and Periodontics", "Specialist in Oral Medicine and Periodontics", "OMP", "DENTAL");
		add(list, "Oral and Maxillofacial Pathology", "Oral and Maxillofacial Pathologist", "OMFP", "DENTAL");
		add(list, "General Practice", "General Practitioner", "GP", "MEDICAL");
		return list;
	}

	public static List<Map<String, String>> subSpecialities() {
		List<Map<String, String>> list = new ArrayList<>();
		sub(list, "Cardiology", "Internal Medicine");
		sub(list, "Child & Adolescent Psychiatry", "Psychiatry");
		sub(list, "Critical Care", "Various");
		sub(list, "Endocrinology", "Internal Medicine / Paediatrics");
		sub(list, "Gastroenterology", "Internal Medicine");
		sub(list, "Geriatric Medicine", "Internal Medicine");
		sub(list, "Infectious Diseases", "Internal Medicine / Paediatrics");
		sub(list, "Nephrology", "Internal Medicine / Paediatrics");
		sub(list, "Paediatric Surgery", "Surgery");
		sub(list, "Pulmonology", "Internal Medicine / Paediatrics");
		sub(list, "Rheumatology", "Internal Medicine");
		sub(list, "Vascular Surgery", "Surgery");
		sub(list, "Medical Oncology", "Internal Medicine");
		sub(list, "Gynaecological Oncology", "Obstetrics and Gynaecology");
		return list;
	}

	public static List<Map<String, String>> clinicianCategories() {
		List<Map<String, String>> list = new ArrayList<>();
		cat(list, "INTERN", "Medical Intern", "HPCSA Intern");
		cat(list, "COMMUNITY_SERVICE", "Community Service Medical Officer", "HPCSA Independent Practice (CS)");
		cat(list, "MEDICAL_OFFICER", "Medical Officer", "HPCSA Independent Practice");
		cat(list, "GP", "General Practitioner", "HPCSA Independent Practice");
		cat(list, "SPECIALIST", "Medical Specialist", "HPCSA Specialist");
		cat(list, "SUB_SPECIALIST", "Sub-specialist", "HPCSA Sub-specialist");
		cat(list, "DENTAL_SPECIALIST", "Dental Specialist", "HPCSA Dental Specialist");
		return list;
	}

	public static List<Map<String, Object>> systemRoles() {
		List<Map<String, Object>> list = new ArrayList<>();
		role(list, "INTERN", "Medical Intern", null, List.of(
				"View Patient Record (limited)",
				"Create Prescription (requires cosign)",
				"Document under supervision"));
		role(list, "MO_GR1", "Medical Officer Grade 1", 1, List.of(
				"View Patient Record",
				"Create Prescription",
				"Refer Patient"));
		role(list, "MO_GR2", "Medical Officer Grade 2", 2, List.of(
				"All Grade 1 activities",
				"Supervise interns (assigned)"));
		role(list, "MO_GR3", "Medical Officer Grade 3", 3, List.of(
				"All Grade 2 activities",
				"Departmental operational metrics"));
		role(list, "GP", "General Practitioner", null, List.of(
				"View Patient Record",
				"Create Prescription",
				"Refer Patient"));
		role(list, "SPEC_GR1", "Specialist Grade 1", 1, List.of(
				"View Patient Record",
				"Create Prescription",
				"Refer Patient",
				"Create Lab/Imaging Orders"));
		role(list, "SPEC_GR2", "Specialist Grade 2", 2, List.of(
				"All Grade 1 activities",
				"Approve Clinical Audit"));
		role(list, "SPEC_GR3", "Specialist Grade 3", 3, List.of(
				"All Grade 2 activities",
				"Access Departmental Analytics"));
		role(list, "SUBSPEC_GR1", "Sub-specialist Grade 1", 1, List.of(
				"All Specialist Grade 1 activities",
				"Sub-specialty consults"));
		role(list, "SUBSPEC_GR2", "Sub-specialist Grade 2", 2, List.of(
				"All Sub-specialist Grade 1 activities",
				"Approve Clinical Audit"));
		role(list, "SUBSPEC_GR3", "Sub-specialist Grade 3", 3, List.of(
				"All Sub-specialist Grade 2 activities",
				"Access Departmental Analytics"));
		return list;
	}

	public static List<String> grades() {
		return List.of("1", "2", "3");
	}

	public static Map<String, Object> fullCatalog() {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("specialities", specialities());
		map.put("subSpecialities", subSpecialities());
		map.put("clinicianCategories", clinicianCategories());
		map.put("systemRoles", systemRoles());
		map.put("grades", grades());
		map.put("note",
				"In South Africa, Physician means Internal Medicine specialist — not a general practitioner.");
		return map;
	}

	public static String designationFor(String specialty) {
		if (specialty == null || specialty.isBlank()) {
			return null;
		}
		return specialities().stream()
				.filter(s -> specialty.equalsIgnoreCase(s.get("speciality")))
				.map(s -> s.get("designation"))
				.findFirst()
				.orElse(specialty);
	}

	public static String codeForSpecialty(String specialty) {
		if (specialty == null || specialty.isBlank()) {
			return "GEN";
		}
		return specialities().stream()
				.filter(s -> specialty.equalsIgnoreCase(s.get("speciality")))
				.map(s -> s.get("code"))
				.findFirst()
				.orElse(specialty.replaceAll("[^A-Za-z]", "").toUpperCase(Locale.ROOT).substring(0,
						Math.min(6, specialty.replaceAll("[^A-Za-z]", "").length())));
	}

	/**
	 * Derive a system role code from category + grade + specialty (e.g. SPEC_PHYS_GR1).
	 */
	public static String deriveSystemRoleCode(String clinicianCategory, Integer grade, String specialty) {
		String category = clinicianCategory == null ? "MEDICAL_OFFICER" : clinicianCategory.trim().toUpperCase(Locale.ROOT);
		String specCode = codeForSpecialty(specialty);
		Integer g = grade;
		return switch (category) {
			case "INTERN" -> "INTERN";
			case "COMMUNITY_SERVICE" -> "MO_CS";
			case "GP" -> "GP";
			case "MEDICAL_OFFICER" -> "MO_GR" + (g == null ? "1" : g);
			case "SPECIALIST" -> "SPEC_" + specCode + "_GR" + (g == null ? "1" : g);
			case "SUB_SPECIALIST" -> "SUBSPEC_" + specCode + "_GR" + (g == null ? "1" : g);
			case "DENTAL_SPECIALIST" -> "DENT_" + specCode + "_GR" + (g == null ? "1" : g);
			default -> category;
		};
	}

	public static String hpcsaCategoryLabel(String clinicianCategory, String specialty) {
		String category = clinicianCategory == null ? "" : clinicianCategory.trim().toUpperCase(Locale.ROOT);
		String designation = designationFor(specialty);
		return switch (category) {
			case "INTERN" -> "HPCSA Intern";
			case "COMMUNITY_SERVICE" -> "HPCSA Independent Practice (Community Service)";
			case "MEDICAL_OFFICER", "GP" -> "HPCSA Independent Practice";
			case "SPECIALIST" -> "HPCSA Specialist" + (designation != null ? " (" + specialty + ")" : "");
			case "SUB_SPECIALIST" -> "HPCSA Sub-specialist" + (specialty != null ? " (" + specialty + ")" : "");
			case "DENTAL_SPECIALIST" -> "HPCSA Dental Specialist" + (specialty != null ? " (" + specialty + ")" : "");
			default -> "HPCSA Registered Practitioner";
		};
	}

	public static boolean requiresCosign(String clinicianCategory) {
		return clinicianCategory != null && "INTERN".equalsIgnoreCase(clinicianCategory.trim());
	}

	private static void add(List<Map<String, String>> list, String speciality, String designation, String code, String board) {
		Map<String, String> row = new LinkedHashMap<>();
		row.put("speciality", speciality);
		row.put("designation", designation);
		row.put("code", code);
		row.put("board", board);
		list.add(row);
	}

	private static void sub(List<Map<String, String>> list, String name, String parent) {
		Map<String, String> row = new LinkedHashMap<>();
		row.put("name", name);
		row.put("parentSpeciality", parent);
		list.add(row);
	}

	private static void cat(List<Map<String, String>> list, String code, String title, String hpcsa) {
		Map<String, String> row = new LinkedHashMap<>();
		row.put("code", code);
		row.put("title", title);
		row.put("hpcsaRegistration", hpcsa);
		list.add(row);
	}

	private static void role(List<Map<String, Object>> list, String code, String title, Integer grade, List<String> activities) {
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("code", code);
		row.put("title", title);
		row.put("grade", grade);
		row.put("activities", activities);
		list.add(row);
	}
}

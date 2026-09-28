package za.gov.mpumalanga.rfh.config;

import java.util.Locale;
import java.util.Map;

public final class StaffPosts {
	public record Post(String department, String jobTitle) {}

	private static final Map<String, Post> POSTS = Map.ofEntries(
			Map.entry("admin", new Post("Corporate", "Hospital Administrator")),
			Map.entry("super_admin", new Post("Corporate", "Super Administrator")),
			Map.entry("hr", new Post("Human Resources", "HR Officer")),
			Map.entry("finance", new Post("Finance", "Finance Officer")),
			Map.entry("payroll", new Post("Payroll", "Payroll Officer")),
			Map.entry("procurement", new Post("Procurement", "Procurement Officer")),
			Map.entry("pharmacy", new Post("Pharmacy", "Pharmacist")),
			Map.entry("nurse", new Post("Nursing", "Professional Nurse")),
			Map.entry("nurse_manager", new Post("Nursing", "Nurse Manager")),
			Map.entry("casualty", new Post("Casualty", "Casualty Officer")),
			Map.entry("lab", new Post("Laboratory", "Laboratory Technologist")),
			Map.entry("radiology", new Post("Radiology", "Radiographer")),
			Map.entry("facilities", new Post("Facilities", "Facilities Officer")),
			Map.entry("allied", new Post("Allied Health", "Allied Health Practitioner")),
			Map.entry("reception", new Post("Admissions", "Receptionist")),
			Map.entry("housekeeping", new Post("Environmental Services", "Housekeeper")),
			Map.entry("porter", new Post("Patient Transport", "Porter")),
			Map.entry("records", new Post("Health Records", "Medical Records Clerk")),
			Map.entry("midwife", new Post("Maternity", "Midwife")),
			Map.entry("theatre", new Post("Theatre", "Theatre Nurse")),
			Map.entry("anaesthetist", new Post("Theatre", "Anaesthetist")),
			Map.entry("infection", new Post("Infection Prevention", "Infection Prevention Practitioner")),
			Map.entry("social", new Post("Social Work", "Social Worker")),
			Map.entry("security", new Post("Security", "Security Officer")),
			Map.entry("catering", new Post("Catering", "Catering Officer")),
			Map.entry("quality", new Post("Quality", "Quality Officer")),
			Map.entry("mortuary", new Post("Mortuary", "Mortuary Officer")),
			Map.entry("doctor", new Post("Clinical", "Medical Officer")));

	private StaffPosts() {}

	public static Post forRole(String role) {
		String key = role == null ? "" : role.trim().toLowerCase(Locale.ROOT);
		return POSTS.getOrDefault(key, new Post("Hospital", key.isBlank() ? "Staff" : key));
	}
}

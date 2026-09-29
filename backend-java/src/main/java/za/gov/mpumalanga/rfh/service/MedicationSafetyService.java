package za.gov.mpumalanga.rfh.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import za.gov.mpumalanga.rfh.entity.Prescription;
import za.gov.mpumalanga.rfh.entity.User;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.PrescriptionRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;

@Service
public class MedicationSafetyService {
	private static final Map<String, List<String>> ALLERGY_CLASSES = Map.of(
			"penicillin", List.of("penicillin", "amoxicillin", "ampicillin", "augmentin", "co-amoxiclav"),
			"nsaid", List.of("nsaid", "ibuprofen", "diclofenac", "aspirin", "naproxen"),
			"sulfa", List.of("sulfa", "sulfonamide", "cotrimoxazole", "bactrim"),
			"opioid", List.of("opioid", "morphine", "codeine", "tramadol"));
	private static final Map<String, Double> MAX_SINGLE_DOSE = Map.of(
			"paracetamol", 1000d,
			"ibuprofen", 800d,
			"morphine", 20d,
			"warfarin", 10d,
			"enoxaparin", 150d,
			"insulin", 50d);

	private final UserRepository userRepository;
	private final PrescriptionRepository prescriptionRepository;

	public MedicationSafetyService(UserRepository userRepository, PrescriptionRepository prescriptionRepository) {
		this.userRepository = userRepository;
		this.prescriptionRepository = prescriptionRepository;
	}

	public Review review(Long patientId, String medication, String dosage, Long ignorePrescriptionId) {
		Review review = new Review();
		String drug = medication == null ? "" : medication.trim();
		if (drug.isBlank()) {
			review.blockers.add("Medication name is required");
			return review;
		}
		User patient = patientId == null ? null : userRepository.findById(patientId).orElse(null);
		String allergies = patient == null || patient.getAllergies() == null ? "" : patient.getAllergies().toLowerCase(Locale.ROOT);
		if (!allergies.isBlank() && allergyHit(allergies, drug.toLowerCase(Locale.ROOT))) {
			review.blockers.add("Allergy warning: " + drug + " matches the recorded allergy list");
		}
		Double dose = parseDoseMg(dosage);
		Double max = maxDose(drug.toLowerCase(Locale.ROOT));
		if (dose == null) {
			review.warnings.add("Dose is not a number, so it could not be checked against the usual single-dose limit");
		} else if (max != null && dose > max) {
			review.blockers.add("Dose " + trim(dose) + " is above the usual single-dose limit of " + trim(max) + " for " + drug);
		}
		if (patientId != null) {
			for (Prescription existing : prescriptionRepository.findByPatientId(patientId)) {
				if (ignorePrescriptionId != null && ignorePrescriptionId.equals(existing.getId())) continue;
				if ("REJECTED".equalsIgnoreCase(existing.getVerificationStatus())) continue;
				if (sameDrug(existing.getMedication(), drug)) {
					review.warnings.add("Duplicate medication: " + drug + " is already prescribed for this patient");
					break;
				}
			}
		}
		return review;
	}

	public Review reviewByName(String patientName, String medication, String dosage) {
		Long patientId = null;
		if (patientName != null && !patientName.isBlank()) {
			String wanted = patientName.trim().toLowerCase(Locale.ROOT);
			for (User user : userRepository.findAll()) {
				String name = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
						+ (user.getLastName() == null ? "" : user.getLastName())).trim().toLowerCase(Locale.ROOT);
				if (wanted.equals(name)) {
					patientId = user.getId();
					break;
				}
			}
		}
		Review review = review(patientId, medication, dosage, null);
		if (patientId == null) {
			review.warnings.add("No matching patient record, so the allergy list could not be checked");
		}
		return review;
	}

	public void enforce(Review review, boolean acknowledged) {
		if (review.blockers.isEmpty() && review.warnings.isEmpty()) return;
		if (acknowledged && review.blockers.isEmpty()) return;
		if (acknowledged && !review.blockers.isEmpty()) {
			throw new ApiException(409, "Safety check still blocks this medicine. " + String.join(". ", review.blockers));
		}
		List<String> all = new ArrayList<>();
		all.addAll(review.blockers);
		all.addAll(review.warnings);
		throw new ApiException(409, String.join(". ", all) + ". Confirm the warning before continuing.");
	}

	private static boolean allergyHit(String allergies, String drug) {
		if (allergies.contains(drug)) return true;
		for (Map.Entry<String, List<String>> entry : ALLERGY_CLASSES.entrySet()) {
			boolean patientHasClass = entry.getValue().stream().anyMatch(allergies::contains) || allergies.contains(entry.getKey());
			boolean drugInClass = entry.getValue().stream().anyMatch(drug::contains) || drug.contains(entry.getKey());
			if (patientHasClass && drugInClass) return true;
		}
		return false;
	}

	private static boolean sameDrug(String left, String right) {
		if (left == null || right == null) return false;
		String a = left.trim().toLowerCase(Locale.ROOT);
		String b = right.trim().toLowerCase(Locale.ROOT);
		return a.equals(b) || a.contains(b) || b.contains(a);
	}

	private static Double maxDose(String drug) {
		for (Map.Entry<String, Double> entry : MAX_SINGLE_DOSE.entrySet()) {
			if (drug.contains(entry.getKey())) return entry.getValue();
		}
		return null;
	}

	private static Double parseDoseMg(String dosage) {
		if (dosage == null) return null;
		String text = dosage.trim().toLowerCase(Locale.ROOT);
		StringBuilder number = new StringBuilder();
		for (int i = 0; i < text.length(); i++) {
			char c = text.charAt(i);
			if (Character.isDigit(c) || c == '.') {
				number.append(c);
			} else if (number.length() > 0) {
				break;
			}
		}
		if (number.isEmpty()) return null;
		try {
			double value = Double.parseDouble(number.toString());
			if (text.contains(" g") || text.endsWith("g") && !text.contains("mg") && !text.contains("mcg")) {
				value = value * 1000;
			}
			return value;
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private static String trim(double value) {
		if (value == Math.rint(value)) return String.valueOf((long) value);
		return String.valueOf(value);
	}

	public static class Review {
		public final List<String> blockers = new ArrayList<>();
		public final List<String> warnings = new ArrayList<>();

		public String summary() {
			List<String> all = new ArrayList<>();
			all.addAll(blockers);
			all.addAll(warnings);
			return String.join(". ", all);
		}

		public Map<String, Object> toMap() {
			Map<String, Object> map = new LinkedHashMap<>();
			map.put("blockers", blockers);
			map.put("warnings", warnings);
			return map;
		}
	}
}

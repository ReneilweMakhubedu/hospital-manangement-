package za.gov.mpumalanga.rfh.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.Dispensation;
import za.gov.mpumalanga.rfh.entity.Medicine;
import za.gov.mpumalanga.rfh.entity.Prescription;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.DispensationRepository;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.MedicineRepository;
import za.gov.mpumalanga.rfh.repository.PrescriptionRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.AuditService;
import za.gov.mpumalanga.rfh.service.ClinicalSignOff;
import za.gov.mpumalanga.rfh.service.GovernanceService;
import za.gov.mpumalanga.rfh.service.MedicationSafetyService;

@RestController
@RequestMapping("/api/pharmacy")
public class PharmacyController {

	private final MedicineRepository medicineRepository;
	private final PrescriptionRepository prescriptionRepository;
	private final DispensationRepository dispensationRepository;
	private final UserRepository userRepository;
	private final DoctorRepository doctorRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final MedicationSafetyService medicationSafetyService;
	private final AuditService auditService;
	private final GovernanceService governanceService;

	public PharmacyController(
			MedicineRepository medicineRepository,
			PrescriptionRepository prescriptionRepository,
			DispensationRepository dispensationRepository,
			UserRepository userRepository,
			DoctorRepository doctorRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			MedicationSafetyService medicationSafetyService,
			AuditService auditService,
			GovernanceService governanceService) {
		this.medicineRepository = medicineRepository;
		this.prescriptionRepository = prescriptionRepository;
		this.dispensationRepository = dispensationRepository;
		this.userRepository = userRepository;
		this.doctorRepository = doctorRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.medicationSafetyService = medicationSafetyService;
		this.auditService = auditService;
		this.governanceService = governanceService;
	}

	@GetMapping("/medicines")
	public List<Map<String, Object>> medicines() {
		requireRead();
		return medicineRepository.findAllByOrderByNameAsc().stream().map(responseMapper::medicine).toList();
	}

	@PostMapping("/medicines")
	public ResponseEntity<Map<String, Object>> addMedicine(@RequestBody Map<String, Object> body) {
		securityUtils.requireRoles("pharmacy", "admin", "super_admin");
		String name = str(body.get("name"));
		String strength = str(body.get("strength"));
		String form = str(body.get("form"));
		Integer quantity = asInt(body.get("quantity"));
		Integer reorderLevel = asInt(body.get("reorderLevel"));
		if (!isPresent(name) || !isPresent(strength) || !isPresent(form)
				|| quantity == null || quantity < 0 || reorderLevel == null || reorderLevel < 0) {
			throw new ApiException(400, "Enter a medicine name, strength, form, and valid stock levels");
		}
		try {
			Medicine medicine = new Medicine();
			medicine.setName(name.trim());
			medicine.setStrength(strength.trim());
			medicine.setForm(form.trim());
			medicine.setQuantity(quantity);
			medicine.setReorderLevel(reorderLevel);
			medicine = medicineRepository.save(medicine);
			return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.medicine(medicine));
		} catch (DataIntegrityViolationException ex) {
			throw new ApiException(400, "This medicine is already in inventory");
		} catch (Exception ex) {
			throw new ApiException(400, "Unable to add medicine");
		}
	}

	@PatchMapping("/medicines/{id}/stock")
	public Map<String, Object> updateStock(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireRoles("pharmacy", "admin", "super_admin");
		Integer quantity = asInt(body.get("quantity"));
		if (quantity == null || quantity < 0) {
			throw new ApiException(400, "Stock quantity must be a whole number of zero or more");
		}
		Medicine medicine = medicineRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Medicine not found"));
		int current = medicine.getQuantity() == null ? 0 : medicine.getQuantity();
		if (quantity < current) {
			if (!"pharmacy".equalsIgnoreCase(auth.role())) {
				throw new ApiException(403, "Only a pharmacist can request a stock write-off");
			}
			String reason = body.get("reason") == null ? "" : String.valueOf(body.get("reason"));
			return governanceService.request(auth, GovernanceService.STOCK,
					"Write off " + medicine.getName() + " from " + current + " to " + quantity,
					reason,
					Map.of("medicineId", id, "quantity", quantity));
		}
		medicine.setQuantity(quantity);
		Medicine saved = medicineRepository.save(medicine);
		auditService.logChange(auth, "UPDATE", "Medicine", saved.getId(), "Stock received", "Quantity set to " + quantity);
		return responseMapper.medicine(saved);
	}

	@GetMapping("/prescriptions")
	public List<Map<String, Object>> prescriptions() {
		requireRead();
		return prescriptionRepository.findAllByOrderByCreatedAtDesc().stream().map(p -> {
			Map<String, Object> map = new LinkedHashMap<>();
			map.put("_id", p.getId());
			map.put("medication", p.getMedication());
			map.put("dosage", p.getDosage());
			map.put("frequency", p.getFrequency());
			map.put("createdAt", p.getCreatedAt());
			map.put("verificationStatus", p.getVerificationStatus() == null ? "PENDING" : p.getVerificationStatus());
			map.put("safetyFlags", p.getSafetyFlags());
			map.put("signReason", p.getSignReason());
			userRepository.findById(p.getPatientId()).ifPresent(u ->
					map.put("patientName", u.getFirstName() + " " + u.getLastName()));
			doctorRepository.findById(p.getDoctorId()).ifPresent(d ->
					map.put("doctorName", d.getFirstName() + " " + d.getLastName()));
			Long dispensed = dispensationRepository.sumQuantityByPrescriptionId(p.getId());
			map.put("dispensedQuantity", dispensed == null ? 0 : dispensed);
			return map;
		}).toList();
	}

	@PostMapping("/prescriptions/{id}/verify")
	public Map<String, Object> verify(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireRoles("pharmacy");
		Prescription prescription = prescriptionRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Prescription not found"));
		String decision = body.get("decision") == null ? "" : String.valueOf(body.get("decision")).trim().toUpperCase();
		if (!"VERIFIED".equals(decision) && !"REJECTED".equals(decision)) {
			throw new ApiException(400, "decision must be VERIFIED or REJECTED");
		}
		String reason = ClinicalSignOff.require(body.get("reason"));
		MedicationSafetyService.Review review = medicationSafetyService.review(
				prescription.getPatientId(), prescription.getMedication(), prescription.getDosage(), prescription.getId());
		if ("VERIFIED".equals(decision)) {
			medicationSafetyService.enforce(review, ClinicalSignOff.acknowledged(body.get("acknowledgeSafety")));
		}
		prescription.setVerificationStatus(decision);
		prescription.setVerifiedByEmail(auditService.actorEmail(auth));
		prescription.setVerifiedAt(java.time.Instant.now());
		prescription.setVerificationNote(reason);
		prescription.setSafetyFlags(review.summary());
		prescriptionRepository.save(prescription);
		auditService.logChange(auth, decision, "Prescription", prescription.getId(), prescription.getMedication(), reason);
		Map<String, Object> response = responseMapper.prescription(prescription);
		response.put("safety", review.toMap());
		return response;
	}

	@PostMapping("/dispensations")
	@Transactional
	public ResponseEntity<Map<String, Object>> dispense(@RequestBody Map<String, Object> body) {
		AuthUser auth = securityUtils.requireRoles("pharmacy");
		Long prescriptionId = asLong(body.get("prescriptionId"));
		Long medicineId = asLong(body.get("medicineId"));
		Integer quantity = asInt(body.get("quantity"));
		if (prescriptionId == null || medicineId == null || quantity == null || quantity < 1) {
			throw new ApiException(400, "Select a prescription, medicine, and valid quantity");
		}
		Prescription prescription = prescriptionRepository.findById(prescriptionId).orElse(null);
		Medicine medicine = medicineRepository.findById(medicineId).orElse(null);
		if (prescription == null || medicine == null) {
			throw new ApiException(404, "Prescription or medicine not found");
		}
		if (medicine.getQuantity() < quantity) {
			throw new ApiException(400, "Only " + medicine.getQuantity() + " unit(s) are available");
		}
		if (!"VERIFIED".equalsIgnoreCase(prescription.getVerificationStatus())) {
			throw new ApiException(409, "A pharmacist must verify this prescription before it can be dispensed");
		}
		MedicationSafetyService.Review review = medicationSafetyService.review(
				prescription.getPatientId(), prescription.getMedication(), prescription.getDosage(), prescription.getId());
		medicationSafetyService.enforce(review, ClinicalSignOff.acknowledged(body.get("acknowledgeSafety")));
		medicine.setQuantity(medicine.getQuantity() - quantity);
		medicineRepository.save(medicine);
		Dispensation dispensation = new Dispensation();
		dispensation.setPrescriptionId(prescriptionId);
		dispensation.setMedicineId(medicineId);
		dispensation.setQuantity(quantity);
		dispensation.setDispensedBy(auth.id());
		dispensation = dispensationRepository.save(dispensation);
		auditService.logChange(auth, "DISPENSE", "Prescription", prescription.getId(), prescription.getMedication(), "Dispensed " + quantity);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("message", "Medication dispensed successfully");
		response.put("id", dispensation.getId());
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@GetMapping("/dispensations")
	public List<Map<String, Object>> dispensations() {
		requireRead();
		return dispensationRepository.findTop20ByOrderByDispensedAtDesc().stream().map(x -> {
			Map<String, Object> map = new LinkedHashMap<>();
			map.put("_id", x.getId());
			map.put("quantity", x.getQuantity());
			map.put("dispensedAt", x.getDispensedAt());
			medicineRepository.findById(x.getMedicineId()).ifPresent(m -> {
				map.put("medicineName", m.getName());
				map.put("strength", m.getStrength());
			});
			prescriptionRepository.findById(x.getPrescriptionId()).ifPresent(p -> {
				map.put("medication", p.getMedication());
				userRepository.findById(p.getPatientId()).ifPresent(u ->
						map.put("patientName", u.getFirstName() + " " + u.getLastName()));
			});
			return map;
		}).toList();
	}

	private AuthUser requireRead() {
		return securityUtils.requireRoles("pharmacy", "doctor", "admin", "super_admin");
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}

	private static boolean isPresent(String value) {
		return value != null && !value.isBlank();
	}

	private static Integer asInt(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof Number number) {
			double d = number.doubleValue();
			if (d != Math.rint(d)) {
				return null;
			}
			return number.intValue();
		}
		try {
			return Integer.valueOf(String.valueOf(value));
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private static Long asLong(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof Number number) {
			double d = number.doubleValue();
			if (d != Math.rint(d)) {
				return null;
			}
			return number.longValue();
		}
		try {
			return Long.valueOf(String.valueOf(value));
		} catch (NumberFormatException ex) {
			return null;
		}
	}
}

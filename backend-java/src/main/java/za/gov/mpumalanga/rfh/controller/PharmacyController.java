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

	public PharmacyController(
			MedicineRepository medicineRepository,
			PrescriptionRepository prescriptionRepository,
			DispensationRepository dispensationRepository,
			UserRepository userRepository,
			DoctorRepository doctorRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.medicineRepository = medicineRepository;
		this.prescriptionRepository = prescriptionRepository;
		this.dispensationRepository = dispensationRepository;
		this.userRepository = userRepository;
		this.doctorRepository = doctorRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping("/medicines")
	public List<Map<String, Object>> medicines() {
		requireStaff();
		return medicineRepository.findAllByOrderByNameAsc().stream().map(responseMapper::medicine).toList();
	}

	@PostMapping("/medicines")
	public ResponseEntity<Map<String, Object>> addMedicine(@RequestBody Map<String, Object> body) {
		requireStaff();
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
		requireStaff();
		Integer quantity = asInt(body.get("quantity"));
		if (quantity == null || quantity < 0) {
			throw new ApiException(400, "Stock quantity must be a whole number of zero or more");
		}
		Medicine medicine = medicineRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Medicine not found"));
		medicine.setQuantity(quantity);
		return responseMapper.medicine(medicineRepository.save(medicine));
	}

	@GetMapping("/prescriptions")
	public List<Map<String, Object>> prescriptions() {
		requireStaff();
		return prescriptionRepository.findAllByOrderByCreatedAtDesc().stream().map(p -> {
			Map<String, Object> map = new LinkedHashMap<>();
			map.put("_id", p.getId());
			map.put("medication", p.getMedication());
			map.put("dosage", p.getDosage());
			map.put("frequency", p.getFrequency());
			map.put("createdAt", p.getCreatedAt());
			userRepository.findById(p.getPatientId()).ifPresent(u ->
					map.put("patientName", u.getFirstName() + " " + u.getLastName()));
			doctorRepository.findById(p.getDoctorId()).ifPresent(d ->
					map.put("doctorName", d.getFirstName() + " " + d.getLastName()));
			Long dispensed = dispensationRepository.sumQuantityByPrescriptionId(p.getId());
			map.put("dispensedQuantity", dispensed == null ? 0 : dispensed);
			return map;
		}).toList();
	}

	@PostMapping("/dispensations")
	@Transactional
	public ResponseEntity<Map<String, Object>> dispense(@RequestBody Map<String, Object> body) {
		AuthUser auth = requireStaff();
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
		medicine.setQuantity(medicine.getQuantity() - quantity);
		medicineRepository.save(medicine);
		Dispensation dispensation = new Dispensation();
		dispensation.setPrescriptionId(prescriptionId);
		dispensation.setMedicineId(medicineId);
		dispensation.setQuantity(quantity);
		dispensation.setDispensedBy(auth.id());
		dispensation = dispensationRepository.save(dispensation);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("message", "Medication dispensed successfully");
		response.put("id", dispensation.getId());
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@GetMapping("/dispensations")
	public List<Map<String, Object>> dispensations() {
		requireStaff();
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

	private AuthUser requireStaff() {
		AuthUser user = securityUtils.requireUser();
		if (!"admin".equalsIgnoreCase(user.role())
				&& !"super_admin".equalsIgnoreCase(user.role())
				&& !"pharmacy".equalsIgnoreCase(user.role())
				&& !"doctor".equalsIgnoreCase(user.role())) {
			throw new ApiException(403, "Only pharmacy, doctor, or hospital admin can access the pharmacy");
		}
		return user;
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

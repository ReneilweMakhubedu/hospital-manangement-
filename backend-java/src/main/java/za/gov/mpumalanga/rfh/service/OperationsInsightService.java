package za.gov.mpumalanga.rfh.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import za.gov.mpumalanga.rfh.entity.LabOrder;
import za.gov.mpumalanga.rfh.entity.Medicine;
import za.gov.mpumalanga.rfh.entity.Vacancy;
import za.gov.mpumalanga.rfh.entity.WardBed;
import za.gov.mpumalanga.rfh.repository.ApprovalRequestRepository;
import za.gov.mpumalanga.rfh.repository.LeaveRequestRepository;
import za.gov.mpumalanga.rfh.repository.MedicineRepository;
import za.gov.mpumalanga.rfh.repository.PrescriptionRepository;
import za.gov.mpumalanga.rfh.repository.SupportStore;
import za.gov.mpumalanga.rfh.repository.VacancyRepository;

@Service
public class OperationsInsightService {
	private final SupportStore supportStore;
	private final MedicineRepository medicineRepository;
	private final VacancyRepository vacancyRepository;
	private final LeaveRequestRepository leaveRequestRepository;
	private final PrescriptionRepository prescriptionRepository;
	private final ApprovalRequestRepository approvalRequestRepository;
	private final LearningService learningService;

	public OperationsInsightService(
			SupportStore supportStore,
			MedicineRepository medicineRepository,
			VacancyRepository vacancyRepository,
			LeaveRequestRepository leaveRequestRepository,
			PrescriptionRepository prescriptionRepository,
			ApprovalRequestRepository approvalRequestRepository,
			LearningService learningService) {
		this.supportStore = supportStore;
		this.medicineRepository = medicineRepository;
		this.vacancyRepository = vacancyRepository;
		this.leaveRequestRepository = leaveRequestRepository;
		this.prescriptionRepository = prescriptionRepository;
		this.approvalRequestRepository = approvalRequestRepository;
		this.learningService = learningService;
	}

	public Map<String, Object> report(String department, String ward, String period) {
		String departmentNeedle = department == null ? "" : department.trim().toLowerCase(Locale.ROOT);
		String wardNeedle = ward == null ? "" : ward.trim().toLowerCase(Locale.ROOT);
		Instant from = from(period);
		List<WardBed> beds = supportStore.all(WardBed.class).stream()
				.filter(bed -> matches(bed.wardName, wardNeedle) && matches(bed.wardName, departmentNeedle))
				.toList();
		long occupied = beds.stream().filter(bed -> "OCCUPIED".equalsIgnoreCase(bed.status)).count();
		long available = beds.stream().filter(bed -> "AVAILABLE".equalsIgnoreCase(bed.status)).count();
		long cleaning = beds.stream().filter(bed -> "CLEANING".equalsIgnoreCase(bed.status)).count();
		long openLabs = supportStore.all(LabOrder.class).stream()
				.filter(order -> order.orderedAt == null || !order.orderedAt.isBefore(from))
				.filter(order -> !"RESULTED".equalsIgnoreCase(order.status) && !"CANCELLED".equalsIgnoreCase(order.status))
				.count();
		long lateLabs = supportStore.all(LabOrder.class).stream()
				.filter(order -> order.orderedAt != null && order.orderedAt.isBefore(Instant.now().minus(6, ChronoUnit.HOURS)))
				.filter(order -> !"RESULTED".equalsIgnoreCase(order.status) && !"CANCELLED".equalsIgnoreCase(order.status))
				.count();
		List<Medicine> medicines = medicineRepository.findAll();
		long lowStock = medicines.stream().filter(this::low).count();
		long depletionRisk = medicines.stream().filter(this::approaching).count();
		long openVacancies = vacancyRepository.findAll().stream().filter(this::openVacancy).filter(vacancy -> matches(vacancy.getDepartment(), departmentNeedle)).count();
		long pendingLeave = leaveRequestRepository.countByStatusIgnoreCase("PENDING");
		long awaitingPharmacist = prescriptionRepository.findAll().stream()
				.filter(row -> row.getVerificationStatus() == null || "PENDING".equalsIgnoreCase(row.getVerificationStatus()))
				.count();
		long pendingApprovals = approvalRequestRepository.countByStatusIgnoreCase("PENDING");

		List<Map<String, Object>> exceptions = new ArrayList<>();
		if (available == 0 && occupied > 0) addException(exceptions, "Beds", "No available beds in this filter");
		if (cleaning > 0) addException(exceptions, "Housekeeping", cleaning + " bed(s) still in cleaning");
		if (lateLabs > 0) addException(exceptions, "Laboratory", lateLabs + " order(s) open longer than 6 hours");
		if (lowStock > 0) addException(exceptions, "Pharmacy", lowStock + " medicine(s) at or below reorder");
		if (openVacancies > 0) addException(exceptions, "Staffing", openVacancies + " open vacancy(ies)");
		if (awaitingPharmacist > 0) addException(exceptions, "Medication", awaitingPharmacist + " prescription(s) waiting for a pharmacist");
		if (pendingApprovals > 0) addException(exceptions, "Approvals", pendingApprovals + " sensitive change(s) waiting for a second person");

		Map<String, Object> kpis = new LinkedHashMap<>();
		kpis.put("occupiedBeds", occupied);
		kpis.put("availableBeds", available);
		kpis.put("bedsInCleaning", cleaning);
		kpis.put("openLabOrders", openLabs);
		kpis.put("lateLabOrders", lateLabs);
		kpis.put("lowStockLines", lowStock);
		kpis.put("stockDepletionRisk", depletionRisk);
		kpis.put("openVacancies", openVacancies);
		kpis.put("pendingLeave", pendingLeave);
		kpis.put("awaitingPharmacist", awaitingPharmacist);
		kpis.put("pendingApprovals", pendingApprovals);

		Map<String, Object> predictions = new LinkedHashMap<>();
		try {
			Map<String, Object> learning = learningService.insights();
			predictions.put("bedDemand", learning.get("bedDemand"));
			predictions.put("labTurnaround", learning.get("labTurnaround"));
		} catch (Exception ex) {
			predictions.put("note", "Forecast is unavailable until more completed cases exist");
		}
		predictions.put("stockDepletion", depletionRisk + " line(s) are within 20% of the reorder level");
		predictions.put("staffing", openVacancies + " open posts and " + pendingLeave + " pending leave requests");

		Map<String, Object> result = new LinkedHashMap<>();
		result.put("department", departmentNeedle);
		result.put("ward", wardNeedle);
		result.put("period", period == null || period.isBlank() ? "7d" : period);
		result.put("kpis", kpis);
		result.put("exceptions", exceptions);
		result.put("predictions", predictions);
		return result;
	}

	private static void addException(List<Map<String, Object>> rows, String area, String detail) {
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("area", area);
		row.put("detail", detail);
		rows.add(row);
	}

	private static Instant from(String period) {
		String value = period == null ? "7d" : period.trim().toLowerCase(Locale.ROOT);
		if ("today".equals(value)) return Instant.now().minus(1, ChronoUnit.DAYS);
		if ("30d".equals(value)) return Instant.now().minus(30, ChronoUnit.DAYS);
		return Instant.now().minus(7, ChronoUnit.DAYS);
	}

	private static boolean matches(String value, String needle) {
		if (needle == null || needle.isBlank()) return true;
		return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
	}

	private boolean low(Medicine medicine) {
		return medicine.getQuantity() != null && medicine.getReorderLevel() != null
				&& medicine.getQuantity() <= medicine.getReorderLevel();
	}

	private boolean approaching(Medicine medicine) {
		if (medicine.getQuantity() == null || medicine.getReorderLevel() == null || medicine.getReorderLevel() <= 0) return false;
		return medicine.getQuantity() > medicine.getReorderLevel()
				&& medicine.getQuantity() <= Math.ceil(medicine.getReorderLevel() * 1.2);
	}

	private boolean openVacancy(Vacancy vacancy) {
		if (vacancy.getFilledAt() != null) return false;
		String status = vacancy.getStatus() == null ? "" : vacancy.getStatus();
		return !"FILLED".equalsIgnoreCase(status) && !"CLOSED".equalsIgnoreCase(status);
	}
}

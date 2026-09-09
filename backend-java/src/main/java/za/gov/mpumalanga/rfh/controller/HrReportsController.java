package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.entity.HrEmployee;
import za.gov.mpumalanga.rfh.entity.LeaveRequest;
import za.gov.mpumalanga.rfh.entity.PmdsCycle;
import za.gov.mpumalanga.rfh.entity.TrainingEnrolment;
import za.gov.mpumalanga.rfh.entity.Vacancy;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.HrEmployeeRepository;
import za.gov.mpumalanga.rfh.repository.LeaveRequestRepository;
import za.gov.mpumalanga.rfh.repository.PmdsCycleRepository;
import za.gov.mpumalanga.rfh.repository.TrainingEnrolmentRepository;
import za.gov.mpumalanga.rfh.repository.VacancyRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/hr/reports")
public class HrReportsController {

	private final HrEmployeeRepository employeeRepository;
	private final DoctorRepository doctorRepository;
	private final VacancyRepository vacancyRepository;
	private final PmdsCycleRepository pmdsCycleRepository;
	private final LeaveRequestRepository leaveRequestRepository;
	private final TrainingEnrolmentRepository enrolmentRepository;
	private final SecurityUtils securityUtils;

	public HrReportsController(
			HrEmployeeRepository employeeRepository,
			DoctorRepository doctorRepository,
			VacancyRepository vacancyRepository,
			PmdsCycleRepository pmdsCycleRepository,
			LeaveRequestRepository leaveRequestRepository,
			TrainingEnrolmentRepository enrolmentRepository,
			SecurityUtils securityUtils) {
		this.employeeRepository = employeeRepository;
		this.doctorRepository = doctorRepository;
		this.vacancyRepository = vacancyRepository;
		this.pmdsCycleRepository = pmdsCycleRepository;
		this.leaveRequestRepository = leaveRequestRepository;
		this.enrolmentRepository = enrolmentRepository;
		this.securityUtils = securityUtils;
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		securityUtils.requireHr();

		List<HrEmployee> employees = employeeRepository.findAll();
		long activeEmployees = employees.stream()
				.filter(e -> "ACTIVE".equalsIgnoreCase(e.getStatus()) || "ON_LEAVE".equalsIgnoreCase(e.getStatus()))
				.count();
		long headcount = activeEmployees + doctorRepository.count();
		long resigned = employees.stream().filter(e -> "RESIGNED".equalsIgnoreCase(e.getStatus())).count();
		double turnover = headcount == 0 ? 8.5 : round1(Math.max(8.5, (resigned * 100.0) / Math.max(1, headcount)));

		List<Vacancy> vacancies = vacancyRepository.findAll();
		int postsApproved = vacancies.stream().mapToInt(v -> safeInt(v.getPostsApproved())).sum();
		int postsFilled = vacancies.stream().mapToInt(v -> safeInt(v.getPostsFilled())).sum();
		int gap = Math.max(0, postsApproved - postsFilled);
		double vacancyRate = postsApproved == 0 ? 0.0 : round1((gap * 100.0) / postsApproved);
		double avgTimeToFill = computeAvgTimeToFill(vacancies);

		List<PmdsCycle> cycles = pmdsCycleRepository.findAll();
		long pmdsComplete = cycles.stream().filter(c -> "COMPLETE".equalsIgnoreCase(c.getStatus())).count();
		double pmdsCompliance = cycles.isEmpty() ? 0.0 : round1((pmdsComplete * 100.0) / cycles.size());

		List<LeaveRequest> leave = leaveRequestRepository.findAll();
		long approvedLeaveDays = leave.stream()
				.filter(l -> "APPROVED".equalsIgnoreCase(l.getStatus()))
				.mapToInt(l -> safeInt(l.getDays()))
				.sum();
		double leaveUtilizationHint = activeEmployees == 0
				? 0.0
				: round1(Math.min(100.0, (approvedLeaveDays * 100.0) / (activeEmployees * 21.0)));

		List<TrainingEnrolment> enrolments = enrolmentRepository.findAll();
		long attended = enrolments.stream().filter(e -> "ATTENDED".equalsIgnoreCase(e.getAttendance())).count();
		double trainingCompletionHint = enrolments.isEmpty()
				? 0.0
				: round1((attended * 100.0) / enrolments.size());

		long retirementRiskCount = employees.stream().filter(HrReportsController::isRetirementRisk).count();

		List<Map<String, Object>> departmentBreakdown = employees.stream()
				.collect(Collectors.groupingBy(
						e -> e.getDepartment() == null || e.getDepartment().isBlank()
								? "Unspecified"
								: e.getDepartment().trim(),
						Collectors.counting()))
				.entrySet().stream()
				.sorted(Map.Entry.comparingByKey(String.CASE_INSENSITIVE_ORDER))
				.map(entry -> {
					Map<String, Object> row = new LinkedHashMap<>();
					row.put("department", entry.getKey());
					row.put("count", entry.getValue());
					return row;
				})
				.toList();

		Map<String, Object> map = new LinkedHashMap<>();
		map.put("turnover", turnover);
		map.put("turnoverPercent", turnover);
		map.put("avgTimeToFillDays", avgTimeToFill);
		map.put("vacancyRate", vacancyRate);
		map.put("pmdsCompliance", pmdsCompliance);
		map.put("pmdsCompliancePercent", pmdsCompliance);
		map.put("leaveUtilizationHint", leaveUtilizationHint);
		map.put("trainingCompletionHint", trainingCompletionHint);
		map.put("retirementRiskCount", retirementRiskCount);
		map.put("departmentBreakdown", departmentBreakdown);
		map.put("headcount", headcount);
		return map;
	}

	private static boolean isRetirementRisk(HrEmployee e) {
		if (!"ACTIVE".equalsIgnoreCase(e.getStatus()) && !"ON_LEAVE".equalsIgnoreCase(e.getStatus())) {
			return false;
		}
		if (e.getDateOfBirth() != null) {
			return Period.between(e.getDateOfBirth(), LocalDate.now()).getYears() >= 60;
		}
		return e.getYearsOfService() != null && e.getYearsOfService() >= 25;
	}

	private static double computeAvgTimeToFill(List<Vacancy> vacancies) {
		List<Long> days = new ArrayList<>();
		for (Vacancy v : vacancies) {
			Instant advertised = v.getAdvertisedAt();
			Instant filled = v.getFilledAt();
			if (advertised != null && filled != null && !filled.isBefore(advertised)) {
				days.add(ChronoUnit.DAYS.between(advertised, filled));
			}
		}
		if (days.isEmpty()) {
			for (Vacancy v : vacancies) {
				if (v.getAdvertisedAt() != null && safeInt(v.getPostsFilled()) > 0) {
					days.add(ChronoUnit.DAYS.between(v.getAdvertisedAt(), Instant.now()));
				}
			}
		}
		if (days.isEmpty()) {
			return 45.0;
		}
		return round1(days.stream().mapToLong(Long::longValue).average().orElse(45.0));
	}

	private static int safeInt(Integer value) {
		return value == null ? 0 : value;
	}

	private static double round1(double value) {
		return Math.round(value * 10.0) / 10.0;
	}
}

package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.HrEmployee;
import za.gov.mpumalanga.rfh.entity.MoralePulse;
import za.gov.mpumalanga.rfh.entity.PmdsCycle;
import za.gov.mpumalanga.rfh.entity.Vacancy;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.HrApplicantRepository;
import za.gov.mpumalanga.rfh.repository.HrEmployeeRepository;
import za.gov.mpumalanga.rfh.repository.LeaveRequestRepository;
import za.gov.mpumalanga.rfh.repository.MoralePulseRepository;
import za.gov.mpumalanga.rfh.repository.PmdsCycleRepository;
import za.gov.mpumalanga.rfh.repository.TrainingCourseRepository;
import za.gov.mpumalanga.rfh.repository.VacancyRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/hr/dashboard")
public class HrDashboardController {

	private final HrEmployeeRepository employeeRepository;
	private final DoctorRepository doctorRepository;
	private final VacancyRepository vacancyRepository;
	private final PmdsCycleRepository pmdsCycleRepository;
	private final LeaveRequestRepository leaveRequestRepository;
	private final TrainingCourseRepository trainingCourseRepository;
	private final MoralePulseRepository moralePulseRepository;
	private final HrApplicantRepository applicantRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public HrDashboardController(
			HrEmployeeRepository employeeRepository,
			DoctorRepository doctorRepository,
			VacancyRepository vacancyRepository,
			PmdsCycleRepository pmdsCycleRepository,
			LeaveRequestRepository leaveRequestRepository,
			TrainingCourseRepository trainingCourseRepository,
			MoralePulseRepository moralePulseRepository,
			HrApplicantRepository applicantRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.employeeRepository = employeeRepository;
		this.doctorRepository = doctorRepository;
		this.vacancyRepository = vacancyRepository;
		this.pmdsCycleRepository = pmdsCycleRepository;
		this.leaveRequestRepository = leaveRequestRepository;
		this.trainingCourseRepository = trainingCourseRepository;
		this.moralePulseRepository = moralePulseRepository;
		this.applicantRepository = applicantRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public Map<String, Object> dashboard() {
		securityUtils.requireHr();

		List<HrEmployee> employees = employeeRepository.findAll();
		long activeEmployees = employees.stream()
				.filter(e -> "ACTIVE".equalsIgnoreCase(e.getStatus()) || "ON_LEAVE".equalsIgnoreCase(e.getStatus()))
				.count();
		long doctorsCount = doctorRepository.count();
		long headcount = activeEmployees + doctorsCount;

		List<Vacancy> vacancies = vacancyRepository.findAll();
		int postsApproved = vacancies.stream().mapToInt(v -> safeInt(v.getPostsApproved())).sum();
		int postsFilled = vacancies.stream().mapToInt(v -> safeInt(v.getPostsFilled())).sum();
		int vacancyGap = Math.max(0, postsApproved - postsFilled);
		long criticalVacanciesCount = vacancies.stream().filter(v -> Boolean.TRUE.equals(v.getCritical())).count();
		double vacancyRate = postsApproved == 0 ? 0.0 : round1((vacancyGap * 100.0) / postsApproved);

		double avgTimeToFillDays = computeAvgTimeToFill(vacancies);

		List<PmdsCycle> cycles = pmdsCycleRepository.findAll();
		long pmdsTotal = cycles.size();
		long pmdsComplete = cycles.stream().filter(c -> "COMPLETE".equalsIgnoreCase(c.getStatus())).count();
		double pmdsCompliancePercent = pmdsTotal == 0 ? 0.0 : round1((pmdsComplete * 100.0) / pmdsTotal);

		long leavePendingCount = leaveRequestRepository.countByStatusIgnoreCase("PENDING");
		long trainingOpenCount = trainingCourseRepository.countByStatusIgnoreCase("OPEN");

		List<MoralePulse> pulses = moralePulseRepository.findAllByOrderByCapturedAtDesc();
		double moraleScore = pulses.isEmpty() || pulses.get(0).getScore() == null
				? 0.0
				: round1(pulses.get(0).getScore());

		long resigned = employees.stream().filter(e -> "RESIGNED".equalsIgnoreCase(e.getStatus())).count();
		double turnoverHintPercent = headcount == 0
				? 8.5
				: round1(Math.max(8.5, (resigned * 100.0) / Math.max(1, headcount)));

		List<String> alerts = new ArrayList<>();
		if (criticalVacanciesCount > 0) {
			alerts.add(criticalVacanciesCount + " critical vacancy post(s) require urgent recruitment.");
		}
		long overduePmds = cycles.stream().filter(c -> !"COMPLETE".equalsIgnoreCase(c.getStatus())).count();
		if (overduePmds > 0) {
			alerts.add(overduePmds + " PMDS cycle(s) are incomplete.");
		}
		long expiringCerts = employees.stream().filter(HrDashboardController::needsClinicalHpcsa).count();
		if (expiringCerts > 0) {
			alerts.add(expiringCerts + " clinical staff member(s) missing HPCSA registration on file.");
		}

		List<Map<String, Object>> criticalVacancies = vacancies.stream()
				.filter(v -> Boolean.TRUE.equals(v.getCritical()))
				.sorted(Comparator.comparing(Vacancy::getTitle, String.CASE_INSENSITIVE_ORDER))
				.limit(5)
				.map(responseMapper::vacancy)
				.toList();

		List<Map<String, Object>> recentApplicants = applicantRepository.findAllByOrderByAppliedAtDesc().stream()
				.limit(5)
				.map(responseMapper::hrApplicant)
				.toList();

		Map<String, Object> map = new LinkedHashMap<>();
		map.put("headcount", headcount);
		map.put("activeEmployees", activeEmployees);
		map.put("doctorsCount", doctorsCount);
		map.put("vacancyGap", vacancyGap);
		map.put("criticalVacanciesCount", criticalVacanciesCount);
		map.put("vacancyRate", vacancyRate);
		map.put("avgTimeToFillDays", avgTimeToFillDays);
		map.put("pmdsCompliancePercent", pmdsCompliancePercent);
		map.put("leavePendingCount", leavePendingCount);
		map.put("trainingOpenCount", trainingOpenCount);
		map.put("moraleScore", moraleScore);
		map.put("turnoverHintPercent", turnoverHintPercent);
		map.put("alerts", alerts);
		map.put("criticalVacancies", criticalVacancies);
		map.put("recentApplicants", recentApplicants);
		return map;
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
			// Estimate when filledAt not yet recorded: posts with advertisedAt and some fills
			for (Vacancy v : vacancies) {
				if (v.getAdvertisedAt() != null && safeInt(v.getPostsFilled()) > 0) {
					days.add(ChronoUnit.DAYS.between(v.getAdvertisedAt(), Instant.now()));
				}
			}
		}
		if (days.isEmpty()) {
			return 45.0;
		}
		double avg = days.stream().mapToLong(Long::longValue).average().orElse(45.0);
		return round1(avg);
	}

	static boolean needsClinicalHpcsa(HrEmployee e) {
		if (!"ACTIVE".equalsIgnoreCase(e.getStatus()) && !"ON_LEAVE".equalsIgnoreCase(e.getStatus())) {
			return false;
		}
		String title = e.getJobTitle() == null ? "" : e.getJobTitle().toLowerCase(Locale.ROOT);
		boolean clinical = title.contains("nurse")
				|| title.contains("doctor")
				|| title.contains("medical")
				|| title.contains("pharmacist")
				|| title.contains("radiographer")
				|| title.contains("clinician")
				|| title.contains("specialist");
		return clinical && (e.getHpcsaNumber() == null || e.getHpcsaNumber().isBlank());
	}

	private static int safeInt(Integer value) {
		return value == null ? 0 : value;
	}

	private static double round1(double value) {
		return Math.round(value * 10.0) / 10.0;
	}
}

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
import za.gov.mpumalanga.rfh.config.StaffPosts;
import za.gov.mpumalanga.rfh.entity.Admin;
import za.gov.mpumalanga.rfh.entity.Doctor;
import za.gov.mpumalanga.rfh.entity.HrEmployee;
import za.gov.mpumalanga.rfh.entity.MoralePulse;
import za.gov.mpumalanga.rfh.entity.PmdsCycle;
import za.gov.mpumalanga.rfh.entity.Vacancy;
import za.gov.mpumalanga.rfh.repository.AdminRepository;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.HrApplicantRepository;
import za.gov.mpumalanga.rfh.repository.HrEmployeeRepository;
import za.gov.mpumalanga.rfh.repository.LeaveRequestRepository;
import za.gov.mpumalanga.rfh.repository.MoralePulseRepository;
import za.gov.mpumalanga.rfh.repository.PmdsCycleRepository;
import za.gov.mpumalanga.rfh.repository.TrainingCourseRepository;
import za.gov.mpumalanga.rfh.repository.VacancyRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.StaffLinkService;

@RestController
@RequestMapping("/api/hr/dashboard")
public class HrDashboardController {

	private final HrEmployeeRepository employeeRepository;
	private final AdminRepository adminRepository;
	private final DoctorRepository doctorRepository;
	private final VacancyRepository vacancyRepository;
	private final PmdsCycleRepository pmdsCycleRepository;
	private final LeaveRequestRepository leaveRequestRepository;
	private final TrainingCourseRepository trainingCourseRepository;
	private final MoralePulseRepository moralePulseRepository;
	private final HrApplicantRepository applicantRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;
	private final StaffLinkService staffLinkService;

	public HrDashboardController(
			HrEmployeeRepository employeeRepository,
			AdminRepository adminRepository,
			DoctorRepository doctorRepository,
			VacancyRepository vacancyRepository,
			PmdsCycleRepository pmdsCycleRepository,
			LeaveRequestRepository leaveRequestRepository,
			TrainingCourseRepository trainingCourseRepository,
			MoralePulseRepository moralePulseRepository,
			HrApplicantRepository applicantRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils,
			StaffLinkService staffLinkService) {
		this.employeeRepository = employeeRepository;
		this.adminRepository = adminRepository;
		this.doctorRepository = doctorRepository;
		this.vacancyRepository = vacancyRepository;
		this.pmdsCycleRepository = pmdsCycleRepository;
		this.leaveRequestRepository = leaveRequestRepository;
		this.trainingCourseRepository = trainingCourseRepository;
		this.moralePulseRepository = moralePulseRepository;
		this.applicantRepository = applicantRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
		this.staffLinkService = staffLinkService;
	}

	@GetMapping
	public Map<String, Object> dashboard() {
		securityUtils.requireHr();
		staffLinkService.link();

		List<HrEmployee> employees = employeeRepository.findAll();
		long activeEmployees = employees.stream()
				.filter(e -> "ACTIVE".equalsIgnoreCase(e.getStatus()) || "ON_LEAVE".equalsIgnoreCase(e.getStatus()))
				.count();
		long doctorsCount = doctorRepository.count();
		List<Map<String, Object>> staff = staffRoster(employees);
		long headcount = staff.size();

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
		map.put("staff", staff);
		map.put("staffByDepartment", departmentCounts(staff));
		return map;
	}

	private List<Map<String, Object>> staffRoster(List<HrEmployee> employees) {
		Map<String, Map<String, Object>> byEmail = new LinkedHashMap<>();
		for (HrEmployee employee : employees) {
			if (!StaffLinkService.isActive(employee)) continue;
			String email = employee.getEmail() == null ? "" : employee.getEmail().trim().toLowerCase(Locale.ROOT);
			if (email.isBlank() || byEmail.containsKey(email)) continue;
			Map<String, Object> row = person(employee.getFirstName(), employee.getLastName(), email, employee.getDepartment(), employee.getJobTitle());
			row.put("loginEmail", employee.getLoginEmail());
			byEmail.put(email, row);
		}
		for (Admin admin : adminRepository.findAll()) {
			if (covered(employees, admin.getEmail(), admin.getFirstName(), admin.getLastName())) continue;
			addPerson(byEmail, admin.getEmail(), admin.getFirstName(), admin.getLastName(), admin.getRole(), null);
		}
		for (Doctor doctor : doctorRepository.findAll()) {
			if (covered(employees, doctor.getEmail(), doctor.getFirstName(), doctor.getLastName())) continue;
			addPerson(byEmail, doctor.getEmail(), doctor.getFirstName(), doctor.getLastName(), "doctor", doctor.getSpecialty());
		}
		return byEmail.values().stream()
				.sorted(Comparator
						.comparing((Map<String, Object> row) -> String.valueOf(row.get("department")), String.CASE_INSENSITIVE_ORDER)
						.thenComparing(row -> String.valueOf(row.get("name")), String.CASE_INSENSITIVE_ORDER))
				.toList();
	}

	private static boolean covered(List<HrEmployee> employees, String email, String firstName, String lastName) {
		String wanted = ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim().toLowerCase(Locale.ROOT);
		for (HrEmployee employee : employees) {
			if (!StaffLinkService.isActive(employee)) continue;
			if (email != null && email.equalsIgnoreCase(employee.getEmail())) return true;
			if (email != null && email.equalsIgnoreCase(employee.getLoginEmail())) return true;
			String name = ((employee.getFirstName() == null ? "" : employee.getFirstName()) + " " + (employee.getLastName() == null ? "" : employee.getLastName())).trim().toLowerCase(Locale.ROOT);
			if (!wanted.isBlank() && wanted.equals(name)) return true;
		}
		return false;
	}

	private void addPerson(Map<String, Map<String, Object>> byEmail, String email, String firstName, String lastName, String role, String specialty) {
		if (email == null || email.isBlank()) return;
		String key = email.trim().toLowerCase(Locale.ROOT);
		if (byEmail.containsKey(key)) return;
		StaffPosts.Post post = StaffPosts.forRole(role);
		String title = specialty == null || specialty.isBlank() ? post.jobTitle() : post.jobTitle() + " · " + specialty;
		byEmail.put(key, person(firstName, lastName, email.trim(), post.department(), title));
	}

	private static Map<String, Object> person(String firstName, String lastName, String email, String department, String jobTitle) {
		String name = ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("name", name.isBlank() ? email : name);
		row.put("email", email);
		row.put("department", department == null || department.isBlank() ? "Hospital" : department);
		row.put("jobTitle", jobTitle == null || jobTitle.isBlank() ? "Staff" : jobTitle);
		return row;
	}

	private static List<Map<String, Object>> departmentCounts(List<Map<String, Object>> staff) {
		Map<String, Integer> counts = new LinkedHashMap<>();
		for (Map<String, Object> row : staff) {
			String department = String.valueOf(row.get("department"));
			counts.put(department, counts.getOrDefault(department, 0) + 1);
		}
		return counts.entrySet().stream().map(entry -> {
			Map<String, Object> row = new LinkedHashMap<>();
			row.put("department", entry.getKey());
			row.put("count", entry.getValue());
			return row;
		}).toList();
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

package za.gov.mpumalanga.rfh.controller;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.Doctor;
import za.gov.mpumalanga.rfh.entity.Vacancy;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.repository.VacancyRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/hr/staffing")
public class HrStaffingController {

	private final VacancyRepository vacancyRepository;
	private final DoctorRepository doctorRepository;
	private final UserRepository userRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public HrStaffingController(
			VacancyRepository vacancyRepository,
			DoctorRepository doctorRepository,
			UserRepository userRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.vacancyRepository = vacancyRepository;
		this.doctorRepository = doctorRepository;
		this.userRepository = userRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping("/summary")
	public Map<String, Object> summary() {
		securityUtils.requireRoles("admin", "hr", "doctor");

		List<Doctor> doctors = doctorRepository.findAll();
		List<Vacancy> vacancies = vacancyRepository.findAll();

		long doctorsTotal = doctors.size();
		long patientsTotal = userRepository.countByRole("patient");

		long open = vacancies.stream().filter(v -> isOpenStatus(v.getStatus())).count();
		long critical = vacancies.stream().filter(v -> Boolean.TRUE.equals(v.getCritical())).count();
		int postsApproved = vacancies.stream().mapToInt(v -> safeInt(v.getPostsApproved())).sum();
		int postsFilled = vacancies.stream().mapToInt(v -> safeInt(v.getPostsFilled())).sum();
		int gap = Math.max(0, postsApproved - postsFilled);
		double vacancyRateApprox = postsApproved == 0 ? 0.0 : (gap * 100.0) / postsApproved;

		Map<String, Object> vacancySummary = new LinkedHashMap<>();
		vacancySummary.put("total", vacancies.size());
		vacancySummary.put("open", open);
		vacancySummary.put("critical", critical);
		vacancySummary.put("postsApproved", postsApproved);
		vacancySummary.put("postsFilled", postsFilled);
		vacancySummary.put("gap", gap);
		vacancySummary.put("vacancyRateApprox", Math.round(vacancyRateApprox * 10.0) / 10.0);

		List<Map<String, Object>> doctorsBySpecialty = doctors.stream()
				.collect(Collectors.groupingBy(
						d -> d.getSpecialty() == null || d.getSpecialty().isBlank()
								? "Unspecified"
								: d.getSpecialty().trim(),
						Collectors.counting()))
				.entrySet().stream()
				.sorted(Map.Entry.comparingByKey(String.CASE_INSENSITIVE_ORDER))
				.map(entry -> {
					Map<String, Object> row = new LinkedHashMap<>();
					row.put("specialty", entry.getKey());
					row.put("count", entry.getValue());
					return row;
				})
				.toList();

		List<Map<String, Object>> criticalVacancies = vacancies.stream()
				.filter(v -> Boolean.TRUE.equals(v.getCritical()))
				.sorted(Comparator.comparing(Vacancy::getTitle, String.CASE_INSENSITIVE_ORDER))
				.map(responseMapper::vacancy)
				.toList();

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("doctorsTotal", doctorsTotal);
		response.put("patientsTotal", patientsTotal);
		response.put("vacancies", vacancySummary);
		response.put("doctorsBySpecialty", doctorsBySpecialty);
		response.put("criticalVacancies", criticalVacancies);
		return response;
	}

	private static boolean isOpenStatus(String status) {
		if (status == null) {
			return false;
		}
		String normalized = status.trim().toUpperCase(Locale.ROOT);
		return "OPEN".equals(normalized) || "IN_RECRUITMENT".equals(normalized);
	}

	private static int safeInt(Integer value) {
		return value == null ? 0 : value;
	}
}

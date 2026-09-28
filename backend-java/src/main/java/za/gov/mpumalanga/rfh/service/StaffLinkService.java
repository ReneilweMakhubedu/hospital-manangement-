package za.gov.mpumalanga.rfh.service;

import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.gov.mpumalanga.rfh.config.StaffPosts;
import za.gov.mpumalanga.rfh.entity.Admin;
import za.gov.mpumalanga.rfh.entity.Doctor;
import za.gov.mpumalanga.rfh.entity.HrEmployee;
import za.gov.mpumalanga.rfh.repository.AdminRepository;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.HrEmployeeRepository;

@Service
public class StaffLinkService {
	private final HrEmployeeRepository employeeRepository;
	private final AdminRepository adminRepository;
	private final DoctorRepository doctorRepository;

	public StaffLinkService(HrEmployeeRepository employeeRepository, AdminRepository adminRepository, DoctorRepository doctorRepository) {
		this.employeeRepository = employeeRepository;
		this.adminRepository = adminRepository;
		this.doctorRepository = doctorRepository;
	}

	@Transactional
	public void link() {
		List<HrEmployee> all = employeeRepository.findAll();
		for (Admin admin : adminRepository.findAll()) {
			linkAccount(all, admin.getFirstName(), admin.getLastName(), admin.getEmail(), admin.getRole());
		}
		for (Doctor doctor : doctorRepository.findAll()) {
			linkAccount(all, doctor.getFirstName(), doctor.getLastName(), doctor.getEmail(), "doctor");
		}
	}

	private void linkAccount(List<HrEmployee> all, String firstName, String lastName, String email, String role) {
		if (email == null || email.isBlank()) return;
		List<HrEmployee> people = all.stream().filter(StaffLinkService::isPersonRecord).toList();
		HrEmployee match = people.stream().filter(employee -> sameName(employee, firstName, lastName)).findFirst().orElse(null);
		if (match == null) {
			StaffPosts.Post post = StaffPosts.forRole(role);
			List<HrEmployee> titled = people.stream().filter(employee -> titleMatch(employee, role, post)).toList();
			if (titled.size() == 1) match = titled.get(0);
		}
		if (match == null) return;
		if (match.getLoginEmail() == null || match.getLoginEmail().isBlank()) {
			match.setLoginEmail(email.trim().toLowerCase(Locale.ROOT));
			employeeRepository.save(match);
		}
		for (HrEmployee extra : all) {
			if (!isLoginRecord(extra) || extra.getId().equals(match.getId())) continue;
			if (!email.equalsIgnoreCase(extra.getEmail())) continue;
			if (!"MERGED".equalsIgnoreCase(extra.getStatus())) {
				extra.setStatus("MERGED");
				employeeRepository.save(extra);
			}
		}
	}

	static boolean isPersonRecord(HrEmployee employee) {
		return isActive(employee) && !isLoginRecord(employee);
	}

	static boolean isLoginRecord(HrEmployee employee) {
		return employee.getEmployeeNumber() != null && employee.getEmployeeNumber().startsWith("LOGIN-");
	}

	public static boolean isActive(HrEmployee employee) {
		return "ACTIVE".equalsIgnoreCase(employee.getStatus()) || "ON_LEAVE".equalsIgnoreCase(employee.getStatus());
	}

	private static boolean sameName(HrEmployee employee, String firstName, String lastName) {
		String left = ((employee.getFirstName() == null ? "" : employee.getFirstName()) + " " + (employee.getLastName() == null ? "" : employee.getLastName())).trim().toLowerCase(Locale.ROOT);
		String right = ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim().toLowerCase(Locale.ROOT);
		return !right.isBlank() && left.equals(right);
	}

	private static boolean titleMatch(HrEmployee employee, String role, StaffPosts.Post post) {
		String title = employee.getJobTitle() == null ? "" : employee.getJobTitle().toLowerCase(Locale.ROOT);
		String expected = post.jobTitle().toLowerCase(Locale.ROOT);
		if (title.equals(expected)) return true;
		return switch (role == null ? "" : role) {
			case "nurse_manager" -> title.contains("manager") && "nursing".equalsIgnoreCase(employee.getDepartment());
			case "theatre" -> title.contains("theatre");
			case "doctor" -> title.contains("medical officer");
			default -> false;
		};
	}
}

package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "doctors")
public class Doctor {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String firstName;

	@Column(nullable = false)
	private String lastName;

	@Column(nullable = false, unique = true)
	private String email;

	@Column(nullable = false)
	private String password;

	@Column(nullable = false)
	private String specialty;

	/** HPCSA designation e.g. Physician, Family Physician */
	private String designation;

	private String subSpecialty;

	/**
	 * INTERN | COMMUNITY_SERVICE | MEDICAL_OFFICER | GP | SPECIALIST | SUB_SPECIALIST | DENTAL_SPECIALIST
	 */
	private String clinicianCategory = "SPECIALIST";

	/** Specialist / MO grade 1–3 (null for intern/GP where N/A) */
	private Integer specialistGrade;

	/** Derived RBAC-style code e.g. SPEC_PHYS_GR1, INTERN */
	private String systemRoleCode;

	/** Human-readable HPCSA registration category label */
	private String hpcsaRegistrationCategory;

	@Column(nullable = false, unique = true)
	private String licenseNumber;

	@Column(nullable = false)
	private String phoneNumber;

	private String department;

	@Column(length = 1000)
	private String qualifications;

	private Integer yearsExperience;

	private String workingHours;

	private Boolean availableToday = true;

	private String consultationNotesTemplate = "SOAP";

	/** Interns and some juniors require senior cosign on prescriptions / notes */
	private Boolean requiresCosign = false;

	/** Login role for JWT — always "doctor" for clinicians */
	@Column(nullable = false)
	private String role = "doctor";

	@Column(nullable = false)
	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (role == null) {
			role = "doctor";
		}
		if (availableToday == null) {
			availableToday = true;
		}
		if (consultationNotesTemplate == null || consultationNotesTemplate.isBlank()) {
			consultationNotesTemplate = "SOAP";
		}
		if (clinicianCategory == null || clinicianCategory.isBlank()) {
			clinicianCategory = "SPECIALIST";
		}
		if (requiresCosign == null) {
			requiresCosign = false;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getFirstName() {
		return firstName;
	}

	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}

	public String getLastName() {
		return lastName;
	}

	public void setLastName(String lastName) {
		this.lastName = lastName;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getSpecialty() {
		return specialty;
	}

	public void setSpecialty(String specialty) {
		this.specialty = specialty;
	}

	public String getDesignation() {
		return designation;
	}

	public void setDesignation(String designation) {
		this.designation = designation;
	}

	public String getSubSpecialty() {
		return subSpecialty;
	}

	public void setSubSpecialty(String subSpecialty) {
		this.subSpecialty = subSpecialty;
	}

	public String getClinicianCategory() {
		return clinicianCategory;
	}

	public void setClinicianCategory(String clinicianCategory) {
		this.clinicianCategory = clinicianCategory;
	}

	public Integer getSpecialistGrade() {
		return specialistGrade;
	}

	public void setSpecialistGrade(Integer specialistGrade) {
		this.specialistGrade = specialistGrade;
	}

	public String getSystemRoleCode() {
		return systemRoleCode;
	}

	public void setSystemRoleCode(String systemRoleCode) {
		this.systemRoleCode = systemRoleCode;
	}

	public String getHpcsaRegistrationCategory() {
		return hpcsaRegistrationCategory;
	}

	public void setHpcsaRegistrationCategory(String hpcsaRegistrationCategory) {
		this.hpcsaRegistrationCategory = hpcsaRegistrationCategory;
	}

	public String getLicenseNumber() {
		return licenseNumber;
	}

	public void setLicenseNumber(String licenseNumber) {
		this.licenseNumber = licenseNumber;
	}

	public String getPhoneNumber() {
		return phoneNumber;
	}

	public void setPhoneNumber(String phoneNumber) {
		this.phoneNumber = phoneNumber;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public String getQualifications() {
		return qualifications;
	}

	public void setQualifications(String qualifications) {
		this.qualifications = qualifications;
	}

	public Integer getYearsExperience() {
		return yearsExperience;
	}

	public void setYearsExperience(Integer yearsExperience) {
		this.yearsExperience = yearsExperience;
	}

	public String getWorkingHours() {
		return workingHours;
	}

	public void setWorkingHours(String workingHours) {
		this.workingHours = workingHours;
	}

	public Boolean getAvailableToday() {
		return availableToday;
	}

	public void setAvailableToday(Boolean availableToday) {
		this.availableToday = availableToday;
	}

	public String getConsultationNotesTemplate() {
		return consultationNotesTemplate;
	}

	public void setConsultationNotesTemplate(String consultationNotesTemplate) {
		this.consultationNotesTemplate = consultationNotesTemplate;
	}

	public Boolean getRequiresCosign() {
		return requiresCosign;
	}

	public void setRequiresCosign(Boolean requiresCosign) {
		this.requiresCosign = requiresCosign;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}

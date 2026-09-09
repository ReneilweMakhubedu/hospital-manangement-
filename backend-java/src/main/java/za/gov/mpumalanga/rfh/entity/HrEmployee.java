package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "hr_employees")
public class HrEmployee {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String employeeNumber;

	@Column(nullable = false)
	private String firstName;

	@Column(nullable = false)
	private String lastName;

	@Column(nullable = false)
	private String email;

	private String phone;

	@Column(nullable = false)
	private String department;

	@Column(nullable = false)
	private String jobTitle;

	@Column(nullable = false)
	private String employmentCategory = "PERMANENT";

	@Column(nullable = false)
	private LocalDate startDate;

	private LocalDate endDate;

	@Column(nullable = false)
	private String status = "ACTIVE";

	private String hpcsaNumber;

	@Column(length = 2000)
	private String qualifications;

	private String managerName;

	private Integer yearsOfService;

	private LocalDate dateOfBirth;

	@Column(nullable = false)
	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		normalize();
	}

	@PreUpdate
	void onUpdate() {
		normalize();
	}

	private void normalize() {
		if (employmentCategory == null || employmentCategory.isBlank()) {
			employmentCategory = "PERMANENT";
		}
		if (status == null || status.isBlank()) {
			status = "ACTIVE";
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getEmployeeNumber() {
		return employeeNumber;
	}

	public void setEmployeeNumber(String employeeNumber) {
		this.employeeNumber = employeeNumber;
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

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public String getJobTitle() {
		return jobTitle;
	}

	public void setJobTitle(String jobTitle) {
		this.jobTitle = jobTitle;
	}

	public String getEmploymentCategory() {
		return employmentCategory;
	}

	public void setEmploymentCategory(String employmentCategory) {
		this.employmentCategory = employmentCategory;
	}

	public LocalDate getStartDate() {
		return startDate;
	}

	public void setStartDate(LocalDate startDate) {
		this.startDate = startDate;
	}

	public LocalDate getEndDate() {
		return endDate;
	}

	public void setEndDate(LocalDate endDate) {
		this.endDate = endDate;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getHpcsaNumber() {
		return hpcsaNumber;
	}

	public void setHpcsaNumber(String hpcsaNumber) {
		this.hpcsaNumber = hpcsaNumber;
	}

	public String getQualifications() {
		return qualifications;
	}

	public void setQualifications(String qualifications) {
		this.qualifications = qualifications;
	}

	public String getManagerName() {
		return managerName;
	}

	public void setManagerName(String managerName) {
		this.managerName = managerName;
	}

	public Integer getYearsOfService() {
		return yearsOfService;
	}

	public void setYearsOfService(Integer yearsOfService) {
		this.yearsOfService = yearsOfService;
	}

	public LocalDate getDateOfBirth() {
		return dateOfBirth;
	}

	public void setDateOfBirth(LocalDate dateOfBirth) {
		this.dateOfBirth = dateOfBirth;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}

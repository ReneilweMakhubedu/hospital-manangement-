package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "intern_assignments")
public class InternAssignment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String internName;

	@Column(nullable = false)
	private String internEmail;

	@Column(nullable = false)
	private String programme;

	@Column(nullable = false)
	private String department;

	@Column(nullable = false)
	private Long supervisorDoctorId;

	@Column(nullable = false)
	private LocalDate startDate;

	private LocalDate endDate;

	@Column(nullable = false)
	private String status = "ACTIVE";

	@PrePersist
	void onCreate() {
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

	public String getInternName() {
		return internName;
	}

	public void setInternName(String internName) {
		this.internName = internName;
	}

	public String getInternEmail() {
		return internEmail;
	}

	public void setInternEmail(String internEmail) {
		this.internEmail = internEmail;
	}

	public String getProgramme() {
		return programme;
	}

	public void setProgramme(String programme) {
		this.programme = programme;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public Long getSupervisorDoctorId() {
		return supervisorDoctorId;
	}

	public void setSupervisorDoctorId(Long supervisorDoctorId) {
		this.supervisorDoctorId = supervisorDoctorId;
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
}

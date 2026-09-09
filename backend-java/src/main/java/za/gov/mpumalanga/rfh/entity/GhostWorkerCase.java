package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payroll_ghost_cases")
public class GhostWorkerCase {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(unique = true)
	private String referenceNumber;

	private String employeeNumber;

	private String employeeName;

	private String department;

	private Integer riskScore;

	private String status;

	@Column(precision = 14, scale = 2)
	private BigDecimal amountAtRisk;

	@Column(length = 2000)
	private String notes;

	private Instant flaggedAt;

	private Instant updatedAt;

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		if (flaggedAt == null) {
			flaggedAt = now;
		}
		if (updatedAt == null) {
			updatedAt = now;
		}
		if (status == null || status.isBlank()) {
			status = "FLAGGED";
		}
		if (amountAtRisk == null) {
			amountAtRisk = BigDecimal.ZERO;
		}
		if (riskScore == null) {
			riskScore = 0;
		}
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getReferenceNumber() {
		return referenceNumber;
	}

	public void setReferenceNumber(String referenceNumber) {
		this.referenceNumber = referenceNumber;
	}

	public String getEmployeeNumber() {
		return employeeNumber;
	}

	public void setEmployeeNumber(String employeeNumber) {
		this.employeeNumber = employeeNumber;
	}

	public String getEmployeeName() {
		return employeeName;
	}

	public void setEmployeeName(String employeeName) {
		this.employeeName = employeeName;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public Integer getRiskScore() {
		return riskScore;
	}

	public void setRiskScore(Integer riskScore) {
		this.riskScore = riskScore;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public BigDecimal getAmountAtRisk() {
		return amountAtRisk;
	}

	public void setAmountAtRisk(BigDecimal amountAtRisk) {
		this.amountAtRisk = amountAtRisk;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Instant getFlaggedAt() {
		return flaggedAt;
	}

	public void setFlaggedAt(Instant flaggedAt) {
		this.flaggedAt = flaggedAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
}

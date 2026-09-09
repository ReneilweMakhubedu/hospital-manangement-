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
@Table(name = "payroll_cost_centres")
public class PayrollCostCentre {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String code;

	private String department;

	@Column(precision = 14, scale = 2)
	private BigDecimal budgetAnnual;

	@Column(precision = 14, scale = 2)
	private BigDecimal actualYtd;

	private Integer fteApproved;

	private Integer fteFilled;

	@Column(precision = 14, scale = 2)
	private BigDecimal overtimeYtd;

	private Instant updatedAt;

	@PrePersist
	@PreUpdate
	void touch() {
		updatedAt = Instant.now();
		if (budgetAnnual == null) {
			budgetAnnual = BigDecimal.ZERO;
		}
		if (actualYtd == null) {
			actualYtd = BigDecimal.ZERO;
		}
		if (overtimeYtd == null) {
			overtimeYtd = BigDecimal.ZERO;
		}
		if (fteApproved == null) {
			fteApproved = 0;
		}
		if (fteFilled == null) {
			fteFilled = 0;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public BigDecimal getBudgetAnnual() {
		return budgetAnnual;
	}

	public void setBudgetAnnual(BigDecimal budgetAnnual) {
		this.budgetAnnual = budgetAnnual;
	}

	public BigDecimal getActualYtd() {
		return actualYtd;
	}

	public void setActualYtd(BigDecimal actualYtd) {
		this.actualYtd = actualYtd;
	}

	public Integer getFteApproved() {
		return fteApproved;
	}

	public void setFteApproved(Integer fteApproved) {
		this.fteApproved = fteApproved;
	}

	public Integer getFteFilled() {
		return fteFilled;
	}

	public void setFteFilled(Integer fteFilled) {
		this.fteFilled = fteFilled;
	}

	public BigDecimal getOvertimeYtd() {
		return overtimeYtd;
	}

	public void setOvertimeYtd(BigDecimal overtimeYtd) {
		this.overtimeYtd = overtimeYtd;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
}

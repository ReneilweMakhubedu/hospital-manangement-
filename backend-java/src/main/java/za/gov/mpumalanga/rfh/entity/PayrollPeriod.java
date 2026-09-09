package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "payroll_periods")
public class PayrollPeriod {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String periodLabel;

	private LocalDate startDate;

	private LocalDate endDate;

	private String status;

	@Column(precision = 14, scale = 2)
	private BigDecimal budgetAmount;

	@Column(precision = 14, scale = 2)
	private BigDecimal actualAmount;

	@Column(precision = 14, scale = 2)
	private BigDecimal overtimeAmount;

	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (status == null || status.isBlank()) {
			status = "OPEN";
		}
		if (budgetAmount == null) {
			budgetAmount = BigDecimal.ZERO;
		}
		if (actualAmount == null) {
			actualAmount = BigDecimal.ZERO;
		}
		if (overtimeAmount == null) {
			overtimeAmount = BigDecimal.ZERO;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getPeriodLabel() {
		return periodLabel;
	}

	public void setPeriodLabel(String periodLabel) {
		this.periodLabel = periodLabel;
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

	public BigDecimal getBudgetAmount() {
		return budgetAmount;
	}

	public void setBudgetAmount(BigDecimal budgetAmount) {
		this.budgetAmount = budgetAmount;
	}

	public BigDecimal getActualAmount() {
		return actualAmount;
	}

	public void setActualAmount(BigDecimal actualAmount) {
		this.actualAmount = actualAmount;
	}

	public BigDecimal getOvertimeAmount() {
		return overtimeAmount;
	}

	public void setOvertimeAmount(BigDecimal overtimeAmount) {
		this.overtimeAmount = overtimeAmount;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}

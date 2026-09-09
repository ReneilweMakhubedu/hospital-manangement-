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
@Table(name = "finance_forecasts")
public class BudgetForecast {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String periodLabel;

	private String department;

	@Column(precision = 14, scale = 2)
	private BigDecimal budgetAmount;

	@Column(precision = 14, scale = 2)
	private BigDecimal forecastAmount;

	@Column(precision = 14, scale = 2)
	private BigDecimal actualAmount;

	private Double variancePercent;

	@Column(length = 2000)
	private String notes;

	private Instant updatedAt;

	@PrePersist
	@PreUpdate
	void touch() {
		updatedAt = Instant.now();
		if (budgetAmount == null) {
			budgetAmount = BigDecimal.ZERO;
		}
		if (forecastAmount == null) {
			forecastAmount = BigDecimal.ZERO;
		}
		if (actualAmount == null) {
			actualAmount = BigDecimal.ZERO;
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

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public BigDecimal getBudgetAmount() {
		return budgetAmount;
	}

	public void setBudgetAmount(BigDecimal budgetAmount) {
		this.budgetAmount = budgetAmount;
	}

	public BigDecimal getForecastAmount() {
		return forecastAmount;
	}

	public void setForecastAmount(BigDecimal forecastAmount) {
		this.forecastAmount = forecastAmount;
	}

	public BigDecimal getActualAmount() {
		return actualAmount;
	}

	public void setActualAmount(BigDecimal actualAmount) {
		this.actualAmount = actualAmount;
	}

	public Double getVariancePercent() {
		return variancePercent;
	}

	public void setVariancePercent(Double variancePercent) {
		this.variancePercent = variancePercent;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
}

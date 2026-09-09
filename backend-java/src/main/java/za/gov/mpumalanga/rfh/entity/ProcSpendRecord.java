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

@Entity
@Table(name = "proc_spend")
public class ProcSpendRecord {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String category;

	private String department;

	@Column(precision = 14, scale = 2)
	private BigDecimal amount;

	private String periodLabel;

	@Column(precision = 14, scale = 2)
	private BigDecimal budgetAmount;

	@Column(precision = 14, scale = 2)
	private BigDecimal savingsAmount;

	@Column(columnDefinition = "TEXT")
	private String notes;

	private Instant recordedAt;

	@PrePersist
	void onCreate() {
		if (recordedAt == null) {
			recordedAt = Instant.now();
		}
		if (amount == null) {
			amount = BigDecimal.ZERO;
		}
		if (budgetAmount == null) {
			budgetAmount = BigDecimal.ZERO;
		}
		if (savingsAmount == null) {
			savingsAmount = BigDecimal.ZERO;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public BigDecimal getAmount() {
		return amount;
	}

	public void setAmount(BigDecimal amount) {
		this.amount = amount;
	}

	public String getPeriodLabel() {
		return periodLabel;
	}

	public void setPeriodLabel(String periodLabel) {
		this.periodLabel = periodLabel;
	}

	public BigDecimal getBudgetAmount() {
		return budgetAmount;
	}

	public void setBudgetAmount(BigDecimal budgetAmount) {
		this.budgetAmount = budgetAmount;
	}

	public BigDecimal getSavingsAmount() {
		return savingsAmount;
	}

	public void setSavingsAmount(BigDecimal savingsAmount) {
		this.savingsAmount = savingsAmount;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Instant getRecordedAt() {
		return recordedAt;
	}

	public void setRecordedAt(Instant recordedAt) {
		this.recordedAt = recordedAt;
	}
}

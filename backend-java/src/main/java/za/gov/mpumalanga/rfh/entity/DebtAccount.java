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
@Table(name = "finance_debts")
public class DebtAccount {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String debtorCategory;

	private String debtorName;

	@Column(precision = 14, scale = 2)
	private BigDecimal amount;

	private String ageBucket;

	private String status;

	@Column(length = 2000)
	private String notes;

	private Instant updatedAt;

	@PrePersist
	@PreUpdate
	void touch() {
		updatedAt = Instant.now();
		if (amount == null) {
			amount = BigDecimal.ZERO;
		}
		if (status == null || status.isBlank()) {
			status = "OPEN";
		}
		if (ageBucket == null || ageBucket.isBlank()) {
			ageBucket = "CURRENT";
		}
		if (debtorCategory == null || debtorCategory.isBlank()) {
			debtorCategory = "OTHER";
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getDebtorCategory() {
		return debtorCategory;
	}

	public void setDebtorCategory(String debtorCategory) {
		this.debtorCategory = debtorCategory;
	}

	public String getDebtorName() {
		return debtorName;
	}

	public void setDebtorName(String debtorName) {
		this.debtorName = debtorName;
	}

	public BigDecimal getAmount() {
		return amount;
	}

	public void setAmount(BigDecimal amount) {
		this.amount = amount;
	}

	public String getAgeBucket() {
		return ageBucket;
	}

	public void setAgeBucket(String ageBucket) {
		this.ageBucket = ageBucket;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
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

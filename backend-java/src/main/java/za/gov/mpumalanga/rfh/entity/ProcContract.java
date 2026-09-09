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
import java.time.LocalDate;

@Entity
@Table(name = "proc_contracts")
public class ProcContract {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(unique = true)
	private String referenceNumber;

	private Long tenderId;

	private Long vendorId;

	private String vendorName;

	private String title;

	/** Mapped away from reserved H2/PostgreSQL keyword `value`. */
	@Column(name = "contract_value", precision = 14, scale = 2)
	private BigDecimal value;

	private LocalDate startDate;

	private LocalDate endDate;

	private String status;

	private Integer milestoneCount;

	private Integer milestonesCompleted;

	private String ledgerHash;

	private Instant createdAt;

	private Instant updatedAt;

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		if (createdAt == null) {
			createdAt = now;
		}
		if (updatedAt == null) {
			updatedAt = now;
		}
		if (status == null || status.isBlank()) {
			status = "DRAFT";
		}
		if (value == null) {
			value = BigDecimal.ZERO;
		}
		if (milestoneCount == null) {
			milestoneCount = 0;
		}
		if (milestonesCompleted == null) {
			milestonesCompleted = 0;
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

	public Long getTenderId() {
		return tenderId;
	}

	public void setTenderId(Long tenderId) {
		this.tenderId = tenderId;
	}

	public Long getVendorId() {
		return vendorId;
	}

	public void setVendorId(Long vendorId) {
		this.vendorId = vendorId;
	}

	public String getVendorName() {
		return vendorName;
	}

	public void setVendorName(String vendorName) {
		this.vendorName = vendorName;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public BigDecimal getValue() {
		return value;
	}

	public void setValue(BigDecimal value) {
		this.value = value;
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

	public Integer getMilestoneCount() {
		return milestoneCount;
	}

	public void setMilestoneCount(Integer milestoneCount) {
		this.milestoneCount = milestoneCount;
	}

	public Integer getMilestonesCompleted() {
		return milestonesCompleted;
	}

	public void setMilestonesCompleted(Integer milestonesCompleted) {
		this.milestonesCompleted = milestonesCompleted;
	}

	public String getLedgerHash() {
		return ledgerHash;
	}

	public void setLedgerHash(String ledgerHash) {
		this.ledgerHash = ledgerHash;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
}

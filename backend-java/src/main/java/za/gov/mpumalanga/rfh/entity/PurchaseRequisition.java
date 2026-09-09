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
@Table(name = "finance_requisitions")
public class PurchaseRequisition {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String referenceNumber;

	private String requestedBy;

	private String department;

	@Column(length = 2000)
	private String description;

	@Column(precision = 14, scale = 2)
	private BigDecimal estimatedAmount;

	private String status;

	private String vendorName;

	private Instant createdAt;

	private Instant approvedAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (estimatedAmount == null) {
			estimatedAmount = BigDecimal.ZERO;
		}
		if (status == null || status.isBlank()) {
			status = "DRAFT";
		}
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

	public String getRequestedBy() {
		return requestedBy;
	}

	public void setRequestedBy(String requestedBy) {
		this.requestedBy = requestedBy;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public BigDecimal getEstimatedAmount() {
		return estimatedAmount;
	}

	public void setEstimatedAmount(BigDecimal estimatedAmount) {
		this.estimatedAmount = estimatedAmount;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getVendorName() {
		return vendorName;
	}

	public void setVendorName(String vendorName) {
		this.vendorName = vendorName;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}

	public Instant getApprovedAt() {
		return approvedAt;
	}

	public void setApprovedAt(Instant approvedAt) {
		this.approvedAt = approvedAt;
	}
}

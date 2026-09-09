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
@Table(name = "proc_tenders")
public class ProcTender {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(unique = true)
	private String referenceNumber;

	private String title;

	@Column(columnDefinition = "TEXT")
	private String description;

	private String category;

	@Column(precision = 14, scale = 2)
	private BigDecimal estimatedValue;

	@Column(columnDefinition = "TEXT")
	private String evaluationCriteria;

	private String status;

	private Instant publishedAt;

	private Instant closingAt;

	private Long awardedVendorId;

	private Double awardScore;

	private String createdBy;

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
		if (estimatedValue == null) {
			estimatedValue = BigDecimal.ZERO;
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

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public BigDecimal getEstimatedValue() {
		return estimatedValue;
	}

	public void setEstimatedValue(BigDecimal estimatedValue) {
		this.estimatedValue = estimatedValue;
	}

	public String getEvaluationCriteria() {
		return evaluationCriteria;
	}

	public void setEvaluationCriteria(String evaluationCriteria) {
		this.evaluationCriteria = evaluationCriteria;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public Instant getPublishedAt() {
		return publishedAt;
	}

	public void setPublishedAt(Instant publishedAt) {
		this.publishedAt = publishedAt;
	}

	public Instant getClosingAt() {
		return closingAt;
	}

	public void setClosingAt(Instant closingAt) {
		this.closingAt = closingAt;
	}

	public Long getAwardedVendorId() {
		return awardedVendorId;
	}

	public void setAwardedVendorId(Long awardedVendorId) {
		this.awardedVendorId = awardedVendorId;
	}

	public Double getAwardScore() {
		return awardScore;
	}

	public void setAwardScore(Double awardScore) {
		this.awardScore = awardScore;
	}

	public String getCreatedBy() {
		return createdBy;
	}

	public void setCreatedBy(String createdBy) {
		this.createdBy = createdBy;
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

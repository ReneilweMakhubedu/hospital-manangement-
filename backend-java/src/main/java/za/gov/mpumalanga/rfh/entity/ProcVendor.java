package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "proc_vendors")
public class ProcVendor {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String name;

	private String registrationNumber;

	private String csdNumber;

	private String category;

	private String contactEmail;

	private String contactPhone;

	private String status;

	private String riskRating;

	private Integer performanceScore;

	private Integer deliveryScore;

	private Integer qualityScore;

	private Integer costScore;

	private Integer complianceScore;

	@Column(columnDefinition = "TEXT")
	private String notes;

	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (status == null || status.isBlank()) {
			status = "REGISTERED";
		}
		if (riskRating == null || riskRating.isBlank()) {
			riskRating = "MEDIUM";
		}
		if (performanceScore == null) {
			performanceScore = 50;
		}
		if (deliveryScore == null) {
			deliveryScore = 50;
		}
		if (qualityScore == null) {
			qualityScore = 50;
		}
		if (costScore == null) {
			costScore = 50;
		}
		if (complianceScore == null) {
			complianceScore = 50;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getRegistrationNumber() {
		return registrationNumber;
	}

	public void setRegistrationNumber(String registrationNumber) {
		this.registrationNumber = registrationNumber;
	}

	public String getCsdNumber() {
		return csdNumber;
	}

	public void setCsdNumber(String csdNumber) {
		this.csdNumber = csdNumber;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public String getContactEmail() {
		return contactEmail;
	}

	public void setContactEmail(String contactEmail) {
		this.contactEmail = contactEmail;
	}

	public String getContactPhone() {
		return contactPhone;
	}

	public void setContactPhone(String contactPhone) {
		this.contactPhone = contactPhone;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getRiskRating() {
		return riskRating;
	}

	public void setRiskRating(String riskRating) {
		this.riskRating = riskRating;
	}

	public Integer getPerformanceScore() {
		return performanceScore;
	}

	public void setPerformanceScore(Integer performanceScore) {
		this.performanceScore = performanceScore;
	}

	public Integer getDeliveryScore() {
		return deliveryScore;
	}

	public void setDeliveryScore(Integer deliveryScore) {
		this.deliveryScore = deliveryScore;
	}

	public Integer getQualityScore() {
		return qualityScore;
	}

	public void setQualityScore(Integer qualityScore) {
		this.qualityScore = qualityScore;
	}

	public Integer getCostScore() {
		return costScore;
	}

	public void setCostScore(Integer costScore) {
		this.costScore = costScore;
	}

	public Integer getComplianceScore() {
		return complianceScore;
	}

	public void setComplianceScore(Integer complianceScore) {
		this.complianceScore = complianceScore;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}

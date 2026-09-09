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
@Table(name = "pharmacy_clinical_interventions")
public class PharmacyClinicalIntervention {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** DOSE_ADJUST | IV_TO_PO | AMS_DEESCALATION | FORMULARY | GOOD_CATCH | OTHER */
	private String interventionType;

	@Column(columnDefinition = "TEXT")
	private String description;

	private String pharmacistEmail;

	private Instant createdAt;

	@Column(precision = 14, scale = 2)
	private BigDecimal costAvoidanceAmount;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (interventionType == null || interventionType.isBlank()) {
			interventionType = "OTHER";
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getInterventionType() {
		return interventionType;
	}

	public void setInterventionType(String interventionType) {
		this.interventionType = interventionType;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getPharmacistEmail() {
		return pharmacistEmail;
	}

	public void setPharmacistEmail(String pharmacistEmail) {
		this.pharmacistEmail = pharmacistEmail;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}

	public BigDecimal getCostAvoidanceAmount() {
		return costAvoidanceAmount;
	}

	public void setCostAvoidanceAmount(BigDecimal costAvoidanceAmount) {
		this.costAvoidanceAmount = costAvoidanceAmount;
	}
}

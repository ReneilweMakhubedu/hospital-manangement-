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
@Table(name = "patient_medications")
public class PatientMedication {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long patientId;

	@Column(nullable = false)
	private String medicationName;

	private String dosage;
	private String frequency;
	private Integer refillsRemaining;

	@Column(nullable = false)
	private String status = "ACTIVE";

	@Column(nullable = false)
	private Boolean ccmdd = false;

	private String pickupPoint;
	private String nextCollectionDate;
	private String lastCollectedDate;

	@Column(length = 2000)
	private String notes;

	@Column(nullable = false)
	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (status == null || status.isBlank()) {
			status = "ACTIVE";
		}
		if (ccmdd == null) {
			ccmdd = false;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getPatientId() {
		return patientId;
	}

	public void setPatientId(Long patientId) {
		this.patientId = patientId;
	}

	public String getMedicationName() {
		return medicationName;
	}

	public void setMedicationName(String medicationName) {
		this.medicationName = medicationName;
	}

	public String getDosage() {
		return dosage;
	}

	public void setDosage(String dosage) {
		this.dosage = dosage;
	}

	public String getFrequency() {
		return frequency;
	}

	public void setFrequency(String frequency) {
		this.frequency = frequency;
	}

	public Integer getRefillsRemaining() {
		return refillsRemaining;
	}

	public void setRefillsRemaining(Integer refillsRemaining) {
		this.refillsRemaining = refillsRemaining;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public Boolean getCcmdd() {
		return ccmdd;
	}

	public void setCcmdd(Boolean ccmdd) {
		this.ccmdd = ccmdd;
	}

	public String getPickupPoint() {
		return pickupPoint;
	}

	public void setPickupPoint(String pickupPoint) {
		this.pickupPoint = pickupPoint;
	}

	public String getNextCollectionDate() {
		return nextCollectionDate;
	}

	public void setNextCollectionDate(String nextCollectionDate) {
		this.nextCollectionDate = nextCollectionDate;
	}

	public String getLastCollectedDate() {
		return lastCollectedDate;
	}

	public void setLastCollectedDate(String lastCollectedDate) {
		this.lastCollectedDate = lastCollectedDate;
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

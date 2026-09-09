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
@Table(name = "referral_letters")
public class ReferralLetter {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long patientId;

	@Column(nullable = false)
	private Long doctorId;

	@Column(nullable = false)
	private String toFacility;

	private String toSpecialty;

	@Column(nullable = false)
	private String urgency = "ROUTINE";

	@Column(nullable = false, length = 2000)
	private String reason;

	@Column(length = 4000)
	private String clinicalSummary;

	@Column(nullable = false)
	private String status = "DRAFT";

	private String referenceNumber;

	@Column(nullable = false)
	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (urgency == null || urgency.isBlank()) {
			urgency = "ROUTINE";
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

	public Long getPatientId() {
		return patientId;
	}

	public void setPatientId(Long patientId) {
		this.patientId = patientId;
	}

	public Long getDoctorId() {
		return doctorId;
	}

	public void setDoctorId(Long doctorId) {
		this.doctorId = doctorId;
	}

	public String getToFacility() {
		return toFacility;
	}

	public void setToFacility(String toFacility) {
		this.toFacility = toFacility;
	}

	public String getToSpecialty() {
		return toSpecialty;
	}

	public void setToSpecialty(String toSpecialty) {
		this.toSpecialty = toSpecialty;
	}

	public String getUrgency() {
		return urgency;
	}

	public void setUrgency(String urgency) {
		this.urgency = urgency;
	}

	public String getReason() {
		return reason;
	}

	public void setReason(String reason) {
		this.reason = reason;
	}

	public String getClinicalSummary() {
		return clinicalSummary;
	}

	public void setClinicalSummary(String clinicalSummary) {
		this.clinicalSummary = clinicalSummary;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getReferenceNumber() {
		return referenceNumber;
	}

	public void setReferenceNumber(String referenceNumber) {
		this.referenceNumber = referenceNumber;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}

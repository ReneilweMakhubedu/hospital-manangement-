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
@Table(name = "prescriptions")
public class Prescription {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long patientId;

	@Column(nullable = false)
	private Long doctorId;

	@Column(nullable = false)
	private String medication;

	@Column(nullable = false)
	private String dosage;

	@Column(nullable = false)
	private String frequency;

	@Column(nullable = false)
	private Instant createdAt;

	private String signedByEmail;

	private Instant signedAt;

	@Column(length = 2000)
	private String signReason;

	private String verificationStatus;

	private String verifiedByEmail;

	private Instant verifiedAt;

	@Column(length = 2000)
	private String verificationNote;

	@Column(length = 2000)
	private String safetyFlags;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (verificationStatus == null || verificationStatus.isBlank()) {
			verificationStatus = "PENDING";
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

	public String getMedication() {
		return medication;
	}

	public void setMedication(String medication) {
		this.medication = medication;
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

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}

	public String getSignedByEmail() { return signedByEmail; }
	public void setSignedByEmail(String signedByEmail) { this.signedByEmail = signedByEmail; }
	public Instant getSignedAt() { return signedAt; }
	public void setSignedAt(Instant signedAt) { this.signedAt = signedAt; }
	public String getSignReason() { return signReason; }
	public void setSignReason(String signReason) { this.signReason = signReason; }
	public String getVerificationStatus() { return verificationStatus; }
	public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
	public String getVerifiedByEmail() { return verifiedByEmail; }
	public void setVerifiedByEmail(String verifiedByEmail) { this.verifiedByEmail = verifiedByEmail; }
	public Instant getVerifiedAt() { return verifiedAt; }
	public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }
	public String getVerificationNote() { return verificationNote; }
	public void setVerificationNote(String verificationNote) { this.verificationNote = verificationNote; }
	public String getSafetyFlags() { return safetyFlags; }
	public void setSafetyFlags(String safetyFlags) { this.safetyFlags = safetyFlags; }
}

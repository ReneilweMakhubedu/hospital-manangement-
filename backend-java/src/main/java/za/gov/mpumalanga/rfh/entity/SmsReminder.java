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
@Table(name = "sms_reminders")
public class SmsReminder {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long appointmentId;

	@Column(nullable = false)
	private Long patientId;

	@Column(nullable = false)
	private String phoneNumber;

	@Column(nullable = false, length = 1000)
	private String message;

	@Column(nullable = false)
	private Instant scheduledFor;

	private Instant sentAt;

	@Column(nullable = false)
	private String status = "PENDING";

	@Column(nullable = false)
	private Boolean consentRecorded = false;

	@Column(nullable = false)
	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (status == null || status.isBlank()) {
			status = "PENDING";
		}
		if (consentRecorded == null) {
			consentRecorded = false;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getAppointmentId() {
		return appointmentId;
	}

	public void setAppointmentId(Long appointmentId) {
		this.appointmentId = appointmentId;
	}

	public Long getPatientId() {
		return patientId;
	}

	public void setPatientId(Long patientId) {
		this.patientId = patientId;
	}

	public String getPhoneNumber() {
		return phoneNumber;
	}

	public void setPhoneNumber(String phoneNumber) {
		this.phoneNumber = phoneNumber;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public Instant getScheduledFor() {
		return scheduledFor;
	}

	public void setScheduledFor(Instant scheduledFor) {
		this.scheduledFor = scheduledFor;
	}

	public Instant getSentAt() {
		return sentAt;
	}

	public void setSentAt(Instant sentAt) {
		this.sentAt = sentAt;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public Boolean getConsentRecorded() {
		return consentRecorded;
	}

	public void setConsentRecorded(Boolean consentRecorded) {
		this.consentRecorded = consentRecorded;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}

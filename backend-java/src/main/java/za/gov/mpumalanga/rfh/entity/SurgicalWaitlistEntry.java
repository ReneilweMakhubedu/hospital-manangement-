package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "surgical_waitlist")
public class SurgicalWaitlistEntry {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long patientId;

	@Column(nullable = false)
	private String procedureName;

	@Column(nullable = false)
	private String specialty;

	@Column(nullable = false)
	private String urgency;

	@Column(nullable = false)
	private LocalDate decisionToTreatDate;

	@Column(nullable = false)
	private Integer ttgDays;

	@Column(nullable = false)
	private String status = "WAITING";

	private String scheduledDate;

	@Column(length = 2000)
	private String notes;

	@Column(nullable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private Instant updatedAt;

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		if (createdAt == null) {
			createdAt = now;
		}
		updatedAt = now;
		if (status == null || status.isBlank()) {
			status = "WAITING";
		}
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}

	public LocalDate dueDate() {
		if (decisionToTreatDate == null || ttgDays == null) {
			return null;
		}
		return decisionToTreatDate.plusDays(ttgDays);
	}

	public boolean isOverdue() {
		LocalDate due = dueDate();
		return due != null
				&& "WAITING".equalsIgnoreCase(status)
				&& LocalDate.now().isAfter(due);
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

	public String getProcedureName() {
		return procedureName;
	}

	public void setProcedureName(String procedureName) {
		this.procedureName = procedureName;
	}

	public String getSpecialty() {
		return specialty;
	}

	public void setSpecialty(String specialty) {
		this.specialty = specialty;
	}

	public String getUrgency() {
		return urgency;
	}

	public void setUrgency(String urgency) {
		this.urgency = urgency;
	}

	public LocalDate getDecisionToTreatDate() {
		return decisionToTreatDate;
	}

	public void setDecisionToTreatDate(LocalDate decisionToTreatDate) {
		this.decisionToTreatDate = decisionToTreatDate;
	}

	public Integer getTtgDays() {
		return ttgDays;
	}

	public void setTtgDays(Integer ttgDays) {
		this.ttgDays = ttgDays;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getScheduledDate() {
		return scheduledDate;
	}

	public void setScheduledDate(String scheduledDate) {
		this.scheduledDate = scheduledDate;
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

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
}

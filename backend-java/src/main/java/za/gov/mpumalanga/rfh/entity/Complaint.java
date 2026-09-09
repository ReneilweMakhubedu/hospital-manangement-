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

@Entity
@Table(name = "complaints")
public class Complaint {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String referenceNumber;

	private Long patientId;

	@Column(nullable = false)
	private String complainantName;

	@Column(nullable = false)
	private String channel;

	@Column(nullable = false)
	private String subject;

	@Column(nullable = false, length = 4000)
	private String description;

	@Column(nullable = false)
	private String status = "OPEN";

	@Column(nullable = false)
	private Instant loggedAt;

	private Instant acknowledgedAt;
	private Instant resolvedAt;
	private Instant closedAt;

	private String assignedTo;

	@Column(length = 4000)
	private String resolutionNotes;

	@Column(nullable = false)
	private Instant slaAckDueAt;

	@Column(nullable = false)
	private Instant slaResolveDueAt;

	@Column(nullable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private Instant updatedAt;

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		if (loggedAt == null) {
			loggedAt = now;
		}
		if (createdAt == null) {
			createdAt = now;
		}
		updatedAt = now;
		if (status == null || status.isBlank()) {
			status = "OPEN";
		}
		if (slaAckDueAt == null) {
			slaAckDueAt = loggedAt.plusSeconds(5L * 24 * 60 * 60);
		}
		if (slaResolveDueAt == null) {
			slaResolveDueAt = loggedAt.plusSeconds(25L * 24 * 60 * 60);
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

	public Long getPatientId() {
		return patientId;
	}

	public void setPatientId(Long patientId) {
		this.patientId = patientId;
	}

	public String getComplainantName() {
		return complainantName;
	}

	public void setComplainantName(String complainantName) {
		this.complainantName = complainantName;
	}

	public String getChannel() {
		return channel;
	}

	public void setChannel(String channel) {
		this.channel = channel;
	}

	public String getSubject() {
		return subject;
	}

	public void setSubject(String subject) {
		this.subject = subject;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public Instant getLoggedAt() {
		return loggedAt;
	}

	public void setLoggedAt(Instant loggedAt) {
		this.loggedAt = loggedAt;
	}

	public Instant getAcknowledgedAt() {
		return acknowledgedAt;
	}

	public void setAcknowledgedAt(Instant acknowledgedAt) {
		this.acknowledgedAt = acknowledgedAt;
	}

	public Instant getResolvedAt() {
		return resolvedAt;
	}

	public void setResolvedAt(Instant resolvedAt) {
		this.resolvedAt = resolvedAt;
	}

	public Instant getClosedAt() {
		return closedAt;
	}

	public void setClosedAt(Instant closedAt) {
		this.closedAt = closedAt;
	}

	public String getAssignedTo() {
		return assignedTo;
	}

	public void setAssignedTo(String assignedTo) {
		this.assignedTo = assignedTo;
	}

	public String getResolutionNotes() {
		return resolutionNotes;
	}

	public void setResolutionNotes(String resolutionNotes) {
		this.resolutionNotes = resolutionNotes;
	}

	public Instant getSlaAckDueAt() {
		return slaAckDueAt;
	}

	public void setSlaAckDueAt(Instant slaAckDueAt) {
		this.slaAckDueAt = slaAckDueAt;
	}

	public Instant getSlaResolveDueAt() {
		return slaResolveDueAt;
	}

	public void setSlaResolveDueAt(Instant slaResolveDueAt) {
		this.slaResolveDueAt = slaResolveDueAt;
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

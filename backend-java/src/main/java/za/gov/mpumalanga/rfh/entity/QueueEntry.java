package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "queue", uniqueConstraints = {
		@UniqueConstraint(name = "unique_queue_number_per_day", columnNames = {"queueDate", "queueNumber"})
})
public class QueueEntry {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long patientId;

	@Column(nullable = false)
	private Integer queueNumber;

	@Column(nullable = false)
	private LocalDate queueDate;

	private String reason;

	@Column(nullable = false)
	private String status = "waiting";

	@Column(nullable = false)
	private Instant createdAt;

	private Instant calledAt;
	private Instant completedAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (status == null) {
			status = "waiting";
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

	public Integer getQueueNumber() {
		return queueNumber;
	}

	public void setQueueNumber(Integer queueNumber) {
		this.queueNumber = queueNumber;
	}

	public LocalDate getQueueDate() {
		return queueDate;
	}

	public void setQueueDate(LocalDate queueDate) {
		this.queueDate = queueDate;
	}

	public String getReason() {
		return reason;
	}

	public void setReason(String reason) {
		this.reason = reason;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}

	public Instant getCalledAt() {
		return calledAt;
	}

	public void setCalledAt(Instant calledAt) {
		this.calledAt = calledAt;
	}

	public Instant getCompletedAt() {
		return completedAt;
	}

	public void setCompletedAt(Instant completedAt) {
		this.completedAt = completedAt;
	}
}

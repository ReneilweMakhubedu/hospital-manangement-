package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "supervision_logs")
public class SupervisionLog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long assignmentId;

	@Column(nullable = false)
	private LocalDate sessionDate;

	@Column(nullable = false)
	private String topic;

	@Column(nullable = false)
	private Double hours = 0.0;

	@Column(length = 4000)
	private String supervisorNotes;

	@Column(nullable = false)
	private Boolean internAcknowledged = false;

	@PrePersist
	void onCreate() {
		if (hours == null) {
			hours = 0.0;
		}
		if (internAcknowledged == null) {
			internAcknowledged = false;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getAssignmentId() {
		return assignmentId;
	}

	public void setAssignmentId(Long assignmentId) {
		this.assignmentId = assignmentId;
	}

	public LocalDate getSessionDate() {
		return sessionDate;
	}

	public void setSessionDate(LocalDate sessionDate) {
		this.sessionDate = sessionDate;
	}

	public String getTopic() {
		return topic;
	}

	public void setTopic(String topic) {
		this.topic = topic;
	}

	public Double getHours() {
		return hours;
	}

	public void setHours(Double hours) {
		this.hours = hours;
	}

	public String getSupervisorNotes() {
		return supervisorNotes;
	}

	public void setSupervisorNotes(String supervisorNotes) {
		this.supervisorNotes = supervisorNotes;
	}

	public Boolean getInternAcknowledged() {
		return internAcknowledged;
	}

	public void setInternAcknowledged(Boolean internAcknowledged) {
		this.internAcknowledged = internAcknowledged;
	}
}

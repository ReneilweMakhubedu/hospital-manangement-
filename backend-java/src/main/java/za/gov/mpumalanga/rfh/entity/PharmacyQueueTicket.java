package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "pharmacy_queue_tickets")
public class PharmacyQueueTicket {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String ticketNumber;

	private String patientName;

	/** WAITING | IN_PROGRESS | DISPENSED | CANCELLED */
	private String status;

	/** ROUTINE | STAT */
	private String priority;

	private Instant arrivedAt;

	private Instant startedAt;

	private Instant completedAt;

	private String technicianName;

	@PrePersist
	void onCreate() {
		if (arrivedAt == null) {
			arrivedAt = Instant.now();
		}
		if (status == null || status.isBlank()) {
			status = "WAITING";
		}
		if (priority == null || priority.isBlank()) {
			priority = "ROUTINE";
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getTicketNumber() {
		return ticketNumber;
	}

	public void setTicketNumber(String ticketNumber) {
		this.ticketNumber = ticketNumber;
	}

	public String getPatientName() {
		return patientName;
	}

	public void setPatientName(String patientName) {
		this.patientName = patientName;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getPriority() {
		return priority;
	}

	public void setPriority(String priority) {
		this.priority = priority;
	}

	public Instant getArrivedAt() {
		return arrivedAt;
	}

	public void setArrivedAt(Instant arrivedAt) {
		this.arrivedAt = arrivedAt;
	}

	public Instant getStartedAt() {
		return startedAt;
	}

	public void setStartedAt(Instant startedAt) {
		this.startedAt = startedAt;
	}

	public Instant getCompletedAt() {
		return completedAt;
	}

	public void setCompletedAt(Instant completedAt) {
		this.completedAt = completedAt;
	}

	public String getTechnicianName() {
		return technicianName;
	}

	public void setTechnicianName(String technicianName) {
		this.technicianName = technicianName;
	}
}

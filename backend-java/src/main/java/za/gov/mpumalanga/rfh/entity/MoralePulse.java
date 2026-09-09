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
@Table(name = "hr_morale_pulses")
public class MoralePulse {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String periodLabel;

	@Column(nullable = false)
	private Double score;

	@Column(nullable = false)
	private Integer responseCount = 0;

	private String department;

	@Column(length = 2000)
	private String notes;

	@Column(nullable = false)
	private Instant capturedAt;

	@PrePersist
	void onCreate() {
		if (capturedAt == null) {
			capturedAt = Instant.now();
		}
		if (responseCount == null) {
			responseCount = 0;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getPeriodLabel() {
		return periodLabel;
	}

	public void setPeriodLabel(String periodLabel) {
		this.periodLabel = periodLabel;
	}

	public Double getScore() {
		return score;
	}

	public void setScore(Double score) {
		this.score = score;
	}

	public Integer getResponseCount() {
		return responseCount;
	}

	public void setResponseCount(Integer responseCount) {
		this.responseCount = responseCount;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Instant getCapturedAt() {
		return capturedAt;
	}

	public void setCapturedAt(Instant capturedAt) {
		this.capturedAt = capturedAt;
	}
}

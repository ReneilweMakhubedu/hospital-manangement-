package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "hr_training_courses")
public class TrainingCourse {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false)
	private String category = "MANDATORY";

	private String provider;

	private LocalDate scheduledDate;

	private Integer cpdPoints;

	private Integer capacity;

	@Column(nullable = false)
	private String status = "PLANNED";

	@PrePersist
	@PreUpdate
	void normalize() {
		if (category == null || category.isBlank()) {
			category = "MANDATORY";
		}
		if (status == null || status.isBlank()) {
			status = "PLANNED";
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public String getProvider() {
		return provider;
	}

	public void setProvider(String provider) {
		this.provider = provider;
	}

	public LocalDate getScheduledDate() {
		return scheduledDate;
	}

	public void setScheduledDate(LocalDate scheduledDate) {
		this.scheduledDate = scheduledDate;
	}

	public Integer getCpdPoints() {
		return cpdPoints;
	}

	public void setCpdPoints(Integer cpdPoints) {
		this.cpdPoints = cpdPoints;
	}

	public Integer getCapacity() {
		return capacity;
	}

	public void setCapacity(Integer capacity) {
		this.capacity = capacity;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}
}

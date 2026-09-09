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
@Table(name = "vacancies")
public class Vacancy {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false)
	private String department;

	private String specialty;

	private String gradeOrRank;

	@Column(nullable = false)
	private Integer postsApproved = 0;

	@Column(nullable = false)
	private Integer postsFilled = 0;

	@Column(nullable = false)
	private Boolean critical = false;

	@Column(nullable = false)
	private String status = "OPEN";

	@Column(length = 2000)
	private String notes;

	/** When the post was advertised (nullable for ddl-auto update). */
	private Instant advertisedAt;

	/** When the post was filled (nullable for ddl-auto update). */
	private Instant filledAt;

	@Column(nullable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private Instant updatedAt;

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		createdAt = now;
		updatedAt = now;
		normalizeDefaults();
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
		normalizeDefaults();
	}

	private void normalizeDefaults() {
		if (postsApproved == null) {
			postsApproved = 0;
		}
		if (postsFilled == null) {
			postsFilled = 0;
		}
		if (critical == null) {
			critical = false;
		}
		if (status == null || status.isBlank()) {
			status = "OPEN";
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

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public String getSpecialty() {
		return specialty;
	}

	public void setSpecialty(String specialty) {
		this.specialty = specialty;
	}

	public String getGradeOrRank() {
		return gradeOrRank;
	}

	public void setGradeOrRank(String gradeOrRank) {
		this.gradeOrRank = gradeOrRank;
	}

	public Integer getPostsApproved() {
		return postsApproved;
	}

	public void setPostsApproved(Integer postsApproved) {
		this.postsApproved = postsApproved;
	}

	public Integer getPostsFilled() {
		return postsFilled;
	}

	public void setPostsFilled(Integer postsFilled) {
		this.postsFilled = postsFilled;
	}

	public Boolean getCritical() {
		return critical;
	}

	public void setCritical(Boolean critical) {
		this.critical = critical;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Instant getAdvertisedAt() {
		return advertisedAt;
	}

	public void setAdvertisedAt(Instant advertisedAt) {
		this.advertisedAt = advertisedAt;
	}

	public Instant getFilledAt() {
		return filledAt;
	}

	public void setFilledAt(Instant filledAt) {
		this.filledAt = filledAt;
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

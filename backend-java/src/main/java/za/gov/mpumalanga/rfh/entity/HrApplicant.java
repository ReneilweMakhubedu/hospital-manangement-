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
@Table(name = "hr_applicants")
public class HrApplicant {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long vacancyId;

	@Column(nullable = false)
	private String firstName;

	@Column(nullable = false)
	private String lastName;

	@Column(nullable = false)
	private String email;

	private String phone;

	@Column(nullable = false)
	private String appliedPost;

	private String specialty;

	@Column(nullable = false)
	private String status = "APPLIED";

	private String source;

	@Column(length = 2000)
	private String notes;

	@Column(nullable = false)
	private Instant appliedAt;

	@PrePersist
	void onCreate() {
		if (appliedAt == null) {
			appliedAt = Instant.now();
		}
		normalize();
	}

	@PreUpdate
	void onUpdate() {
		normalize();
	}

	private void normalize() {
		if (status == null || status.isBlank()) {
			status = "APPLIED";
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getVacancyId() {
		return vacancyId;
	}

	public void setVacancyId(Long vacancyId) {
		this.vacancyId = vacancyId;
	}

	public String getFirstName() {
		return firstName;
	}

	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}

	public String getLastName() {
		return lastName;
	}

	public void setLastName(String lastName) {
		this.lastName = lastName;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getAppliedPost() {
		return appliedPost;
	}

	public void setAppliedPost(String appliedPost) {
		this.appliedPost = appliedPost;
	}

	public String getSpecialty() {
		return specialty;
	}

	public void setSpecialty(String specialty) {
		this.specialty = specialty;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getSource() {
		return source;
	}

	public void setSource(String source) {
		this.source = source;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Instant getAppliedAt() {
		return appliedAt;
	}

	public void setAppliedAt(Instant appliedAt) {
		this.appliedAt = appliedAt;
	}
}

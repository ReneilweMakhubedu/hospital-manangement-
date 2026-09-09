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
@Table(name = "hr_onboarding")
public class OnboardingChecklist {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long employeeId;

	@Column(nullable = false)
	private String employeeName;

	@Column(nullable = false)
	private String department;

	@Column(nullable = false)
	private String status = "IN_PROGRESS";

	@Column(nullable = false)
	private Boolean documentsCollected = false;

	@Column(nullable = false)
	private Boolean orientationScheduled = false;

	@Column(nullable = false)
	private Boolean accountCreated = false;

	@Column(nullable = false)
	private Boolean hpcsaVerified = false;

	@Column(nullable = false)
	private Instant startedAt;

	private Instant completedAt;

	@PrePersist
	void onCreate() {
		if (startedAt == null) {
			startedAt = Instant.now();
		}
		normalize();
	}

	@PreUpdate
	void onUpdate() {
		normalize();
	}

	private void normalize() {
		if (status == null || status.isBlank()) {
			status = "IN_PROGRESS";
		}
		if (documentsCollected == null) {
			documentsCollected = false;
		}
		if (orientationScheduled == null) {
			orientationScheduled = false;
		}
		if (accountCreated == null) {
			accountCreated = false;
		}
		if (hpcsaVerified == null) {
			hpcsaVerified = false;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getEmployeeId() {
		return employeeId;
	}

	public void setEmployeeId(Long employeeId) {
		this.employeeId = employeeId;
	}

	public String getEmployeeName() {
		return employeeName;
	}

	public void setEmployeeName(String employeeName) {
		this.employeeName = employeeName;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public Boolean getDocumentsCollected() {
		return documentsCollected;
	}

	public void setDocumentsCollected(Boolean documentsCollected) {
		this.documentsCollected = documentsCollected;
	}

	public Boolean getOrientationScheduled() {
		return orientationScheduled;
	}

	public void setOrientationScheduled(Boolean orientationScheduled) {
		this.orientationScheduled = orientationScheduled;
	}

	public Boolean getAccountCreated() {
		return accountCreated;
	}

	public void setAccountCreated(Boolean accountCreated) {
		this.accountCreated = accountCreated;
	}

	public Boolean getHpcsaVerified() {
		return hpcsaVerified;
	}

	public void setHpcsaVerified(Boolean hpcsaVerified) {
		this.hpcsaVerified = hpcsaVerified;
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
}

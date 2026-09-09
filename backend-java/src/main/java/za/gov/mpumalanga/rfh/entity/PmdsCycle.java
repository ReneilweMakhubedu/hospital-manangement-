package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "pmds_cycles")
public class PmdsCycle {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String staffName;

	@Column(nullable = false)
	private String staffRole;

	@Column(nullable = false)
	private Integer cycleYear;

	@Column(nullable = false)
	private Boolean agreementSigned = false;

	@Column(nullable = false)
	private Boolean midYearReview = false;

	@Column(nullable = false)
	private Boolean annualReview = false;

	@Column(nullable = false)
	private String status = "NOT_STARTED";

	@Column(length = 2000)
	private String notes;

	@PrePersist
	@PreUpdate
	void normalize() {
		if (agreementSigned == null) {
			agreementSigned = false;
		}
		if (midYearReview == null) {
			midYearReview = false;
		}
		if (annualReview == null) {
			annualReview = false;
		}
		if (status == null || status.isBlank()) {
			status = "NOT_STARTED";
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getStaffName() {
		return staffName;
	}

	public void setStaffName(String staffName) {
		this.staffName = staffName;
	}

	public String getStaffRole() {
		return staffRole;
	}

	public void setStaffRole(String staffRole) {
		this.staffRole = staffRole;
	}

	public Integer getCycleYear() {
		return cycleYear;
	}

	public void setCycleYear(Integer cycleYear) {
		this.cycleYear = cycleYear;
	}

	public Boolean getAgreementSigned() {
		return agreementSigned;
	}

	public void setAgreementSigned(Boolean agreementSigned) {
		this.agreementSigned = agreementSigned;
	}

	public Boolean getMidYearReview() {
		return midYearReview;
	}

	public void setMidYearReview(Boolean midYearReview) {
		this.midYearReview = midYearReview;
	}

	public Boolean getAnnualReview() {
		return annualReview;
	}

	public void setAnnualReview(Boolean annualReview) {
		this.annualReview = annualReview;
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
}

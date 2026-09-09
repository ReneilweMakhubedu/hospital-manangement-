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
@Table(name = "clinical_orders")
public class ClinicalOrder {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long patientId;

	@Column(nullable = false)
	private Long doctorId;

	@Column(nullable = false)
	private String orderType;

	@Column(nullable = false)
	private String testName;

	@Column(nullable = false)
	private String priority = "ROUTINE";

	@Column(length = 2000)
	private String clinicalIndication;

	@Column(nullable = false)
	private String status = "ORDERED";

	private String providerHint;

	private String referenceNumber;

	@Column(length = 4000)
	private String resultSummary;

	@Column(nullable = false)
	private Instant orderedAt;

	@Column(nullable = false)
	private Instant updatedAt;

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		if (orderedAt == null) {
			orderedAt = now;
		}
		if (updatedAt == null) {
			updatedAt = now;
		}
		if (priority == null || priority.isBlank()) {
			priority = "ROUTINE";
		}
		if (status == null || status.isBlank()) {
			status = "ORDERED";
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

	public Long getPatientId() {
		return patientId;
	}

	public void setPatientId(Long patientId) {
		this.patientId = patientId;
	}

	public Long getDoctorId() {
		return doctorId;
	}

	public void setDoctorId(Long doctorId) {
		this.doctorId = doctorId;
	}

	public String getOrderType() {
		return orderType;
	}

	public void setOrderType(String orderType) {
		this.orderType = orderType;
	}

	public String getTestName() {
		return testName;
	}

	public void setTestName(String testName) {
		this.testName = testName;
	}

	public String getPriority() {
		return priority;
	}

	public void setPriority(String priority) {
		this.priority = priority;
	}

	public String getClinicalIndication() {
		return clinicalIndication;
	}

	public void setClinicalIndication(String clinicalIndication) {
		this.clinicalIndication = clinicalIndication;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getProviderHint() {
		return providerHint;
	}

	public void setProviderHint(String providerHint) {
		this.providerHint = providerHint;
	}

	public String getReferenceNumber() {
		return referenceNumber;
	}

	public void setReferenceNumber(String referenceNumber) {
		this.referenceNumber = referenceNumber;
	}

	public String getResultSummary() {
		return resultSummary;
	}

	public void setResultSummary(String resultSummary) {
		this.resultSummary = resultSummary;
	}

	public Instant getOrderedAt() {
		return orderedAt;
	}

	public void setOrderedAt(Instant orderedAt) {
		this.orderedAt = orderedAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
}

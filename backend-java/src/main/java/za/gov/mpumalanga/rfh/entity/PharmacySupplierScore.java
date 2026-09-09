package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "pharmacy_supplier_scores")
public class PharmacySupplierScore {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String supplierName;

	private Double onTimePercent;

	private Double orderAccuracyPercent;

	private Integer paymentCycleDays;

	/** LOW | MEDIUM | HIGH */
	private String riskRating;

	@Column(columnDefinition = "TEXT")
	private String notes;

	@PrePersist
	void onCreate() {
		if (riskRating == null || riskRating.isBlank()) {
			riskRating = "MEDIUM";
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getSupplierName() {
		return supplierName;
	}

	public void setSupplierName(String supplierName) {
		this.supplierName = supplierName;
	}

	public Double getOnTimePercent() {
		return onTimePercent;
	}

	public void setOnTimePercent(Double onTimePercent) {
		this.onTimePercent = onTimePercent;
	}

	public Double getOrderAccuracyPercent() {
		return orderAccuracyPercent;
	}

	public void setOrderAccuracyPercent(Double orderAccuracyPercent) {
		this.orderAccuracyPercent = orderAccuracyPercent;
	}

	public Integer getPaymentCycleDays() {
		return paymentCycleDays;
	}

	public void setPaymentCycleDays(Integer paymentCycleDays) {
		this.paymentCycleDays = paymentCycleDays;
	}

	public String getRiskRating() {
		return riskRating;
	}

	public void setRiskRating(String riskRating) {
		this.riskRating = riskRating;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}
}

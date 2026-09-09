package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "proc_bids")
public class ProcBid {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long tenderId;

	private Long vendorId;

	private String vendorName;

	@Column(precision = 14, scale = 2)
	private BigDecimal bidAmount;

	@Column(columnDefinition = "TEXT")
	private String proposalSummary;

	private String status;

	private Instant submittedAt;

	private String sealedHash;

	private Instant openedAt;

	private Double technicalScore;

	private Double priceScore;

	private Double totalScore;

	@PrePersist
	void onCreate() {
		if (submittedAt == null) {
			submittedAt = Instant.now();
		}
		if (status == null || status.isBlank()) {
			status = "SUBMITTED";
		}
		if (bidAmount == null) {
			bidAmount = BigDecimal.ZERO;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getTenderId() {
		return tenderId;
	}

	public void setTenderId(Long tenderId) {
		this.tenderId = tenderId;
	}

	public Long getVendorId() {
		return vendorId;
	}

	public void setVendorId(Long vendorId) {
		this.vendorId = vendorId;
	}

	public String getVendorName() {
		return vendorName;
	}

	public void setVendorName(String vendorName) {
		this.vendorName = vendorName;
	}

	public BigDecimal getBidAmount() {
		return bidAmount;
	}

	public void setBidAmount(BigDecimal bidAmount) {
		this.bidAmount = bidAmount;
	}

	public String getProposalSummary() {
		return proposalSummary;
	}

	public void setProposalSummary(String proposalSummary) {
		this.proposalSummary = proposalSummary;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public Instant getSubmittedAt() {
		return submittedAt;
	}

	public void setSubmittedAt(Instant submittedAt) {
		this.submittedAt = submittedAt;
	}

	public String getSealedHash() {
		return sealedHash;
	}

	public void setSealedHash(String sealedHash) {
		this.sealedHash = sealedHash;
	}

	public Instant getOpenedAt() {
		return openedAt;
	}

	public void setOpenedAt(Instant openedAt) {
		this.openedAt = openedAt;
	}

	public Double getTechnicalScore() {
		return technicalScore;
	}

	public void setTechnicalScore(Double technicalScore) {
		this.technicalScore = technicalScore;
	}

	public Double getPriceScore() {
		return priceScore;
	}

	public void setPriceScore(Double priceScore) {
		this.priceScore = priceScore;
	}

	public Double getTotalScore() {
		return totalScore;
	}

	public void setTotalScore(Double totalScore) {
		this.totalScore = totalScore;
	}
}

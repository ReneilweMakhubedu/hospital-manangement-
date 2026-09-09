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
import java.time.LocalDate;

@Entity
@Table(name = "finance_assets")
public class FixedAsset {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String assetTag;

	private String name;

	private String category;

	private LocalDate acquisitionDate;

	@Column(precision = 14, scale = 2)
	private BigDecimal acquisitionCost;

	@Column(precision = 14, scale = 2)
	private BigDecimal bookValue;

	private String status;

	private String department;

	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (acquisitionCost == null) {
			acquisitionCost = BigDecimal.ZERO;
		}
		if (bookValue == null) {
			bookValue = acquisitionCost;
		}
		if (status == null || status.isBlank()) {
			status = "ACTIVE";
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getAssetTag() {
		return assetTag;
	}

	public void setAssetTag(String assetTag) {
		this.assetTag = assetTag;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public LocalDate getAcquisitionDate() {
		return acquisitionDate;
	}

	public void setAcquisitionDate(LocalDate acquisitionDate) {
		this.acquisitionDate = acquisitionDate;
	}

	public BigDecimal getAcquisitionCost() {
		return acquisitionCost;
	}

	public void setAcquisitionCost(BigDecimal acquisitionCost) {
		this.acquisitionCost = acquisitionCost;
	}

	public BigDecimal getBookValue() {
		return bookValue;
	}

	public void setBookValue(BigDecimal bookValue) {
		this.bookValue = bookValue;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}

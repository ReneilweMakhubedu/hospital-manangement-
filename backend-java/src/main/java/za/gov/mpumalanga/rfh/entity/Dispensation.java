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
@Table(name = "dispensations")
public class Dispensation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long prescriptionId;

	@Column(nullable = false)
	private Long medicineId;

	@Column(nullable = false)
	private Integer quantity;

	@Column(nullable = false)
	private Long dispensedBy;

	@Column(nullable = false)
	private Instant dispensedAt;

	@PrePersist
	void onCreate() {
		if (dispensedAt == null) {
			dispensedAt = Instant.now();
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getPrescriptionId() {
		return prescriptionId;
	}

	public void setPrescriptionId(Long prescriptionId) {
		this.prescriptionId = prescriptionId;
	}

	public Long getMedicineId() {
		return medicineId;
	}

	public void setMedicineId(Long medicineId) {
		this.medicineId = medicineId;
	}

	public Integer getQuantity() {
		return quantity;
	}

	public void setQuantity(Integer quantity) {
		this.quantity = quantity;
	}

	public Long getDispensedBy() {
		return dispensedBy;
	}

	public void setDispensedBy(Long dispensedBy) {
		this.dispensedBy = dispensedBy;
	}

	public Instant getDispensedAt() {
		return dispensedAt;
	}

	public void setDispensedAt(Instant dispensedAt) {
		this.dispensedAt = dispensedAt;
	}
}

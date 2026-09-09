package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "cost_centres")
public class CostCentre {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String code;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private String department;

	@Column(nullable = false, precision = 14, scale = 2)
	private BigDecimal budgetAnnual = BigDecimal.ZERO;

	@Column(nullable = false)
	private Boolean active = true;

	@PrePersist
	@PreUpdate
	void normalize() {
		if (budgetAnnual == null) {
			budgetAnnual = BigDecimal.ZERO;
		}
		if (active == null) {
			active = true;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public BigDecimal getBudgetAnnual() {
		return budgetAnnual;
	}

	public void setBudgetAnnual(BigDecimal budgetAnnual) {
		this.budgetAnnual = budgetAnnual;
	}

	public Boolean getActive() {
		return active;
	}

	public void setActive(Boolean active) {
		this.active = active;
	}
}

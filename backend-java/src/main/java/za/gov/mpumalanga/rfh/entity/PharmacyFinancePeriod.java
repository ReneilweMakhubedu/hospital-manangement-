package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "pharmacy_finance_periods")
public class PharmacyFinancePeriod {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String periodLabel;

	@Column(precision = 14, scale = 2)
	private BigDecimal budgetAmount;

	@Column(precision = 14, scale = 2)
	private BigDecimal actualSpend;

	private Integer genericDispenseCount;

	private Integer brandDispenseCount;

	private Integer invoicePendingCount;

	private Integer avgPaymentCycleDays;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getPeriodLabel() {
		return periodLabel;
	}

	public void setPeriodLabel(String periodLabel) {
		this.periodLabel = periodLabel;
	}

	public BigDecimal getBudgetAmount() {
		return budgetAmount;
	}

	public void setBudgetAmount(BigDecimal budgetAmount) {
		this.budgetAmount = budgetAmount;
	}

	public BigDecimal getActualSpend() {
		return actualSpend;
	}

	public void setActualSpend(BigDecimal actualSpend) {
		this.actualSpend = actualSpend;
	}

	public Integer getGenericDispenseCount() {
		return genericDispenseCount;
	}

	public void setGenericDispenseCount(Integer genericDispenseCount) {
		this.genericDispenseCount = genericDispenseCount;
	}

	public Integer getBrandDispenseCount() {
		return brandDispenseCount;
	}

	public void setBrandDispenseCount(Integer brandDispenseCount) {
		this.brandDispenseCount = brandDispenseCount;
	}

	public Integer getInvoicePendingCount() {
		return invoicePendingCount;
	}

	public void setInvoicePendingCount(Integer invoicePendingCount) {
		this.invoicePendingCount = invoicePendingCount;
	}

	public Integer getAvgPaymentCycleDays() {
		return avgPaymentCycleDays;
	}

	public void setAvgPaymentCycleDays(Integer avgPaymentCycleDays) {
		this.avgPaymentCycleDays = avgPaymentCycleDays;
	}
}

package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "allied_referrals")
public class AlliedReferral extends SupportEntity {
	public String patientName;
	public String discipline;
	public String reason;
	public String status;
	public String referredBy;
	public Instant createdAt;
	public String notes;
}

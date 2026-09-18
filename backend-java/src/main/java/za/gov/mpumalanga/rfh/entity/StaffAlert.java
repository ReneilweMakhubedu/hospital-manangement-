package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "staff_alerts")
public class StaffAlert extends SupportEntity {
	public String audienceRole;
	public String severity;
	public String title;
	@Column(length = 2000)
	public String detail;
	public String source;
	public String fingerprint;
	public boolean acknowledged;
	public Instant createdAt;
	public Instant acknowledgedAt;
}

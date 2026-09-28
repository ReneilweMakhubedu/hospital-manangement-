package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "ops_items")
public class OpsItem extends SupportEntity {
	public String desk;
	public String patientName;
	public String location;
	public String detail;
	public String status;
	public Instant createdAt;
	public String ownerEmail;
}

package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "facility_work_orders")
public class FacilityWorkOrder extends SupportEntity {
	public String referenceNumber;
	public String category;
	public String title;
	public String location;
	public String priority;
	public String status;
	public String assetTag;
	public Instant createdAt;
	public Instant completedAt;
}

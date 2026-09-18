package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "imaging_orders")
public class ImagingOrder extends SupportEntity {
	public String accessionNumber;
	public String patientName;
	public String modality;
	public String studyName;
	public String priority;
	public String status;
	public Instant orderedAt;
	public Instant reportedAt;
	public String reportSummary;
}

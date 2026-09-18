package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "lab_orders")
public class LabOrder extends SupportEntity {
	public String accessionNumber;
	public String patientName;
	public String testName;
	public String priority;
	public String status;
	public Instant orderedAt;
	public Instant resultedAt;
	public String resultSummary;
	public String orderedBy;
}

package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "ed_visits")
public class EdVisit extends SupportEntity {
	public String ticketNumber;
	public String patientName;
	public String triageCategory;
	public String chiefComplaint;
	public String status;
	public Instant arrivedAt;
	public Instant triageAt;
	public String disposition;
}

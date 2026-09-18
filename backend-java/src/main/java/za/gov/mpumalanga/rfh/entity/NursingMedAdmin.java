package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "nursing_med_admins")
public class NursingMedAdmin extends SupportEntity {
	public String patientName;
	public String medication;
	public String dose;
	public String route;
	public String status;
	public Instant givenAt;
	public String nurseEmail;
}

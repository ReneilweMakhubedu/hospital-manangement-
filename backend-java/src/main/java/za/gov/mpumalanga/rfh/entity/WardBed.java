package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "ward_beds")
public class WardBed extends SupportEntity {
	public String wardName;
	public String bedNumber;
	public String status;
	public String patientName;
	public Long patientId;
	public String acuity;
	public Instant admittedAt;
}

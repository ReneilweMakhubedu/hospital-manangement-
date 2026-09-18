package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "nursing_vitals")
public class NursingVital extends SupportEntity {
	public Long bedId;
	public String patientName;
	public Integer bpSystolic;
	public Integer bpDiastolic;
	public Integer pulse;
	public Double tempC;
	public Integer spo2;
	public String recordedByEmail;
	public Instant recordedAt;
}

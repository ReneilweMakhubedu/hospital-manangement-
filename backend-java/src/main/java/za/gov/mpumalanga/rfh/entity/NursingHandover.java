package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "nursing_handovers")
public class NursingHandover extends SupportEntity {
	public String wardName;
	public String shift;
	public String summary;
	public String createdByEmail;
	public Instant createdAt;
}

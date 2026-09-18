package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "biomed_assets")
public class BiomedAsset extends SupportEntity {
	public String assetTag;
	public String name;
	public String location;
	public String status;
	public LocalDate nextPmDate;
}

package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;

@MappedSuperclass
public abstract class SupportEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	public Long id;
}

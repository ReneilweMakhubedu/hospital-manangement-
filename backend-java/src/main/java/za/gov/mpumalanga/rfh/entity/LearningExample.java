package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "learning_examples")
public class LearningExample extends SupportEntity {
	public String model;
	public String refKey;
	public double f0;
	public double f1;
	public double f2;
	public double f3;
	public Double label;
	public String note;
	public Instant createdAt;
}

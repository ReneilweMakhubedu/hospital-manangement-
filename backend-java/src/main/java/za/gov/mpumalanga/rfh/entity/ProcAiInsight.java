package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "proc_ai_insights")
public class ProcAiInsight {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String insightType;

	private String title;

	@Column(columnDefinition = "TEXT")
	private String body;

	private Double confidence;

	private String relatedEntityType;

	private Long relatedEntityId;

	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (confidence == null) {
			confidence = 0.7;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getInsightType() {
		return insightType;
	}

	public void setInsightType(String insightType) {
		this.insightType = insightType;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getBody() {
		return body;
	}

	public void setBody(String body) {
		this.body = body;
	}

	public Double getConfidence() {
		return confidence;
	}

	public void setConfidence(Double confidence) {
		this.confidence = confidence;
	}

	public String getRelatedEntityType() {
		return relatedEntityType;
	}

	public void setRelatedEntityType(String relatedEntityType) {
		this.relatedEntityType = relatedEntityType;
	}

	public Long getRelatedEntityId() {
		return relatedEntityId;
	}

	public void setRelatedEntityId(Long relatedEntityId) {
		this.relatedEntityId = relatedEntityId;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}

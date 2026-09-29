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
@Table(name = "approval_requests")
public class ApprovalRequest {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String actionType;

	@Column(nullable = false)
	private String summary;

	@Column(nullable = false, length = 2000)
	private String reason;

	@Column(nullable = false)
	private String status = "PENDING";

	private String requestedByEmail;

	private String requestedByRole;

	private Instant requestedAt;

	private String decidedByEmail;

	private String decidedByRole;

	private Instant decidedAt;

	@Column(length = 2000)
	private String decisionNote;

	@Column(length = 4000)
	private String payloadJson;

	@PrePersist
	void onCreate() {
		if (requestedAt == null) {
			requestedAt = Instant.now();
		}
		if (status == null || status.isBlank()) {
			status = "PENDING";
		}
	}

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public String getActionType() { return actionType; }
	public void setActionType(String actionType) { this.actionType = actionType; }
	public String getSummary() { return summary; }
	public void setSummary(String summary) { this.summary = summary; }
	public String getReason() { return reason; }
	public void setReason(String reason) { this.reason = reason; }
	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
	public String getRequestedByEmail() { return requestedByEmail; }
	public void setRequestedByEmail(String requestedByEmail) { this.requestedByEmail = requestedByEmail; }
	public String getRequestedByRole() { return requestedByRole; }
	public void setRequestedByRole(String requestedByRole) { this.requestedByRole = requestedByRole; }
	public Instant getRequestedAt() { return requestedAt; }
	public void setRequestedAt(Instant requestedAt) { this.requestedAt = requestedAt; }
	public String getDecidedByEmail() { return decidedByEmail; }
	public void setDecidedByEmail(String decidedByEmail) { this.decidedByEmail = decidedByEmail; }
	public String getDecidedByRole() { return decidedByRole; }
	public void setDecidedByRole(String decidedByRole) { this.decidedByRole = decidedByRole; }
	public Instant getDecidedAt() { return decidedAt; }
	public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }
	public String getDecisionNote() { return decisionNote; }
	public void setDecisionNote(String decisionNote) { this.decisionNote = decisionNote; }
	public String getPayloadJson() { return payloadJson; }
	public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }
}

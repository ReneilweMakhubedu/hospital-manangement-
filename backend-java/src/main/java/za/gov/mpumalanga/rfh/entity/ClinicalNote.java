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
@Table(name = "clinical_notes")
public class ClinicalNote {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long patientId;

	@Column(nullable = false)
	private Long doctorId;

	@Column(nullable = false)
	private String visitDate;

	@Column(length = 2000)
	private String chiefComplaint;

	@Column(length = 2000)
	private String diagnosis;

	@Column(length = 2000)
	private String treatmentPlan;

	@Column(length = 4000)
	private String notes;

	private String noteTemplate;

	@Column(length = 4000)
	private String soapSubjective;

	@Column(length = 4000)
	private String soapObjective;

	@Column(length = 4000)
	private String soapAssessment;

	@Column(length = 4000)
	private String soapPlan;

	@Column(nullable = false)
	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getPatientId() {
		return patientId;
	}

	public void setPatientId(Long patientId) {
		this.patientId = patientId;
	}

	public Long getDoctorId() {
		return doctorId;
	}

	public void setDoctorId(Long doctorId) {
		this.doctorId = doctorId;
	}

	public String getVisitDate() {
		return visitDate;
	}

	public void setVisitDate(String visitDate) {
		this.visitDate = visitDate;
	}

	public String getChiefComplaint() {
		return chiefComplaint;
	}

	public void setChiefComplaint(String chiefComplaint) {
		this.chiefComplaint = chiefComplaint;
	}

	public String getDiagnosis() {
		return diagnosis;
	}

	public void setDiagnosis(String diagnosis) {
		this.diagnosis = diagnosis;
	}

	public String getTreatmentPlan() {
		return treatmentPlan;
	}

	public void setTreatmentPlan(String treatmentPlan) {
		this.treatmentPlan = treatmentPlan;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public String getNoteTemplate() {
		return noteTemplate;
	}

	public void setNoteTemplate(String noteTemplate) {
		this.noteTemplate = noteTemplate;
	}

	public String getSoapSubjective() {
		return soapSubjective;
	}

	public void setSoapSubjective(String soapSubjective) {
		this.soapSubjective = soapSubjective;
	}

	public String getSoapObjective() {
		return soapObjective;
	}

	public void setSoapObjective(String soapObjective) {
		this.soapObjective = soapObjective;
	}

	public String getSoapAssessment() {
		return soapAssessment;
	}

	public void setSoapAssessment(String soapAssessment) {
		this.soapAssessment = soapAssessment;
	}

	public String getSoapPlan() {
		return soapPlan;
	}

	public void setSoapPlan(String soapPlan) {
		this.soapPlan = soapPlan;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}

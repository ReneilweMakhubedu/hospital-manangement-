package za.gov.mpumalanga.rfh.config;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import za.gov.mpumalanga.rfh.entity.Admin;
import za.gov.mpumalanga.rfh.entity.Appointment;
import za.gov.mpumalanga.rfh.entity.AuditEvent;
import za.gov.mpumalanga.rfh.entity.BudgetForecast;
import za.gov.mpumalanga.rfh.entity.ClinicalNote;
import za.gov.mpumalanga.rfh.entity.ClinicalOrder;
import za.gov.mpumalanga.rfh.entity.Complaint;
import za.gov.mpumalanga.rfh.entity.CostCentre;
import za.gov.mpumalanga.rfh.entity.DebtAccount;
import za.gov.mpumalanga.rfh.entity.Doctor;
import za.gov.mpumalanga.rfh.entity.FinanceTransaction;
import za.gov.mpumalanga.rfh.entity.FixedAsset;
import za.gov.mpumalanga.rfh.entity.GhostWorkerCase;
import za.gov.mpumalanga.rfh.entity.HrApplicant;
import za.gov.mpumalanga.rfh.entity.HrEmployee;
import za.gov.mpumalanga.rfh.entity.InternAssignment;
import za.gov.mpumalanga.rfh.entity.IrregularExpenditure;
import za.gov.mpumalanga.rfh.entity.LabResult;
import za.gov.mpumalanga.rfh.entity.LeaveRequest;
import za.gov.mpumalanga.rfh.entity.MedicationDoseLog;
import za.gov.mpumalanga.rfh.entity.Medicine;
import za.gov.mpumalanga.rfh.entity.MoralePulse;
import za.gov.mpumalanga.rfh.entity.OnboardingChecklist;
import za.gov.mpumalanga.rfh.entity.PatientFeedback;
import za.gov.mpumalanga.rfh.entity.PatientInvoice;
import za.gov.mpumalanga.rfh.entity.PatientMedication;
import za.gov.mpumalanga.rfh.entity.PatientNotification;
import za.gov.mpumalanga.rfh.entity.PayrollAuditEvent;
import za.gov.mpumalanga.rfh.entity.PayrollCostCentre;
import za.gov.mpumalanga.rfh.entity.PayrollPeriod;
import za.gov.mpumalanga.rfh.entity.PmdsCycle;
import za.gov.mpumalanga.rfh.entity.ProcAiInsight;
import za.gov.mpumalanga.rfh.entity.ProcBid;
import za.gov.mpumalanga.rfh.entity.ProcContract;
import za.gov.mpumalanga.rfh.entity.ProcLedgerEvent;
import za.gov.mpumalanga.rfh.entity.ProcRiskAlert;
import za.gov.mpumalanga.rfh.entity.ProcSpendRecord;
import za.gov.mpumalanga.rfh.entity.ProcTender;
import za.gov.mpumalanga.rfh.entity.ProcVendor;
import za.gov.mpumalanga.rfh.entity.Prescription;
import za.gov.mpumalanga.rfh.entity.PurchaseRequisition;
import za.gov.mpumalanga.rfh.entity.QueueEntry;
import za.gov.mpumalanga.rfh.entity.ReferralLetter;
import za.gov.mpumalanga.rfh.entity.SmsReminder;
import za.gov.mpumalanga.rfh.entity.StaffCertification;
import za.gov.mpumalanga.rfh.entity.SupervisionLog;
import za.gov.mpumalanga.rfh.entity.SurgicalWaitlistEntry;
import za.gov.mpumalanga.rfh.entity.Theatre;
import za.gov.mpumalanga.rfh.entity.TheatreSession;
import za.gov.mpumalanga.rfh.entity.TimesheetEntry;
import za.gov.mpumalanga.rfh.entity.TrainingCourse;
import za.gov.mpumalanga.rfh.entity.TrainingEnrolment;
import za.gov.mpumalanga.rfh.entity.User;
import za.gov.mpumalanga.rfh.entity.Vacancy;
import za.gov.mpumalanga.rfh.entity.Vendor;

@Component
public class ResponseMapper {

	private final ObjectMapper objectMapper;

	public ResponseMapper(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	public Map<String, Object> patient(User user) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", user.getId());
		map.put("firstName", user.getFirstName());
		map.put("lastName", user.getLastName());
		map.put("email", user.getEmail());
		map.put("idNumber", user.getIdNumber());
		map.put("phoneNumber", user.getPhoneNumber());
		map.put("address", user.getAddress());
		map.put("dob", user.getDob());
		map.put("gender", user.getGender());
		map.put("emergencyContact", user.getEmergencyContact());
		map.put("allergies", user.getAllergies());
		map.put("existingConditions", user.getExistingConditions());
		map.put("currentMedications", user.getCurrentMedications());
		map.put("previousMedicalInfo", user.getPreviousMedicalInfo());
		map.put("nextOfKin", user.getNextOfKin());
		map.put("bloodType", user.getBloodType());
		map.put("languagePreference", user.getLanguagePreference() == null ? "English" : user.getLanguagePreference());
		map.put("accessibilityNeeds", user.getAccessibilityNeeds());
		map.put("primaryFacility", user.getPrimaryFacility() == null ? "Rob Ferreira Hospital" : user.getPrimaryFacility());
		map.put("nextOfKinPhone", user.getNextOfKinPhone());
		map.put("nextOfKinRelation", user.getNextOfKinRelation());
		map.put("ccmddEnrolled", Boolean.TRUE.equals(user.getCcmddEnrolled()));
		map.put("ccmddPickupPoint", user.getCcmddPickupPoint());
		map.put("nextCollectionDate", user.getNextCollectionDate());
		map.put("whatsappConsent", Boolean.TRUE.equals(user.getWhatsappConsent()));
		map.put("marketingConsent", Boolean.TRUE.equals(user.getMarketingConsent()));
		map.put("dataSharingConsent", Boolean.TRUE.equals(user.getDataSharingConsent()));
		map.put("popiaConsent", Boolean.TRUE.equals(user.getPopiaConsent()));
		map.put("preferredChannel", user.getPreferredChannel() == null ? "SMS" : user.getPreferredChannel());
		map.put("documents", parseDocuments(user.getDocuments()));
		map.put("onboardingComplete", user.getOnboardingComplete());
		map.put("smsConsent", Boolean.TRUE.equals(user.getSmsConsent()));
		map.put("createdAt", user.getCreatedAt());
		return map;
	}

	public Map<String, Object> doctor(Doctor doctor) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", doctor.getId());
		map.put("id", doctor.getId());
		map.put("firstName", doctor.getFirstName());
		map.put("lastName", doctor.getLastName());
		map.put("email", doctor.getEmail());
		map.put("specialty", doctor.getSpecialty());
		map.put("designation", doctor.getDesignation());
		map.put("subSpecialty", doctor.getSubSpecialty());
		map.put("clinicianCategory", doctor.getClinicianCategory());
		map.put("specialistGrade", doctor.getSpecialistGrade());
		map.put("systemRoleCode", doctor.getSystemRoleCode());
		map.put("hpcsaRegistrationCategory", doctor.getHpcsaRegistrationCategory());
		map.put("licenseNumber", doctor.getLicenseNumber());
		map.put("phoneNumber", doctor.getPhoneNumber());
		map.put("department", doctor.getDepartment());
		map.put("qualifications", doctor.getQualifications());
		map.put("yearsExperience", doctor.getYearsExperience());
		map.put("workingHours", doctor.getWorkingHours() == null ? "08:00-16:00" : doctor.getWorkingHours());
		map.put("availableToday", doctor.getAvailableToday() == null || Boolean.TRUE.equals(doctor.getAvailableToday()));
		map.put("consultationNotesTemplate",
				doctor.getConsultationNotesTemplate() == null ? "SOAP" : doctor.getConsultationNotesTemplate());
		map.put("requiresCosign", Boolean.TRUE.equals(doctor.getRequiresCosign()));
		map.put("role", doctor.getRole());
		return map;
	}

	public Map<String, Object> doctorPublic(Doctor doctor) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", doctor.getId());
		map.put("firstName", doctor.getFirstName());
		map.put("lastName", doctor.getLastName());
		map.put("specialty", doctor.getSpecialty());
		map.put("designation", doctor.getDesignation());
		map.put("subSpecialty", doctor.getSubSpecialty());
		map.put("clinicianCategory", doctor.getClinicianCategory());
		map.put("specialistGrade", doctor.getSpecialistGrade());
		map.put("department", doctor.getDepartment());
		return map;
	}

	public Map<String, Object> admin(Admin admin) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", admin.getId());
		map.put("firstName", admin.getFirstName());
		map.put("lastName", admin.getLastName());
		map.put("email", admin.getEmail());
		map.put("role", admin.getRole());
		return map;
	}

	public Map<String, Object> appointment(Appointment appointment) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", appointment.getId());
		map.put("id", appointment.getId());
		map.put("patientId", appointment.getPatientId());
		map.put("doctorId", appointment.getDoctorId());
		map.put("date", appointment.getDate());
		map.put("time", appointment.getTime());
		map.put("reason", appointment.getReason());
		map.put("purpose", appointment.getPurpose());
		map.put("department", appointment.getDepartment());
		map.put("urgency", appointment.getUrgency() == null ? "GREEN" : appointment.getUrgency());
		map.put("referenceNumber", appointment.getReferenceNumber());
		map.put("visitPrep", appointment.getVisitPrep());
		map.put("status", appointment.getStatus());
		map.put("createdAt", appointment.getCreatedAt());
		return map;
	}

	public Map<String, Object> patientMedication(PatientMedication med) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", med.getId());
		map.put("id", med.getId());
		map.put("patientId", med.getPatientId());
		map.put("medicationName", med.getMedicationName());
		map.put("dosage", med.getDosage());
		map.put("frequency", med.getFrequency());
		map.put("refillsRemaining", med.getRefillsRemaining());
		map.put("status", med.getStatus());
		map.put("ccmdd", Boolean.TRUE.equals(med.getCcmdd()));
		map.put("pickupPoint", med.getPickupPoint());
		map.put("nextCollectionDate", med.getNextCollectionDate());
		map.put("lastCollectedDate", med.getLastCollectedDate());
		map.put("notes", med.getNotes());
		map.put("createdAt", med.getCreatedAt());
		return map;
	}

	public Map<String, Object> medicationDoseLog(MedicationDoseLog log) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", log.getId());
		map.put("id", log.getId());
		map.put("medicationId", log.getMedicationId());
		map.put("patientId", log.getPatientId());
		map.put("scheduledTime", log.getScheduledTime());
		map.put("takenAt", log.getTakenAt());
		map.put("status", log.getStatus());
		return map;
	}

	public Map<String, Object> patientNotification(PatientNotification notification) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", notification.getId());
		map.put("id", notification.getId());
		map.put("patientId", notification.getPatientId());
		map.put("title", notification.getTitle());
		map.put("body", notification.getBody());
		map.put("channel", notification.getChannel());
		map.put("type", notification.getType());
		map.put("readFlag", Boolean.TRUE.equals(notification.getReadFlag()));
		map.put("createdAt", notification.getCreatedAt());
		return map;
	}

	public Map<String, Object> patientFeedback(PatientFeedback feedback) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", feedback.getId());
		map.put("id", feedback.getId());
		map.put("patientId", feedback.getPatientId());
		map.put("type", feedback.getType());
		map.put("rating", feedback.getRating());
		map.put("category", feedback.getCategory());
		map.put("subject", feedback.getSubject());
		map.put("message", feedback.getMessage());
		map.put("status", feedback.getStatus());
		map.put("referenceNumber", feedback.getReferenceNumber());
		map.put("createdAt", feedback.getCreatedAt());
		map.put("updatedAt", feedback.getUpdatedAt());
		return map;
	}

	public Map<String, Object> labResult(LabResult result) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", result.getId());
		map.put("id", result.getId());
		map.put("patientId", result.getPatientId());
		map.put("testName", result.getTestName());
		map.put("resultValue", result.getResultValue());
		map.put("unit", result.getUnit());
		map.put("referenceRange", result.getReferenceRange());
		map.put("status", result.getStatus());
		map.put("resultDate", result.getResultDate());
		map.put("createdAt", result.getCreatedAt());
		return map;
	}

	public Map<String, Object> prescription(Prescription prescription) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", prescription.getId());
		map.put("id", prescription.getId());
		map.put("patientId", prescription.getPatientId());
		map.put("doctorId", prescription.getDoctorId());
		map.put("medication", prescription.getMedication());
		map.put("dosage", prescription.getDosage());
		map.put("frequency", prescription.getFrequency());
		map.put("createdAt", prescription.getCreatedAt());
		return map;
	}

	public Map<String, Object> medicine(Medicine medicine) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", medicine.getId());
		map.put("name", medicine.getName());
		map.put("strength", medicine.getStrength());
		map.put("form", medicine.getForm());
		map.put("quantity", medicine.getQuantity());
		map.put("reorderLevel", medicine.getReorderLevel());
		map.put("expiryDate", medicine.getExpiryDate());
		map.put("criticalEssential", medicine.getCriticalEssential());
		map.put("unitCost", medicine.getUnitCost());
		map.put("supplierName", medicine.getSupplierName());
		map.put("stockoutSince", medicine.getStockoutSince());
		map.put("updatedAt", medicine.getUpdatedAt());
		return map;
	}

	public Map<String, Object> vacancy(Vacancy vacancy) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", vacancy.getId());
		map.put("id", vacancy.getId());
		map.put("title", vacancy.getTitle());
		map.put("department", vacancy.getDepartment());
		map.put("specialty", vacancy.getSpecialty());
		map.put("gradeOrRank", vacancy.getGradeOrRank());
		map.put("postsApproved", vacancy.getPostsApproved());
		map.put("postsFilled", vacancy.getPostsFilled());
		map.put("critical", vacancy.getCritical());
		map.put("status", vacancy.getStatus());
		map.put("notes", vacancy.getNotes());
		map.put("advertisedAt", vacancy.getAdvertisedAt());
		map.put("filledAt", vacancy.getFilledAt());
		map.put("createdAt", vacancy.getCreatedAt());
		map.put("updatedAt", vacancy.getUpdatedAt());
		int approved = vacancy.getPostsApproved() == null ? 0 : vacancy.getPostsApproved();
		int filled = vacancy.getPostsFilled() == null ? 0 : vacancy.getPostsFilled();
		map.put("gap", Math.max(0, approved - filled));
		return map;
	}

	public Map<String, Object> hrEmployee(HrEmployee employee) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", employee.getId());
		map.put("id", employee.getId());
		map.put("employeeNumber", employee.getEmployeeNumber());
		map.put("firstName", employee.getFirstName());
		map.put("lastName", employee.getLastName());
		map.put("email", employee.getEmail());
		map.put("phone", employee.getPhone());
		map.put("department", employee.getDepartment());
		map.put("jobTitle", employee.getJobTitle());
		map.put("employmentCategory", employee.getEmploymentCategory());
		map.put("startDate", employee.getStartDate() == null ? null : employee.getStartDate().toString());
		map.put("endDate", employee.getEndDate() == null ? null : employee.getEndDate().toString());
		map.put("status", employee.getStatus());
		map.put("hpcsaNumber", employee.getHpcsaNumber());
		map.put("qualifications", employee.getQualifications());
		map.put("managerName", employee.getManagerName());
		map.put("yearsOfService", employee.getYearsOfService());
		map.put("dateOfBirth", employee.getDateOfBirth() == null ? null : employee.getDateOfBirth().toString());
		map.put("createdAt", employee.getCreatedAt());
		return map;
	}

	public Map<String, Object> leaveRequest(LeaveRequest leave) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", leave.getId());
		map.put("id", leave.getId());
		map.put("employeeId", leave.getEmployeeId());
		map.put("leaveType", leave.getLeaveType());
		map.put("startDate", leave.getStartDate() == null ? null : leave.getStartDate().toString());
		map.put("endDate", leave.getEndDate() == null ? null : leave.getEndDate().toString());
		map.put("days", leave.getDays());
		map.put("reason", leave.getReason());
		map.put("status", leave.getStatus());
		map.put("approverName", leave.getApproverName());
		map.put("createdAt", leave.getCreatedAt());
		return map;
	}

	public Map<String, Object> hrApplicant(HrApplicant applicant) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", applicant.getId());
		map.put("id", applicant.getId());
		map.put("vacancyId", applicant.getVacancyId());
		map.put("firstName", applicant.getFirstName());
		map.put("lastName", applicant.getLastName());
		map.put("email", applicant.getEmail());
		map.put("phone", applicant.getPhone());
		map.put("appliedPost", applicant.getAppliedPost());
		map.put("specialty", applicant.getSpecialty());
		map.put("status", applicant.getStatus());
		map.put("source", applicant.getSource());
		map.put("notes", applicant.getNotes());
		map.put("appliedAt", applicant.getAppliedAt());
		return map;
	}

	public Map<String, Object> onboardingChecklist(OnboardingChecklist checklist) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", checklist.getId());
		map.put("id", checklist.getId());
		map.put("employeeId", checklist.getEmployeeId());
		map.put("employeeName", checklist.getEmployeeName());
		map.put("department", checklist.getDepartment());
		map.put("status", checklist.getStatus());
		map.put("documentsCollected", Boolean.TRUE.equals(checklist.getDocumentsCollected()));
		map.put("orientationScheduled", Boolean.TRUE.equals(checklist.getOrientationScheduled()));
		map.put("accountCreated", Boolean.TRUE.equals(checklist.getAccountCreated()));
		map.put("hpcsaVerified", Boolean.TRUE.equals(checklist.getHpcsaVerified()));
		map.put("startedAt", checklist.getStartedAt());
		map.put("completedAt", checklist.getCompletedAt());
		return map;
	}

	public Map<String, Object> trainingCourse(TrainingCourse course) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", course.getId());
		map.put("id", course.getId());
		map.put("title", course.getTitle());
		map.put("category", course.getCategory());
		map.put("provider", course.getProvider());
		map.put("scheduledDate", course.getScheduledDate() == null ? null : course.getScheduledDate().toString());
		map.put("cpdPoints", course.getCpdPoints());
		map.put("capacity", course.getCapacity());
		map.put("status", course.getStatus());
		return map;
	}

	public Map<String, Object> trainingEnrolment(TrainingEnrolment enrolment) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", enrolment.getId());
		map.put("id", enrolment.getId());
		map.put("courseId", enrolment.getCourseId());
		map.put("employeeId", enrolment.getEmployeeId());
		map.put("employeeName", enrolment.getEmployeeName());
		map.put("attendance", enrolment.getAttendance());
		map.put("evaluationScore", enrolment.getEvaluationScore());
		map.put("createdAt", enrolment.getCreatedAt());
		return map;
	}

	public Map<String, Object> moralePulse(MoralePulse pulse) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", pulse.getId());
		map.put("id", pulse.getId());
		map.put("periodLabel", pulse.getPeriodLabel());
		map.put("score", pulse.getScore());
		map.put("responseCount", pulse.getResponseCount());
		map.put("department", pulse.getDepartment());
		map.put("notes", pulse.getNotes());
		map.put("capturedAt", pulse.getCapturedAt());
		return map;
	}

	public Map<String, Object> clinicalNote(ClinicalNote note) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", note.getId());
		map.put("id", note.getId());
		map.put("patientId", note.getPatientId());
		map.put("doctorId", note.getDoctorId());
		map.put("visitDate", note.getVisitDate());
		map.put("chiefComplaint", note.getChiefComplaint());
		map.put("diagnosis", note.getDiagnosis());
		map.put("treatmentPlan", note.getTreatmentPlan());
		map.put("notes", note.getNotes());
		map.put("noteTemplate", note.getNoteTemplate() == null ? "SOAP" : note.getNoteTemplate());
		map.put("soapSubjective", note.getSoapSubjective());
		map.put("soapObjective", note.getSoapObjective());
		map.put("soapAssessment", note.getSoapAssessment());
		map.put("soapPlan", note.getSoapPlan());
		map.put("createdAt", note.getCreatedAt());
		return map;
	}

	public Map<String, Object> clinicalOrder(ClinicalOrder order) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", order.getId());
		map.put("id", order.getId());
		map.put("patientId", order.getPatientId());
		map.put("doctorId", order.getDoctorId());
		map.put("orderType", order.getOrderType());
		map.put("testName", order.getTestName());
		map.put("priority", order.getPriority());
		map.put("clinicalIndication", order.getClinicalIndication());
		map.put("status", order.getStatus());
		map.put("providerHint", order.getProviderHint());
		map.put("referenceNumber", order.getReferenceNumber());
		map.put("resultSummary", order.getResultSummary());
		map.put("orderedAt", order.getOrderedAt());
		map.put("updatedAt", order.getUpdatedAt());
		return map;
	}

	public Map<String, Object> referralLetter(ReferralLetter referral) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", referral.getId());
		map.put("id", referral.getId());
		map.put("patientId", referral.getPatientId());
		map.put("doctorId", referral.getDoctorId());
		map.put("toFacility", referral.getToFacility());
		map.put("toSpecialty", referral.getToSpecialty());
		map.put("urgency", referral.getUrgency());
		map.put("reason", referral.getReason());
		map.put("clinicalSummary", referral.getClinicalSummary());
		map.put("status", referral.getStatus());
		map.put("referenceNumber", referral.getReferenceNumber());
		map.put("createdAt", referral.getCreatedAt());
		return map;
	}

	public Map<String, Object> waitlistEntry(SurgicalWaitlistEntry entry) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", entry.getId());
		map.put("id", entry.getId());
		map.put("patientId", entry.getPatientId());
		map.put("procedureName", entry.getProcedureName());
		map.put("specialty", entry.getSpecialty());
		map.put("urgency", entry.getUrgency());
		map.put("decisionToTreatDate",
				entry.getDecisionToTreatDate() == null ? null : entry.getDecisionToTreatDate().toString());
		map.put("ttgDays", entry.getTtgDays());
		map.put("status", entry.getStatus());
		map.put("scheduledDate", entry.getScheduledDate());
		map.put("notes", entry.getNotes());
		map.put("createdAt", entry.getCreatedAt());
		map.put("updatedAt", entry.getUpdatedAt());
		return map;
	}

	public Map<String, Object> queue(QueueEntry entry, User patient) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", entry.getId());
		map.put("queueNumber", entry.getQueueNumber());
		map.put("queueDate", entry.getQueueDate() != null ? entry.getQueueDate().toString() : null);
		map.put("reason", entry.getReason());
		map.put("status", entry.getStatus());
		map.put("createdAt", entry.getCreatedAt());
		map.put("calledAt", entry.getCalledAt());
		map.put("completedAt", entry.getCompletedAt());
		map.put("patientId", patient.getId());
		map.put("firstName", patient.getFirstName());
		map.put("lastName", patient.getLastName());
		map.put("idNumber", patient.getIdNumber());
		map.put("phoneNumber", patient.getPhoneNumber());
		return map;
	}

	public Map<String, Object> complaint(Complaint complaint) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", complaint.getId());
		map.put("id", complaint.getId());
		map.put("referenceNumber", complaint.getReferenceNumber());
		map.put("patientId", complaint.getPatientId());
		map.put("complainantName", complaint.getComplainantName());
		map.put("channel", complaint.getChannel());
		map.put("subject", complaint.getSubject());
		map.put("description", complaint.getDescription());
		map.put("status", complaint.getStatus());
		map.put("loggedAt", complaint.getLoggedAt());
		map.put("acknowledgedAt", complaint.getAcknowledgedAt());
		map.put("resolvedAt", complaint.getResolvedAt());
		map.put("closedAt", complaint.getClosedAt());
		map.put("assignedTo", complaint.getAssignedTo());
		map.put("resolutionNotes", complaint.getResolutionNotes());
		map.put("slaAckDueAt", complaint.getSlaAckDueAt());
		map.put("slaResolveDueAt", complaint.getSlaResolveDueAt());
		map.put("createdAt", complaint.getCreatedAt());
		map.put("updatedAt", complaint.getUpdatedAt());
		return map;
	}

	public Map<String, Object> smsReminder(SmsReminder reminder) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", reminder.getId());
		map.put("id", reminder.getId());
		map.put("appointmentId", reminder.getAppointmentId());
		map.put("patientId", reminder.getPatientId());
		map.put("phoneNumber", reminder.getPhoneNumber());
		map.put("message", reminder.getMessage());
		map.put("scheduledFor", reminder.getScheduledFor());
		map.put("sentAt", reminder.getSentAt());
		map.put("status", reminder.getStatus());
		map.put("consentRecorded", reminder.getConsentRecorded());
		map.put("createdAt", reminder.getCreatedAt());
		return map;
	}

	public Map<String, Object> theatre(Theatre theatre) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", theatre.getId());
		map.put("id", theatre.getId());
		map.put("name", theatre.getName());
		map.put("location", theatre.getLocation());
		map.put("active", theatre.getActive());
		return map;
	}

	public Map<String, Object> theatreSession(TheatreSession session) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", session.getId());
		map.put("id", session.getId());
		map.put("theatreId", session.getTheatreId());
		map.put("sessionDate", session.getSessionDate() == null ? null : session.getSessionDate().toString());
		map.put("startTime", session.getStartTime() == null ? null : session.getStartTime().toString());
		map.put("endTime", session.getEndTime() == null ? null : session.getEndTime().toString());
		map.put("procedureName", session.getProcedureName());
		map.put("patientId", session.getPatientId());
		map.put("waitlistEntryId", session.getWaitlistEntryId());
		map.put("status", session.getStatus());
		map.put("utilisationMinutes", session.getUtilisationMinutes());
		map.put("notes", session.getNotes());
		map.put("createdAt", session.getCreatedAt());
		return map;
	}

	public Map<String, Object> costCentre(CostCentre costCentre) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", costCentre.getId());
		map.put("id", costCentre.getId());
		map.put("code", costCentre.getCode());
		map.put("name", costCentre.getName());
		map.put("department", costCentre.getDepartment());
		map.put("budgetAnnual", costCentre.getBudgetAnnual());
		map.put("active", costCentre.getActive());
		return map;
	}

	public Map<String, Object> financeTransaction(FinanceTransaction txn) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", txn.getId());
		map.put("id", txn.getId());
		map.put("costCentreId", txn.getCostCentreId());
		map.put("txnDate", txn.getTxnDate() == null ? null : txn.getTxnDate().toString());
		map.put("description", txn.getDescription());
		map.put("amount", txn.getAmount());
		map.put("type", txn.getType());
		map.put("reference", txn.getReference());
		map.put("createdBy", txn.getCreatedBy());
		map.put("createdAt", txn.getCreatedAt());
		return map;
	}

	public Map<String, Object> patientInvoice(PatientInvoice invoice) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", invoice.getId());
		map.put("id", invoice.getId());
		map.put("patientId", invoice.getPatientId());
		map.put("patientName", invoice.getPatientName());
		map.put("classification", invoice.getClassification());
		map.put("medicalScheme", invoice.getMedicalScheme());
		map.put("amount", invoice.getAmount());
		map.put("amountPaid", invoice.getAmountPaid());
		map.put("balance", invoice.getBalance());
		map.put("status", invoice.getStatus());
		map.put("invoiceDate", invoice.getInvoiceDate() == null ? null : invoice.getInvoiceDate().toString());
		map.put("dueDate", invoice.getDueDate() == null ? null : invoice.getDueDate().toString());
		map.put("referenceNumber", invoice.getReferenceNumber());
		map.put("notes", invoice.getNotes());
		map.put("createdAt", invoice.getCreatedAt());
		return map;
	}

	public Map<String, Object> debtAccount(DebtAccount debt) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", debt.getId());
		map.put("id", debt.getId());
		map.put("debtorCategory", debt.getDebtorCategory());
		map.put("debtorName", debt.getDebtorName());
		map.put("amount", debt.getAmount());
		map.put("ageBucket", debt.getAgeBucket());
		map.put("status", debt.getStatus());
		map.put("notes", debt.getNotes());
		map.put("updatedAt", debt.getUpdatedAt());
		return map;
	}

	public Map<String, Object> irregularExpenditure(IrregularExpenditure item) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", item.getId());
		map.put("id", item.getId());
		map.put("referenceNumber", item.getReferenceNumber());
		map.put("category", item.getCategory());
		map.put("amount", item.getAmount());
		map.put("description", item.getDescription());
		map.put("department", item.getDepartment());
		map.put("status", item.getStatus());
		map.put("reportedDate", item.getReportedDate() == null ? null : item.getReportedDate().toString());
		map.put("createdAt", item.getCreatedAt());
		return map;
	}

	public Map<String, Object> purchaseRequisition(PurchaseRequisition req) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", req.getId());
		map.put("id", req.getId());
		map.put("referenceNumber", req.getReferenceNumber());
		map.put("requestedBy", req.getRequestedBy());
		map.put("department", req.getDepartment());
		map.put("description", req.getDescription());
		map.put("estimatedAmount", req.getEstimatedAmount());
		map.put("status", req.getStatus());
		map.put("vendorName", req.getVendorName());
		map.put("createdAt", req.getCreatedAt());
		map.put("approvedAt", req.getApprovedAt());
		return map;
	}

	public Map<String, Object> vendor(Vendor vendor) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", vendor.getId());
		map.put("id", vendor.getId());
		map.put("name", vendor.getName());
		map.put("registrationNumber", vendor.getRegistrationNumber());
		map.put("category", vendor.getCategory());
		map.put("status", vendor.getStatus());
		map.put("performanceScore", vendor.getPerformanceScore());
		map.put("notes", vendor.getNotes());
		map.put("createdAt", vendor.getCreatedAt());
		return map;
	}

	public Map<String, Object> budgetForecast(BudgetForecast forecast) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", forecast.getId());
		map.put("id", forecast.getId());
		map.put("periodLabel", forecast.getPeriodLabel());
		map.put("department", forecast.getDepartment());
		map.put("budgetAmount", forecast.getBudgetAmount());
		map.put("forecastAmount", forecast.getForecastAmount());
		map.put("actualAmount", forecast.getActualAmount());
		map.put("variancePercent", forecast.getVariancePercent());
		map.put("notes", forecast.getNotes());
		map.put("updatedAt", forecast.getUpdatedAt());
		return map;
	}

	public Map<String, Object> fixedAsset(FixedAsset asset) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", asset.getId());
		map.put("id", asset.getId());
		map.put("assetTag", asset.getAssetTag());
		map.put("name", asset.getName());
		map.put("category", asset.getCategory());
		map.put("acquisitionDate", asset.getAcquisitionDate() == null ? null : asset.getAcquisitionDate().toString());
		map.put("acquisitionCost", asset.getAcquisitionCost());
		map.put("bookValue", asset.getBookValue());
		map.put("status", asset.getStatus());
		map.put("department", asset.getDepartment());
		map.put("createdAt", asset.getCreatedAt());
		return map;
	}

	public Map<String, Object> payrollPeriod(PayrollPeriod period) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", period.getId());
		map.put("id", period.getId());
		map.put("periodLabel", period.getPeriodLabel());
		map.put("startDate", period.getStartDate() == null ? null : period.getStartDate().toString());
		map.put("endDate", period.getEndDate() == null ? null : period.getEndDate().toString());
		map.put("status", period.getStatus());
		map.put("budgetAmount", period.getBudgetAmount());
		map.put("actualAmount", period.getActualAmount());
		map.put("overtimeAmount", period.getOvertimeAmount());
		map.put("createdAt", period.getCreatedAt());
		return map;
	}

	public Map<String, Object> payrollCostCentre(PayrollCostCentre centre) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", centre.getId());
		map.put("id", centre.getId());
		map.put("code", centre.getCode());
		map.put("department", centre.getDepartment());
		map.put("budgetAnnual", centre.getBudgetAnnual());
		map.put("actualYtd", centre.getActualYtd());
		map.put("fteApproved", centre.getFteApproved());
		map.put("fteFilled", centre.getFteFilled());
		map.put("overtimeYtd", centre.getOvertimeYtd());
		map.put("updatedAt", centre.getUpdatedAt());
		return map;
	}

	public Map<String, Object> timesheetEntry(TimesheetEntry entry) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", entry.getId());
		map.put("id", entry.getId());
		map.put("employeeNumber", entry.getEmployeeNumber());
		map.put("employeeName", entry.getEmployeeName());
		map.put("department", entry.getDepartment());
		map.put("workDate", entry.getWorkDate() == null ? null : entry.getWorkDate().toString());
		map.put("shiftType", entry.getShiftType());
		map.put("hoursWorked", entry.getHoursWorked());
		map.put("overtimeHours", entry.getOvertimeHours());
		map.put("status", entry.getStatus());
		map.put("createdAt", entry.getCreatedAt());
		return map;
	}

	public Map<String, Object> ghostWorkerCase(GhostWorkerCase item) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", item.getId());
		map.put("id", item.getId());
		map.put("referenceNumber", item.getReferenceNumber());
		map.put("employeeNumber", item.getEmployeeNumber());
		map.put("employeeName", item.getEmployeeName());
		map.put("department", item.getDepartment());
		map.put("riskScore", item.getRiskScore());
		map.put("status", item.getStatus());
		map.put("amountAtRisk", item.getAmountAtRisk());
		map.put("notes", item.getNotes());
		map.put("flaggedAt", item.getFlaggedAt());
		map.put("updatedAt", item.getUpdatedAt());
		return map;
	}

	public Map<String, Object> payrollAuditEvent(PayrollAuditEvent event) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", event.getId());
		map.put("id", event.getId());
		map.put("actorEmail", event.getActorEmail());
		map.put("action", event.getAction());
		map.put("entityType", event.getEntityType());
		map.put("entityId", event.getEntityId());
		map.put("detail", event.getDetail());
		map.put("createdAt", event.getCreatedAt());
		return map;
	}

	public Map<String, Object> staffCertification(StaffCertification cert) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", cert.getId());
		map.put("id", cert.getId());
		map.put("employeeNumber", cert.getEmployeeNumber());
		map.put("employeeName", cert.getEmployeeName());
		map.put("certType", cert.getCertType());
		map.put("licenceNumber", cert.getLicenceNumber());
		map.put("expiryDate", cert.getExpiryDate() == null ? null : cert.getExpiryDate().toString());
		map.put("status", cert.getStatus());
		map.put("department", cert.getDepartment());
		return map;
	}

	public Map<String, Object> auditEvent(AuditEvent event) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", event.getId());
		map.put("id", event.getId());
		map.put("actorId", event.getActorId());
		map.put("actorRole", event.getActorRole());
		map.put("actorEmail", event.getActorEmail());
		map.put("action", event.getAction());
		map.put("resourceType", event.getResourceType());
		map.put("resourceId", event.getResourceId());
		map.put("detail", event.getDetail());
		map.put("ipAddress", event.getIpAddress());
		map.put("createdAt", event.getCreatedAt());
		return map;
	}

	public Map<String, Object> internAssignment(InternAssignment assignment) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", assignment.getId());
		map.put("id", assignment.getId());
		map.put("internName", assignment.getInternName());
		map.put("internEmail", assignment.getInternEmail());
		map.put("programme", assignment.getProgramme());
		map.put("department", assignment.getDepartment());
		map.put("supervisorDoctorId", assignment.getSupervisorDoctorId());
		map.put("startDate", assignment.getStartDate() == null ? null : assignment.getStartDate().toString());
		map.put("endDate", assignment.getEndDate() == null ? null : assignment.getEndDate().toString());
		map.put("status", assignment.getStatus());
		return map;
	}

	public Map<String, Object> supervisionLog(SupervisionLog log) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", log.getId());
		map.put("id", log.getId());
		map.put("assignmentId", log.getAssignmentId());
		map.put("sessionDate", log.getSessionDate() == null ? null : log.getSessionDate().toString());
		map.put("topic", log.getTopic());
		map.put("hours", log.getHours());
		map.put("supervisorNotes", log.getSupervisorNotes());
		map.put("internAcknowledged", log.getInternAcknowledged());
		return map;
	}

	public Map<String, Object> pmdsCycle(PmdsCycle cycle) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", cycle.getId());
		map.put("id", cycle.getId());
		map.put("staffName", cycle.getStaffName());
		map.put("staffRole", cycle.getStaffRole());
		map.put("cycleYear", cycle.getCycleYear());
		map.put("agreementSigned", cycle.getAgreementSigned());
		map.put("midYearReview", cycle.getMidYearReview());
		map.put("annualReview", cycle.getAnnualReview());
		map.put("status", cycle.getStatus());
		map.put("notes", cycle.getNotes());
		return map;
	}

	public Map<String, Object> procTender(ProcTender tender) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", tender.getId());
		map.put("id", tender.getId());
		map.put("referenceNumber", tender.getReferenceNumber());
		map.put("title", tender.getTitle());
		map.put("description", tender.getDescription());
		map.put("category", tender.getCategory());
		map.put("estimatedValue", tender.getEstimatedValue());
		map.put("evaluationCriteria", tender.getEvaluationCriteria());
		map.put("status", tender.getStatus());
		map.put("publishedAt", tender.getPublishedAt());
		map.put("closingAt", tender.getClosingAt());
		map.put("awardedVendorId", tender.getAwardedVendorId());
		map.put("awardScore", tender.getAwardScore());
		map.put("createdBy", tender.getCreatedBy());
		map.put("createdAt", tender.getCreatedAt());
		map.put("updatedAt", tender.getUpdatedAt());
		return map;
	}

	public Map<String, Object> procBid(ProcBid bid) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", bid.getId());
		map.put("id", bid.getId());
		map.put("tenderId", bid.getTenderId());
		map.put("vendorId", bid.getVendorId());
		map.put("vendorName", bid.getVendorName());
		map.put("bidAmount", bid.getBidAmount());
		map.put("proposalSummary", bid.getProposalSummary());
		map.put("status", bid.getStatus());
		map.put("submittedAt", bid.getSubmittedAt());
		map.put("sealedHash", bid.getSealedHash());
		map.put("openedAt", bid.getOpenedAt());
		map.put("technicalScore", bid.getTechnicalScore());
		map.put("priceScore", bid.getPriceScore());
		map.put("totalScore", bid.getTotalScore());
		return map;
	}

	public Map<String, Object> procVendor(ProcVendor vendor) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", vendor.getId());
		map.put("id", vendor.getId());
		map.put("name", vendor.getName());
		map.put("registrationNumber", vendor.getRegistrationNumber());
		map.put("csdNumber", vendor.getCsdNumber());
		map.put("category", vendor.getCategory());
		map.put("contactEmail", vendor.getContactEmail());
		map.put("contactPhone", vendor.getContactPhone());
		map.put("status", vendor.getStatus());
		map.put("riskRating", vendor.getRiskRating());
		map.put("performanceScore", vendor.getPerformanceScore());
		map.put("deliveryScore", vendor.getDeliveryScore());
		map.put("qualityScore", vendor.getQualityScore());
		map.put("costScore", vendor.getCostScore());
		map.put("complianceScore", vendor.getComplianceScore());
		map.put("notes", vendor.getNotes());
		map.put("createdAt", vendor.getCreatedAt());
		return map;
	}

	public Map<String, Object> procContract(ProcContract contract) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", contract.getId());
		map.put("id", contract.getId());
		map.put("referenceNumber", contract.getReferenceNumber());
		map.put("tenderId", contract.getTenderId());
		map.put("vendorId", contract.getVendorId());
		map.put("vendorName", contract.getVendorName());
		map.put("title", contract.getTitle());
		map.put("value", contract.getValue());
		map.put("startDate", contract.getStartDate() == null ? null : contract.getStartDate().toString());
		map.put("endDate", contract.getEndDate() == null ? null : contract.getEndDate().toString());
		map.put("status", contract.getStatus());
		map.put("milestoneCount", contract.getMilestoneCount());
		map.put("milestonesCompleted", contract.getMilestonesCompleted());
		map.put("ledgerHash", contract.getLedgerHash());
		map.put("createdAt", contract.getCreatedAt());
		map.put("updatedAt", contract.getUpdatedAt());
		return map;
	}

	public Map<String, Object> procSpendRecord(ProcSpendRecord record) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", record.getId());
		map.put("id", record.getId());
		map.put("category", record.getCategory());
		map.put("department", record.getDepartment());
		map.put("amount", record.getAmount());
		map.put("periodLabel", record.getPeriodLabel());
		map.put("budgetAmount", record.getBudgetAmount());
		map.put("savingsAmount", record.getSavingsAmount());
		map.put("notes", record.getNotes());
		map.put("recordedAt", record.getRecordedAt());
		return map;
	}

	public Map<String, Object> procLedgerEvent(ProcLedgerEvent event) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", event.getId());
		map.put("id", event.getId());
		map.put("eventType", event.getEventType());
		map.put("entityType", event.getEntityType());
		map.put("entityId", event.getEntityId());
		map.put("payloadHash", event.getPayloadHash());
		map.put("previousHash", event.getPreviousHash());
		map.put("actorEmail", event.getActorEmail());
		map.put("detail", event.getDetail());
		map.put("createdAt", event.getCreatedAt());
		return map;
	}

	public Map<String, Object> procRiskAlert(ProcRiskAlert alert) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", alert.getId());
		map.put("id", alert.getId());
		map.put("severity", alert.getSeverity());
		map.put("title", alert.getTitle());
		map.put("detail", alert.getDetail());
		map.put("status", alert.getStatus());
		map.put("relatedEntityType", alert.getRelatedEntityType());
		map.put("relatedEntityId", alert.getRelatedEntityId());
		map.put("createdAt", alert.getCreatedAt());
		return map;
	}

	public Map<String, Object> procAiInsight(ProcAiInsight insight) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", insight.getId());
		map.put("id", insight.getId());
		map.put("insightType", insight.getInsightType());
		map.put("title", insight.getTitle());
		map.put("body", insight.getBody());
		map.put("confidence", insight.getConfidence());
		map.put("relatedEntityType", insight.getRelatedEntityType());
		map.put("relatedEntityId", insight.getRelatedEntityId());
		map.put("createdAt", insight.getCreatedAt());
		map.put("assistant", true);
		map.put("source", "Procurement assistant");
		return map;
	}

	public List<Object> parseDocuments(String documentsJson) {
		try {
			if (documentsJson == null || documentsJson.isBlank()) {
				return new ArrayList<>();
			}
			return objectMapper.readValue(documentsJson, new TypeReference<List<Object>>() {});
		} catch (Exception e) {
			return new ArrayList<>();
		}
	}

	public String writeDocuments(List<?> documents) {
		try {
			return objectMapper.writeValueAsString(documents);
		} catch (Exception e) {
			return "[]";
		}
	}
}

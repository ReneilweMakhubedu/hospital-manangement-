package za.gov.mpumalanga.rfh.config;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import za.gov.mpumalanga.rfh.entity.Admin;
import za.gov.mpumalanga.rfh.entity.AuditEvent;
import za.gov.mpumalanga.rfh.entity.BudgetForecast;
import za.gov.mpumalanga.rfh.entity.ClinicalOrder;
import za.gov.mpumalanga.rfh.entity.Complaint;
import za.gov.mpumalanga.rfh.entity.CostCentre;
import za.gov.mpumalanga.rfh.entity.DebtAccount;
import za.gov.mpumalanga.rfh.entity.Doctor;
import za.gov.mpumalanga.rfh.entity.FinanceTransaction;
import za.gov.mpumalanga.rfh.entity.FixedAsset;
import za.gov.mpumalanga.rfh.entity.GhostWorkerCase;
import za.gov.mpumalanga.rfh.entity.HeroSlide;
import za.gov.mpumalanga.rfh.entity.HrApplicant;
import za.gov.mpumalanga.rfh.entity.HrEmployee;
import za.gov.mpumalanga.rfh.entity.InternAssignment;
import za.gov.mpumalanga.rfh.entity.IrregularExpenditure;
import za.gov.mpumalanga.rfh.entity.LabResult;
import za.gov.mpumalanga.rfh.entity.LeaveRequest;
import za.gov.mpumalanga.rfh.entity.Medicine;
import za.gov.mpumalanga.rfh.entity.MoralePulse;
import za.gov.mpumalanga.rfh.entity.OnboardingChecklist;
import za.gov.mpumalanga.rfh.entity.PatientInvoice;
import za.gov.mpumalanga.rfh.entity.PatientMedication;
import za.gov.mpumalanga.rfh.entity.PatientNotification;
import za.gov.mpumalanga.rfh.entity.PayrollAuditEvent;
import za.gov.mpumalanga.rfh.entity.PayrollCostCentre;
import za.gov.mpumalanga.rfh.entity.PayrollPeriod;
import za.gov.mpumalanga.rfh.entity.PharmacyClinicalIntervention;
import za.gov.mpumalanga.rfh.entity.PharmacyFinancePeriod;
import za.gov.mpumalanga.rfh.entity.PharmacyQueueTicket;
import za.gov.mpumalanga.rfh.entity.PharmacySupplierScore;
import za.gov.mpumalanga.rfh.entity.PmdsCycle;
import za.gov.mpumalanga.rfh.entity.ProcAiInsight;
import za.gov.mpumalanga.rfh.entity.ProcBid;
import za.gov.mpumalanga.rfh.entity.ProcContract;
import za.gov.mpumalanga.rfh.entity.ProcLedgerEvent;
import za.gov.mpumalanga.rfh.entity.ProcRiskAlert;
import za.gov.mpumalanga.rfh.entity.ProcSpendRecord;
import za.gov.mpumalanga.rfh.entity.ProcTender;
import za.gov.mpumalanga.rfh.entity.ProcVendor;
import za.gov.mpumalanga.rfh.entity.PurchaseRequisition;
import za.gov.mpumalanga.rfh.entity.ReferralLetter;
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
import za.gov.mpumalanga.rfh.repository.AdminRepository;
import za.gov.mpumalanga.rfh.repository.AuditEventRepository;
import za.gov.mpumalanga.rfh.repository.BudgetForecastRepository;
import za.gov.mpumalanga.rfh.repository.ClinicalOrderRepository;
import za.gov.mpumalanga.rfh.repository.ComplaintRepository;
import za.gov.mpumalanga.rfh.repository.CostCentreRepository;
import za.gov.mpumalanga.rfh.repository.DebtAccountRepository;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.FinanceTransactionRepository;
import za.gov.mpumalanga.rfh.repository.FixedAssetRepository;
import za.gov.mpumalanga.rfh.repository.GhostWorkerCaseRepository;
import za.gov.mpumalanga.rfh.repository.HeroSlideRepository;
import za.gov.mpumalanga.rfh.repository.HrApplicantRepository;
import za.gov.mpumalanga.rfh.repository.HrEmployeeRepository;
import za.gov.mpumalanga.rfh.repository.InternAssignmentRepository;
import za.gov.mpumalanga.rfh.repository.IrregularExpenditureRepository;
import za.gov.mpumalanga.rfh.repository.LabResultRepository;
import za.gov.mpumalanga.rfh.repository.LeaveRequestRepository;
import za.gov.mpumalanga.rfh.repository.MedicineRepository;
import za.gov.mpumalanga.rfh.repository.MoralePulseRepository;
import za.gov.mpumalanga.rfh.repository.OnboardingChecklistRepository;
import za.gov.mpumalanga.rfh.repository.PatientInvoiceRepository;
import za.gov.mpumalanga.rfh.repository.PatientMedicationRepository;
import za.gov.mpumalanga.rfh.repository.PatientNotificationRepository;
import za.gov.mpumalanga.rfh.repository.PayrollAuditEventRepository;
import za.gov.mpumalanga.rfh.repository.PayrollCostCentreRepository;
import za.gov.mpumalanga.rfh.repository.PayrollPeriodRepository;
import za.gov.mpumalanga.rfh.repository.PharmacyClinicalInterventionRepository;
import za.gov.mpumalanga.rfh.repository.PharmacyFinancePeriodRepository;
import za.gov.mpumalanga.rfh.repository.PharmacyQueueTicketRepository;
import za.gov.mpumalanga.rfh.repository.PharmacySupplierScoreRepository;
import za.gov.mpumalanga.rfh.repository.PmdsCycleRepository;
import za.gov.mpumalanga.rfh.repository.ProcAiInsightRepository;
import za.gov.mpumalanga.rfh.repository.ProcBidRepository;
import za.gov.mpumalanga.rfh.repository.ProcContractRepository;
import za.gov.mpumalanga.rfh.repository.ProcLedgerEventRepository;
import za.gov.mpumalanga.rfh.repository.ProcRiskAlertRepository;
import za.gov.mpumalanga.rfh.repository.ProcSpendRecordRepository;
import za.gov.mpumalanga.rfh.repository.ProcTenderRepository;
import za.gov.mpumalanga.rfh.repository.ProcVendorRepository;
import za.gov.mpumalanga.rfh.repository.PurchaseRequisitionRepository;
import za.gov.mpumalanga.rfh.util.HashUtil;
import za.gov.mpumalanga.rfh.repository.ReferralLetterRepository;
import za.gov.mpumalanga.rfh.repository.StaffCertificationRepository;
import za.gov.mpumalanga.rfh.repository.SupervisionLogRepository;
import za.gov.mpumalanga.rfh.repository.SurgicalWaitlistRepository;
import za.gov.mpumalanga.rfh.repository.TheatreRepository;
import za.gov.mpumalanga.rfh.repository.TheatreSessionRepository;
import za.gov.mpumalanga.rfh.repository.TimesheetEntryRepository;
import za.gov.mpumalanga.rfh.repository.TrainingCourseRepository;
import za.gov.mpumalanga.rfh.repository.TrainingEnrolmentRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.repository.VacancyRepository;
import za.gov.mpumalanga.rfh.repository.VendorRepository;

@Component
public class DataSeeder implements ApplicationRunner {

	private final AdminRepository adminRepository;
	private final MedicineRepository medicineRepository;
	private final VacancyRepository vacancyRepository;
	private final UserRepository userRepository;
	private final SurgicalWaitlistRepository waitlistRepository;
	private final ComplaintRepository complaintRepository;
	private final TheatreRepository theatreRepository;
	private final TheatreSessionRepository theatreSessionRepository;
	private final CostCentreRepository costCentreRepository;
	private final FinanceTransactionRepository financeTransactionRepository;
	private final AuditEventRepository auditEventRepository;
	private final InternAssignmentRepository internAssignmentRepository;
	private final SupervisionLogRepository supervisionLogRepository;
	private final PmdsCycleRepository pmdsCycleRepository;
	private final DoctorRepository doctorRepository;
	private final HeroSlideRepository heroSlideRepository;
	private final PatientMedicationRepository patientMedicationRepository;
	private final PatientNotificationRepository patientNotificationRepository;
	private final LabResultRepository labResultRepository;
	private final ClinicalOrderRepository clinicalOrderRepository;
	private final ReferralLetterRepository referralLetterRepository;
	private final HrEmployeeRepository hrEmployeeRepository;
	private final LeaveRequestRepository leaveRequestRepository;
	private final HrApplicantRepository hrApplicantRepository;
	private final OnboardingChecklistRepository onboardingChecklistRepository;
	private final TrainingCourseRepository trainingCourseRepository;
	private final TrainingEnrolmentRepository trainingEnrolmentRepository;
	private final MoralePulseRepository moralePulseRepository;
	private final PatientInvoiceRepository patientInvoiceRepository;
	private final DebtAccountRepository debtAccountRepository;
	private final IrregularExpenditureRepository irregularExpenditureRepository;
	private final PurchaseRequisitionRepository purchaseRequisitionRepository;
	private final VendorRepository vendorRepository;
	private final BudgetForecastRepository budgetForecastRepository;
	private final FixedAssetRepository fixedAssetRepository;
	private final PayrollPeriodRepository payrollPeriodRepository;
	private final PayrollCostCentreRepository payrollCostCentreRepository;
	private final TimesheetEntryRepository timesheetEntryRepository;
	private final GhostWorkerCaseRepository ghostWorkerCaseRepository;
	private final StaffCertificationRepository staffCertificationRepository;
	private final PayrollAuditEventRepository payrollAuditEventRepository;
	private final ProcVendorRepository procVendorRepository;
	private final ProcTenderRepository procTenderRepository;
	private final ProcBidRepository procBidRepository;
	private final ProcContractRepository procContractRepository;
	private final ProcSpendRecordRepository procSpendRecordRepository;
	private final ProcLedgerEventRepository procLedgerEventRepository;
	private final ProcRiskAlertRepository procRiskAlertRepository;
	private final ProcAiInsightRepository procAiInsightRepository;
	private final PharmacyQueueTicketRepository pharmacyQueueTicketRepository;
	private final PharmacyClinicalInterventionRepository pharmacyClinicalInterventionRepository;
	private final PharmacyFinancePeriodRepository pharmacyFinancePeriodRepository;
	private final PharmacySupplierScoreRepository pharmacySupplierScoreRepository;
	private final PasswordEncoder passwordEncoder;

	public DataSeeder(
			AdminRepository adminRepository,
			MedicineRepository medicineRepository,
			VacancyRepository vacancyRepository,
			UserRepository userRepository,
			SurgicalWaitlistRepository waitlistRepository,
			ComplaintRepository complaintRepository,
			TheatreRepository theatreRepository,
			TheatreSessionRepository theatreSessionRepository,
			CostCentreRepository costCentreRepository,
			FinanceTransactionRepository financeTransactionRepository,
			AuditEventRepository auditEventRepository,
			InternAssignmentRepository internAssignmentRepository,
			SupervisionLogRepository supervisionLogRepository,
			PmdsCycleRepository pmdsCycleRepository,
			DoctorRepository doctorRepository,
			HeroSlideRepository heroSlideRepository,
			PatientMedicationRepository patientMedicationRepository,
			PatientNotificationRepository patientNotificationRepository,
			LabResultRepository labResultRepository,
			ClinicalOrderRepository clinicalOrderRepository,
			ReferralLetterRepository referralLetterRepository,
			HrEmployeeRepository hrEmployeeRepository,
			LeaveRequestRepository leaveRequestRepository,
			HrApplicantRepository hrApplicantRepository,
			OnboardingChecklistRepository onboardingChecklistRepository,
			TrainingCourseRepository trainingCourseRepository,
			TrainingEnrolmentRepository trainingEnrolmentRepository,
			MoralePulseRepository moralePulseRepository,
			PatientInvoiceRepository patientInvoiceRepository,
			DebtAccountRepository debtAccountRepository,
			IrregularExpenditureRepository irregularExpenditureRepository,
			PurchaseRequisitionRepository purchaseRequisitionRepository,
			VendorRepository vendorRepository,
			BudgetForecastRepository budgetForecastRepository,
			FixedAssetRepository fixedAssetRepository,
			PayrollPeriodRepository payrollPeriodRepository,
			PayrollCostCentreRepository payrollCostCentreRepository,
			TimesheetEntryRepository timesheetEntryRepository,
			GhostWorkerCaseRepository ghostWorkerCaseRepository,
			StaffCertificationRepository staffCertificationRepository,
			PayrollAuditEventRepository payrollAuditEventRepository,
			ProcVendorRepository procVendorRepository,
			ProcTenderRepository procTenderRepository,
			ProcBidRepository procBidRepository,
			ProcContractRepository procContractRepository,
			ProcSpendRecordRepository procSpendRecordRepository,
			ProcLedgerEventRepository procLedgerEventRepository,
			ProcRiskAlertRepository procRiskAlertRepository,
			ProcAiInsightRepository procAiInsightRepository,
			PharmacyQueueTicketRepository pharmacyQueueTicketRepository,
			PharmacyClinicalInterventionRepository pharmacyClinicalInterventionRepository,
			PharmacyFinancePeriodRepository pharmacyFinancePeriodRepository,
			PharmacySupplierScoreRepository pharmacySupplierScoreRepository,
			PasswordEncoder passwordEncoder) {
		this.adminRepository = adminRepository;
		this.medicineRepository = medicineRepository;
		this.vacancyRepository = vacancyRepository;
		this.userRepository = userRepository;
		this.waitlistRepository = waitlistRepository;
		this.complaintRepository = complaintRepository;
		this.theatreRepository = theatreRepository;
		this.theatreSessionRepository = theatreSessionRepository;
		this.costCentreRepository = costCentreRepository;
		this.financeTransactionRepository = financeTransactionRepository;
		this.auditEventRepository = auditEventRepository;
		this.internAssignmentRepository = internAssignmentRepository;
		this.supervisionLogRepository = supervisionLogRepository;
		this.pmdsCycleRepository = pmdsCycleRepository;
		this.doctorRepository = doctorRepository;
		this.heroSlideRepository = heroSlideRepository;
		this.patientMedicationRepository = patientMedicationRepository;
		this.patientNotificationRepository = patientNotificationRepository;
		this.labResultRepository = labResultRepository;
		this.clinicalOrderRepository = clinicalOrderRepository;
		this.referralLetterRepository = referralLetterRepository;
		this.hrEmployeeRepository = hrEmployeeRepository;
		this.leaveRequestRepository = leaveRequestRepository;
		this.hrApplicantRepository = hrApplicantRepository;
		this.onboardingChecklistRepository = onboardingChecklistRepository;
		this.trainingCourseRepository = trainingCourseRepository;
		this.trainingEnrolmentRepository = trainingEnrolmentRepository;
		this.moralePulseRepository = moralePulseRepository;
		this.patientInvoiceRepository = patientInvoiceRepository;
		this.debtAccountRepository = debtAccountRepository;
		this.irregularExpenditureRepository = irregularExpenditureRepository;
		this.purchaseRequisitionRepository = purchaseRequisitionRepository;
		this.vendorRepository = vendorRepository;
		this.budgetForecastRepository = budgetForecastRepository;
		this.fixedAssetRepository = fixedAssetRepository;
		this.payrollPeriodRepository = payrollPeriodRepository;
		this.payrollCostCentreRepository = payrollCostCentreRepository;
		this.timesheetEntryRepository = timesheetEntryRepository;
		this.ghostWorkerCaseRepository = ghostWorkerCaseRepository;
		this.staffCertificationRepository = staffCertificationRepository;
		this.payrollAuditEventRepository = payrollAuditEventRepository;
		this.procVendorRepository = procVendorRepository;
		this.procTenderRepository = procTenderRepository;
		this.procBidRepository = procBidRepository;
		this.procContractRepository = procContractRepository;
		this.procSpendRecordRepository = procSpendRecordRepository;
		this.procLedgerEventRepository = procLedgerEventRepository;
		this.procRiskAlertRepository = procRiskAlertRepository;
		this.procAiInsightRepository = procAiInsightRepository;
		this.pharmacyQueueTicketRepository = pharmacyQueueTicketRepository;
		this.pharmacyClinicalInterventionRepository = pharmacyClinicalInterventionRepository;
		this.pharmacyFinancePeriodRepository = pharmacyFinancePeriodRepository;
		this.pharmacySupplierScoreRepository = pharmacySupplierScoreRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (adminRepository.count() == 0) {
			Admin admin = new Admin();
			admin.setFirstName("System");
			admin.setLastName("Admin");
			admin.setEmail("admin@rfh.gov.za");
			admin.setPassword(passwordEncoder.encode("Admin123!"));
			admin.setRole("admin");
			adminRepository.save(admin);
		}

		if (adminRepository.findByEmailIgnoreCase("superadmin@rfh.gov.za").isEmpty()) {
			Admin superAdmin = new Admin();
			superAdmin.setFirstName("Super");
			superAdmin.setLastName("Admin");
			superAdmin.setEmail("superadmin@rfh.gov.za");
			superAdmin.setPassword(passwordEncoder.encode("SuperAdmin123!"));
			superAdmin.setRole("super_admin");
			adminRepository.save(superAdmin);
		}

		if (adminRepository.findByEmailIgnoreCase("hr@rfh.gov.za").isEmpty()) {
			Admin hr = new Admin();
			hr.setFirstName("Hospital");
			hr.setLastName("HR");
			hr.setEmail("hr@rfh.gov.za");
			hr.setPassword(passwordEncoder.encode("Hr123!"));
			hr.setRole("hr");
			adminRepository.save(hr);
		}

		if (adminRepository.findByEmailIgnoreCase("finance@rfh.gov.za").isEmpty()) {
			Admin finance = new Admin();
			finance.setFirstName("Hospital");
			finance.setLastName("Finance");
			finance.setEmail("finance@rfh.gov.za");
			finance.setPassword(passwordEncoder.encode("Finance123!"));
			finance.setRole("finance");
			adminRepository.save(finance);
		}

		if (adminRepository.findByEmailIgnoreCase("payroll@rfh.gov.za").isEmpty()) {
			Admin payroll = new Admin();
			payroll.setFirstName("Hospital");
			payroll.setLastName("Payroll");
			payroll.setEmail("payroll@rfh.gov.za");
			payroll.setPassword(passwordEncoder.encode("Payroll123!"));
			payroll.setRole("payroll");
			adminRepository.save(payroll);
		}

		if (adminRepository.findByEmailIgnoreCase("procurement@rfh.gov.za").isEmpty()) {
			Admin procurement = new Admin();
			procurement.setFirstName("Hospital");
			procurement.setLastName("Procurement");
			procurement.setEmail("procurement@rfh.gov.za");
			procurement.setPassword(passwordEncoder.encode("Procurement123!"));
			procurement.setRole("procurement");
			adminRepository.save(procurement);
		}

		if (adminRepository.findByEmailIgnoreCase("pharmacy@rfh.gov.za").isEmpty()) {
			Admin pharmacy = new Admin();
			pharmacy.setFirstName("Hospital");
			pharmacy.setLastName("Pharmacy");
			pharmacy.setEmail("pharmacy@rfh.gov.za");
			pharmacy.setPassword(passwordEncoder.encode("Pharmacy123!"));
			pharmacy.setRole("pharmacy");
			adminRepository.save(pharmacy);
		}

		if (heroSlideRepository.count() == 0) {
			seedHeroSlide(
					"Rob Ferreira Hospital Management System",
					"Accountability and care for a tertiary centre of excellence in Mbombela, Mpumalanga.",
					"Access the system",
					"/login",
					0);
			seedHeroSlide(
					"Aligned with #OperationAsiphileni",
					"Infrastructure, HR, finance, patient experience, and monitoring in one hospital platform.",
					"Staff login",
					"/login",
					1);
			seedHeroSlide(
					"Better patient flow. Stronger governance.",
					"EMR, queues, surgical waiting lists, complaints SLA, theatre utilisation, and provincial reporting.",
					"Create an account",
					"/signup",
					2);
		}

		if (medicineRepository.count() == 0) {
			seedMedicine("Paracetamol", "500mg", "Tablet", 200, 40,
					LocalDate.now().plusMonths(14), false, new BigDecimal("0.45"), "Lowveld Medical Supplies", null);
			seedMedicine("Amoxicillin", "250mg", "Capsule", 120, 30,
					LocalDate.now().plusMonths(8), true, new BigDecimal("1.20"), "AfriMed Distributors", null);
			seedMedicine("Ibuprofen", "200mg", "Tablet", 150, 35,
					LocalDate.now().plusDays(45), false, new BigDecimal("0.65"), "Lowveld Medical Supplies", null);
			seedMedicine("Insulin Glargine", "100U/mL", "Injection", 0, 20,
					LocalDate.now().plusMonths(6), true, new BigDecimal("185.00"), "Provincial Depot Delay Co", Instant.now().minus(5, ChronoUnit.DAYS));
			seedMedicine("Ceftriaxone", "1g", "Injection", 8, 25,
					LocalDate.now().plusDays(60), true, new BigDecimal("42.50"), "AfriMed Distributors", null);
			seedMedicine("Metformin", "500mg", "Tablet", 80, 40,
					LocalDate.now().plusMonths(18), true, new BigDecimal("0.35"), "Generic Care SA", null);
		}

		seedPharmacyModule();

		if (vacancyRepository.count() == 0) {
			seedVacancy(
					"Specialist Nephrologist",
					"Internal Medicine",
					"Nephrology",
					"Specialist Grade 1",
					2,
					0,
					true,
					"OPEN",
					"Critical tertiary shortage — dialysis and renal clinic backlog.",
					90,
					null);
			seedVacancy(
					"Specialist Oncologist",
					"Oncology",
					"Medical Oncology",
					"Specialist Grade 1",
					1,
					0,
					true,
					"IN_RECRUITMENT",
					"Supports chemotherapy and radiotherapy referral pathways.",
					60,
					null);
			seedVacancy(
					"Theatre Professional Nurse",
					"Theatre / CSSD",
					"Perioperative Nursing",
					"Professional Nurse Grade 2",
					4,
					1,
					false,
					"OPEN",
					"Needed to restore elective theatre capacity.",
					75,
					40);
			seedVacancy(
					"Radiographer",
					"Radiology",
					"Diagnostic Radiography",
					"Radiographer Grade 1",
					3,
					1,
					false,
					"IN_RECRUITMENT",
					"CT and general X-ray coverage for Level 2/3 services.",
					50,
					28);
			seedVacancy(
					"Medical Officer",
					"Emergency / Internal Medicine",
					null,
					"Medical Officer Grade 1",
					5,
					3,
					false,
					"OPEN",
					"Ward and casualty relief posts for tertiary intake.",
					120,
					55);
		} else {
			backfillVacancyAdvertisedAt();
		}

		seedHrModule();

		User patient = ensureSeedPatient();
		seedPatientMedications(patient);
		seedPatientNotifications(patient);
		seedLabResults(patient);

		if (waitlistRepository.count() == 0 && patient != null) {
			LocalDate today = LocalDate.now();
			seedWaitlist(
					patient.getId(),
					"Emergency laparotomy",
					"General Surgery",
					"EMERGENCY",
					today.minusDays(1),
					0,
					"WAITING",
					null,
					"Acute abdomen — theatre ASAP.");
			seedWaitlist(
					patient.getId(),
					"Cholecystectomy",
					"General Surgery",
					"URGENT",
					today.minusDays(20),
					14,
					"WAITING",
					null,
					"Symptomatic gallstones; TTG breach risk.");
			seedWaitlist(
					patient.getId(),
					"Total knee replacement",
					"Orthopaedics",
					"ROUTINE",
					today.minusDays(45),
					90,
					"WAITING",
					null,
					"Elective arthroplasty pathway.");
			seedWaitlist(
					patient.getId(),
					"Cataract extraction (left)",
					"Ophthalmology",
					"ROUTINE",
					today.minusDays(10),
					90,
					"SCHEDULED",
					today.plusDays(21).toString(),
					"Booked on elective list.");
		}

		if (complaintRepository.count() == 0) {
			Instant now = Instant.now();
			seedComplaint(
					patient == null ? null : patient.getId(),
					"Thandi Mokoena",
					"WALK_IN",
					"Long pharmacy wait",
					"Waited over 3 hours for chronic medication.",
					"OPEN",
					now.minus(3, ChronoUnit.DAYS),
					null);
			seedComplaint(
					patient == null ? null : patient.getId(),
					"Thandi Nkosi",
					"PHONE",
					"Appointment cancellation without notice",
					"Clinic cancelled appointment; no SMS received.",
					"OPEN",
					now.minus(8, ChronoUnit.DAYS),
					null);
			seedComplaint(
					null,
					"Community letter",
					"LETTER",
					"Cleanliness of ward ablutions",
					"Ablution facilities on Ward B need urgent attention.",
					"IN_PROGRESS",
					now.minus(28, ChronoUnit.DAYS),
					now.minus(20, ChronoUnit.DAYS));
		}

		if (theatreRepository.count() == 0) {
			Theatre t1 = seedTheatre("Theatre 1", "Main theatre complex");
			Theatre t2 = seedTheatre("Theatre 2", "Main theatre complex");
			LocalDate today = LocalDate.now();
			seedSession(t1.getId(), today, LocalTime.of(8, 0), LocalTime.of(11, 0),
					"Laparoscopic cholecystectomy", patient == null ? null : patient.getId(), "COMPLETED");
			seedSession(t1.getId(), today, LocalTime.of(12, 0), LocalTime.of(14, 30),
					"Hernia repair", patient == null ? null : patient.getId(), "BOOKED");
			seedSession(t2.getId(), today.plusDays(1), LocalTime.of(9, 0), LocalTime.of(12, 0),
					"Knee arthroscopy", patient == null ? null : patient.getId(), "BOOKED");
			seedSession(t2.getId(), today.minusDays(1), LocalTime.of(10, 0), LocalTime.of(11, 0),
					"Cancelled list slot", null, "CANCELLED");
		}

		if (costCentreRepository.count() == 0) {
			CostCentre pharmacy = seedCostCentre("PHARM", "Pharmacy operations", "Pharmacy", new BigDecimal("2500000"));
			CostCentre theatre = seedCostCentre("THTR", "Theatre & CSSD", "Theatre", new BigDecimal("4800000"));
			CostCentre opd = seedCostCentre("OPD", "Outpatient services", "Outpatients", new BigDecimal("1800000"));
			CostCentre hr = seedCostCentre("HR", "Human resources", "HR", new BigDecimal("950000"));
			LocalDate today = LocalDate.now();
			seedTxn(pharmacy.getId(), today.minusDays(10), "Chronic medicine order", new BigDecimal("185000"), "COMMITMENT", "PO-1001");
			seedTxn(pharmacy.getId(), today.minusDays(3), "Medicine invoice payment", new BigDecimal("92000"), "ACTUAL", "INV-441");
			seedTxn(theatre.getId(), today.minusDays(5), "Theatre consumables", new BigDecimal("64000"), "ACTUAL", "INV-512");
			seedTxn(opd.getId(), today.minusDays(2), "Patient fee receipts", new BigDecimal("12500"), "REVENUE", "RCP-88");
			seedTxn(hr.getId(), today.minusDays(15), "Agency nursing commitment", new BigDecimal("210000"), "COMMITMENT", "PO-1099");
		}

		seedFinanceExtended();
		seedPayrollModule();
		seedProcurementModule();

		if (auditEventRepository.count() == 0) {
			seedAudit("admin", "admin@rfh.gov.za", "SEED", "System", null, "RFH HMS seed baseline");
			seedAudit("admin", "admin@rfh.gov.za", "CREATE", "Complaint", "seed", "Sample complaint seeded");
			seedAudit("doctor", "doctor@rfh.gov.za", "CREATE", "ClinicalNote", "seed", "Sample EMR access logged");
			seedAudit("admin", "admin@rfh.gov.za", "CREATE", "FinanceTransaction", "seed", "Sample finance txn seeded");
		}

		Doctor supervisor = ensureSeedDoctor();
		seedDoctorClinicalData(supervisor, patient);
		if (internAssignmentRepository.count() == 0 && supervisor != null) {
			InternAssignment a1 = seedAssignment(
					"Sipho Mokoena",
					"sipho.mokoena@rfh.gov.za",
					"INTERN",
					"Internal Medicine",
					supervisor.getId(),
					LocalDate.now().minusMonths(2),
					null,
					"ACTIVE");
			InternAssignment a2 = seedAssignment(
					"Lerato Dlamini",
					"lerato.dlamini@rfh.gov.za",
					"COMMUNITY_SERVICE",
					"General Surgery",
					supervisor.getId(),
					LocalDate.now().minusMonths(6),
					LocalDate.now().plusMonths(6),
					"ACTIVE");
			if (supervisionLogRepository.count() == 0) {
				seedSupervision(a1.getId(), LocalDate.now().minusDays(7), "Ward round teaching", 2.0,
						"Good presentation of cases.");
				seedSupervision(a2.getId(), LocalDate.now().minusDays(3), "Theatre assistance", 3.5,
						"Assisted on elective list.");
			}
		}

		if (pmdsCycleRepository.count() == 0) {
			seedPmds("Hospital HR", "hr", LocalDate.now().getYear(), true, true, false, "IN_PROGRESS",
					"Mid-year review pending sign-off.");
			seedPmds("Dr Sipho Dlamini", "doctor", LocalDate.now().getYear(), false, false, false, "NOT_STARTED",
					"Agreement not yet signed.");
		}
	}

	private User ensureSeedPatient() {
		User patient = userRepository.findByEmailIgnoreCase("patient@rfh.gov.za").orElse(null);
		if (patient == null) {
			patient = userRepository.findByEmailIgnoreCase("demo.patient@rfh.gov.za").orElse(null);
		}
		if (patient == null) {
			var existing = userRepository.findByRoleOrderByCreatedAtDesc("patient");
			if (!existing.isEmpty()) {
				patient = existing.get(0);
			}
		}
		if (patient == null) {
			patient = new User();
			patient.setFirstName("Thandi");
			patient.setLastName("Mokoena");
			patient.setEmail("patient@rfh.gov.za");
			patient.setPassword(passwordEncoder.encode("Patient123!"));
			patient.setRole("patient");
			patient.setIdNumber("9001015800088");
			patient.setPhoneNumber("0820001001");
			patient.setAddress("Rob Ferreira Hospital, Mbombela");
			patient.setOnboardingComplete(1);
		}

		if (patient.getPhoneNumber() == null || patient.getPhoneNumber().isBlank()) {
			patient.setPhoneNumber("0820001001");
		}
		patient.setSmsConsent(true);
		patient.setPopiaConsent(true);
		patient.setCcmddEnrolled(true);
		if (patient.getCcmddPickupPoint() == null || patient.getCcmddPickupPoint().isBlank()) {
			patient.setCcmddPickupPoint("Clicks Riverside Mall");
		}
		if (patient.getNextCollectionDate() == null || patient.getNextCollectionDate().isBlank()) {
			patient.setNextCollectionDate(LocalDate.now().plusDays(14).toString());
		}
		patient.setLanguagePreference("English");
		patient.setPrimaryFacility("Rob Ferreira Hospital");
		patient.setPreferredChannel("SMS");
		if (patient.getBloodType() == null) {
			patient.setBloodType("O+");
		}
		return userRepository.save(patient);
	}

	private void seedPatientMedications(User patient) {
		if (patient == null || patientMedicationRepository.existsByPatientId(patient.getId())) {
			return;
		}
		String pickup = "Clicks Riverside Mall";
		String next = LocalDate.now().plusDays(14).toString();
		seedMedication(patient.getId(), "Amlodipine", "5mg", "Once daily", 3, pickup, next);
		seedMedication(patient.getId(), "Metformin", "500mg", "Twice daily", 2, pickup, next);
		seedMedication(patient.getId(), "Atorvastatin", "20mg", "Once at night", 3, pickup, next);
	}

	private void seedMedication(
			Long patientId,
			String name,
			String dosage,
			String frequency,
			int refills,
			String pickup,
			String nextCollection) {
		PatientMedication med = new PatientMedication();
		med.setPatientId(patientId);
		med.setMedicationName(name);
		med.setDosage(dosage);
		med.setFrequency(frequency);
		med.setRefillsRemaining(refills);
		med.setStatus("ACTIVE");
		med.setCcmdd(true);
		med.setPickupPoint(pickup);
		med.setNextCollectionDate(nextCollection);
		med.setNotes("CCMDD chronic pack");
		patientMedicationRepository.save(med);
	}

	private void seedPatientNotifications(User patient) {
		if (patient == null || patientNotificationRepository.existsByPatientId(patient.getId())) {
			return;
		}
		seedNotification(
				patient.getId(),
				"Upcoming clinic appointment",
				"Reminder: you have an outpatient appointment at Rob Ferreira Hospital.",
				"SMS",
				"APPOINTMENT",
				false);
		seedNotification(
				patient.getId(),
				"CCMDD collection window",
				"Your chronic medicines are ready for collection at Clicks Riverside Mall.",
				"APP",
				"MEDICATION",
				false);
		seedNotification(
				patient.getId(),
				"Lab results available",
				"New blood results have been posted to your health record.",
				"APP",
				"LAB",
				true);
		seedNotification(
				patient.getId(),
				"POPIA consent recorded",
				"Thank you for confirming your privacy preferences.",
				"EMAIL",
				"GENERAL",
				true);
	}

	private void seedNotification(
			Long patientId,
			String title,
			String body,
			String channel,
			String type,
			boolean read) {
		PatientNotification n = new PatientNotification();
		n.setPatientId(patientId);
		n.setTitle(title);
		n.setBody(body);
		n.setChannel(channel);
		n.setType(type);
		n.setReadFlag(read);
		patientNotificationRepository.save(n);
	}

	private void seedLabResults(User patient) {
		if (patient == null || labResultRepository.existsByPatientId(patient.getId())) {
			return;
		}
		seedLab(patient.getId(), "HbA1c", "7.2", "%", "4.0 - 5.6", "FINAL", LocalDate.now().minusDays(10).toString());
		seedLab(patient.getId(), "LDL Cholesterol", "3.1", "mmol/L", "< 2.6", "FINAL", LocalDate.now().minusDays(10).toString());
	}

	private void seedLab(
			Long patientId,
			String testName,
			String value,
			String unit,
			String range,
			String status,
			String resultDate) {
		LabResult lab = new LabResult();
		lab.setPatientId(patientId);
		lab.setTestName(testName);
		lab.setResultValue(value);
		lab.setUnit(unit);
		lab.setReferenceRange(range);
		lab.setStatus(status);
		lab.setResultDate(resultDate);
		labResultRepository.save(lab);
	}

	private Doctor ensureSeedDoctor() {
		Doctor doctor = doctorRepository.findByEmailIgnoreCase("doctor@rfh.gov.za")
				.or(() -> doctorRepository.findByEmailIgnoreCase("demo.doctor@rfh.gov.za"))
				.orElse(null);
		if (doctor == null && doctorRepository.count() > 0) {
			doctor = doctorRepository.findAll().get(0);
		}

		boolean created = false;
		if (doctor == null) {
			doctor = new Doctor();
			doctor.setFirstName("Sipho");
			doctor.setLastName("Dlamini");
			doctor.setEmail("doctor@rfh.gov.za");
			doctor.setPassword(passwordEncoder.encode("Doctor123!"));
			doctor.setSpecialty("Surgery");
			doctor.setDesignation(HpcsaCatalog.designationFor("Surgery"));
			doctor.setClinicianCategory("SPECIALIST");
			doctor.setSpecialistGrade(2);
			doctor.setSystemRoleCode(HpcsaCatalog.deriveSystemRoleCode("SPECIALIST", 2, "Surgery"));
			doctor.setHpcsaRegistrationCategory(HpcsaCatalog.hpcsaCategoryLabel("SPECIALIST", "Surgery"));
			doctor.setRequiresCosign(false);
			doctor.setLicenseNumber("MP-RFH-0001");
			doctor.setPhoneNumber("0131111111");
			doctor.setRole("doctor");
			created = true;
		}

		doctor.setDepartment("Outpatient");
		if (doctor.getSpecialty() == null || doctor.getSpecialty().isBlank()) {
			doctor.setSpecialty("Surgery");
		}
		if (doctor.getDesignation() == null || doctor.getDesignation().isBlank()) {
			doctor.setDesignation(HpcsaCatalog.designationFor(doctor.getSpecialty()));
		}
		if (doctor.getClinicianCategory() == null || doctor.getClinicianCategory().isBlank()) {
			doctor.setClinicianCategory("SPECIALIST");
		}
		if (doctor.getSpecialistGrade() == null
				&& List.of("SPECIALIST", "SUB_SPECIALIST", "DENTAL_SPECIALIST", "MEDICAL_OFFICER")
						.contains(doctor.getClinicianCategory())) {
			doctor.setSpecialistGrade(1);
		}
		if (doctor.getSystemRoleCode() == null || doctor.getSystemRoleCode().isBlank()) {
			doctor.setSystemRoleCode(HpcsaCatalog.deriveSystemRoleCode(
					doctor.getClinicianCategory(), doctor.getSpecialistGrade(), doctor.getSpecialty()));
		}
		if (doctor.getHpcsaRegistrationCategory() == null || doctor.getHpcsaRegistrationCategory().isBlank()) {
			doctor.setHpcsaRegistrationCategory(
					HpcsaCatalog.hpcsaCategoryLabel(doctor.getClinicianCategory(), doctor.getSpecialty()));
		}
		if (doctor.getRequiresCosign() == null) {
			doctor.setRequiresCosign(HpcsaCatalog.requiresCosign(doctor.getClinicianCategory()));
		}
		if (doctor.getQualifications() == null || doctor.getQualifications().isBlank()) {
			doctor.setQualifications("MBChB, FCS(SA)");
		}
		if (doctor.getYearsExperience() == null) {
			doctor.setYearsExperience(12);
		}
		if (doctor.getWorkingHours() == null || doctor.getWorkingHours().isBlank()) {
			doctor.setWorkingHours("08:00-16:00");
		}
		doctor.setAvailableToday(true);
		if (doctor.getConsultationNotesTemplate() == null || doctor.getConsultationNotesTemplate().isBlank()) {
			doctor.setConsultationNotesTemplate("SOAP");
		}
		if (created) {
			return doctorRepository.save(doctor);
		}
		return doctorRepository.save(doctor);
	}

	private void seedDoctorClinicalData(Doctor doctor, User patient) {
		if (doctor == null || patient == null) {
			return;
		}
		if (clinicalOrderRepository.count() == 0) {
			ClinicalOrder lab = new ClinicalOrder();
			lab.setPatientId(patient.getId());
			lab.setDoctorId(doctor.getId());
			lab.setOrderType("LAB");
			lab.setTestName("HbA1c");
			lab.setPriority("ROUTINE");
			lab.setClinicalIndication("Diabetes follow-up — glycaemic control");
			lab.setStatus("ORDERED");
			lab.setProviderHint("NHLS");
			lab.setReferenceNumber("ORD-LAB-SEED-0001");
			clinicalOrderRepository.save(lab);

			ClinicalOrder imaging = new ClinicalOrder();
			imaging.setPatientId(patient.getId());
			imaging.setDoctorId(doctor.getId());
			imaging.setOrderType("IMAGING");
			imaging.setTestName("Chest X-ray");
			imaging.setPriority("URGENT");
			imaging.setClinicalIndication("Persistent cough — exclude consolidation");
			imaging.setStatus("IN_PROGRESS");
			imaging.setProviderHint("RFH Radiology");
			imaging.setReferenceNumber("ORD-IMG-SEED-0001");
			clinicalOrderRepository.save(imaging);
		}

		if (referralLetterRepository.count() == 0) {
			ReferralLetter referral = new ReferralLetter();
			referral.setPatientId(patient.getId());
			referral.setDoctorId(doctor.getId());
			referral.setToFacility("Steve Biko Academic Hospital");
			referral.setToSpecialty("Cardiology");
			referral.setUrgency("URGENT");
			referral.setReason("Suspected ischaemic heart disease for specialist review");
			referral.setClinicalSummary("Hypertensive patient with exertional chest discomfort; ECG pending.");
			referral.setStatus("SENT");
			referral.setReferenceNumber("REF-SEED-0001");
			referralLetterRepository.save(referral);
		}
	}

	private void seedComplaint(
			Long patientId,
			String complainantName,
			String channel,
			String subject,
			String description,
			String status,
			Instant loggedAt,
			Instant acknowledgedAt) {
		String day = loggedAt.toString().substring(0, 10).replace("-", "");
		long seq = complaintRepository.count() + 1;
		Complaint c = new Complaint();
		c.setReferenceNumber("CMP-" + day + "-" + String.format("%04d", seq));
		c.setPatientId(patientId);
		c.setComplainantName(complainantName);
		c.setChannel(channel);
		c.setSubject(subject);
		c.setDescription(description);
		c.setStatus(status);
		c.setLoggedAt(loggedAt);
		c.setAcknowledgedAt(acknowledgedAt);
		c.setSlaAckDueAt(loggedAt.plus(5, ChronoUnit.DAYS));
		c.setSlaResolveDueAt(loggedAt.plus(25, ChronoUnit.DAYS));
		c.setAssignedTo("Patient Experience desk");
		complaintRepository.save(c);
	}

	private Theatre seedTheatre(String name, String location) {
		Theatre theatre = new Theatre();
		theatre.setName(name);
		theatre.setLocation(location);
		theatre.setActive(true);
		return theatreRepository.save(theatre);
	}

	private void seedSession(
			Long theatreId,
			LocalDate date,
			LocalTime start,
			LocalTime end,
			String procedure,
			Long patientId,
			String status) {
		TheatreSession session = new TheatreSession();
		session.setTheatreId(theatreId);
		session.setSessionDate(date);
		session.setStartTime(start);
		session.setEndTime(end);
		session.setProcedureName(procedure);
		session.setPatientId(patientId);
		session.setStatus(status);
		session.setUtilisationMinutes((int) ChronoUnit.MINUTES.between(start, end));
		theatreSessionRepository.save(session);
	}

	private CostCentre seedCostCentre(String code, String name, String department, BigDecimal budget) {
		CostCentre cc = new CostCentre();
		cc.setCode(code);
		cc.setName(name);
		cc.setDepartment(department);
		cc.setBudgetAnnual(budget);
		cc.setActive(true);
		return costCentreRepository.save(cc);
	}

	private void seedTxn(Long costCentreId, LocalDate date, String description, BigDecimal amount, String type, String reference) {
		FinanceTransaction txn = new FinanceTransaction();
		txn.setCostCentreId(costCentreId);
		txn.setTxnDate(date);
		txn.setDescription(description);
		txn.setAmount(amount);
		txn.setType(type);
		txn.setReference(reference);
		txn.setCreatedBy("seeder");
		financeTransactionRepository.save(txn);
	}

	private void seedFinanceExtended() {
		LocalDate today = LocalDate.now();

		if (patientInvoiceRepository.count() == 0) {
			seedInvoice(null, "Thandi Nkosi", "SELF_PAY", null, new BigDecimal("2450.00"),
					new BigDecimal("1000.00"), "PART_PAID", today.minusDays(12), today.plusDays(18), "INV-2026-1001",
					"OPD consultation and radiology package");
			seedInvoice(null, "Govan Mbeki District Health", "GOVERNMENT", null, new BigDecimal("186500.00"),
					new BigDecimal("186500.00"), "PAID", today.minusDays(40), today.minusDays(10), "INV-2026-1002",
					"Inter-facility referral batch — January");
			seedInvoice(null, "Bonitas Medical Scheme", "MEDICAL_SCHEME", "Bonitas", new BigDecimal("87420.00"),
					new BigDecimal("0.00"), "ISSUED", today.minusDays(5), today.plusDays(25), "INV-2026-1003",
					"Theatre and ward claims pending remittance");
		}

		if (debtAccountRepository.count() == 0) {
			seedDebt("MUNICIPAL", "City of Mbombela", new BigDecimal("312800.00"), "90", "OPEN",
					"Utility and rates arrears for hospital campus");
			seedDebt("SELF_PAYING", "Self-paying patient cohort", new BigDecimal("94560.00"), "60", "IN_COLLECTION",
					"Unsettled OPD and casualty invoices beyond 60 days");
			seedDebt("GOVERNMENT", "Mpumalanga Department of Health", new BigDecimal("428000.00"), "30", "OPEN",
					"Provincial subsidy transfer timing variance");
			seedDebt("MEDICAL_SCHEME", "Discovery Health", new BigDecimal("156740.00"), "CURRENT", "OPEN",
					"Claims awaiting scheme adjudication");
		}

		if (irregularExpenditureRepository.count() == 0) {
			seedIrregular("IE-RFH-2025-014", "IRREGULAR", new BigDecimal("87500.00"),
					"Emergency generator hire without competitive quotation during load-shedding outage",
					"Facilities", "UNDER_INVESTIGATION", today.minusMonths(2));
			seedIrregular("IE-RFH-2025-021", "FRUITLESS", new BigDecimal("22400.00"),
					"Expired theatre suture stock written off after cold-chain storage failure",
					"Theatre", "OPEN", today.minusMonths(1));
		}

		if (purchaseRequisitionRepository.count() == 0) {
			seedRequisition("REQ-RFH-4401", "N. Mabunda", "Pharmacy",
					"Essential medicines top-up — antibiotics and insulin", new BigDecimal("285000.00"),
					"APPROVED", "Aspen Pharmacare", Instant.now().minus(5, ChronoUnit.DAYS));
			seedRequisition("REQ-RFH-4402", "P. Sibiya", "Theatre",
					"Laparoscopic instrument set replacement", new BigDecimal("142500.00"),
					"SUBMITTED", "Surgical Solutions SA", null);
			seedRequisition("REQ-RFH-4403", "L. Khoza", "Facilities",
					"UPS batteries for ICU critical power circuit", new BigDecimal("67800.00"),
					"ORDERED", "PowerGuard Engineering", Instant.now().minus(12, ChronoUnit.DAYS));
		}

		if (vendorRepository.count() == 0) {
			seedVendor("Aspen Pharmacare", "1997/000000/07", "Pharmaceuticals", "ACTIVE", 5,
					"Primary EDL medicine supplier");
			seedVendor("Surgical Solutions SA", "2012/045612/07", "Medical devices", "ACTIVE", 4,
					"Theatre consumables and instruments");
			seedVendor("City of Mbombela Utilities", "MUN-MBOM-001", "Municipal services", "ACTIVE", 3,
					"Water, electricity, and rates billing");
		}

		if (budgetForecastRepository.count() == 0) {
			seedForecast("2026/27 Q1", "Pharmacy", new BigDecimal("625000.00"), new BigDecimal("610000.00"),
					new BigDecimal("498000.00"), -20.3, "Underspend on delayed tender award");
			seedForecast("2026/27 Q1", "Theatre", new BigDecimal("1200000.00"), new BigDecimal("1185000.00"),
					new BigDecimal("1102000.00"), -8.2, "Elective list recovery on track");
			seedForecast("2026/27 Q1", "Outpatients", new BigDecimal("450000.00"), new BigDecimal("470000.00"),
					new BigDecimal("462500.00"), 2.8, "Higher walk-in volumes than planned");
		}

		if (fixedAssetRepository.count() == 0) {
			seedAsset("RFH-RAD-CT-01", "64-slice CT scanner", "Medical equipment", today.minusYears(3),
					new BigDecimal("18500000.00"), new BigDecimal("11200000.00"), "ACTIVE", "Radiology");
			seedAsset("RFH-THTR-VENT-12", "Anaesthetic workstation", "Medical equipment", today.minusYears(1),
					new BigDecimal("485000.00"), new BigDecimal("412000.00"), "ACTIVE", "Theatre");
			seedAsset("RFH-FAC-GEN-02", "Backup diesel generator 500kVA", "Plant & machinery", today.minusYears(5),
					new BigDecimal("2100000.00"), new BigDecimal("840000.00"), "ACTIVE", "Facilities");
		}
	}

	private void seedInvoice(
			Long patientId,
			String patientName,
			String classification,
			String medicalScheme,
			BigDecimal amount,
			BigDecimal amountPaid,
			String status,
			LocalDate invoiceDate,
			LocalDate dueDate,
			String reference,
			String notes) {
		PatientInvoice invoice = new PatientInvoice();
		invoice.setPatientId(patientId);
		invoice.setPatientName(patientName);
		invoice.setClassification(classification);
		invoice.setMedicalScheme(medicalScheme);
		invoice.setAmount(amount);
		invoice.setAmountPaid(amountPaid);
		invoice.setBalance(amount.subtract(amountPaid));
		invoice.setStatus(status);
		invoice.setInvoiceDate(invoiceDate);
		invoice.setDueDate(dueDate);
		invoice.setReferenceNumber(reference);
		invoice.setNotes(notes);
		patientInvoiceRepository.save(invoice);
	}

	private void seedDebt(
			String category,
			String name,
			BigDecimal amount,
			String ageBucket,
			String status,
			String notes) {
		DebtAccount debt = new DebtAccount();
		debt.setDebtorCategory(category);
		debt.setDebtorName(name);
		debt.setAmount(amount);
		debt.setAgeBucket(ageBucket);
		debt.setStatus(status);
		debt.setNotes(notes);
		debtAccountRepository.save(debt);
	}

	private void seedIrregular(
			String reference,
			String category,
			BigDecimal amount,
			String description,
			String department,
			String status,
			LocalDate reportedDate) {
		IrregularExpenditure item = new IrregularExpenditure();
		item.setReferenceNumber(reference);
		item.setCategory(category);
		item.setAmount(amount);
		item.setDescription(description);
		item.setDepartment(department);
		item.setStatus(status);
		item.setReportedDate(reportedDate);
		irregularExpenditureRepository.save(item);
	}

	private void seedRequisition(
			String reference,
			String requestedBy,
			String department,
			String description,
			BigDecimal amount,
			String status,
			String vendorName,
			Instant approvedAt) {
		PurchaseRequisition req = new PurchaseRequisition();
		req.setReferenceNumber(reference);
		req.setRequestedBy(requestedBy);
		req.setDepartment(department);
		req.setDescription(description);
		req.setEstimatedAmount(amount);
		req.setStatus(status);
		req.setVendorName(vendorName);
		req.setApprovedAt(approvedAt);
		purchaseRequisitionRepository.save(req);
	}

	private void seedVendor(
			String name,
			String registration,
			String category,
			String status,
			Integer score,
			String notes) {
		Vendor vendor = new Vendor();
		vendor.setName(name);
		vendor.setRegistrationNumber(registration);
		vendor.setCategory(category);
		vendor.setStatus(status);
		vendor.setPerformanceScore(score);
		vendor.setNotes(notes);
		vendorRepository.save(vendor);
	}

	private void seedForecast(
			String period,
			String department,
			BigDecimal budget,
			BigDecimal forecast,
			BigDecimal actual,
			double variance,
			String notes) {
		BudgetForecast row = new BudgetForecast();
		row.setPeriodLabel(period);
		row.setDepartment(department);
		row.setBudgetAmount(budget);
		row.setForecastAmount(forecast);
		row.setActualAmount(actual);
		row.setVariancePercent(variance);
		row.setNotes(notes);
		budgetForecastRepository.save(row);
	}

	private void seedAsset(
			String tag,
			String name,
			String category,
			LocalDate acquisitionDate,
			BigDecimal cost,
			BigDecimal bookValue,
			String status,
			String department) {
		FixedAsset asset = new FixedAsset();
		asset.setAssetTag(tag);
		asset.setName(name);
		asset.setCategory(category);
		asset.setAcquisitionDate(acquisitionDate);
		asset.setAcquisitionCost(cost);
		asset.setBookValue(bookValue);
		asset.setStatus(status);
		asset.setDepartment(department);
		fixedAssetRepository.save(asset);
	}

	private void seedAudit(String role, String email, String action, String resourceType, String resourceId, String detail) {
		AuditEvent event = new AuditEvent();
		event.setActorRole(role);
		event.setActorEmail(email);
		event.setAction(action);
		event.setResourceType(resourceType);
		event.setResourceId(resourceId);
		event.setDetail(detail);
		auditEventRepository.save(event);
	}

	private InternAssignment seedAssignment(
			String name,
			String email,
			String programme,
			String department,
			Long supervisorId,
			LocalDate start,
			LocalDate end,
			String status) {
		InternAssignment a = new InternAssignment();
		a.setInternName(name);
		a.setInternEmail(email);
		a.setProgramme(programme);
		a.setDepartment(department);
		a.setSupervisorDoctorId(supervisorId);
		a.setStartDate(start);
		a.setEndDate(end);
		a.setStatus(status);
		return internAssignmentRepository.save(a);
	}

	private void seedSupervision(Long assignmentId, LocalDate date, String topic, double hours, String notes) {
		SupervisionLog log = new SupervisionLog();
		log.setAssignmentId(assignmentId);
		log.setSessionDate(date);
		log.setTopic(topic);
		log.setHours(hours);
		log.setSupervisorNotes(notes);
		log.setInternAcknowledged(false);
		supervisionLogRepository.save(log);
	}

	private void seedPmds(
			String staffName,
			String staffRole,
			int year,
			boolean agreement,
			boolean mid,
			boolean annual,
			String status,
			String notes) {
		PmdsCycle cycle = new PmdsCycle();
		cycle.setStaffName(staffName);
		cycle.setStaffRole(staffRole);
		cycle.setCycleYear(year);
		cycle.setAgreementSigned(agreement);
		cycle.setMidYearReview(mid);
		cycle.setAnnualReview(annual);
		cycle.setStatus(status);
		cycle.setNotes(notes);
		pmdsCycleRepository.save(cycle);
	}

	private void seedWaitlist(
			Long patientId,
			String procedureName,
			String specialty,
			String urgency,
			LocalDate decisionToTreatDate,
			int ttgDays,
			String status,
			String scheduledDate,
			String notes) {
		SurgicalWaitlistEntry entry = new SurgicalWaitlistEntry();
		entry.setPatientId(patientId);
		entry.setProcedureName(procedureName);
		entry.setSpecialty(specialty);
		entry.setUrgency(urgency);
		entry.setDecisionToTreatDate(decisionToTreatDate);
		entry.setTtgDays(ttgDays);
		entry.setStatus(status);
		entry.setScheduledDate(scheduledDate);
		entry.setNotes(notes);
		waitlistRepository.save(entry);
	}

	private void seedHeroSlide(String title, String subtitle, String ctaLabel, String ctaLink, int sortOrder) {
		HeroSlide slide = new HeroSlide();
		slide.setTitle(title);
		slide.setSubtitle(subtitle);
		slide.setCtaLabel(ctaLabel);
		slide.setCtaLink(ctaLink);
		slide.setSortOrder(sortOrder);
		slide.setActive(true);
		heroSlideRepository.save(slide);
	}

	private void seedMedicine(String name, String strength, String form, int quantity, int reorderLevel) {
		seedMedicine(name, strength, form, quantity, reorderLevel, null, null, null, null, null);
	}

	private void seedMedicine(
			String name,
			String strength,
			String form,
			int quantity,
			int reorderLevel,
			LocalDate expiryDate,
			Boolean criticalEssential,
			BigDecimal unitCost,
			String supplierName,
			Instant stockoutSince) {
		Medicine medicine = new Medicine();
		medicine.setName(name);
		medicine.setStrength(strength);
		medicine.setForm(form);
		medicine.setQuantity(quantity);
		medicine.setReorderLevel(reorderLevel);
		medicine.setExpiryDate(expiryDate);
		medicine.setCriticalEssential(criticalEssential);
		medicine.setUnitCost(unitCost);
		medicine.setSupplierName(supplierName);
		medicine.setStockoutSince(stockoutSince);
		medicineRepository.save(medicine);
	}

	private void seedPharmacyModule() {
		if (pharmacyQueueTicketRepository.count() > 0) {
			return;
		}

		Instant now = Instant.now();

		// Reflect RFH 3–4h wait challenge with realistic queue times
		seedQueueTicket("RX-1001", "Thandi Nkosi", "WAITING", "ROUTINE",
				now.minus(210, ChronoUnit.MINUTES), null, null, null);
		seedQueueTicket("RX-1002", "Johan van Wyk", "WAITING", "STAT",
				now.minus(95, ChronoUnit.MINUTES), null, null, null);
		seedQueueTicket("RX-1003", "Nomsa Dlamini", "IN_PROGRESS", "ROUTINE",
				now.minus(185, ChronoUnit.MINUTES), now.minus(25, ChronoUnit.MINUTES), null, "Lerato Mahlangu");
		seedQueueTicket("RX-1004", "Sipho Mabena", "DISPENSED", "ROUTINE",
				now.minus(6, ChronoUnit.HOURS), now.minus(3, ChronoUnit.HOURS), now.minus(2, ChronoUnit.HOURS).minus(20, ChronoUnit.MINUTES), "Lerato Mahlangu");
		seedQueueTicket("RX-1005", "Grace Shabangu", "DISPENSED", "STAT",
				now.minus(4, ChronoUnit.HOURS), now.minus(3, ChronoUnit.HOURS).minus(40, ChronoUnit.MINUTES),
				now.minus(3, ChronoUnit.HOURS).minus(15, ChronoUnit.MINUTES), "Pieter Botha");
		seedQueueTicket("RX-1006", "Andile Zwane", "WAITING", "ROUTINE",
				now.minus(240, ChronoUnit.MINUTES), null, null, null);
		seedQueueTicket("RX-1007", "Maria Coetzee", "DISPENSED", "ROUTINE",
				now.minus(8, ChronoUnit.HOURS), now.minus(5, ChronoUnit.HOURS), now.minus(4, ChronoUnit.HOURS).minus(10, ChronoUnit.MINUTES), "Pieter Botha");
		seedQueueTicket("RX-1008", "Bongani Sithole", "CANCELLED", "ROUTINE",
				now.minus(5, ChronoUnit.HOURS), null, now.minus(4, ChronoUnit.HOURS), null);

		seedIntervention("AMS_DEESCALATION",
				"De-escalated empiric vancomycin to targeted flucloxacillin after culture results.",
				"pharmacy@rfh.gov.za", now.minus(2, ChronoUnit.DAYS), new BigDecimal("1850.00"));
		seedIntervention("GOOD_CATCH",
				"Intercepted duplicate opioid prescription — prevented potential overdose.",
				"pharmacy@rfh.gov.za", now.minus(1, ChronoUnit.DAYS), new BigDecimal("4200.00"));
		seedIntervention("DOSE_ADJUST",
				"Renal dose adjustment for enoxaparin in CKD stage 4 patient.",
				"pharmacy@rfh.gov.za", now.minus(3, ChronoUnit.DAYS), new BigDecimal("650.00"));
		seedIntervention("IV_TO_PO",
				"Switched IV ciprofloxacin to oral after clinical stability — bed-day saving.",
				"pharmacy@rfh.gov.za", now.minus(4, ChronoUnit.DAYS), new BigDecimal("980.00"));
		seedIntervention("FORMULARY",
				"Substituted non-formulary brand antihypertensive with EML generic equivalent.",
				"pharmacy@rfh.gov.za", now.minus(5, ChronoUnit.DAYS), new BigDecimal("320.00"));
		seedIntervention("OTHER",
				"Patient counselling on warfarin INR monitoring and diet interactions.",
				"pharmacy@rfh.gov.za", now.minus(6, ChronoUnit.DAYS), null);

		seedFinancePeriod("2025-Q4", new BigDecimal("620000.00"), new BigDecimal("598500.00"),
				4120, 880, 6, 42);
		seedFinancePeriod("2026-Q1", new BigDecimal("650000.00"), new BigDecimal("612400.00"),
				3850, 720, 11, 48);

		seedSupplierScore("Lowveld Medical Supplies", 94.0, 97.0, 28, "LOW",
				"Reliable chronic pack deliveries; strong fill rate.");
		seedSupplierScore("AfriMed Distributors", 81.0, 88.0, 45, "MEDIUM",
				"Occasional cold-chain delays on biologics.");
		seedSupplierScore("Provincial Depot Delay Co", 52.0, 70.0, 95, "HIGH",
				"Chronic late payments and depot backlog — insulin/critical stock at risk.");

		enrichPharmacyMedicines();
	}

	private void enrichPharmacyMedicines() {
		List<Medicine> medicines = medicineRepository.findAll();
		for (Medicine m : medicines) {
			boolean changed = false;
			String name = m.getName() == null ? "" : m.getName().toLowerCase();
			if (m.getExpiryDate() == null) {
				if (name.contains("ibuprofen")) {
					m.setExpiryDate(LocalDate.now().plusDays(45));
				} else if (name.contains("amoxicillin") || name.contains("ceftriaxone")) {
					m.setExpiryDate(LocalDate.now().plusDays(60));
				} else {
					m.setExpiryDate(LocalDate.now().plusMonths(12));
				}
				changed = true;
			}
			if (m.getCriticalEssential() == null) {
				m.setCriticalEssential(name.contains("amoxicillin")
						|| name.contains("insulin")
						|| name.contains("ceftriaxone")
						|| name.contains("metformin"));
				changed = true;
			}
			if (m.getUnitCost() == null) {
				m.setUnitCost(name.contains("insulin") ? new BigDecimal("185.00") : new BigDecimal("1.50"));
				changed = true;
			}
			if (m.getSupplierName() == null || m.getSupplierName().isBlank()) {
				m.setSupplierName(name.contains("insulin") ? "Provincial Depot Delay Co" : "Lowveld Medical Supplies");
				changed = true;
			}
			if (m.getQuantity() != null && m.getQuantity() <= 0 && m.getStockoutSince() == null) {
				m.setStockoutSince(Instant.now().minus(3, ChronoUnit.DAYS));
				changed = true;
			}
			if (changed) {
				medicineRepository.save(m);
			}
		}

		// Ensure at least one stockout and one near-expiry critical item exist when DB already had basics
		if (medicines.stream().noneMatch(m -> m.getQuantity() != null && m.getQuantity() <= 0)) {
			if (!medicineRepository.existsByNameIgnoreCase("Insulin Glargine")) {
				seedMedicine("Insulin Glargine", "100U/mL", "Injection", 0, 20,
						LocalDate.now().plusMonths(6), true, new BigDecimal("185.00"),
						"Provincial Depot Delay Co", Instant.now().minus(5, ChronoUnit.DAYS));
			}
		}
		if (!medicineRepository.existsByNameIgnoreCase("Ceftriaxone")) {
			seedMedicine("Ceftriaxone", "1g", "Injection", 8, 25,
					LocalDate.now().plusDays(55), true, new BigDecimal("42.50"), "AfriMed Distributors", null);
		}
	}

	private void seedQueueTicket(
			String ticketNumber,
			String patientName,
			String status,
			String priority,
			Instant arrivedAt,
			Instant startedAt,
			Instant completedAt,
			String technicianName) {
		PharmacyQueueTicket ticket = new PharmacyQueueTicket();
		ticket.setTicketNumber(ticketNumber);
		ticket.setPatientName(patientName);
		ticket.setStatus(status);
		ticket.setPriority(priority);
		ticket.setArrivedAt(arrivedAt);
		ticket.setStartedAt(startedAt);
		ticket.setCompletedAt(completedAt);
		ticket.setTechnicianName(technicianName);
		pharmacyQueueTicketRepository.save(ticket);
	}

	private void seedIntervention(
			String type,
			String description,
			String pharmacistEmail,
			Instant createdAt,
			BigDecimal costAvoidance) {
		PharmacyClinicalIntervention intervention = new PharmacyClinicalIntervention();
		intervention.setInterventionType(type);
		intervention.setDescription(description);
		intervention.setPharmacistEmail(pharmacistEmail);
		intervention.setCreatedAt(createdAt);
		intervention.setCostAvoidanceAmount(costAvoidance);
		pharmacyClinicalInterventionRepository.save(intervention);
	}

	private void seedFinancePeriod(
			String label,
			BigDecimal budget,
			BigDecimal actual,
			int generic,
			int brand,
			int pendingInvoices,
			int paymentCycleDays) {
		PharmacyFinancePeriod period = new PharmacyFinancePeriod();
		period.setPeriodLabel(label);
		period.setBudgetAmount(budget);
		period.setActualSpend(actual);
		period.setGenericDispenseCount(generic);
		period.setBrandDispenseCount(brand);
		period.setInvoicePendingCount(pendingInvoices);
		period.setAvgPaymentCycleDays(paymentCycleDays);
		pharmacyFinancePeriodRepository.save(period);
	}

	private void seedSupplierScore(
			String name,
			double onTime,
			double accuracy,
			int paymentDays,
			String risk,
			String notes) {
		PharmacySupplierScore score = new PharmacySupplierScore();
		score.setSupplierName(name);
		score.setOnTimePercent(onTime);
		score.setOrderAccuracyPercent(accuracy);
		score.setPaymentCycleDays(paymentDays);
		score.setRiskRating(risk);
		score.setNotes(notes);
		pharmacySupplierScoreRepository.save(score);
	}

	private void seedVacancy(
			String title,
			String department,
			String specialty,
			String gradeOrRank,
			int postsApproved,
			int postsFilled,
			boolean critical,
			String status,
			String notes,
			int advertisedDaysAgo,
			Integer filledDaysAgo) {
		Vacancy vacancy = new Vacancy();
		vacancy.setTitle(title);
		vacancy.setDepartment(department);
		vacancy.setSpecialty(specialty);
		vacancy.setGradeOrRank(gradeOrRank);
		vacancy.setPostsApproved(postsApproved);
		vacancy.setPostsFilled(postsFilled);
		vacancy.setCritical(critical);
		vacancy.setStatus(status);
		vacancy.setNotes(notes);
		vacancy.setAdvertisedAt(Instant.now().minus(advertisedDaysAgo, ChronoUnit.DAYS));
		if (filledDaysAgo != null) {
			vacancy.setFilledAt(Instant.now().minus(filledDaysAgo, ChronoUnit.DAYS));
		}
		vacancyRepository.save(vacancy);
	}

	private void backfillVacancyAdvertisedAt() {
		for (Vacancy vacancy : vacancyRepository.findAll()) {
			boolean changed = false;
			if (vacancy.getAdvertisedAt() == null) {
				Instant base = vacancy.getCreatedAt() == null
						? Instant.now().minus(60, ChronoUnit.DAYS)
						: vacancy.getCreatedAt().minus(30, ChronoUnit.DAYS);
				vacancy.setAdvertisedAt(base);
				changed = true;
			}
			if (vacancy.getFilledAt() == null
					&& vacancy.getPostsFilled() != null
					&& vacancy.getPostsFilled() > 0
					&& vacancy.getAdvertisedAt() != null) {
				vacancy.setFilledAt(vacancy.getAdvertisedAt().plus(35, ChronoUnit.DAYS));
				changed = true;
			}
			if (changed) {
				vacancyRepository.save(vacancy);
			}
		}
	}

	private void seedHrModule() {
		if (hrEmployeeRepository.count() > 0) {
			return;
		}

		LocalDate today = LocalDate.now();
		HrEmployee nurse = seedEmployee(
				"RFH-N-1001", "Thandi", "Mokoena", "thandi.mokoena@rfh.gov.za", "0821111001",
				"Nursing", "Professional Nurse", "PERMANENT", today.minusYears(8), null, "ACTIVE",
				"NUR123456", "BCur Nursing", "Sr. Nkosi", 8, today.minusYears(34));
		HrEmployee medicine = seedEmployee(
				"RFH-M-2001", "Sipho", "Dlamini", "sipho.dlamini@rfh.gov.za", "0821111002",
				"Medicine", "Medical Officer", "PERMANENT", today.minusYears(5), null, "ACTIVE",
				"MP7654321", "MBChB", "Dr. Patel", 5, today.minusYears(36));
		seedEmployee(
				"RFH-T-3001", "Lerato", "Nkosi", "lerato.nkosi@rfh.gov.za", "0821111003",
				"Theatre", "Theatre Scrub Nurse", "PERMANENT", today.minusYears(3), null, "ACTIVE",
				null, "Diploma in Nursing", "Sr. Mokoena", 3, today.minusYears(29));
		HrEmployee pharmacy = seedEmployee(
				"RFH-P-4001", "Johan", "Botha", "johan.botha@rfh.gov.za", "0821111004",
				"Pharmacy", "Pharmacist", "PERMANENT", today.minusYears(12), null, "ACTIVE",
				"PHARM8899", "BPharm", "Ms. Sibiya", 12, today.minusYears(41));
		HrEmployee admin = seedEmployee(
				"RFH-A-5001", "Nomsa", "Khumalo", "nomsa.khumalo@rfh.gov.za", "0821111005",
				"Admin", "HR Officer", "PERMANENT", today.minusYears(6), null, "ACTIVE",
				null, "BAdmin HR", "Director Corporate", 6, today.minusYears(38));
		HrEmployee radiology = seedEmployee(
				"RFH-R-6001", "Ayanda", "Zulu", "ayanda.zulu@rfh.gov.za", "0821111006",
				"Radiology", "Radiographer", "CONTRACT", today.minusYears(2), today.plusYears(1), "ACTIVE",
				"RAD445566", "BRad Diagnostic", "Mr. Pillay", 2, today.minusYears(27));
		HrEmployee nearRetire = seedEmployee(
				"RFH-N-1002", "Grace", "van Wyk", "grace.vanwyk@rfh.gov.za", "0821111007",
				"Nursing", "Operational Manager Nursing", "PERMANENT", today.minusYears(28), null, "ACTIVE",
				"NUR998877", "BCur; Nursing Management", "Nursing Director", 28, today.minusYears(62));
		seedEmployee(
				"RFH-M-2002", "Peter", "Mahlangu", "peter.mahlangu@rfh.gov.za", "0821111008",
				"Medicine", "Clinical Associate", "CONTRACT", today.minusYears(4), today.minusMonths(2), "RESIGNED",
				null, "BClinical Medical Practice", "Dr. Dlamini", 4, today.minusYears(32));

		seedLeave(nurse.getId(), "ANNUAL", today.plusDays(14), today.plusDays(18), 5,
				"Family travel", "PENDING", null);
		seedLeave(pharmacy.getId(), "SICK", today.minusDays(10), today.minusDays(8), 3,
				"Influenza", "APPROVED", "Nomsa Khumalo");
		seedLeave(admin.getId(), "STUDY", today.plusDays(40), today.plusDays(44), 5,
				"Labour relations short course", "APPROVED", "Corporate Director");

		List<Vacancy> vacancies = vacancyRepository.findAll();
		Long nephVacancyId = vacancies.stream()
				.filter(v -> v.getTitle() != null && v.getTitle().toLowerCase().contains("nephrolog"))
				.map(Vacancy::getId)
				.findFirst()
				.orElse(vacancies.isEmpty() ? null : vacancies.get(0).getId());
		Long oncologyVacancyId = vacancies.stream()
				.filter(v -> v.getTitle() != null && v.getTitle().toLowerCase().contains("oncolog"))
				.map(Vacancy::getId)
				.findFirst()
				.orElse(null);
		Long theatreVacancyId = vacancies.stream()
				.filter(v -> v.getTitle() != null && v.getTitle().toLowerCase().contains("theatre"))
				.map(Vacancy::getId)
				.findFirst()
				.orElse(null);

		seedApplicant(nephVacancyId, "Fatima", "Hassan", "fatima.hassan@email.com", "0832001001",
				"Specialist Nephrologist", "Nephrology", "SHORTLISTED", "DPSA", "Strong dialysis experience");
		seedApplicant(oncologyVacancyId, "Michael", "Naidoo", "michael.naidoo@email.com", "0832001002",
				"Specialist Oncologist", "Medical Oncology", "APPLIED", "LinkedIn", "Willing to relocate to Mbombela");
		seedApplicant(theatreVacancyId, "Busisiwe", "Ndlovu", "busisiwe.ndlovu@email.com", "0832001003",
				"Theatre Professional Nurse", "Perioperative Nursing", "TALENT_POOL", "Walk-in", "Previous CSSD experience");
		seedApplicant(null, "Kabelo", "Molefe", "kabelo.molefe@email.com", "0832001004",
				"Medical Officer", "Internal Medicine", "TALENT_POOL", "Referral", "Available for locum or permanent");

		seedOnboarding(radiology.getId(), "Ayanda Zulu", "Radiology", "IN_PROGRESS",
				true, true, true, false, Instant.now().minus(10, ChronoUnit.DAYS), null);
		seedOnboarding(medicine.getId(), "Sipho Dlamini", "Medicine", "COMPLETED",
				true, true, true, true, Instant.now().minus(120, ChronoUnit.DAYS), Instant.now().minus(90, ChronoUnit.DAYS));

		TrainingCourse cpd = seedCourse(
				"Infection Prevention & Control CPD", "CPD", "DoH Mpumalanga",
				today.plusDays(21), 5, 40, "OPEN");
		TrainingCourse mandatory = seedCourse(
				"POPIA and Patient Confidentiality", "MANDATORY", "RFH Corporate Services",
				today.plusDays(7), 2, 80, "OPEN");
		TrainingCourse wsp = seedCourse(
				"Workplace Skills Plan — Clinical Leadership", "WSP", "HWSETA / RFH",
				today.plusDays(45), 8, 25, "PLANNED");

		seedEnrolment(cpd.getId(), nurse.getId(), "Thandi Mokoena", "REGISTERED", null);
		seedEnrolment(mandatory.getId(), admin.getId(), "Nomsa Khumalo", "ATTENDED", 88);
		seedEnrolment(wsp.getId(), nearRetire.getId(), "Grace van Wyk", "REGISTERED", null);

		seedMorale("2025 Q4 staff pulse", 2.8, 64, null,
				"Workload and vacancy pressure reflected in lower scores.",
				Instant.now().minus(120, ChronoUnit.DAYS));
		seedMorale("2026 Q1 staff pulse", 3.4, 71, null,
				"Improvement after overtime relief and recruitment drive.",
				Instant.now().minus(20, ChronoUnit.DAYS));
	}

	private HrEmployee seedEmployee(
			String employeeNumber,
			String firstName,
			String lastName,
			String email,
			String phone,
			String department,
			String jobTitle,
			String category,
			LocalDate startDate,
			LocalDate endDate,
			String status,
			String hpcsa,
			String qualifications,
			String manager,
			int years,
			LocalDate dob) {
		HrEmployee e = new HrEmployee();
		e.setEmployeeNumber(employeeNumber);
		e.setFirstName(firstName);
		e.setLastName(lastName);
		e.setEmail(email);
		e.setPhone(phone);
		e.setDepartment(department);
		e.setJobTitle(jobTitle);
		e.setEmploymentCategory(category);
		e.setStartDate(startDate);
		e.setEndDate(endDate);
		e.setStatus(status);
		e.setHpcsaNumber(hpcsa);
		e.setQualifications(qualifications);
		e.setManagerName(manager);
		e.setYearsOfService(years);
		e.setDateOfBirth(dob);
		return hrEmployeeRepository.save(e);
	}

	private void seedLeave(
			Long employeeId,
			String leaveType,
			LocalDate start,
			LocalDate end,
			int days,
			String reason,
			String status,
			String approver) {
		LeaveRequest leave = new LeaveRequest();
		leave.setEmployeeId(employeeId);
		leave.setLeaveType(leaveType);
		leave.setStartDate(start);
		leave.setEndDate(end);
		leave.setDays(days);
		leave.setReason(reason);
		leave.setStatus(status);
		leave.setApproverName(approver);
		leaveRequestRepository.save(leave);
	}

	private void seedApplicant(
			Long vacancyId,
			String firstName,
			String lastName,
			String email,
			String phone,
			String appliedPost,
			String specialty,
			String status,
			String source,
			String notes) {
		HrApplicant a = new HrApplicant();
		a.setVacancyId(vacancyId);
		a.setFirstName(firstName);
		a.setLastName(lastName);
		a.setEmail(email);
		a.setPhone(phone);
		a.setAppliedPost(appliedPost);
		a.setSpecialty(specialty);
		a.setStatus(status);
		a.setSource(source);
		a.setNotes(notes);
		a.setAppliedAt(Instant.now().minus(7, ChronoUnit.DAYS));
		hrApplicantRepository.save(a);
	}

	private void seedOnboarding(
			Long employeeId,
			String employeeName,
			String department,
			String status,
			boolean documents,
			boolean orientation,
			boolean account,
			boolean hpcsa,
			Instant startedAt,
			Instant completedAt) {
		OnboardingChecklist c = new OnboardingChecklist();
		c.setEmployeeId(employeeId);
		c.setEmployeeName(employeeName);
		c.setDepartment(department);
		c.setStatus(status);
		c.setDocumentsCollected(documents);
		c.setOrientationScheduled(orientation);
		c.setAccountCreated(account);
		c.setHpcsaVerified(hpcsa);
		c.setStartedAt(startedAt);
		c.setCompletedAt(completedAt);
		onboardingChecklistRepository.save(c);
	}

	private TrainingCourse seedCourse(
			String title,
			String category,
			String provider,
			LocalDate scheduledDate,
			int cpdPoints,
			int capacity,
			String status) {
		TrainingCourse c = new TrainingCourse();
		c.setTitle(title);
		c.setCategory(category);
		c.setProvider(provider);
		c.setScheduledDate(scheduledDate);
		c.setCpdPoints(cpdPoints);
		c.setCapacity(capacity);
		c.setStatus(status);
		return trainingCourseRepository.save(c);
	}

	private void seedEnrolment(
			Long courseId,
			Long employeeId,
			String employeeName,
			String attendance,
			Integer score) {
		TrainingEnrolment e = new TrainingEnrolment();
		e.setCourseId(courseId);
		e.setEmployeeId(employeeId);
		e.setEmployeeName(employeeName);
		e.setAttendance(attendance);
		e.setEvaluationScore(score);
		trainingEnrolmentRepository.save(e);
	}

	private void seedMorale(
			String periodLabel,
			double score,
			int responseCount,
			String department,
			String notes,
			Instant capturedAt) {
		MoralePulse p = new MoralePulse();
		p.setPeriodLabel(periodLabel);
		p.setScore(score);
		p.setResponseCount(responseCount);
		p.setDepartment(department);
		p.setNotes(notes);
		p.setCapturedAt(capturedAt);
		moralePulseRepository.save(p);
	}

	private void seedPayrollModule() {
		LocalDate today = LocalDate.now();

		if (payrollPeriodRepository.count() == 0) {
			PayrollPeriod period = new PayrollPeriod();
			period.setPeriodLabel(today.getYear() + "-" + String.format("%02d", today.getMonthValue()));
			period.setStartDate(today.withDayOfMonth(1));
			period.setEndDate(today.withDayOfMonth(today.lengthOfMonth()));
			period.setStatus("OPEN");
			period.setBudgetAmount(new BigDecimal("18500000.00"));
			period.setActualAmount(new BigDecimal("17245000.00"));
			period.setOvertimeAmount(new BigDecimal("986500.00"));
			payrollPeriodRepository.save(period);
		}

		if (payrollCostCentreRepository.count() == 0) {
			seedPayrollCostCentre("PAY-OPD", "OPD", new BigDecimal("4200000.00"), new BigDecimal("3985000.00"),
					85, 78, new BigDecimal("185000.00"));
			seedPayrollCostCentre("PAY-ICU", "ICU", new BigDecimal("5600000.00"), new BigDecimal("5428000.00"),
					62, 58, new BigDecimal("312000.00"));
			seedPayrollCostCentre("PAY-PHARM", "Pharmacy", new BigDecimal("2100000.00"), new BigDecimal("2015000.00"),
					28, 26, new BigDecimal("64000.00"));
			seedPayrollCostCentre("PAY-THTR", "Theatre", new BigDecimal("4800000.00"), new BigDecimal("4612000.00"),
					48, 44, new BigDecimal("278000.00"));
			seedPayrollCostCentre("PAY-ADM", "Admin", new BigDecimal("1800000.00"), new BigDecimal("1205000.00"),
					35, 32, new BigDecimal("47500.00"));
		}

		if (timesheetEntryRepository.count() == 0) {
			seedTimesheet("EMP-1042", "N. Mabunda", "ICU", today.minusDays(1), "NIGHT", 12.0, 2.0, "APPROVED");
			seedTimesheet("EMP-1188", "P. Sibiya", "Theatre", today.minusDays(1), "MORNING", 8.0, 1.5, "SUBMITTED");
			seedTimesheet("EMP-1201", "L. Khoza", "OPD", today.minusDays(2), "EVENING", 8.0, 0.0, "APPROVED");
			seedTimesheet("EMP-1310", "S. Dlamini", "Pharmacy", today.minusDays(2), "MORNING", 8.0, 0.5, "DRAFT");
			seedTimesheet("EMP-1422", "T. Nkosi", "ICU", today.minusDays(3), "EMERGENCY", 10.0, 4.0, "APPROVED");
			seedTimesheet("EMP-1505", "M. Zwane", "Admin", today.minusDays(3), "MORNING", 8.0, 0.0, "REJECTED");
		}

		if (ghostWorkerCaseRepository.count() == 0) {
			seedGhostCase("GW-RFH-2026-001", "EMP-2099", "J. Mahlangu", "OPD", 78, "FLAGGED",
					new BigDecimal("48500.00"), "No biometric clock-in for three consecutive pay periods");
			seedGhostCase("GW-RFH-2026-002", "EMP-2144", "R. Botha", "Theatre", 64, "UNDER_REVIEW",
					new BigDecimal("67200.00"), "Persal number active but ward supervisor reports vacant post");
			seedGhostCase("GW-RFH-2026-003", "EMP-1880", "A. Mokoena", "Pharmacy", 42, "CLEARED",
					new BigDecimal("0.00"), "Leave without pay confirmed; payroll adjustment applied");
		}

		if (staffCertificationRepository.count() == 0) {
			seedCertification("EMP-1042", "N. Mabunda", "SANC", "SANC-442189", today.plusMonths(8), "VALID", "ICU");
			seedCertification("EMP-1188", "P. Sibiya", "HPCSA", "MP-078521", today.plusDays(45), "EXPIRING", "Theatre");
			seedCertification("EMP-1310", "S. Dlamini", "OTHER", "SAPC-99102", today.plusYears(1), "VALID", "Pharmacy");
			seedCertification("EMP-1422", "T. Nkosi", "SANC", "SANC-510334", today.plusMonths(14), "VALID", "ICU");
		}

		if (payrollAuditEventRepository.count() == 0) {
			seedPayrollAudit("payroll@rfh.gov.za", "SEED", "PayrollPeriod", "1", "Open payroll period created");
			seedPayrollAudit("payroll@rfh.gov.za", "SEED", "PayrollCostCentre", "bulk", "Five payroll cost centres loaded");
			seedPayrollAudit("payroll@rfh.gov.za", "CREATE", "GhostWorkerCase", "GW-RFH-2026-001", "Ghost worker case flagged");
			seedPayrollAudit("admin@rfh.gov.za", "REVIEW", "StaffCertification", "EMP-1188", "HPCSA licence nearing expiry");
		}
	}

	private void seedPayrollCostCentre(
			String code,
			String department,
			BigDecimal budgetAnnual,
			BigDecimal actualYtd,
			int fteApproved,
			int fteFilled,
			BigDecimal overtimeYtd) {
		PayrollCostCentre centre = new PayrollCostCentre();
		centre.setCode(code);
		centre.setDepartment(department);
		centre.setBudgetAnnual(budgetAnnual);
		centre.setActualYtd(actualYtd);
		centre.setFteApproved(fteApproved);
		centre.setFteFilled(fteFilled);
		centre.setOvertimeYtd(overtimeYtd);
		payrollCostCentreRepository.save(centre);
	}

	private void seedTimesheet(
			String employeeNumber,
			String employeeName,
			String department,
			LocalDate workDate,
			String shiftType,
			double hoursWorked,
			double overtimeHours,
			String status) {
		TimesheetEntry entry = new TimesheetEntry();
		entry.setEmployeeNumber(employeeNumber);
		entry.setEmployeeName(employeeName);
		entry.setDepartment(department);
		entry.setWorkDate(workDate);
		entry.setShiftType(shiftType);
		entry.setHoursWorked(hoursWorked);
		entry.setOvertimeHours(overtimeHours);
		entry.setStatus(status);
		timesheetEntryRepository.save(entry);
	}

	private void seedGhostCase(
			String reference,
			String employeeNumber,
			String employeeName,
			String department,
			int riskScore,
			String status,
			BigDecimal amountAtRisk,
			String notes) {
		GhostWorkerCase item = new GhostWorkerCase();
		item.setReferenceNumber(reference);
		item.setEmployeeNumber(employeeNumber);
		item.setEmployeeName(employeeName);
		item.setDepartment(department);
		item.setRiskScore(riskScore);
		item.setStatus(status);
		item.setAmountAtRisk(amountAtRisk);
		item.setNotes(notes);
		ghostWorkerCaseRepository.save(item);
	}

	private void seedCertification(
			String employeeNumber,
			String employeeName,
			String certType,
			String licenceNumber,
			LocalDate expiryDate,
			String status,
			String department) {
		StaffCertification cert = new StaffCertification();
		cert.setEmployeeNumber(employeeNumber);
		cert.setEmployeeName(employeeName);
		cert.setCertType(certType);
		cert.setLicenceNumber(licenceNumber);
		cert.setExpiryDate(expiryDate);
		cert.setStatus(status);
		cert.setDepartment(department);
		staffCertificationRepository.save(cert);
	}

	private void seedPayrollAudit(
			String actorEmail,
			String action,
			String entityType,
			String entityId,
			String detail) {
		PayrollAuditEvent event = new PayrollAuditEvent();
		event.setActorEmail(actorEmail);
		event.setAction(action);
		event.setEntityType(entityType);
		event.setEntityId(entityId);
		event.setDetail(detail);
		payrollAuditEventRepository.save(event);
	}

	private void seedProcurementModule() {
		if (procContractRepository.count() > 0) {
			return;
		}
		// Incomplete prior seed (e.g. reserved-column failure) — clear and reseed.
		if (procVendorRepository.count() > 0) {
			procAiInsightRepository.deleteAll();
			procRiskAlertRepository.deleteAll();
			procLedgerEventRepository.deleteAll();
			procSpendRecordRepository.deleteAll();
			procBidRepository.deleteAll();
			procTenderRepository.deleteAll();
			procVendorRepository.deleteAll();
		}

		ProcVendor v1 = seedProcVendor(
				"Lowveld Medical Supplies",
				"2018/441200/07",
				"MAAA0123456",
				"Medical consumables",
				"supplies@lowveldmed.co.za",
				"013 555 2100",
				"ACTIVE",
				"LOW",
				88, 90, 86, 82, 92,
				"Reliable chronic medicine and consumables partner");
		ProcVendor v2 = seedProcVendor(
				"Ehlanzeni Facilities Tech",
				"2015/220811/07",
				"MAAA0987654",
				"Facilities & engineering",
				"contracts@ehlanzenitech.co.za",
				"013 555 3344",
				"PREQUALIFIED",
				"MEDIUM",
				74, 70, 78, 76, 80,
				"HVAC and theatre plant maintenance");
		ProcVendor v3 = seedProcVendor(
				"Nkomazi Logistics Group",
				"2012/118900/07",
				"MAAA0555123",
				"Logistics",
				"ops@nkomazilogistics.co.za",
				"013 555 7788",
				"REGISTERED",
				"HIGH",
				58, 55, 62, 60, 48,
				"Late deliveries flagged on two recent consignments");

		Instant now = Instant.now();
		ProcTender published = new ProcTender();
		published.setReferenceNumber("TND-RFH-2026-041");
		published.setTitle("Surgical consumables framework agreement");
		published.setDescription("Supply of sterile surgical packs, gloves, and theatre drapes for RFH theatres.");
		published.setCategory("Medical consumables");
		published.setEstimatedValue(new BigDecimal("2450000.00"));
		published.setEvaluationCriteria("{\"technical\":60,\"price\":40,\"localContent\":true}");
		published.setStatus("PUBLISHED");
		published.setPublishedAt(now.minus(5, ChronoUnit.DAYS));
		published.setClosingAt(now.plus(9, ChronoUnit.DAYS));
		published.setCreatedBy("procurement@rfh.gov.za");
		published = procTenderRepository.save(published);

		ProcTender evaluation = new ProcTender();
		evaluation.setReferenceNumber("TND-RFH-2026-028");
		evaluation.setTitle("Theatre HVAC upgrade and service");
		evaluation.setDescription("Upgrade and 36-month service of theatre air-handling units and pressure differentials.");
		evaluation.setCategory("Facilities & engineering");
		evaluation.setEstimatedValue(new BigDecimal("3875000.00"));
		evaluation.setEvaluationCriteria("{\"technical\":70,\"price\":30,\"references\":true}");
		evaluation.setStatus("EVALUATION");
		evaluation.setPublishedAt(now.minus(40, ChronoUnit.DAYS));
		evaluation.setClosingAt(now.minus(10, ChronoUnit.DAYS));
		evaluation.setCreatedBy("procurement@rfh.gov.za");
		evaluation = procTenderRepository.save(evaluation);

		ProcBid b1 = seedProcBid(published.getId(), v1.getId(), v1.getName(), new BigDecimal("2280000.00"),
				"Full sterile pack catalogue with 48-hour replenishment SLA for RFH theatres.",
				"SEALED", now.minus(2, ChronoUnit.DAYS), null, null, null, null);
		ProcBid b2 = seedProcBid(evaluation.getId(), v2.getId(), v2.getName(), new BigDecimal("3610000.00"),
				"OEM-aligned HVAC upgrade with local artisan training and quarterly filter QA.",
				"SCORED", now.minus(18, ChronoUnit.DAYS), now.minus(9, ChronoUnit.DAYS), 82.0, 78.0, 80.4);
		ProcBid b3 = seedProcBid(evaluation.getId(), v3.getId(), v3.getName(), new BigDecimal("3495000.00"),
				"Lower price bid with subcontracted plant specialists and extended lead times.",
				"OPENED", now.minus(17, ChronoUnit.DAYS), now.minus(9, ChronoUnit.DAYS), null, null, null);

		ProcContract contract = new ProcContract();
		contract.setReferenceNumber("CTR-RFH-2026-015");
		contract.setTenderId(evaluation.getId());
		contract.setVendorId(v2.getId());
		contract.setVendorName(v2.getName());
		contract.setTitle("Interim HVAC service retainer");
		contract.setValue(new BigDecimal("920000.00"));
		contract.setStartDate(LocalDate.now().minusMonths(2));
		contract.setEndDate(LocalDate.now().plusMonths(10));
		contract.setStatus("ACTIVE");
		contract.setMilestoneCount(4);
		contract.setMilestonesCompleted(1);
		contract = procContractRepository.save(contract);

		seedProcSpend("Medical consumables", "Theatre", new BigDecimal("412000.00"), "2026-Q1",
				new BigDecimal("450000.00"), new BigDecimal("38000.00"), "Bulk sterile pack purchase under framework");
		seedProcSpend("Facilities & engineering", "Facilities", new BigDecimal("265000.00"), "2026-Q1",
				new BigDecimal("300000.00"), new BigDecimal("35000.00"), "HVAC filter and motor replacements");
		seedProcSpend("Logistics", "Stores", new BigDecimal("188000.00"), "2026-Q1",
				new BigDecimal("150000.00"), new BigDecimal("0.00"), "Courier and cold-chain distribution overspend");
		seedProcSpend("Pharmacy stock", "Pharmacy", new BigDecimal("675000.00"), "2026-Q1",
				new BigDecimal("700000.00"), new BigDecimal("25000.00"), "Chronic medicine top-up");

		ProcRiskAlert a1 = new ProcRiskAlert();
		a1.setSeverity("HIGH");
		a1.setTitle("High-risk bidder on HVAC evaluation");
		a1.setDetail("Nkomazi Logistics Group holds HIGH risk rating with open bid on TND-RFH-2026-028.");
		a1.setStatus("OPEN");
		a1.setRelatedEntityType("ProcVendor");
		a1.setRelatedEntityId(v3.getId());
		procRiskAlertRepository.save(a1);

		ProcRiskAlert a2 = new ProcRiskAlert();
		a2.setSeverity("MEDIUM");
		a2.setTitle("Logistics spend exceeds period budget");
		a2.setDetail("Stores logistics spend is above the Q1 budget envelope; review courier contracts.");
		a2.setStatus("OPEN");
		a2.setRelatedEntityType("ProcSpendRecord");
		a2.setRelatedEntityId(null);
		procRiskAlertRepository.save(a2);

		ProcAiInsight i1 = new ProcAiInsight();
		i1.setInsightType("DEMAND");
		i1.setTitle("Theatre consumables demand remains elevated");
		i1.setBody("Procurement assistant observes sustained theatre pack demand aligned to published tender TND-RFH-2026-041.");
		i1.setConfidence(0.79);
		i1.setRelatedEntityType("ProcTender");
		i1.setRelatedEntityId(published.getId());
		procAiInsightRepository.save(i1);

		ProcAiInsight i2 = new ProcAiInsight();
		i2.setInsightType("BID_EVAL");
		i2.setTitle("Strong scored HVAC proposal on file");
		i2.setBody("Procurement assistant notes Ehlanzeni Facilities Tech leads scored evaluation at 80.4 total score.");
		i2.setConfidence(0.76);
		i2.setRelatedEntityType("ProcBid");
		i2.setRelatedEntityId(b2.getId());
		procAiInsightRepository.save(i2);

		String previous = "GENESIS";
		previous = appendProcLedger("BID_OPEN", "ProcTender", published.getId(),
				"procurement@rfh.gov.za", "Published tender " + published.getReferenceNumber(), previous);
		previous = appendProcLedger("BID_SUBMIT", "ProcBid", b1.getId(),
				"procurement@rfh.gov.za", "Sealed bid received from " + v1.getName(), previous);
		previous = appendProcLedger("BID_OPEN", "ProcTender", evaluation.getId(),
				"procurement@rfh.gov.za", "Bidding closed for " + evaluation.getReferenceNumber(), previous);
		previous = appendProcLedger("EVALUATION", "ProcBid", b2.getId(),
				"procurement@rfh.gov.za", "Scored HVAC bid total=80.4", previous);
		previous = appendProcLedger("BID_OPEN", "ProcBid", b3.getId(),
				"procurement@rfh.gov.za", "Opened competing HVAC bid", previous);
		previous = appendProcLedger("CONTRACT", "ProcContract", contract.getId(),
				"procurement@rfh.gov.za", "Active retainer contract " + contract.getReferenceNumber(), previous);
		contract.setLedgerHash(previous);
		procContractRepository.save(contract);
	}

	private ProcVendor seedProcVendor(
			String name,
			String registrationNumber,
			String csdNumber,
			String category,
			String email,
			String phone,
			String status,
			String riskRating,
			int performance,
			int delivery,
			int quality,
			int cost,
			int compliance,
			String notes) {
		ProcVendor vendor = new ProcVendor();
		vendor.setName(name);
		vendor.setRegistrationNumber(registrationNumber);
		vendor.setCsdNumber(csdNumber);
		vendor.setCategory(category);
		vendor.setContactEmail(email);
		vendor.setContactPhone(phone);
		vendor.setStatus(status);
		vendor.setRiskRating(riskRating);
		vendor.setPerformanceScore(performance);
		vendor.setDeliveryScore(delivery);
		vendor.setQualityScore(quality);
		vendor.setCostScore(cost);
		vendor.setComplianceScore(compliance);
		vendor.setNotes(notes);
		return procVendorRepository.save(vendor);
	}

	private ProcBid seedProcBid(
			Long tenderId,
			Long vendorId,
			String vendorName,
			BigDecimal amount,
			String proposal,
			String status,
			Instant submittedAt,
			Instant openedAt,
			Double technical,
			Double price,
			Double total) {
		String sealPayload = tenderId + "|" + vendorId + "|" + amount.toPlainString() + "|" + proposal + "|" + submittedAt;
		ProcBid bid = new ProcBid();
		bid.setTenderId(tenderId);
		bid.setVendorId(vendorId);
		bid.setVendorName(vendorName);
		bid.setBidAmount(amount);
		bid.setProposalSummary(proposal);
		bid.setStatus(status);
		bid.setSubmittedAt(submittedAt);
		bid.setSealedHash(HashUtil.sha256Hex(sealPayload));
		bid.setOpenedAt(openedAt);
		bid.setTechnicalScore(technical);
		bid.setPriceScore(price);
		bid.setTotalScore(total);
		return procBidRepository.save(bid);
	}

	private void seedProcSpend(
			String category,
			String department,
			BigDecimal amount,
			String periodLabel,
			BigDecimal budget,
			BigDecimal savings,
			String notes) {
		ProcSpendRecord record = new ProcSpendRecord();
		record.setCategory(category);
		record.setDepartment(department);
		record.setAmount(amount);
		record.setPeriodLabel(periodLabel);
		record.setBudgetAmount(budget);
		record.setSavingsAmount(savings);
		record.setNotes(notes);
		procSpendRecordRepository.save(record);
	}

	private String appendProcLedger(
			String eventType,
			String entityType,
			Long entityId,
			String actorEmail,
			String detail,
			String previousHash) {
		Instant createdAt = Instant.now();
		String payload = String.join("|",
				eventType,
				entityType,
				entityId == null ? "" : String.valueOf(entityId),
				detail,
				actorEmail,
				previousHash,
				createdAt.toString());
		String payloadHash = HashUtil.sha256Hex(payload);
		ProcLedgerEvent event = new ProcLedgerEvent();
		event.setEventType(eventType);
		event.setEntityType(entityType);
		event.setEntityId(entityId);
		event.setPayloadHash(payloadHash);
		event.setPreviousHash(previousHash);
		event.setActorEmail(actorEmail);
		event.setDetail(detail);
		event.setCreatedAt(createdAt);
		procLedgerEventRepository.save(event);
		return payloadHash;
	}
}


package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.GhostWorkerCase;
import za.gov.mpumalanga.rfh.entity.PayrollCostCentre;
import za.gov.mpumalanga.rfh.entity.PayrollPeriod;
import za.gov.mpumalanga.rfh.entity.StaffCertification;
import za.gov.mpumalanga.rfh.entity.TimesheetEntry;
import za.gov.mpumalanga.rfh.repository.GhostWorkerCaseRepository;
import za.gov.mpumalanga.rfh.repository.PayrollAuditEventRepository;
import za.gov.mpumalanga.rfh.repository.PayrollCostCentreRepository;
import za.gov.mpumalanga.rfh.repository.PayrollPeriodRepository;
import za.gov.mpumalanga.rfh.repository.StaffCertificationRepository;
import za.gov.mpumalanga.rfh.repository.TimesheetEntryRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

	private static final Set<String> OPEN_GHOST = Set.of("FLAGGED", "UNDER_REVIEW", "ESCALATED");

	private final PayrollPeriodRepository periodRepository;
	private final PayrollCostCentreRepository costCentreRepository;
	private final TimesheetEntryRepository timesheetRepository;
	private final GhostWorkerCaseRepository ghostCaseRepository;
	private final StaffCertificationRepository certificationRepository;
	private final PayrollAuditEventRepository auditEventRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public PayrollController(
			PayrollPeriodRepository periodRepository,
			PayrollCostCentreRepository costCentreRepository,
			TimesheetEntryRepository timesheetRepository,
			GhostWorkerCaseRepository ghostCaseRepository,
			StaffCertificationRepository certificationRepository,
			PayrollAuditEventRepository auditEventRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.periodRepository = periodRepository;
		this.costCentreRepository = costCentreRepository;
		this.timesheetRepository = timesheetRepository;
		this.ghostCaseRepository = ghostCaseRepository;
		this.certificationRepository = certificationRepository;
		this.auditEventRepository = auditEventRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping("/dashboard")
	public Map<String, Object> dashboard() {
		securityUtils.requirePayroll();

		List<PayrollCostCentre> centres = costCentreRepository.findAllByOrderByDepartmentAsc();
		BigDecimal payrollBudget = BigDecimal.ZERO;
		BigDecimal totalStaffCost = BigDecimal.ZERO;
		BigDecimal overtimeCost = BigDecimal.ZERO;
		int fteApproved = 0;
		int fteFilled = 0;
		List<Map<String, Object>> costByDepartment = new ArrayList<>();
		for (PayrollCostCentre c : centres) {
			BigDecimal budget = nz(c.getBudgetAnnual());
			BigDecimal actual = nz(c.getActualYtd());
			BigDecimal ot = nz(c.getOvertimeYtd());
			payrollBudget = payrollBudget.add(budget);
			totalStaffCost = totalStaffCost.add(actual);
			overtimeCost = overtimeCost.add(ot);
			fteApproved += safeInt(c.getFteApproved());
			fteFilled += safeInt(c.getFteFilled());
			Map<String, Object> row = new LinkedHashMap<>();
			row.put("department", c.getDepartment());
			row.put("code", c.getCode());
			row.put("budgetAnnual", budget);
			row.put("actualYtd", actual);
			row.put("overtimeYtd", ot);
			row.put("fteApproved", safeInt(c.getFteApproved()));
			row.put("fteFilled", safeInt(c.getFteFilled()));
			costByDepartment.add(row);
		}

		BigDecimal budgetVariance = totalStaffCost.subtract(payrollBudget);
		double budgetVariancePercent = payrollBudget.compareTo(BigDecimal.ZERO) == 0
				? 0.0
				: budgetVariance.multiply(BigDecimal.valueOf(100))
						.divide(payrollBudget, 1, RoundingMode.HALF_UP)
						.doubleValue();
		int vacancyGap = Math.max(0, fteApproved - fteFilled);
		double vacancyRate = fteApproved == 0 ? 0.0 : round1((vacancyGap * 100.0) / fteApproved);

		double overtimeHours = timesheetRepository.findAll().stream()
				.mapToDouble(t -> t.getOvertimeHours() == null ? 0.0 : t.getOvertimeHours())
				.sum();
		overtimeHours = round1(overtimeHours);

		List<GhostWorkerCase> ghostCases = ghostCaseRepository.findAllByOrderByFlaggedAtDesc();
		long ghostCasesOpen = ghostCases.stream()
				.filter(g -> OPEN_GHOST.contains(upper(g.getStatus())))
				.count();
		BigDecimal ghostAmountAtRisk = ghostCases.stream()
				.filter(g -> OPEN_GHOST.contains(upper(g.getStatus())))
				.map(g -> nz(g.getAmountAtRisk()))
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		LocalDate horizon = LocalDate.now().plusDays(90);
		long certificationsExpiring = certificationRepository.findAll().stream()
				.filter(c -> c.getExpiryDate() != null)
				.filter(c -> !c.getExpiryDate().isBefore(LocalDate.now()))
				.filter(c -> !c.getExpiryDate().isAfter(horizon))
				.count();

		List<String> alerts = new ArrayList<>();
		if (budgetVariance.compareTo(BigDecimal.ZERO) > 0) {
			alerts.add("Staff cost exceeds annual payroll budget by R "
					+ budgetVariance.setScale(2, RoundingMode.HALF_UP) + ".");
		}
		if (ghostCasesOpen > 0) {
			alerts.add(ghostCasesOpen + " open ghost-worker case(s) require review.");
		}
		if (certificationsExpiring > 0) {
			alerts.add(certificationsExpiring + " professional licence(s) expire within 90 days.");
		}
		if (vacancyRate >= 10.0) {
			alerts.add("Payroll FTE vacancy rate is " + vacancyRate + "%.");
		}

		PayrollPeriod openPeriod = periodRepository.findByStatusIgnoreCaseOrderByCreatedAtDesc("OPEN").stream()
				.findFirst()
				.orElseGet(() -> periodRepository.findAllByOrderByCreatedAtDesc().stream().findFirst().orElse(null));

		Map<String, Object> map = new LinkedHashMap<>();
		map.put("totalStaffCost", totalStaffCost);
		map.put("payrollBudget", payrollBudget);
		map.put("budgetVariance", budgetVariance);
		map.put("budgetVariancePercent", budgetVariancePercent);
		map.put("fteApproved", fteApproved);
		map.put("fteFilled", fteFilled);
		map.put("vacancyRate", vacancyRate);
		map.put("overtimeCost", overtimeCost);
		map.put("overtimeHours", overtimeHours);
		map.put("ghostCasesOpen", ghostCasesOpen);
		map.put("ghostAmountAtRisk", ghostAmountAtRisk);
		map.put("certificationsExpiring", certificationsExpiring);
		map.put("costByDepartment", costByDepartment);
		map.put("alerts", alerts);
		map.put("recentGhostCases", ghostCases.stream().limit(5).map(responseMapper::ghostWorkerCase).toList());
		map.put("recentTimesheets", timesheetRepository.findAllByOrderByCreatedAtDesc().stream()
				.limit(5)
				.map(responseMapper::timesheetEntry)
				.toList());
		map.put("openPeriod", openPeriod == null ? null : responseMapper.payrollPeriod(openPeriod));
		return map;
	}

	@GetMapping("/audit")
	public List<Map<String, Object>> audit() {
		securityUtils.requirePayroll();
		return auditEventRepository.findTop50ByOrderByCreatedAtDesc().stream()
				.map(responseMapper::payrollAuditEvent)
				.toList();
	}

	@GetMapping("/reports/summary")
	public Map<String, Object> reportsSummary() {
		securityUtils.requirePayroll();

		List<PayrollCostCentre> centres = costCentreRepository.findAllByOrderByDepartmentAsc();
		BigDecimal payrollBudget = BigDecimal.ZERO;
		BigDecimal totalStaffCost = BigDecimal.ZERO;
		BigDecimal overtimeCost = BigDecimal.ZERO;
		int fteApproved = 0;
		int fteFilled = 0;
		for (PayrollCostCentre c : centres) {
			payrollBudget = payrollBudget.add(nz(c.getBudgetAnnual()));
			totalStaffCost = totalStaffCost.add(nz(c.getActualYtd()));
			overtimeCost = overtimeCost.add(nz(c.getOvertimeYtd()));
			fteApproved += safeInt(c.getFteApproved());
			fteFilled += safeInt(c.getFteFilled());
		}

		List<GhostWorkerCase> ghostCases = ghostCaseRepository.findAll();
		long ghostOpen = ghostCases.stream().filter(g -> OPEN_GHOST.contains(upper(g.getStatus()))).count();
		long ghostConfirmed = ghostCases.stream().filter(g -> "CONFIRMED".equalsIgnoreCase(g.getStatus())).count();
		BigDecimal ghostAtRisk = ghostCases.stream()
				.filter(g -> OPEN_GHOST.contains(upper(g.getStatus())))
				.map(g -> nz(g.getAmountAtRisk()))
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		LocalDate horizon = LocalDate.now().plusDays(90);
		List<StaffCertification> certs = certificationRepository.findAll();
		long certValid = certs.stream().filter(c -> "VALID".equalsIgnoreCase(c.getStatus())).count();
		long certExpiring = certs.stream()
				.filter(c -> c.getExpiryDate() != null)
				.filter(c -> !c.getExpiryDate().isBefore(LocalDate.now()))
				.filter(c -> !c.getExpiryDate().isAfter(horizon))
				.count();
		long certExpired = certs.stream().filter(c -> "EXPIRED".equalsIgnoreCase(c.getStatus())
				|| (c.getExpiryDate() != null && c.getExpiryDate().isBefore(LocalDate.now()))).count();

		List<TimesheetEntry> timesheets = timesheetRepository.findAll();
		long timesheetApproved = timesheets.stream().filter(t -> "APPROVED".equalsIgnoreCase(t.getStatus())).count();
		long timesheetPending = timesheets.stream()
				.filter(t -> "SUBMITTED".equalsIgnoreCase(t.getStatus()) || "DRAFT".equalsIgnoreCase(t.getStatus()))
				.count();
		double overtimeHours = round1(timesheets.stream()
				.mapToDouble(t -> t.getOvertimeHours() == null ? 0.0 : t.getOvertimeHours())
				.sum());

		Map<String, Object> costControl = new LinkedHashMap<>();
		costControl.put("payrollBudget", payrollBudget);
		costControl.put("totalStaffCost", totalStaffCost);
		costControl.put("budgetVariance", totalStaffCost.subtract(payrollBudget));
		costControl.put("overtimeCost", overtimeCost);
		costControl.put("overtimeHours", overtimeHours);
		costControl.put("fteApproved", fteApproved);
		costControl.put("fteFilled", fteFilled);
		costControl.put("vacancyRate", fteApproved == 0
				? 0.0
				: round1((Math.max(0, fteApproved - fteFilled) * 100.0) / fteApproved));

		Map<String, Object> compliance = new LinkedHashMap<>();
		compliance.put("ghostCasesOpen", ghostOpen);
		compliance.put("ghostCasesConfirmed", ghostConfirmed);
		compliance.put("ghostAmountAtRisk", ghostAtRisk);
		compliance.put("certificationsValid", certValid);
		compliance.put("certificationsExpiring", certExpiring);
		compliance.put("certificationsExpired", certExpired);
		compliance.put("timesheetsApproved", timesheetApproved);
		compliance.put("timesheetsPending", timesheetPending);
		compliance.put("periodsOpen", periodRepository.findByStatusIgnoreCaseOrderByCreatedAtDesc("OPEN").size());

		Map<String, Object> result = new LinkedHashMap<>();
		result.put("costControl", costControl);
		result.put("compliance", compliance);
		result.put("costByDepartment", centres.stream().map(responseMapper::payrollCostCentre).toList());
		return result;
	}

	private static BigDecimal nz(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}

	private static int safeInt(Integer value) {
		return value == null ? 0 : value;
	}

	private static double round1(double value) {
		return Math.round(value * 10.0) / 10.0;
	}

	private static String upper(String value) {
		return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
	}
}

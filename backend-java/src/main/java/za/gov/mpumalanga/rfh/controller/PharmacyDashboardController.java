package za.gov.mpumalanga.rfh.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.Medicine;
import za.gov.mpumalanga.rfh.entity.PharmacyClinicalIntervention;
import za.gov.mpumalanga.rfh.entity.PharmacyFinancePeriod;
import za.gov.mpumalanga.rfh.entity.PharmacyQueueTicket;
import za.gov.mpumalanga.rfh.entity.PharmacySupplierScore;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.MedicineRepository;
import za.gov.mpumalanga.rfh.repository.PharmacyClinicalInterventionRepository;
import za.gov.mpumalanga.rfh.repository.PharmacyFinancePeriodRepository;
import za.gov.mpumalanga.rfh.repository.PharmacyQueueTicketRepository;
import za.gov.mpumalanga.rfh.repository.PharmacySupplierScoreRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/pharmacy")
public class PharmacyDashboardController {

	private static final Set<String> TICKET_STATUSES = Set.of("WAITING", "IN_PROGRESS", "DISPENSED", "CANCELLED");
	private static final Set<String> TICKET_PRIORITIES = Set.of("ROUTINE", "STAT");
	private static final Set<String> INTERVENTION_TYPES = Set.of(
			"DOSE_ADJUST", "IV_TO_PO", "AMS_DEESCALATION", "FORMULARY", "GOOD_CATCH", "OTHER");
	private static final Set<String> RISK_RATINGS = Set.of("LOW", "MEDIUM", "HIGH");

	private final PharmacyQueueTicketRepository ticketRepository;
	private final PharmacyClinicalInterventionRepository interventionRepository;
	private final PharmacyFinancePeriodRepository financePeriodRepository;
	private final PharmacySupplierScoreRepository supplierScoreRepository;
	private final MedicineRepository medicineRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public PharmacyDashboardController(
			PharmacyQueueTicketRepository ticketRepository,
			PharmacyClinicalInterventionRepository interventionRepository,
			PharmacyFinancePeriodRepository financePeriodRepository,
			PharmacySupplierScoreRepository supplierScoreRepository,
			MedicineRepository medicineRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.ticketRepository = ticketRepository;
		this.interventionRepository = interventionRepository;
		this.financePeriodRepository = financePeriodRepository;
		this.supplierScoreRepository = supplierScoreRepository;
		this.medicineRepository = medicineRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping("/dashboard")
	public Map<String, Object> dashboard() {
		securityUtils.requirePharmacy();

		List<PharmacyQueueTicket> tickets = ticketRepository.findAll();
		List<PharmacyClinicalIntervention> interventions = interventionRepository.findAll();
		List<PharmacyFinancePeriod> periods = financePeriodRepository.findAll();
		List<Medicine> medicines = medicineRepository.findAll();
		List<PharmacySupplierScore> suppliers = supplierScoreRepository.findAll();

		Map<String, Object> map = new LinkedHashMap<>();
		map.put("operations", buildOperationsKpis(tickets));
		map.put("clinical", buildClinicalKpis(interventions));
		map.put("finance", buildFinanceKpis(periods, interventions));
		map.put("inventory", buildInventoryKpis(medicines));
		map.put("recentAlerts", buildAlerts(tickets, medicines, suppliers, periods));
		Map<String, Object> links = new LinkedHashMap<>();
		links.put("queueTickets", tickets.size());
		links.put("interventions", interventions.size());
		links.put("financePeriods", periods.size());
		links.put("supplierScores", suppliers.size());
		links.put("medicines", medicines.size());
		map.put("links", links);
		return map;
	}

	@GetMapping("/operations")
	public Map<String, Object> operations() {
		securityUtils.requirePharmacy();
		List<PharmacyQueueTicket> tickets = ticketRepository.findAllByOrderByArrivedAtDesc();
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("kpis", buildOperationsKpis(tickets));
		map.put("tickets", tickets.stream().map(this::ticketMap).toList());
		return map;
	}

	@PostMapping("/operations/tickets")
	public ResponseEntity<Map<String, Object>> createTicket(@RequestBody Map<String, Object> body) {
		securityUtils.requirePharmacy();
		String patientName = requireText(str(body.get("patientName")), "patientName").trim();
		String priority = upperOrDefault(str(body.get("priority")), "ROUTINE");
		if (!TICKET_PRIORITIES.contains(priority)) {
			throw new ApiException(400, "Priority must be ROUTINE or STAT");
		}
		PharmacyQueueTicket ticket = new PharmacyQueueTicket();
		ticket.setPatientName(patientName);
		ticket.setPriority(priority);
		ticket.setStatus("WAITING");
		ticket.setArrivedAt(Instant.now());
		ticket.setTechnicianName(blankToNull(str(body.get("technicianName"))));
		String ticketNumber = blankToNull(str(body.get("ticketNumber")));
		if (ticketNumber == null) {
			ticketNumber = "RX-" + System.currentTimeMillis() % 1000000;
		}
		ticket.setTicketNumber(ticketNumber);
		ticket = ticketRepository.save(ticket);
		return ResponseEntity.status(HttpStatus.CREATED).body(ticketMap(ticket));
	}

	@PutMapping("/operations/tickets/{id}")
	public Map<String, Object> updateTicket(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		securityUtils.requirePharmacy();
		PharmacyQueueTicket ticket = ticketRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Queue ticket not found"));
		if (body.containsKey("patientName")) {
			ticket.setPatientName(requireText(str(body.get("patientName")), "patientName").trim());
		}
		if (body.containsKey("priority")) {
			String priority = requireText(str(body.get("priority")), "priority").trim().toUpperCase(Locale.ROOT);
			if (!TICKET_PRIORITIES.contains(priority)) {
				throw new ApiException(400, "Priority must be ROUTINE or STAT");
			}
			ticket.setPriority(priority);
		}
		if (body.containsKey("technicianName")) {
			ticket.setTechnicianName(blankToNull(str(body.get("technicianName"))));
		}
		if (body.containsKey("ticketNumber")) {
			ticket.setTicketNumber(blankToNull(str(body.get("ticketNumber"))));
		}
		if (body.containsKey("status")) {
			String status = requireText(str(body.get("status")), "status").trim().toUpperCase(Locale.ROOT);
			if (!TICKET_STATUSES.contains(status)) {
				throw new ApiException(400, "Invalid ticket status");
			}
			applyStatusTimestamps(ticket, status);
			ticket.setStatus(status);
		}
		ticket = ticketRepository.save(ticket);
		return ticketMap(ticket);
	}

	@GetMapping("/clinical")
	public Map<String, Object> clinical() {
		securityUtils.requirePharmacy();
		List<PharmacyClinicalIntervention> interventions = interventionRepository.findAllByOrderByCreatedAtDesc();
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("kpis", buildClinicalKpis(interventions));
		map.put("interventions", interventions.stream().map(this::interventionMap).toList());
		return map;
	}

	@PostMapping("/clinical/interventions")
	public ResponseEntity<Map<String, Object>> createIntervention(@RequestBody Map<String, Object> body) {
		securityUtils.requirePharmacy();
		String type = requireText(str(body.get("interventionType")), "interventionType").trim().toUpperCase(Locale.ROOT);
		if (!INTERVENTION_TYPES.contains(type)) {
			throw new ApiException(400, "Invalid intervention type");
		}
		String description = requireText(str(body.get("description")), "description").trim();
		PharmacyClinicalIntervention intervention = new PharmacyClinicalIntervention();
		intervention.setInterventionType(type);
		intervention.setDescription(description);
		intervention.setPharmacistEmail(blankToNull(str(body.get("pharmacistEmail"))));
		intervention.setCostAvoidanceAmount(asBigDecimal(body.get("costAvoidanceAmount")));
		intervention.setCreatedAt(Instant.now());
		intervention = interventionRepository.save(intervention);
		return ResponseEntity.status(HttpStatus.CREATED).body(interventionMap(intervention));
	}

	@GetMapping("/finance-panel")
	public Map<String, Object> financePanel() {
		securityUtils.requirePharmacy();
		List<PharmacyFinancePeriod> periods = financePeriodRepository.findAllByOrderByPeriodLabelDesc();
		List<PharmacySupplierScore> suppliers = supplierScoreRepository.findAllByOrderBySupplierNameAsc();
		List<PharmacyClinicalIntervention> interventions = interventionRepository.findAll();
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("kpis", buildFinanceKpis(periods, interventions));
		map.put("periods", periods.stream().map(this::periodMap).toList());
		map.put("supplierPaymentMetrics", suppliers.stream().map(s -> {
			Map<String, Object> row = new LinkedHashMap<>();
			row.put("_id", s.getId());
			row.put("supplierName", s.getSupplierName());
			row.put("paymentCycleDays", s.getPaymentCycleDays());
			row.put("riskRating", s.getRiskRating());
			row.put("onTimePercent", s.getOnTimePercent());
			return row;
		}).toList());
		return map;
	}

	@PostMapping("/finance-panel/periods")
	public ResponseEntity<Map<String, Object>> upsertPeriod(@RequestBody Map<String, Object> body) {
		securityUtils.requirePharmacy();
		String label = requireText(str(body.get("periodLabel")), "periodLabel").trim();
		PharmacyFinancePeriod period = financePeriodRepository.findByPeriodLabelIgnoreCase(label)
				.orElseGet(PharmacyFinancePeriod::new);
		boolean creating = period.getId() == null;
		period.setPeriodLabel(label);
		if (body.containsKey("budgetAmount") || creating) {
			period.setBudgetAmount(nz(asBigDecimal(body.get("budgetAmount"))));
		}
		if (body.containsKey("actualSpend") || creating) {
			period.setActualSpend(nz(asBigDecimal(body.get("actualSpend"))));
		}
		if (body.containsKey("genericDispenseCount") || creating) {
			period.setGenericDispenseCount(asInt(body.get("genericDispenseCount"), 0));
		}
		if (body.containsKey("brandDispenseCount") || creating) {
			period.setBrandDispenseCount(asInt(body.get("brandDispenseCount"), 0));
		}
		if (body.containsKey("invoicePendingCount") || creating) {
			period.setInvoicePendingCount(asInt(body.get("invoicePendingCount"), 0));
		}
		if (body.containsKey("avgPaymentCycleDays") || creating) {
			period.setAvgPaymentCycleDays(asInt(body.get("avgPaymentCycleDays"), 0));
		}
		period = financePeriodRepository.save(period);
		return ResponseEntity.status(creating ? HttpStatus.CREATED : HttpStatus.OK).body(periodMap(period));
	}

	@GetMapping("/inventory-panel")
	public Map<String, Object> inventoryPanel() {
		securityUtils.requirePharmacy();
		List<Medicine> medicines = medicineRepository.findAllByOrderByNameAsc();
		List<PharmacySupplierScore> suppliers = supplierScoreRepository.findAllByOrderBySupplierNameAsc();
		LocalDate nearExpiryCutoff = LocalDate.now().plusDays(90);
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("kpis", buildInventoryKpis(medicines));
		map.put("medicines", medicines.stream().map(m -> inventoryMedicineMap(m, nearExpiryCutoff)).toList());
		map.put("suppliers", suppliers.stream().map(this::supplierMap).toList());
		return map;
	}

	@PostMapping("/inventory-panel/suppliers")
	public ResponseEntity<Map<String, Object>> createSupplier(@RequestBody Map<String, Object> body) {
		securityUtils.requirePharmacy();
		PharmacySupplierScore score = new PharmacySupplierScore();
		applySupplierFields(score, body, true);
		score = supplierScoreRepository.save(score);
		return ResponseEntity.status(HttpStatus.CREATED).body(supplierMap(score));
	}

	@PutMapping("/inventory-panel/suppliers/{id}")
	public Map<String, Object> updateSupplier(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		securityUtils.requirePharmacy();
		PharmacySupplierScore score = supplierScoreRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Supplier score not found"));
		applySupplierFields(score, body, false);
		score = supplierScoreRepository.save(score);
		return supplierMap(score);
	}

	private Map<String, Object> buildOperationsKpis(List<PharmacyQueueTicket> tickets) {
		long waiting = tickets.stream().filter(t -> "WAITING".equalsIgnoreCase(t.getStatus())).count();
		List<PharmacyQueueTicket> completed = tickets.stream()
				.filter(t -> "DISPENSED".equalsIgnoreCase(t.getStatus())
						&& t.getArrivedAt() != null
						&& t.getCompletedAt() != null)
				.toList();
		double avgProcessingMinutes = completed.isEmpty()
				? 0.0
				: round1(completed.stream()
						.mapToDouble(t -> minutesBetween(t.getStartedAt() != null ? t.getStartedAt() : t.getArrivedAt(), t.getCompletedAt()))
						.average()
						.orElse(0.0));
		List<PharmacyQueueTicket> waitingTickets = tickets.stream()
				.filter(t -> "WAITING".equalsIgnoreCase(t.getStatus()) && t.getArrivedAt() != null)
				.toList();
		double avgWaitMinutes = waitingTickets.isEmpty()
				? 0.0
				: round1(waitingTickets.stream()
						.mapToDouble(t -> minutesBetween(t.getArrivedAt(), Instant.now()))
						.average()
						.orElse(0.0));
		List<PharmacyQueueTicket> statDone = completed.stream()
				.filter(t -> "STAT".equalsIgnoreCase(t.getPriority()))
				.toList();
		double statTurnaroundMinutes = statDone.isEmpty()
				? 0.0
				: round1(statDone.stream()
						.mapToDouble(t -> minutesBetween(t.getArrivedAt(), t.getCompletedAt()))
						.average()
						.orElse(0.0));
		long technicians = tickets.stream()
				.map(PharmacyQueueTicket::getTechnicianName)
				.filter(n -> n != null && !n.isBlank())
				.distinct()
				.count();
		long dispensedTodayish = completed.size();
		double scriptsPerTechnicianHour = technicians == 0
				? 0.0
				: round1(dispensedTodayish / (double) Math.max(1, technicians) / 8.0);

		Map<String, Object> kpis = new LinkedHashMap<>();
		kpis.put("avgProcessingMinutes", avgProcessingMinutes);
		kpis.put("queueWaiting", waiting);
		kpis.put("avgWaitMinutes", avgWaitMinutes);
		kpis.put("statTurnaroundMinutes", statTurnaroundMinutes);
		kpis.put("scriptsPerTechnicianHour", scriptsPerTechnicianHour);
		return kpis;
	}

	private Map<String, Object> buildClinicalKpis(List<PharmacyClinicalIntervention> interventions) {
		long interventionCount = interventions.size();
		long amsCount = interventions.stream()
				.filter(i -> "AMS_DEESCALATION".equalsIgnoreCase(i.getInterventionType()))
				.count();
		long formularyCount = interventions.stream()
				.filter(i -> "FORMULARY".equalsIgnoreCase(i.getInterventionType()))
				.count();
		long goodCatchCount = interventions.stream()
				.filter(i -> "GOOD_CATCH".equalsIgnoreCase(i.getInterventionType()))
				.count();
		double formularyAdherencePercent = interventionCount == 0
				? 100.0
				: round1((formularyCount * 100.0) / interventionCount);

		Map<String, Object> kpis = new LinkedHashMap<>();
		kpis.put("interventionCount", interventionCount);
		kpis.put("amsCount", amsCount);
		kpis.put("formularyAdherencePercent", formularyAdherencePercent);
		kpis.put("goodCatchCount", goodCatchCount);
		return kpis;
	}

	private Map<String, Object> buildFinanceKpis(
			List<PharmacyFinancePeriod> periods,
			List<PharmacyClinicalIntervention> interventions) {
		PharmacyFinancePeriod latest = periods.stream()
				.sorted((a, b) -> String.valueOf(b.getPeriodLabel()).compareToIgnoreCase(String.valueOf(a.getPeriodLabel())))
				.findFirst()
				.orElse(null);
		BigDecimal budget = latest == null ? BigDecimal.ZERO : nz(latest.getBudgetAmount());
		BigDecimal actual = latest == null ? BigDecimal.ZERO : nz(latest.getActualSpend());
		BigDecimal variance = budget.subtract(actual);
		BigDecimal costAvoidanceTotal = interventions.stream()
				.map(i -> nz(i.getCostAvoidanceAmount()))
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		int generic = latest == null || latest.getGenericDispenseCount() == null ? 0 : latest.getGenericDispenseCount();
		int brand = latest == null || latest.getBrandDispenseCount() == null ? 0 : latest.getBrandDispenseCount();
		int totalDisp = generic + brand;
		double genericDispensingRate = totalDisp == 0 ? 0.0 : round1((generic * 100.0) / totalDisp);
		int pendingInvoices = latest == null || latest.getInvoicePendingCount() == null ? 0 : latest.getInvoicePendingCount();
		int avgPaymentCycleDays = latest == null || latest.getAvgPaymentCycleDays() == null ? 0 : latest.getAvgPaymentCycleDays();

		Map<String, Object> spendVsBudget = new LinkedHashMap<>();
		spendVsBudget.put("actual", actual);
		spendVsBudget.put("budget", budget);
		spendVsBudget.put("variance", variance);

		Map<String, Object> kpis = new LinkedHashMap<>();
		kpis.put("spendVsBudget", spendVsBudget);
		kpis.put("costAvoidanceTotal", costAvoidanceTotal);
		kpis.put("genericDispensingRate", genericDispensingRate);
		kpis.put("pendingInvoices", pendingInvoices);
		kpis.put("avgPaymentCycleDays", avgPaymentCycleDays);
		kpis.put("periodLabel", latest == null ? null : latest.getPeriodLabel());
		return kpis;
	}

	private Map<String, Object> buildInventoryKpis(List<Medicine> medicines) {
		LocalDate nearExpiryCutoff = LocalDate.now().plusDays(90);
		long stockoutCount = medicines.stream()
				.filter(m -> m.getQuantity() != null && m.getQuantity() <= 0)
				.count();
		long nearExpiryCount = medicines.stream()
				.filter(m -> m.getExpiryDate() != null
						&& !m.getExpiryDate().isAfter(nearExpiryCutoff)
						&& !m.getExpiryDate().isBefore(LocalDate.now()))
				.count();
		long criticalTotal = medicines.stream()
				.filter(m -> Boolean.TRUE.equals(m.getCriticalEssential()))
				.count();
		long criticalAvailable = medicines.stream()
				.filter(m -> Boolean.TRUE.equals(m.getCriticalEssential())
						&& m.getQuantity() != null
						&& m.getQuantity() > 0)
				.count();
		long lowStockCount = medicines.stream()
				.filter(m -> m.getQuantity() != null
						&& m.getReorderLevel() != null
						&& m.getQuantity() > 0
						&& m.getQuantity() <= m.getReorderLevel())
				.count();

		Map<String, Object> kpis = new LinkedHashMap<>();
		kpis.put("stockoutCount", stockoutCount);
		kpis.put("nearExpiryCount", nearExpiryCount);
		kpis.put("criticalAvailableCount", criticalAvailable);
		kpis.put("criticalTotal", criticalTotal);
		kpis.put("lowStockCount", lowStockCount);
		return kpis;
	}

	private List<Object> buildAlerts(
			List<PharmacyQueueTicket> tickets,
			List<Medicine> medicines,
			List<PharmacySupplierScore> suppliers,
			List<PharmacyFinancePeriod> periods) {
		List<Object> alerts = new ArrayList<>();
		long waiting = tickets.stream().filter(t -> "WAITING".equalsIgnoreCase(t.getStatus())).count();
		if (waiting >= 3) {
			alerts.add(alert("HIGH", "Pharmacy queue backlog", waiting + " patients waiting — RFH 3–4h wait risk"));
		}
		medicines.stream()
				.filter(m -> m.getQuantity() != null && m.getQuantity() <= 0)
				.limit(3)
				.forEach(m -> alerts.add(alert("HIGH", "Stockout", m.getName() + " is out of stock")));
		medicines.stream()
				.filter(m -> m.getExpiryDate() != null
						&& !m.getExpiryDate().isAfter(LocalDate.now().plusDays(90)))
				.limit(2)
				.forEach(m -> alerts.add(alert("MEDIUM", "Near expiry", m.getName() + " expires " + m.getExpiryDate())));
		suppliers.stream()
				.filter(s -> "HIGH".equalsIgnoreCase(s.getRiskRating()))
				.forEach(s -> alerts.add(alert("HIGH", "Supplier risk", s.getSupplierName() + " — delayed payments / high risk")));
		periods.stream().findFirst().ifPresent(p -> {
			if (nz(p.getActualSpend()).compareTo(nz(p.getBudgetAmount())) > 0) {
				alerts.add(alert("MEDIUM", "Budget overrun", p.getPeriodLabel() + " spend exceeds budget"));
			}
		});
		return alerts;
	}

	private Map<String, Object> alert(String severity, String title, String detail) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("severity", severity);
		map.put("title", title);
		map.put("detail", detail);
		return map;
	}

	private void applyStatusTimestamps(PharmacyQueueTicket ticket, String status) {
		Instant now = Instant.now();
		if ("IN_PROGRESS".equals(status) && ticket.getStartedAt() == null) {
			ticket.setStartedAt(now);
		}
		if ("DISPENSED".equals(status)) {
			if (ticket.getStartedAt() == null) {
				ticket.setStartedAt(ticket.getArrivedAt() != null ? ticket.getArrivedAt() : now);
			}
			ticket.setCompletedAt(now);
		}
		if ("CANCELLED".equals(status)) {
			ticket.setCompletedAt(now);
		}
		if ("WAITING".equals(status)) {
			ticket.setStartedAt(null);
			ticket.setCompletedAt(null);
		}
	}

	private void applySupplierFields(PharmacySupplierScore score, Map<String, Object> body, boolean creating) {
		if (creating || body.containsKey("supplierName")) {
			score.setSupplierName(requireText(str(body.get("supplierName")), "supplierName").trim());
		}
		if (creating || body.containsKey("onTimePercent")) {
			score.setOnTimePercent(asDouble(body.get("onTimePercent")));
		}
		if (creating || body.containsKey("orderAccuracyPercent")) {
			score.setOrderAccuracyPercent(asDouble(body.get("orderAccuracyPercent")));
		}
		if (creating || body.containsKey("paymentCycleDays")) {
			score.setPaymentCycleDays(asInt(body.get("paymentCycleDays"), null));
		}
		if (creating || body.containsKey("riskRating")) {
			String risk = creating && blank(str(body.get("riskRating")))
					? "MEDIUM"
					: requireText(str(body.get("riskRating")), "riskRating").trim().toUpperCase(Locale.ROOT);
			if (!RISK_RATINGS.contains(risk)) {
				throw new ApiException(400, "Risk rating must be LOW, MEDIUM, or HIGH");
			}
			score.setRiskRating(risk);
		}
		if (creating || body.containsKey("notes")) {
			score.setNotes(blankToNull(str(body.get("notes"))));
		}
	}

	private Map<String, Object> ticketMap(PharmacyQueueTicket t) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", t.getId());
		map.put("id", t.getId());
		map.put("ticketNumber", t.getTicketNumber());
		map.put("patientName", t.getPatientName());
		map.put("status", t.getStatus());
		map.put("priority", t.getPriority());
		map.put("arrivedAt", t.getArrivedAt());
		map.put("startedAt", t.getStartedAt());
		map.put("completedAt", t.getCompletedAt());
		map.put("technicianName", t.getTechnicianName());
		return map;
	}

	private Map<String, Object> interventionMap(PharmacyClinicalIntervention i) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", i.getId());
		map.put("id", i.getId());
		map.put("interventionType", i.getInterventionType());
		map.put("description", i.getDescription());
		map.put("pharmacistEmail", i.getPharmacistEmail());
		map.put("createdAt", i.getCreatedAt());
		map.put("costAvoidanceAmount", i.getCostAvoidanceAmount());
		return map;
	}

	private Map<String, Object> periodMap(PharmacyFinancePeriod p) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", p.getId());
		map.put("id", p.getId());
		map.put("periodLabel", p.getPeriodLabel());
		map.put("budgetAmount", p.getBudgetAmount());
		map.put("actualSpend", p.getActualSpend());
		map.put("genericDispenseCount", p.getGenericDispenseCount());
		map.put("brandDispenseCount", p.getBrandDispenseCount());
		map.put("invoicePendingCount", p.getInvoicePendingCount());
		map.put("avgPaymentCycleDays", p.getAvgPaymentCycleDays());
		return map;
	}

	private Map<String, Object> supplierMap(PharmacySupplierScore s) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", s.getId());
		map.put("id", s.getId());
		map.put("supplierName", s.getSupplierName());
		map.put("onTimePercent", s.getOnTimePercent());
		map.put("orderAccuracyPercent", s.getOrderAccuracyPercent());
		map.put("paymentCycleDays", s.getPaymentCycleDays());
		map.put("riskRating", s.getRiskRating());
		map.put("notes", s.getNotes());
		return map;
	}

	private Map<String, Object> inventoryMedicineMap(Medicine m, LocalDate nearExpiryCutoff) {
		Map<String, Object> map = new LinkedHashMap<>(responseMapper.medicine(m));
		boolean stockout = m.getQuantity() != null && m.getQuantity() <= 0;
		boolean nearExpiry = m.getExpiryDate() != null
				&& !m.getExpiryDate().isAfter(nearExpiryCutoff)
				&& !m.getExpiryDate().isBefore(LocalDate.now());
		boolean critical = Boolean.TRUE.equals(m.getCriticalEssential());
		boolean lowStock = m.getQuantity() != null
				&& m.getReorderLevel() != null
				&& m.getQuantity() > 0
				&& m.getQuantity() <= m.getReorderLevel();
		map.put("stockout", stockout);
		map.put("nearExpiry", nearExpiry);
		map.put("critical", critical);
		map.put("lowStock", lowStock);
		return map;
	}

	private static double minutesBetween(Instant start, Instant end) {
		if (start == null || end == null) {
			return 0.0;
		}
		return Math.max(0.0, Duration.between(start, end).toMinutes());
	}

	private static double round1(double value) {
		return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
	}

	private static BigDecimal nz(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}

	private static boolean blank(String value) {
		return value == null || value.isBlank();
	}

	private static String blankToNull(String value) {
		return blank(value) ? null : value.trim();
	}

	private static String requireText(String value, String field) {
		if (blank(value)) {
			throw new ApiException(400, field + " is required");
		}
		return value;
	}

	private static String upperOrDefault(String value, String fallback) {
		if (blank(value)) {
			return fallback;
		}
		return value.trim().toUpperCase(Locale.ROOT);
	}

	private static Integer asInt(Object value, Integer fallback) {
		if (value == null) {
			return fallback;
		}
		if (value instanceof Number number) {
			return number.intValue();
		}
		try {
			return Integer.valueOf(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			return fallback;
		}
	}

	private static Double asDouble(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof Number number) {
			return number.doubleValue();
		}
		try {
			return Double.valueOf(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private static BigDecimal asBigDecimal(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof BigDecimal bd) {
			return bd;
		}
		if (value instanceof Number number) {
			return BigDecimal.valueOf(number.doubleValue());
		}
		try {
			return new BigDecimal(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			return null;
		}
	}
}

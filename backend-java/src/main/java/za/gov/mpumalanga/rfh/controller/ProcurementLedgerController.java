package za.gov.mpumalanga.rfh.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.repository.ProcLedgerEventRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;
import za.gov.mpumalanga.rfh.service.ProcLedgerService;

@RestController
@RequestMapping("/api/procurement/ledger")
public class ProcurementLedgerController {

	private final ProcLedgerEventRepository ledgerEventRepository;
	private final ProcLedgerService ledgerService;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public ProcurementLedgerController(
			ProcLedgerEventRepository ledgerEventRepository,
			ProcLedgerService ledgerService,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.ledgerEventRepository = ledgerEventRepository;
		this.ledgerService = ledgerService;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public Map<String, Object> list(@RequestParam(required = false, defaultValue = "false") boolean verify) {
		securityUtils.requireProcurement();
		List<Map<String, Object>> events = ledgerEventRepository.findTop50ByOrderByCreatedAtDesc().stream()
				.map(responseMapper::procLedgerEvent)
				.toList();
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("events", events);
		if (verify) {
			result.put("chain", ledgerService.verifyChain());
		}
		return result;
	}
}

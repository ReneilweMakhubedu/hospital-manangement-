package za.gov.mpumalanga.rfh.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import za.gov.mpumalanga.rfh.entity.ProcLedgerEvent;
import za.gov.mpumalanga.rfh.repository.AdminRepository;
import za.gov.mpumalanga.rfh.repository.ProcLedgerEventRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.util.HashUtil;

@Service
public class ProcLedgerService {

	public static final String GENESIS_HASH = "GENESIS";

	private final ProcLedgerEventRepository ledgerEventRepository;
	private final AdminRepository adminRepository;

	public ProcLedgerService(ProcLedgerEventRepository ledgerEventRepository, AdminRepository adminRepository) {
		this.ledgerEventRepository = ledgerEventRepository;
		this.adminRepository = adminRepository;
	}

	public ProcLedgerEvent append(AuthUser actor, String eventType, String entityType, Long entityId, String detail) {
		String previousHash = ledgerEventRepository.findTopByOrderByIdDesc()
				.map(ProcLedgerEvent::getPayloadHash)
				.orElse(GENESIS_HASH);
		Instant now = Instant.now();
		String actorEmail = resolveEmail(actor);
		String payload = String.join("|",
				nullToEmpty(eventType),
				nullToEmpty(entityType),
				entityId == null ? "" : String.valueOf(entityId),
				nullToEmpty(detail),
				nullToEmpty(actorEmail),
				previousHash,
				now.toString());
		String payloadHash = HashUtil.sha256Hex(payload);

		ProcLedgerEvent event = new ProcLedgerEvent();
		event.setEventType(eventType);
		event.setEntityType(entityType);
		event.setEntityId(entityId);
		event.setPayloadHash(payloadHash);
		event.setPreviousHash(previousHash);
		event.setActorEmail(actorEmail);
		event.setDetail(detail);
		event.setCreatedAt(now);
		return ledgerEventRepository.save(event);
	}

	public Map<String, Object> verifyChain() {
		List<ProcLedgerEvent> events = ledgerEventRepository.findAllByOrderByIdAsc();
		boolean valid = true;
		String expectedPrevious = GENESIS_HASH;
		List<Map<String, Object>> breaks = new ArrayList<>();
		for (ProcLedgerEvent event : events) {
			String previous = event.getPreviousHash() == null ? "" : event.getPreviousHash();
			if (!expectedPrevious.equals(previous)) {
				valid = false;
				Map<String, Object> row = new LinkedHashMap<>();
				row.put("id", event.getId());
				row.put("expectedPreviousHash", expectedPrevious);
				row.put("actualPreviousHash", previous);
				breaks.add(row);
			}
			expectedPrevious = event.getPayloadHash() == null ? "" : event.getPayloadHash();
		}
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("valid", valid);
		result.put("eventCount", events.size());
		result.put("breaks", breaks);
		result.put("note", "Local hash-chain integrity check only; not a distributed blockchain network.");
		return result;
	}

	private String resolveEmail(AuthUser actor) {
		if (actor == null) {
			return null;
		}
		return adminRepository.findById(actor.id()).map(a -> a.getEmail()).orElse(null);
	}

	private static String nullToEmpty(String value) {
		return value == null ? "" : value;
	}
}

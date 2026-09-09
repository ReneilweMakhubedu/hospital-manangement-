package za.gov.mpumalanga.rfh.service;

import org.springframework.stereotype.Service;
import za.gov.mpumalanga.rfh.entity.PayrollAuditEvent;
import za.gov.mpumalanga.rfh.repository.AdminRepository;
import za.gov.mpumalanga.rfh.repository.PayrollAuditEventRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;

@Service
public class PayrollAuditService {

	private final PayrollAuditEventRepository payrollAuditEventRepository;
	private final AdminRepository adminRepository;

	public PayrollAuditService(
			PayrollAuditEventRepository payrollAuditEventRepository,
			AdminRepository adminRepository) {
		this.payrollAuditEventRepository = payrollAuditEventRepository;
		this.adminRepository = adminRepository;
	}

	public void log(AuthUser actor, String action, String entityType, Object entityId, String detail) {
		PayrollAuditEvent event = new PayrollAuditEvent();
		event.setActorEmail(resolveEmail(actor));
		event.setAction(action);
		event.setEntityType(entityType);
		event.setEntityId(entityId == null ? null : String.valueOf(entityId));
		event.setDetail(detail);
		payrollAuditEventRepository.save(event);
	}

	private String resolveEmail(AuthUser actor) {
		if (actor == null) {
			return null;
		}
		return adminRepository.findById(actor.id()).map(a -> a.getEmail()).orElse(null);
	}
}

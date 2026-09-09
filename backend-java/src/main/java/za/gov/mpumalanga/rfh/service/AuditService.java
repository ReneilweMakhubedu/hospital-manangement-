package za.gov.mpumalanga.rfh.service;

import org.springframework.stereotype.Service;
import za.gov.mpumalanga.rfh.entity.AuditEvent;
import za.gov.mpumalanga.rfh.repository.AdminRepository;
import za.gov.mpumalanga.rfh.repository.AuditEventRepository;
import za.gov.mpumalanga.rfh.repository.DoctorRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;

@Service
public class AuditService {

	private final AuditEventRepository auditEventRepository;
	private final AdminRepository adminRepository;
	private final DoctorRepository doctorRepository;
	private final UserRepository userRepository;

	public AuditService(
			AuditEventRepository auditEventRepository,
			AdminRepository adminRepository,
			DoctorRepository doctorRepository,
			UserRepository userRepository) {
		this.auditEventRepository = auditEventRepository;
		this.adminRepository = adminRepository;
		this.doctorRepository = doctorRepository;
		this.userRepository = userRepository;
	}

	public void log(AuthUser actor, String action, String resourceType, Object resourceId, String detail) {
		log(actor, action, resourceType, resourceId, detail, null);
	}

	public void log(
			AuthUser actor,
			String action,
			String resourceType,
			Object resourceId,
			String detail,
			String ipAddress) {
		AuditEvent event = new AuditEvent();
		if (actor != null) {
			event.setActorId(actor.id());
			event.setActorRole(actor.role());
			event.setActorEmail(resolveEmail(actor));
		}
		event.setAction(action);
		event.setResourceType(resourceType);
		event.setResourceId(resourceId == null ? null : String.valueOf(resourceId));
		event.setDetail(detail);
		event.setIpAddress(ipAddress);
		auditEventRepository.save(event);
	}

	public void logSystem(String action, String resourceType, Object resourceId, String detail) {
		AuditEvent event = new AuditEvent();
		event.setActorRole("system");
		event.setActorEmail("system@rfh.gov.za");
		event.setAction(action);
		event.setResourceType(resourceType);
		event.setResourceId(resourceId == null ? null : String.valueOf(resourceId));
		event.setDetail(detail);
		auditEventRepository.save(event);
	}

	private String resolveEmail(AuthUser actor) {
		if (actor == null || actor.role() == null) {
			return null;
		}
		String role = actor.role().toLowerCase();
		return switch (role) {
			case "admin" -> adminRepository.findById(actor.id()).map(a -> a.getEmail()).orElse(null);
			case "doctor" -> doctorRepository.findById(actor.id()).map(d -> d.getEmail()).orElse(null);
			case "patient" -> userRepository.findById(actor.id()).map(u -> u.getEmail()).orElse(null);
			default -> null;
		};
	}
}

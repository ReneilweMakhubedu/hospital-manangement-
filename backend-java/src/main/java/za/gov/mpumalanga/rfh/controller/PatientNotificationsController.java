package za.gov.mpumalanga.rfh.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.PatientNotification;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.PatientNotificationRepository;
import za.gov.mpumalanga.rfh.security.AuthUser;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/patient/notifications")
public class PatientNotificationsController {

	private final PatientNotificationRepository patientNotificationRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public PatientNotificationsController(
			PatientNotificationRepository patientNotificationRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.patientNotificationRepository = patientNotificationRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public List<Map<String, Object>> list() {
		AuthUser auth = securityUtils.requirePatient();
		return patientNotificationRepository.findByPatientIdOrderByCreatedAtDesc(auth.id()).stream()
				.map(responseMapper::patientNotification)
				.toList();
	}

	@GetMapping("/unread-count")
	public Map<String, Object> unreadCount() {
		AuthUser auth = securityUtils.requirePatient();
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("unreadCount", patientNotificationRepository.countByPatientIdAndReadFlagFalse(auth.id()));
		return map;
	}

	@PutMapping("/{id}/read")
	public Map<String, Object> markRead(@PathVariable Long id) {
		AuthUser auth = securityUtils.requirePatient();
		PatientNotification notification = patientNotificationRepository.findByIdAndPatientId(id, auth.id())
				.orElseThrow(() -> new ApiException(404, "Notification not found"));
		notification.setReadFlag(true);
		notification = patientNotificationRepository.save(notification);
		return responseMapper.patientNotification(notification);
	}

	@PutMapping("/read-all")
	public Map<String, Object> markAllRead() {
		AuthUser auth = securityUtils.requirePatient();
		List<PatientNotification> unread = patientNotificationRepository.findByPatientIdAndReadFlagFalse(auth.id());
		for (PatientNotification notification : unread) {
			notification.setReadFlag(true);
		}
		patientNotificationRepository.saveAll(unread);
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("message", "All notifications marked as read");
		map.put("updated", unread.size());
		return map;
	}
}

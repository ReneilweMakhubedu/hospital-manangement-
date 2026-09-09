package za.gov.mpumalanga.rfh.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.QueueEntry;
import za.gov.mpumalanga.rfh.entity.User;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.QueueRepository;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/queue")
public class QueueController {

	private static final List<String> ACTIVE_STATUSES = List.of("waiting", "called", "in_consultation");
	private static final List<String> ALLOWED_STATUSES = List.of(
			"waiting", "called", "in_consultation", "completed", "cancelled");

	private final QueueRepository queueRepository;
	private final UserRepository userRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public QueueController(
			QueueRepository queueRepository,
			UserRepository userRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.queueRepository = queueRepository;
		this.userRepository = userRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public List<Map<String, Object>> today() {
		requireStaff();
		return todaysQueue();
	}

	@GetMapping("/today")
	public List<Map<String, Object>> todayAlias() {
		requireStaff();
		return todaysQueue();
	}

	@GetMapping("/patients")
	public List<Map<String, Object>> patients() {
		requireStaff();
		return userRepository.findByRoleOrderByFirstNameAsc("patient").stream().map(u -> {
			Map<String, Object> map = new LinkedHashMap<>();
			map.put("id", u.getId());
			map.put("_id", u.getId());
			map.put("firstName", u.getFirstName());
			map.put("lastName", u.getLastName());
			map.put("idNumber", u.getIdNumber());
			map.put("phoneNumber", u.getPhoneNumber());
			return map;
		}).toList();
	}

	@GetMapping("/stats")
	public Map<String, Object> stats() {
		requireStaff();
		List<QueueEntry> today = queueRepository.findByQueueDateOrderByQueueNumberAsc(LocalDate.now());
		long waiting = today.stream().filter(e -> "waiting".equalsIgnoreCase(e.getStatus())).count();
		long called = today.stream().filter(e -> "called".equalsIgnoreCase(e.getStatus())).count();
		long inConsult = today.stream().filter(e -> "in_consultation".equalsIgnoreCase(e.getStatus())).count();
		long completed = today.stream().filter(e -> "completed".equalsIgnoreCase(e.getStatus())).count();
		long cancelled = today.stream().filter(e -> "cancelled".equalsIgnoreCase(e.getStatus())).count();
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("waiting", waiting);
		map.put("called", called);
		map.put("in_consultation", inConsult);
		map.put("completed", completed);
		map.put("cancelled", cancelled);
		map.put("skipped", cancelled);
		map.put("total", today.size());
		return map;
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> add(@RequestBody Map<String, Object> body) {
		requireStaff();
		Long patientId = asLong(body.get("patientId"));
		if (patientId == null) {
			throw new ApiException(400, "Please select a patient");
		}
		User patient = userRepository.findByIdAndRole(patientId, "patient")
				.orElseThrow(() -> new ApiException(404, "Patient not found"));
		LocalDate today = LocalDate.now();
		queueRepository.findByPatientIdAndQueueDateAndStatusIn(patientId, today, ACTIVE_STATUSES)
				.ifPresent(existing -> {
					throw new ApiException(400,
							"Patient is already in today's queue as number " + existing.getQueueNumber());
				});
		Integer last = queueRepository.findMaxQueueNumberByDate(today);
		int queueNumber = (last == null ? 0 : last) + 1;
		QueueEntry entry = new QueueEntry();
		entry.setPatientId(patientId);
		entry.setQueueNumber(queueNumber);
		entry.setQueueDate(today);
		entry.setReason(body.get("reason") == null ? "" : String.valueOf(body.get("reason")));
		entry.setStatus("waiting");
		entry = queueRepository.save(entry);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("message", "Patient added to queue successfully");
		response.put("queue", responseMapper.queue(entry, patient));
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PutMapping("/next")
	public Map<String, Object> callNext() {
		requireStaff();
		LocalDate today = LocalDate.now();
		QueueEntry next = queueRepository.findFirstByQueueDateAndStatusOrderByQueueNumberAsc(today, "waiting")
				.orElseThrow(() -> new ApiException(404, "There are no waiting patients"));
		next.setStatus("called");
		next.setCalledAt(Instant.now());
		next = queueRepository.save(next);
		User patient = userRepository.findById(next.getPatientId())
				.orElseThrow(() -> new ApiException(404, "Patient not found"));
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("message", "Next patient called");
		response.put("queue", responseMapper.queue(next, patient));
		return response;
	}

	@PutMapping("/{id}/status")
	public Map<String, Object> updateStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		requireStaff();
		String status = body.get("status") == null ? null : String.valueOf(body.get("status"));
		if (status == null || !ALLOWED_STATUSES.contains(status)) {
			throw new ApiException(400, "Invalid queue status");
		}
		QueueEntry entry = queueRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Queue entry not found"));
		entry.setStatus(status);
		entry.setCompletedAt("completed".equals(status) ? Instant.now() : null);
		entry = queueRepository.save(entry);
		User patient = userRepository.findById(entry.getPatientId())
				.orElseThrow(() -> new ApiException(404, "Patient not found"));
		return responseMapper.queue(entry, patient);
	}

	@DeleteMapping("/{id}")
	public Map<String, String> delete(@PathVariable Long id) {
		requireStaff();
		QueueEntry entry = queueRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Queue entry not found"));
		queueRepository.delete(entry);
		return Map.of("message", "Queue entry removed successfully");
	}

	private List<Map<String, Object>> todaysQueue() {
		try {
			return queueRepository.findByQueueDateOrderByQueueNumberAsc(LocalDate.now()).stream()
					.map(entry -> {
						User patient = userRepository.findById(entry.getPatientId()).orElse(null);
						if (patient == null) {
							return null;
						}
						return responseMapper.queue(entry, patient);
					})
					.filter(m -> m != null)
					.toList();
		} catch (Exception ex) {
			throw new ApiException(500, "Unable to fetch queue");
		}
	}

	private void requireStaff() {
		var user = securityUtils.requireUser();
		if (!"admin".equalsIgnoreCase(user.role()) && !"doctor".equalsIgnoreCase(user.role())) {
			throw new ApiException(403, "Only clinic staff can manage the queue");
		}
	}

	private static Long asLong(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof Number number) {
			return number.longValue();
		}
		try {
			return Long.parseLong(String.valueOf(value));
		} catch (NumberFormatException ex) {
			return null;
		}
	}
}

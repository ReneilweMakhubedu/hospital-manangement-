package za.gov.mpumalanga.rfh.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import za.gov.mpumalanga.rfh.config.ResponseMapper;
import za.gov.mpumalanga.rfh.entity.Theatre;
import za.gov.mpumalanga.rfh.entity.TheatreSession;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.TheatreRepository;
import za.gov.mpumalanga.rfh.repository.TheatreSessionRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/theatres")
public class TheatresController {

	private static final Set<String> STATUSES = Set.of(
			"BOOKED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "IDLE");
	private static final int AVAILABLE_MINUTES_PER_DAY = 8 * 60;

	private final TheatreRepository theatreRepository;
	private final TheatreSessionRepository theatreSessionRepository;
	private final ResponseMapper responseMapper;
	private final SecurityUtils securityUtils;

	public TheatresController(
			TheatreRepository theatreRepository,
			TheatreSessionRepository theatreSessionRepository,
			ResponseMapper responseMapper,
			SecurityUtils securityUtils) {
		this.theatreRepository = theatreRepository;
		this.theatreSessionRepository = theatreSessionRepository;
		this.responseMapper = responseMapper;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	public List<Map<String, Object>> listTheatres() {
		securityUtils.requireStaff();
		return theatreRepository.findAllByOrderByNameAsc().stream()
				.map(responseMapper::theatre)
				.toList();
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> createTheatre(@RequestBody Map<String, Object> body) {
		securityUtils.requireAdmin();
		String name = requireText(str(body.get("name")), "name");
		Theatre theatre = new Theatre();
		theatre.setName(name.trim());
		theatre.setLocation(blankToNull(str(body.get("location"))));
		theatre.setActive(asBoolean(body.get("active"), true));
		theatre = theatreRepository.save(theatre);
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.theatre(theatre));
	}

	@GetMapping("/sessions")
	public List<Map<String, Object>> listSessions(
			@RequestParam(required = false) String from,
			@RequestParam(required = false) String to) {
		securityUtils.requireStaff();
		LocalDate fromDate = from == null || from.isBlank() ? LocalDate.now().minusDays(7) : parseDate(from, "from");
		LocalDate toDate = to == null || to.isBlank() ? LocalDate.now().plusDays(14) : parseDate(to, "to");
		if (toDate.isBefore(fromDate)) {
			throw new ApiException(400, "to must be on or after from");
		}
		return theatreSessionRepository
				.findBySessionDateBetweenOrderBySessionDateAscStartTimeAsc(fromDate, toDate)
				.stream()
				.map(responseMapper::theatreSession)
				.toList();
	}

	@PostMapping("/sessions")
	public ResponseEntity<Map<String, Object>> bookSession(@RequestBody Map<String, Object> body) {
		securityUtils.requireStaff();
		Long theatreId = asLong(body.get("theatreId"));
		if (theatreId == null || theatreRepository.findById(theatreId).isEmpty()) {
			throw new ApiException(400, "Select a valid theatre");
		}
		LocalDate sessionDate = parseDate(str(body.get("sessionDate")), "sessionDate");
		LocalTime startTime = parseTime(str(body.get("startTime")), "startTime");
		LocalTime endTime = parseTime(str(body.get("endTime")), "endTime");
		if (!endTime.isAfter(startTime)) {
			throw new ApiException(400, "endTime must be after startTime");
		}
		String procedureName = requireText(str(body.get("procedureName")), "procedureName");

		TheatreSession session = new TheatreSession();
		session.setTheatreId(theatreId);
		session.setSessionDate(sessionDate);
		session.setStartTime(startTime);
		session.setEndTime(endTime);
		session.setProcedureName(procedureName.trim());
		session.setPatientId(asLong(body.get("patientId")));
		session.setWaitlistEntryId(asLong(body.get("waitlistEntryId")));
		session.setStatus(normalizeStatus(str(body.get("status")), "BOOKED"));
		session.setUtilisationMinutes((int) ChronoUnit.MINUTES.between(startTime, endTime));
		session.setNotes(blankToNull(str(body.get("notes"))));
		session = theatreSessionRepository.save(session);
		return ResponseEntity.status(HttpStatus.CREATED).body(responseMapper.theatreSession(session));
	}

	@PutMapping("/sessions/{id}")
	public Map<String, Object> updateSession(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		securityUtils.requireStaff();
		TheatreSession session = theatreSessionRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Theatre session not found"));

		if (body.containsKey("status")) {
			session.setStatus(normalizeStatus(str(body.get("status")), null));
		}
		if (body.containsKey("notes")) {
			session.setNotes(blankToNull(str(body.get("notes"))));
		}
		if (body.containsKey("procedureName")) {
			session.setProcedureName(requireText(str(body.get("procedureName")), "procedureName").trim());
		}
		if (body.containsKey("startTime") || body.containsKey("endTime")) {
			LocalTime start = body.containsKey("startTime")
					? parseTime(str(body.get("startTime")), "startTime")
					: session.getStartTime();
			LocalTime end = body.containsKey("endTime")
					? parseTime(str(body.get("endTime")), "endTime")
					: session.getEndTime();
			if (!end.isAfter(start)) {
				throw new ApiException(400, "endTime must be after startTime");
			}
			session.setStartTime(start);
			session.setEndTime(end);
			session.setUtilisationMinutes((int) ChronoUnit.MINUTES.between(start, end));
		}
		if (body.containsKey("utilisationMinutes")) {
			Integer minutes = asInt(body.get("utilisationMinutes"));
			if (minutes == null || minutes < 0) {
				throw new ApiException(400, "utilisationMinutes must be zero or more");
			}
			session.setUtilisationMinutes(minutes);
		}
		return responseMapper.theatreSession(theatreSessionRepository.save(session));
	}

	@GetMapping("/utilisation")
	public List<Map<String, Object>> utilisation(
			@RequestParam(required = false) String from,
			@RequestParam(required = false) String to) {
		securityUtils.requireStaff();
		LocalDate fromDate = from == null || from.isBlank() ? LocalDate.now().withDayOfMonth(1) : parseDate(from, "from");
		LocalDate toDate = to == null || to.isBlank() ? LocalDate.now() : parseDate(to, "to");
		if (toDate.isBefore(fromDate)) {
			throw new ApiException(400, "to must be on or after from");
		}
		long days = ChronoUnit.DAYS.between(fromDate, toDate) + 1;
		long availableMinutes = days * AVAILABLE_MINUTES_PER_DAY;

		List<TheatreSession> sessions = theatreSessionRepository
				.findBySessionDateBetweenOrderBySessionDateAscStartTimeAsc(fromDate, toDate);
		List<Map<String, Object>> result = new ArrayList<>();
		for (Theatre theatre : theatreRepository.findAllByOrderByNameAsc()) {
			List<TheatreSession> theatreSessions = sessions.stream()
					.filter(s -> theatre.getId().equals(s.getTheatreId()))
					.toList();
			int bookedMinutes = theatreSessions.stream()
					.filter(s -> !"CANCELLED".equalsIgnoreCase(s.getStatus()) && !"IDLE".equalsIgnoreCase(s.getStatus()))
					.mapToInt(s -> safeMinutes(s))
					.sum();
			int completedMinutes = theatreSessions.stream()
					.filter(s -> "COMPLETED".equalsIgnoreCase(s.getStatus()))
					.mapToInt(s -> safeMinutes(s))
					.sum();
			long cancelledCount = theatreSessions.stream()
					.filter(s -> "CANCELLED".equalsIgnoreCase(s.getStatus()))
					.count();
			double utilisationPercent = availableMinutes == 0
					? 0.0
					: Math.round((completedMinutes * 1000.0) / availableMinutes) / 10.0;

			Map<String, Object> row = new LinkedHashMap<>();
			row.put("theatreId", theatre.getId());
			row.put("theatreName", theatre.getName());
			row.put("from", fromDate.toString());
			row.put("to", toDate.toString());
			row.put("availableMinutes", availableMinutes);
			row.put("bookedMinutes", bookedMinutes);
			row.put("completedMinutes", completedMinutes);
			row.put("cancelledCount", cancelledCount);
			row.put("utilisationPercent", utilisationPercent);
			result.add(row);
		}
		return result;
	}

	private static int safeMinutes(TheatreSession session) {
		if (session.getUtilisationMinutes() != null && session.getUtilisationMinutes() > 0) {
			return session.getUtilisationMinutes();
		}
		if (session.getStartTime() != null && session.getEndTime() != null) {
			return (int) ChronoUnit.MINUTES.between(session.getStartTime(), session.getEndTime());
		}
		return 0;
	}

	private static String normalizeStatus(String value, String fallback) {
		if (value == null || value.isBlank()) {
			if (fallback == null) {
				throw new ApiException(400, "status is required");
			}
			return fallback;
		}
		String normalized = value.trim().toUpperCase(Locale.ROOT);
		if (!STATUSES.contains(normalized)) {
			throw new ApiException(400, "status must be BOOKED, IN_PROGRESS, COMPLETED, CANCELLED, or IDLE");
		}
		return normalized;
	}

	private static LocalDate parseDate(String value, String label) {
		if (value == null || value.isBlank()) {
			throw new ApiException(400, label + " is required");
		}
		try {
			return LocalDate.parse(value.trim());
		} catch (Exception ex) {
			throw new ApiException(400, label + " must be yyyy-MM-dd");
		}
	}

	private static LocalTime parseTime(String value, String label) {
		if (value == null || value.isBlank()) {
			throw new ApiException(400, label + " is required");
		}
		try {
			return LocalTime.parse(value.trim());
		} catch (Exception ex) {
			throw new ApiException(400, label + " must be HH:mm");
		}
	}

	private static String requireText(String value, String label) {
		if (value == null || value.isBlank()) {
			throw new ApiException(400, label + " is required");
		}
		return value;
	}

	private static String blankToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}

	private static String str(Object value) {
		return value == null ? null : String.valueOf(value);
	}

	private static Long asLong(Object value) {
		if (value == null || String.valueOf(value).isBlank()) {
			return null;
		}
		if (value instanceof Number number) {
			return number.longValue();
		}
		try {
			return Long.parseLong(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private static Integer asInt(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof Number number) {
			return number.intValue();
		}
		try {
			return Integer.valueOf(String.valueOf(value).trim());
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private static boolean asBoolean(Object value, boolean fallback) {
		if (value == null) {
			return fallback;
		}
		if (value instanceof Boolean bool) {
			return bool;
		}
		String s = String.valueOf(value).trim().toLowerCase(Locale.ROOT);
		if ("true".equals(s) || "1".equals(s) || "yes".equals(s)) {
			return true;
		}
		if ("false".equals(s) || "0".equals(s) || "no".equals(s)) {
			return false;
		}
		return fallback;
	}
}

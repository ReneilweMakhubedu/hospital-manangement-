package za.gov.mpumalanga.rfh.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import za.gov.mpumalanga.rfh.exception.ApiException;

/**
 * Rule-based clinical/ops assistant drafts. Staff must review before applying.
 * Designed as a stable API surface that can later call a real LLM vendor.
 */
@Service
public class AssistService {

	private static final Pattern SENTENCE_SPLIT = Pattern.compile("(?<=[.!?])\\s+|\\n+");

	public Map<String, Object> assist(String action, String portal, String text, Map<String, Object> context) {
		String act = action == null ? "" : action.trim().toLowerCase(Locale.ROOT);
		String body = text == null ? "" : text.trim();
		String portalKey = portal == null ? "general" : portal.trim().toLowerCase(Locale.ROOT);

		return switch (act) {
			case "draft-note", "scribe", "soap" -> draftSoap(body);
			case "summarise", "summarize" -> summarise(body, portalKey);
			case "prioritise", "prioritize" -> prioritise(body, portalKey, context);
			case "triage" -> triage(body);
			case "handover" -> handover(body);
			case "work-order" -> workOrder(body);
			default -> throw new ApiException(400, "Unknown assist action. Use draft-note, summarise, prioritise, triage, handover, or work-order.");
		};
	}

	public Map<String, Object> draftSoap(String transcript) {
		if (transcript == null || transcript.isBlank()) {
			throw new ApiException(400, "text is required");
		}
		List<String> sentences = splitSentences(transcript);
		List<String> subjective = new ArrayList<>();
		List<String> objective = new ArrayList<>();
		List<String> assessment = new ArrayList<>();
		List<String> plan = new ArrayList<>();

		for (String sentence : sentences) {
			String lower = sentence.toLowerCase(Locale.ROOT);
			if (containsAny(lower, "plan", "prescribe", "follow-up", "follow up", "refer", "return", "advise", "discharge", "admit")) {
				plan.add(sentence);
			} else if (containsAny(lower, "diagnos", "impression", "likely", "suspect", "assessment", "consistent with")) {
				assessment.add(sentence);
			} else if (containsAny(lower, "bp", "pulse", "temp", "exam", "vitals", "lab", "x-ray", "oxygen", "weight", "spo2", "glucose", "tender", "swelling")) {
				objective.add(sentence);
			} else {
				subjective.add(sentence);
			}
		}
		if (subjective.isEmpty() && !sentences.isEmpty()) {
			subjective.add(sentences.get(0));
		}

		String subjectiveText = joinOrDefault(subjective, "Patient history captured from spoken draft.");
		String objectiveText = joinOrDefault(objective, "Objective findings to be completed.");
		String assessmentText = joinOrDefault(assessment, "Assessment to be confirmed by clinician.");
		String planText = joinOrDefault(plan, "Plan to be completed by clinician.");

		Map<String, Object> draft = base("Clinical note assistant (draft)", "draft-note");
		draft.put("subjective", subjectiveText);
		draft.put("objective", objectiveText);
		draft.put("assessment", assessmentText);
		draft.put("plan", planText);
		draft.put("summary", subjectiveText + " " + assessmentText);
		draft.put("suggestedFields", Map.of(
				"subjective", subjectiveText,
				"objective", objectiveText,
				"assessment", assessmentText,
				"plan", planText));
		return draft;
	}

	public Map<String, Object> summarise(String text, String portal) {
		if (text == null || text.isBlank()) {
			throw new ApiException(400, "text is required");
		}
		List<String> sentences = splitSentences(text);
		List<String> bullets = sentences.size() <= 4 ? sentences : sentences.subList(0, 4);
		String headline = sentences.isEmpty() ? "No content" : truncate(sentences.get(0), 140);
		Map<String, Object> draft = base(portalLabel(portal) + " summary (draft)", "summarise");
		draft.put("headline", headline);
		draft.put("bullets", bullets);
		draft.put("summary", String.join(" ", bullets));
		draft.put("wordCount", text.split("\\s+").length);
		return draft;
	}

	public Map<String, Object> prioritise(String text, String portal, Map<String, Object> context) {
		String blob = ((text == null ? "" : text) + " " + String.valueOf(context == null ? "" : context))
				.toLowerCase(Locale.ROOT);
		String priority;
		String reason;
		if (containsAny(blob, "stat", "critical", "red", "crash", "cardiac", "resus", "down", "outage", "life-threat")) {
			priority = "CRITICAL";
			reason = "Urgent language detected (STAT/critical/life-threat).";
		} else if (containsAny(blob, "orange", "high", "fever", "pain", "broken", "leak", "overdue", "breach")) {
			priority = "HIGH";
			reason = "Elevated urgency cues detected.";
		} else if (containsAny(blob, "routine", "green", "elective", "follow-up")) {
			priority = "ROUTINE";
			reason = "Routine/follow-up language detected.";
		} else {
			priority = "MEDIUM";
			reason = "No strong urgency cues — default medium priority.";
		}
		Map<String, Object> draft = base(portalLabel(portal) + " priority suggestion", "prioritise");
		draft.put("priority", priority);
		draft.put("reason", reason);
		draft.put("summary", priority + ": " + reason);
		return draft;
	}

	public Map<String, Object> triage(String chiefComplaint) {
		if (chiefComplaint == null || chiefComplaint.isBlank()) {
			throw new ApiException(400, "text (chief complaint) is required");
		}
		String lower = chiefComplaint.toLowerCase(Locale.ROOT);
		String category;
		String rationale;
		if (containsAny(lower, "chest pain", "unconscious", "not breathing", "severe bleeding", "stroke", "seizure", "anaphylaxis")) {
			category = "RED";
			rationale = "Potential immediate threat to life — SATS RED.";
		} else if (containsAny(lower, "shortness of breath", "difficulty breathing", "severe pain", "high fever", "fracture", "vomiting blood")) {
			category = "ORANGE";
			rationale = "Very urgent presentation cues — SATS ORANGE.";
		} else if (containsAny(lower, "abdominal pain", "moderate pain", "fever", "asthma", "vomiting", "diarrhea", "diarrhoea")) {
			category = "YELLOW";
			rationale = "Urgent but not immediately life-threatening — SATS YELLOW.";
		} else if (containsAny(lower, "cold", "flu", "rash", "mild", "sore throat", "checkup", "check-up")) {
			category = "GREEN";
			rationale = "Standard acuity cues — SATS GREEN.";
		} else {
			category = "YELLOW";
			rationale = "Insufficient detail — default YELLOW pending nurse triage.";
		}
		Map<String, Object> draft = base("ED triage suggestion (draft)", "triage");
		draft.put("triageCategory", category);
		draft.put("reason", rationale);
		draft.put("summary", category + " — " + rationale);
		draft.put("suggestedFields", Map.of("triageCategory", category));
		draft.put("disclaimer", "Suggestion only. Apply SATS with clinical assessment.");
		return draft;
	}

	public Map<String, Object> handover(String text) {
		if (text == null || text.isBlank()) {
			throw new ApiException(400, "text is required");
		}
		List<String> sentences = splitSentences(text);
		List<String> concerns = new ArrayList<>();
		List<String> tasks = new ArrayList<>();
		List<String> other = new ArrayList<>();
		for (String s : sentences) {
			String lower = s.toLowerCase(Locale.ROOT);
			if (containsAny(lower, "watch", "risk", "unstable", "deteriorat", "concern", "alert")) {
				concerns.add(s);
			} else if (containsAny(lower, "due", "give", "check", "repeat", "follow", "pending", "await")) {
				tasks.add(s);
			} else {
				other.add(s);
			}
		}
		Map<String, Object> draft = base("Nursing handover draft", "handover");
		String situation = joinOrDefault(
				other.isEmpty() ? sentences.subList(0, Math.min(2, sentences.size())) : other.subList(0, Math.min(2, other.size())),
				text);
		List<String> concernLines = concerns.isEmpty() ? List.of("No explicit deterioration cues flagged.") : concerns;
		List<String> taskLines = tasks.isEmpty() ? List.of("Confirm outstanding tasks with outgoing nurse.") : tasks;
		draft.put("situation", situation);
		draft.put("concerns", concernLines);
		draft.put("outstandingTasks", taskLines);
		draft.put("summary", situation);
		draft.put("suggestedFields", Map.of(
				"notes", situation + " Concerns: " + String.join("; ", concernLines)
						+ " Tasks: " + String.join("; ", taskLines)));
		return draft;
	}

	public Map<String, Object> workOrder(String text) {
		if (text == null || text.isBlank()) {
			throw new ApiException(400, "text is required");
		}
		Map<String, Object> prio = prioritise(text, "facilities", Map.of());
		String category = "GENERAL";
		String lower = text.toLowerCase(Locale.ROOT);
		if (containsAny(lower, "oxygen", "ventilator", "monitor", "defib", "x-ray", "biomed")) {
			category = "BIOMED";
		} else if (containsAny(lower, "water", "pipe", "toilet", "sewage", "plumb")) {
			category = "PLUMBING";
		} else if (containsAny(lower, "power", "light", "electric", "ups", "generator")) {
			category = "ELECTRICAL";
		} else if (containsAny(lower, "hvac", "aircon", "air-con", "heating", "cooling")) {
			category = "HVAC";
		}
		Map<String, Object> draft = base("Facilities work-order draft", "work-order");
		draft.put("category", category);
		draft.put("priority", prio.get("priority"));
		draft.put("reason", prio.get("reason"));
		draft.put("title", truncate(splitSentences(text).get(0), 80));
		draft.put("summary", category + " / " + prio.get("priority") + ": " + truncate(text, 160));
		draft.put("suggestedFields", Map.of(
				"priority", prio.get("priority"),
				"description", text.trim(),
				"title", draft.get("title")));
		return draft;
	}

	private static Map<String, Object> base(String label, String action) {
		Map<String, Object> draft = new LinkedHashMap<>();
		draft.put("draftAssistant", true);
		draft.put("action", action);
		draft.put("label", label);
		draft.put("requiresConfirmation", true);
		draft.put("engine", "rfh-rules-v1");
		return draft;
	}

	private static String portalLabel(String portal) {
		return switch (portal == null ? "" : portal) {
			case "nursing" -> "Nursing";
			case "casualty" -> "Casualty";
			case "lab" -> "Laboratory";
			case "radiology" -> "Radiology";
			case "facilities" -> "Facilities";
			case "allied" -> "Allied health";
			case "pharmacy" -> "Pharmacy";
			case "doctor" -> "Clinical";
			default -> "Operations";
		};
	}

	private static List<String> splitSentences(String text) {
		String[] parts = SENTENCE_SPLIT.split(text);
		List<String> sentences = new ArrayList<>();
		for (String part : parts) {
			String trimmed = part.trim();
			if (!trimmed.isEmpty()) {
				sentences.add(trimmed);
			}
		}
		return sentences;
	}

	private static boolean containsAny(String haystack, String... needles) {
		for (String needle : needles) {
			if (haystack.contains(needle)) {
				return true;
			}
		}
		return false;
	}

	private static String joinOrDefault(List<String> parts, String fallback) {
		if (parts == null || parts.isEmpty()) {
			return fallback;
		}
		return String.join(" ", parts);
	}

	private static String truncate(String value, int max) {
		if (value == null) {
			return "";
		}
		String t = value.trim();
		return t.length() <= max ? t : t.substring(0, max - 1) + "…";
	}
}

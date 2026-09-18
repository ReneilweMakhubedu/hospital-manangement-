package za.gov.mpumalanga.rfh.controller;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import za.gov.mpumalanga.rfh.entity.SupportEntity;
import za.gov.mpumalanga.rfh.exception.ApiException;

final class SupportApi {
	private SupportApi() {}

	static Map<String, Object> map(SupportEntity entity) {
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("_id", entity.id);
		result.put("id", entity.id);
		for (Field field : entity.getClass().getFields()) {
			if ("id".equals(field.getName())) continue;
			try {
				result.put(field.getName(), field.get(entity));
			} catch (IllegalAccessException ignored) {
				// Public entity fields are always accessible.
			}
		}
		return result;
	}

	static <T extends SupportEntity> T apply(T entity, Map<String, Object> body) {
		for (Field field : entity.getClass().getFields()) {
			if ("id".equals(field.getName()) || !body.containsKey(field.getName())) continue;
			try {
				field.set(entity, convert(body.get(field.getName()), field.getType()));
			} catch (ReflectiveOperationException | IllegalArgumentException ex) {
				throw new ApiException(400, "Invalid " + field.getName());
			}
		}
		return entity;
	}

	static String required(Map<String, Object> body, String field) {
		Object value = body.get(field);
		if (value == null || String.valueOf(value).isBlank()) {
			throw new ApiException(400, field + " is required");
		}
		return String.valueOf(value).trim();
	}

	static String choice(String value, String field, Set<String> choices) {
		String normalized = value == null ? null : value.trim().toUpperCase(Locale.ROOT);
		if (normalized == null || !choices.contains(normalized)) {
			throw new ApiException(400, "Invalid " + field);
		}
		return normalized;
	}

	static String optionalChoice(Map<String, Object> body, String field, Set<String> choices, String fallback) {
		if (!body.containsKey(field)) return fallback;
		return choice(String.valueOf(body.get(field)), field, choices);
	}

	private static Object convert(Object value, Class<?> type) {
		if (value == null) return null;
		if (type == String.class) return String.valueOf(value).trim();
		if (type == Long.class) return value instanceof Number n ? n.longValue() : Long.valueOf(String.valueOf(value));
		if (type == Integer.class) return value instanceof Number n ? n.intValue() : Integer.valueOf(String.valueOf(value));
		if (type == Double.class) return value instanceof Number n ? n.doubleValue() : Double.valueOf(String.valueOf(value));
		if (type == Instant.class) return value instanceof Instant ? value : Instant.parse(String.valueOf(value));
		if (type == LocalDate.class) return value instanceof LocalDate ? value : LocalDate.parse(String.valueOf(value));
		return value;
	}
}

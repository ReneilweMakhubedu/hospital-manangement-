package za.gov.mpumalanga.rfh.service;

import za.gov.mpumalanga.rfh.exception.ApiException;

public final class ClinicalSignOff {
	private ClinicalSignOff() {}

	public static String require(Object value) {
		String text = value == null ? "" : String.valueOf(value).trim();
		if ("null".equals(text)) text = "";
		if (text.length() < 8) {
			throw new ApiException(400, "Electronic sign-off needs a reason of at least 8 characters");
		}
		return text;
	}

	public static boolean acknowledged(Object value) {
		if (value instanceof Boolean flag) return flag;
		return "true".equalsIgnoreCase(String.valueOf(value));
	}
}

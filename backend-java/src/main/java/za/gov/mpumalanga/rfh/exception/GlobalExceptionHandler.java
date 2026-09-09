package za.gov.mpumalanga.rfh.exception;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ApiException.class)
	public ResponseEntity<Map<String, String>> handleApi(ApiException ex) {
		return ResponseEntity.status(ex.getStatus()).body(Map.of("error", ex.getMessage()));
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<Map<String, String>> handleConflict(DataIntegrityViolationException ex) {
		String message = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
		String lower = message == null ? "" : message.toLowerCase();
		if (lower.contains("email") || lower.contains("unique") || lower.contains("constraint")) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Email already exists"));
		}
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Unable to complete request"));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(Map.of("error", ex.getMessage() != null ? ex.getMessage() : "Internal server error"));
	}
}

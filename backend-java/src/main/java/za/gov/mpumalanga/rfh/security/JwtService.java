package za.gov.mpumalanga.rfh.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtService {

	private final SecretKey key;
	private final long expirationMs;

	public JwtService(
			@Value("${app.jwt.secret}") String secret,
			@Value("${app.jwt.expiration-ms}") long expirationMs) {
		byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
		if (secretBytes.length < 32) {
			byte[] padded = new byte[32];
			System.arraycopy(secretBytes, 0, padded, 0, secretBytes.length);
			secretBytes = padded;
		}
		this.key = Keys.hmacShaKeyFor(secretBytes);
		this.expirationMs = expirationMs;
	}

	public String generateToken(Long id, String role) {
		Date now = new Date();
		return Jwts.builder()
				.claim("id", id)
				.claim("role", role)
				.issuedAt(now)
				.expiration(new Date(now.getTime() + expirationMs))
				.signWith(key)
				.compact();
	}

	public AuthUser parseToken(String token) {
		Claims claims = Jwts.parser()
				.verifyWith(key)
				.build()
				.parseSignedClaims(token)
				.getPayload();
		Number id = claims.get("id", Number.class);
		String role = claims.get("role", String.class);
		if (id == null || role == null) {
			throw new IllegalArgumentException("Invalid token claims");
		}
		return new AuthUser(id.longValue(), role);
	}
}

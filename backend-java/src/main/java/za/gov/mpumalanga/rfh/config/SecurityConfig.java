package za.gov.mpumalanga.rfh.config;

import tools.jackson.databind.ObjectMapper;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import za.gov.mpumalanga.rfh.security.JwtAuthFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig implements WebMvcConfigurer {

	private final JwtAuthFilter jwtAuthFilter;
	private final ObjectMapper objectMapper;

	public SecurityConfig(JwtAuthFilter jwtAuthFilter, ObjectMapper objectMapper) {
		this.jwtAuthFilter = jwtAuthFilter;
		this.objectMapper = objectMapper;
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				.csrf(csrf -> csrf.disable())
				.cors(Customizer.withDefaults())
				.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/login", "/api/signup").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/health", "/", "/api/doctor/all", "/api/cms/hero", "/uploads/**", "/h2-console/**").permitAll()
						.anyRequest().authenticated())
				.exceptionHandling(ex -> ex
						.authenticationEntryPoint((request, response, authException) -> {
							response.setStatus(401);
							response.setContentType(MediaType.APPLICATION_JSON_VALUE);
							objectMapper.writeValue(response.getOutputStream(), Map.of("error", "No token provided"));
						})
						.accessDeniedHandler((request, response, accessDeniedException) -> {
							response.setStatus(403);
							response.setContentType(MediaType.APPLICATION_JSON_VALUE);
							objectMapper.writeValue(response.getOutputStream(), Map.of("error", "Not authorized"));
						}))
				.headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
				.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
				.httpBasic(basic -> basic.disable())
				.formLogin(form -> form.disable());
		return http.build();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOriginPatterns(List.of(
				"http://localhost:*",
				"http://127.0.0.1:*",
				"http://192.168.*.*:*",
				"http://10.*.*.*:*"));
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("*"));
		config.setAllowCredentials(true);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		Path uploadPath = Paths.get("uploads").toAbsolutePath().normalize();
		registry.addResourceHandler("/uploads/**")
				.addResourceLocations(uploadPath.toUri().toString());
	}
}

package za.gov.mpumalanga.rfh;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class RfhHmsApplication {

	public static void main(String[] args) {
		SpringApplication.run(RfhHmsApplication.class, args);
	}

}

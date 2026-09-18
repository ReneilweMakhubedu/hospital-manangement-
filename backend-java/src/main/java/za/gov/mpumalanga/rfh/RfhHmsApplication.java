package za.gov.mpumalanga.rfh;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
@EnableScheduling
public class RfhHmsApplication {

	public static void main(String[] args) {
		SpringApplication.run(RfhHmsApplication.class, args);
	}

}

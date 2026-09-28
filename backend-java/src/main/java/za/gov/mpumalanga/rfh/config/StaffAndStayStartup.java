package za.gov.mpumalanga.rfh.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import za.gov.mpumalanga.rfh.entity.User;
import za.gov.mpumalanga.rfh.entity.WardBed;
import za.gov.mpumalanga.rfh.repository.SupportStore;
import za.gov.mpumalanga.rfh.repository.UserRepository;
import za.gov.mpumalanga.rfh.service.StaffLinkService;

@Component
@Order(100)
public class StaffAndStayStartup implements ApplicationRunner {
	private final StaffLinkService staffLinkService;
	private final UserRepository userRepository;
	private final SupportStore supportStore;
	private final PasswordEncoder passwordEncoder;

	public StaffAndStayStartup(StaffLinkService staffLinkService, UserRepository userRepository, SupportStore supportStore, PasswordEncoder passwordEncoder) {
		this.staffLinkService = staffLinkService;
		this.userRepository = userRepository;
		this.supportStore = supportStore;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	public void run(ApplicationArguments args) {
		staffLinkService.link();
		linkInpatientNextOfKin();
	}

	private void linkInpatientNextOfKin() {
		User nomsa = userRepository.findByEmailIgnoreCase("nomsa.mthembu@rfh.gov.za").orElse(null);
		if (nomsa == null) {
			nomsa = new User();
			nomsa.setFirstName("Nomsa");
			nomsa.setLastName("Mthembu");
			nomsa.setEmail("nomsa.mthembu@rfh.gov.za");
			nomsa.setPassword(passwordEncoder.encode("Patient123!"));
			nomsa.setRole("patient");
			nomsa.setOnboardingComplete(1);
		}
		if (nomsa.getNextOfKin() == null || nomsa.getNextOfKin().isBlank()) {
			nomsa.setNextOfKin("Thandi Mokoena");
			nomsa.setNextOfKinRelation("Sister");
			nomsa.setNextOfKinPhone("0820001001");
		}
		nomsa = userRepository.save(nomsa);
		for (WardBed bed : supportStore.all(WardBed.class)) {
			if (!"Nomsa Mthembu".equalsIgnoreCase(bed.patientName)) continue;
			if (bed.patientId != null && bed.patientId.equals(nomsa.getId())) continue;
			if (bed.patientId != null && bed.patientId != 1001L) continue;
			bed.patientId = nomsa.getId();
			supportStore.save(bed);
		}
	}
}

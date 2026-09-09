package za.gov.mpumalanga.rfh.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.Doctor;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
	Optional<Doctor> findByEmailIgnoreCase(String email);
}

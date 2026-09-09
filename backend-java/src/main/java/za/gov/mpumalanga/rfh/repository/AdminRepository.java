package za.gov.mpumalanga.rfh.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.Admin;

public interface AdminRepository extends JpaRepository<Admin, Long> {
	Optional<Admin> findByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCase(String email);
}

package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
	Optional<User> findByEmailIgnoreCase(String email);

	Optional<User> findByIdAndRole(Long id, String role);

	List<User> findByRoleOrderByCreatedAtDesc(String role);

	List<User> findByRoleOrderByFirstNameAsc(String role);

	boolean existsByEmailIgnoreCaseAndIdNotAndRole(String email, Long id, String role);

	boolean existsByIdNumberAndIdNotAndRole(String idNumber, Long id, String role);

	long countByRole(String role);
}

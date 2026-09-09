package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.Complaint;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
	List<Complaint> findAllByOrderByLoggedAtDesc();

	long countByReferenceNumberStartingWith(String prefix);
}

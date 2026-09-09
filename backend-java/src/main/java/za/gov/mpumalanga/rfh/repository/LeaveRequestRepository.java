package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.LeaveRequest;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
	List<LeaveRequest> findAllByOrderByCreatedAtDesc();

	long countByStatusIgnoreCase(String status);
}

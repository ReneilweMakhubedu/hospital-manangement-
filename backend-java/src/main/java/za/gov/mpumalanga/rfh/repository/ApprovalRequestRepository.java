package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.ApprovalRequest;

public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {
	List<ApprovalRequest> findAllByOrderByRequestedAtDesc();

	long countByStatusIgnoreCase(String status);
}

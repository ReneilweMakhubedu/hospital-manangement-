package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.PurchaseRequisition;

public interface PurchaseRequisitionRepository extends JpaRepository<PurchaseRequisition, Long> {
	List<PurchaseRequisition> findAllByOrderByCreatedAtDesc();
}

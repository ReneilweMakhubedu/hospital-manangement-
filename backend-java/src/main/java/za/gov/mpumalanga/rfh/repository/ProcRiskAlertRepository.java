package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.ProcRiskAlert;

public interface ProcRiskAlertRepository extends JpaRepository<ProcRiskAlert, Long> {
	List<ProcRiskAlert> findAllByOrderByCreatedAtDesc();

	List<ProcRiskAlert> findTop5ByStatusIgnoreCaseOrderByCreatedAtDesc(String status);
}

package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.ProcAiInsight;

public interface ProcAiInsightRepository extends JpaRepository<ProcAiInsight, Long> {
	List<ProcAiInsight> findAllByOrderByCreatedAtDesc();

	List<ProcAiInsight> findTop3ByOrderByCreatedAtDesc();
}

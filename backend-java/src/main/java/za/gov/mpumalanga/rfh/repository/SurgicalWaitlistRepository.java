package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.SurgicalWaitlistEntry;

public interface SurgicalWaitlistRepository extends JpaRepository<SurgicalWaitlistEntry, Long> {
	List<SurgicalWaitlistEntry> findAllByOrderByDecisionToTreatDateAsc();
}

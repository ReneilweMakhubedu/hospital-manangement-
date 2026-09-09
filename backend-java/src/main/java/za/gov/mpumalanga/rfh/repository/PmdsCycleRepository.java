package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.PmdsCycle;

public interface PmdsCycleRepository extends JpaRepository<PmdsCycle, Long> {
	List<PmdsCycle> findAllByOrderByCycleYearDescStaffNameAsc();
}

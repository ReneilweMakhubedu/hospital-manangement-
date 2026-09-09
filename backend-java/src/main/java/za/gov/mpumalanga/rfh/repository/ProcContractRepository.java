package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.ProcContract;

public interface ProcContractRepository extends JpaRepository<ProcContract, Long> {
	List<ProcContract> findAllByOrderByCreatedAtDesc();
}

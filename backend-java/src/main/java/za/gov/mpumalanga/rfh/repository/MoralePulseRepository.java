package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.MoralePulse;

public interface MoralePulseRepository extends JpaRepository<MoralePulse, Long> {
	List<MoralePulse> findAllByOrderByCapturedAtDesc();
}

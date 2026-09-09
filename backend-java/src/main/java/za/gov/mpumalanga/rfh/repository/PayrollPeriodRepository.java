package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.PayrollPeriod;

public interface PayrollPeriodRepository extends JpaRepository<PayrollPeriod, Long> {
	List<PayrollPeriod> findAllByOrderByCreatedAtDesc();

	List<PayrollPeriod> findByStatusIgnoreCaseOrderByCreatedAtDesc(String status);
}

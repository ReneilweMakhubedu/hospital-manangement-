package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.PayrollCostCentre;

public interface PayrollCostCentreRepository extends JpaRepository<PayrollCostCentre, Long> {
	List<PayrollCostCentre> findAllByOrderByDepartmentAsc();
}

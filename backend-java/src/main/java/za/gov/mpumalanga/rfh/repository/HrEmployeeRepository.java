package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.HrEmployee;

public interface HrEmployeeRepository extends JpaRepository<HrEmployee, Long> {
	List<HrEmployee> findAllByOrderByLastNameAscFirstNameAsc();

	long countByStatusIgnoreCase(String status);
}

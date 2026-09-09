package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.TimesheetEntry;

public interface TimesheetEntryRepository extends JpaRepository<TimesheetEntry, Long> {
	List<TimesheetEntry> findAllByOrderByCreatedAtDesc();

	List<TimesheetEntry> findByDepartmentIgnoreCaseOrderByCreatedAtDesc(String department);

	List<TimesheetEntry> findByStatusIgnoreCaseOrderByCreatedAtDesc(String status);

	List<TimesheetEntry> findByDepartmentIgnoreCaseAndStatusIgnoreCaseOrderByCreatedAtDesc(
			String department, String status);
}

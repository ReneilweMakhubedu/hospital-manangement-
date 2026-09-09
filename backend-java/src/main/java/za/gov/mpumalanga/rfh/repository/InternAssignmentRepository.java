package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.InternAssignment;

public interface InternAssignmentRepository extends JpaRepository<InternAssignment, Long> {
	List<InternAssignment> findAllByOrderByStartDateDesc();

	List<InternAssignment> findBySupervisorDoctorId(Long supervisorDoctorId);
}

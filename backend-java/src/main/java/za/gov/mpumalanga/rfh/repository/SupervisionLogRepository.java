package za.gov.mpumalanga.rfh.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.SupervisionLog;

public interface SupervisionLogRepository extends JpaRepository<SupervisionLog, Long> {
	List<SupervisionLog> findAllByOrderBySessionDateDesc();

	List<SupervisionLog> findByAssignmentIdOrderBySessionDateDesc(Long assignmentId);

	List<SupervisionLog> findBySessionDateBetween(LocalDate from, LocalDate to);
}

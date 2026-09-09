package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.TrainingEnrolment;

public interface TrainingEnrolmentRepository extends JpaRepository<TrainingEnrolment, Long> {
	List<TrainingEnrolment> findAllByOrderByCreatedAtDesc();
}

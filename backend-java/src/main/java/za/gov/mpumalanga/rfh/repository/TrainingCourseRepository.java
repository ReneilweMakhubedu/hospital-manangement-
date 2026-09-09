package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.TrainingCourse;

public interface TrainingCourseRepository extends JpaRepository<TrainingCourse, Long> {
	List<TrainingCourse> findAllByOrderByScheduledDateAscTitleAsc();

	long countByStatusIgnoreCase(String status);
}

package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.HrApplicant;

public interface HrApplicantRepository extends JpaRepository<HrApplicant, Long> {
	List<HrApplicant> findAllByOrderByAppliedAtDesc();

	List<HrApplicant> findByStatusIgnoreCaseOrderByAppliedAtDesc(String status);
}

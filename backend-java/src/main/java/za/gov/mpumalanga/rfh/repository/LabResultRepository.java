package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.LabResult;

public interface LabResultRepository extends JpaRepository<LabResult, Long> {
	List<LabResult> findByPatientIdOrderByResultDateDesc(Long patientId);

	boolean existsByPatientId(Long patientId);
}

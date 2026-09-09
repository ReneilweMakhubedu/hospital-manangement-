package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.PatientFeedback;

public interface PatientFeedbackRepository extends JpaRepository<PatientFeedback, Long> {
	List<PatientFeedback> findByPatientIdOrderByCreatedAtDesc(Long patientId);

	long countByPatientIdAndStatus(Long patientId, String status);

	long countByReferenceNumberStartingWith(String prefix);
}

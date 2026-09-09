package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.PatientMedication;

public interface PatientMedicationRepository extends JpaRepository<PatientMedication, Long> {
	List<PatientMedication> findByPatientIdOrderByCreatedAtDesc(Long patientId);

	List<PatientMedication> findByPatientIdAndStatus(Long patientId, String status);

	long countByPatientIdAndStatus(Long patientId, String status);

	boolean existsByPatientId(Long patientId);
}

package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.PatientNotification;

public interface PatientNotificationRepository extends JpaRepository<PatientNotification, Long> {
	List<PatientNotification> findByPatientIdOrderByCreatedAtDesc(Long patientId);

	long countByPatientIdAndReadFlagFalse(Long patientId);

	Optional<PatientNotification> findByIdAndPatientId(Long id, Long patientId);

	List<PatientNotification> findByPatientIdAndReadFlagFalse(Long patientId);

	boolean existsByPatientId(Long patientId);
}

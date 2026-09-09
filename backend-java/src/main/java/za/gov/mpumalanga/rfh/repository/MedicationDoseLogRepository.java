package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.MedicationDoseLog;

public interface MedicationDoseLogRepository extends JpaRepository<MedicationDoseLog, Long> {
	List<MedicationDoseLog> findByPatientIdAndScheduledTimeStartingWithOrderByScheduledTimeAsc(
			Long patientId, String datePrefix);

	Optional<MedicationDoseLog> findByMedicationIdAndPatientIdAndScheduledTime(
			Long medicationId, Long patientId, String scheduledTime);
}

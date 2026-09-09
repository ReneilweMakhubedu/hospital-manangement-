package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.ClinicalNote;

public interface ClinicalNoteRepository extends JpaRepository<ClinicalNote, Long> {
	List<ClinicalNote> findAllByOrderByVisitDateDescCreatedAtDesc();

	List<ClinicalNote> findByPatientIdOrderByVisitDateDescCreatedAtDesc(Long patientId);

	long countByPatientId(Long patientId);
}

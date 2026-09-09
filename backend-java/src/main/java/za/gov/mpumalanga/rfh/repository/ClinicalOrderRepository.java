package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.ClinicalOrder;

public interface ClinicalOrderRepository extends JpaRepository<ClinicalOrder, Long> {
	List<ClinicalOrder> findByDoctorIdOrderByOrderedAtDesc(Long doctorId);

	List<ClinicalOrder> findByDoctorIdAndPatientIdOrderByOrderedAtDesc(Long doctorId, Long patientId);

	Optional<ClinicalOrder> findByIdAndDoctorId(Long id, Long doctorId);

	long countByDoctorIdAndStatusIn(Long doctorId, List<String> statuses);
}

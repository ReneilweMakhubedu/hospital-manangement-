package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.Prescription;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
	List<Prescription> findByPatientId(Long patientId);

	List<Prescription> findByDoctorId(Long doctorId);

	List<Prescription> findByDoctorIdAndPatientId(Long doctorId, Long patientId);

	Optional<Prescription> findByIdAndDoctorId(Long id, Long doctorId);

	List<Prescription> findAllByOrderByCreatedAtDesc();

	long countByPatientId(Long patientId);
}

package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.gov.mpumalanga.rfh.entity.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
	List<Appointment> findByDoctorIdAndDate(Long doctorId, String date);

	Optional<Appointment> findByIdAndPatientId(Long id, Long patientId);

	boolean existsByDoctorIdAndDateAndTime(Long doctorId, String date, String time);

	boolean existsByDoctorIdAndDateAndTimeAndIdNot(Long doctorId, String date, String time, Long id);

	List<Appointment> findByPatientIdOrderByDateDescTimeDesc(Long patientId);

	@Query("SELECT DISTINCT a.doctorId FROM Appointment a WHERE a.patientId = :patientId")
	List<Long> findDistinctDoctorIdsByPatientId(@Param("patientId") Long patientId);

	List<Appointment> findByPatientIdAndDateOrderByTimeAsc(Long patientId, String date);

	List<Appointment> findByDoctorIdAndDateOrderByTimeAsc(Long doctorId, String date);

	List<Appointment> findAllByOrderByDateAscTimeAsc();

	List<Appointment> findByDoctorId(Long doctorId);

	List<Appointment> findByDate(String date);

	long countByReferenceNumberStartingWith(String prefix);

	List<Appointment> findByPatientIdAndDateGreaterThanEqualOrderByDateAscTimeAsc(Long patientId, String date);

	long countByPatientId(Long patientId);
}

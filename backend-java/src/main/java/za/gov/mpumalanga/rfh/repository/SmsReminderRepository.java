package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.SmsReminder;

public interface SmsReminderRepository extends JpaRepository<SmsReminder, Long> {
	List<SmsReminder> findTop100ByOrderByCreatedAtDesc();

	boolean existsByAppointmentIdAndStatusNot(Long appointmentId, String status);
}

package za.gov.mpumalanga.rfh.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.gov.mpumalanga.rfh.entity.QueueEntry;

public interface QueueRepository extends JpaRepository<QueueEntry, Long> {
	List<QueueEntry> findByQueueDateOrderByQueueNumberAsc(LocalDate queueDate);

	Optional<QueueEntry> findFirstByQueueDateAndStatusOrderByQueueNumberAsc(LocalDate queueDate, String status);

	Optional<QueueEntry> findByPatientIdAndQueueDateAndStatusIn(Long patientId, LocalDate queueDate, List<String> statuses);

	@Query("SELECT COALESCE(MAX(q.queueNumber), 0) FROM QueueEntry q WHERE q.queueDate = :queueDate")
	Integer findMaxQueueNumberByDate(@Param("queueDate") LocalDate queueDate);

	@Query("SELECT COUNT(q) FROM QueueEntry q WHERE q.queueDate = :queueDate AND q.status = 'waiting' AND q.queueNumber < :queueNumber")
	long countWaitingBefore(@Param("queueDate") LocalDate queueDate, @Param("queueNumber") Integer queueNumber);
}

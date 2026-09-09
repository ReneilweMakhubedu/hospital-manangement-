package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.ProcSpendRecord;

public interface ProcSpendRecordRepository extends JpaRepository<ProcSpendRecord, Long> {
	List<ProcSpendRecord> findAllByOrderByRecordedAtDesc();
}

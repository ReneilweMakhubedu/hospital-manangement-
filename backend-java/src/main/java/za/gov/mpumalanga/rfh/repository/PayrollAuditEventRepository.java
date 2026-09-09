package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.PayrollAuditEvent;

public interface PayrollAuditEventRepository extends JpaRepository<PayrollAuditEvent, Long> {
	List<PayrollAuditEvent> findTop50ByOrderByCreatedAtDesc();
}

package za.gov.mpumalanga.rfh.repository;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.AuditEvent;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {
	List<AuditEvent> findTop50ByOrderByCreatedAtDesc();

	List<AuditEvent> findByResourceTypeIgnoreCaseOrderByCreatedAtDesc(String resourceType);

	List<AuditEvent> findByCreatedAtBetweenOrderByCreatedAtDesc(Instant from, Instant to);

	List<AuditEvent> findByResourceTypeIgnoreCaseAndCreatedAtBetweenOrderByCreatedAtDesc(
			String resourceType, Instant from, Instant to);

	List<AuditEvent> findAllByOrderByCreatedAtDesc();
}

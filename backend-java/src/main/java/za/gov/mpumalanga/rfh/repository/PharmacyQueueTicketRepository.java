package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.PharmacyQueueTicket;

public interface PharmacyQueueTicketRepository extends JpaRepository<PharmacyQueueTicket, Long> {
	List<PharmacyQueueTicket> findAllByOrderByArrivedAtDesc();
}

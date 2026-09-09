package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.ProcBid;

public interface ProcBidRepository extends JpaRepository<ProcBid, Long> {
	List<ProcBid> findAllByOrderBySubmittedAtDesc();

	List<ProcBid> findByTenderIdOrderBySubmittedAtDesc(Long tenderId);
}

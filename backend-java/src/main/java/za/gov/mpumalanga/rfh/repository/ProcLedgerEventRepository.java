package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.ProcLedgerEvent;

public interface ProcLedgerEventRepository extends JpaRepository<ProcLedgerEvent, Long> {
	List<ProcLedgerEvent> findTop50ByOrderByCreatedAtDesc();

	List<ProcLedgerEvent> findAllByOrderByIdAsc();

	Optional<ProcLedgerEvent> findTopByOrderByIdDesc();
}

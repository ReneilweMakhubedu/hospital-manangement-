package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.FinanceTransaction;

public interface FinanceTransactionRepository extends JpaRepository<FinanceTransaction, Long> {
	List<FinanceTransaction> findAllByOrderByTxnDateDescCreatedAtDesc();

	List<FinanceTransaction> findByCostCentreIdOrderByTxnDateDescCreatedAtDesc(Long costCentreId);
}

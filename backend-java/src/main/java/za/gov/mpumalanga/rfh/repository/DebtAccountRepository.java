package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.DebtAccount;

public interface DebtAccountRepository extends JpaRepository<DebtAccount, Long> {
	List<DebtAccount> findAllByOrderByUpdatedAtDesc();
}

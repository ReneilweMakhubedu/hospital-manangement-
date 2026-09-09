package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.BudgetForecast;

public interface BudgetForecastRepository extends JpaRepository<BudgetForecast, Long> {
	List<BudgetForecast> findAllByOrderByUpdatedAtDesc();
}

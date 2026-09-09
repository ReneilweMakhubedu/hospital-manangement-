package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.PharmacyFinancePeriod;

public interface PharmacyFinancePeriodRepository extends JpaRepository<PharmacyFinancePeriod, Long> {
	List<PharmacyFinancePeriod> findAllByOrderByPeriodLabelDesc();

	Optional<PharmacyFinancePeriod> findByPeriodLabelIgnoreCase(String periodLabel);
}

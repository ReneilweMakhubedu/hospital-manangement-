package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.CostCentre;

public interface CostCentreRepository extends JpaRepository<CostCentre, Long> {
	List<CostCentre> findAllByOrderByCodeAsc();

	Optional<CostCentre> findByCodeIgnoreCase(String code);
}

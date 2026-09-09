package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.PharmacyClinicalIntervention;

public interface PharmacyClinicalInterventionRepository extends JpaRepository<PharmacyClinicalIntervention, Long> {
	List<PharmacyClinicalIntervention> findAllByOrderByCreatedAtDesc();
}

package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.PharmacySupplierScore;

public interface PharmacySupplierScoreRepository extends JpaRepository<PharmacySupplierScore, Long> {
	List<PharmacySupplierScore> findAllByOrderBySupplierNameAsc();
}

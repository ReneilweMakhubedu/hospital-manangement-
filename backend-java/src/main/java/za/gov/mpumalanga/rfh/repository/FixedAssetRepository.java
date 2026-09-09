package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.FixedAsset;

public interface FixedAssetRepository extends JpaRepository<FixedAsset, Long> {
	List<FixedAsset> findAllByOrderByCreatedAtDesc();
}

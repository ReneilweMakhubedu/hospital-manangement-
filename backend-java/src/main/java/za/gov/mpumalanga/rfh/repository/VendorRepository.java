package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.Vendor;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
	List<Vendor> findAllByOrderByCreatedAtDesc();
}

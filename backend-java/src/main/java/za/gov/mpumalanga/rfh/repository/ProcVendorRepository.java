package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.ProcVendor;

public interface ProcVendorRepository extends JpaRepository<ProcVendor, Long> {
	List<ProcVendor> findAllByOrderByCreatedAtDesc();
}

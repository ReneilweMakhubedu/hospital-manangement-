package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.Medicine;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {
	List<Medicine> findAllByOrderByNameAsc();

	boolean existsByNameIgnoreCase(String name);
}

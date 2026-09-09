package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.IrregularExpenditure;

public interface IrregularExpenditureRepository extends JpaRepository<IrregularExpenditure, Long> {
	List<IrregularExpenditure> findAllByOrderByCreatedAtDesc();
}

package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.Theatre;

public interface TheatreRepository extends JpaRepository<Theatre, Long> {
	List<Theatre> findAllByOrderByNameAsc();
}

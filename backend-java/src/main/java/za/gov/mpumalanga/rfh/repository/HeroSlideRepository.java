package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.HeroSlide;

public interface HeroSlideRepository extends JpaRepository<HeroSlide, Long> {
	List<HeroSlide> findByActiveTrueOrderBySortOrderAscIdAsc();

	List<HeroSlide> findAllByOrderBySortOrderAscIdAsc();
}

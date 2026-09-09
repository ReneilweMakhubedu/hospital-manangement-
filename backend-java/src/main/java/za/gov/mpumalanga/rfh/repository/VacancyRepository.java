package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.Vacancy;

public interface VacancyRepository extends JpaRepository<Vacancy, Long> {
	List<Vacancy> findAllByOrderByCriticalDescTitleAsc();
}

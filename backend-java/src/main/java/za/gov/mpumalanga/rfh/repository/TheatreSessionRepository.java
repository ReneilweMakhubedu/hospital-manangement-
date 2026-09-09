package za.gov.mpumalanga.rfh.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.TheatreSession;

public interface TheatreSessionRepository extends JpaRepository<TheatreSession, Long> {
	List<TheatreSession> findBySessionDateBetweenOrderBySessionDateAscStartTimeAsc(LocalDate from, LocalDate to);

	List<TheatreSession> findBySessionDate(LocalDate sessionDate);
}

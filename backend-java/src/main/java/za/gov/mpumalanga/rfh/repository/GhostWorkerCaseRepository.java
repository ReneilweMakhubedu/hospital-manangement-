package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.GhostWorkerCase;

public interface GhostWorkerCaseRepository extends JpaRepository<GhostWorkerCase, Long> {
	List<GhostWorkerCase> findAllByOrderByFlaggedAtDesc();
}

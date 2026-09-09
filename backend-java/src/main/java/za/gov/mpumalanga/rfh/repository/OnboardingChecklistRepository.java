package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.OnboardingChecklist;

public interface OnboardingChecklistRepository extends JpaRepository<OnboardingChecklist, Long> {
	List<OnboardingChecklist> findAllByOrderByStartedAtDesc();
}

package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.ReferralLetter;

public interface ReferralLetterRepository extends JpaRepository<ReferralLetter, Long> {
	List<ReferralLetter> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);

	Optional<ReferralLetter> findByIdAndDoctorId(Long id, Long doctorId);

	long countByDoctorIdAndStatusIn(Long doctorId, List<String> statuses);
}

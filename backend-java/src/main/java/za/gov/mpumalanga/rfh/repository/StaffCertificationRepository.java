package za.gov.mpumalanga.rfh.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.StaffCertification;

public interface StaffCertificationRepository extends JpaRepository<StaffCertification, Long> {
	List<StaffCertification> findAllByOrderByExpiryDateAsc();

	List<StaffCertification> findByExpiryDateLessThanEqualOrderByExpiryDateAsc(LocalDate date);
}

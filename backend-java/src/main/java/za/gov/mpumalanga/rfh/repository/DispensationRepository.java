package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.gov.mpumalanga.rfh.entity.Dispensation;

public interface DispensationRepository extends JpaRepository<Dispensation, Long> {
	@Query("SELECT COALESCE(SUM(d.quantity), 0) FROM Dispensation d WHERE d.prescriptionId = :prescriptionId")
	Long sumQuantityByPrescriptionId(@Param("prescriptionId") Long prescriptionId);

	List<Dispensation> findTop20ByOrderByDispensedAtDesc();
}

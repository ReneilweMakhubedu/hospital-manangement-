package za.gov.mpumalanga.rfh.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import za.gov.mpumalanga.rfh.entity.PatientInvoice;

public interface PatientInvoiceRepository extends JpaRepository<PatientInvoice, Long> {
	List<PatientInvoice> findAllByOrderByCreatedAtDesc();

	Optional<PatientInvoice> findByReferenceNumberIgnoreCase(String referenceNumber);
}

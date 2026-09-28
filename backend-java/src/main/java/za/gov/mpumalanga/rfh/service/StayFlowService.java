package za.gov.mpumalanga.rfh.service;

import java.time.Instant;
import org.springframework.stereotype.Service;
import za.gov.mpumalanga.rfh.entity.OpsItem;
import za.gov.mpumalanga.rfh.entity.WardBed;
import za.gov.mpumalanga.rfh.repository.SupportStore;

@Service
public class StayFlowService {
	private final SupportStore store;

	public StayFlowService(SupportStore store) {
		this.store = store;
	}

	/** Discharge leaves the bed for housekeeping instead of jumping straight to available. */
	public void prepare(WardBed bed, String previousStatus, String previousPatient) {
		boolean wasOccupied = "OCCUPIED".equalsIgnoreCase(previousStatus) && previousPatient != null && !previousPatient.isBlank();
		boolean nowOccupied = "OCCUPIED".equalsIgnoreCase(bed.status);
		if (wasOccupied && !nowOccupied && !"BLOCKED".equalsIgnoreCase(bed.status)) {
			bed.status = "CLEANING";
		}
	}

	public String afterSave(WardBed bed, String previousStatus, String previousPatient, String actorEmail) {
		StringBuilder note = new StringBuilder();
		boolean wasOccupied = "OCCUPIED".equalsIgnoreCase(previousStatus) && hasText(previousPatient);
		boolean nowOccupied = "OCCUPIED".equalsIgnoreCase(bed.status) && hasText(bed.patientName);
		boolean samePatient = wasOccupied && nowOccupied && previousPatient.trim().equalsIgnoreCase(bed.patientName.trim());
		if (wasOccupied && !samePatient) {
			openRecords(previousPatient, place(bed), actorEmail);
			if ("CLEANING".equalsIgnoreCase(bed.status)) {
				openHousekeeping(place(bed), actorEmail);
				note.append(previousPatient).append(" discharged. Bed is in cleaning and the chart is with medical records. ");
			} else {
				note.append(previousPatient).append(" left this bed. Medical records have a filing task. ");
			}
		}
		if (nowOccupied && !samePatient) {
			admitReception(bed.patientName);
			openPorter(bed, actorEmail);
			note.append(bed.patientName).append(" is admitted to ").append(place(bed)).append(". A porter job is open.");
		}
		return note.toString().trim();
	}

	public void onReady(WardBed bed) {
		String location = place(bed);
		for (OpsItem item : store.all(OpsItem.class)) {
			if (!"housekeeping".equalsIgnoreCase(item.desk)) continue;
			if (!location.equalsIgnoreCase(item.location)) continue;
			if ("DONE".equalsIgnoreCase(item.status)) continue;
			item.status = "DONE";
			store.save(item);
		}
	}

	private void admitReception(String patientName) {
		for (OpsItem item : store.all(OpsItem.class)) {
			if (!"reception".equalsIgnoreCase(item.desk)) continue;
			if (!patientName.trim().equalsIgnoreCase(item.patientName == null ? "" : item.patientName.trim())) continue;
			if (!"WAITING".equalsIgnoreCase(item.status) && !"BED_REQUESTED".equalsIgnoreCase(item.status)) continue;
			item.status = "ADMITTED";
			store.save(item);
		}
	}

	private void openPorter(WardBed bed, String actorEmail) {
		String destination = "To: " + place(bed);
		for (OpsItem item : store.all(OpsItem.class)) {
			if (!"porter".equalsIgnoreCase(item.desk)) continue;
			if (!bed.patientName.trim().equalsIgnoreCase(item.patientName == null ? "" : item.patientName.trim())) continue;
			if ("DONE".equalsIgnoreCase(item.status)) continue;
			if (destination.equalsIgnoreCase(item.detail)) return;
		}
		OpsItem job = new OpsItem();
		job.desk = "porter";
		job.patientName = bed.patientName.trim();
		job.location = "Admissions";
		job.detail = destination;
		job.status = "REQUESTED";
		job.createdAt = Instant.now();
		job.ownerEmail = actorEmail;
		store.save(job);
	}

	private void openRecords(String patientName, String location, String actorEmail) {
		for (OpsItem item : store.all(OpsItem.class)) {
			if (!"records".equalsIgnoreCase(item.desk)) continue;
			if (!patientName.trim().equalsIgnoreCase(item.patientName == null ? "" : item.patientName.trim())) continue;
			if (!location.equalsIgnoreCase(item.location)) continue;
			if ("REQUESTED".equalsIgnoreCase(item.status) || "PULLED".equalsIgnoreCase(item.status)) return;
		}
		OpsItem chart = new OpsItem();
		chart.desk = "records";
		chart.patientName = patientName.trim();
		chart.location = location;
		chart.detail = "File the inpatient chart after discharge";
		chart.status = "REQUESTED";
		chart.createdAt = Instant.now();
		chart.ownerEmail = actorEmail;
		store.save(chart);
	}

	private void openHousekeeping(String location, String actorEmail) {
		for (OpsItem item : store.all(OpsItem.class)) {
			if (!"housekeeping".equalsIgnoreCase(item.desk)) continue;
			if (!location.equalsIgnoreCase(item.location)) continue;
			if ("OPEN".equalsIgnoreCase(item.status) || "IN_PROGRESS".equalsIgnoreCase(item.status)) return;
		}
		OpsItem task = new OpsItem();
		task.desk = "housekeeping";
		task.location = location;
		task.detail = "Terminal clean after discharge";
		task.status = "OPEN";
		task.createdAt = Instant.now();
		task.ownerEmail = actorEmail;
		store.save(task);
	}

	private static String place(WardBed bed) {
		String floor = bed.floor == null || bed.floor.isBlank() ? "1" : bed.floor;
		return "Floor " + floor + " · " + bed.wardName + " · Bed " + bed.bedNumber;
	}

	private static boolean hasText(String value) {
		return value != null && !value.isBlank();
	}
}

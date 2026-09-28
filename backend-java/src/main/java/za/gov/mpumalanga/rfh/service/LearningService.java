package za.gov.mpumalanga.rfh.service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.gov.mpumalanga.rfh.entity.LabOrder;
import za.gov.mpumalanga.rfh.entity.LearningExample;
import za.gov.mpumalanga.rfh.entity.OpsItem;
import za.gov.mpumalanga.rfh.entity.WardBed;
import za.gov.mpumalanga.rfh.repository.SupportStore;

@Service
public class LearningService {
	static final String LAB_BREACH = "LAB_BREACH";
	static final String BED_DEMAND = "BED_DEMAND";
	private static final String[] LAB_FEATURES = { "STAT order", "Afternoon order", "Complex test" };
	private static final String[] BED_FEATURES = { "Occupied beds", "Pending admissions", "Beds in cleaning", "High-acuity patients" };

	private final SupportStore store;

	public LearningService(SupportStore store) {
		this.store = store;
	}

	@Transactional
	public Map<String, Object> insights() {
		ensureCorpus();
		recordLiveOutcomes();
		Map<String, Object> lab = labModel();
		Map<String, Object> beds = bedModel();
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("engine", "rfh-gd-v1");
		result.put("disclaimer", "Operational forecast only. Not a diagnosis, prescription, or instruction to move a patient. Staff confirm every action.");
		result.put("labTurnaround", lab);
		result.put("bedDemand", beds);
		return result;
	}

	public List<Map<String, Object>> automationSignals() {
		Map<String, Object> insights = insights();
		List<Map<String, Object>> signals = new ArrayList<>();
		@SuppressWarnings("unchecked")
		Map<String, Object> beds = (Map<String, Object>) insights.get("bedDemand");
		double predicted = number(beds.get("predictedOccupied"));
		double available = number(beds.get("availableNow"));
		double occupied = number(beds.get("occupiedNow"));
		if (predicted > occupied && available < (predicted - occupied)) {
			signals.add(signal("nurse", "HIGH", "Machine learning: bed pressure",
					"Forecast occupied beds " + round1(predicted) + " with only " + (int) available + " available.",
					"ml-beds"));
			signals.add(signal("reception", "HIGH", "Machine learning: admissions pressure",
					"Bed forecast is above free beds. Keep new requests visible for nursing.",
					"ml-beds-reception"));
		}
		@SuppressWarnings("unchecked")
		Map<String, Object> lab = (Map<String, Object>) insights.get("labTurnaround");
		Object predictions = lab.get("predictions");
		if (predictions instanceof List<?> rows) {
			for (Object row : rows) {
				if (!(row instanceof Map<?, ?> map)) continue;
				double probability = number(map.get("breachProbability"));
				if (probability < 0.65) continue;
				signals.add(signal("lab", "HIGH", "Machine learning: lab delay risk",
						map.get("patientName") + " · " + map.get("testName") + " · " + Math.round(probability * 100) + "% breach risk.",
						"ml-lab-" + map.get("id")));
			}
		}
		return signals;
	}

	private Map<String, Object> signal(String audience, String severity, String title, String detail, String fingerprint) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("audience", audience);
		map.put("severity", severity);
		map.put("title", title);
		map.put("detail", detail);
		map.put("fingerprint", fingerprint);
		return map;
	}

	private void ensureCorpus() {
		if (store.all(LearningExample.class).stream().anyMatch(row -> LAB_BREACH.equals(row.model))) return;
		double[][] lab = {
				{ 1, 1, 1, 1 }, { 1, 0, 1, 1 }, { 1, 1, 0, 1 }, { 1, 0, 0, 0 },
				{ 0, 1, 1, 1 }, { 0, 0, 1, 1 }, { 0, 1, 0, 0 }, { 0, 0, 0, 0 },
				{ 1, 1, 1, 1 }, { 0, 0, 0, 0 }, { 0, 1, 0, 0 }, { 1, 0, 1, 1 },
				{ 0, 0, 1, 0 }, { 1, 1, 0, 1 }, { 0, 0, 0, 0 }, { 1, 0, 0, 1 }
		};
		for (double[] row : lab) save(LAB_BREACH, row[0], row[1], row[2], 0, row[3], "Historical lab turnaround");
		double[][] beds = {
				{ 8, 2, 1, 2, 9 }, { 10, 1, 2, 1, 10 }, { 6, 0, 1, 0, 6 }, { 12, 3, 1, 4, 14 },
				{ 9, 1, 3, 2, 8 }, { 7, 2, 0, 1, 8 }, { 11, 0, 2, 3, 11 }, { 5, 1, 1, 0, 5 },
				{ 13, 2, 2, 5, 14 }, { 4, 0, 0, 0, 4 }
		};
		for (double[] row : beds) save(BED_DEMAND, row[0], row[1], row[2], row[3], row[4], "Historical bed demand");
	}

	private void save(String model, double f0, double f1, double f2, double f3, Double label, String note, String refKey) {
		LearningExample example = new LearningExample();
		example.model = model;
		example.f0 = f0;
		example.f1 = f1;
		example.f2 = f2;
		example.f3 = f3;
		example.label = label;
		example.note = note;
		example.refKey = refKey;
		example.createdAt = Instant.now();
		store.save(example);
	}

	private void save(String model, double f0, double f1, double f2, double f3, double label, String note) {
		save(model, f0, f1, f2, f3, label, note, null);
	}

	private Split split(String model, int width) {
		List<LearningExample> labeled = store.all(LearningExample.class).stream()
				.filter(example -> model.equals(example.model) && example.label != null)
				.sorted(java.util.Comparator.comparing(example -> example.id == null ? 0L : example.id))
				.toList();
		int hold = labeled.size() >= 5 ? Math.max(1, labeled.size() / 5) : 0;
		int cut = labeled.size() - hold;
		Split split = new Split();
		for (int i = 0; i < labeled.size(); i++) {
			LearningExample example = labeled.get(i);
			double[] row = width == 3
					? new double[] { example.f0, example.f1, example.f2 }
					: new double[] { example.f0, example.f1, example.f2, example.f3 };
			if (i < cut) {
				split.trainRows.add(row);
				split.trainLabels.add(example.label);
			} else {
				split.testRows.add(row);
				split.testLabels.add(example.label);
			}
		}
		return split;
	}

	private static final class Split {
		private final List<double[]> trainRows = new ArrayList<>();
		private final List<Double> trainLabels = new ArrayList<>();
		private final List<double[]> testRows = new ArrayList<>();
		private final List<Double> testLabels = new ArrayList<>();
	}

	private void recordLiveOutcomes() {
		for (LabOrder order : store.all(LabOrder.class)) {
			Double label = labLabel(order);
			if (label == null || order.id == null) continue;
			String key = "lab-" + order.id;
			if (hasRef(key)) continue;
			double[] features = labFeatures(order);
			save(LAB_BREACH, features[0], features[1], features[2], 0, label, "Live lab result", key);
		}
		long occupied = store.all(WardBed.class).stream().filter(bed -> "OCCUPIED".equalsIgnoreCase(bed.status)).count();
		long cleaning = store.all(WardBed.class).stream().filter(bed -> "CLEANING".equalsIgnoreCase(bed.status)).count();
		long high = store.all(WardBed.class).stream().filter(bed -> "OCCUPIED".equalsIgnoreCase(bed.status) && "HIGH".equalsIgnoreCase(bed.acuity)).count();
		long pending = store.all(OpsItem.class).stream()
				.filter(item -> "reception".equalsIgnoreCase(item.desk))
				.filter(item -> "WAITING".equalsIgnoreCase(item.status) || "BED_REQUESTED".equalsIgnoreCase(item.status))
				.count();
		java.time.LocalDate today = java.time.LocalDate.now();
		String yesterdayKey = "bed-" + today.minusDays(1);
		for (LearningExample example : store.all(LearningExample.class)) {
			if (yesterdayKey.equals(example.refKey) && example.label == null) {
				example.label = (double) occupied;
				example.note = "Occupied beds the following day";
				store.save(example);
			}
		}
		String todayKey = "bed-" + today;
		if (!hasRef(todayKey)) {
			save(BED_DEMAND, occupied, pending, cleaning, high, null, "Today's bed snapshot", todayKey);
		}
	}

	private boolean hasRef(String key) {
		return store.all(LearningExample.class).stream().anyMatch(example -> key.equals(example.refKey));
	}

	private Map<String, Object> labModel() {
		Split split = split(LAB_BREACH, 3);
		double[] weights = fitLogistic(split.trainRows, split.trainLabels);
		List<Map<String, Object>> predictions = new ArrayList<>();
		for (LabOrder order : store.all(LabOrder.class)) {
			if (order.resultedAt != null || "CANCELLED".equalsIgnoreCase(order.status) || "RESULTED".equalsIgnoreCase(order.status)) {
				continue;
			}
			double[] features = labFeatures(order);
			double probability = sigmoid(score(weights, features));
			Map<String, Object> row = new LinkedHashMap<>();
			row.put("id", order.id);
			row.put("patientName", order.patientName);
			row.put("testName", order.testName);
			row.put("priority", order.priority);
			row.put("breachProbability", round1(probability));
			row.put("mainFactor", mainFactor(weights, features, LAB_FEATURES));
			predictions.add(row);
		}
		Map<String, Object> model = new LinkedHashMap<>();
		model.put("name", "Lab turnaround breach");
		model.put("algorithm", "Logistic regression, gradient descent");
		model.put("trainedExamples", split.trainRows.size());
		model.put("heldOutExamples", split.testRows.size());
		model.put("heldOutAccuracy", split.testRows.isEmpty() ? null : round1(accuracy(weights, split.testRows, split.testLabels)));
		model.put("weights", namedWeights(weights, LAB_FEATURES));
		model.put("predictions", predictions);
		return model;
	}

	private Map<String, Object> bedModel() {
		Split split = split(BED_DEMAND, 4);
		double[] weights = fitLinear(split.trainRows, split.trainLabels);
		List<WardBed> beds = store.all(WardBed.class);
		long occupied = beds.stream().filter(bed -> "OCCUPIED".equalsIgnoreCase(bed.status)).count();
		long available = beds.stream().filter(bed -> "AVAILABLE".equalsIgnoreCase(bed.status)).count();
		long cleaning = beds.stream().filter(bed -> "CLEANING".equalsIgnoreCase(bed.status)).count();
		long high = beds.stream().filter(bed -> "OCCUPIED".equalsIgnoreCase(bed.status) && "HIGH".equalsIgnoreCase(bed.acuity)).count();
		long pending = store.all(OpsItem.class).stream()
				.filter(item -> "reception".equalsIgnoreCase(item.desk))
				.filter(item -> "WAITING".equalsIgnoreCase(item.status) || "BED_REQUESTED".equalsIgnoreCase(item.status))
				.count();
		double[] features = { occupied, pending, cleaning, high };
		double predicted = Math.max(0, score(weights, features));
		Map<String, Object> model = new LinkedHashMap<>();
		model.put("name", "Next bed demand");
		model.put("algorithm", "Linear regression, gradient descent");
		model.put("trainedExamples", split.trainRows.size());
		model.put("heldOutExamples", split.testRows.size());
		model.put("heldOutMae", split.testRows.isEmpty() ? null : round1(mae(weights, split.testRows, split.testLabels)));
		model.put("meanAbsoluteError", split.testRows.isEmpty() ? null : round1(mae(weights, split.testRows, split.testLabels)));
		model.put("weights", namedWeights(weights, BED_FEATURES));
		model.put("occupiedNow", occupied);
		model.put("availableNow", available);
		model.put("cleaningNow", cleaning);
		model.put("pendingAdmissions", pending);
		model.put("predictedOccupied", round1(predicted));
		model.put("mainFactor", mainFactor(weights, features, BED_FEATURES));
		return model;
	}

	private static Double labLabel(LabOrder order) {
		if (order.orderedAt == null || "CANCELLED".equalsIgnoreCase(order.status)) return null;
		if (order.resultedAt != null) {
			long hours = ChronoUnit.HOURS.between(order.orderedAt, order.resultedAt);
			return hours > 6 ? 1.0 : 0.0;
		}
		if (order.orderedAt.isBefore(Instant.now().minus(6, ChronoUnit.HOURS))) return 1.0;
		return null;
	}

	private static double[] labFeatures(LabOrder order) {
		int hour = order.orderedAt == null ? 9 : order.orderedAt.atZone(ZoneId.systemDefault()).getHour();
		String test = order.testName == null ? "" : order.testName.toLowerCase(Locale.ROOT);
		boolean complex = test.contains("culture") || test.contains("histolog") || test.contains("csf") || test.contains("biopsy");
		return new double[] { "STAT".equalsIgnoreCase(order.priority) ? 1 : 0, hour >= 12 ? 1 : 0, complex ? 1 : 0 };
	}

	private static double[] fitLogistic(List<double[]> rows, List<Double> labels) {
		if (rows.isEmpty()) return new double[] { 0, 0, 0, 0 };
		int d = rows.get(0).length;
		double[] w = new double[d + 1];
		for (int epoch = 0; epoch < 400; epoch++) {
			double[] grad = new double[d + 1];
			for (int i = 0; i < rows.size(); i++) {
				double p = sigmoid(score(w, rows.get(i)));
				double err = p - labels.get(i);
				for (int j = 0; j < d; j++) grad[j] += err * rows.get(i)[j];
				grad[d] += err;
			}
			for (int j = 0; j < d; j++) w[j] -= 0.35 * (grad[j] / rows.size() + 0.01 * w[j]);
			w[d] -= 0.35 * (grad[d] / rows.size());
		}
		return w;
	}

	private static double[] fitLinear(List<double[]> rows, List<Double> labels) {
		if (rows.isEmpty()) return new double[] { 0, 0, 0, 0, 0 };
		int d = rows.get(0).length;
		double[] w = new double[d + 1];
		for (int epoch = 0; epoch < 800; epoch++) {
			double[] grad = new double[d + 1];
			for (int i = 0; i < rows.size(); i++) {
				double err = score(w, rows.get(i)) - labels.get(i);
				for (int j = 0; j < d; j++) grad[j] += err * rows.get(i)[j];
				grad[d] += err;
			}
			for (int j = 0; j < d; j++) w[j] -= 0.01 * (grad[j] / rows.size());
			w[d] -= 0.01 * (grad[d] / rows.size());
		}
		return w;
	}

	private static double accuracy(double[] weights, List<double[]> rows, List<Double> labels) {
		if (rows.isEmpty()) return 0;
		int correct = 0;
		for (int i = 0; i < rows.size(); i++) {
			double predicted = sigmoid(score(weights, rows.get(i))) >= 0.5 ? 1 : 0;
			if (predicted == labels.get(i)) correct++;
		}
		return correct * 100.0 / rows.size();
	}

	private static double mae(double[] weights, List<double[]> rows, List<Double> labels) {
		if (rows.isEmpty()) return 0;
		double total = 0;
		for (int i = 0; i < rows.size(); i++) total += Math.abs(score(weights, rows.get(i)) - labels.get(i));
		return total / rows.size();
	}

	private static Map<String, Object> namedWeights(double[] weights, String[] names) {
		Map<String, Object> map = new LinkedHashMap<>();
		for (int i = 0; i < names.length && i < weights.length; i++) map.put(names[i], round1(weights[i]));
		map.put("Bias", round1(weights[weights.length - 1]));
		return map;
	}

	private static String mainFactor(double[] weights, double[] features, String[] names) {
		int best = 0;
		double bestAbs = 0;
		for (int i = 0; i < features.length && i < names.length; i++) {
			double contribution = Math.abs(weights[i] * features[i]);
			if (contribution > bestAbs) {
				bestAbs = contribution;
				best = i;
			}
		}
		return names[best];
	}

	private static double score(double[] weights, double[] features) {
		double total = weights[weights.length - 1];
		for (int i = 0; i < features.length; i++) total += weights[i] * features[i];
		return total;
	}

	private static double sigmoid(double value) {
		double clipped = Math.max(-20, Math.min(20, value));
		return 1.0 / (1.0 + Math.exp(-clipped));
	}

	private static double number(Object value) {
		return value instanceof Number number ? number.doubleValue() : 0;
	}

	private static double round1(double value) {
		return Math.round(value * 10.0) / 10.0;
	}
}

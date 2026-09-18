package za.gov.mpumalanga.rfh.service;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AutomationScheduler {

	private static final Logger log = LoggerFactory.getLogger(AutomationScheduler.class);

	private final AutomationService automationService;

	public AutomationScheduler(AutomationService automationService) {
		this.automationService = automationService;
	}

	/** Operational scan every 5 minutes. */
	@Scheduled(fixedDelayString = "${app.automation.fixed-delay-ms:300000}", initialDelay = 45000)
	public void scheduledRun() {
		try {
			Map<String, Object> result = automationService.runAll();
			log.info("Automation run complete: {}", result);
		} catch (Exception ex) {
			log.warn("Automation run failed: {}", ex.getMessage());
		}
	}
}

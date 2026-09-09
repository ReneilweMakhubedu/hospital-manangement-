package za.gov.mpumalanga.rfh.controller;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import za.gov.mpumalanga.rfh.entity.HeroSlide;
import za.gov.mpumalanga.rfh.exception.ApiException;
import za.gov.mpumalanga.rfh.repository.HeroSlideRepository;
import za.gov.mpumalanga.rfh.security.SecurityUtils;

@RestController
@RequestMapping("/api/cms/hero")
public class CmsHeroController {

	private final HeroSlideRepository heroSlideRepository;
	private final SecurityUtils securityUtils;
	private final Path uploadDirectory;

	public CmsHeroController(HeroSlideRepository heroSlideRepository, SecurityUtils securityUtils) throws IOException {
		this.heroSlideRepository = heroSlideRepository;
		this.securityUtils = securityUtils;
		this.uploadDirectory = Paths.get("uploads", "hero").toAbsolutePath().normalize();
		Files.createDirectories(this.uploadDirectory);
	}

	@GetMapping
	public List<Map<String, Object>> publicSlides() {
		return heroSlideRepository.findByActiveTrueOrderBySortOrderAscIdAsc().stream()
				.map(this::toMap)
				.toList();
	}

	@GetMapping("/all")
	public List<Map<String, Object>> allSlides() {
		securityUtils.requireSuperAdmin();
		return heroSlideRepository.findAllByOrderBySortOrderAscIdAsc().stream()
				.map(this::toMap)
				.toList();
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<Map<String, Object>> create(
			@RequestPart("title") String title,
			@RequestPart(value = "subtitle", required = false) String subtitle,
			@RequestPart(value = "ctaLabel", required = false) String ctaLabel,
			@RequestPart(value = "ctaLink", required = false) String ctaLink,
			@RequestPart(value = "sortOrder", required = false) String sortOrder,
			@RequestPart(value = "active", required = false) String active,
			@RequestPart(value = "image", required = false) MultipartFile image) {
		securityUtils.requireSuperAdmin();
		if (title == null || title.isBlank()) {
			throw new ApiException(400, "Title is required");
		}
		HeroSlide slide = new HeroSlide();
		applyFields(slide, title, subtitle, ctaLabel, ctaLink, sortOrder, active);
		if (image != null && !image.isEmpty()) {
			slide.setImageUrl(storeImage(image));
		}
		slide = heroSlideRepository.save(slide);
		return ResponseEntity.status(HttpStatus.CREATED).body(toMap(slide));
	}

	@PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public Map<String, Object> update(
			@PathVariable Long id,
			@RequestPart(value = "title", required = false) String title,
			@RequestPart(value = "subtitle", required = false) String subtitle,
			@RequestPart(value = "ctaLabel", required = false) String ctaLabel,
			@RequestPart(value = "ctaLink", required = false) String ctaLink,
			@RequestPart(value = "sortOrder", required = false) String sortOrder,
			@RequestPart(value = "active", required = false) String active,
			@RequestPart(value = "image", required = false) MultipartFile image) {
		securityUtils.requireSuperAdmin();
		HeroSlide slide = heroSlideRepository.findById(id)
				.orElseThrow(() -> new ApiException(404, "Slide not found"));
		if (title != null && !title.isBlank()) {
			slide.setTitle(title.trim());
		}
		if (subtitle != null) {
			slide.setSubtitle(subtitle.trim());
		}
		if (ctaLabel != null) {
			slide.setCtaLabel(ctaLabel.trim());
		}
		if (ctaLink != null) {
			slide.setCtaLink(ctaLink.trim());
		}
		if (sortOrder != null && !sortOrder.isBlank()) {
			slide.setSortOrder(parseInt(sortOrder, slide.getSortOrder()));
		}
		if (active != null && !active.isBlank()) {
			slide.setActive(Boolean.parseBoolean(active));
		}
		if (image != null && !image.isEmpty()) {
			slide.setImageUrl(storeImage(image));
		}
		return toMap(heroSlideRepository.save(slide));
	}

	@DeleteMapping("/{id}")
	public Map<String, Object> delete(@PathVariable Long id) {
		securityUtils.requireSuperAdmin();
		if (!heroSlideRepository.existsById(id)) {
			throw new ApiException(404, "Slide not found");
		}
		heroSlideRepository.deleteById(id);
		return Map.of("message", "Slide deleted");
	}

	private void applyFields(
			HeroSlide slide,
			String title,
			String subtitle,
			String ctaLabel,
			String ctaLink,
			String sortOrder,
			String active) {
		slide.setTitle(title.trim());
		slide.setSubtitle(subtitle == null ? "" : subtitle.trim());
		slide.setCtaLabel(ctaLabel == null ? "Access the system" : ctaLabel.trim());
		slide.setCtaLink(ctaLink == null ? "/login" : ctaLink.trim());
		slide.setSortOrder(parseInt(sortOrder, 0));
		slide.setActive(active == null || active.isBlank() || Boolean.parseBoolean(active));
	}

	private String storeImage(MultipartFile image) {
		String original = image.getOriginalFilename() == null ? "hero.jpg" : image.getOriginalFilename();
		String safe = original.replaceAll("[^a-zA-Z0-9._-]", "_");
		String lower = safe.toLowerCase(Locale.ROOT);
		if (!(lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")
				|| lower.endsWith(".webp") || lower.endsWith(".gif"))) {
			throw new ApiException(400, "Upload a JPG, PNG, WEBP, or GIF image");
		}
		try {
			byte[] bytes = image.getBytes();
			BufferedImage buffered = ImageIO.read(new ByteArrayInputStream(bytes));
			if (buffered == null) {
				throw new ApiException(400, "Could not read image file");
			}
			int width = buffered.getWidth();
			int height = buffered.getHeight();
			// Full-bleed hero needs high resolution; small uploads look blurry when stretched.
			if (width < 1600 || height < 900) {
				throw new ApiException(
						400,
						"Hero image is too small ("
								+ width
								+ "×"
								+ height
								+ "). Upload at least 1600×900 (1920×1080 recommended) so it stays sharp on large screens.");
			}
			String filename = UUID.randomUUID() + "-" + safe;
			Path target = uploadDirectory.resolve(filename);
			Files.write(target, bytes);
			return "/uploads/hero/" + filename;
		} catch (ApiException ex) {
			throw ex;
		} catch (IOException ex) {
			throw new ApiException(500, "Unable to store image");
		}
	}

	private Map<String, Object> toMap(HeroSlide slide) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("_id", slide.getId());
		map.put("title", slide.getTitle());
		map.put("subtitle", slide.getSubtitle());
		map.put("ctaLabel", slide.getCtaLabel());
		map.put("ctaLink", slide.getCtaLink());
		map.put("imageUrl", slide.getImageUrl());
		map.put("sortOrder", slide.getSortOrder());
		map.put("active", slide.getActive());
		map.put("createdAt", slide.getCreatedAt());
		map.put("updatedAt", slide.getUpdatedAt());
		return map;
	}

	private static int parseInt(String value, int fallback) {
		if (value == null || value.isBlank()) {
			return fallback;
		}
		try {
			return Integer.parseInt(value.trim());
		} catch (NumberFormatException ex) {
			return fallback;
		}
	}
}

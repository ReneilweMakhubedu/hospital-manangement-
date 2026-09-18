package za.gov.mpumalanga.rfh.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import za.gov.mpumalanga.rfh.entity.SupportEntity;

@Repository
public class SupportStore {
	@PersistenceContext
	private EntityManager entityManager;

	public <T extends SupportEntity> List<T> all(Class<T> type) {
		return entityManager.createQuery("select e from " + type.getSimpleName() + " e order by e.id desc", type)
				.getResultList();
	}

	public <T extends SupportEntity> Optional<T> find(Class<T> type, Long id) {
		return Optional.ofNullable(entityManager.find(type, id));
	}

	public <T extends SupportEntity> long count(Class<T> type) {
		return entityManager.createQuery("select count(e) from " + type.getSimpleName() + " e", Long.class)
				.getSingleResult();
	}

	@Transactional
	public <T extends SupportEntity> T save(T entity) {
		if (entity.id == null) {
			entityManager.persist(entity);
			return entity;
		}
		return entityManager.merge(entity);
	}
}

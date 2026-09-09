# Postgres / Neon ops (RFH HMS)

## Activate

```bash
# Option A — Spring profile
java -jar rfh-hms-0.0.1-SNAPSHOT.jar --spring.profiles.active=postgres

# Option B — env overrides (works with default or postgres profile)
set SPRING_DATASOURCE_URL=jdbc:postgresql://HOST/DB?sslmode=require
set SPRING_DATASOURCE_USERNAME=...
set SPRING_DATASOURCE_PASSWORD=...
set SPRING_DATASOURCE_DRIVER=org.postgresql.Driver
```

Convert Neon `postgresql://...` URLs to `jdbc:postgresql://...`.

## Schema

- Default `spring.jpa.hibernate.ddl-auto=update` (override with `SPRING_JPA_DDL_AUTO=validate` in production once stable).
- Flyway is **not** on the classpath. Optional later: add Flyway and scripts under `src/main/resources/db/migration`.

## Backup

- Prefer provider PITR / snapshots (Neon).
- Or: `pg_dump "$DATABASE_URL" -Fc -f rfh-hms-YYYYMMDD.dump`
- Restore: `pg_restore -d "$DATABASE_URL" --clean --if-exists rfh-hms-YYYYMMDD.dump`

# Ops — Postgres / Neon profile (RFH HMS)

Local development defaults to the **H2** file database. Production and shared UAT should use **PostgreSQL** (e.g. **Neon**).

Do **not** commit connection passwords, API keys, or JWT secrets to the repository.

---

## Profiles

| Profile | Config file | Typical use |
|---|---|---|
| default | `backend-java/src/main/resources/application.properties` | Local H2 (`./data/rfh-hms`) |
| `postgres` | `backend-java/src/main/resources/application-postgres.properties` | Neon / managed Postgres |

Activate the Postgres profile:

```bash
# Windows (PowerShell)
$env:SPRING_PROFILES_ACTIVE = "postgres"
.\mvnw.cmd spring-boot:run

# Or
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=postgres"
```

---

## Environment variables (set outside the repo)

Prefer environment variables or a local untracked `.env` / secret store. Never paste production values into git-tracked files.

| Variable | Purpose |
|---|---|
| `SPRING_PROFILES_ACTIVE` | Set to `postgres` for managed DB |
| `SPRING_DATASOURCE_URL` | JDBC URL, e.g. `jdbc:postgresql://…/neondb?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `JWT_SECRET` (or app-specific secret property) | Signing key for JWTs — use a long random value in prod |
| `SERVER_PORT` | Optional; default API port is `5000` |

Frontend (optional):

| Variable | Purpose |
|---|---|
| `REACT_APP_API_URL` | Override API base (default `http://localhost:5000/api`) — set in `frontend/.env` (gitignored) |

Check `.gitignore` covers `.env`, credential files, and local DB files.

---

## Neon checklist

1. Create a Neon project and copy the pooled or direct connection string.
2. Convert to JDBC form (`jdbc:postgresql://…`) with `sslmode=require`.
3. Set env vars above; start with `SPRING_PROFILES_ACTIVE=postgres`.
4. Confirm schema creation / Flyway-or-Hibernate strategy matches your ops policy (`ddl-auto` should not be `create`/`create-drop` in production).
5. Smoke-test login and one write path (e.g. vacancy or complaint).

---

## Backup & restore (high level)

**Backup (logical dump):**

```bash
pg_dump "$DATABASE_URL" --format=custom --file=rfh-hms-$(date +%Y%m%d).dump
```

On Windows, use Neon’s dashboard export or `pg_dump` from a client with the connection string in an env var (not logged).

**Restore:**

```bash
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" rfh-hms-YYYYMMDD.dump
```

**Practice:**

- Schedule automated backups via Neon’s built-in PITR / snapshots where available.
- Test restore into a **non-production** branch before relying on it for DR.
- After restore, verify admin login and a sample of clinical/finance tables.
- Retain backups per hospital records and POPIA retention policy (see audit trail UI note).

---

## Secrets hygiene

- Rotate DB passwords and JWT secrets after any leak or staff offboarding with access.
- Restrict who can view Neon console and CI secret stores.
- Application logs must not print passwords or full JWTs.

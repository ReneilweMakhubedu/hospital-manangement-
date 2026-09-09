# Rob Ferreira Hospital Management System (RFH HMS)

Hospital operations platform for **Rob Ferreira Hospital** (Mbombela, Mpumalanga), aligned with the provincial **#OperationAsiphileni** turnaround programme.

**Stack:** React (`frontend/`) + Spring Boot Java API (`backend-java/`).

## Documentation

| Doc | Description |
|---|---|
| [`docs/MODULES.md`](docs/MODULES.md) | Module catalogue by Asiphileni pillar |
| [`docs/TRAINING_CHECKLIST.md`](docs/TRAINING_CHECKLIST.md) | Role-based training + go-live sign-off |
| [`docs/OPS_POSTGRES.md`](docs/OPS_POSTGRES.md) | Neon/Postgres profile, env vars, backup notes |

## Programme pillars

| Pillar | Focus in this system |
|---|---|
| **Infrastructure Recovery** | Pharmacy stock + low-stock alerts; theatre utilisation |
| **HR Strengthening** | Staff profiles, vacancies, staffing dashboard, PMDS & intern supervision |
| **Financial Governance** | Cost centres (budget / commitment / actual, PFMA-aware) |
| **Patient Experience** | Reception, EMR, appointments, queue, surgical waitlist / TTG, complaints SLA, SMS reminders |
| **Monitoring** | Dashboards, DHIS2 exports, audit trail, M&E KPIs |

Module mapping lives in `frontend/src/brand.js` and drives the admin command centre.

## Included modules

- Role-based sign-up and login with staff route guards
- Patient records, EMR clinical notes (`/records`), appointments with available slots
- Doctor profiles, prescriptions, pharmacy command centre (`/pharmacy`) + dispense desk (`/pharmacy/dispense`)
- HR vacancies, staffing, PMDS & supervision (`/hr/vacancies`, `/hr/staffing`, `/hr/pmds`)
- Surgical waiting list & TTG (`/clinical/waitlist`)
- Complaints SLA (`/complaints`), SMS reminders (`/sms`), theatre utilisation (`/theatres`)
- Finance cost centres (`/finance`, admin), DHIS2 exports (`/reporting`), audit trail (`/audit`, admin)
- M&E KPIs (`/monitoring`), digital reception (`/reception`)
- Admin command centre organised by Asiphileni pillars

### Key staff routes

| Path | Roles |
|---|---|
| `/reception` | admin, doctor |
| `/complaints` | admin, doctor |
| `/sms` | admin, doctor |
| `/theatres` | admin, doctor |
| `/pharmacy` | admin, pharmacy |
| `/pharmacy/dispense` | admin, pharmacy, doctor |
| `/finance` | admin |
| `/reporting` | admin, doctor |
| `/audit` | admin |
| `/hr/pmds` | admin, doctor |
| `/monitoring` | admin, doctor |

## Requirements

- Node.js 18 or newer
- npm
- Java 21+ (for Spring Boot)
- Maven Wrapper is included in `backend-java/` (`mvnw` / `mvnw.cmd`)
- Optional: PostgreSQL / Neon for production — see [`docs/OPS_POSTGRES.md`](docs/OPS_POSTGRES.md)

## Run locally

```bash
npm install
npm run install:all
npm run dev
```

This starts Spring Boot on port **5000** and the React app on **3000**.

Or separately:

```bash
npm run backend
npm --prefix frontend run dev
```

Open `http://localhost:3000`. The API runs at `http://localhost:5000`.

> On Windows, if PowerShell blocks `npm.ps1`, use `npm.cmd` (for example `npm.cmd run dev`).

### Login accounts

Use these seeded accounts on the login page (`/login`). They are standard system users — not demo accounts.

| Role | Email | Password | Opens |
|---|---|---|---|
| Super Admin | `superadmin@rfh.gov.za` | `SuperAdmin123!` | `/cms` (home hero CMS) |
| Hospital Admin | `admin@rfh.gov.za` | `Admin123!` | `/admin` |
| HR Officer | `hr@rfh.gov.za` | `Hr123!` | `/hr` |
| Finance Officer | `finance@rfh.gov.za` | `Finance123!` | `/finance` |
| Payroll Officer | `payroll@rfh.gov.za` | `Payroll123!` | `/payroll` |
| Procurement Officer | `procurement@rfh.gov.za` | `Procurement123!` | `/procurement` |
| Pharmacy Officer | `pharmacy@rfh.gov.za` | `Pharmacy123!` | `/pharmacy` |
| Doctor | `doctor@rfh.gov.za` | `Doctor123!` | `/doctor` |
| Patient | `patient@rfh.gov.za` | `Patient123!` | `/patient/dashboard` |

**Notes**

- Patients can also self-register at `/signup` (patient role only).
- Hospital admin can create additional doctors, HR, finance, payroll, procurement, and pharmacy officers from their portals.
- Super Admin manages the public home hero carousel at `/cms` (upload high-resolution images, titles, CTAs).

### Portal homes after login

| Portal | Home path | Main areas |
|---|---|---|
| Super Admin CMS | `/cms` | Home page hero slides |
| Admin command centre | `/admin` | Asiphileni pillars and module links |
| Operations dashboard | `/dashboard` | Clinic overview (from admin) |
| Doctor | `/doctor` | Queue, consult, orders, referrals, notes, schedule |
| HR | `/hr` | Recruitment, vacancies, employees, leave, PMDS, training, reports, clinicians |
| Finance | `/finance` | Billing, budget, accounting, irregular expenditure, cost centres |
| Payroll | `/payroll` | Cost vs budget, timesheets, ghost-worker cases, certifications, audit |
| Procurement | `/procurement` | Tenders, bids, suppliers, contracts, spend, integrity ledger, alerts |
| Pharmacy | `/pharmacy` | Operations, clinical quality, finance, inventory, dispense desk |
| Patient | `/patient/dashboard` | Appointments, medications, records, notifications, feedback, profile |

### Key staff routes

| Path | Roles |
|---|---|
| `/reception` | admin, doctor |
| `/complaints` | admin, doctor |
| `/sms` | admin, doctor |
| `/theatres` | admin, doctor |
| `/pharmacy` | admin, pharmacy |
| `/pharmacy/dispense` | admin, pharmacy, doctor |
| `/finance` | admin, finance |
| `/payroll` | admin, payroll |
| `/procurement` | admin, procurement |
| `/hr` | admin, hr |
| `/doctor` | doctor |
| `/reporting` | admin, doctor |
| `/audit` | admin |
| `/hr/pmds` | admin, doctor, hr |
| `/monitoring` | admin, doctor |
| `/cms` | super_admin |

## Configuration

Spring Boot settings: `backend-java/src/main/resources/application.properties` (default H2 for local use). Optional PostgreSQL: `application-postgres.properties` — see [`docs/OPS_POSTGRES.md`](docs/OPS_POSTGRES.md).

Frontend API base defaults to `http://localhost:5000/api` (`frontend/src/api.js`). Override with `REACT_APP_API_URL` in `frontend/.env` if needed.

## Verification

```bash
cd backend-java
.\mvnw.cmd -q -DskipTests package
```

```bash
cd frontend
npm run build
```

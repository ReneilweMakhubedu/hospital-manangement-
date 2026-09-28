# Rob Ferreira Hospital Management System (RFH HMS)

Hospital operations platform for **Rob Ferreira Hospital** (Mbombela, Mpumalanga), aligned with the provincial **#OperationAsiphileni** turnaround programme.

**Stack:** React (`frontend/`) + Spring Boot Java API (`backend-java/`).

## Documentation

| Doc | Description |
|---|---|
| [`docs/FULL_PROJECT_DOCUMENTATION.md`](docs/FULL_PROJECT_DOCUMENTATION.md) | **Full project pack** (Markdown) — planning, Agile/Scrum, IEEE 830 SRS, UML diagrams, Scholar references |
| [`docs/RFH_HMS_Full_Project_Documentation.docx`](docs/RFH_HMS_Full_Project_Documentation.docx) | Same documentation as a **Word** document |
| [`docs/MODULES.md`](docs/MODULES.md) | Module catalogue by Asiphileni pillar |
| [`docs/TRAINING_CHECKLIST.md`](docs/TRAINING_CHECKLIST.md) | Role-based training + go-live sign-off |
| [`docs/OPS_POSTGRES.md`](docs/OPS_POSTGRES.md) | Neon/Postgres profile, env vars, backup notes |

## Programme pillars

| Pillar | Focus in this system |
|---|---|
| **Infrastructure Recovery** | Facilities & biomedical assets, pharmacy stock alerts, theatre utilisation |
| **HR Strengthening** | Staff profiles, vacancies, staffing dashboard, PMDS & intern supervision |
| **Financial Governance** | Billing, budget, accounting, irregular expenditure, cost centres, payroll, procurement |
| **Patient Experience** | Nursing, casualty/ED, lab, radiology, allied health, reception, EMR, appointments, queues, waitlists, complaints SLA, SMS |
| **Monitoring** | Dashboards, DHIS2 exports, audit trail, M&E KPIs, staff automation alerts |

Module mapping lives in `frontend/src/brand.js` and drives the admin command centre.

## Included modules

- Role-based login with staff route guards; patient self-registration at `/signup`
- Clinical portals: nursing, casualty/ED, laboratory, radiology, allied health
- Doctor portal: clinic queue, consult (SOAP + scribe draft), orders, referrals, notes, schedule
- Pharmacy command centre + dispense desk
- Facilities / biomedical work orders and planned maintenance
- HR, finance, payroll, procurement governance suites
- Complaints SLA, SMS reminders, theatre utilisation, surgical waitlist / TTG
- Admin command centre by Asiphileni pillars; Super Admin home-hero CMS (`/cms`)
- **AI Assist + automation** — staff alerts, scheduled scans, and draft helpers (see below)

## AI, machine learning, and automation

These are three separate capabilities. Open them together at `/intelligence` (any staff login; patients are excluded).

| Technology | What it does | Boundary |
|---|---|---|
| **AI assist** | Drafts a handover, triage hint, priority, work order, or summary from text the staff member types (`rfh-rules-v1`) | Suggestion only. Nothing is saved until a person confirms it. Not a diagnosis or prescription. |
| **Machine learning** | Logistic regression scores open lab orders for turnaround-breach risk. Linear regression forecasts occupied beds from occupancy, pending admissions, cleaning beds, and high-acuity patients (`rfh-gd-v1`) | Operational forecast. Weights are learned by gradient descent and shown on the page. |
| **Automation** | Every 5 minutes: consented SMS reminders, SLA and queue scans, and alerts when a machine-learning signal crosses a threshold | Alerts go to the responsible role. Staff still allocate beds and release cleaned beds themselves. |

Assist drafts are **suggestions only** — staff must confirm before applying to a record. The assist engine is rule-based (`rfh-rules-v1`) with a stable API so a live LLM can be plugged in later.

| Capability | How to use it |
|---|---|
| **Staff alerts** | Bell in portal headers (nursing, casualty, lab, radiology, facilities, allied, pharmacy, doctor, admin) |
| **Assist panel** | Bottom of each department portal — draft note, triage, handover, work order, summarise, prioritise |
| **Scheduled jobs** | Every 5 minutes (`app.automation.fixed-delay-ms`) — SMS flush + operational alert scan |
| **Run now** | Hospital admin → `/admin` → **Run automation** |

**Automation scans cover:** appointment SMS reminders, complaints SLA breaches, lab STAT/TAT & critical results, radiology STAT, ED wait breaches, nursing meds outstanding, facilities PM / assets down, pharmacy low stock & dispense queue backlog.

| API | Purpose |
|---|---|
| `GET /api/automation/alerts` | Open alerts for the signed-in role |
| `POST /api/automation/alerts/{id}/ack` | Acknowledge an alert |
| `POST /api/automation/run` | Admin-only: run SMS flush + alert scan immediately |
| `GET /api/automation/status` | Open / critical alert counts |
| `POST /api/assist` | Body: `{ action, portal, text }` — actions: `draft-note`, `summarise`, `prioritise`, `triage`, `handover`, `work-order` |
| `GET /api/learning/insights` | Machine-learning lab delay scores and bed-demand forecast |
| `POST /api/doctor/consult/scribe-draft` | Doctor SOAP draft (same assistant engine) |

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
>
> After pulling new backend code, restart the API so H2 seeds and new endpoints load. First boot can take ~20 seconds — wait for health at `http://localhost:5000/api/health` before logging in.

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
| Nurse | `nurse@rfh.gov.za` | `Nurse123!` | `/nursing` |
| Nurse Manager | `nursemanager@rfh.gov.za` | `NurseManager123!` | `/nursing` |
| Casualty / ED | `casualty@rfh.gov.za` | `Casualty123!` | `/casualty` |
| Laboratory | `lab@rfh.gov.za` | `Lab123!` | `/lab` |
| Radiology | `radiology@rfh.gov.za` | `Radiology123!` | `/radiology` |
| Facilities / Biomedical | `facilities@rfh.gov.za` | `Facilities123!` | `/facilities` |
| Allied Health | `allied@rfh.gov.za` | `Allied123!` | `/allied` |
| Reception | `reception@rfh.gov.za` | `Reception123!` | `/admissions` |
| Housekeeping | `housekeeping@rfh.gov.za` | `Housekeeping123!` | `/housekeeping` |
| Porter | `porter@rfh.gov.za` | `Porter123!` | `/porter` |
| Medical records | `records@rfh.gov.za` | `Records123!` | `/charts` |
| Midwife | `midwife@rfh.gov.za` | `Midwife123!` | `/maternity` |
| Theatre nurse | `theatre@rfh.gov.za` | `Theatre123!` | `/theatre-desk` |
| Anaesthetist | `anaesthetist@rfh.gov.za` | `Anaesthetist123!` | `/theatre-desk` |
| Infection prevention | `infection@rfh.gov.za` | `Infection123!` | `/infection` |
| Social worker | `social@rfh.gov.za` | `Social123!` | `/social` |
| Security | `security@rfh.gov.za` | `Security123!` | `/security` |
| Catering | `catering@rfh.gov.za` | `Catering123!` | `/catering` |
| Quality officer | `quality@rfh.gov.za` | `Quality123!` | `/quality` |
| Mortuary | `mortuary@rfh.gov.za` | `Mortuary123!` | `/mortuary` |
| Doctor | `doctor@rfh.gov.za` | `Doctor123!` | `/doctor` |
| Patient | `patient@rfh.gov.za` | `Patient123!` | `/patient/dashboard` |

**Notes**

- Patients can also self-register at `/signup` (patient role only).
- Hospital admin can create additional staff logins from each department portal’s Users page.
- Super Admin manages the public home hero carousel at `/cms` (upload high-resolution images, titles, CTAs). Prefer large images (≥1280px wide); the public home also falls back to `/heroes/` assets when CMS uploads are too small.

### Portal homes after login

| Portal | Home path | Main areas |
|---|---|---|
| Super Admin CMS | `/cms` | Home page hero slides |
| Admin command centre | `/admin` | Asiphileni pillars, module links, **Run automation** |
| Operations dashboard | `/dashboard` | Clinic overview (from admin) |
| Doctor | `/doctor` | Queue, consult, orders, referrals, notes, schedule, Assist |
| Nursing | `/nursing` | Beds & wards, vitals, meds admin, handovers, Assist |
| Casualty / ED | `/casualty` | SAT triage board, visits, wait times, Assist |
| Laboratory | `/lab` | Orders, STAT queue, turnaround, Assist |
| Radiology | `/radiology` | Imaging orders and reports, Assist |
| Facilities | `/facilities` | Work orders, biomedical assets, PM, Assist |
| Allied health | `/allied` | Physio, OT, dietetics, social work referrals, Assist |
| Reception | `/admissions` | Bed requests and check-in. Nursing allocates the bed |
| Housekeeping | `/housekeeping` | Cleaning tasks; release a CLEANING bed to available |
| Porters | `/porter` | Transport jobs to a floor, ward, and bed |
| Medical records | `/charts` | Chart pull and filing |
| Maternity | `/maternity` | Midwife cases |
| Theatre desk | `/theatre-desk` | Theatre nurse and anaesthetist cases, plus utilisation |
| Infection prevention | `/infection` | Isolation cases by bed |
| Social work | `/social` | Social work cases |
| Security | `/security` | Incidents |
| Catering | `/catering` | Ward meal orders |
| Quality | `/quality` | Complaints SLA (5-day ack / 25-day resolve) |
| Mortuary | `/mortuary` | Deceased register |
| HR | `/hr` | Recruitment, vacancies, employees, leave, PMDS, training, reports, clinicians |
| Finance | `/finance` | Billing, budget, accounting, irregular expenditure, cost centres |
| Payroll | `/payroll` | Cost vs budget, timesheets, ghost-worker cases, certifications, audit |
| Procurement | `/procurement` | Tenders, bids, suppliers, contracts, spend, integrity ledger, alerts |
| Pharmacy | `/pharmacy` | Operations, clinical quality, finance, inventory, dispense desk, Assist |
| Patient | `/patient/dashboard` | Appointments, medications, records, notifications, feedback, profile |

### Key staff routes

| Path | Roles |
|---|---|
| `/reception` | admin, doctor, reception |
| `/admissions` | admin, reception |
| `/housekeeping` | admin, housekeeping |
| `/porter` | admin, porter |
| `/charts` | admin, records |
| `/maternity` | admin, midwife |
| `/theatre-desk` | admin, theatre, anaesthetist |
| `/infection` | admin, infection |
| `/social` | admin, social |
| `/security` | admin, security |
| `/catering` | admin, catering |
| `/quality` | admin, quality |
| `/mortuary` | admin, mortuary |
| `/complaints` | admin, doctor, quality |
| `/sms` | admin, doctor |
| `/theatres` | admin, doctor, theatre, anaesthetist |
| `/pharmacy` | admin, pharmacy |
| `/pharmacy/dispense` | admin, pharmacy, doctor |
| `/nursing` | admin, nurse, nurse_manager |
| `/casualty` | admin, casualty |
| `/lab` | admin, lab |
| `/radiology` | admin, radiology |
| `/facilities` | admin, facilities |
| `/allied` | admin, allied |
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

Spring Boot settings: `backend-java/src/main/resources/application.properties` (default H2 file DB at `backend-java/data/`).

| Setting | Default | Purpose |
|---|---|---|
| `server.port` | `5000` | API port |
| `app.jwt.secret` | dev secret | Override with `JWT_SECRET` in production |
| `app.automation.fixed-delay-ms` | `300000` (5 min) | Automation scan interval (`AUTOMATION_FIXED_DELAY_MS`) |
| `spring.jpa.hibernate.ddl-auto` | `update` | Schema updates on startup |

Optional PostgreSQL: `application-postgres.properties` — see [`docs/OPS_POSTGRES.md`](docs/OPS_POSTGRES.md).

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

Quick API check after `npm run dev`:

```bash
curl http://localhost:5000/api/health
```

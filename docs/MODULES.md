# RFH HMS — module catalogue

Operational modules for **Rob Ferreira Hospital Management System**, organised by **#OperationAsiphileni** pillars.

| Pillar | Modules | Routes |
|---|---|---|
| **Infrastructure** | Facilities & biomedical, Pharmacy stock, Theatre utilisation | `/facilities`, `/pharmacy`, `/theatres` |
| **HR Strengthening** | Staff, Vacancies, Staffing dashboard, PMDS & intern supervision | `/hr/*`, `/doctor`, `/hr/vacancies`, `/hr/staffing`, `/hr/pmds` |
| **Financial Governance** | Finance, Payroll, Procurement | `/finance`, `/payroll`, `/procurement` |
| **Patient Experience** | Nursing, Casualty/ED, Lab, Radiology, Allied health, Reception, Patients, Appointments, Queue, EMR, Surgical waitlist/TTG, Complaints SLA, SMS; **patient portal** | `/nursing`, `/casualty`, `/lab`, `/radiology`, `/allied`, staff clinical routes, `/patient/*` |
| **Monitoring** | Operations dashboard, Reports, DHIS2 exports, Audit trail, M&E KPIs, **automation alerts & Assist** | `/dashboard`, `/reporting`, `/audit`, `/monitoring`, `/api/automation`, `/api/assist` |

Source of truth for the admin command centre: `frontend/src/brand.js`.

## Related docs

- Root [`README.md`](../README.md) — run locally, login table, Assist & automation APIs
- [`FULL_PROJECT_DOCUMENTATION.md`](FULL_PROJECT_DOCUMENTATION.md) — SRS, Agile planning, use-case/architecture diagrams, Google Scholar references
- [`TRAINING_CHECKLIST.md`](TRAINING_CHECKLIST.md) — role-based training and go-live sign-off
- [`OPS_POSTGRES.md`](OPS_POSTGRES.md) — production database profile

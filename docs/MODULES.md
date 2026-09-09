# RFH HMS — module catalogue

Operational modules for **Rob Ferreira Hospital Management System**, organised by **#OperationAsiphileni** pillars.

| Pillar | Modules | Routes |
|---|---|---|
| **Infrastructure** | Pharmacy stock, Theatre utilisation | `/pharmacy`, `/theatres` |
| **HR Strengthening** | Staff, Vacancies, Staffing dashboard, PMDS & intern supervision | `/doctor`, `/hr/vacancies`, `/hr/staffing`, `/hr/pmds` |
| **Financial Governance** | Cost centres | `/finance` |
| **Patient Experience** | Reception, Patients, Appointments, Queue, EMR, Surgical waitlist/TTG, Complaints SLA, SMS reminders; **patient portal** (appointments, CCMDD meds, records, notifications, feedback, profile, support) | Staff routes + `/patient/*` |
| **Monitoring** | Operations dashboard, Reports, Staff chat, DHIS2 exports, Audit trail, M&E KPIs | `/dashboard`, `/reports`, `/chat`, `/reporting`, `/audit`, `/monitoring` |

Source of truth for the admin command centre: `frontend/src/brand.js`.

## Related docs

- [`TRAINING_CHECKLIST.md`](TRAINING_CHECKLIST.md) — role-based training and go-live sign-off
- [`OPS_POSTGRES.md`](OPS_POSTGRES.md) — production database profile

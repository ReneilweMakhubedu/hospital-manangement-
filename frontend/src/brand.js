/**
 * Rob Ferreira Hospital Management System — brand & programme structure.
 * Aligned with Mpumalanga DoH #OperationAsiphileni turnaround pillars.
 */

export const brand = {
  shortName: 'RFH HMS',
  name: 'Rob Ferreira Hospital Management System',
  hospital: 'Rob Ferreira Hospital',
  location: 'Mbombela, Mpumalanga',
  tagline: 'Accountability and care for a tertiary centre of excellence',
  programme: '#OperationAsiphileni',
  programmeLabel: 'Aligned with #OperationAsiphileni',
  copyright: `© ${new Date().getFullYear()} Rob Ferreira Hospital · Mpumalanga Department of Health`,
  colors: {
    white: '#ffffff',
    canvas: '#f5f5f5',
    panel: '#f8f8f8',
    accent: '#e41e1f',
    muted: '#8b8b8b',
  },
  /** @deprecated use brand.colors.canvas */
  dashboardBg: '#f5f5f5',
};

/**
 * Five provincial turnaround pillars and their operational modules.
 */
export const asiphileniPillars = [
  {
    id: 'infrastructure',
    title: 'Infrastructure Recovery',
    shortTitle: 'Infrastructure',
    description:
      'Facilities maintenance, medical equipment lifecycle, and theatre capacity for Level 2/3 services.',
    modules: [
      {
        title: 'Pharmacy command centre',
        description:
          'Operations queue, clinical quality, finance, inventory & supply, and dispense desk.',
        route: '/pharmacy',
        status: 'live',
      },
      {
        title: 'Pharmacy dispense desk',
        description: 'Medication inventory and prescription dispensing.',
        route: '/pharmacy/dispense',
        status: 'live',
      },
      {
        title: 'Theatre utilisation',
        description: 'Theatre sessions, utilisation %, and capacity monitoring.',
        route: '/theatres',
        status: 'live',
      },
    ],
  },
  {
    id: 'hr',
    title: 'HR Strengthening',
    shortTitle: 'Human Resources',
    description:
      'Workforce planning, vacancies, performance (PMDS), CPD, mentorship, and staff retention.',
    modules: [
      {
        title: 'HR executive dashboard',
        description: 'Headcount, vacancies, PMDS, leave, training, and workforce alerts.',
        route: '/hr',
        status: 'live',
      },
      {
        title: 'Recruitment & onboarding',
        description: 'Talent pool, applicants, and new-starter checklists.',
        route: '/hr/recruitment',
        status: 'live',
      },
      {
        title: 'Vacancy tracking',
        description: 'Establishment posts, fill rates, and critical shortage alerts.',
        route: '/hr/vacancies',
        status: 'live',
      },
      {
        title: 'Employee records',
        description: 'Staff profiles, categories, HPCSA numbers, and compliance gaps.',
        route: '/hr/employees',
        status: 'live',
      },
      {
        title: 'Leave & attendance',
        description: 'Leave requests with approve and reject workflow.',
        route: '/hr/leave',
        status: 'live',
      },
      {
        title: 'PMDS & performance',
        description: 'Supervisor assignments, supervision logs, and PMDS cycles.',
        route: '/hr/pmds',
        status: 'live',
      },
      {
        title: 'Training & CPD',
        description: 'Courses, enrolments, and workplace skills plan progress.',
        route: '/hr/training',
        status: 'live',
      },
      {
        title: 'Clinician credentialing',
        description: 'Create doctors with HPCSA speciality, grade, and system role codes.',
        route: '/hr/doctors',
        status: 'live',
      },
      {
        title: 'Staffing snapshot',
        description: 'Workforce snapshot, specialty coverage, and vacancy gap.',
        route: '/hr/staffing',
        status: 'live',
      },
      {
        title: 'HR login accounts',
        description: 'Create HR officer accounts for the HR portal.',
        route: '/hr/users',
        status: 'live',
      },
      {
        title: 'HR reports',
        description: 'Turnover, time-to-fill, vacancy rate, and department analytics.',
        route: '/hr/reports',
        status: 'live',
      },
    ],
  },
  {
    id: 'finance',
    title: 'Financial Governance',
    shortTitle: 'Finance',
    description:
      'Cost centres, PFMA compliance, NHI-ready revenue, and a link into the Procurement portal for tenders and contracts.',
    modules: [
      {
        title: 'Finance executive dashboard',
        description: 'Budget vs actual, revenue, debtors, irregular spend, and alerts.',
        route: '/finance',
        status: 'live',
      },
      {
        title: 'Payroll dashboard',
        description: 'Staff cost, FTE, overtime, ghost-worker cases, and compliance.',
        route: '/payroll',
        status: 'live',
      },
      {
        title: 'Billing & revenue',
        description: 'Patient invoices, debt accounts, and debtors summary.',
        route: '/finance/billing',
        status: 'live',
      },
      {
        title: 'Procurement portal',
        description:
          'Tenders, suppliers, contracts, spend analytics, integrity ledger, and risk alerts.',
        route: '/procurement',
        status: 'live',
      },
      {
        title: 'Budgeting',
        description: 'Department forecasts, actuals, and variance.',
        route: '/finance/budget',
        status: 'live',
      },
      {
        title: 'Accounting',
        description: 'Fixed asset register and accounting summary.',
        route: '/finance/accounting',
        status: 'live',
      },
      {
        title: 'Irregular expenditure',
        description: 'Irregular, fruitless, and wasteful expenditure register.',
        route: '/finance/irregular',
        status: 'live',
      },
      {
        title: 'Cost centres',
        description: 'Budget vs commitment vs actual (PFMA-aware).',
        route: '/finance/cost-centres',
        status: 'live',
      },
      {
        title: 'Finance login accounts',
        description: 'Create finance officer accounts for the finance portal.',
        route: '/finance/users',
        status: 'live',
      },
    ],
  },
  {
    id: 'patient',
    title: 'Patient Experience',
    shortTitle: 'Patient Care',
    description:
      'Registration, EMR, appointments, queues, referrals, waiting lists, and complaint timelines.',
    modules: [
      { title: 'Digital reception', description: 'Check-in and visit start.', route: '/reception', status: 'live' },
      { title: 'Patients', description: 'Electronic patient records.', route: '/patients', status: 'live' },
      { title: 'Appointments', description: 'Scheduling and bookings.', route: '/appointments', status: 'live' },
      { title: 'Smart queue', description: 'Real-time waiting list flow.', route: '/queue', status: 'live' },
      { title: 'Medical records', description: 'Clinical history and notes.', route: '/records', status: 'live' },
      {
        title: 'Surgical waiting list & TTG',
        description: 'Decision-to-treat timelines and theatre scheduling.',
        route: '/clinical/waitlist',
        status: 'live',
      },
      {
        title: 'Complaints SLA',
        description: '5-day acknowledgement / 25-day resolution clocks.',
        route: '/complaints',
        status: 'live',
      },
      {
        title: 'SMS reminders',
        description: 'T-24h appointment reminders with POPIA consent.',
        route: '/sms',
        status: 'live',
      },
    ],
  },
  {
    id: 'monitoring',
    title: 'Monitoring & Evaluation',
    shortTitle: 'Monitoring',
    description:
      'Operational dashboards, KPIs, data quality, audit trails, and provincial reporting readiness.',
    modules: [
      { title: 'Operations dashboard', description: 'Day-to-day hospital overview.', route: '/dashboard', status: 'live' },
      { title: 'Reports', description: 'Clinic and operational reports.', route: '/reports', status: 'live' },
      { title: 'Staff activity', description: 'Recent system actions for team coordination.', route: '/chat', status: 'live' },
      {
        title: 'DHIS2 exports',
        description: 'Quality checks, mapping, and DHIS2/HPRS-shaped packs.',
        route: '/reporting',
        status: 'live',
      },
      {
        title: 'Audit trail',
        description: 'POPIA access and change review for admins.',
        route: '/audit',
        status: 'live',
      },
      {
        title: 'M&E KPIs',
        description: 'Bed, wait, queue, complaints, pharmacy, theatre, HR.',
        route: '/monitoring',
        status: 'live',
      },
    ],
  },
];

export const liveModuleCount = asiphileniPillars.reduce(
  (n, p) => n + p.modules.filter((m) => m.status === 'live').length,
  0
);

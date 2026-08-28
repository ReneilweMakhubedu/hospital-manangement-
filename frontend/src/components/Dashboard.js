import React from 'react';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ClipboardPlus,
  Clock3,
  FileText,
  MessageSquare,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const stats = [
  { label: 'Patients registered', value: '-', detail: 'Connect MongoDB to view totals', icon: Users, tone: 'bg-teal-50 text-teal-700' },
  { label: 'Appointments today', value: '-', detail: 'No appointments loaded yet', icon: CalendarDays, tone: 'bg-blue-50 text-blue-700' },
  { label: 'Waiting queue', value: '-', detail: 'Queue will update at reception', icon: Clock3, tone: 'bg-amber-50 text-amber-700' },
  { label: 'Doctors available', value: '-', detail: 'Availability not configured', icon: Stethoscope, tone: 'bg-violet-50 text-violet-700' },
];

const actions = [
  { title: 'Digital reception', description: 'Check in walk-in patients and begin their visit.', path: '/reception', icon: ClipboardPlus, accent: 'bg-teal-600 hover:bg-teal-700' },
  { title: 'Register patient', description: 'Create a secure electronic patient profile.', path: '/patients', icon: Users, accent: 'bg-blue-600 hover:bg-blue-700' },
  { title: 'Manage queue', description: 'See who is waiting and move patients through care.', path: '/queue', icon: Clock3, accent: 'bg-amber-500 hover:bg-amber-600' },
  { title: 'Appointments', description: 'Schedule and review planned patient visits.', path: '/appointments', icon: CalendarDays, accent: 'bg-violet-600 hover:bg-violet-700' },
];

function Dashboard() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-blue-950 text-slate-900">
      <header className="border-b border-teal-300/15 bg-gradient-to-r from-slate-950 via-teal-950 to-blue-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
            <button className="flex items-center gap-3 text-left" onClick={() => navigate('/')} aria-label="Go to PMS home">
            <BrandLogo className="h-10 w-10 shrink-0" />
            <span>
              <span className="block text-xl font-bold tracking-tight text-white">PMS</span>
              <span className="block text-xs font-medium text-teal-200">Digital Clinic Operations</span>
            </span>
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <FileText size={16} /> Reports
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        <section className="mb-8 rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-700 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                <Activity size={14} /> Clinic overview
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Good day, clinic team.</h1>
              <p className="mt-2 max-w-xl text-sm text-teal-50 sm:text-base">Keep patients moving, records organised, and your team connected from one place.</p>
            </div>
            <button onClick={() => navigate('/reception')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-teal-700 shadow-sm transition hover:bg-teal-50">
              Start check-in <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section aria-label="Clinic statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, detail, icon: Icon, tone }) => (
            <article key={label} className="rounded-xl border border-teal-200/15 bg-slate-900/70 p-5 text-white shadow-lg shadow-slate-950/30 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div><p className="text-sm font-medium text-teal-100/75">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>
                <span className={`rounded-lg p-2.5 ${tone}`}><Icon size={21} /></span>
              </div>
              <p className="mt-3 text-xs text-teal-100/65">{detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-10">
          <div className="mb-4"><h2 className="text-xl font-bold text-white">Start a task</h2><p className="mt-1 text-sm text-teal-100/75">Core tools for managing the patient journey.</p></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {actions.map(({ title, description, path, icon: Icon, accent }) => (
              <button key={path} onClick={() => navigate(path)} className="group rounded-xl border border-teal-200/15 bg-slate-900/70 p-5 text-left text-white shadow-lg shadow-slate-950/30 backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-slate-800/80 hover:shadow-xl">
                <span className={`mb-5 inline-flex rounded-lg p-2.5 text-white ${accent}`}><Icon size={21} /></span>
                <h3 className="font-bold capitalize">{title}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-teal-100/75">{description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-300">Open module <ArrowRight className="transition group-hover:translate-x-1" size={15} /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          <article className="rounded-xl border border-teal-200/15 bg-slate-900/70 p-5 text-white shadow-lg shadow-slate-950/30 backdrop-blur-sm lg:col-span-2"><h2 className="font-bold">Today's workflow</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{['Check in patient', 'Add to queue', 'Complete consultation'].map((step, index) => <div key={step} className="flex items-center gap-3 rounded-lg bg-white/10 p-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-300 text-sm font-bold text-teal-950">{index + 1}</span><span className="text-sm font-medium">{step}</span></div>)}</div></article>
          <button onClick={() => navigate('/chat')} className="rounded-xl border border-teal-200/15 bg-slate-900/70 p-5 text-left text-white shadow-lg shadow-slate-950/30 backdrop-blur-sm transition hover:bg-slate-800/80 hover:shadow-xl"><MessageSquare className="text-teal-300" size={24} /><h2 className="mt-4 font-bold">Staff chat board</h2><p className="mt-1 text-sm text-teal-100/75">Share updates with reception, doctors, and administrators.</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-300">Open chat <ArrowRight size={15} /></span></button>
        </section>
      </div>
    </main>
  );
}

export default Dashboard;

import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ClipboardPlus,
  Clock3,
  FileText,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import BrandLogo from './BrandLogo';
import { apiFetch, getRole } from '../auth';
import { brand } from '../brand';

function Dashboard() {
  const navigate = useNavigate();
  const role = getRole();
  const home = role === 'doctor' ? '/doctor' : '/admin';

  const [stats, setStats] = useState([
    { label: 'Patients registered', value: '…', detail: 'Loading', icon: Users, tone: 'bg-[#f8f8f8] text-[#e41e1f]' },
    { label: 'Appointments today', value: '…', detail: 'Loading', icon: CalendarDays, tone: 'bg-[#f8f8f8] text-[#e41e1f]' },
    { label: 'Waiting queue', value: '…', detail: 'Loading', icon: Clock3, tone: 'bg-[#f8f8f8] text-[#8b8b8b]' },
    { label: 'Doctors on roster', value: '…', detail: 'Loading', icon: Stethoscope, tone: 'bg-[#f8f8f8] text-[#e41e1f]' },
  ]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tokenOpts = { navigate };
        const [patientsRes, doctorsRes, queueRes, apptsRes] = await Promise.all([
          apiFetch('/admin/total-patients', tokenOpts).catch(() => null),
          apiFetch('/admin/total-doctors', tokenOpts).catch(() => null),
          apiFetch('/queue/today', tokenOpts),
          apiFetch('/appointments', tokenOpts),
        ]);

        // Doctors may not call admin totals — fall back
        let patientCount = null;
        let doctorCount = null;
        if (patientsRes?.ok) {
          const j = await patientsRes.json();
          patientCount = j.totalPatients ?? j.total ?? null;
        }
        if (doctorsRes?.ok) {
          const j = await doctorsRes.json();
          doctorCount = j.totalDoctors ?? j.total ?? null;
        }
        if (patientCount == null || doctorCount == null) {
          const [recRes, docAllRes] = await Promise.all([
            apiFetch('/patient/records', tokenOpts),
            apiFetch('/doctor/all', tokenOpts),
          ]);
          if (patientCount == null && recRes.ok) {
            const list = await recRes.json();
            patientCount = Array.isArray(list) ? list.length : 0;
          }
          if (doctorCount == null && docAllRes.ok) {
            const list = await docAllRes.json();
            doctorCount = Array.isArray(list) ? list.length : 0;
          }
        }

        const queue = queueRes.ok ? await queueRes.json() : [];
        const appts = apptsRes.ok ? await apptsRes.json() : [];
        const today = new Date().toISOString().slice(0, 10);
        const queueList = Array.isArray(queue) ? queue : [];
        const apptList = Array.isArray(appts) ? appts : [];
        const waiting = queueList.filter((q) => (q.status || '').toLowerCase() === 'waiting').length;
        const todayAppts = apptList.filter((a) => a.date === today).length;

        if (cancelled) return;
        setStats([
          {
            label: 'Patients registered',
            value: patientCount ?? '—',
            detail: 'Active patient records',
            icon: Users,
            tone: 'bg-[#f8f8f8] text-[#e41e1f]',
          },
          {
            label: 'Appointments today',
            value: todayAppts,
            detail: `${apptList.length} total in schedule`,
            icon: CalendarDays,
            tone: 'bg-[#f8f8f8] text-[#e41e1f]',
          },
          {
            label: 'Waiting queue',
            value: waiting,
            detail: `${queueList.length} in today's queue`,
            icon: Clock3,
            tone: 'bg-[#f8f8f8] text-[#8b8b8b]',
          },
          {
            label: 'Doctors on roster',
            value: doctorCount ?? '—',
            detail: 'Credentialed clinicians',
            icon: Stethoscope,
            tone: 'bg-[#f8f8f8] text-[#e41e1f]',
          },
        ]);
        setError('');
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load operations overview');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const actions = [
    {
      title: 'Digital reception',
      description: 'Check in patients and add them to today’s queue.',
      path: '/reception',
      icon: ClipboardPlus,
    },
    {
      title: 'Register patient',
      description: 'Create a secure electronic patient profile.',
      path: '/patients',
      icon: Users,
    },
    {
      title: 'Manage queue',
      description: 'See who is waiting and move patients through care.',
      path: '/queue',
      icon: Clock3,
    },
    {
      title: 'Appointments',
      description: 'Schedule and review planned patient visits.',
      path: '/appointments',
      icon: CalendarDays,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#1f1f1f]">
      <header className="border-b border-[#8b8b8b]/25 bg-[#ffffff]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            className="flex items-center gap-3 text-left"
            onClick={() => navigate(home)}
            aria-label={`Go to ${brand.shortName} home`}
            type="button"
          >
            <BrandLogo className="h-10 w-10 shrink-0" />
            <span>
              <span className="block text-xl font-bold tracking-tight text-[#1f1f1f]">{brand.shortName}</span>
              <span className="block text-xs font-medium text-[#e41e1f]">{brand.hospital}</span>
            </span>
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(home)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#8b8b8b]/30 bg-[#f8f8f8] px-3 py-2 text-sm font-semibold text-[#e41e1f] transition hover:bg-[#f8f8f8]"
            >
              Command centre
            </button>
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="inline-flex items-center gap-2 rounded-lg border border-[#8b8b8b]/30 bg-[#ffffff] px-3 py-2 text-sm font-semibold text-[#1f1f1f] transition hover:border-[#8b8b8b]/40"
            >
              <FileText size={16} /> Reports
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        <section className="mb-8 rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#f8f8f8] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#e41e1f]">
                <Activity size={14} /> Clinic overview
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-[#1f1f1f] sm:text-4xl">
                Operations dashboard
              </h1>
              <p className="mt-2 max-w-xl text-sm text-[#8b8b8b] sm:text-base">
                Live patient volume, queue pressure, and roster coverage for {brand.hospital}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/reception')}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-bold text-[#ffffff] shadow-sm transition hover:bg-[#e41e1f]"
            >
              Start check-in <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-xl bg-[#f8f8f8] px-4 py-3 text-sm text-[#e41e1f]">{error}</div>
        )}

        <section aria-label="Clinic statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, detail, icon: Icon, tone }) => (
            <article
              key={label}
              className="rounded-xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 text-[#1f1f1f] shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[#8b8b8b]">{label}</p>
                  <p className="mt-2 text-3xl font-bold">{value}</p>
                </div>
                <span className={`rounded-lg p-2.5 ${tone}`}>
                  <Icon size={21} />
                </span>
              </div>
              <p className="mt-3 text-xs text-[#8b8b8b]">{detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {actions.map(({ title, description, path, icon: Icon }) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className="rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-5 text-left shadow-sm transition hover:border-[#8b8b8b]/40 hover:bg-[#f8f8f8]"
            >
              <Icon className="mb-3 text-[#e41e1f]" size={22} />
              <h2 className="text-lg font-bold text-[#1f1f1f]">{title}</h2>
              <p className="mt-1 text-sm text-[#8b8b8b]">{description}</p>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}

export default Dashboard;

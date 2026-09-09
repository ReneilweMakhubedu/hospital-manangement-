import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  Clock3,
  LoaderCircle,
  Send,
  Stethoscope,
  Users,
} from 'lucide-react';

import { apiFetch } from '../../auth';
import DoctorLayout from './DoctorLayout';

function StatusBanner({ status }) {
  if (!status?.message) return null;
  return (
    <div
      className={`mb-6 rounded-xl px-4 py-3 text-sm ${
        status.type === 'error' ? 'bg-[#f8f8f8] text-[#e41e1f]' : 'bg-[#f8f8f8] text-[#e41e1f]'
      }`}
    >
      {status.message}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail, to, accent }) {
  const content = (
    <>
      <div
        className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${
          accent || 'bg-[#f8f8f8] text-[#e41e1f]'
        }`}
      >
        <Icon size={18} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">{value}</p>
      {detail && <p className="mt-1 text-sm text-[#8b8b8b]">{detail}</p>}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#8b8b8b]/40 hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">{content}</div>
  );
}

function patientLabel(apt) {
  return (
    apt.patientName ||
    [apt.patientFirstName, apt.patientLastName].filter(Boolean).join(' ') ||
    `Patient #${apt.patientId || '—'}`
  );
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/doctor/dashboard', { navigate });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Unable to load clinician dashboard');
        }
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (error) {
        if (!cancelled) setStatus({ type: 'error', message: error.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const profile = data?.profile || {};
  const firstName = profile.firstName || data?.firstName;
  const upcoming = data?.upcomingAppointments || [];
  const metrics = data?.metrics || {};

  return (
    <DoctorLayout
      title={`Welcome${firstName ? `, Dr ${firstName}` : ''}`}
      subtitle="Today's clinics, queue pressure, and open clinical work at a glance."
      actions={
        <>
          <Link
            to="/doctor/consult"
            className="inline-flex items-center gap-2 rounded-xl bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f]"
          >
            <Stethoscope size={16} /> Start consult
          </Link>
          <Link
            to="/doctor/queue"
            className="inline-flex items-center gap-2 rounded-xl border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] hover:border-[#8b8b8b]/40"
          >
            <Users size={16} /> View queue
          </Link>
        </>
      }
    >
      <StatusBanner status={status} />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={20} /> Loading dashboard…
        </div>
      ) : (
        <>
          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={CalendarDays}
              label="Today's appointments"
              value={data?.todayAppointmentsCount ?? upcoming.length}
              detail={`${data?.patientsSeenToday ?? 0} seen so far`}
              to="/doctor/schedule"
            />
            <StatCard
              icon={Clock3}
              label="Waiting queue"
              value={data?.waitingQueueCount ?? 0}
              detail="Patients waiting now"
              to="/doctor/queue"
            />
            <StatCard
              icon={AlertTriangle}
              label="Critical flags"
              value={data?.criticalFlagsCount ?? 0}
              detail="RED urgency / alerts"
              accent="bg-[#f8f8f8] text-[#e41e1f]"
              to="/doctor/queue"
            />
            <StatCard
              icon={ClipboardList}
              label="Open work"
              value={(data?.openOrdersCount ?? 0) + (data?.openReferralsCount ?? 0)}
              detail={`${data?.openOrdersCount ?? 0} orders · ${data?.openReferralsCount ?? 0} referrals`}
              to="/doctor/orders"
            />
          </section>

          <section className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-[#1f1f1f]">Upcoming patients</h2>
                <Link to="/doctor/queue" className="text-sm font-semibold text-[#e41e1f] hover:underline">
                  Open queue
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-sm text-[#8b8b8b]">No remaining appointments listed for today.</p>
              ) : (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {upcoming.slice(0, 8).map((apt) => (
                    <li
                      key={apt._id || apt.id || `${apt.patientId}-${apt.time}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="font-semibold text-[#1f1f1f]">{patientLabel(apt)}</p>
                        <p className="text-sm text-[#8b8b8b]">
                          {apt.time || '—'}
                          {apt.reason || apt.purpose ? ` · ${apt.reason || apt.purpose}` : ''}
                          {apt.waitEstimateMinutes != null || apt.estimatedWaitMinutes != null
                            ? ` · ~${apt.waitEstimateMinutes ?? apt.estimatedWaitMinutes} min wait`
                            : ''}
                        </p>
                      </div>
                      <Link
                        to={`/doctor/consult?patientId=${apt.patientId}`}
                        className="rounded-lg bg-[#f8f8f8] px-3 py-1.5 text-sm font-semibold text-[#e41e1f] hover:bg-[#f8f8f8]"
                      >
                        Consult
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-bold text-[#1f1f1f]">This week</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#8b8b8b]">Patients</dt>
                    <dd className="font-semibold text-[#1f1f1f]">{metrics.patientsThisWeek ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#8b8b8b]">Prescriptions</dt>
                    <dd className="font-semibold text-[#1f1f1f]">
                      {metrics.prescriptionsThisWeek ?? '—'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-bold text-[#1f1f1f]">Quick links</h2>
                <div className="flex flex-col gap-2">
                  {[
                    { to: '/doctor/orders', label: 'Lab & imaging orders', icon: ClipboardList },
                    { to: '/doctor/referrals', label: 'Referral letters', icon: Send },
                    { to: '/doctor/notes', label: 'Clinical documentation', icon: Stethoscope },
                    { to: '/doctor/governance', label: 'Guidelines & metrics', icon: AlertTriangle },
                  ].map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#1f1f1f] hover:bg-[#f8f8f8] hover:text-[#e41e1f]"
                    >
                      <Icon size={16} className="text-[#e41e1f]" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </DoctorLayout>
  );
}

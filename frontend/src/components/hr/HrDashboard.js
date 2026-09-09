import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Briefcase,
  CalendarOff,
  ClipboardCheck,
  GraduationCap,
  HeartPulse,
  LoaderCircle,
  RefreshCw,
  Timer,
  UserPlus,
  Users,
} from 'lucide-react';

import { apiFetch } from '../../auth';
import HrLayout from './HrLayout';

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

  return <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">{content}</div>;
}

function personName(row) {
  return (
    [row.firstName, row.lastName].filter(Boolean).join(' ') ||
    row.name ||
    row.employeeName ||
    '—'
  );
}

export default function HrDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/hr/dashboard', { navigate });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Unable to load HR dashboard');
      setData(json);
      setStatus({ type: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const alerts = Array.isArray(data?.alerts) ? data.alerts : [];
  const critical = Array.isArray(data?.criticalVacancies)
    ? data.criticalVacancies
    : data?.criticalVacanciesList || [];
  const applicants = Array.isArray(data?.recentApplicants) ? data.recentApplicants : [];

  return (
    <HrLayout
      title="HR executive dashboard"
      subtitle="Headcount, vacancies, PMDS compliance, leave, training, and workforce alerts."
      actions={
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] hover:border-[#8b8b8b]/40 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <StatusBanner status={status} />

      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 py-20 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={20} /> Loading dashboard…
        </div>
      ) : (
        <>
          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Users}
              label="Headcount"
              value={data?.headcount ?? 0}
              detail="Active staff + clinicians"
              to="/hr/employees"
            />
            <StatCard
              icon={Briefcase}
              label="Vacancy gap"
              value={data?.vacancyGap ?? 0}
              detail={`${data?.vacancyRate ?? 0}% vacancy rate`}
              to="/hr/vacancies"
              accent="bg-[#f8f8f8] text-[#8b8b8b]"
            />
            <StatCard
              icon={AlertTriangle}
              label="Critical vacancies"
              value={data?.criticalVacanciesCount ?? critical.length}
              detail="Flagged shortages"
              to="/hr/vacancies"
              accent="bg-[#f8f8f8] text-[#e41e1f]"
            />
            <StatCard
              icon={ClipboardCheck}
              label="PMDS compliance"
              value={`${data?.pmdsCompliancePercent ?? 0}%`}
              detail="Completed cycles"
              to="/hr/pmds"
            />
            <StatCard
              icon={Timer}
              label="Avg time-to-fill"
              value={`${data?.avgTimeToFillDays ?? '—'} days`}
              detail="Advertised to filled"
              to="/hr/recruitment"
            />
            <StatCard
              icon={HeartPulse}
              label="Morale score"
              value={data?.moraleScore != null ? Number(data.moraleScore).toFixed(1) : '—'}
              detail="Latest pulse (1–5)"
              to="/hr/reports"
            />
            <StatCard
              icon={CalendarOff}
              label="Pending leave"
              value={data?.leavePendingCount ?? 0}
              detail="Awaiting approval"
              to="/hr/leave"
            />
            <StatCard
              icon={GraduationCap}
              label="Open training"
              value={data?.trainingOpenCount ?? 0}
              detail="Courses open / planned"
              to="/hr/training"
            />
          </section>

          <section className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-1">
              <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold text-[#1f1f1f]">
                  <AlertTriangle size={18} className="text-amber-600" /> Alerts
                </h2>
              </div>
              {alerts.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No active HR alerts.</p>
              ) : (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {alerts.map((alert, idx) => (
                    <li key={idx} className="px-5 py-3 text-sm text-[#1f1f1f]">
                      {typeof alert === 'string' ? alert : alert.message || alert.title || 'Alert'}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Critical vacancies</h2>
                <Link to="/hr/vacancies" className="text-sm font-semibold text-[#e41e1f] hover:underline">
                  Manage vacancies
                </Link>
              </div>
              {critical.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No critical vacancies flagged.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Post</th>
                        <th className="px-5 py-3 font-semibold">Department</th>
                        <th className="px-5 py-3 font-semibold">Filled / approved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8b8b8b]/25">
                      {critical.map((v) => (
                        <tr key={v.id || v._id || v.title}>
                          <td className="px-5 py-3 font-medium text-[#1f1f1f]">{v.title}</td>
                          <td className="px-5 py-3 text-[#8b8b8b]">
                            {v.department}
                            {v.specialty ? ` · ${v.specialty}` : ''}
                          </td>
                          <td className="px-5 py-3">
                            {v.postsFilled ?? 0}/{v.postsApproved ?? 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
            <div className="flex items-center justify-between border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="flex items-center gap-2 font-bold text-[#1f1f1f]">
                <UserPlus size={18} className="text-[#e41e1f]" /> Recent applicants
              </h2>
              <Link to="/hr/recruitment" className="text-sm font-semibold text-[#e41e1f] hover:underline">
                Open recruitment
              </Link>
            </div>
            {applicants.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#8b8b8b]">No recent applicants.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Applicant</th>
                      <th className="px-5 py-3 font-semibold">Post</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8b8b8b]/25">
                    {applicants.map((a) => (
                      <tr key={a.id || a._id || a.email}>
                        <td className="px-5 py-3">
                          <p className="font-medium text-[#1f1f1f]">{personName(a)}</p>
                          <p className="text-xs text-[#8b8b8b]">{a.email}</p>
                        </td>
                        <td className="px-5 py-3 text-[#8b8b8b]">{a.appliedPost || a.post || '—'}</td>
                        <td className="px-5 py-3">
                          <span className="rounded-md bg-[#f8f8f8] px-2 py-0.5 text-xs font-semibold text-[#e41e1f]">
                            {a.status || 'APPLIED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/hr/recruitment', label: 'Recruitment & onboarding' },
              { to: '/hr/employees', label: 'Employee records' },
              { to: '/hr/leave', label: 'Leave requests' },
              { to: '/hr/training', label: 'Training & CPD' },
              { to: '/hr/pmds', label: 'PMDS & performance' },
              { to: '/hr/reports', label: 'HR reports' },
              { to: '/hr/doctors', label: 'Clinician credentialing' },
              { to: '/hr/staffing', label: 'Staffing snapshot' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-xl border border-[#8b8b8b]/30 bg-[#ffffff] px-4 py-3 text-sm font-semibold text-[#e41e1f] shadow-sm hover:border-[#8b8b8b]/40"
              >
                {link.label}
              </Link>
            ))}
          </section>
        </>
      )}
    </HrLayout>
  );
}

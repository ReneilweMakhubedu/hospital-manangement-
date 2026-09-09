import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileBarChart2,
  LoaderCircle,
  RefreshCw,
  Timer,
  TrendingDown,
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

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8f8f8] text-[#e41e1f]">
        <Icon size={18} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">{value}</p>
      {detail && <p className="mt-1 text-sm text-[#8b8b8b]">{detail}</p>}
    </div>
  );
}

export default function HrReports() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/hr/reports/summary', { navigate });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Unable to load HR reports');
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

  const breakdown = Array.isArray(data?.departmentBreakdown)
    ? data.departmentBreakdown
    : Array.isArray(data?.departments)
      ? data.departments
      : [];

  return (
    <HrLayout
      title="HR reports & analytics"
      subtitle="Turnover, time-to-fill, vacancy rate, PMDS compliance, and department breakdown."
      actions={
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] hover:border-[#8b8b8b]/40"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <StatusBanner status={status} />

      {loading && !data ? (
        <div className="flex justify-center py-16 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={28} />
        </div>
      ) : (
        <>
          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={TrendingDown}
              label="Turnover"
              value={
                data?.turnoverHintPercent != null
                  ? `${data.turnoverHintPercent}%`
                  : data?.turnoverPercent != null
                    ? `${data.turnoverPercent}%`
                    : '—'
              }
              detail="Hint from resigned / headcount"
            />
            <StatCard
              icon={Timer}
              label="Avg time-to-fill"
              value={
                data?.avgTimeToFillDays != null || data?.timeToFillAvg != null
                  ? `${data?.avgTimeToFillDays ?? data?.timeToFillAvg} days`
                  : '—'
              }
            />
            <StatCard
              icon={Users}
              label="Vacancy rate"
              value={data?.vacancyRate != null ? `${data.vacancyRate}%` : '—'}
            />
            <StatCard
              icon={FileBarChart2}
              label="PMDS compliance"
              value={
                data?.pmdsCompliance != null || data?.pmdsCompliancePercent != null
                  ? `${data?.pmdsCompliance ?? data?.pmdsCompliancePercent}%`
                  : '—'
              }
            />
            <StatCard
              icon={FileBarChart2}
              label="Leave utilisation"
              value={data?.leaveUtilizationHint || data?.leaveUtilisationHint || '—'}
            />
            <StatCard
              icon={FileBarChart2}
              label="Training completion"
              value={data?.trainingCompletionHint || '—'}
            />
            <StatCard
              icon={Users}
              label="Retirement risk"
              value={data?.retirementRiskCount ?? 0}
              detail="Age ≥60 or long service"
            />
            <StatCard
              icon={Users}
              label="Morale score"
              value={
                data?.moraleScore != null ? Number(data.moraleScore).toFixed(1) : '—'
              }
              detail="Latest pulse"
            />
          </section>

          <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
            <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="font-bold text-[#1f1f1f]">Department breakdown</h2>
            </div>
            {breakdown.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#8b8b8b]">
                No department breakdown available.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Department</th>
                      <th className="px-5 py-3 font-semibold">Headcount</th>
                      <th className="px-5 py-3 font-semibold">Vacancies / gap</th>
                      <th className="px-5 py-3 font-semibold">On leave</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8b8b8b]/25">
                    {breakdown.map((row) => (
                      <tr key={row.department || row.name}>
                        <td className="px-5 py-3 font-medium text-[#1f1f1f]">
                          {row.department || row.name || 'Unspecified'}
                        </td>
                        <td className="px-5 py-3">
                          {row.headcount ?? row.employees ?? row.count ?? 0}
                        </td>
                        <td className="px-5 py-3">
                          {row.vacancyGap ?? row.vacancies ?? row.gap ?? '—'}
                        </td>
                        <td className="px-5 py-3">{row.onLeave ?? row.leaveCount ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="flex flex-wrap gap-3">
            <Link
              to="/reporting"
              className="rounded-xl border border-[#8b8b8b]/30 bg-[#ffffff] px-4 py-3 text-sm font-semibold text-[#e41e1f] shadow-sm hover:border-[#8b8b8b]/40"
            >
              DHIS2 / reporting exports
            </Link>
            <Link
              to="/monitoring"
              className="rounded-xl border border-[#8b8b8b]/30 bg-[#ffffff] px-4 py-3 text-sm font-semibold text-[#e41e1f] shadow-sm hover:border-[#8b8b8b]/40"
            >
              M&amp;E KPI dashboard
            </Link>
            <Link
              to="/hr"
              className="rounded-xl border border-[#8b8b8b]/30 bg-[#ffffff] px-4 py-3 text-sm font-semibold text-[#e41e1f] shadow-sm hover:border-[#8b8b8b]/40"
            >
              Back to HR dashboard
            </Link>
          </section>
        </>
      )}
    </HrLayout>
  );
}

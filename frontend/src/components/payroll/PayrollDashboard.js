import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardList,
  LoaderCircle,
  RefreshCw,
  UserX,
  Users,
  Wallet,
} from 'lucide-react';

import { apiFetch } from '../../auth';
import PayrollLayout from './PayrollLayout';

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(n);
}

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

export default function PayrollDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/payroll/dashboard', { navigate });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Unable to load payroll dashboard');
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
  const costByDepartment = Array.isArray(data?.costByDepartment) ? data.costByDepartment : [];
  const recentGhostCases = Array.isArray(data?.recentGhostCases) ? data.recentGhostCases : [];
  const recentTimesheets = Array.isArray(data?.recentTimesheets) ? data.recentTimesheets : [];

  return (
    <PayrollLayout
      title="Payroll control dashboard"
      subtitle="Staff cost vs budget, FTE fill, overtime, ghost-worker cases, and certification risk."
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
          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={Wallet}
              label="Staff cost vs budget"
              value={formatMoney(data?.totalStaffCost)}
              detail={`Budget ${formatMoney(data?.payrollBudget)} · variance ${
                data?.budgetVariancePercent != null ? `${data.budgetVariancePercent}%` : '—'
              }`}
              to="/payroll/costs"
            />
            <StatCard
              icon={Users}
              label="FTE filled / approved"
              value={`${data?.fteFilled ?? 0} / ${data?.fteApproved ?? 0}`}
              detail={`Vacancy rate ${data?.vacancyRate ?? 0}%`}
              to="/payroll/costs"
              accent="bg-[#f8f8f8] text-[#e41e1f]"
            />
            <StatCard
              icon={ClipboardList}
              label="Overtime cost"
              value={formatMoney(data?.overtimeCost)}
              detail={`${data?.overtimeHours ?? 0} OT hours`}
              to="/payroll/timesheets"
            />
            <StatCard
              icon={AlertTriangle}
              label="Vacancy rate"
              value={`${data?.vacancyRate ?? 0}%`}
              detail="Approved posts unfilled"
              accent="bg-[#f8f8f8] text-[#8b8b8b]"
            />
            <StatCard
              icon={UserX}
              label="Ghost cases open"
              value={data?.ghostCasesOpen ?? 0}
              detail={`At risk ${formatMoney(data?.ghostAmountAtRisk)}`}
              to="/payroll/ghost-cases"
              accent="bg-[#f8f8f8] text-[#e41e1f]"
            />
            <StatCard
              icon={BadgeCheck}
              label="Certs expiring"
              value={data?.certificationsExpiring ?? 0}
              detail="Next 90 days"
              to="/payroll/compliance"
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
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No active payroll alerts.</p>
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
                <h2 className="font-bold text-[#1f1f1f]">Department cost breakdown</h2>
                <Link to="/payroll/costs" className="text-sm font-semibold text-[#e41e1f] hover:underline">
                  Open costs
                </Link>
              </div>
              {costByDepartment.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No department cost data.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Department</th>
                        <th className="px-5 py-3 font-semibold">Budget</th>
                        <th className="px-5 py-3 font-semibold">Actual</th>
                        <th className="px-5 py-3 font-semibold">FTE</th>
                        <th className="px-5 py-3 font-semibold">Overtime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8b8b8b]/25">
                      {costByDepartment.map((row) => (
                        <tr key={row.department || row.code || row.name}>
                          <td className="px-5 py-3 font-medium text-[#1f1f1f]">
                            {row.department || row.name || row.code || '—'}
                          </td>
                          <td className="px-5 py-3">
                            {formatMoney(row.budgetAnnual ?? row.budget ?? row.budgetAmount)}
                          </td>
                          <td className="px-5 py-3">
                            {formatMoney(row.actualYtd ?? row.actual ?? row.actualAmount)}
                          </td>
                          <td className="px-5 py-3 text-[#8b8b8b]">
                            {row.fteFilled ?? 0}/{row.fteApproved ?? 0}
                          </td>
                          <td className="px-5 py-3">{formatMoney(row.overtimeYtd ?? row.overtime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="mb-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="flex items-center justify-between border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Recent ghost cases</h2>
                <Link
                  to="/payroll/ghost-cases"
                  className="text-sm font-semibold text-[#e41e1f] hover:underline"
                >
                  Manage cases
                </Link>
              </div>
              {recentGhostCases.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No recent ghost-worker cases.</p>
              ) : (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {recentGhostCases.map((c) => (
                    <li
                      key={c.id || c.referenceNumber}
                      className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                    >
                      <div>
                        <p className="font-medium text-[#1f1f1f]">
                          {c.employeeName || c.referenceNumber || 'Case'}
                        </p>
                        <p className="text-xs text-[#8b8b8b]">
                          {c.referenceNumber || '—'} · {c.department || '—'} · {c.status || 'FLAGGED'}
                        </p>
                      </div>
                      <p className="font-semibold text-[#e41e1f]">{formatMoney(c.amountAtRisk)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="flex items-center justify-between border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Recent timesheets</h2>
                <Link
                  to="/payroll/timesheets"
                  className="text-sm font-semibold text-[#e41e1f] hover:underline"
                >
                  Open timesheets
                </Link>
              </div>
              {recentTimesheets.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No recent timesheets.</p>
              ) : (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {recentTimesheets.map((t) => (
                    <li
                      key={t.id || `${t.employeeNumber}-${t.workDate}`}
                      className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                    >
                      <div>
                        <p className="font-medium text-[#1f1f1f]">
                          {t.employeeName || t.employeeNumber || 'Timesheet'}
                        </p>
                        <p className="text-xs text-[#8b8b8b]">
                          {t.workDate || '—'} · {t.shiftType || '—'} · {t.status || 'DRAFT'}
                        </p>
                      </div>
                      <p className="font-semibold text-[#e41e1f]">
                        {t.hoursWorked ?? 0}h
                        {Number(t.overtimeHours) > 0 ? ` +${t.overtimeHours} OT` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {data?.openPeriod && (
            <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#f8f8f8]/60 px-5 py-4 text-sm text-[#1f1f1f]">
              <span className="font-semibold">Open period:</span>{' '}
              {data.openPeriod.periodLabel || data.openPeriod.label || '—'}
              {data.openPeriod.status ? ` · ${data.openPeriod.status}` : ''}
              {data.openPeriod.budgetAmount != null
                ? ` · budget ${formatMoney(data.openPeriod.budgetAmount)}`
                : ''}
            </section>
          )}

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/payroll/costs', label: 'Cost & budget' },
              { to: '/payroll/timesheets', label: 'Time & attendance' },
              { to: '/payroll/ghost-cases', label: 'Ghost worker cases' },
              { to: '/payroll/compliance', label: 'Compliance & certs' },
              { to: '/payroll/audit', label: 'Audit trail' },
              { to: '/payroll/reports', label: 'Reports' },
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
    </PayrollLayout>
  );
}

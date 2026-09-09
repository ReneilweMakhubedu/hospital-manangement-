import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  ClipboardList,
  FileBarChart2,
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

export default function PayrollReports() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/payroll/reports/summary', { navigate });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Unable to load payroll reports');
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

  const departments = Array.isArray(data?.costByDepartment)
    ? data.costByDepartment
    : Array.isArray(data?.departments)
      ? data.departments
      : Array.isArray(data?.departmentBreakdown)
        ? data.departmentBreakdown
        : [];

  return (
    <PayrollLayout
      title="Payroll reports"
      subtitle="Cost control, overtime, FTE, ghost-worker exposure, and compliance analytics."
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
              icon={Wallet}
              label="Staff cost"
              value={formatMoney(data?.totalStaffCost ?? data?.actualTotal ?? data?.staffCost)}
              detail={`Budget ${formatMoney(data?.payrollBudget ?? data?.budgetTotal)}`}
            />
            <StatCard
              icon={FileBarChart2}
              label="Budget variance"
              value={
                data?.budgetVariancePercent != null
                  ? `${data.budgetVariancePercent}%`
                  : data?.variancePercent != null
                    ? `${data.variancePercent}%`
                    : formatMoney(data?.budgetVariance)
              }
              detail={formatMoney(data?.budgetVariance)}
            />
            <StatCard
              icon={Users}
              label="FTE fill"
              value={`${data?.fteFilled ?? 0} / ${data?.fteApproved ?? 0}`}
              detail={`Vacancy ${data?.vacancyRate ?? 0}%`}
            />
            <StatCard
              icon={ClipboardList}
              label="Overtime"
              value={formatMoney(data?.overtimeCost)}
              detail={`${data?.overtimeHours ?? 0} hours`}
            />
            <StatCard
              icon={UserX}
              label="Ghost cases open"
              value={data?.ghostCasesOpen ?? data?.openGhostCases ?? 0}
              detail={`At risk ${formatMoney(data?.ghostAmountAtRisk)}`}
            />
            <StatCard
              icon={BadgeCheck}
              label="Certs expiring"
              value={data?.certificationsExpiring ?? data?.expiringCerts ?? 0}
              detail="Monitoring window"
            />
            <StatCard
              icon={ClipboardList}
              label="Timesheets pending"
              value={data?.timesheetsPending ?? data?.pendingTimesheets ?? 0}
            />
            <StatCard
              icon={FileBarChart2}
              label="Periods closed"
              value={data?.periodsClosed ?? data?.closedPeriods ?? '—'}
            />
          </section>

          {departments.length > 0 && (
            <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Department cost summary</h2>
              </div>
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
                    {departments.map((row) => (
                      <tr key={row.department || row.code || row.name}>
                        <td className="px-5 py-3 font-medium">
                          {row.department || row.name || row.code || '—'}
                        </td>
                        <td className="px-5 py-3">
                          {formatMoney(row.budgetAnnual ?? row.budget ?? row.budgetAmount)}
                        </td>
                        <td className="px-5 py-3">
                          {formatMoney(row.actualYtd ?? row.actual ?? row.actualAmount)}
                        </td>
                        <td className="px-5 py-3">
                          {row.fteFilled ?? 0}/{row.fteApproved ?? 0}
                        </td>
                        <td className="px-5 py-3">
                          {formatMoney(row.overtimeYtd ?? row.overtime ?? row.overtimeAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </PayrollLayout>
  );
}

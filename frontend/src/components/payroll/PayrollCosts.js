import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Plus, RefreshCw } from 'lucide-react';

import { apiFetch } from '../../auth';
import PayrollLayout from './PayrollLayout';

const PERIOD_STATUSES = ['OPEN', 'PROCESSING', 'CLOSED', 'PAID'];

const emptyPeriod = {
  periodLabel: '',
  startDate: '',
  endDate: '',
  status: 'OPEN',
  budgetAmount: '',
  actualAmount: '',
  overtimeAmount: '',
};

const emptyCentre = {
  code: '',
  department: '',
  budgetAnnual: '',
  actualYtd: '',
  fteApproved: '',
  fteFilled: '',
  overtimeYtd: '',
};

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

export default function PayrollCosts() {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState([]);
  const [centres, setCentres] = useState([]);
  const [periodForm, setPeriodForm] = useState(emptyPeriod);
  const [centreForm, setCentreForm] = useState(emptyCentre);
  const [editingPeriodId, setEditingPeriodId] = useState(null);
  const [editingCentreId, setEditingCentreId] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [periodsRes, centresRes] = await Promise.all([
        apiFetch('/payroll/periods', { navigate }),
        apiFetch('/payroll/cost-centres', { navigate }),
      ]);
      const [periodsData, centresData] = await Promise.all([
        periodsRes.json().catch(() => []),
        centresRes.json().catch(() => []),
      ]);
      if (!periodsRes.ok) throw new Error(periodsData.error || 'Unable to load payroll periods');
      if (!centresRes.ok) throw new Error(centresData.error || 'Unable to load cost centres');
      setPeriods(Array.isArray(periodsData) ? periodsData : periodsData.periods || []);
      setCentres(Array.isArray(centresData) ? centresData : centresData.costCentres || []);
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

  const submitPeriod = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        periodLabel: periodForm.periodLabel.trim(),
        startDate: periodForm.startDate || null,
        endDate: periodForm.endDate || null,
        status: periodForm.status,
        budgetAmount: Number(periodForm.budgetAmount || 0),
        actualAmount: Number(periodForm.actualAmount || 0),
        overtimeAmount: Number(periodForm.overtimeAmount || 0),
      };
      const path = editingPeriodId
        ? `/payroll/periods/${editingPeriodId}`
        : '/payroll/periods';
      const res = await apiFetch(path, {
        navigate,
        method: editingPeriodId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save period');
      setPeriodForm(emptyPeriod);
      setEditingPeriodId(null);
      setStatus({
        type: 'success',
        message: editingPeriodId ? 'Period updated.' : 'Period created.',
      });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const submitCentre = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        code: centreForm.code.trim(),
        department: centreForm.department.trim(),
        budgetAnnual: Number(centreForm.budgetAnnual || 0),
        actualYtd: Number(centreForm.actualYtd || 0),
        fteApproved: Number(centreForm.fteApproved || 0),
        fteFilled: Number(centreForm.fteFilled || 0),
        overtimeYtd: Number(centreForm.overtimeYtd || 0),
      };
      const path = editingCentreId
        ? `/payroll/cost-centres/${editingCentreId}`
        : '/payroll/cost-centres';
      const res = await apiFetch(path, {
        navigate,
        method: editingCentreId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save cost centre');
      setCentreForm(emptyCentre);
      setEditingCentreId(null);
      setStatus({
        type: 'success',
        message: editingCentreId ? 'Cost centre updated.' : 'Cost centre created.',
      });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const editPeriod = (row) => {
    setEditingPeriodId(row.id || row._id);
    setPeriodForm({
      periodLabel: row.periodLabel || '',
      startDate: row.startDate ? String(row.startDate).slice(0, 10) : '',
      endDate: row.endDate ? String(row.endDate).slice(0, 10) : '',
      status: row.status || 'OPEN',
      budgetAmount: row.budgetAmount ?? '',
      actualAmount: row.actualAmount ?? '',
      overtimeAmount: row.overtimeAmount ?? '',
    });
  };

  const editCentre = (row) => {
    setEditingCentreId(row.id || row._id);
    setCentreForm({
      code: row.code || '',
      department: row.department || '',
      budgetAnnual: row.budgetAnnual ?? '',
      actualYtd: row.actualYtd ?? '',
      fteApproved: row.fteApproved ?? '',
      fteFilled: row.fteFilled ?? '',
      overtimeYtd: row.overtimeYtd ?? '',
    });
  };

  return (
    <PayrollLayout
      title="Cost & budget"
      subtitle="Payroll periods and department cost centres — budget vs actual, FTE, and overtime."
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

      {loading ? (
        <div className="flex justify-center py-20 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={28} />
        </div>
      ) : (
        <>
          <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
            <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="font-bold text-[#1f1f1f]">Department cost centres</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Code</th>
                    <th className="px-5 py-3 font-semibold">Department</th>
                    <th className="px-5 py-3 font-semibold">Budget</th>
                    <th className="px-5 py-3 font-semibold">Actual YTD</th>
                    <th className="px-5 py-3 font-semibold">FTE</th>
                    <th className="px-5 py-3 font-semibold">Overtime YTD</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8b8b8b]/25">
                  {centres.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-[#8b8b8b]">
                        No cost centres recorded.
                      </td>
                    </tr>
                  ) : (
                    centres.map((row) => (
                      <tr key={row.id || row.code}>
                        <td className="px-5 py-3 font-medium">{row.code || '—'}</td>
                        <td className="px-5 py-3">{row.department || '—'}</td>
                        <td className="px-5 py-3">{formatMoney(row.budgetAnnual)}</td>
                        <td className="px-5 py-3">{formatMoney(row.actualYtd)}</td>
                        <td className="px-5 py-3">
                          {row.fteFilled ?? 0}/{row.fteApproved ?? 0}
                        </td>
                        <td className="px-5 py-3">{formatMoney(row.overtimeYtd)}</td>
                        <td className="px-5 py-3">
                          <button
                            type="button"
                            onClick={() => editCentre(row)}
                            className="text-sm font-semibold text-[#e41e1f] hover:underline"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <Plus size={18} className="text-[#e41e1f]" />
                {editingCentreId ? 'Update cost centre' : 'Add cost centre'}
              </h2>
              <form onSubmit={submitCentre} className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Code
                  <input
                    required
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={centreForm.code}
                    onChange={(e) => setCentreForm({ ...centreForm, code: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Department
                  <input
                    required
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={centreForm.department}
                    onChange={(e) => setCentreForm({ ...centreForm, department: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Budget annual
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={centreForm.budgetAnnual}
                    onChange={(e) => setCentreForm({ ...centreForm, budgetAnnual: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Actual YTD
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={centreForm.actualYtd}
                    onChange={(e) => setCentreForm({ ...centreForm, actualYtd: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  FTE approved
                  <input
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={centreForm.fteApproved}
                    onChange={(e) => setCentreForm({ ...centreForm, fteApproved: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  FTE filled
                  <input
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={centreForm.fteFilled}
                    onChange={(e) => setCentreForm({ ...centreForm, fteFilled: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2">
                  Overtime YTD
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={centreForm.overtimeYtd}
                    onChange={(e) => setCentreForm({ ...centreForm, overtimeYtd: e.target.value })}
                  />
                </label>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : editingCentreId ? 'Update centre' : 'Create centre'}
                  </button>
                  {editingCentreId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCentreId(null);
                        setCentreForm(emptyCentre);
                      }}
                      className="rounded-lg border border-[#8b8b8b]/40 px-4 py-2.5 text-sm font-semibold text-[#1f1f1f]"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <Plus size={18} className="text-[#e41e1f]" />
                {editingPeriodId ? 'Update period' : 'Add payroll period'}
              </h2>
              <form onSubmit={submitPeriod} className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2">
                  Period label
                  <input
                    required
                    placeholder="e.g. 2026-03"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={periodForm.periodLabel}
                    onChange={(e) => setPeriodForm({ ...periodForm, periodLabel: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Start date
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={periodForm.startDate}
                    onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  End date
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={periodForm.endDate}
                    onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Status
                  <select
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={periodForm.status}
                    onChange={(e) => setPeriodForm({ ...periodForm, status: e.target.value })}
                  >
                    {PERIOD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Budget
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={periodForm.budgetAmount}
                    onChange={(e) => setPeriodForm({ ...periodForm, budgetAmount: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Actual
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={periodForm.actualAmount}
                    onChange={(e) => setPeriodForm({ ...periodForm, actualAmount: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Overtime
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={periodForm.overtimeAmount}
                    onChange={(e) =>
                      setPeriodForm({ ...periodForm, overtimeAmount: e.target.value })
                    }
                  />
                </label>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : editingPeriodId ? 'Update period' : 'Create period'}
                  </button>
                  {editingPeriodId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPeriodId(null);
                        setPeriodForm(emptyPeriod);
                      }}
                      className="rounded-lg border border-[#8b8b8b]/40 px-4 py-2.5 text-sm font-semibold text-[#1f1f1f]"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>
          </div>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
            <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="font-bold text-[#1f1f1f]">Payroll periods</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Period</th>
                    <th className="px-5 py-3 font-semibold">Dates</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Budget</th>
                    <th className="px-5 py-3 font-semibold">Actual</th>
                    <th className="px-5 py-3 font-semibold">Overtime</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8b8b8b]/25">
                  {periods.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-[#8b8b8b]">
                        No payroll periods recorded.
                      </td>
                    </tr>
                  ) : (
                    periods.map((row) => (
                      <tr key={row.id || row.periodLabel}>
                        <td className="px-5 py-3 font-medium">{row.periodLabel || '—'}</td>
                        <td className="px-5 py-3 text-[#8b8b8b]">
                          {row.startDate || '—'} → {row.endDate || '—'}
                        </td>
                        <td className="px-5 py-3">
                          <span className="rounded-full bg-[#f8f8f8] px-2.5 py-1 text-xs font-semibold text-[#e41e1f]">
                            {row.status || 'OPEN'}
                          </span>
                        </td>
                        <td className="px-5 py-3">{formatMoney(row.budgetAmount)}</td>
                        <td className="px-5 py-3">{formatMoney(row.actualAmount)}</td>
                        <td className="px-5 py-3">{formatMoney(row.overtimeAmount)}</td>
                        <td className="px-5 py-3">
                          <button
                            type="button"
                            onClick={() => editPeriod(row)}
                            className="text-sm font-semibold text-[#e41e1f] hover:underline"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </PayrollLayout>
  );
}

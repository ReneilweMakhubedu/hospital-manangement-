import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Plus, RefreshCw } from 'lucide-react';

import { apiFetch } from '../../auth';
import FinanceLayout from './FinanceLayout';

const emptyForm = {
  periodLabel: '',
  department: '',
  budgetAmount: '',
  forecastAmount: '',
  actualAmount: '',
  notes: '',
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

export default function FinanceBudget() {
  const navigate = useNavigate();
  const [forecasts, setForecasts] = useState([]);
  const [summary, setSummary] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fcRes, sumRes] = await Promise.all([
        apiFetch('/finance/budget/forecasts', { navigate }),
        apiFetch('/finance/budget/summary', { navigate }),
      ]);
      const [fcData, sumData] = await Promise.all([
        fcRes.json().catch(() => []),
        sumRes.json().catch(() => []),
      ]);
      if (!fcRes.ok) throw new Error(fcData.error || 'Unable to load forecasts');
      setForecasts(Array.isArray(fcData) ? fcData : fcData.forecasts || []);
      const rows = Array.isArray(sumData) ? sumData : sumData.departments || sumData.rows || [];
      setSummary(rows);
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

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        periodLabel: form.periodLabel.trim(),
        department: form.department.trim(),
        budgetAmount: Number(form.budgetAmount),
        forecastAmount: Number(form.forecastAmount),
        actualAmount: Number(form.actualAmount || 0),
        notes: form.notes.trim() || null,
      };
      const path = editingId
        ? `/finance/budget/forecasts/${editingId}`
        : '/finance/budget/forecasts';
      const res = await apiFetch(path, {
        navigate,
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save forecast');
      setForm(emptyForm);
      setEditingId(null);
      setStatus({
        type: 'success',
        message: editingId ? 'Forecast updated.' : 'Forecast recorded.',
      });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <FinanceLayout
      title="Budgeting"
      subtitle="Departmental budget forecasts, actuals, and variance tracking."
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
          {summary.length > 0 && (
            <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Department variance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Department</th>
                      <th className="px-5 py-3 font-semibold">Budget</th>
                      <th className="px-5 py-3 font-semibold">Forecast</th>
                      <th className="px-5 py-3 font-semibold">Actual</th>
                      <th className="px-5 py-3 font-semibold">Variance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8b8b8b]/25">
                    {summary.map((row) => (
                      <tr key={row.department || row.periodLabel}>
                        <td className="px-5 py-3 font-medium">{row.department || '—'}</td>
                        <td className="px-5 py-3">{formatMoney(row.budgetAmount ?? row.budget)}</td>
                        <td className="px-5 py-3">{formatMoney(row.forecastAmount ?? row.forecast)}</td>
                        <td className="px-5 py-3">{formatMoney(row.actualAmount ?? row.actual)}</td>
                        <td className="px-5 py-3">{row.variancePercent ?? row.variance ?? 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-5">
            <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm lg:col-span-2">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <Plus size={18} className="text-[#e41e1f]" />
                {editingId ? 'Update forecast' : 'Add forecast'}
              </h2>
              <form onSubmit={submit} className="space-y-3">
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Period
                  <input
                    required
                    placeholder="e.g. 2026/27 Q1"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={form.periodLabel}
                    onChange={(e) => setForm({ ...form, periodLabel: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Department
                  <input
                    required
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Budget amount
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={form.budgetAmount}
                    onChange={(e) => setForm({ ...form, budgetAmount: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Forecast amount
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={form.forecastAmount}
                    onChange={(e) => setForm({ ...form, forecastAmount: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Actual amount
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={form.actualAmount}
                    onChange={(e) => setForm({ ...form, actualAmount: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Notes
                  <textarea
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : editingId ? 'Update' : 'Save forecast'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setForm(emptyForm);
                      }}
                      className="rounded-lg border border-[#8b8b8b]/40 px-4 py-2.5 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-3">
              <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold">Forecasts</h2>
              </div>
              {forecasts.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-[#8b8b8b]">No forecasts recorded.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Period</th>
                        <th className="px-5 py-3 font-semibold">Department</th>
                        <th className="px-5 py-3 font-semibold">Budget</th>
                        <th className="px-5 py-3 font-semibold">Forecast</th>
                        <th className="px-5 py-3 font-semibold">Actual</th>
                        <th className="px-5 py-3 font-semibold" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8b8b8b]/25">
                      {forecasts.map((f) => (
                        <tr key={f.id || f._id}>
                          <td className="px-5 py-3 font-medium">{f.periodLabel}</td>
                          <td className="px-5 py-3">{f.department}</td>
                          <td className="px-5 py-3">{formatMoney(f.budgetAmount)}</td>
                          <td className="px-5 py-3">{formatMoney(f.forecastAmount)}</td>
                          <td className="px-5 py-3">{formatMoney(f.actualAmount)}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(f.id || f._id);
                                setForm({
                                  periodLabel: f.periodLabel || '',
                                  department: f.department || '',
                                  budgetAmount:
                                    f.budgetAmount != null ? String(f.budgetAmount) : '',
                                  forecastAmount:
                                    f.forecastAmount != null ? String(f.forecastAmount) : '',
                                  actualAmount:
                                    f.actualAmount != null ? String(f.actualAmount) : '',
                                  notes: f.notes || '',
                                });
                              }}
                              className="text-sm font-semibold text-[#e41e1f] hover:underline"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </FinanceLayout>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Plus, RefreshCw, Wallet } from 'lucide-react';

import { apiFetch } from '../../auth';
import ProcurementLayout from './ProcurementLayout';

const emptyForm = {
  category: '',
  department: '',
  amount: '',
  periodLabel: '',
  budgetAmount: '',
  savingsAmount: '',
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

export default function ProcurementSpend() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resRecords, resSummary] = await Promise.all([
        apiFetch('/procurement/spend', { navigate }),
        apiFetch('/procurement/spend/summary', { navigate }),
      ]);
      const recordsJson = await resRecords.json().catch(() => []);
      const summaryJson = await resSummary.json().catch(() => ({}));
      if (!resRecords.ok) throw new Error(recordsJson.error || 'Unable to load spend records');
      if (!resSummary.ok) throw new Error(summaryJson.error || 'Unable to load spend summary');
      setRecords(Array.isArray(recordsJson) ? recordsJson : recordsJson.records || []);
      setSummary(summaryJson);
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
        category: form.category.trim(),
        department: form.department.trim(),
        amount: Number(form.amount || 0),
        periodLabel: form.periodLabel.trim(),
        budgetAmount: Number(form.budgetAmount || 0),
        savingsAmount: Number(form.savingsAmount || 0),
        notes: form.notes.trim() || null,
      };
      const res = await apiFetch('/procurement/spend', {
        navigate,
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save spend record');
      setForm(emptyForm);
      setStatus({ type: 'success', message: 'Spend record saved.' });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const byCategory = Array.isArray(summary?.byCategory)
    ? summary.byCategory
    : Array.isArray(summary?.categories)
      ? summary.categories
      : typeof summary?.byCategory === 'object' && summary?.byCategory
        ? Object.entries(summary.byCategory).map(([category, amount]) => ({
            category,
            amount: typeof amount === 'object' ? amount.amount ?? amount.total : amount,
            budget: typeof amount === 'object' ? amount.budget : undefined,
            savings: typeof amount === 'object' ? amount.savings : undefined,
          }))
        : [];

  const totalSpend =
    summary?.totalSpend ??
    summary?.totalAmount ??
    records.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalBudget =
    summary?.totalBudget ??
    summary?.budgetAmount ??
    records.reduce((sum, r) => sum + Number(r.budgetAmount || 0), 0);
  const totalSavings =
    summary?.totalSavings ??
    summary?.savingsAmount ??
    records.reduce((sum, r) => sum + Number(r.savingsAmount || 0), 0);

  return (
    <ProcurementLayout
      title="Spend & analytics"
      subtitle="Category spend, budget comparison, and procurement savings."
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

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8f8f8] text-[#e41e1f]">
            <Wallet size={18} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">Total spend</p>
          <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">{formatMoney(totalSpend)}</p>
        </div>
        <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">Budget</p>
          <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">{formatMoney(totalBudget)}</p>
        </div>
        <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">Savings</p>
          <p className="mt-1 text-2xl font-bold text-[#e41e1f]">{formatMoney(totalSavings)}</p>
        </div>
      </section>

      {byCategory.length > 0 && (
        <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-[#1f1f1f]">Spend by category</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {byCategory.map((row) => {
              const amount = Number(row.amount ?? row.total ?? 0);
              const budget = Number(row.budget ?? row.budgetAmount ?? totalBudget) || 1;
              const pct = budget > 0 ? Math.min(100, Math.round((amount / budget) * 100)) : 0;
              return (
                <div
                  key={row.category || row.name}
                  className="rounded-xl border border-[#8b8b8b]/20 bg-[#f8f8f8] p-4"
                >
                  <p className="text-sm font-semibold text-[#1f1f1f]">
                    {row.category || row.name || '—'}
                  </p>
                  <p className="mt-1 text-lg font-bold text-[#e41e1f]">{formatMoney(amount)}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-[#e41e1f]" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-[#8b8b8b]">{pct}% of budget reference</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1f1f1f]">
          <Plus size={18} className="text-[#e41e1f]" />
          Record spend
        </h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Category
            <input
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
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
            Period
            <input
              required
              placeholder="e.g. 2026-Q1"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.periodLabel}
              onChange={(e) => setForm({ ...form, periodLabel: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Amount (ZAR)
            <input
              type="number"
              min="0"
              step="0.01"
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Budget (ZAR)
            <input
              type="number"
              min="0"
              step="0.01"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.budgetAmount}
              onChange={(e) => setForm({ ...form, budgetAmount: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Savings (ZAR)
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.savingsAmount}
              onChange={(e) => setForm({ ...form, savingsAmount: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2 lg:col-span-3">
            Notes
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save spend record'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
          <h2 className="font-bold text-[#1f1f1f]">Spend records</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-16 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={28} />
          </div>
        ) : records.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[#8b8b8b]">No spend records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Period</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Budget</th>
                  <th className="px-5 py-3 font-semibold">Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25">
                {records.map((row) => (
                  <tr key={row.id || `${row.category}-${row.periodLabel}`}>
                    <td className="px-5 py-3 font-medium text-[#1f1f1f]">{row.category}</td>
                    <td className="px-5 py-3">{row.department || '—'}</td>
                    <td className="px-5 py-3">{row.periodLabel || '—'}</td>
                    <td className="px-5 py-3">{formatMoney(row.amount)}</td>
                    <td className="px-5 py-3">{formatMoney(row.budgetAmount)}</td>
                    <td className="px-5 py-3 text-[#e41e1f]">{formatMoney(row.savingsAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </ProcurementLayout>
  );
}

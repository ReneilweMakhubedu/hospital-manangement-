import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Plus, RefreshCw } from 'lucide-react';

import { apiFetch } from '../../auth';
import FinanceLayout from './FinanceLayout';

const CATEGORIES = ['IRREGULAR', 'FRUITLESS', 'WASTEFUL'];
const STATUSES = ['OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'WRITTEN_OFF'];

const emptyForm = {
  referenceNumber: '',
  category: 'IRREGULAR',
  amount: '',
  description: '',
  department: '',
  status: 'OPEN',
  reportedDate: '',
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

export default function FinanceIrregular() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        apiFetch('/finance/irregular', { navigate }),
        apiFetch('/finance/irregular/summary', { navigate }),
      ]);
      const [listData, sumData] = await Promise.all([
        listRes.json().catch(() => []),
        sumRes.json().catch(() => ({})),
      ]);
      if (!listRes.ok) throw new Error(listData.error || 'Unable to load irregular expenditure');
      setItems(Array.isArray(listData) ? listData : listData.items || listData.records || []);
      if (sumRes.ok) setSummary(sumData);
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
        referenceNumber: form.referenceNumber.trim() || null,
        category: form.category,
        amount: Number(form.amount),
        description: form.description.trim(),
        department: form.department.trim() || null,
        status: form.status,
        reportedDate: form.reportedDate || null,
      };
      const path = editingId ? `/finance/irregular/${editingId}` : '/finance/irregular';
      const res = await apiFetch(path, {
        navigate,
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save record');
      setForm(emptyForm);
      setEditingId(null);
      setStatus({
        type: 'success',
        message: editingId ? 'Record updated.' : 'Record logged.',
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
      title="Irregular expenditure"
      subtitle="Track irregular, fruitless, and wasteful expenditure for PFMA reporting."
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

      {summary && (
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-[#8b8b8b]">Open irregular</p>
            <p className="mt-2 text-2xl font-bold text-[#1f1f1f]">
              {formatMoney(summary.irregularOpenAmount ?? summary.openIrregular)}
            </p>
          </div>
          <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-[#8b8b8b]">Open fruitless</p>
            <p className="mt-2 text-2xl font-bold text-[#e41e1f]">
              {formatMoney(summary.fruitlessOpenAmount ?? summary.openFruitless)}
            </p>
          </div>
          <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-[#8b8b8b]">Open cases</p>
            <p className="mt-2 text-2xl font-bold">
              {summary.openCount ?? summary.irregularOpenCount ?? '—'}
            </p>
          </div>
        </section>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={28} />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Plus size={18} className="text-[#e41e1f]" />
              {editingId ? 'Update record' : 'Log expenditure'}
            </h2>
            <form onSubmit={submit} className="space-y-3">
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Reference
                <input
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.referenceNumber}
                  onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Category
                <select
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Amount
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Department
                <input
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Description
                <textarea
                  required
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Reported date
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.reportedDate}
                  onChange={(e) => setForm({ ...form, reportedDate: e.target.value })}
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Status
                <select
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editingId ? 'Update' : 'Log record'}
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
              <h2 className="font-bold">Register</h2>
            </div>
            {items.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-[#8b8b8b]">No records logged.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Reference</th>
                      <th className="px-5 py-3 font-semibold">Category</th>
                      <th className="px-5 py-3 font-semibold">Amount</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8b8b8b]/25">
                    {items.map((item) => (
                      <tr key={item.id || item._id}>
                        <td className="px-5 py-3">
                          <p className="font-medium">{item.referenceNumber || '—'}</p>
                          <p className="text-xs text-[#8b8b8b]">{item.department || item.description}</p>
                        </td>
                        <td className="px-5 py-3">{item.category}</td>
                        <td className="px-5 py-3">{formatMoney(item.amount)}</td>
                        <td className="px-5 py-3">
                          <span className="rounded-md bg-[#f8f8f8] px-2 py-0.5 text-xs font-semibold text-[#1f1f1f]">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(item.id || item._id);
                              setForm({
                                referenceNumber: item.referenceNumber || '',
                                category: item.category || 'IRREGULAR',
                                amount: item.amount != null ? String(item.amount) : '',
                                description: item.description || '',
                                department: item.department || '',
                                status: item.status || 'OPEN',
                                reportedDate: item.reportedDate || '',
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
      )}
    </FinanceLayout>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, LoaderCircle, Plus, RefreshCw } from 'lucide-react';

import { apiFetch } from '../../auth';
import FinanceLayout from './FinanceLayout';

const ASSET_STATUSES = ['ACTIVE', 'DISPOSED', 'TRANSFER'];

const emptyForm = {
  assetTag: '',
  name: '',
  category: '',
  acquisitionDate: '',
  acquisitionCost: '',
  bookValue: '',
  status: 'ACTIVE',
  department: '',
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

export default function FinanceAccounting() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [assetRes, sumRes] = await Promise.all([
        apiFetch('/finance/accounting/assets', { navigate }),
        apiFetch('/finance/accounting/summary', { navigate }),
      ]);
      const [assetData, sumData] = await Promise.all([
        assetRes.json().catch(() => []),
        sumRes.json().catch(() => ({})),
      ]);
      if (!assetRes.ok) throw new Error(assetData.error || 'Unable to load fixed assets');
      setAssets(Array.isArray(assetData) ? assetData : assetData.assets || []);
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
        assetTag: form.assetTag.trim(),
        name: form.name.trim(),
        category: form.category.trim(),
        acquisitionDate: form.acquisitionDate || null,
        acquisitionCost: Number(form.acquisitionCost),
        bookValue: form.bookValue !== '' ? Number(form.bookValue) : Number(form.acquisitionCost),
        status: form.status,
        department: form.department.trim() || null,
      };
      const path = editingId
        ? `/finance/accounting/assets/${editingId}`
        : '/finance/accounting/assets';
      const res = await apiFetch(path, {
        navigate,
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save asset');
      setForm(emptyForm);
      setEditingId(null);
      setStatus({
        type: 'success',
        message: editingId ? 'Asset updated.' : 'Asset registered.',
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
      title="Accounting"
      subtitle="Fixed asset register and accounting summary. Cost centres are managed separately."
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

      <div className="mb-6 rounded-2xl border border-[#8b8b8b]/30 bg-[#f8f8f8] px-5 py-4 text-sm text-[#1f1f1f]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>
            <Landmark className="mr-2 inline h-4 w-4" />
            Cost centre commitments and actuals are maintained under Cost centres.
          </p>
          <Link
            to="/finance/cost-centres"
            className="font-semibold text-[#e41e1f] underline hover:text-[#e41e1f]"
          >
            Open cost centres
          </Link>
        </div>
      </div>

      {summary && (
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-[#8b8b8b]">Asset count</p>
            <p className="mt-2 text-2xl font-bold">
              {summary.assetCount ?? summary.activeCount ?? assets.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-[#8b8b8b]">Acquisition cost</p>
            <p className="mt-2 text-2xl font-bold text-[#1f1f1f]">
              {formatMoney(summary.acquisitionCostTotal ?? summary.totalAcquisitionCost)}
            </p>
          </div>
          <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-[#8b8b8b]">Book value</p>
            <p className="mt-2 text-2xl font-bold text-[#e41e1f]">
              {formatMoney(summary.bookValueTotal ?? summary.totalBookValue)}
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
              {editingId ? 'Update asset' : 'Register asset'}
            </h2>
            <form onSubmit={submit} className="space-y-3">
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Asset tag
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.assetTag}
                  onChange={(e) => setForm({ ...form, assetTag: e.target.value })}
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Name
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
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
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Acquisition date
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.acquisitionDate}
                  onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Cost
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={form.acquisitionCost}
                    onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Book value
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={form.bookValue}
                    onChange={(e) => setForm({ ...form, bookValue: e.target.value })}
                  />
                </label>
              </div>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Status
                <select
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {ASSET_STATUSES.map((s) => (
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
                  {saving ? 'Saving…' : editingId ? 'Update asset' : 'Save asset'}
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
              <h2 className="font-bold">Fixed assets</h2>
            </div>
            {assets.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-[#8b8b8b]">No fixed assets registered.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Tag</th>
                      <th className="px-5 py-3 font-semibold">Name</th>
                      <th className="px-5 py-3 font-semibold">Cost</th>
                      <th className="px-5 py-3 font-semibold">Book value</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8b8b8b]/25">
                    {assets.map((a) => (
                      <tr key={a.id || a._id}>
                        <td className="px-5 py-3 font-mono text-xs">{a.assetTag}</td>
                        <td className="px-5 py-3">
                          <p className="font-medium">{a.name}</p>
                          <p className="text-xs text-[#8b8b8b]">
                            {a.category}
                            {a.department ? ` · ${a.department}` : ''}
                          </p>
                        </td>
                        <td className="px-5 py-3">{formatMoney(a.acquisitionCost)}</td>
                        <td className="px-5 py-3">{formatMoney(a.bookValue)}</td>
                        <td className="px-5 py-3">
                          <span className="rounded-md bg-[#f8f8f8] px-2 py-0.5 text-xs font-semibold text-[#e41e1f]">
                            {a.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(a.id || a._id);
                              setForm({
                                assetTag: a.assetTag || '',
                                name: a.name || '',
                                category: a.category || '',
                                acquisitionDate: a.acquisitionDate || '',
                                acquisitionCost:
                                  a.acquisitionCost != null ? String(a.acquisitionCost) : '',
                                bookValue: a.bookValue != null ? String(a.bookValue) : '',
                                status: a.status || 'ACTIVE',
                                department: a.department || '',
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

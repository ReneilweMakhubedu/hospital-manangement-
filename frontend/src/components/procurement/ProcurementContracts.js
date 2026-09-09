import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Plus, RefreshCw } from 'lucide-react';

import { apiFetch } from '../../auth';
import ProcurementLayout from './ProcurementLayout';

const STATUSES = [
  'DRAFT',
  'ACTIVE',
  'MILESTONE_PENDING',
  'COMPLETED',
  'TERMINATED',
  'EXPIRED',
];

const emptyForm = {
  referenceNumber: '',
  tenderId: '',
  vendorId: '',
  vendorName: '',
  title: '',
  value: '',
  startDate: '',
  endDate: '',
  status: 'DRAFT',
  milestoneCount: '4',
  milestonesCompleted: '0',
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

function statusStyle(s) {
  const key = (s || '').toUpperCase();
  if (key === 'COMPLETED' || key === 'ACTIVE') return 'bg-[#f8f8f8] text-[#e41e1f]';
  if (key === 'TERMINATED' || key === 'EXPIRED') return 'bg-[#f8f8f8] text-[#e41e1f]';
  if (key === 'MILESTONE_PENDING') return 'bg-[#f8f8f8] text-[#1f1f1f]';
  return 'bg-[#f5f5f5] text-[#1f1f1f]';
}

export default function ProcurementContracts() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/procurement/contracts', { navigate });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'Unable to load contracts');
      setContracts(Array.isArray(data) ? data : data.contracts || []);
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
        tenderId: form.tenderId ? Number(form.tenderId) : null,
        vendorId: Number(form.vendorId),
        vendorName: form.vendorName.trim(),
        title: form.title.trim(),
        value: Number(form.value || 0),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        status: form.status,
        milestoneCount: Number(form.milestoneCount || 0),
        milestonesCompleted: Number(form.milestonesCompleted || 0),
      };
      const path = editingId ? `/procurement/contracts/${editingId}` : '/procurement/contracts';
      const res = await apiFetch(path, {
        navigate,
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save contract');
      setForm(emptyForm);
      setEditingId(null);
      setStatus({
        type: 'success',
        message: editingId ? 'Contract updated.' : 'Contract created.',
      });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const editContract = (row) => {
    setEditingId(row.id || row._id);
    setForm({
      referenceNumber: row.referenceNumber || '',
      tenderId: row.tenderId ?? '',
      vendorId: row.vendorId ?? '',
      vendorName: row.vendorName || '',
      title: row.title || '',
      value: row.value ?? '',
      startDate: row.startDate || '',
      endDate: row.endDate || '',
      status: row.status || 'DRAFT',
      milestoneCount: row.milestoneCount ?? '4',
      milestonesCompleted: row.milestonesCompleted ?? '0',
    });
  };

  const advanceMilestone = async (row) => {
    const id = row.id || row._id;
    if (!id) return;
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch(`/procurement/contracts/${id}/milestone`, {
        navigate,
        method: 'PUT',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to update milestone');
      setStatus({ type: 'success', message: 'Milestone progress updated.' });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProcurementLayout
      title="Contracts"
      subtitle="Contract register and milestone progress with integrity ledger linkage."
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

      <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1f1f1f]">
          <Plus size={18} className="text-[#e41e1f]" />
          {editingId ? 'Update contract' : 'New contract'}
        </h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Reference
            <input
              placeholder="Auto if blank"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.referenceNumber}
              onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2">
            Title
            <input
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Tender ID
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.tenderId}
              onChange={(e) => setForm({ ...form, tenderId: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Vendor ID
            <input
              type="number"
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.vendorId}
              onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Vendor name
            <input
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.vendorName}
              onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Value (ZAR)
            <input
              type="number"
              min="0"
              step="0.01"
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Start date
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            End date
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
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
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Milestone count
            <input
              type="number"
              min="0"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.milestoneCount}
              onChange={(e) => setForm({ ...form, milestoneCount: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Milestones completed
            <input
              type="number"
              min="0"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.milestonesCompleted}
              onChange={(e) => setForm({ ...form, milestonesCompleted: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Update contract' : 'Create contract'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="rounded-lg border border-[#8b8b8b]/40 px-4 py-2.5 text-sm font-semibold text-[#1f1f1f]"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
          <h2 className="font-bold text-[#1f1f1f]">Contract register</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-16 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={28} />
          </div>
        ) : contracts.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[#8b8b8b]">No contracts recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Reference</th>
                  <th className="px-5 py-3 font-semibold">Title / vendor</th>
                  <th className="px-5 py-3 font-semibold">Value</th>
                  <th className="px-5 py-3 font-semibold">Milestones</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25">
                {contracts.map((row) => (
                  <tr key={row.id || row._id}>
                    <td className="px-5 py-3 font-medium text-[#1f1f1f]">
                      {row.referenceNumber || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#1f1f1f]">{row.title}</p>
                      <p className="text-xs text-[#8b8b8b]">{row.vendorName || '—'}</p>
                    </td>
                    <td className="px-5 py-3">{formatMoney(row.value)}</td>
                    <td className="px-5 py-3 text-[#8b8b8b]">
                      {row.milestonesCompleted ?? 0}/{row.milestoneCount ?? 0}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(
                          row.status
                        )}`}
                      >
                        {row.status || 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => editContract(row)}
                          className="text-xs font-semibold text-[#e41e1f] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => advanceMilestone(row)}
                          className="text-xs font-semibold text-[#e41e1f] hover:underline"
                        >
                          + Milestone
                        </button>
                      </div>
                    </td>
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

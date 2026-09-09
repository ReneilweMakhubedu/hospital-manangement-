import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Plus, RefreshCw } from 'lucide-react';

import { apiFetch } from '../../auth';
import ProcurementLayout from './ProcurementLayout';

const STATUSES = ['DRAFT', 'PUBLISHED', 'BIDDING_CLOSED', 'EVALUATION', 'AWARDED', 'CANCELLED'];

const emptyForm = {
  referenceNumber: '',
  title: '',
  description: '',
  category: '',
  estimatedValue: '',
  evaluationCriteria: '',
  status: 'DRAFT',
  closingAt: '',
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
  if (key === 'AWARDED') return 'bg-[#f8f8f8] text-[#e41e1f]';
  if (key === 'PUBLISHED' || key === 'EVALUATION') return 'bg-[#f8f8f8] text-[#e41e1f]';
  if (key === 'CANCELLED') return 'bg-[#f8f8f8] text-[#e41e1f]';
  if (key === 'BIDDING_CLOSED') return 'bg-[#f8f8f8] text-[#1f1f1f]';
  return 'bg-[#f5f5f5] text-[#1f1f1f]';
}

function toLocalInput(value) {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

export default function ProcurementTenders() {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [awardVendorId, setAwardVendorId] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/procurement/tenders', { navigate });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'Unable to load tenders');
      setTenders(Array.isArray(data) ? data : data.tenders || []);
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
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category.trim(),
        estimatedValue: Number(form.estimatedValue || 0),
        evaluationCriteria: form.evaluationCriteria.trim() || null,
        status: form.status,
        closingAt: form.closingAt ? new Date(form.closingAt).toISOString() : null,
      };
      const path = editingId ? `/procurement/tenders/${editingId}` : '/procurement/tenders';
      const res = await apiFetch(path, {
        navigate,
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save tender');
      setForm(emptyForm);
      setEditingId(null);
      setStatus({
        type: 'success',
        message: editingId ? 'Tender updated.' : 'Tender created.',
      });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const editTender = (row) => {
    setEditingId(row.id || row._id);
    setForm({
      referenceNumber: row.referenceNumber || '',
      title: row.title || '',
      description: row.description || '',
      category: row.category || '',
      estimatedValue: row.estimatedValue ?? '',
      evaluationCriteria: row.evaluationCriteria || '',
      status: row.status || 'DRAFT',
      closingAt: toLocalInput(row.closingAt),
    });
  };

  const runAction = async (row, action, body) => {
    const id = row.id || row._id;
    if (!id) return;
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch(`/procurement/tenders/${id}/${action}`, {
        navigate,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Unable to ${action.replace('-', ' ')}`);
      setStatus({ type: 'success', message: `Tender ${action.replace('-', ' ')} completed.` });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProcurementLayout
      title="Tenders"
      subtitle="Create, publish, close bidding, and award supplier tenders."
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
          {editingId ? 'Update tender' : 'New tender'}
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
            Category
            <input
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Estimated value (ZAR)
            <input
              type="number"
              min="0"
              step="0.01"
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.estimatedValue}
              onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Closing at
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.closingAt}
              onChange={(e) => setForm({ ...form, closingAt: e.target.value })}
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
          <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2 lg:col-span-3">
            Description
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2 lg:col-span-3">
            Evaluation criteria
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.evaluationCriteria}
              onChange={(e) => setForm({ ...form, evaluationCriteria: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Update tender' : 'Create tender'}
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
          <h2 className="font-bold text-[#1f1f1f]">Tender register</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-16 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={28} />
          </div>
        ) : tenders.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[#8b8b8b]">No tenders recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Reference</th>
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Value</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25">
                {tenders.map((row) => {
                  const id = row.id || row._id;
                  return (
                    <tr key={id}>
                      <td className="px-5 py-3 font-medium text-[#1f1f1f]">
                        {row.referenceNumber || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#1f1f1f]">{row.title}</p>
                        <p className="text-xs text-[#8b8b8b]">{row.category || '—'}</p>
                      </td>
                      <td className="px-5 py-3">{formatMoney(row.estimatedValue)}</td>
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
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => editTender(row)}
                              className="text-xs font-semibold text-[#e41e1f] hover:underline"
                            >
                              Edit
                            </button>
                            {row.status === 'DRAFT' && (
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => runAction(row, 'publish')}
                                className="text-xs font-semibold text-[#e41e1f] hover:underline"
                              >
                                Publish
                              </button>
                            )}
                            {(row.status === 'PUBLISHED' || row.status === 'EVALUATION') && (
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => runAction(row, 'close-bidding')}
                                className="text-xs font-semibold text-[#8b8b8b] hover:underline"
                              >
                                Close bidding
                              </button>
                            )}
                          </div>
                          {(row.status === 'BIDDING_CLOSED' ||
                            row.status === 'EVALUATION' ||
                            row.status === 'PUBLISHED') && (
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="number"
                                placeholder="Vendor ID"
                                className="w-28 rounded border border-[#8b8b8b]/40 px-2 py-1 text-xs"
                                value={awardVendorId[id] || ''}
                                onChange={(e) =>
                                  setAwardVendorId({ ...awardVendorId, [id]: e.target.value })
                                }
                              />
                              <button
                                type="button"
                                disabled={saving || !awardVendorId[id]}
                                onClick={() =>
                                  runAction(row, 'award', {
                                    vendorId: Number(awardVendorId[id]),
                                  })
                                }
                                className="text-xs font-semibold text-[#e41e1f] hover:underline disabled:opacity-50"
                              >
                                Award
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </ProcurementLayout>
  );
}

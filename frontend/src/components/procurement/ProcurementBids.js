import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Plus, RefreshCw } from 'lucide-react';

import { apiFetch } from '../../auth';
import ProcurementLayout from './ProcurementLayout';

const emptyForm = {
  tenderId: '',
  vendorId: '',
  vendorName: '',
  bidAmount: '',
  proposalSummary: '',
};

const emptyScore = {
  technicalScore: '',
  priceScore: '',
  totalScore: '',
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
  if (key === 'OPENED' || key === 'SCORED') return 'bg-[#f8f8f8] text-[#e41e1f]';
  if (key === 'REJECTED') return 'bg-[#f8f8f8] text-[#e41e1f]';
  if (key === 'SEALED' || key === 'SUBMITTED') return 'bg-[#f8f8f8] text-[#1f1f1f]';
  return 'bg-[#f5f5f5] text-[#1f1f1f]';
}

export default function ProcurementBids() {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [bids, setBids] = useState([]);
  const [filterTenderId, setFilterTenderId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [scoreForms, setScoreForms] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadTenders = useCallback(async () => {
    try {
      const res = await apiFetch('/procurement/tenders', { navigate });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'Unable to load tenders');
      setTenders(Array.isArray(data) ? data : data.tenders || []);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  }, [navigate]);

  const loadBids = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filterTenderId ? `?tenderId=${encodeURIComponent(filterTenderId)}` : '';
      const res = await apiFetch(`/procurement/bids${qs}`, { navigate });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'Unable to load bids');
      setBids(Array.isArray(data) ? data : data.bids || []);
      setStatus({ type: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [filterTenderId, navigate]);

  useEffect(() => {
    loadTenders();
  }, [loadTenders]);

  useEffect(() => {
    loadBids();
  }, [loadBids]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        tenderId: Number(form.tenderId),
        vendorId: Number(form.vendorId),
        vendorName: form.vendorName.trim(),
        bidAmount: Number(form.bidAmount || 0),
        proposalSummary: form.proposalSummary.trim() || null,
      };
      const res = await apiFetch('/procurement/bids', {
        navigate,
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to submit bid');
      setForm(emptyForm);
      setStatus({ type: 'success', message: 'Bid submitted and sealed.' });
      await loadBids();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const openBid = async (row) => {
    const id = row.id || row._id;
    if (!id) return;
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch(`/procurement/bids/${id}/open`, {
        navigate,
        method: 'PUT',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to open bid');
      setStatus({ type: 'success', message: 'Bid opened for evaluation.' });
      await loadBids();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const scoreBid = async (row) => {
    const id = row.id || row._id;
    if (!id) return;
    const scores = scoreForms[id] || emptyScore;
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        technicalScore: Number(scores.technicalScore || 0),
        priceScore: Number(scores.priceScore || 0),
        totalScore:
          scores.totalScore !== ''
            ? Number(scores.totalScore)
            : Number(scores.technicalScore || 0) + Number(scores.priceScore || 0),
      };
      const res = await apiFetch(`/procurement/bids/${id}/score`, {
        navigate,
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to score bid');
      setStatus({ type: 'success', message: 'Bid scored.' });
      await loadBids();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProcurementLayout
      title="Bids"
      subtitle="Submit sealed bids, open after closing, and capture evaluation scores."
      actions={
        <button
          type="button"
          onClick={loadBids}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] hover:border-[#8b8b8b]/40"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <StatusBanner status={status} />

      <section className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm">
        <label className="text-sm font-semibold text-[#1f1f1f]">
          Filter by tender
          <select
            className="mt-1 block min-w-[240px] rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
            value={filterTenderId}
            onChange={(e) => setFilterTenderId(e.target.value)}
          >
            <option value="">All tenders</option>
            {tenders.map((t) => (
              <option key={t.id || t._id} value={t.id || t._id}>
                {t.referenceNumber || t.id} — {t.title}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1f1f1f]">
          <Plus size={18} className="text-[#e41e1f]" />
          Submit bid
        </h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Tender
            <select
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.tenderId}
              onChange={(e) => setForm({ ...form, tenderId: e.target.value })}
            >
              <option value="">Select tender</option>
              {tenders.map((t) => (
                <option key={t.id || t._id} value={t.id || t._id}>
                  {t.referenceNumber || t.id} — {t.title}
                </option>
              ))}
            </select>
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
            Bid amount (ZAR)
            <input
              type="number"
              min="0"
              step="0.01"
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.bidAmount}
              onChange={(e) => setForm({ ...form, bidAmount: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2">
            Proposal summary
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.proposalSummary}
              onChange={(e) => setForm({ ...form, proposalSummary: e.target.value })}
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
            >
              {saving ? 'Submitting…' : 'Submit sealed bid'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
          <h2 className="font-bold text-[#1f1f1f]">Bid register</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-16 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={28} />
          </div>
        ) : bids.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[#8b8b8b]">No bids for this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Tender</th>
                  <th className="px-5 py-3 font-semibold">Vendor</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Scores</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25">
                {bids.map((row) => {
                  const id = row.id || row._id;
                  const scores = scoreForms[id] || {
                    technicalScore: row.technicalScore ?? '',
                    priceScore: row.priceScore ?? '',
                    totalScore: row.totalScore ?? '',
                  };
                  return (
                    <tr key={id}>
                      <td className="px-5 py-3 font-medium text-[#1f1f1f]">#{row.tenderId}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#1f1f1f]">{row.vendorName || '—'}</p>
                        <p className="text-xs text-[#8b8b8b]">Vendor #{row.vendorId}</p>
                      </td>
                      <td className="px-5 py-3">{formatMoney(row.bidAmount)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(
                            row.status
                          )}`}
                        >
                          {row.status || 'SUBMITTED'}
                        </span>
                        {row.sealedHash && (
                          <p className="mt-1 max-w-[140px] truncate font-mono text-[10px] text-[#8b8b8b]">
                            {row.sealedHash}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-[#8b8b8b]">
                        Tech {row.technicalScore ?? '—'} · Price {row.priceScore ?? '—'} · Total{' '}
                        {row.totalScore ?? '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-2">
                          {(row.status === 'SEALED' || row.status === 'SUBMITTED') && (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => openBid(row)}
                              className="text-left text-xs font-semibold text-[#e41e1f] hover:underline"
                            >
                              Open bid
                            </button>
                          )}
                          {(row.status === 'OPENED' || row.status === 'SCORED') && (
                            <div className="flex flex-wrap items-center gap-1">
                              <input
                                type="number"
                                placeholder="Tech"
                                className="w-16 rounded border border-[#8b8b8b]/40 px-1 py-1 text-xs"
                                value={scores.technicalScore}
                                onChange={(e) =>
                                  setScoreForms({
                                    ...scoreForms,
                                    [id]: { ...scores, technicalScore: e.target.value },
                                  })
                                }
                              />
                              <input
                                type="number"
                                placeholder="Price"
                                className="w-16 rounded border border-[#8b8b8b]/40 px-1 py-1 text-xs"
                                value={scores.priceScore}
                                onChange={(e) =>
                                  setScoreForms({
                                    ...scoreForms,
                                    [id]: { ...scores, priceScore: e.target.value },
                                  })
                                }
                              />
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => scoreBid(row)}
                                className="text-xs font-semibold text-[#e41e1f] hover:underline"
                              >
                                Score
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

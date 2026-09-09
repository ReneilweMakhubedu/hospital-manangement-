import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  LoaderCircle,
  MessageSquareWarning,
  Plus,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch, getRole } from '../auth';
import { brand } from '../brand';

const emptyForm = {
  patientName: '',
  category: 'SERVICE',
  description: '',
  channel: 'WALK_IN',
};

const SLA_STYLES = {
  OK: 'bg-[#f8f8f8] text-[#e41e1f]',
  ACK_DUE: 'bg-amber-100 text-[#1f1f1f]',
  ACK_OVERDUE: 'bg-red-100 text-[#e41e1f]',
  RESOLVE_DUE: 'bg-orange-100 text-orange-800',
  RESOLVE_OVERDUE: 'bg-red-100 text-[#e41e1f]',
  CLOSED: 'bg-[#f5f5f5] text-[#1f1f1f]',
};

function slaBadge(complaint) {
  const status = (complaint.status || '').toUpperCase();
  if (status === 'CLOSED') return { label: 'Closed', style: SLA_STYLES.CLOSED };
  if (complaint.ackOverdue || complaint.acknowledgeOverdue) {
    return { label: 'Ack overdue (5d)', style: SLA_STYLES.ACK_OVERDUE };
  }
  if (complaint.resolveOverdue || complaint.resolutionOverdue) {
    return { label: 'Resolve overdue (25d)', style: SLA_STYLES.RESOLVE_OVERDUE };
  }
  if (complaint.ackDueSoon) return { label: 'Ack due soon', style: SLA_STYLES.ACK_DUE };
  if (complaint.resolveDueSoon) return { label: 'Resolve due soon', style: SLA_STYLES.RESOLVE_DUE };
  if (status === 'ACKNOWLEDGED') return { label: 'Acknowledged', style: SLA_STYLES.OK };
  if (status === 'RESOLVED') return { label: 'Resolved', style: SLA_STYLES.OK };
  return { label: complaint.slaLabel || status || 'Open', style: SLA_STYLES.OK };
}

export default function Complaints() {
  const navigate = useNavigate();
  const role = getRole();
  const isAdmin = role === 'admin';

  const [summary, setSummary] = useState({
    open: 0,
    ackOverdue: 0,
    resolveOverdue: 0,
  });
  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, listRes] = await Promise.all([
        apiFetch('/complaints/summary', { navigate }),
        apiFetch('/complaints', { navigate }),
      ]);
      const [summaryData, listData] = await Promise.all([
        summaryRes.json().catch(() => ({})),
        listRes.json().catch(() => []),
      ]);
      if (!summaryRes.ok) throw new Error(summaryData.error || 'Unable to load complaints summary');
      if (!listRes.ok) throw new Error(listData.error || 'Unable to load complaints');

      setSummary({
        open: summaryData.open ?? summaryData.openCount ?? 0,
        ackOverdue: summaryData.ackOverdue ?? summaryData.acknowledgeOverdue ?? 0,
        resolveOverdue: summaryData.resolveOverdue ?? summaryData.resolutionOverdue ?? 0,
      });
      setComplaints(Array.isArray(listData) ? listData : listData.complaints || []);
      setStatus({ type: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const change = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await apiFetch('/complaints', {
        method: 'POST',
        navigate,
        body: JSON.stringify({
          patientName: form.patientName.trim(),
          category: form.category,
          description: form.description.trim(),
          channel: form.channel,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to log complaint');
      setForm(emptyForm);
      setStatus({ type: 'success', message: 'Complaint logged. SLA clocks started (ack 5 days / resolve 25 days).' });
      await loadData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const action = async (id, path, label) => {
    setStatus({ type: '', message: '' });
    try {
      const response = await apiFetch(`/complaints/${id}/${path}`, {
        method: 'PUT',
        navigate,
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Unable to ${label.toLowerCase()} complaint`);
      setStatus({ type: 'success', message: `Complaint ${label.toLowerCase()}d.` });
      await loadData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const cards = [
    { label: 'Open', value: summary.open, icon: MessageSquareWarning, tone: 'text-[#e41e1f]' },
    { label: 'Ack overdue (5d)', value: summary.ackOverdue, icon: Clock, tone: 'text-[#8b8b8b]' },
    { label: 'Resolve overdue (25d)', value: summary.resolveOverdue, icon: AlertTriangle, tone: 'text-[#e41e1f]' },
  ];

  return (
    <main className="min-h-screen bg-[#f8f8f8] px-5 py-8 text-[#1f1f1f] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate(isAdmin ? '/admin' : '/doctor')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e41e1f] hover:text-[#e41e1f]"
        >
          <ArrowLeft size={16} /> Back to {isAdmin ? 'admin' : 'doctor'}
        </button>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#e41e1f]">
              {brand.shortName} · Patient Experience
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Complaint SLA (5 / 25 days)</h1>
            <p className="mt-2 text-[#8b8b8b]">
              Log patient complaints and track acknowledgement and resolution timelines.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2 text-sm font-semibold hover:bg-[#f8f8f8]"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {status.message && (
          <p
            role="alert"
            className={`mb-6 rounded-lg px-4 py-3 text-sm ${
              status.type === 'success' ? 'bg-[#f8f8f8] text-[#e41e1f]' : 'bg-[#f8f8f8] text-[#e41e1f]'
            }`}
          >
            {status.message}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoaderCircle className="animate-spin text-[#e41e1f]" size={32} />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
                    <card.icon className={`h-4 w-4 ${card.tone}`} />
                    {card.label}
                  </div>
                  <p className={`mt-3 text-2xl font-bold ${card.tone}`}>{card.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-5">
              <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm lg:col-span-2 sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Plus size={18} className="text-[#e41e1f]" /> Log complaint
                </h2>
                <form onSubmit={submit} className="mt-4 space-y-4">
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Patient name
                    <input
                      required
                      name="patientName"
                      value={form.patientName}
                      onChange={change}
                      className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Category
                    <select
                      name="category"
                      value={form.category}
                      onChange={change}
                      className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                    >
                      <option value="SERVICE">Service</option>
                      <option value="CLINICAL">Clinical</option>
                      <option value="WAITING">Waiting times</option>
                      <option value="FACILITIES">Facilities</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Channel
                    <select
                      name="channel"
                      value={form.channel}
                      onChange={change}
                      className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                    >
                      <option value="WALK_IN">Walk-in</option>
                      <option value="PHONE">Phone</option>
                      <option value="EMAIL">Email</option>
                      <option value="WRITTEN">Written</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Description
                    <textarea
                      required
                      name="description"
                      value={form.description}
                      onChange={change}
                      rows={4}
                      className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-bold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
                  >
                    {saving && <LoaderCircle size={16} className="animate-spin" />}
                    {saving ? 'Saving…' : 'Log complaint'}
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-3">
                <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                  <h2 className="font-bold">Open &amp; recent complaints</h2>
                  <p className="mt-1 text-sm text-[#8b8b8b]">
                    {complaints.length} record{complaints.length === 1 ? '' : 's'}
                  </p>
                </div>
                {complaints.length === 0 ? (
                  <p className="px-5 py-16 text-center text-sm text-[#8b8b8b]">
                    No complaints logged yet. Use the form to capture the first case.
                  </p>
                ) : (
                  <div className="divide-y divide-[#8b8b8b]/25">
                    {complaints.map((complaint) => {
                      const id = complaint._id || complaint.id;
                      const badge = slaBadge(complaint);
                      const st = (complaint.status || 'OPEN').toUpperCase();
                      return (
                        <article key={id} className="px-5 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-[#1f1f1f]">
                                {complaint.patientName || 'Patient'}
                              </h3>
                              <p className="mt-1 text-sm text-[#8b8b8b]">
                                {complaint.category} · {complaint.channel || '—'}
                              </p>
                              <p className="mt-2 text-sm text-[#1f1f1f]">{complaint.description}</p>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#8b8b8b]">
                                {complaint.loggedAt || complaint.createdAt ? (
                                  <span>
                                    Logged{' '}
                                    {new Date(complaint.loggedAt || complaint.createdAt).toLocaleDateString()}
                                  </span>
                                ) : null}
                                {complaint.acknowledgedAt && (
                                  <span>
                                    · Ack {new Date(complaint.acknowledgedAt).toLocaleDateString()}
                                  </span>
                                )}
                                {complaint.resolvedAt && (
                                  <span>
                                    · Resolved {new Date(complaint.resolvedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${badge.style}`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {st === 'OPEN' && (
                              <button
                                type="button"
                                onClick={() => action(id, 'acknowledge', 'Acknowledge')}
                                className="inline-flex items-center gap-1 rounded border border-[#e41e1f] px-2.5 py-1 text-xs font-semibold text-[#e41e1f] hover:bg-[#f8f8f8]"
                              >
                                <CheckCircle2 size={14} /> Acknowledge
                              </button>
                            )}
                            {['OPEN', 'ACKNOWLEDGED'].includes(st) && (
                              <button
                                type="button"
                                onClick={() => action(id, 'resolve', 'Resolve')}
                                className="inline-flex items-center gap-1 rounded border border-[#e41e1f] px-2.5 py-1 text-xs font-semibold text-[#e41e1f] hover:bg-[#f8f8f8]"
                              >
                                <CheckCircle2 size={14} /> Resolve
                              </button>
                            )}
                            {st !== 'CLOSED' && (
                              <button
                                type="button"
                                onClick={() => action(id, 'close', 'Close')}
                                className="inline-flex items-center gap-1 rounded border border-[#8b8b8b] px-2.5 py-1 text-xs font-semibold text-[#1f1f1f] hover:bg-[#f8f8f8]"
                              >
                                <XCircle size={14} /> Close
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

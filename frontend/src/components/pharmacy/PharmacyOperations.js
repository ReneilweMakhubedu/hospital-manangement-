import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Plus, RefreshCw, Timer } from 'lucide-react';

import { apiFetch } from '../../auth';
import PharmacyLayout from './PharmacyLayout';

const emptyTicket = {
  patientName: '',
  priority: 'ROUTINE',
  technicianName: '',
};

const STATUS_ACTIONS = [
  { value: 'WAITING', label: 'Waiting' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'DISPENSED', label: 'Dispensed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function formatMinutes(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  if (n >= 60) {
    const h = Math.floor(n / 60);
    const m = Math.round(n % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.round(n)} min`;
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

function KpiStrip({ kpis }) {
  const items = [
    { label: 'Processing', value: formatMinutes(kpis?.avgProcessingMinutes) },
    { label: 'Queue wait', value: formatMinutes(kpis?.avgWaitMinutes) },
    { label: 'Waiting', value: kpis?.queueWaiting ?? 0 },
    { label: 'STAT turnaround', value: formatMinutes(kpis?.statTurnaroundMinutes) },
    {
      label: 'Scripts / tech hour',
      value: kpis?.scriptsPerTechnicianHour != null ? kpis.scriptsPerTechnicianHour : '—',
    },
  ];

  return (
    <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">{item.label}</p>
          <p className="mt-1 text-xl font-bold text-[#1f1f1f]">{item.value}</p>
        </div>
      ))}
    </section>
  );
}

export default function PharmacyOperations() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [kpis, setKpis] = useState({});
  const [form, setForm] = useState(emptyTicket);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/pharmacy/operations', { navigate });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Unable to load pharmacy operations');
      const list = Array.isArray(json) ? json : json.tickets || json.queue || [];
      setTickets(list);
      setKpis(json.kpis || json.operations || {});
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
      const res = await apiFetch('/pharmacy/operations/tickets', {
        navigate,
        method: 'POST',
        body: JSON.stringify({
          patientName: form.patientName.trim(),
          priority: form.priority,
          technicianName: form.technicianName.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to create queue ticket');
      setForm(emptyTicket);
      setStatus({ type: 'success', message: 'Queue ticket created.' });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (ticket, nextStatus) => {
    const id = ticket.id || ticket._id;
    if (!id || ticket.status === nextStatus) return;
    setUpdatingId(id);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch(`/pharmacy/operations/tickets/${id}`, {
        navigate,
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to update ticket status');
      setStatus({ type: 'success', message: `Ticket moved to ${nextStatus.replace('_', ' ')}.` });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <PharmacyLayout
      title="Pharmacy operations"
      subtitle="Dispense queue, STAT priority, and processing-time controls for the counter."
      actions={
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <StatusBanner status={status} />
      <KpiStrip kpis={kpis} />

      <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="text-[#e41e1f]" size={20} />
          <h2 className="text-lg font-bold text-[#1f1f1f]">Create queue ticket</h2>
        </div>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold text-[#1f1f1f]">
            Patient name
            <input
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.patientName}
              onChange={(e) => setForm({ ...form, patientName: e.target.value })}
            />
          </label>
          <label className="text-sm font-semibold text-[#1f1f1f]">
            Priority
            <select
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="ROUTINE">Routine</option>
              <option value="STAT">STAT</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-[#1f1f1f]">
            Technician
            <input
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.technicianName}
              onChange={(e) => setForm({ ...form, technicianName: e.target.value })}
              placeholder="Optional"
            />
          </label>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] disabled:opacity-60"
            >
              <Plus size={16} />
              {saving ? 'Creating…' : 'Add ticket'}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#8b8b8b]/30 px-5 py-4">
          <Timer size={18} className="text-[#e41e1f]" />
          <h2 className="font-bold text-[#1f1f1f]">Dispense queue</h2>
        </div>
        {loading && tickets.length === 0 ? (
          <div className="flex items-center gap-2 px-5 py-10 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={18} /> Loading queue…
          </div>
        ) : tickets.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#8b8b8b]">No queue tickets yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-[#8b8b8b]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Ticket</th>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Priority</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Technician</th>
                  <th className="px-5 py-3 font-semibold">Arrived</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25">
                {tickets.map((ticket) => {
                  const id = ticket.id || ticket._id;
                  return (
                    <tr key={id}>
                      <td className="px-5 py-3 font-medium text-[#1f1f1f]">
                        {ticket.ticketNumber || id}
                      </td>
                      <td className="px-5 py-3 text-[#1f1f1f]">{ticket.patientName || '—'}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            ticket.priority === 'STAT'
                              ? 'bg-[#f8f8f8] text-[#e41e1f]'
                              : 'bg-[#f5f5f5] text-[#8b8b8b]'
                          }`}
                        >
                          {ticket.priority || 'ROUTINE'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#1f1f1f]">
                        {(ticket.status || 'WAITING').replace('_', ' ')}
                      </td>
                      <td className="px-5 py-3 text-[#8b8b8b]">{ticket.technicianName || '—'}</td>
                      <td className="px-5 py-3 text-[#8b8b8b]">
                        {ticket.arrivedAt ? new Date(ticket.arrivedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <select
                          className="rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-2 py-1.5 text-xs font-semibold text-[#1f1f1f]"
                          value={ticket.status || 'WAITING'}
                          disabled={updatingId === id}
                          onChange={(e) => updateStatus(ticket, e.target.value)}
                        >
                          {STATUS_ACTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PharmacyLayout>
  );
}

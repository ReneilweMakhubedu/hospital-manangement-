import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Plus, RefreshCw } from 'lucide-react';

import { apiFetch } from '../../auth';
import ProcurementLayout from './ProcurementLayout';

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'];

const emptyForm = {
  severity: 'MEDIUM',
  title: '',
  detail: '',
  status: 'OPEN',
  relatedEntityType: '',
  relatedEntityId: '',
};

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

function severityStyle(s) {
  const key = (s || '').toUpperCase();
  if (key === 'CRITICAL' || key === 'HIGH') return 'bg-[#f8f8f8] text-[#e41e1f]';
  if (key === 'MEDIUM') return 'bg-[#f8f8f8] text-[#1f1f1f]';
  return 'bg-[#f5f5f5] text-[#1f1f1f]';
}

export default function ProcurementAlerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/procurement/alerts', { navigate });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'Unable to load risk alerts');
      setAlerts(Array.isArray(data) ? data : data.alerts || []);
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
        severity: form.severity,
        title: form.title.trim(),
        detail: form.detail.trim() || null,
        status: form.status,
        relatedEntityType: form.relatedEntityType.trim() || null,
        relatedEntityId: form.relatedEntityId ? Number(form.relatedEntityId) : null,
      };
      const res = await apiFetch('/procurement/alerts', {
        navigate,
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to create alert');
      setForm(emptyForm);
      setStatus({ type: 'success', message: 'Risk alert recorded.' });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (row, nextStatus) => {
    const id = row.id || row._id;
    if (!id) return;
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch(`/procurement/alerts/${id}`, {
        navigate,
        method: 'PUT',
        body: JSON.stringify({ ...row, status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to update alert');
      setStatus({ type: 'success', message: `Alert marked ${nextStatus}.` });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProcurementLayout
      title="Risk alerts"
      subtitle="Supplier, bid, and spend risk signals for procurement officers."
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
          New risk alert
        </h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            Severity
            <select
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
            Related entity type
            <input
              placeholder="e.g. VENDOR, TENDER"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.relatedEntityType}
              onChange={(e) => setForm({ ...form, relatedEntityType: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Related entity ID
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.relatedEntityId}
              onChange={(e) => setForm({ ...form, relatedEntityId: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2 lg:col-span-3">
            Detail
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.detail}
              onChange={(e) => setForm({ ...form, detail: e.target.value })}
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Create alert'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
          <h2 className="font-bold text-[#1f1f1f]">Alert register</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-16 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={28} />
          </div>
        ) : alerts.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[#8b8b8b]">No risk alerts recorded.</p>
        ) : (
          <ul className="divide-y divide-[#8b8b8b]/25">
            {alerts.map((row) => (
              <li
                key={row.id || row._id}
                className="flex flex-wrap items-start justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${severityStyle(
                        row.severity
                      )}`}
                    >
                      {row.severity || 'MEDIUM'}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
                      {row.status || 'OPEN'}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-[#1f1f1f]">{row.title}</p>
                  {row.detail && <p className="mt-1 text-sm text-[#8b8b8b]">{row.detail}</p>}
                  {(row.relatedEntityType || row.relatedEntityId != null) && (
                    <p className="mt-1 text-xs text-[#8b8b8b]">
                      {row.relatedEntityType || 'Entity'}
                      {row.relatedEntityId != null ? ` #${row.relatedEntityId}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.status === 'OPEN' && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => updateStatus(row, 'ACKNOWLEDGED')}
                      className="rounded-lg border border-[#8b8b8b]/40 px-3 py-1.5 text-xs font-semibold text-[#1f1f1f]"
                    >
                      Acknowledge
                    </button>
                  )}
                  {row.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => updateStatus(row, 'RESOLVED')}
                      className="rounded-lg bg-[#e41e1f] px-3 py-1.5 text-xs font-semibold text-[#ffffff]"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ProcurementLayout>
  );
}

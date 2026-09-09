import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, RefreshCw, ScrollText } from 'lucide-react';

import { apiFetch } from '../../auth';
import PayrollLayout from './PayrollLayout';

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

function formatWhen(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-ZA');
  } catch {
    return String(value);
  }
}

export default function PayrollAudit() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/payroll/audit', { navigate });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'Unable to load payroll audit trail');
      setEvents(Array.isArray(data) ? data : data.events || data.audit || []);
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

  return (
    <PayrollLayout
      title="Payroll audit trail"
      subtitle="Recent payroll mutations — periods, cost centres, timesheets, ghost cases, and certifications."
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

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#8b8b8b]/30 px-5 py-4">
          <ScrollText size={18} className="text-[#e41e1f]" />
          <h2 className="font-bold text-[#1f1f1f]">Timeline</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={28} />
          </div>
        ) : events.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[#8b8b8b]">No payroll audit events yet.</p>
        ) : (
          <ol className="relative space-y-0 divide-y divide-[#8b8b8b]/25">
            {events.map((e, idx) => (
              <li
                key={e.id || e._id || `${e.createdAt}-${idx}`}
                className="flex gap-4 px-5 py-4"
              >
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#e41e1f]" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-[#1f1f1f]">
                      {e.action || e.eventType || 'Action'}
                    </p>
                    <time className="text-xs text-[#8b8b8b]">
                      {formatWhen(e.createdAt || e.timestamp)}
                    </time>
                  </div>
                  <p className="mt-1 text-sm text-[#8b8b8b]">
                    {e.actorEmail || e.actor || 'System'}
                    {e.entityType ? ` · ${e.entityType}` : ''}
                    {e.entityId != null ? ` #${e.entityId}` : ''}
                  </p>
                  {(e.detail || e.message) && (
                    <p className="mt-2 text-sm text-[#1f1f1f]">{e.detail || e.message}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </PayrollLayout>
  );
}

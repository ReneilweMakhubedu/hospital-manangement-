import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, LoaderCircle, RefreshCw, Sparkles, X } from 'lucide-react';

import { apiFetch, getRole } from '../auth';
import { portalChrome as ui } from '../theme';

const PORTAL_ACTIONS = {
  nursing: [
    { action: 'handover', label: 'Draft handover' },
    { action: 'summarise', label: 'Summarise' },
    { action: 'prioritise', label: 'Prioritise' },
  ],
  casualty: [
    { action: 'triage', label: 'Suggest triage' },
    { action: 'draft-note', label: 'Draft note' },
    { action: 'prioritise', label: 'Prioritise' },
  ],
  lab: [
    { action: 'prioritise', label: 'Prioritise order' },
    { action: 'summarise', label: 'Summarise' },
  ],
  radiology: [
    { action: 'prioritise', label: 'Prioritise study' },
    { action: 'summarise', label: 'Draft impression' },
  ],
  facilities: [
    { action: 'work-order', label: 'Draft work order' },
    { action: 'prioritise', label: 'Prioritise' },
  ],
  allied: [
    { action: 'prioritise', label: 'Prioritise referral' },
    { action: 'summarise', label: 'Summarise' },
  ],
  pharmacy: [
    { action: 'prioritise', label: 'Prioritise queue' },
    { action: 'summarise', label: 'Summarise' },
  ],
  doctor: [
    { action: 'draft-note', label: 'SOAP draft' },
    { action: 'summarise', label: 'Summarise' },
    { action: 'triage', label: 'Triage hint' },
  ],
  procurement: [
    { action: 'prioritise', label: 'Prioritise risk' },
    { action: 'summarise', label: 'Summarise' },
  ],
  hr: [
    { action: 'summarise', label: 'Summarise' },
    { action: 'prioritise', label: 'Prioritise' },
  ],
  finance: [
    { action: 'summarise', label: 'Summarise' },
    { action: 'prioritise', label: 'Prioritise' },
  ],
  payroll: [
    { action: 'summarise', label: 'Summarise' },
    { action: 'prioritise', label: 'Prioritise' },
  ],
  admin: [
    { action: 'summarise', label: 'Summarise' },
    { action: 'prioritise', label: 'Prioritise' },
  ],
};

function severityClass(severity) {
  const s = String(severity || '').toUpperCase();
  if (s === 'CRITICAL') return 'border-[#e41e1f] bg-[#fff5f5] text-[#e41e1f]';
  if (s === 'HIGH') return 'border-[#e41e1f]/50 bg-[#f8f8f8] text-[#1f1f1f]';
  return 'border-[#8b8b8b]/30 bg-[#ffffff] text-[#1f1f1f]';
}

export function StaffAlertsBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/automation/alerts', { navigate });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'Unable to load alerts');
      setAlerts(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load alerts');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  const ack = async (id) => {
    const res = await apiFetch(`/automation/alerts/${id}/ack`, { navigate, method: 'POST' });
    if (res.ok) load();
  };

  const critical = alerts.filter((a) => String(a.severity).toUpperCase() === 'CRITICAL').length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!open) load(); }}
        className={`${ui.btnSecondary} relative`}
        title="Automation alerts"
      >
        <Bell size={16} />
        Alerts
        {alerts.length > 0 && (
          <span className={`ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white ${critical ? 'bg-[#e41e1f]' : 'bg-[#8b8b8b]'}`}>
            {alerts.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[22rem] max-w-[90vw] rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#1f1f1f]">Staff alerts</p>
            <div className="flex gap-1">
              <button type="button" className={ui.btnSecondary} onClick={load} disabled={loading}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              <button type="button" className={ui.btnSecondary} onClick={() => setOpen(false)}>
                <X size={14} />
              </button>
            </div>
          </div>
          {error && <p className="mb-2 text-xs text-[#e41e1f]">{error}</p>}
          {loading && alerts.length === 0 ? (
            <p className="flex items-center gap-2 py-6 text-sm text-[#8b8b8b]"><LoaderCircle size={16} className="animate-spin" /> Loading…</p>
          ) : alerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#8b8b8b]">No open alerts for your role.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {alerts.map((alert) => (
                <li key={alert.id} className={`rounded-xl border p-3 text-sm ${severityClass(alert.severity)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{alert.severity} · {alert.source}</p>
                      <p className="mt-1 font-semibold">{alert.title}</p>
                      <p className="mt-1 text-xs opacity-90">{alert.detail}</p>
                    </div>
                    <button type="button" title="Acknowledge" onClick={() => ack(alert.id)} className="rounded-lg border border-current/20 p-1.5 hover:bg-white/60">
                      <Check size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function AssistPanel({ portal = 'admin', defaultOpen = false }) {
  const navigate = useNavigate();
  const role = getRole();
  const actions = useMemo(() => PORTAL_ACTIONS[portal] || PORTAL_ACTIONS.admin, [portal]);
  const [open, setOpen] = useState(defaultOpen);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      const res = await apiFetch('/assist', {
        navigate,
        method: 'POST',
        body: JSON.stringify({ action, portal, text, context: { role } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Assist failed');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assist failed');
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={ui.btnSecondary}>
        <Sparkles size={16} /> Assist
      </button>
    );
  }

  return (
    <div className={`${ui.card} mt-6 p-5`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className={ui.eyebrow}>AI & automation</p>
          <h3 className="mt-1 text-lg font-semibold text-[#1f1f1f]">Assist</h3>
          <p className="mt-1 text-sm text-[#8b8b8b]">Drafts and suggestions only — confirm before applying to the record.</p>
        </div>
        <button type="button" className={ui.btnSecondary} onClick={() => setOpen(false)}><X size={16} /></button>
      </div>
      <textarea
        className="min-h-[110px] w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#e41e1f]"
        placeholder="Paste a chief complaint, handover notes, work description, or spoken draft…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((item) => (
          <button key={item.action} type="button" disabled={busy || !text.trim()} onClick={() => run(item.action)} className={ui.btnPrimary}>
            {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {item.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-[#e41e1f]">{error}</p>}
      {result && (
        <div className="mt-4 rounded-xl border border-[#8b8b8b]/25 bg-[#f8f8f8] p-4 text-sm text-[#1f1f1f]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">{result.label || result.action}</p>
          {result.summary && <p className="mt-2 font-medium">{result.summary}</p>}
          {result.triageCategory && <p className="mt-2">Suggested triage: <strong>{result.triageCategory}</strong> — {result.reason}</p>}
          {result.priority && <p className="mt-2">Suggested priority: <strong>{result.priority}</strong> — {result.reason}</p>}
          {result.subjective && (
            <div className="mt-3 space-y-2">
              <p><span className="text-[#8b8b8b]">S:</span> {result.subjective}</p>
              <p><span className="text-[#8b8b8b]">O:</span> {result.objective}</p>
              <p><span className="text-[#8b8b8b]">A:</span> {result.assessment}</p>
              <p><span className="text-[#8b8b8b]">P:</span> {result.plan}</p>
            </div>
          )}
          {Array.isArray(result.bullets) && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {result.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
          )}
          {Array.isArray(result.concerns) && (
            <div className="mt-2 space-y-1">
              <p className="font-medium">Concerns</p>
              <ul className="list-disc pl-5">{result.concerns.map((c) => <li key={c}>{c}</li>)}</ul>
              <p className="font-medium">Tasks</p>
              <ul className="list-disc pl-5">{result.outstandingTasks?.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          )}
          {result.disclaimer && <p className="mt-3 text-xs text-[#8b8b8b]">{result.disclaimer}</p>}
        </div>
      )}
    </div>
  );
}

export function PortalAutomationTools({ portal }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
      <StaffAlertsBell />
      <AssistPanel portal={portal} />
    </div>
  );
}

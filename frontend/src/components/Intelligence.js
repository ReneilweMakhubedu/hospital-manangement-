import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, LoaderCircle, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { apiFetch, logout } from '../auth';
import { brand } from '../brand';
import BrandLogo from './BrandLogo';
import { AssistPanel, StaffAlertsBell } from './AssistTools';
import { portalChrome as ui } from '../theme';

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[#1f1f1f]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Intelligence() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [insightsRes, autoRes] = await Promise.all([
        apiFetch('/learning/insights', { navigate }),
        apiFetch('/automation/status', { navigate }),
      ]);
      const insights = await insightsRes.json().catch(() => ({}));
      const auto = await autoRes.json().catch(() => ({}));
      if (!insightsRes.ok) throw new Error(insights.error || 'Unable to load machine learning');
      if (!autoRes.ok) throw new Error(auto.error || 'Unable to load automation');
      setData(insights);
      setStatus(auto);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load intelligence');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const lab = data?.labTurnaround || {};
  const beds = data?.bedDemand || {};
  const predictions = Array.isArray(lab.predictions) ? lab.predictions : [];

  return (
    <div className={ui.page}>
      <aside className={ui.aside}>
        <div className={ui.brandBlock}>
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12 shrink-0" />
            <div>
              <h2 className={ui.brandTitle}>{brand.shortName}</h2>
              <p className={ui.brandPortal}>Intelligence</p>
            </div>
          </div>
          <p className={ui.brandHospital}>{brand.hospital}</p>
        </div>
        <div className={ui.footer}>
          <Link to="/admin" className={ui.footerLink}>Back</Link>
          <button type="button" onClick={() => logout(navigate)} className={ui.logout}>Logout</button>
        </div>
      </aside>
      <main className="ml-72 flex-1 overflow-y-auto px-6 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={ui.eyebrow}>{brand.hospital}</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1f1f1f]">AI, machine learning, and automation</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#8b8b8b]">
              Three separate tools. AI drafts a suggestion, machine learning scores operational risk from trained weights, and automation raises the alert.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StaffAlertsBell />
            <button type="button" onClick={load} className={ui.btnSecondary}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </header>
        {error && <div className="mb-6 rounded-xl bg-[#f8f8f8] px-4 py-3 text-sm text-[#e41e1f]">{error}</div>}
        {loading && !data ? (
          <div className="flex items-center justify-center gap-2 py-20 text-[#8b8b8b]">
            <LoaderCircle size={20} className="animate-spin" /> Loading…
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-3">
            <Card title="AI assist">
              <div className="mb-3 flex items-center gap-2 text-[#e41e1f]"><Sparkles size={18} /> Drafts only</div>
              <p className="text-sm text-[#8b8b8b]">
                Staff type a note and the assistant proposes a handover, triage hint, priority, or summary. Nothing is written to the record until a person confirms it.
              </p>
              <AssistPanel portal="admin" defaultOpen />
            </Card>
            <Card title="Machine learning">
              <div className="mb-3 flex items-center gap-2 text-[#e41e1f]"><Brain size={18} /> Trained weights</div>
              <p className="text-sm text-[#1f1f1f]">
                {lab.algorithm} · trained on {lab.trainedExamples ?? 0} · held-out accuracy {lab.heldOutAccuracy == null ? 'needs more completed cases' : `${lab.heldOutAccuracy}%`} on {lab.heldOutExamples ?? 0} unseen examples
              </p>
              <p className="mt-3 text-sm text-[#1f1f1f]">
                {beds.algorithm}: predicted occupied beds <strong>{beds.predictedOccupied ?? '—'}</strong> from {beds.occupiedNow ?? 0} occupied, {beds.availableNow ?? 0} available, {beds.pendingAdmissions ?? 0} pending admissions.
              </p>
              <p className="mt-1 text-xs text-[#8b8b8b]">Largest bed factor: {beds.mainFactor || '—'}. Held-out error {beds.heldOutMae == null ? 'needs more days of occupancy' : `${beds.heldOutMae} beds`} on {beds.heldOutExamples ?? 0} unseen days. Today’s occupancy is saved and becomes a training outcome tomorrow.</p>
              <ul className="mt-4 space-y-2 text-sm">
                {predictions.length === 0 ? <li className="text-[#8b8b8b]">No open lab orders to score.</li> : predictions.map((row) => (
                  <li key={row.id} className="rounded-lg bg-[#f8f8f8] px-3 py-2">
                    <span className="font-semibold text-[#1f1f1f]">{row.patientName}</span>
                    <span className="text-[#8b8b8b]"> · {row.testName} · {Math.round((row.breachProbability || 0) * 100)}% delay risk · {row.mainFactor}</span>
                  </li>
                ))}
              </ul>
              {data?.disclaimer && <p className="mt-4 text-xs text-[#8b8b8b]">{data.disclaimer}</p>}
            </Card>
            <Card title="Automation">
              <div className="mb-3 flex items-center gap-2 text-[#e41e1f]"><Zap size={18} /> Scheduled scans</div>
              <p className="text-3xl font-bold text-[#1f1f1f]">{status?.openAlertCount ?? 0}</p>
              <p className="text-sm text-[#8b8b8b]">Open alerts for your role · {status?.criticalCount ?? 0} critical</p>
              <p className="mt-3 text-sm text-[#8b8b8b]">
                Every five minutes the scheduler sends consented appointment SMS reminders and scans beds, lab delays, complaints, housekeeping, porters, pharmacy stock, and the machine-learning signals. Hospital admin can run it now from the command centre.
              </p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

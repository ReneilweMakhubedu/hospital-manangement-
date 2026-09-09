import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, RefreshCw, Sparkles } from 'lucide-react';

import { apiFetch } from '../../auth';
import ProcurementLayout from './ProcurementLayout';

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

export default function ProcurementInsights() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/procurement/insights', { navigate });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'Unable to load assistant insights');
      setInsights(Array.isArray(data) ? data : data.insights || []);
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

  const generate = async () => {
    setGenerating(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch('/procurement/insights/generate', {
        navigate,
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to generate insights');
      setStatus({
        type: 'success',
        message: 'Procurement assistant generated new insights from current tender, risk, and spend data.',
      });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ProcurementLayout
      title="Assistant insights"
      subtitle="Rule-based Procurement assistant recommendations on demand, suppliers, bids, risk, and spend."
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] hover:border-[#8b8b8b]/40"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-xl bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
          >
            <Sparkles size={16} />
            {generating ? 'Generating…' : 'Generate assistant insights'}
          </button>
        </div>
      }
    >
      <StatusBanner status={status} />

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#8b8b8b]/30 px-5 py-4">
          <Sparkles size={18} className="text-[#e41e1f]" />
          <h2 className="font-bold text-[#1f1f1f]">Procurement assistant</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={28} />
          </div>
        ) : insights.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[#8b8b8b]">
            No insights yet. Use Generate assistant insights to analyse current procurement data.
          </p>
        ) : (
          <ul className="divide-y divide-[#8b8b8b]/25">
            {insights.map((insight) => (
              <li key={insight.id || insight.title} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-[#1f1f1f]">{insight.title || 'Insight'}</p>
                  <time className="text-xs text-[#8b8b8b]">{formatWhen(insight.createdAt)}</time>
                </div>
                <p className="mt-2 text-sm text-[#1f1f1f]">{insight.body || insight.detail || '—'}</p>
                <p className="mt-2 text-xs text-[#8b8b8b]">
                  {insight.insightType || 'RECOMMENDATION'}
                  {insight.confidence != null ? ` · confidence ${insight.confidence}` : ''}
                  {insight.relatedEntityType
                    ? ` · ${insight.relatedEntityType}${
                        insight.relatedEntityId != null ? ` #${insight.relatedEntityId}` : ''
                      }`
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ProcurementLayout>
  );
}

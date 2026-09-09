import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, LoaderCircle, Plus, RefreshCw } from 'lucide-react';

import { apiFetch } from '../../auth';
import PharmacyLayout from './PharmacyLayout';

const INTERVENTION_TYPES = [
  { value: 'DOSE_ADJUST', label: 'Dose adjustment' },
  { value: 'IV_TO_PO', label: 'IV to PO' },
  { value: 'AMS_DEESCALATION', label: 'AMS de-escalation' },
  { value: 'FORMULARY', label: 'Formulary' },
  { value: 'GOOD_CATCH', label: 'Good catch' },
  { value: 'OTHER', label: 'Other' },
];

const emptyForm = {
  interventionType: 'DOSE_ADJUST',
  description: '',
  costAvoidanceAmount: '',
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

function typeLabel(value) {
  return INTERVENTION_TYPES.find((t) => t.value === value)?.label || value || '—';
}

export default function PharmacyClinical() {
  const navigate = useNavigate();
  const [interventions, setInterventions] = useState([]);
  const [kpis, setKpis] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/pharmacy/clinical', { navigate });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Unable to load clinical pharmacy data');
      const list = Array.isArray(json)
        ? json
        : json.interventions || json.items || [];
      setInterventions(list);
      setKpis(json.kpis || json.clinical || {});
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
        interventionType: form.interventionType,
        description: form.description.trim(),
      };
      if (form.costAvoidanceAmount !== '') {
        payload.costAvoidanceAmount = Number(form.costAvoidanceAmount);
      }
      const res = await apiFetch('/pharmacy/clinical/interventions', {
        navigate,
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to log intervention');
      setForm(emptyForm);
      setStatus({ type: 'success', message: 'Clinical intervention logged.' });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const kpiCards = [
    { label: 'Interventions', value: kpis.interventionCount ?? interventions.length },
    { label: 'AMS', value: kpis.amsCount ?? 0 },
    {
      label: 'Formulary adherence',
      value:
        kpis.formularyAdherencePercent != null ? `${kpis.formularyAdherencePercent}%` : '—',
    },
    { label: 'Good catches', value: kpis.goodCatchCount ?? 0 },
  ];

  return (
    <PharmacyLayout
      title="Clinical quality"
      subtitle="Interventions, AMS, formulary adherence, and good-catch reporting."
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

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8f8f8] text-[#e41e1f]">
              <HeartPulse size={18} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="text-[#e41e1f]" size={20} />
          <h2 className="text-lg font-bold text-[#1f1f1f]">Log intervention</h2>
        </div>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-[#1f1f1f]">
            Type
            <select
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.interventionType}
              onChange={(e) => setForm({ ...form, interventionType: e.target.value })}
            >
              {INTERVENTION_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-[#1f1f1f]">
            Cost avoidance (ZAR)
            <input
              type="number"
              min="0"
              step="0.01"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.costAvoidanceAmount}
              onChange={(e) => setForm({ ...form, costAvoidanceAmount: e.target.value })}
              placeholder="Optional"
            />
          </label>
          <label className="sm:col-span-2 text-sm font-semibold text-[#1f1f1f]">
            Description
            <textarea
              required
              rows={3}
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] disabled:opacity-60"
            >
              <Plus size={16} />
              {saving ? 'Saving…' : 'Log intervention'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
          <h2 className="font-bold text-[#1f1f1f]">Interventions</h2>
        </div>
        {loading && interventions.length === 0 ? (
          <div className="flex items-center gap-2 px-5 py-10 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={18} /> Loading interventions…
          </div>
        ) : interventions.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#8b8b8b]">No clinical interventions logged yet.</p>
        ) : (
          <ul className="divide-y divide-[#8b8b8b]/25">
            {interventions.map((item) => (
              <li
                key={item.id || item._id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-[#1f1f1f]">
                    {typeLabel(item.interventionType)}
                  </p>
                  <p className="mt-1 text-sm text-[#8b8b8b]">{item.description || '—'}</p>
                  <p className="mt-1 text-xs text-[#8b8b8b]">
                    {item.pharmacistEmail || 'Pharmacy'}
                    {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleString()}` : ''}
                  </p>
                </div>
                {item.costAvoidanceAmount != null && (
                  <p className="shrink-0 font-semibold text-[#e41e1f]">
                    {formatMoney(item.costAvoidanceAmount)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </PharmacyLayout>
  );
}

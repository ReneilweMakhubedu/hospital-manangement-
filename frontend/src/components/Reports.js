import React, { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, FileSpreadsheet, RefreshCw, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch, getRole } from '../auth';
import { brand } from '../brand';

export default function Reports() {
  const navigate = useNavigate();
  const role = getRole();
  const home = role === 'doctor' ? '/doctor' : '/admin';

  const [kpis, setKpis] = useState(null);
  const [mapping, setMapping] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [kpiRes, mapRes] = await Promise.all([
        apiFetch('/monitoring/kpis', { navigate }),
        apiFetch('/reporting/exports/mapping', { navigate }),
      ]);
      const kpiData = await kpiRes.json().catch(() => ({}));
      const mapData = await mapRes.json().catch(() => ({}));
      if (!kpiRes.ok) throw new Error(kpiData.error || 'Unable to load KPIs');
      setKpis(kpiData);
      setMapping(mapRes.ok ? mapData : null);
      setStatus({ type: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const cards = [
    { label: 'Queue waiting', value: kpis?.queueWaiting ?? kpis?.queue?.waiting ?? '—' },
    { label: 'Avg wait (min)', value: kpis?.averageWaitMinutes ?? kpis?.queue?.averageWaitMinutes ?? '—' },
    { label: 'Open complaints', value: kpis?.complaintsOpen ?? kpis?.complaints?.open ?? '—' },
    { label: 'Theatre utilisation', value: kpis?.theatreUtilisation ?? kpis?.theatres?.utilisationPercent ?? '—' },
    { label: 'Pharmacy low stock', value: kpis?.pharmacyLowStock ?? kpis?.pharmacy?.lowStock ?? '—' },
    { label: 'Vacancy gap', value: kpis?.hrVacancyGap ?? kpis?.hr?.vacancyGap ?? '—' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8f8f8] via-[#f8f8f8]/40 to-[#f5f5f5] px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate(home)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e41e1f]"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#e41e1f]">{brand.shortName}</p>
            <h1 className="mt-1 text-3xl font-bold text-[#1f1f1f]">Operational reports</h1>
            <p className="mt-2 text-[#8b8b8b]">Live M&amp;E snapshot and export entry points.</p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f]"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </header>

        {status.message && (
          <div className="mb-6 rounded-xl bg-[#f8f8f8] px-4 py-3 text-sm text-[#e41e1f]">{status.message}</div>
        )}

        {loading ? (
          <p className="text-[#8b8b8b]">Loading indicators…</p>
        ) : (
          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <article key={c.label} className="rounded-xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">{c.label}</p>
                <p className="mt-2 text-3xl font-bold text-[#1f1f1f]">{String(c.value)}</p>
              </article>
            ))}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() => navigate('/monitoring')}
            className="rounded-xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 text-left shadow-sm hover:border-[#8b8b8b]/40"
          >
            <BarChart3 className="mb-3 text-[#e41e1f]" />
            <h2 className="font-bold text-[#1f1f1f]">M&amp;E KPIs</h2>
            <p className="mt-1 text-sm text-[#8b8b8b]">Full indicator pack for bed, wait, pharmacy, theatre, HR.</p>
          </button>
          <button
            type="button"
            onClick={() => navigate('/reporting')}
            className="rounded-xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 text-left shadow-sm hover:border-[#8b8b8b]/40"
          >
            <FileSpreadsheet className="mb-3 text-[#e41e1f]" />
            <h2 className="font-bold text-[#1f1f1f]">DHIS2 exports</h2>
            <p className="mt-1 text-sm text-[#8b8b8b]">
              {mapping?.indicators
                ? `${Array.isArray(mapping.indicators) ? mapping.indicators.length : 'Mapped'} export fields ready`
                : 'Quality checks and export packs'}
            </p>
          </button>
          <button
            type="button"
            onClick={() => navigate('/audit')}
            className="rounded-xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 text-left shadow-sm hover:border-[#8b8b8b]/40"
          >
            <Shield className="mb-3 text-[#e41e1f]" />
            <h2 className="font-bold text-[#1f1f1f]">Audit trail</h2>
            <p className="mt-1 text-sm text-[#8b8b8b]">POPIA access and change review.</p>
          </button>
        </section>
      </div>
    </main>
  );
}

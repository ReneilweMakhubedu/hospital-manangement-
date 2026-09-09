import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BedDouble,
  Building2,
  Clock,
  LoaderCircle,
  Pill,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch, getRole } from '../auth';
import { brand } from '../brand';

const KPI_META = [
  { key: 'bedOccupancy', label: 'Bed occupancy', suffix: '%', icon: BedDouble, tone: 'text-[#e41e1f]' },
  { key: 'avgWaitMinutes', label: 'Avg wait (min)', icon: Clock, tone: 'text-[#8b8b8b]' },
  { key: 'queueDepth', label: 'Queue depth', icon: Users, tone: 'text-[#e41e1f]' },
  { key: 'openComplaints', label: 'Open complaints', icon: AlertTriangle, tone: 'text-[#e41e1f]' },
  { key: 'pharmacyLowStock', label: 'Pharmacy low-stock', icon: Pill, tone: 'text-orange-700' },
  { key: 'theatreUtilisation', label: 'Theatre utilisation', suffix: '%', icon: Building2, tone: 'text-[#e41e1f]' },
  { key: 'hrVacancyGap', label: 'HR vacancy gap', icon: Users, tone: 'text-[#1f1f1f]' },
  { key: 'criticalVacancies', label: 'Critical vacancies', icon: AlertTriangle, tone: 'text-[#e41e1f]' },
];

function pick(kpis, keys) {
  for (const key of keys) {
    if (kpis[key] != null) return kpis[key];
  }
  return null;
}

export default function MonitoringKpis() {
  const navigate = useNavigate();
  const role = getRole();
  const isAdmin = role === 'admin';

  const [kpis, setKpis] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/monitoring/kpis', { navigate });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to load KPIs');
      setKpis(data.kpis || data);
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

  const values = {
    bedOccupancy: pick(kpis, ['bedOccupancy', 'bedOccupancyPercent', 'beds']),
    avgWaitMinutes: pick(kpis, ['avgWaitMinutes', 'averageWaitMinutes', 'waitTime']),
    queueDepth: pick(kpis, ['queueDepth', 'queueLength', 'queue']),
    openComplaints: pick(kpis, ['openComplaints', 'complaintsOpen', 'complaints']),
    pharmacyLowStock: pick(kpis, ['pharmacyLowStock', 'lowStock', 'pharmacy']),
    theatreUtilisation: pick(kpis, ['theatreUtilisation', 'theatreUtilisationPercent', 'theatre']),
    hrVacancyGap: pick(kpis, ['hrVacancyGap', 'vacancyGap', 'hr']),
    criticalVacancies: pick(kpis, ['criticalVacancies', 'criticalPosts']),
  };

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
              {brand.shortName} · Monitoring &amp; Evaluation
            </p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold tracking-tight">
              <Activity className="h-8 w-8 text-[#e41e1f]" />
              M&amp;E operational KPIs
            </h1>
            <p className="mt-2 text-[#8b8b8b]">
              Sustained view of bed occupancy, waits, queue, complaints, pharmacy, theatre, and HR.
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
          <p role="alert" className="mb-6 rounded-lg bg-[#f8f8f8] px-4 py-3 text-sm text-[#e41e1f]">
            {status.message}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoaderCircle className="animate-spin text-[#e41e1f]" size={32} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KPI_META.map((meta) => {
              const raw = values[meta.key];
              const display =
                raw == null || raw === ''
                  ? '—'
                  : `${typeof raw === 'number' ? Math.round(raw * 10) / 10 : raw}${
                      meta.suffix && raw != null && raw !== '' ? meta.suffix : ''
                    }`;
              return (
                <div
                  key={meta.key}
                  className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
                    <meta.icon className={`h-4 w-4 ${meta.tone}`} />
                    {meta.label}
                  </div>
                  <p className={`mt-4 text-3xl font-bold ${meta.tone}`}>{display}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

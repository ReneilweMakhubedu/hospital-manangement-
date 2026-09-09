import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, RefreshCw, Wallet } from 'lucide-react';

import { apiFetch } from '../../auth';
import PharmacyLayout from './PharmacyLayout';

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

function genericRate(period) {
  const g = Number(period.genericDispenseCount ?? 0);
  const b = Number(period.brandDispenseCount ?? 0);
  const total = g + b;
  if (period.genericDispensingRate != null) return `${period.genericDispensingRate}%`;
  if (total === 0) return '—';
  return `${Math.round((g / total) * 100)}%`;
}

export default function PharmacyFinance() {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState([]);
  const [summary, setSummary] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/pharmacy/finance-panel', { navigate });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Unable to load pharmacy finance panel');
      const list = Array.isArray(json) ? json : json.periods || json.items || [];
      setPeriods(list);
      setSummary(json.kpis || json.summary || json.finance || {});
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

  const latest = periods[0] || {};
  const costAvoidance =
    summary.costAvoidanceTotal ??
    periods.reduce((sum, p) => sum + Number(p.costAvoidanceAmount || 0), 0);
  const paymentCycle =
    summary.avgPaymentCycleDays ?? latest.avgPaymentCycleDays ?? '—';
  const pending =
    summary.pendingInvoices ?? latest.invoicePendingCount ?? 0;
  const rate =
    summary.genericDispensingRate != null
      ? `${summary.genericDispensingRate}%`
      : genericRate(latest);

  return (
    <PharmacyLayout
      title="Pharmacy financial"
      subtitle="Medicine spend versus budget, generic dispensing, payment cycle, and cost avoidance."
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
        <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8f8f8] text-[#e41e1f]">
            <Wallet size={18} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
            Latest actual spend
          </p>
          <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">
            {formatMoney(latest.actualSpend)}
          </p>
          <p className="mt-1 text-sm text-[#8b8b8b]">
            Budget {formatMoney(latest.budgetAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
            Cost avoidance
          </p>
          <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">{formatMoney(costAvoidance)}</p>
        </div>
        <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
            Generic rate
          </p>
          <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">{rate}</p>
        </div>
        <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
            Payment cycle
          </p>
          <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">
            {paymentCycle === '—' ? '—' : `${paymentCycle} days`}
          </p>
          <p className="mt-1 text-sm text-[#8b8b8b]">{pending} invoices pending</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
          <h2 className="font-bold text-[#1f1f1f]">Finance periods</h2>
        </div>
        {loading && periods.length === 0 ? (
          <div className="flex items-center gap-2 px-5 py-10 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={18} /> Loading finance periods…
          </div>
        ) : periods.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#8b8b8b]">No pharmacy finance periods yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-[#8b8b8b]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Period</th>
                  <th className="px-5 py-3 font-semibold">Budget</th>
                  <th className="px-5 py-3 font-semibold">Actual</th>
                  <th className="px-5 py-3 font-semibold">Variance</th>
                  <th className="px-5 py-3 font-semibold">Generic rate</th>
                  <th className="px-5 py-3 font-semibold">Payment cycle</th>
                  <th className="px-5 py-3 font-semibold">Pending invoices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25">
                {periods.map((period) => {
                  const budget = Number(period.budgetAmount || 0);
                  const actual = Number(period.actualSpend || 0);
                  const variance =
                    period.variance != null ? Number(period.variance) : budget - actual;
                  return (
                    <tr key={period.id || period._id || period.periodLabel}>
                      <td className="px-5 py-3 font-medium text-[#1f1f1f]">
                        {period.periodLabel || '—'}
                      </td>
                      <td className="px-5 py-3 text-[#1f1f1f]">{formatMoney(budget)}</td>
                      <td className="px-5 py-3 text-[#1f1f1f]">{formatMoney(actual)}</td>
                      <td className="px-5 py-3 font-semibold text-[#e41e1f]">
                        {formatMoney(variance)}
                      </td>
                      <td className="px-5 py-3 text-[#1f1f1f]">{genericRate(period)}</td>
                      <td className="px-5 py-3 text-[#8b8b8b]">
                        {period.avgPaymentCycleDays != null
                          ? `${period.avgPaymentCycleDays} days`
                          : '—'}
                      </td>
                      <td className="px-5 py-3 text-[#1f1f1f]">
                        {period.invoicePendingCount ?? 0}
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

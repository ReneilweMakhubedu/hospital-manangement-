import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  FileBarChart2,
  FileText,
  LoaderCircle,
  RefreshCw,
  ShoppingBag,
  Wallet,
} from 'lucide-react';

import { apiFetch } from '../../auth';
import ProcurementLayout from './ProcurementLayout';

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

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8f8f8] text-[#e41e1f]">
        <Icon size={18} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">{value}</p>
      {detail && <p className="mt-1 text-sm text-[#8b8b8b]">{detail}</p>}
    </div>
  );
}

export default function ProcurementReports() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/procurement/reports/summary', { navigate });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Unable to load procurement reports');
      setData(json);
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

  const byCategory = Array.isArray(data?.spendByCategory)
    ? data.spendByCategory
    : Array.isArray(data?.byCategory)
      ? data.byCategory
      : [];

  const statusRows =
    data?.tenderStatusCounts ||
    data?.statusDistribution ||
    data?.tendersByStatus ||
    {};

  return (
    <ProcurementLayout
      title="Procurement reports"
      subtitle="Tender pipeline, supplier performance, spend, savings, and risk exposure."
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

      {loading && !data ? (
        <div className="flex justify-center py-16 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={28} />
        </div>
      ) : (
        <>
          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={FileText}
              label="Active tenders"
              value={data?.activeTenders ?? data?.tenderCount ?? 0}
              detail={`Pipeline ${formatMoney(data?.tenderValueTotal ?? data?.pipelineValue)}`}
            />
            <StatCard
              icon={FileBarChart2}
              label="Awards"
              value={data?.awardedCount ?? data?.awards ?? 0}
              detail={`Pending ${data?.pendingCount ?? 0}`}
            />
            <StatCard
              icon={ShoppingBag}
              label="Avg vendor score"
              value={data?.avgVendorScore != null ? data.avgVendorScore : '—'}
              detail="Supplier scorecards"
            />
            <StatCard
              icon={Wallet}
              label="Spend"
              value={formatMoney(data?.totalSpend ?? data?.spendTotal)}
              detail={`Savings ${formatMoney(data?.procurementSavings ?? data?.totalSavings)}`}
            />
            <StatCard
              icon={AlertTriangle}
              label="Open risk alerts"
              value={data?.riskAlertCount ?? data?.openAlerts ?? 0}
              detail={`Compliance ${
                data?.complianceRateHint != null ? `${data.complianceRateHint}%` : '—'
              }`}
            />
            <StatCard
              icon={FileBarChart2}
              label="Contracts"
              value={data?.contractCount ?? data?.activeContracts ?? 0}
              detail={`Ledger events ${data?.ledgerEventCount ?? 0}`}
            />
          </section>

          <section className="mb-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Tender status</h2>
              </div>
              {Object.keys(statusRows).length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No tender status summary.</p>
              ) : (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {Object.entries(statusRows).map(([key, count]) => (
                    <li
                      key={key}
                      className="flex items-center justify-between px-5 py-3 text-sm"
                    >
                      <span className="font-medium text-[#1f1f1f]">{key}</span>
                      <span className="font-semibold text-[#e41e1f]">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Spend by category</h2>
              </div>
              {byCategory.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No category spend summary.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Category</th>
                        <th className="px-5 py-3 font-semibold">Amount</th>
                        <th className="px-5 py-3 font-semibold">Savings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8b8b8b]/25">
                      {byCategory.map((row) => (
                        <tr key={row.category || row.name}>
                          <td className="px-5 py-3 font-medium text-[#1f1f1f]">
                            {row.category || row.name || '—'}
                          </td>
                          <td className="px-5 py-3">
                            {formatMoney(row.amount ?? row.total)}
                          </td>
                          <td className="px-5 py-3 text-[#e41e1f]">
                            {formatMoney(row.savings ?? row.savingsAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </ProcurementLayout>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  FileText,
  Gavel,
  LoaderCircle,
  RefreshCw,
  ShoppingBag,
  Sparkles,
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

function StatCard({ icon: Icon, label, value, detail, to, accent }) {
  const content = (
    <>
      <div
        className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${
          accent || 'bg-[#f8f8f8] text-[#e41e1f]'
        }`}
      >
        <Icon size={18} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">{value}</p>
      {detail && <p className="mt-1 text-sm text-[#8b8b8b]">{detail}</p>}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#8b8b8b]/40 hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">{content}</div>;
}

export default function ProcurementDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/procurement/dashboard', { navigate });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Unable to load procurement dashboard');
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

  const alerts = Array.isArray(data?.openAlerts)
    ? data.openAlerts
    : Array.isArray(data?.alerts)
      ? data.alerts
      : [];
  const recentTenders = Array.isArray(data?.recentTenders) ? data.recentTenders : [];
  const recentInsights = Array.isArray(data?.recentInsights) ? data.recentInsights : [];
  const statusDistribution = data?.statusDistribution || {};

  return (
    <ProcurementLayout
      title="Procurement control dashboard"
      subtitle="Active tenders, supplier scores, savings, risk alerts, and Procurement assistant insights."
      actions={
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] hover:border-[#8b8b8b]/40 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <StatusBanner status={status} />

      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 py-20 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={20} /> Loading dashboard…
        </div>
      ) : (
        <>
          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={FileText}
              label="Active tenders"
              value={data?.activeTenders ?? 0}
              detail={`Pipeline value ${formatMoney(data?.tenderValueTotal)}`}
              to="/procurement/tenders"
            />
            <StatCard
              icon={Gavel}
              label="Awarded / pending"
              value={`${data?.awardedCount ?? 0} / ${data?.pendingCount ?? 0}`}
              detail="Awards vs open evaluations"
              to="/procurement/bids"
              accent="bg-[#f8f8f8] text-[#e41e1f]"
            />
            <StatCard
              icon={ShoppingBag}
              label="Avg vendor score"
              value={data?.avgVendorScore != null ? data.avgVendorScore : '—'}
              detail="Supplier scorecards"
              to="/procurement/suppliers"
            />
            <StatCard
              icon={Wallet}
              label="Procurement savings"
              value={formatMoney(data?.procurementSavings)}
              detail={`Compliance hint ${data?.complianceRateHint != null ? `${data.complianceRateHint}%` : '—'}`}
              to="/procurement/spend"
              accent="bg-[#f5f5f5] text-[#1f1f1f]"
            />
            <StatCard
              icon={AlertTriangle}
              label="Open risk alerts"
              value={data?.riskAlertCount ?? 0}
              detail="Supplier and bid risk"
              to="/procurement/alerts"
              accent="bg-[#f8f8f8] text-[#8b8b8b]"
            />
            <StatCard
              icon={Sparkles}
              label="Integrity ledger events"
              value={data?.ledgerEventCount ?? 0}
              detail="Hash-chained audit events"
              to="/procurement/ledger"
            />
          </section>

          <section className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-1">
              <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold text-[#1f1f1f]">
                  <AlertTriangle size={18} className="text-amber-600" /> Risk alerts
                </h2>
              </div>
              {alerts.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No open procurement alerts.</p>
              ) : (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {alerts.map((alert, idx) => (
                    <li key={alert.id || idx} className="px-5 py-3 text-sm text-[#1f1f1f]">
                      <p className="font-medium text-[#1f1f1f]">
                        {typeof alert === 'string' ? alert : alert.title || alert.message || 'Alert'}
                      </p>
                      {alert.severity && (
                        <p className="mt-0.5 text-xs uppercase tracking-wide text-[#8b8b8b]">
                          {alert.severity}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Tender status mix</h2>
                <Link to="/procurement/tenders" className="text-sm font-semibold text-[#e41e1f] hover:underline">
                  Open tenders
                </Link>
              </div>
              {Object.keys(statusDistribution).length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No status distribution yet.</p>
              ) : (
                <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(statusDistribution).map(([key, count]) => (
                    <div key={key} className="rounded-xl border border-[#8b8b8b]/20 bg-[#f8f8f8] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">{key}</p>
                      <p className="mt-1 text-xl font-bold text-[#1f1f1f]">{count}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="mb-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="flex items-center justify-between border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Recent tenders</h2>
                <Link
                  to="/procurement/tenders"
                  className="text-sm font-semibold text-[#e41e1f] hover:underline"
                >
                  Manage tenders
                </Link>
              </div>
              {recentTenders.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No recent tenders.</p>
              ) : (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {recentTenders.map((t) => (
                    <li
                      key={t.id || t.referenceNumber}
                      className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                    >
                      <div>
                        <p className="font-medium text-[#1f1f1f]">
                          {t.title || t.referenceNumber || 'Tender'}
                        </p>
                        <p className="text-xs text-[#8b8b8b]">
                          {t.referenceNumber || '—'} · {t.status || 'DRAFT'} · {t.category || '—'}
                        </p>
                      </div>
                      <p className="font-semibold text-[#e41e1f]">
                        {formatMoney(t.estimatedValue)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="flex items-center justify-between border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Procurement assistant</h2>
                <Link
                  to="/procurement/insights"
                  className="text-sm font-semibold text-[#e41e1f] hover:underline"
                >
                  View insights
                </Link>
              </div>
              {recentInsights.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No assistant insights yet.</p>
              ) : (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {recentInsights.map((insight) => (
                    <li key={insight.id || insight.title} className="px-5 py-3">
                      <p className="font-medium text-[#1f1f1f]">{insight.title || 'Insight'}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-[#8b8b8b]">
                        {insight.body || insight.detail || '—'}
                      </p>
                      <p className="mt-1 text-xs text-[#8b8b8b]">
                        {insight.insightType || 'RECOMMENDATION'}
                        {insight.confidence != null ? ` · confidence ${insight.confidence}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/procurement/tenders', label: 'Tenders' },
              { to: '/procurement/bids', label: 'Bids' },
              { to: '/procurement/suppliers', label: 'Suppliers' },
              { to: '/procurement/contracts', label: 'Contracts' },
              { to: '/procurement/spend', label: 'Spend & analytics' },
              { to: '/procurement/ledger', label: 'Integrity ledger' },
              { to: '/procurement/alerts', label: 'Risk alerts' },
              { to: '/procurement/reports', label: 'Reports' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-xl border border-[#8b8b8b]/30 bg-[#ffffff] px-4 py-3 text-sm font-semibold text-[#e41e1f] shadow-sm hover:border-[#8b8b8b]/40"
              >
                {link.label}
              </Link>
            ))}
          </section>
        </>
      )}
    </ProcurementLayout>
  );
}

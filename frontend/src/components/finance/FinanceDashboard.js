import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Landmark,
  LoaderCircle,
  Receipt,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  Wallet,
} from 'lucide-react';

import { apiFetch } from '../../auth';
import FinanceLayout from './FinanceLayout';

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

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/finance/dashboard', { navigate });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Unable to load finance dashboard');
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

  const alerts = Array.isArray(data?.alerts) ? data.alerts : [];
  const debtByCategory = Array.isArray(data?.debtByCategory) ? data.debtByCategory : [];
  const recentInvoices = Array.isArray(data?.recentInvoices) ? data.recentInvoices : [];
  const recentRequisitions = Array.isArray(data?.recentRequisitions) ? data.recentRequisitions : [];

  return (
    <FinanceLayout
      title="Finance executive dashboard"
      subtitle="Budget vs actual, revenue, debtors, irregular expenditure, and recent activity."
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
          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Landmark}
              label="Budget total"
              value={formatMoney(data?.budgetTotal)}
              detail={`Commitments ${formatMoney(data?.commitmentTotal)}`}
              to="/finance/cost-centres"
            />
            <StatCard
              icon={Wallet}
              label="Actual spend"
              value={formatMoney(data?.actualTotal)}
              detail={`Underspend ${formatMoney(data?.underspendAmount)} (${data?.underspendPercent ?? 0}%)`}
              to="/finance/budget"
              accent="bg-[#f8f8f8] text-[#e41e1f]"
            />
            <StatCard
              icon={TrendingDown}
              label="Underspend"
              value={formatMoney(data?.underspendAmount)}
              detail={`${data?.underspendPercent ?? 0}% of budget remaining`}
              to="/finance/budget"
            />
            <StatCard
              icon={Receipt}
              label="Revenue collected"
              value={formatMoney(data?.revenueCollected)}
              detail={`Debtors ${formatMoney(data?.debtorsOutstanding)}`}
              to="/finance/billing"
            />
            <StatCard
              icon={AlertTriangle}
              label="Irregular open"
              value={formatMoney(data?.irregularOpenAmount)}
              detail={`${data?.irregularOpenCount ?? 0} open · fruitless ${formatMoney(data?.fruitlessOpenAmount)}`}
              to="/finance/irregular"
              accent="bg-[#f8f8f8] text-[#8b8b8b]"
            />
            <StatCard
              icon={ShoppingCart}
              label="Cash outflow hint"
              value={formatMoney(data?.cashOutflowDueHint)}
              detail="Open municipal / due outflows"
              to="/finance/procurement"
              accent="bg-[#f5f5f5] text-[#1f1f1f]"
            />
          </section>

          <section className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-1">
              <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold text-[#1f1f1f]">
                  <AlertTriangle size={18} className="text-amber-600" /> Alerts
                </h2>
              </div>
              {alerts.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No active finance alerts.</p>
              ) : (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {alerts.map((alert, idx) => (
                    <li key={idx} className="px-5 py-3 text-sm text-[#1f1f1f]">
                      {typeof alert === 'string' ? alert : alert.message || alert.title || 'Alert'}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Debt by category</h2>
                <Link to="/finance/billing" className="text-sm font-semibold text-[#e41e1f] hover:underline">
                  Open billing
                </Link>
              </div>
              {debtByCategory.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No debtor balances recorded.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Category</th>
                        <th className="px-5 py-3 font-semibold">Amount</th>
                        <th className="px-5 py-3 font-semibold">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8b8b8b]/25">
                      {debtByCategory.map((row) => (
                        <tr key={row.category || row.name}>
                          <td className="px-5 py-3 font-medium text-[#1f1f1f]">
                            {row.category || row.name || '—'}
                          </td>
                          <td className="px-5 py-3">{formatMoney(row.amount)}</td>
                          <td className="px-5 py-3 text-[#8b8b8b]">{row.percent ?? 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="mb-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="flex items-center justify-between border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Recent invoices</h2>
                <Link to="/finance/billing" className="text-sm font-semibold text-[#e41e1f] hover:underline">
                  Manage invoices
                </Link>
              </div>
              {recentInvoices.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No recent invoices.</p>
              ) : (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {recentInvoices.map((inv) => (
                    <li
                      key={inv.id || inv._id || inv.referenceNumber}
                      className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                    >
                      <div>
                        <p className="font-medium text-[#1f1f1f]">
                          {inv.patientName || inv.referenceNumber || 'Invoice'}
                        </p>
                        <p className="text-xs text-[#8b8b8b]">
                          {inv.referenceNumber || '—'} · {inv.status || 'DRAFT'}
                        </p>
                      </div>
                      <p className="font-semibold text-[#e41e1f]">{formatMoney(inv.amount)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="flex items-center justify-between border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Procurement</h2>
                <Link
                  to="/finance/procurement"
                  className="text-sm font-semibold text-[#e41e1f] hover:underline"
                >
                  Open portal note
                </Link>
              </div>
              {recentRequisitions.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">
                  Supplier tenders and contracts are managed in the Procurement portal.
                </p>
              ) : (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {recentRequisitions.map((req) => (
                    <li
                      key={req.id || req._id || req.referenceNumber}
                      className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                    >
                      <div>
                        <p className="font-medium text-[#1f1f1f]">
                          {req.description || req.referenceNumber || 'Requisition'}
                        </p>
                        <p className="text-xs text-[#8b8b8b]">
                          {req.department || '—'} · {req.status || 'DRAFT'}
                        </p>
                      </div>
                      <p className="font-semibold text-[#e41e1f]">
                        {formatMoney(req.estimatedAmount)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/finance/billing', label: 'Billing & revenue' },
              { to: '/finance/procurement', label: 'Procurement portal' },
              { to: '/finance/budget', label: 'Budget forecasts' },
              { to: '/finance/accounting', label: 'Fixed assets' },
              { to: '/finance/irregular', label: 'Irregular expenditure' },
              { to: '/finance/cost-centres', label: 'Cost centres' },
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
    </FinanceLayout>
  );
}

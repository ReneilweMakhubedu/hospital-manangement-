import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  HeartPulse,
  LoaderCircle,
  Package,
  RefreshCw,
  Timer,
  Wallet,
} from 'lucide-react';

import { brand } from '../../brand';
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

function formatMinutes(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  if (n >= 60) {
    const h = Math.floor(n / 60);
    const m = Math.round(n % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.round(n)} min`;
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

function StatCard({ icon: Icon, label, value, detail, to }) {
  const content = (
    <>
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8f8f8] text-[#e41e1f]">
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

function DomainSection({ title, to, children }) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#1f1f1f]">{title}</h2>
        {to && (
          <Link to={to} className="text-sm font-semibold text-[#e41e1f] hover:underline">
            Open
          </Link>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}

export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/pharmacy/dashboard', { navigate });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Unable to load pharmacy dashboard');
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

  const ops = data?.operations || {};
  const clinical = data?.clinical || {};
  const finance = data?.finance || {};
  const inventory = data?.inventory || {};
  const spend = finance.spendVsBudget || finance.spend || {};
  const alerts = Array.isArray(data?.recentAlerts) ? data.recentAlerts : [];
  const criticalAvail = inventory.criticalAvailableCount ?? inventory.criticalAvailable;
  const criticalTotal = inventory.criticalTotal;

  return (
    <PharmacyLayout
      title="Pharmacy command centre"
      subtitle={`${brand.hospital}: shorten multi-hour dispense waits, cut stockouts, and keep clinical and finance controls visible in one place.`}
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
          <DomainSection title="Operations" to="/pharmacy/operations">
            <StatCard
              icon={Timer}
              label="Avg processing time"
              value={formatMinutes(ops.avgProcessingMinutes)}
              detail="Ticket start to complete"
              to="/pharmacy/operations"
            />
            <StatCard
              icon={Timer}
              label="Queue wait"
              value={formatMinutes(ops.avgWaitMinutes)}
              detail={`${ops.queueWaiting ?? 0} waiting`}
              to="/pharmacy/operations"
            />
            <StatCard
              icon={Timer}
              label="STAT turnaround"
              value={formatMinutes(ops.statTurnaroundMinutes)}
              detail="Priority scripts"
              to="/pharmacy/operations"
            />
            <StatCard
              icon={Timer}
              label="Productivity"
              value={
                ops.scriptsPerTechnicianHour != null
                  ? `${ops.scriptsPerTechnicianHour}/h`
                  : '—'
              }
              detail="Scripts per technician hour"
              to="/pharmacy/operations"
            />
          </DomainSection>

          <DomainSection title="Clinical quality" to="/pharmacy/clinical">
            <StatCard
              icon={HeartPulse}
              label="Interventions"
              value={clinical.interventionCount ?? 0}
              detail="Logged clinical actions"
              to="/pharmacy/clinical"
            />
            <StatCard
              icon={HeartPulse}
              label="AMS"
              value={clinical.amsCount ?? 0}
              detail="Antimicrobial stewardship"
              to="/pharmacy/clinical"
            />
            <StatCard
              icon={HeartPulse}
              label="Formulary adherence"
              value={
                clinical.formularyAdherencePercent != null
                  ? `${clinical.formularyAdherencePercent}%`
                  : '—'
              }
              detail="Formulary alignment"
              to="/pharmacy/clinical"
            />
            <StatCard
              icon={HeartPulse}
              label="Good catches"
              value={clinical.goodCatchCount ?? 0}
              detail="Safety interventions"
              to="/pharmacy/clinical"
            />
          </DomainSection>

          <DomainSection title="Financial" to="/pharmacy/finance">
            <StatCard
              icon={Wallet}
              label="Spend vs budget"
              value={formatMoney(spend.actual ?? spend.actualSpend)}
              detail={`Budget ${formatMoney(spend.budget ?? spend.budgetAmount)} · Var ${formatMoney(spend.variance)}`}
              to="/pharmacy/finance"
            />
            <StatCard
              icon={Wallet}
              label="Cost avoidance"
              value={formatMoney(finance.costAvoidanceTotal)}
              detail="From clinical interventions"
              to="/pharmacy/finance"
            />
            <StatCard
              icon={Wallet}
              label="Generic rate"
              value={
                finance.genericDispensingRate != null
                  ? `${finance.genericDispensingRate}%`
                  : '—'
              }
              detail="Generic vs brand dispense"
              to="/pharmacy/finance"
            />
            <StatCard
              icon={Wallet}
              label="Payment cycle"
              value={
                finance.avgPaymentCycleDays != null
                  ? `${finance.avgPaymentCycleDays} days`
                  : '—'
              }
              detail={`${finance.pendingInvoices ?? 0} invoices pending`}
              to="/pharmacy/finance"
            />
          </DomainSection>

          <DomainSection title="Inventory & supply" to="/pharmacy/inventory">
            <StatCard
              icon={Package}
              label="Stockouts"
              value={inventory.stockoutCount ?? 0}
              detail="Zero-stock lines"
              to="/pharmacy/inventory"
            />
            <StatCard
              icon={Package}
              label="Near expiry"
              value={inventory.nearExpiryCount ?? 0}
              detail="Within 90 days"
              to="/pharmacy/inventory"
            />
            <StatCard
              icon={Package}
              label="Critical availability"
              value={
                criticalTotal != null
                  ? `${criticalAvail ?? 0}/${criticalTotal}`
                  : criticalAvail ?? '—'
              }
              detail="Essential medicines in stock"
              to="/pharmacy/inventory"
            />
            <StatCard
              icon={Package}
              label="Low stock"
              value={inventory.lowStockCount ?? 0}
              detail="At or below reorder"
              to="/pharmacy/inventory"
            />
          </DomainSection>

          <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
            <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="flex items-center gap-2 font-bold text-[#1f1f1f]">
                <AlertTriangle size={18} className="text-[#e41e1f]" /> Recent alerts
              </h2>
            </div>
            {alerts.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#8b8b8b]">No pharmacy alerts right now.</p>
            ) : (
              <ul className="divide-y divide-[#8b8b8b]/25">
                {alerts.map((alert, idx) => (
                  <li key={alert.id || idx} className="px-5 py-3 text-sm text-[#1f1f1f]">
                    {typeof alert === 'string' ? alert : alert.title || alert.message || 'Alert'}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { to: '/pharmacy/operations', label: 'Operations queue' },
              { to: '/pharmacy/clinical', label: 'Clinical quality' },
              { to: '/pharmacy/finance', label: 'Financial panel' },
              { to: '/pharmacy/inventory', label: 'Inventory & supply' },
              { to: '/pharmacy/dispense', label: 'Dispense desk' },
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
    </PharmacyLayout>
  );
}

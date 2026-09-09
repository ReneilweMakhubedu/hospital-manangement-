import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, LoaderCircle, Package, RefreshCw } from 'lucide-react';

import { apiFetch } from '../../auth';
import PharmacyLayout from './PharmacyLayout';

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 2,
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

function Badge({ children, tone = 'muted' }) {
  const className =
    tone === 'accent'
      ? 'bg-[#f8f8f8] text-[#e41e1f]'
      : tone === 'ink'
        ? 'bg-[#f5f5f5] text-[#1f1f1f]'
        : 'bg-[#f5f5f5] text-[#8b8b8b]';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function isStockout(medicine) {
  if (medicine.stockout === true || medicine.isStockout === true) return true;
  return Number(medicine.quantity) === 0;
}

function isNearExpiry(medicine) {
  if (medicine.nearExpiry === true || medicine.isNearExpiry === true) return true;
  if (!medicine.expiryDate) return false;
  const expiry = new Date(medicine.expiryDate);
  if (Number.isNaN(expiry.getTime())) return false;
  const limit = new Date();
  limit.setDate(limit.getDate() + 90);
  return expiry <= limit;
}

function isCritical(medicine) {
  return Boolean(medicine.criticalEssential || medicine.critical || medicine.isCritical);
}

function isLowStock(medicine) {
  if (medicine.lowStock === true) return true;
  const qty = Number(medicine.quantity);
  const reorder = Number(medicine.reorderLevel);
  if (Number.isNaN(qty) || Number.isNaN(reorder)) return false;
  return qty > 0 && qty <= reorder;
}

export default function PharmacyInventory() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/pharmacy/inventory-panel', { navigate });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Unable to load pharmacy inventory');
      const stock = Array.isArray(json)
        ? json
        : json.medicines || json.stock || json.items || [];
      setMedicines(stock);
      setSuppliers(
        Array.isArray(json.suppliers)
          ? json.suppliers
          : Array.isArray(json.supplierScores)
            ? json.supplierScores
            : []
      );
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

  const lowStock = medicines.filter(isLowStock);
  const stockouts = medicines.filter(isStockout).length;
  const nearExpiry = medicines.filter(isNearExpiry).length;
  const criticalTotal = medicines.filter(isCritical).length;
  const criticalAvailable = medicines.filter((m) => isCritical(m) && !isStockout(m)).length;

  return (
    <PharmacyLayout
      title="Inventory & supply"
      subtitle="Stock status, near-expiry and critical lines, plus supplier scorecards."
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
            <Package size={18} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">Stockouts</p>
          <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">{stockouts}</p>
        </div>
        <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">Near expiry</p>
          <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">{nearExpiry}</p>
        </div>
        <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
            Critical available
          </p>
          <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">
            {criticalTotal > 0 ? `${criticalAvailable}/${criticalTotal}` : criticalAvailable}
          </p>
        </div>
        <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">Low stock</p>
          <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">{lowStock.length}</p>
        </div>
      </section>

      {lowStock.length > 0 && (
        <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#f8f8f8] p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-[#1f1f1f]">
            <AlertTriangle size={18} className="text-[#e41e1f]" />
            Low stock
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.map((medicine) => (
              <li
                key={medicine.id || medicine._id}
                className="rounded-lg border border-[#8b8b8b]/30 bg-[#ffffff] px-3 py-2 text-sm"
              >
                <span className="font-semibold text-[#1f1f1f]">{medicine.name}</span>{' '}
                <span className="text-[#8b8b8b]">{medicine.strength}</span>
                <span className="mt-1 block font-semibold text-[#e41e1f]">
                  {medicine.quantity} left · reorder at {medicine.reorderLevel}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8 overflow-hidden rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
          <h2 className="font-bold text-[#1f1f1f]">Stock list</h2>
        </div>
        {loading && medicines.length === 0 ? (
          <div className="flex items-center gap-2 px-5 py-10 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={18} /> Loading inventory…
          </div>
        ) : medicines.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#8b8b8b]">No medicines in inventory.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-[#8b8b8b]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Medicine</th>
                  <th className="px-5 py-3 font-semibold">Stock</th>
                  <th className="px-5 py-3 font-semibold">Expiry</th>
                  <th className="px-5 py-3 font-semibold">Supplier</th>
                  <th className="px-5 py-3 font-semibold">Unit cost</th>
                  <th className="px-5 py-3 font-semibold">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25">
                {medicines.map((medicine) => (
                  <tr key={medicine.id || medicine._id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#1f1f1f]">{medicine.name}</p>
                      <p className="text-xs text-[#8b8b8b]">
                        {medicine.strength} · {medicine.form}
                      </p>
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#1f1f1f]">
                      {medicine.quantity}
                      <span className="ml-1 font-normal text-[#8b8b8b]">
                        / reorder {medicine.reorderLevel}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#8b8b8b]">
                      {medicine.expiryDate
                        ? new Date(medicine.expiryDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-[#8b8b8b]">{medicine.supplierName || '—'}</td>
                    <td className="px-5 py-3 text-[#1f1f1f]">{formatMoney(medicine.unitCost)}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {isStockout(medicine) && <Badge tone="accent">Stockout</Badge>}
                        {isNearExpiry(medicine) && <Badge tone="ink">Near expiry</Badge>}
                        {isCritical(medicine) && <Badge tone="accent">Critical</Badge>}
                        {isLowStock(medicine) && <Badge>Low stock</Badge>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
          <h2 className="font-bold text-[#1f1f1f]">Supplier scorecards</h2>
        </div>
        {suppliers.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#8b8b8b]">No supplier scorecards yet.</p>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id || supplier._id || supplier.supplierName}
                className="rounded-xl border border-[#8b8b8b]/30 bg-[#f8f8f8] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-[#1f1f1f]">{supplier.supplierName || '—'}</p>
                  <Badge
                    tone={
                      supplier.riskRating === 'HIGH'
                        ? 'accent'
                        : supplier.riskRating === 'MEDIUM'
                          ? 'ink'
                          : 'muted'
                    }
                  >
                    {supplier.riskRating || 'LOW'}
                  </Badge>
                </div>
                <dl className="mt-3 space-y-1 text-sm text-[#8b8b8b]">
                  <div className="flex justify-between gap-2">
                    <dt>On time</dt>
                    <dd className="font-semibold text-[#1f1f1f]">
                      {supplier.onTimePercent != null ? `${supplier.onTimePercent}%` : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Accuracy</dt>
                    <dd className="font-semibold text-[#1f1f1f]">
                      {supplier.orderAccuracyPercent != null
                        ? `${supplier.orderAccuracyPercent}%`
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Payment cycle</dt>
                    <dd className="font-semibold text-[#1f1f1f]">
                      {supplier.paymentCycleDays != null
                        ? `${supplier.paymentCycleDays} days`
                        : '—'}
                    </dd>
                  </div>
                </dl>
                {supplier.notes && (
                  <p className="mt-3 text-xs text-[#8b8b8b]">{supplier.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </PharmacyLayout>
  );
}

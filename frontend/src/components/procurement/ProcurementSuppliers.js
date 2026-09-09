import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Plus, RefreshCw } from 'lucide-react';

import { apiFetch } from '../../auth';
import ProcurementLayout from './ProcurementLayout';

const STATUSES = ['REGISTERED', 'PREQUALIFIED', 'ACTIVE', 'SUSPENDED', 'BLACKLISTED'];
const RISK = ['LOW', 'MEDIUM', 'HIGH'];

const emptyForm = {
  name: '',
  registrationNumber: '',
  csdNumber: '',
  category: '',
  contactEmail: '',
  contactPhone: '',
  status: 'REGISTERED',
  riskRating: 'MEDIUM',
  performanceScore: '70',
  deliveryScore: '70',
  qualityScore: '70',
  costScore: '70',
  complianceScore: '70',
  notes: '',
};

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

function riskStyle(r) {
  const key = (r || '').toUpperCase();
  if (key === 'LOW') return 'bg-[#f8f8f8] text-[#e41e1f]';
  if (key === 'HIGH') return 'bg-[#f8f8f8] text-[#e41e1f]';
  return 'bg-[#f8f8f8] text-[#1f1f1f]';
}

export default function ProcurementSuppliers() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/procurement/vendors', { navigate });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'Unable to load suppliers');
      setVendors(Array.isArray(data) ? data : data.vendors || data.suppliers || []);
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
        name: form.name.trim(),
        registrationNumber: form.registrationNumber.trim() || null,
        csdNumber: form.csdNumber.trim() || null,
        category: form.category.trim(),
        contactEmail: form.contactEmail.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
        status: form.status,
        riskRating: form.riskRating,
        performanceScore: Number(form.performanceScore || 0),
        deliveryScore: Number(form.deliveryScore || 0),
        qualityScore: Number(form.qualityScore || 0),
        costScore: Number(form.costScore || 0),
        complianceScore: Number(form.complianceScore || 0),
        notes: form.notes.trim() || null,
      };
      const path = editingId ? `/procurement/vendors/${editingId}` : '/procurement/vendors';
      const res = await apiFetch(path, {
        navigate,
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save supplier');
      setForm(emptyForm);
      setEditingId(null);
      setStatus({
        type: 'success',
        message: editingId ? 'Supplier updated.' : 'Supplier registered.',
      });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const editVendor = (row) => {
    setEditingId(row.id || row._id);
    setForm({
      name: row.name || '',
      registrationNumber: row.registrationNumber || '',
      csdNumber: row.csdNumber || '',
      category: row.category || '',
      contactEmail: row.contactEmail || '',
      contactPhone: row.contactPhone || '',
      status: row.status || 'REGISTERED',
      riskRating: row.riskRating || 'MEDIUM',
      performanceScore: row.performanceScore ?? '70',
      deliveryScore: row.deliveryScore ?? '70',
      qualityScore: row.qualityScore ?? '70',
      costScore: row.costScore ?? '70',
      complianceScore: row.complianceScore ?? '70',
      notes: row.notes || '',
    });
  };

  const prequalify = async (row) => {
    const id = row.id || row._id;
    if (!id) return;
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch(`/procurement/vendors/${id}/prequalify`, {
        navigate,
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to prequalify supplier');
      setStatus({ type: 'success', message: 'Supplier prequalified.' });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProcurementLayout
      title="Suppliers"
      subtitle="Vendor register, scorecards, prequalification, and risk ratings."
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

      <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1f1f1f]">
          <Plus size={18} className="text-[#e41e1f]" />
          {editingId ? 'Update supplier' : 'Register supplier'}
        </h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Name
            <input
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Registration number
            <input
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            CSD number
            <input
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.csdNumber}
              onChange={(e) => setForm({ ...form, csdNumber: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Category
            <input
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Contact email
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Contact phone
            <input
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Status
            <select
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Risk rating
            <select
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.riskRating}
              onChange={(e) => setForm({ ...form, riskRating: e.target.value })}
            >
              {RISK.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          {[
            ['performanceScore', 'Performance'],
            ['deliveryScore', 'Delivery'],
            ['qualityScore', 'Quality'],
            ['costScore', 'Cost'],
            ['complianceScore', 'Compliance'],
          ].map(([key, label]) => (
            <label key={key} className="block text-sm font-semibold text-[#1f1f1f]">
              {label} (1–100)
              <input
                type="number"
                min="1"
                max="100"
                className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
          <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2 lg:col-span-3">
            Notes
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Update supplier' : 'Register supplier'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="rounded-lg border border-[#8b8b8b]/40 px-4 py-2.5 text-sm font-semibold text-[#1f1f1f]"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
          <h2 className="font-bold text-[#1f1f1f]">Supplier scorecards</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-16 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={28} />
          </div>
        ) : vendors.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[#8b8b8b]">No suppliers registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Supplier</th>
                  <th className="px-5 py-3 font-semibold">Status / risk</th>
                  <th className="px-5 py-3 font-semibold">Scorecard</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25">
                {vendors.map((row) => (
                  <tr key={row.id || row._id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#1f1f1f]">{row.name}</p>
                      <p className="text-xs text-[#8b8b8b]">
                        {row.category || '—'} · {row.registrationNumber || '—'} · CSD{' '}
                        {row.csdNumber || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-[#1f1f1f]">{row.status}</p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${riskStyle(
                          row.riskRating
                        )}`}
                      >
                        {row.riskRating || 'MEDIUM'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#8b8b8b]">
                      Perf {row.performanceScore ?? '—'} · Del {row.deliveryScore ?? '—'} · Qual{' '}
                      {row.qualityScore ?? '—'} · Cost {row.costScore ?? '—'} · Comp{' '}
                      {row.complianceScore ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => editVendor(row)}
                          className="text-xs font-semibold text-[#e41e1f] hover:underline"
                        >
                          Edit
                        </button>
                        {row.status !== 'PREQUALIFIED' && row.status !== 'ACTIVE' && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => prequalify(row)}
                            className="text-xs font-semibold text-[#e41e1f] hover:underline"
                          >
                            Prequalify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </ProcurementLayout>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoaderCircle, Plus, Save } from 'lucide-react';

import { apiFetch } from '../../auth';
import DoctorLayout from './DoctorLayout';

const emptyForm = {
  patientId: '',
  orderType: 'LAB',
  testName: '',
  priority: 'ROUTINE',
  clinicalIndication: '',
  providerHint: 'NHLS',
};

const PROVIDERS = ['NHLS', 'Ampath', 'PathCare', 'Other'];

function priorityStyle(p) {
  const u = String(p || '').toUpperCase();
  if (u === 'STAT') return 'bg-red-100 text-[#e41e1f]';
  if (u === 'URGENT') return 'bg-orange-100 text-orange-800';
  return 'bg-[#f5f5f5] text-[#1f1f1f]';
}

function patientLabel(p) {
  return [p.firstName, p.lastName].filter(Boolean).join(' ') || `Patient #${p._id || p.id}`;
}

export default function DoctorOrders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    ...emptyForm,
    patientId: searchParams.get('patientId') || '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(Boolean(searchParams.get('patientId')));
  const [status, setStatus] = useState({ type: '', message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, pRes] = await Promise.all([
        apiFetch('/doctor/orders', { navigate }),
        apiFetch('/doctor/patients-with-appointments', { navigate }),
      ]);
      if (!oRes.ok) {
        const err = await oRes.json().catch(() => ({}));
        throw new Error(err.error || 'Unable to load orders');
      }
      const oData = await oRes.json();
      setOrders(Array.isArray(oData) ? oData : oData.orders || []);
      if (pRes.ok) {
        const pData = await pRes.json();
        setPatients(Array.isArray(pData) ? pData : []);
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch('/doctor/orders', {
        navigate,
        method: 'POST',
        body: JSON.stringify({
          ...form,
          patientId: Number(form.patientId),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to create order');
      setStatus({ type: 'success', message: 'Order created.' });
      setForm({ ...emptyForm, patientId: form.patientId });
      setShowForm(false);
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    'mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#8b8b8b]/200 focus:ring-2 focus:ring-[#e41e1f]';

  return (
    <DoctorLayout
      title="Orders"
      subtitle="Lab and imaging requests with NHLS / Ampath / PathCare provider hints."
      actions={
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f]"
        >
          <Plus size={16} /> New order
        </button>
      }
    >
      {status.message && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 text-sm ${
            status.type === 'error' ? 'bg-[#f8f8f8] text-[#e41e1f]' : 'bg-[#f8f8f8] text-[#e41e1f]'
          }`}
        >
          {status.message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={submit}
          className="mb-6 grid gap-4 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm sm:grid-cols-2"
        >
          <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2">
            Patient
            <select
              name="patientId"
              value={form.patientId}
              onChange={onChange}
              required
              className={fieldClass}
            >
              <option value="">Select patient…</option>
              {patients.map((p) => {
                const id = p._id || p.id;
                return (
                  <option key={id} value={id}>
                    {patientLabel(p)}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Order type
            <select name="orderType" value={form.orderType} onChange={onChange} className={fieldClass}>
              <option value="LAB">LAB</option>
              <option value="IMAGING">IMAGING</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Priority
            <select name="priority" value={form.priority} onChange={onChange} className={fieldClass}>
              <option value="ROUTINE">ROUTINE</option>
              <option value="URGENT">URGENT</option>
              <option value="STAT">STAT</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Test / study name
            <input
              name="testName"
              value={form.testName}
              onChange={onChange}
              required
              className={fieldClass}
              placeholder="e.g. FBC, Chest X-ray"
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Provider hint
            <select
              name="providerHint"
              value={form.providerHint}
              onChange={onChange}
              className={fieldClass}
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2">
            Clinical indication
            <textarea
              name="clinicalIndication"
              value={form.clinicalIndication}
              onChange={onChange}
              rows={3}
              required
              className={fieldClass}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b] sm:col-span-2"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Create order'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={20} /> Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <p className="text-sm text-[#8b8b8b]">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#8b8b8b]/30 bg-[#f8f8f8] text-xs uppercase tracking-wide text-[#8b8b8b]">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Test</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8b8b8b]/25">
              {orders.map((o) => (
                <tr key={o._id || o.id}>
                  <td className="px-4 py-3 font-medium text-[#1f1f1f]">
                    {o.patientName || `Patient #${o.patientId}`}
                  </td>
                  <td className="px-4 py-3">{o.orderType}</td>
                  <td className="px-4 py-3">{o.testName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityStyle(
                        o.priority
                      )}`}
                    >
                      {o.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">{o.providerHint || '—'}</td>
                  <td className="px-4 py-3">{o.status || 'ORDERED'}</td>
                  <td className="px-4 py-3 text-[#8b8b8b]">{o.referenceNumber || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DoctorLayout>
  );
}

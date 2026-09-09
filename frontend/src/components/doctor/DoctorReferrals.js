import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoaderCircle, Plus, Save } from 'lucide-react';

import { apiFetch } from '../../auth';
import DoctorLayout from './DoctorLayout';

const emptyForm = {
  patientId: '',
  toFacility: '',
  toSpecialty: '',
  urgency: 'ROUTINE',
  reason: '',
  clinicalSummary: '',
};

function patientLabel(p) {
  return [p.firstName, p.lastName].filter(Boolean).join(' ') || `Patient #${p._id || p.id}`;
}

export default function DoctorReferrals() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referrals, setReferrals] = useState([]);
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
      const [rRes, pRes] = await Promise.all([
        apiFetch('/doctor/referrals', { navigate }),
        apiFetch('/doctor/patients-with-appointments', { navigate }),
      ]);
      if (!rRes.ok) {
        const err = await rRes.json().catch(() => ({}));
        throw new Error(err.error || 'Unable to load referrals');
      }
      const rData = await rRes.json();
      setReferrals(Array.isArray(rData) ? rData : rData.referrals || []);
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
      const res = await apiFetch('/doctor/referrals', {
        navigate,
        method: 'POST',
        body: JSON.stringify({
          ...form,
          patientId: Number(form.patientId),
          specialty: form.toSpecialty,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to create referral');
      setStatus({ type: 'success', message: 'Referral letter saved.' });
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
      title="Referrals"
      subtitle="Create and track referral letters to other facilities and specialties."
      actions={
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f]"
        >
          <Plus size={16} /> New referral
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
            To facility
            <input
              name="toFacility"
              value={form.toFacility}
              onChange={onChange}
              required
              className={fieldClass}
              placeholder="e.g. Steve Biko Academic Hospital"
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Specialty
            <input
              name="toSpecialty"
              value={form.toSpecialty}
              onChange={onChange}
              required
              className={fieldClass}
              placeholder="e.g. Cardiology"
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Urgency
            <select name="urgency" value={form.urgency} onChange={onChange} className={fieldClass}>
              <option value="ROUTINE">ROUTINE</option>
              <option value="URGENT">URGENT</option>
              <option value="EMERGENCY">EMERGENCY</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Reason
            <input name="reason" value={form.reason} onChange={onChange} required className={fieldClass} />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2">
            Clinical summary
            <textarea
              name="clinicalSummary"
              value={form.clinicalSummary}
              onChange={onChange}
              rows={4}
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
            {saving ? 'Saving…' : 'Save referral'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={20} /> Loading referrals…
        </div>
      ) : referrals.length === 0 ? (
        <p className="text-sm text-[#8b8b8b]">No referral letters yet.</p>
      ) : (
        <ul className="space-y-3">
          {referrals.map((r) => (
            <li
              key={r._id || r.id}
              className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[#1f1f1f]">
                    {r.patientName || `Patient #${r.patientId}`} → {r.toFacility}
                  </p>
                  <p className="mt-1 text-sm text-[#8b8b8b]">
                    {r.toSpecialty || r.specialty}
                    {r.urgency ? ` · ${r.urgency}` : ''}
                    {r.status ? ` · ${r.status}` : ''}
                  </p>
                  <p className="mt-2 text-sm text-[#1f1f1f]">{r.reason}</p>
                  {r.clinicalSummary && (
                    <p className="mt-1 text-sm text-[#8b8b8b] line-clamp-2">{r.clinicalSummary}</p>
                  )}
                </div>
                <span className="text-xs font-semibold text-[#8b8b8b]">
                  {r.referenceNumber || `#${r._id || r.id}`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DoctorLayout>
  );
}

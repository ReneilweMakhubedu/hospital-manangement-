import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarPlus,
  Check,
  Edit2,
  Info,
  LoaderCircle,
  X,
} from 'lucide-react';

import { apiFetch } from '../../auth';
import PatientLayout from './PatientLayout';

const PURPOSES = [
  'General consultation',
  'Follow-up',
  'Chronic care / CCMDD',
  'Antenatal',
  'Specialist referral',
  'Other',
];

const FALLBACK_SLOTS = [
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
];

function urgencyStyle(urgency) {
  const u = (urgency || '').toUpperCase();
  if (u === 'RED') return 'bg-red-100 text-[#e41e1f] border-[#e41e1f]/40';
  if (u === 'ORANGE') return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-[#f8f8f8] text-[#e41e1f] border-[#8b8b8b]/30';
}

function isUpcoming(apt) {
  if (!apt?.date) return false;
  const today = new Date().toISOString().slice(0, 10);
  return apt.date >= today && (apt.status || '').toUpperCase() !== 'CANCELLED';
}

export default function PatientAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState(FALLBACK_SLOTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [showBook, setShowBook] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', time: '' });
  const [bookResult, setBookResult] = useState(null);
  const [form, setForm] = useState({
    purpose: '',
    department: '',
    reason: '',
    date: '',
    doctorId: '',
    time: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aptRes, depRes, docRes] = await Promise.all([
        apiFetch('/patient/my-appointments', { navigate }),
        apiFetch('/patient/departments', { navigate }),
        apiFetch('/doctor/all', { navigate }),
      ]);
      if (aptRes.ok) {
        const data = await aptRes.json();
        setAppointments(Array.isArray(data) ? data : []);
      }
      if (depRes.ok) {
        const data = await depRes.json();
        setDepartments(
          Array.isArray(data)
            ? data.map((d) => (typeof d === 'string' ? d : d.name || d.department)).filter(Boolean)
            : []
        );
      }
      if (docRes.ok) {
        const data = await docRes.json();
        setDoctors(Array.isArray(data) ? data : []);
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

  useEffect(() => {
    if (!form.date) {
      setSlots(FALLBACK_SLOTS);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({ date: form.date });
        if (form.doctorId) params.set('doctorId', form.doctorId);
        const res = await apiFetch(`/patient/available-slots?${params}`, { navigate });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setSlots(Array.isArray(data) && data.length ? data : FALLBACK_SLOTS);
        }
      } catch {
        if (!cancelled) setSlots(FALLBACK_SLOTS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.date, form.doctorId, navigate]);

  const upcoming = useMemo(() => appointments.filter(isUpcoming), [appointments]);
  const past = useMemo(() => appointments.filter((a) => !isUpcoming(a)), [appointments]);

  const onBookChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value, ...(name === 'date' || name === 'doctorId' ? { time: '' } : {}) }));
  };

  const submitBook = async (e) => {
    e.preventDefault();
    if (!form.purpose || !form.department || !form.reason || !form.date || !form.time) {
      setStatus({ type: 'error', message: 'Please complete purpose, department, reason, date, and time.' });
      return;
    }
    setSaving(true);
    setStatus({ type: '', message: '' });
    setBookResult(null);
    try {
      const body = {
        purpose: form.purpose,
        department: form.department,
        reason: form.reason,
        date: form.date,
        time: form.time,
      };
      if (form.doctorId) body.doctorId = Number(form.doctorId) || form.doctorId;
      const res = await apiFetch('/patient/book-appointment', {
        navigate,
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to book appointment');
      const urgency = data.urgency || data.appointment?.urgency;
      setBookResult({ urgency, reference: data.referenceNumber || data.appointment?.referenceNumber });
      setStatus({
        type: 'success',
        message: data.message || 'Appointment booked successfully.',
      });
      setForm({ purpose: '', department: '', reason: '', date: '', doctorId: '', time: '' });
      setShowBook(false);
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleReschedule = async (id) => {
    if (!editForm.date || !editForm.time) {
      setStatus({ type: 'error', message: 'Select a new date and time.' });
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch(`/patient/appointments/${id}/reschedule`, {
        navigate,
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to reschedule');
      setEditingId(null);
      setStatus({ type: 'success', message: 'Appointment rescheduled.' });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment? The slot will open for other patients.')) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/patient/appointments/${id}`, { navigate, method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to cancel');
      setStatus({ type: 'success', message: data.message || 'Appointment cancelled.' });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const renderList = (items, emptyLabel) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center gap-2 py-10 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={18} /> Loading…
        </div>
      );
    }
    if (!items.length) {
      return <p className="px-5 py-8 text-center text-sm text-[#8b8b8b]">{emptyLabel}</p>;
    }
    return (
      <ul className="divide-y divide-[#8b8b8b]/25">
        {items.map((apt) => {
          const id = apt._id || apt.id;
          return (
            <li key={id} className="px-5 py-5">
              {editingId === id ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-[#1f1f1f]">
                      New date
                      <input
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        value={editForm.date}
                        onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm font-semibold text-[#1f1f1f]">
                      New time
                      <select
                        value={editForm.time}
                        onChange={(e) => setEditForm((f) => ({ ...f, time: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                      >
                        <option value="">Select time</option>
                        {FALLBACK_SLOTS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleReschedule(id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#e41e1f] px-3 py-2 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f]"
                    >
                      <Check size={14} /> Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-[#1f1f1f]"
                    >
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#1f1f1f]">
                        {apt.doctorName ? `Dr. ${apt.doctorName}` : apt.department || apt.purpose || 'Appointment'}
                      </p>
                      <p className="text-sm text-[#8b8b8b]">
                        {apt.specialty || apt.department}
                        {apt.purpose ? ` · ${apt.purpose}` : ''}
                      </p>
                      {apt.referenceNumber && (
                        <p className="mt-1 text-xs text-[#8b8b8b]">Ref: {apt.referenceNumber}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#e41e1f]">{apt.date}</p>
                      <p className="text-sm text-[#8b8b8b]">{apt.time}</p>
                      {apt.urgency && apt.urgency !== 'GREEN' && (
                        <span
                          className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${urgencyStyle(
                            apt.urgency
                          )}`}
                        >
                          {apt.urgency} urgency
                        </span>
                      )}
                    </div>
                  </div>
                  {apt.reason && <p className="mt-2 text-sm text-[#8b8b8b]">{apt.reason}</p>}
                  {isUpcoming(apt) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(id);
                          setEditForm({ date: apt.date || '', time: apt.time || '' });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#f8f8f8] px-3 py-2 text-sm font-medium text-[#e41e1f] hover:bg-[#f5f5f5]"
                      >
                        <Edit2 size={14} /> Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#f8f8f8] px-3 py-2 text-sm font-medium text-[#e41e1f] hover:bg-[#f5f5f5]"
                      >
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <PatientLayout
      title="Appointments"
      subtitle="Book, reschedule, or cancel your visits at Rob Ferreira Hospital."
      actions={
        <button
          type="button"
          onClick={() => setShowBook((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f]"
        >
          <CalendarPlus size={16} />
          {showBook ? 'Hide booking form' : 'Book appointment'}
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
          {bookResult?.urgency && bookResult.urgency !== 'GREEN' && (
            <span className={`ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${urgencyStyle(bookResult.urgency)}`}>
              <AlertTriangle size={12} /> {bookResult.urgency} triage
            </span>
          )}
          {bookResult?.reference && (
            <span className="ml-2 text-xs font-medium">Ref {bookResult.reference}</span>
          )}
        </div>
      )}

      <div className="mb-6 flex gap-3 rounded-2xl border border-[#8b8b8b]/30 bg-[#f8f8f8]/80 p-4 text-sm text-[#1f1f1f]">
        <Info className="mt-0.5 shrink-0 text-[#e41e1f]" size={18} />
        <div>
          <p className="font-semibold">Visit preparation tip</p>
          <p className="mt-1 text-[#8b8b8b]">
            Bring your ID, clinic card or previous scripts, and a list of current medicines. Arrive
            15 minutes early for check-in. For chest pain, severe breathing difficulty, heavy bleeding,
            stroke symptoms, or loss of consciousness, go straight to Emergency — do not wait for an
            appointment slot.
          </p>
        </div>
      </div>

      {showBook && (
        <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">Book a visit</h2>
          <form onSubmit={submitBook} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[#1f1f1f]">
              Purpose
              <select
                name="purpose"
                value={form.purpose}
                onChange={onBookChange}
                className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                required
              >
                <option value="">Select purpose</option>
                {PURPOSES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-[#1f1f1f]">
              Department
              <select
                name="department"
                value={form.department}
                onChange={onBookChange}
                className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                required
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2 text-sm font-semibold text-[#1f1f1f]">
              Reason / symptoms
              <textarea
                name="reason"
                value={form.reason}
                onChange={onBookChange}
                rows={3}
                className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                placeholder="Describe why you need to be seen"
                required
              />
            </label>
            <label className="text-sm font-semibold text-[#1f1f1f]">
              Date
              <input
                type="date"
                name="date"
                min={new Date().toISOString().slice(0, 10)}
                value={form.date}
                onChange={onBookChange}
                className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="text-sm font-semibold text-[#1f1f1f]">
              Doctor (optional)
              <select
                name="doctorId"
                value={form.doctorId}
                onChange={onBookChange}
                className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
              >
                <option value="">Any available</option>
                {doctors.map((d) => (
                  <option key={d._id || d.id} value={d._id || d.id}>
                    Dr. {d.firstName} {d.lastName}
                    {d.specialty ? ` — ${d.specialty}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2 text-sm font-semibold text-[#1f1f1f]">
              Available time
              <select
                name="time"
                value={form.time}
                onChange={onBookChange}
                className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                required
              >
                <option value="">Select a slot</option>
                {slots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
              >
                {saving ? 'Booking…' : 'Submit booking'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
          <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
            <h2 className="font-bold text-[#1f1f1f]">Upcoming</h2>
          </div>
          {renderList(upcoming, 'No upcoming appointments.')}
        </section>
        <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
          <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
            <h2 className="font-bold text-[#1f1f1f]">Past</h2>
          </div>
          {renderList(past, 'No past appointments yet.')}
        </section>
      </div>
    </PatientLayout>
  );
}

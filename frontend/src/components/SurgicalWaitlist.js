import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  Plus,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '../auth';
import { brand } from '../brand';

const emptyForm = {
  patientId: '',
  procedure: '',
  specialty: '',
  urgency: 'ROUTINE',
  decisionToTreatDate: '',
  ttgDays: '',
  notes: '',
};

const URGENCY_STYLES = {
  EMERGENCY: 'bg-red-100 text-[#e41e1f]',
  URGENT: 'bg-orange-100 text-orange-800',
  SOON: 'bg-amber-100 text-[#1f1f1f]',
  ROUTINE: 'bg-[#f5f5f5] text-[#1f1f1f]',
};

function isOverdue(entry) {
  if (!entry?.ttgDueDate) return false;
  if (['COMPLETED', 'CANCELLED', 'SCHEDULED'].includes((entry.status || '').toUpperCase())) {
    return Boolean(entry.overdue);
  }
  const due = new Date(entry.ttgDueDate);
  if (Number.isNaN(due.getTime())) return Boolean(entry.overdue);
  return due < new Date(new Date().toDateString()) || Boolean(entry.overdue);
}

export default function SurgicalWaitlist() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    total: 0,
    waiting: 0,
    overdue: 0,
    scheduled: 0,
    completed: 0,
  });
  const [entries, setEntries] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [scheduleDates, setScheduleDates] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, listRes, patientsRes] = await Promise.all([
        apiFetch('/clinical/waitlist/summary', { navigate }),
        apiFetch('/clinical/waitlist', { navigate }),
        apiFetch('/patient/records', { navigate }),
      ]);
      const [summaryData, listData, patientsData] = await Promise.all([
        summaryRes.json().catch(() => ({})),
        listRes.json().catch(() => []),
        patientsRes.json().catch(() => []),
      ]);
      if (!summaryRes.ok) throw new Error(summaryData.error || 'Unable to load waitlist summary');
      if (!listRes.ok) throw new Error(listData.error || 'Unable to load waitlist');
      if (!patientsRes.ok) throw new Error(patientsData.error || 'Unable to load patients');

      setSummary({
        total: summaryData.total ?? 0,
        waiting: summaryData.waiting ?? summaryData.open ?? 0,
        overdue: summaryData.overdue ?? 0,
        scheduled: summaryData.scheduled ?? 0,
        completed: summaryData.completed ?? 0,
      });
      setEntries(Array.isArray(listData) ? listData : listData.entries || []);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setStatus({ type: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const change = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        patientId: form.patientId,
        procedure: form.procedure.trim(),
        specialty: form.specialty.trim(),
        urgency: form.urgency,
        decisionToTreatDate: form.decisionToTreatDate,
        notes: form.notes.trim() || null,
      };
      if (form.ttgDays !== '') payload.ttgDays = Number(form.ttgDays);

      const response = await apiFetch('/clinical/waitlist', {
        method: 'POST',
        navigate,
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to add waitlist entry');
      setForm(emptyForm);
      setStatus({ type: 'success', message: 'Patient added to surgical waitlist.' });
      await loadData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, nextStatus) => {
    setStatus({ type: '', message: '' });
    try {
      const body = { status: nextStatus };
      if (nextStatus === 'SCHEDULED') {
        const scheduledDate = scheduleDates[id];
        if (!scheduledDate) {
          setStatus({ type: 'error', message: 'Choose a scheduled date before marking SCHEDULED.' });
          return;
        }
        body.scheduledDate = scheduledDate;
      }
      const response = await apiFetch(`/clinical/waitlist/${id}`, {
        method: 'PUT',
        navigate,
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to update waitlist entry');
      setStatus({ type: 'success', message: `Entry marked ${nextStatus}.` });
      await loadData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const cards = [
    { label: 'Total', value: summary.total },
    { label: 'Waiting', value: summary.waiting },
    { label: 'Overdue TTG', value: summary.overdue },
    { label: 'Scheduled', value: summary.scheduled },
    { label: 'Completed', value: summary.completed },
  ];

  return (
    <main className="min-h-screen bg-[#f8f8f8] px-5 py-8 text-[#1f1f1f] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate('/admin')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e41e1f] hover:text-[#e41e1f]"
        >
          <ArrowLeft size={16} /> Back to admin
        </button>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#e41e1f]">
              {brand.shortName} · Patient Experience
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Surgical waiting list &amp; TTG
            </h1>
            <p className="mt-2 text-[#8b8b8b]">
              Track decision-to-treat timelines and theatre scheduling readiness.
            </p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2 text-sm font-semibold hover:bg-[#f8f8f8]"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {status.message && (
          <p
            role="alert"
            className={`mb-6 rounded-lg px-4 py-3 text-sm ${
              status.type === 'success'
                ? 'bg-[#f8f8f8] text-[#e41e1f]'
                : 'bg-[#f8f8f8] text-[#e41e1f]'
            }`}
          >
            {status.message}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoaderCircle className="animate-spin text-[#e41e1f]" size={32} />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
                    {card.label}
                  </p>
                  <p className="mt-3 text-2xl font-bold">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-5">
              <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm lg:col-span-2 sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Plus size={18} className="text-[#e41e1f]" /> Add to waitlist
                </h2>
                <form onSubmit={submit} className="mt-4 space-y-4">
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Patient
                    <select
                      required
                      name="patientId"
                      value={form.patientId}
                      onChange={change}
                      className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                    >
                      <option value="">Select patient</option>
                      {patients.map((patient) => (
                        <option key={patient._id} value={patient._id}>
                          {patient.firstName} {patient.lastName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Procedure
                    <input
                      required
                      name="procedure"
                      value={form.procedure}
                      onChange={change}
                      className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Specialty
                    <input
                      required
                      name="specialty"
                      value={form.specialty}
                      onChange={change}
                      className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Urgency
                    <select
                      name="urgency"
                      value={form.urgency}
                      onChange={change}
                      className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                    >
                      <option value="EMERGENCY">Emergency</option>
                      <option value="URGENT">Urgent</option>
                      <option value="SOON">Soon</option>
                      <option value="ROUTINE">Routine</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Decision to treat date
                    <input
                      required
                      type="date"
                      name="decisionToTreatDate"
                      value={form.decisionToTreatDate}
                      onChange={change}
                      className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    TTG days override (optional)
                    <input
                      type="number"
                      min="1"
                      name="ttgDays"
                      value={form.ttgDays}
                      onChange={change}
                      placeholder="e.g. 90"
                      className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Notes
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={change}
                      rows="2"
                      className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                    />
                  </label>
                  <button
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-bold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
                  >
                    {saving && <LoaderCircle size={16} className="animate-spin" />}
                    {saving ? 'Adding…' : 'Add entry'}
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-3">
                <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                  <h2 className="flex items-center gap-2 font-bold">
                    <ClipboardList size={18} className="text-[#e41e1f]" /> Waitlist entries
                  </h2>
                </div>
                {entries.length === 0 ? (
                  <p className="px-5 py-16 text-center text-sm text-[#8b8b8b]">
                    No surgical waitlist entries yet.
                  </p>
                ) : (
                  <div className="divide-y divide-[#8b8b8b]/25">
                    {entries.map((entry) => {
                      const id = entry._id || entry.id;
                      const overdue = isOverdue(entry);
                      const urgency = (entry.urgency || 'ROUTINE').toUpperCase();
                      return (
                        <article key={id} className="px-5 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold">
                                  {entry.patientName || `Patient #${entry.patientId}`}
                                </h3>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                    URGENCY_STYLES[urgency] || URGENCY_STYLES.ROUTINE
                                  }`}
                                >
                                  {urgency}
                                </span>
                                {overdue && (
                                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-[#e41e1f]">
                                    Overdue
                                  </span>
                                )}
                                <span className="rounded-full bg-[#f8f8f8] px-2.5 py-0.5 text-xs font-bold text-[#e41e1f]">
                                  {entry.status || 'WAITING'}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-[#8b8b8b]">
                                {entry.procedure} · {entry.specialty}
                              </p>
                              <p className="mt-1 flex items-center gap-1 text-sm text-[#8b8b8b]">
                                <CalendarClock size={14} />
                                TTG due: {entry.ttgDueDate || '—'}
                                {entry.decisionToTreatDate
                                  ? ` · DTT ${entry.decisionToTreatDate}`
                                  : ''}
                              </p>
                              {entry.notes && (
                                <p className="mt-2 text-sm text-[#8b8b8b]">{entry.notes}</p>
                              )}
                            </div>
                          </div>

                          {(entry.status || 'WAITING') === 'WAITING' ||
                          (entry.status || '').toUpperCase() === 'WAITING' ? (
                            <div className="mt-3 flex flex-wrap items-end gap-2">
                              <label className="text-xs font-semibold text-[#8b8b8b]">
                                Schedule date
                                <input
                                  type="date"
                                  value={scheduleDates[id] || ''}
                                  onChange={(e) =>
                                    setScheduleDates((current) => ({
                                      ...current,
                                      [id]: e.target.value,
                                    }))
                                  }
                                  className="mt-1 block rounded-lg border border-[#8b8b8b]/40 px-2 py-1.5 text-sm"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => updateStatus(id, 'SCHEDULED')}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#e41e1f] px-3 py-1.5 text-xs font-bold text-[#ffffff] hover:bg-[#e41e1f]"
                              >
                                <CalendarClock size={14} /> SCHEDULED
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStatus(id, 'COMPLETED')}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#8b8b8b]/40 bg-[#f8f8f8] px-3 py-1.5 text-xs font-bold text-[#e41e1f]"
                              >
                                <CheckCircle2 size={14} /> COMPLETED
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStatus(id, 'CANCELLED')}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-1.5 text-xs font-bold text-[#1f1f1f]"
                              >
                                <XCircle size={14} /> CANCELLED
                              </button>
                            </div>
                          ) : (entry.status || '').toUpperCase() === 'SCHEDULED' ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => updateStatus(id, 'COMPLETED')}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#8b8b8b]/40 bg-[#f8f8f8] px-3 py-1.5 text-xs font-bold text-[#e41e1f]"
                              >
                                <CheckCircle2 size={14} /> COMPLETED
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStatus(id, 'CANCELLED')}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-1.5 text-xs font-bold text-[#1f1f1f]"
                              >
                                <XCircle size={14} /> CANCELLED
                              </button>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

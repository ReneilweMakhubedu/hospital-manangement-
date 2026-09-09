import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LoaderCircle, MapPin, MessageCircle, Pill } from 'lucide-react';

import { apiFetch } from '../../auth';
import PatientLayout from './PatientLayout';

export default function PatientMedications() {
  const navigate = useNavigate();
  const [medications, setMedications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [doseLogs, setDoseLogs] = useState([]);
  const [pickupPoint, setPickupPoint] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [medRes, sumRes, logRes, profileRes] = await Promise.all([
        apiFetch('/patient/medications', { navigate }),
        apiFetch('/patient/medications/summary', { navigate }),
        apiFetch(`/patient/medications/dose-logs?date=${today}`, { navigate }),
        apiFetch('/patient/profile', { navigate }),
      ]);
      if (medRes.ok) {
        const data = await medRes.json();
        setMedications(Array.isArray(data) ? data : data.medications || []);
      }
      if (sumRes.ok) setSummary(await sumRes.json());
      if (logRes.ok) {
        const data = await logRes.json();
        setDoseLogs(Array.isArray(data) ? data : []);
      }
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setPickupPoint(profile.ccmddPickupPoint || '');
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

  const markTaken = async (medicationId, scheduledTime) => {
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch('/patient/medications/dose-log', {
        navigate,
        method: 'POST',
        body: JSON.stringify({ medicationId, scheduledTime }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to mark dose as taken');
      setStatus({ type: 'success', message: 'Dose marked as taken.' });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const savePickup = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch('/patient/medications/pickup-point', {
        navigate,
        method: 'PUT',
        body: JSON.stringify({ ccmddPickupPoint: pickupPoint }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to update pickup point');
      setStatus({ type: 'success', message: 'Pickup point updated.' });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const active = medications.filter((m) => (m.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
  const pendingLogs = doseLogs.filter((l) => (l.status || '').toUpperCase() === 'PENDING');

  return (
    <PatientLayout
      title="Medications"
      subtitle="Prescriptions, CCMDD collections, and dosage reminders."
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

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={20} /> Loading medications…
        </div>
      ) : (
        <>
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-[#8b8b8b]">Active prescriptions</p>
              <p className="mt-2 text-3xl font-bold text-[#e41e1f]">
                {summary?.activeCount ?? active.length}
              </p>
            </div>
            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-[#8b8b8b]">Next CCMDD collection</p>
              <p className="mt-2 text-xl font-bold text-[#1f1f1f]">
                {summary?.nextCollectionDate || 'Not set'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-[#8b8b8b]">Collection status</p>
              <p className="mt-2 text-sm font-semibold text-[#1f1f1f]">
                {summary?.readyForCollection
                  ? 'Ready for collection'
                  : summary?.missedCollections
                    ? `${summary.missedCollections} missed`
                    : 'On track'}
              </p>
            </div>
          </section>

          <div className="mb-6 flex gap-3 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 text-sm text-[#1f1f1f] shadow-sm">
            <MessageCircle className="mt-0.5 shrink-0 text-[#e41e1f]" size={18} />
            <p>
              SMS and WhatsApp medication reminders are sent only when you have given consent on your
              profile. You can update consent and preferred channel under Profile.
            </p>
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold text-[#1f1f1f]">
                  <Pill size={18} className="text-[#e41e1f]" /> Current prescriptions
                </h2>
              </div>
              {active.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No active prescriptions on file.</p>
              ) : (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {active.map((med) => (
                    <li key={med._id || med.id} className="px-5 py-4">
                      <p className="font-semibold text-[#1f1f1f]">
                        {med.medicationName || med.medication || med.name}
                      </p>
                      <p className="text-sm text-[#8b8b8b]">
                        {[med.dosage, med.frequency].filter(Boolean).join(' · ')}
                      </p>
                      {med.ccmdd && (
                        <p className="mt-1 text-xs font-medium text-[#e41e1f]">
                          CCMDD
                          {med.pickupPoint || med.ccmddPickupPoint
                            ? ` · ${med.pickupPoint || med.ccmddPickupPoint}`
                            : ''}
                          {med.nextCollectionDate ? ` · next ${med.nextCollectionDate}` : ''}
                        </p>
                      )}
                      {med.refillsRemaining != null && (
                        <p className="mt-1 text-xs text-[#8b8b8b]">
                          Refills remaining: {med.refillsRemaining}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Dosage reminders today</h2>
              </div>
              {pendingLogs.length === 0 && doseLogs.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No dosage reminders for today.</p>
              ) : (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {(doseLogs.length ? doseLogs : pendingLogs).map((log) => {
                    const id = log._id || log.id;
                    const taken = (log.status || '').toUpperCase() === 'TAKEN';
                    return (
                      <li key={id} className="flex items-center justify-between gap-3 px-5 py-4">
                        <div>
                          <p className="font-semibold text-[#1f1f1f]">
                            {log.medicationName || `Medication #${log.medicationId}`}
                          </p>
                          <p className="text-sm text-[#8b8b8b]">
                            {log.scheduledTime || 'Scheduled'} · {log.status || 'PENDING'}
                          </p>
                        </div>
                        {!taken && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              markTaken(log.medicationId || log.medication?._id, log.scheduledTime)
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-[#e41e1f] px-3 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#e41e1f]"
                          >
                            <Check size={14} /> Mark taken
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {active.length > 0 && doseLogs.length === 0 && (
                <div className="border-t border-[#8b8b8b]/20 px-5 py-4">
                  <p className="mb-3 text-xs text-[#8b8b8b]">
                    No scheduled logs yet — you can mark a dose for an active medicine below.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {active.slice(0, 3).map((med) => (
                      <button
                        key={med._id || med.id}
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          markTaken(
                            med._id || med.id,
                            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          )
                        }
                        className="rounded-lg border border-[#8b8b8b]/30 bg-[#f8f8f8] px-3 py-1.5 text-xs font-semibold text-[#e41e1f] hover:bg-[#f8f8f8]"
                      >
                        Mark {med.medicationName || med.medication} taken
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-[#1f1f1f]">
              <MapPin size={18} className="text-[#e41e1f]" /> Change CCMDD pickup point
            </h2>
            <form onSubmit={savePickup} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 text-sm font-semibold text-[#1f1f1f]">
                Pickup point
                <input
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                  placeholder="e.g. Clicks Riverside Mall"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
              >
                Save pickup point
              </button>
            </form>
          </section>
        </>
      )}
    </PatientLayout>
  );
}

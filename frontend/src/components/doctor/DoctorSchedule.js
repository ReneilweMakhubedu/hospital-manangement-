import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Save } from 'lucide-react';

import { apiFetch } from '../../auth';
import DoctorLayout from './DoctorLayout';

function dayKey(dateStr) {
  return dateStr || '';
}

export default function DoctorSchedule() {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState({
    availableToday: true,
    workingHours: '08:00-16:00',
    bookedSlots: [],
    freeSlots: [],
  });
  const [week, setWeek] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, wRes] = await Promise.all([
        apiFetch('/doctor/schedule/availability', { navigate }),
        apiFetch('/doctor/schedule/week', { navigate }),
      ]);
      if (!aRes.ok) {
        const err = await aRes.json().catch(() => ({}));
        throw new Error(err.error || 'Unable to load availability');
      }
      const aData = await aRes.json();
      setAvailability((prev) => ({
        ...prev,
        ...aData,
        availableToday:
          aData.availableToday != null ? Boolean(aData.availableToday) : prev.availableToday,
        workingHours: aData.workingHours || prev.workingHours,
      }));
      if (wRes.ok) {
        const wData = await wRes.json();
        setWeek(Array.isArray(wData) ? wData : wData.appointments || wData.days || []);
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

  const saveAvailability = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch('/doctor/schedule/availability', {
        navigate,
        method: 'PUT',
        body: JSON.stringify({
          availableToday: availability.availableToday,
          workingHours: availability.workingHours,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to update availability');
      setAvailability((a) => ({ ...a, ...data }));
      setStatus({ type: 'success', message: 'Availability updated.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const appointmentsByDay = {};
  week.forEach((item) => {
    if (item.date && Array.isArray(item.appointments)) {
      appointmentsByDay[dayKey(item.date)] = item.appointments;
    } else if (item.date) {
      const key = dayKey(item.date);
      if (!appointmentsByDay[key]) appointmentsByDay[key] = [];
      appointmentsByDay[key].push(item);
    }
  });
  const dayKeys = Object.keys(appointmentsByDay).sort();
  const flatWeek = dayKeys.length
    ? null
    : week.filter((w) => w.date || w.time);

  return (
    <DoctorLayout
      title="Schedule"
      subtitle="Toggle clinic availability, set working hours, and review the coming week."
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
        <div className="flex items-center justify-center gap-2 py-20 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={20} /> Loading schedule…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={saveAvailability}
            className="space-y-4 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm lg:col-span-1"
          >
            <h2 className="text-lg font-bold text-[#1f1f1f]">Availability</h2>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-[#8b8b8b]/30 bg-[#f8f8f8] px-4 py-3 text-sm">
              <span className="font-semibold text-[#1f1f1f]">Available today</span>
              <input
                type="checkbox"
                checked={Boolean(availability.availableToday)}
                onChange={(e) =>
                  setAvailability((a) => ({ ...a, availableToday: e.target.checked }))
                }
                className="h-4 w-4 rounded border-[#8b8b8b]/40 text-[#e41e1f] focus:ring-[#e41e1f]"
              />
            </label>
            <label className="block text-sm font-semibold text-[#1f1f1f]">
              Working hours
              <input
                value={availability.workingHours || ''}
                onChange={(e) =>
                  setAvailability((a) => ({ ...a, workingHours: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#8b8b8b]/200 focus:ring-2 focus:ring-[#e41e1f]"
                placeholder="08:00-16:00"
              />
            </label>
            <div className="rounded-xl border border-[#8b8b8b]/20 bg-[#f8f8f8] p-3 text-sm text-[#8b8b8b]">
              <p>
                Booked today:{' '}
                <span className="font-semibold text-[#1f1f1f]">
                  {(availability.bookedSlots || []).length}
                </span>
              </p>
              <p className="mt-1">
                Free slots:{' '}
                <span className="font-semibold text-[#1f1f1f]">
                  {(availability.freeSlots || []).length}
                </span>
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
            >
              <Save size={16} />
              {saving ? 'Saving…' : 'Save availability'}
            </button>
          </form>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm lg:col-span-2">
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">Next 7 days</h2>
            {dayKeys.length === 0 && (!flatWeek || flatWeek.length === 0) ? (
              <p className="text-sm text-[#8b8b8b]">No appointments in the coming week.</p>
            ) : dayKeys.length > 0 ? (
              <div className="space-y-4">
                {dayKeys.map((date) => (
                  <div key={date}>
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#e41e1f]">
                      {date}
                    </h3>
                    <ul className="divide-y divide-[#8b8b8b]/25 rounded-xl border border-[#8b8b8b]/20">
                      {appointmentsByDay[date].map((apt) => (
                        <li
                          key={apt._id || apt.id || `${apt.patientId}-${apt.time}`}
                          className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm"
                        >
                          <span className="font-medium text-[#1f1f1f]">
                            {apt.time || '—'} ·{' '}
                            {apt.patientName ||
                              [apt.patientFirstName, apt.patientLastName]
                                .filter(Boolean)
                                .join(' ') ||
                              `Patient #${apt.patientId}`}
                          </span>
                          <span className="text-[#8b8b8b]">
                            {apt.reason || apt.purpose || apt.status || ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-[#8b8b8b]/25">
                {flatWeek.map((apt) => (
                  <li
                    key={apt._id || apt.id || `${apt.date}-${apt.time}`}
                    className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                  >
                    <span className="font-medium text-[#1f1f1f]">
                      {apt.date} {apt.time} ·{' '}
                      {apt.patientName ||
                        [apt.patientFirstName, apt.patientLastName].filter(Boolean).join(' ') ||
                        `Patient #${apt.patientId}`}
                    </span>
                    <span className="text-[#8b8b8b]">{apt.reason || apt.purpose || ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </DoctorLayout>
  );
}

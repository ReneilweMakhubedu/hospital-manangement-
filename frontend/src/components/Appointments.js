import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, LoaderCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '../auth';
import { brand } from '../brand';

const FALLBACK_TIMES = [
  '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM',
  '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];
const emptyForm = { patientId: '', doctorId: '', date: '', time: '', reason: '' };

function statusBadge(status) {
  const value = (status || 'scheduled').toLowerCase();
  const styles = {
    scheduled: 'bg-[#f8f8f8] text-[#e41e1f]',
    confirmed: 'bg-[#f8f8f8] text-[#e41e1f]',
    completed: 'bg-[#f5f5f5] text-[#1f1f1f]',
    cancelled: 'bg-red-100 text-[#e41e1f]',
    'no-show': 'bg-amber-100 text-[#1f1f1f]',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${styles[value] || styles.scheduled}`}>
      {status || 'scheduled'}
    </span>
  );
}

function Appointments() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState(FALLBACK_TIMES);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [patientResponse, doctorResponse, appointmentResponse] = await Promise.all([
        apiFetch('/patient/records', { navigate }),
        apiFetch('/doctor/all', { navigate }),
        apiFetch('/appointments', { navigate }),
      ]);
      const [patientData, doctorData, appointmentData] = await Promise.all([
        patientResponse.json(),
        doctorResponse.json(),
        appointmentResponse.json(),
      ]);
      if (!patientResponse.ok || !doctorResponse.ok || !appointmentResponse.ok) {
        throw new Error(appointmentData.error || patientData.error || 'Unable to load appointment data');
      }
      setPatients(patientData);
      setDoctors(doctorData);
      setAppointments(appointmentData);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const { doctorId, date } = form;
    if (!doctorId || !date) {
      setAvailableSlots(FALLBACK_TIMES);
      return;
    }

    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      try {
        const response = await apiFetch(
          `/appointments/available-slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`,
          { navigate }
        );
        const data = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(data)) {
          throw new Error('Slots unavailable');
        }
        if (!cancelled) {
          setAvailableSlots(data.length > 0 ? data : FALLBACK_TIMES);
          setForm((current) =>
            data.includes(current.time) ? current : { ...current, time: '' }
          );
        }
      } catch {
        if (!cancelled) setAvailableSlots(FALLBACK_TIMES);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.doctorId, form.date, navigate]);

  const change = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await apiFetch('/appointments', {
        method: 'POST',
        navigate,
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to schedule appointment');
      setAppointments((current) =>
        [...current, data.appointment].sort((a, b) =>
          `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
        )
      );
      setForm(emptyForm);
      setStatus({ type: 'success', message: 'Appointment scheduled successfully.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f8f8] px-5 py-8 text-[#1f1f1f] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate('/admin')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e41e1f] hover:text-[#e41e1f]"
        >
          <ArrowLeft size={16} /> Back to admin
        </button>

        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#e41e1f]">
              {brand.shortName}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Appointments</h1>
            <p className="mt-2 text-[#8b8b8b]">
              Schedule a patient with the right doctor and keep the clinic day organised.
            </p>
          </div>
          <button onClick={loadData} className="text-sm font-semibold text-[#e41e1f]">
            Refresh
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm lg:col-span-2 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Plus size={20} className="text-[#e41e1f]" /> Schedule visit
            </h2>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <Select label="Patient" name="patientId" value={form.patientId} onChange={change}>
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </Select>
              <Select label="Doctor" name="doctorId" value={form.doctorId} onChange={change}>
                <option value="">Select doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.firstName} {doctor.lastName} — {doctor.specialty}
                  </option>
                ))}
              </Select>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Date
                <input
                  required
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={change}
                  min={new Date().toISOString().slice(0, 10)}
                  className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                />
              </label>
              <Select label="Time" name="time" value={form.time} onChange={change}>
                <option value="">
                  {slotsLoading ? 'Loading slots…' : 'Select time'}
                </option>
                {availableSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </Select>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Reason for visit
                <textarea
                  required
                  name="reason"
                  value={form.reason}
                  onChange={change}
                  rows="3"
                  className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                />
              </label>
              {status.message && (
                <p
                  role="alert"
                  className={`rounded-lg px-3 py-2 text-sm ${
                    status.type === 'success'
                      ? 'bg-[#f8f8f8] text-[#e41e1f]'
                      : 'bg-[#f8f8f8] text-[#e41e1f]'
                  }`}
                >
                  {status.message}
                </p>
              )}
              <button
                disabled={submitting || loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-bold text-[#ffffff] hover:bg-[#e41e1f] disabled:cursor-not-allowed disabled:bg-[#8b8b8b]"
              >
                {submitting && <LoaderCircle size={17} className="animate-spin" />}
                {submitting ? 'Scheduling...' : 'Schedule appointment'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-3">
            <div className="border-b border-[#8b8b8b]/30 px-5 py-5 sm:px-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <CalendarDays size={20} className="text-[#e41e1f]" /> Scheduled visits
              </h2>
            </div>
            {loading ? (
              <div className="flex justify-center py-16">
                <LoaderCircle className="animate-spin text-[#e41e1f]" />
              </div>
            ) : appointments.length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-[#8b8b8b]">
                No appointments scheduled yet.
              </p>
            ) : (
              <div className="divide-y divide-[#8b8b8b]/25">
                {appointments.map((appointment) => (
                  <article key={appointment._id} className="px-5 py-4 sm:px-6">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold">{appointment.patientName}</h3>
                          {statusBadge(appointment.status)}
                        </div>
                        <p className="mt-1 text-sm text-[#8b8b8b]">
                          {appointment.doctorName} · {appointment.specialty}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[#e41e1f]">
                        {appointment.date} · {appointment.time}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-[#8b8b8b]">{appointment.reason}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Select({ label, name, value, onChange, children }) {
  return (
    <label className="block text-sm font-semibold text-[#1f1f1f]">
      {label}
      <select
        required
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
      >
        {children}
      </select>
    </label>
  );
}

export default Appointments;

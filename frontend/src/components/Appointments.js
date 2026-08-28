import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, LoaderCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const times = ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
const emptyForm = { patientId: '', doctorId: '', date: '', time: '', reason: '' };
const API = 'http://localhost:5000/api';

function Appointments() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [patientResponse, doctorResponse, appointmentResponse] = await Promise.all([
        fetch(`${API}/patient/records`, { headers: headers() }), fetch(`${API}/doctor/all`), fetch(`${API}/appointments`, { headers: headers() }),
      ]);
      const [patientData, doctorData, appointmentData] = await Promise.all([patientResponse.json(), doctorResponse.json(), appointmentResponse.json()]);
      if (!patientResponse.ok || !doctorResponse.ok || !appointmentResponse.ok) throw new Error(appointmentData.error || patientData.error || 'Unable to load appointment data');
      setPatients(patientData); setDoctors(doctorData); setAppointments(appointmentData);
    } catch (error) { setStatus({ type: 'error', message: error.message }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadData(); }, [loadData]);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setStatus({ type: '', message: '' });
    try {
      const response = await fetch(`${API}/appointments`, { method: 'POST', headers: headers(), body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to schedule appointment');
      setAppointments((current) => [...current, data.appointment].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)));
      setForm(emptyForm); setStatus({ type: 'success', message: 'Appointment scheduled successfully.' });
    } catch (error) { setStatus({ type: 'error', message: error.message }); }
    finally { setSubmitting(false); }
  };

  return <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8"><div className="mx-auto max-w-6xl">
    <button onClick={() => navigate('/admin')} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800"><ArrowLeft size={16} /> Back to admin</button>
    <div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Clinic scheduling</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Appointments</h1><p className="mt-2 text-slate-600">Schedule a patient with the right doctor and keep the clinic day organised.</p></div><button onClick={loadData} className="text-sm font-semibold text-teal-700">Refresh</button></div>
    <div className="grid gap-6 lg:grid-cols-5"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 sm:p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><Plus size={20} className="text-teal-600" /> Schedule visit</h2><form onSubmit={submit} className="mt-5 space-y-4"><Select label="Patient" name="patientId" value={form.patientId} onChange={change}><option value="">Select patient</option>{patients.map((patient) => <option key={patient._id} value={patient._id}>{patient.firstName} {patient.lastName}</option>)}</Select><Select label="Doctor" name="doctorId" value={form.doctorId} onChange={change}><option value="">Select doctor</option>{doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>Dr. {doctor.firstName} {doctor.lastName} — {doctor.specialty}</option>)}</Select><label className="block text-sm font-semibold text-slate-700">Date<input required type="date" name="date" value={form.date} onChange={change} min={new Date().toISOString().slice(0, 10)} className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></label><Select label="Time" name="time" value={form.time} onChange={change}><option value="">Select time</option>{times.map((time) => <option key={time}>{time}</option>)}</Select><label className="block text-sm font-semibold text-slate-700">Reason for visit<textarea required name="reason" value={form.reason} onChange={change} rows="3" className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></label>{status.message && <p role="alert" className={`rounded-lg px-3 py-2 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{status.message}</p>}<button disabled={submitting || loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-400">{submitting && <LoaderCircle size={17} className="animate-spin" />}{submitting ? 'Scheduling...' : 'Schedule appointment'}</button></form></section>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3"><div className="border-b border-slate-200 px-5 py-5 sm:px-6"><h2 className="flex items-center gap-2 text-lg font-bold"><CalendarDays size={20} className="text-teal-600" /> Scheduled visits</h2></div>{loading ? <div className="flex justify-center py-16"><LoaderCircle className="animate-spin text-teal-600" /></div> : appointments.length === 0 ? <p className="px-6 py-16 text-center text-sm text-slate-500">No appointments scheduled yet.</p> : <div className="divide-y divide-slate-100">{appointments.map((appointment) => <article key={appointment._id} className="px-5 py-4 sm:px-6"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><h3 className="font-bold">{appointment.patientName}</h3><p className="mt-1 text-sm text-slate-600">{appointment.doctorName} · {appointment.specialty}</p></div><p className="text-sm font-semibold text-teal-700">{appointment.date} · {appointment.time}</p></div><p className="mt-2 text-sm text-slate-500">{appointment.reason}</p></article>)}</div>}</section></div>
  </div></main>;
}
function Select({ label, name, value, onChange, children }) { return <label className="block text-sm font-semibold text-slate-700">{label}<select required name={name} value={value} onChange={onChange} className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">{children}</select></label>; }
export default Appointments;

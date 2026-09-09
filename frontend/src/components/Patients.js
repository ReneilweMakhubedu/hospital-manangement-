import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, LoaderCircle, Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../api';

const emptyForm = { firstName: '', lastName: '', idNumber: '', phoneNumber: '', email: '', address: '', password: '' };
const API_URL = `${API_BASE}/patient/records`;

function Patients() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyForm);
  const [patients, setPatients] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` });
  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL, { headers: getHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load patient records');
      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);
  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true); setStatus({ type: '', message: '' });
    try {
      const response = await fetch(API_URL, { method: 'POST', headers: getHeaders(), body: JSON.stringify(formData) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to register patient');
      setPatients((current) => [data.patient, ...current]);
      setFormData(emptyForm);
      setStatus({ type: 'success', message: `${data.patient.firstName} ${data.patient.lastName} was registered successfully.` });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally { setIsSubmitting(false); }
  };

  return <main className="min-h-screen bg-[#f8f8f8] px-5 py-8 text-[#1f1f1f] sm:px-8"><div className="mx-auto max-w-6xl">
    <button onClick={() => navigate(localStorage.getItem('userRole') === 'admin' ? '/admin' : '/dashboard')} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e41e1f] hover:text-[#e41e1f]"><ArrowLeft size={16} /> Back</button>
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wider text-[#e41e1f]">Clinic records</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Patient registration</h1><p className="mt-2 text-[#8b8b8b]">Create and manage patient accounts from one secure place.</p></div><div className="rounded-lg bg-[#f8f8f8] px-4 py-2 text-sm font-semibold text-[#e41e1f]">{patients.length} registered patients</div></div>
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm lg:col-span-2 sm:p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><Plus size={20} className="text-[#e41e1f]" /> New patient</h2><p className="mt-1 text-sm text-[#8b8b8b]">The temporary password lets the patient sign in later.</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="First name" name="firstName" value={formData.firstName} onChange={handleChange} /><Field label="Last name" name="lastName" value={formData.lastName} onChange={handleChange} /></div><Field label="South African ID number" name="idNumber" value={formData.idNumber} onChange={handleChange} inputMode="numeric" /><Field label="Phone number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} inputMode="tel" /><Field label="Email address" name="email" type="email" value={formData.email} onChange={handleChange} /><label className="block text-sm font-semibold text-[#1f1f1f]">Home address<textarea required name="address" value={formData.address} onChange={handleChange} rows="3" className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none transition focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]" /></label><Field label="Temporary password" name="password" type="password" minLength="6" value={formData.password} onChange={handleChange} />
          {status.message && <p role="alert" className={`rounded-lg px-3 py-2 text-sm ${status.type === 'success' ? 'bg-[#f8f8f8] text-[#e41e1f]' : 'bg-[#f8f8f8] text-[#e41e1f]'}`}>{status.message}</p>}<button disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-bold text-[#ffffff] transition hover:bg-[#e41e1f] disabled:cursor-not-allowed disabled:bg-[#8b8b8b]">{isSubmitting && <LoaderCircle size={17} className="animate-spin" />}{isSubmitting ? 'Registering patient...' : 'Register patient'}</button></form>
      </section>
      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-3"><div className="flex items-center justify-between border-b border-[#8b8b8b]/30 px-5 py-5 sm:px-6"><h2 className="flex items-center gap-2 text-lg font-bold"><Users size={20} className="text-[#e41e1f]" /> Registered patients</h2><button onClick={loadPatients} className="text-sm font-semibold text-[#e41e1f] hover:text-[#e41e1f]">Refresh</button></div>{isLoading ? <div className="flex justify-center py-16"><LoaderCircle className="animate-spin text-[#e41e1f]" /></div> : patients.length === 0 ? <p className="px-6 py-16 text-center text-sm text-[#8b8b8b]">No patient records yet. Register the first patient using the form.</p> : <div className="divide-y divide-[#8b8b8b]/25">{patients.map((patient) => <article key={patient._id} className="px-5 py-4 sm:px-6"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><h3 className="font-bold">{patient.firstName} {patient.lastName}</h3><p className="mt-1 text-sm text-[#8b8b8b]">{patient.email} · {patient.phoneNumber}</p></div><p className="text-sm text-[#8b8b8b]">ID: {patient.idNumber}</p></div><p className="mt-2 text-sm text-[#8b8b8b]">{patient.address}</p></article>)}</div>}</section>
    </div>
  </div></main>;
}

function Field({ label, name, type = 'text', value, onChange, ...props }) {
  return <label className="block text-sm font-semibold text-[#1f1f1f]">{label}<input required name={name} type={type} value={value} onChange={onChange} className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none transition focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]" {...props} /></label>;
}

export default Patients;

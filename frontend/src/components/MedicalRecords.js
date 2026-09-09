import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, FileText, LoaderCircle, Plus, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '../auth';
import { brand } from '../brand';

const emptyNote = {
  visitDate: '',
  chiefComplaint: '',
  diagnosis: '',
  treatmentPlan: '',
  notes: '',
};

export default function MedicalRecords() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState(emptyNote);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedPatient = patients.find((p) => String(p._id) === String(selectedId));

  const loadPatients = useCallback(async () => {
    setLoadingPatients(true);
    try {
      const response = await apiFetch('/patient/records', { navigate });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load patients');
      setPatients(Array.isArray(data) ? data : []);
      setStatus({ type: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoadingPatients(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const loadNotes = useCallback(
    async (patientId) => {
      if (!patientId) {
        setNotes([]);
        return;
      }
      setLoadingNotes(true);
      try {
        let response = await apiFetch(`/emr/notes?patientId=${encodeURIComponent(patientId)}`, {
          navigate,
        });
        if (!response.ok && response.status === 404) {
          response = await apiFetch(`/emr/notes/patient/${encodeURIComponent(patientId)}`, {
            navigate,
          });
        }
        const data = await response.json().catch(() => []);
        if (!response.ok) throw new Error(data.error || 'Unable to load clinical notes');
        setNotes(Array.isArray(data) ? data : data.notes || []);
      } catch (error) {
        setNotes([]);
        setStatus({ type: 'error', message: error.message });
      } finally {
        setLoadingNotes(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (selectedId) loadNotes(selectedId);
  }, [selectedId, loadNotes]);

  const change = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submitNote = async (event) => {
    event.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await apiFetch('/emr/notes', {
        method: 'POST',
        navigate,
        body: JSON.stringify({
          patientId: selectedId,
          visitDate: form.visitDate,
          chiefComplaint: form.chiefComplaint.trim(),
          diagnosis: form.diagnosis.trim(),
          treatmentPlan: form.treatmentPlan.trim(),
          notes: form.notes.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to save clinical note');
      setForm(emptyNote);
      setStatus({ type: 'success', message: 'Clinical note saved.' });
      await loadNotes(selectedId);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
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

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#e41e1f]">
            {brand.shortName} · EMR
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Medical records</h1>
          <p className="mt-2 text-[#8b8b8b]">
            Review patient profiles and capture clinical notes for each visit.
          </p>
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

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-2">
            <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="flex items-center gap-2 font-bold">
                <UserRound size={18} className="text-[#e41e1f]" /> Patients
              </h2>
            </div>
            {loadingPatients ? (
              <div className="flex justify-center py-12">
                <LoaderCircle className="animate-spin text-[#e41e1f]" />
              </div>
            ) : patients.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#8b8b8b]">No patients found.</p>
            ) : (
              <ul className="max-h-[28rem] divide-y divide-[#8b8b8b]/25 overflow-y-auto">
                {patients.map((patient) => {
                  const active = String(patient._id) === String(selectedId);
                  return (
                    <li key={patient._id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(patient._id)}
                        className={`w-full px-5 py-3 text-left transition ${
                          active ? 'bg-[#f8f8f8]' : 'hover:bg-[#f8f8f8]'
                        }`}
                      >
                        <p className="font-semibold text-[#1f1f1f]">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-xs text-[#8b8b8b]">
                          {patient.email || patient.phone || 'No contact on file'}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="space-y-6 lg:col-span-3">
            {!selectedPatient ? (
              <section className="rounded-2xl border border-dashed border-[#8b8b8b]/40 bg-[#ffffff] px-6 py-16 text-center text-sm text-[#8b8b8b]">
                Select a patient to view their profile and clinical notes.
              </section>
            ) : (
              <>
                <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-bold">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h2>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[#8b8b8b]">Email</dt>
                      <dd className="font-medium">{selectedPatient.email || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-[#8b8b8b]">Phone</dt>
                      <dd className="font-medium">{selectedPatient.phone || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-[#8b8b8b]">Date of birth</dt>
                      <dd className="font-medium">
                        {selectedPatient.dateOfBirth || selectedPatient.dob || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#8b8b8b]">Gender</dt>
                      <dd className="font-medium">{selectedPatient.gender || '—'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-[#8b8b8b]">Address</dt>
                      <dd className="font-medium">{selectedPatient.address || '—'}</dd>
                    </div>
                  </dl>
                </section>

                <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm sm:p-6">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <Plus size={18} className="text-[#e41e1f]" /> Add clinical note
                  </h2>
                  <form onSubmit={submitNote} className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-[#1f1f1f]">
                      Visit date
                      <input
                        required
                        type="date"
                        name="visitDate"
                        value={form.visitDate}
                        onChange={change}
                        className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2">
                      Chief complaint
                      <input
                        required
                        name="chiefComplaint"
                        value={form.chiefComplaint}
                        onChange={change}
                        className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2">
                      Diagnosis
                      <input
                        required
                        name="diagnosis"
                        value={form.diagnosis}
                        onChange={change}
                        className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2">
                      Treatment plan
                      <textarea
                        required
                        name="treatmentPlan"
                        value={form.treatmentPlan}
                        onChange={change}
                        rows="2"
                        className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2">
                      Notes
                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={change}
                        rows="3"
                        className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                      />
                    </label>
                    <button
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-bold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b] sm:col-span-2"
                    >
                      {saving && <LoaderCircle size={16} className="animate-spin" />}
                      {saving ? 'Saving…' : 'Save note'}
                    </button>
                  </form>
                </section>

                <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
                  <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                    <h2 className="flex items-center gap-2 font-bold">
                      <FileText size={18} className="text-[#e41e1f]" /> Clinical notes
                    </h2>
                  </div>
                  {loadingNotes ? (
                    <div className="flex justify-center py-12">
                      <LoaderCircle className="animate-spin text-[#e41e1f]" />
                    </div>
                  ) : notes.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-[#8b8b8b]">
                      No clinical notes yet for this patient.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#8b8b8b]/25">
                      {notes.map((note) => (
                        <article key={note._id || note.id} className="px-5 py-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-[#1f1f1f]">
                              {note.visitDate || note.createdAt || 'Visit'}
                            </p>
                            {note.authorName && (
                              <p className="text-xs text-[#8b8b8b]">{note.authorName}</p>
                            )}
                          </div>
                          <p className="mt-2 text-sm">
                            <span className="font-semibold text-[#8b8b8b]">Complaint:</span>{' '}
                            {note.chiefComplaint}
                          </p>
                          <p className="mt-1 text-sm">
                            <span className="font-semibold text-[#8b8b8b]">Diagnosis:</span>{' '}
                            {note.diagnosis}
                          </p>
                          <p className="mt-1 text-sm text-[#8b8b8b]">{note.treatmentPlan}</p>
                          {note.notes && (
                            <p className="mt-2 text-sm text-[#8b8b8b]">{note.notes}</p>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

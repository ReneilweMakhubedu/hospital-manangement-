import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, LoaderCircle, Stethoscope } from 'lucide-react';

import { apiFetch } from '../../auth';
import DoctorLayout from './DoctorLayout';

function patientLabel(p) {
  return [p.firstName, p.lastName].filter(Boolean).join(' ') || `Patient #${p._id || p.id}`;
}

export default function DoctorNotes() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [notes, setNotes] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, nRes] = await Promise.all([
        apiFetch('/doctor/patients-with-appointments', { navigate }),
        apiFetch('/emr/notes', { navigate }),
      ]);
      if (pRes.ok) {
        const data = await pRes.json();
        setPatients(Array.isArray(data) ? data : []);
      }
      if (nRes.ok) {
        const data = await nRes.json();
        const list = Array.isArray(data) ? data : [];
        setAllNotes(list);
        setNotes(list.slice(0, 40));
      } else if (!pRes.ok) {
        const err = await pRes.json().catch(() => ({}));
        throw new Error(err.error || 'Unable to load documentation');
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const loadPatientNotes = async (patientId) => {
    setSelectedId(patientId);
    if (!patientId) {
      setNotes(allNotes.slice(0, 40));
      return;
    }
    setLoadingNotes(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch(`/emr/notes/patient/${patientId}`, { navigate });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Unable to load notes for patient');
      }
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoadingNotes(false);
    }
  };

  return (
    <DoctorLayout
      title="Documentation"
      subtitle="Recent clinical notes. Open a consultation to add or continue documentation."
      actions={
        <Link
          to="/doctor/consult"
          className="inline-flex items-center gap-2 rounded-xl bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f]"
        >
          <Stethoscope size={16} /> Open consult
        </Link>
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

      <section className="mb-6 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
        <label className="block text-sm font-semibold text-[#1f1f1f]">
          Filter by patient
          <select
            value={selectedId}
            onChange={(e) => loadPatientNotes(e.target.value)}
            className="mt-1 w-full max-w-md rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#8b8b8b]/200 focus:ring-2 focus:ring-[#e41e1f]"
          >
            <option value="">All recent notes</option>
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
      </section>

      {loading || loadingNotes ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={20} /> Loading notes…
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#8b8b8b]/40 bg-[#ffffff]/70 p-10 text-center">
          <FileText className="mx-auto mb-3 text-[#8b8b8b]" size={28} />
          <p className="text-sm text-[#8b8b8b]">No clinical notes found for this view.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {patients.slice(0, 6).map((p) => {
              const id = p._id || p.id;
              return (
                <Link
                  key={id}
                  to={`/doctor/consult?patientId=${id}`}
                  className="rounded-lg bg-[#f8f8f8] px-3 py-1.5 text-sm font-semibold text-[#e41e1f] hover:bg-[#f8f8f8]"
                >
                  Consult {patientLabel(p)}
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li
              key={n._id || n.id}
              className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[#1f1f1f]">
                    {n.patientName || `Patient #${n.patientId}`} · {n.visitDate || 'Visit'}
                  </p>
                  <p className="mt-1 text-sm text-[#8b8b8b]">
                    {n.diagnosis || n.chiefComplaint || n.noteTemplate || 'Clinical note'}
                  </p>
                  <p className="mt-2 text-sm text-[#8b8b8b] line-clamp-3">
                    {n.notes ||
                      n.treatmentPlan ||
                      [n.soapSubjective, n.soapAssessment, n.soapPlan].filter(Boolean).join(' · ') ||
                      '—'}
                  </p>
                </div>
                {n.patientId && (
                  <Link
                    to={`/doctor/consult?patientId=${n.patientId}`}
                    className="rounded-lg bg-[#f8f8f8] px-3 py-1.5 text-sm font-semibold text-[#e41e1f] hover:bg-[#f8f8f8]"
                  >
                    Open consult
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DoctorLayout>
  );
}

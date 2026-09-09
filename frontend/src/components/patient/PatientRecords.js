import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FlaskConical, LoaderCircle, Printer, Pill } from 'lucide-react';

import { apiFetch } from '../../auth';
import { brand } from '../../brand';
import PatientLayout from './PatientLayout';

export default function PatientRecords() {
  const navigate = useNavigate();
  const printRef = useRef(null);
  const [summary, setSummary] = useState(null);
  const [notes, setNotes] = useState([]);
  const [labs, setLabs] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sumRes, notesRes, labsRes, rxRes] = await Promise.all([
          apiFetch('/patient/health/summary', { navigate }),
          apiFetch('/patient/health/notes', { navigate }),
          apiFetch('/patient/health/labs', { navigate }),
          apiFetch('/patient/prescriptions', { navigate }),
        ]);
        if (!cancelled) {
          if (sumRes.ok) setSummary(await sumRes.json());
          if (notesRes.ok) {
            const data = await notesRes.json();
            setNotes(Array.isArray(data) ? data : []);
          }
          if (labsRes.ok) {
            const data = await labsRes.json();
            setLabs(Array.isArray(data) ? data : []);
          }
          if (rxRes.ok) {
            const data = await rxRes.json();
            setPrescriptions(Array.isArray(data) ? data : []);
          }
        }
      } catch (error) {
        if (!cancelled) setStatus({ type: 'error', message: error.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <PatientLayout
      title="Health records"
      subtitle="Your clinical summary, notes, labs, and prescriptions."
      actions={
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-xl border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] hover:bg-[#f8f8f8] print:hidden"
        >
          <Printer size={16} /> Print / download
        </button>
      }
    >
      {status.message && (
        <div className="mb-6 rounded-xl bg-[#f8f8f8] px-4 py-3 text-sm text-[#e41e1f]">{status.message}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={20} /> Loading records…
        </div>
      ) : (
        <div ref={printRef} className="space-y-6 print:space-y-4">
          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 font-bold text-[#1f1f1f]">Health summary</h2>
            <p className="mb-4 text-xs text-[#8b8b8b] print:block">
              {brand.hospital} · Patient health summary
            </p>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Blood type', summary?.bloodType],
                ['Allergies', summary?.allergies],
                ['Conditions', summary?.existingConditions],
                ['Current medications', summary?.currentMedications],
                ['Clinical notes', summary?.notesCount ?? notes.length],
                ['Prescriptions', summary?.prescriptionsCount ?? prescriptions.length],
                ['Appointments', summary?.appointmentsCount],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase text-[#8b8b8b]">{label}</dt>
                  <dd className="mt-1 text-sm text-[#1f1f1f]">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
            <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="flex items-center gap-2 font-bold text-[#1f1f1f]">
                <FileText size={18} className="text-[#e41e1f]" /> Clinical notes
              </h2>
            </div>
            {notes.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#8b8b8b]">No clinical notes available.</p>
            ) : (
              <ul className="divide-y divide-[#8b8b8b]/25">
                {notes.map((note) => (
                  <li key={note._id || note.id} className="px-5 py-4">
                    <p className="font-semibold text-[#1f1f1f]">
                      {note.title || note.diagnosis || 'Clinical note'}
                    </p>
                    {note.authorName && (
                      <p className="text-xs text-[#8b8b8b]">{note.authorName}</p>
                    )}
                    {note.complaint && (
                      <p className="mt-1 text-sm text-[#8b8b8b]">
                        <span className="font-medium">Complaint:</span> {note.complaint}
                      </p>
                    )}
                    {note.treatmentPlan && (
                      <p className="mt-1 text-sm text-[#8b8b8b]">{note.treatmentPlan}</p>
                    )}
                    {note.notes && <p className="mt-1 text-sm text-[#8b8b8b]">{note.notes}</p>}
                    {(note.createdAt || note.date) && (
                      <p className="mt-2 text-xs text-[#8b8b8b]">
                        {String(note.createdAt || note.date).slice(0, 10)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
            <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="flex items-center gap-2 font-bold text-[#1f1f1f]">
                <FlaskConical size={18} className="text-[#e41e1f]" /> Lab results
              </h2>
            </div>
            {labs.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#8b8b8b]">No lab results on file yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                    <tr>
                      <th className="px-5 py-3">Test</th>
                      <th className="px-5 py-3">Result</th>
                      <th className="px-5 py-3">Reference</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8b8b8b]/25">
                    {labs.map((lab) => (
                      <tr key={lab._id || lab.id}>
                        <td className="px-5 py-3 font-medium text-[#1f1f1f]">{lab.testName}</td>
                        <td className="px-5 py-3">
                          {lab.resultValue}
                          {lab.unit ? ` ${lab.unit}` : ''}
                        </td>
                        <td className="px-5 py-3 text-[#8b8b8b]">{lab.referenceRange || '—'}</td>
                        <td className="px-5 py-3">{lab.status || '—'}</td>
                        <td className="px-5 py-3">{lab.resultDate || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
            <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="flex items-center gap-2 font-bold text-[#1f1f1f]">
                <Pill size={18} className="text-[#e41e1f]" /> Prescriptions
              </h2>
            </div>
            {prescriptions.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#8b8b8b]">No prescriptions listed.</p>
            ) : (
              <ul className="divide-y divide-[#8b8b8b]/25">
                {prescriptions.map((rx) => (
                  <li key={rx._id || rx.id} className="px-5 py-4">
                    <p className="font-semibold text-[#1f1f1f]">{rx.medication}</p>
                    <p className="text-sm text-[#8b8b8b]">
                      {[rx.dosage, rx.frequency].filter(Boolean).join(' · ')}
                    </p>
                    {(rx.doctorFirstName || rx.doctorLastName) && (
                      <p className="mt-1 text-xs text-[#8b8b8b]">
                        Dr. {[rx.doctorFirstName, rx.doctorLastName].filter(Boolean).join(' ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </PatientLayout>
  );
}

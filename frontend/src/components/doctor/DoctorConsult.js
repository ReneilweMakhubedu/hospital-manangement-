import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LoaderCircle, Mic, Save, Send } from 'lucide-react';

import { apiFetch } from '../../auth';
import DoctorLayout from './DoctorLayout';

const TABS = [
  { id: 'history', label: 'History' },
  { id: 'notes', label: 'Notes' },
  { id: 'prescribe', label: 'Prescribe' },
  { id: 'orders', label: 'Orders shortcut' },
];

const emptySoap = {
  noteTemplate: 'SOAP',
  soapSubjective: '',
  soapObjective: '',
  soapAssessment: '',
  soapPlan: '',
  chiefComplaint: '',
  diagnosis: '',
  treatmentPlan: '',
  notes: '',
  visitDate: new Date().toISOString().slice(0, 10),
};

const emptyRx = { medication: '', dosage: '', frequency: '' };

function patientLabel(p) {
  if (!p) return '—';
  return (
    p.patientName ||
    [p.firstName, p.lastName].filter(Boolean).join(' ') ||
    `Patient #${p._id || p.id || p.patientId}`
  );
}

export default function DoctorConsult() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId') || '';

  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(patientIdParam);
  const [chart, setChart] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [tab, setTab] = useState('history');
  const [soap, setSoap] = useState(emptySoap);
  const [rx, setRx] = useState(emptyRx);
  const [transcript, setTranscript] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [savingRx, setSavingRx] = useState(false);
  const [scribing, setScribing] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pRes, tRes] = await Promise.all([
          apiFetch('/doctor/patients-with-appointments', { navigate }),
          apiFetch('/doctor/consult/templates', { navigate }),
        ]);
        if (pRes.ok) {
          const data = await pRes.json();
          if (!cancelled) setPatients(Array.isArray(data) ? data : []);
        }
        if (tRes.ok) {
          const data = await tRes.json();
          const list = Array.isArray(data) ? data : data.templates || [];
          if (!cancelled) setTemplates(list);
        }
      } catch (error) {
        if (!cancelled) setStatus({ type: 'error', message: error.message });
      } finally {
        if (!cancelled) setLoadingPatients(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (patientIdParam && patientIdParam !== patientId) {
      setPatientId(patientIdParam);
    }
  }, [patientIdParam, patientId]);

  const loadChart = useCallback(
    async (id) => {
      if (!id) {
        setChart(null);
        return;
      }
      setLoadingChart(true);
      setStatus({ type: '', message: '' });
      try {
        const res = await apiFetch(`/doctor/consult/patient/${id}`, { navigate });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Unable to load patient chart');
        }
        const data = await res.json();
        setChart(data);
        setSoap((s) => ({
          ...s,
          noteTemplate: data?.defaultTemplate || s.noteTemplate || 'SOAP',
        }));
      } catch (error) {
        setChart(null);
        setStatus({ type: 'error', message: error.message });
      } finally {
        setLoadingChart(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    loadChart(patientId);
  }, [patientId, loadChart]);

  const onSelectPatient = (id) => {
    setPatientId(id);
    if (id) setSearchParams({ patientId: id });
    else setSearchParams({});
  };

  const profile = chart?.profile || chart?.patient || chart || {};
  const notes = chart?.clinicalNotes || chart?.notes || [];
  const prescriptions = chart?.prescriptions || [];
  const labs = chart?.labs || chart?.labResults || [];
  const appointments = chart?.appointments || chart?.appointmentHistory || [];

  const templateOptions = useMemo(() => {
    if (templates.length) return templates;
    return [
      { id: 'SOAP', name: 'SOAP', label: 'SOAP' },
      { id: 'NARRATIVE', name: 'NARRATIVE', label: 'Narrative' },
      { id: 'BRIEF', name: 'BRIEF', label: 'Brief' },
    ];
  }, [templates]);

  const onSoapChange = (e) => {
    const { name, value } = e.target;
    setSoap((s) => ({ ...s, [name]: value }));
  };

  const applyTemplate = (templateId) => {
    const tpl = templateOptions.find(
      (t) => String(t.id || t.name || t.code) === String(templateId)
    );
    setSoap((s) => ({
      ...s,
      noteTemplate: templateId,
      soapSubjective: tpl?.subjective || tpl?.soapSubjective || s.soapSubjective,
      soapObjective: tpl?.objective || tpl?.soapObjective || s.soapObjective,
      soapAssessment: tpl?.assessment || tpl?.soapAssessment || s.soapAssessment,
      soapPlan: tpl?.plan || tpl?.soapPlan || s.soapPlan,
      notes: tpl?.body || tpl?.notes || s.notes,
    }));
  };

  const saveNote = async (e) => {
    e.preventDefault();
    if (!patientId) return;
    setSavingNote(true);
    setStatus({ type: '', message: '' });
    try {
      const body = {
        patientId: Number(patientId),
        visitDate: soap.visitDate,
        noteTemplate: soap.noteTemplate,
        soapSubjective: soap.soapSubjective,
        soapObjective: soap.soapObjective,
        soapAssessment: soap.soapAssessment,
        soapPlan: soap.soapPlan,
        chiefComplaint: soap.chiefComplaint || soap.soapSubjective,
        diagnosis: soap.diagnosis || soap.soapAssessment,
        treatmentPlan: soap.treatmentPlan || soap.soapPlan,
        notes:
          soap.notes ||
          [soap.soapSubjective, soap.soapObjective, soap.soapAssessment, soap.soapPlan]
            .filter(Boolean)
            .join('\n\n'),
      };
      const res = await apiFetch('/doctor/consult/notes', {
        navigate,
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save clinical note');
      setStatus({ type: 'success', message: 'Clinical note saved.' });
      setSoap({ ...emptySoap, noteTemplate: soap.noteTemplate });
      await loadChart(patientId);
      setTab('history');
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSavingNote(false);
    }
  };

  const prescribe = async (e) => {
    e.preventDefault();
    if (!patientId) return;
    setSavingRx(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch('/doctor/prescribe-medication', {
        navigate,
        method: 'POST',
        body: JSON.stringify({
          patientId: Number(patientId),
          medication: rx.medication,
          dosage: rx.dosage,
          frequency: rx.frequency,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to prescribe medication');
      setStatus({ type: 'success', message: data.message || 'Medication prescribed.' });
      setRx(emptyRx);
      await loadChart(patientId);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSavingRx(false);
    }
  };

  const runScribe = async () => {
    if (!transcript.trim()) {
      setStatus({ type: 'error', message: 'Enter spoken notes or a transcript first.' });
      return;
    }
    setScribing(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch('/doctor/consult/scribe-draft', {
        navigate,
        method: 'POST',
        body: JSON.stringify({ transcript, spokenText: transcript }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to draft note');
      setSoap((s) => ({
        ...s,
        soapSubjective: data.subjective || data.soapSubjective || s.soapSubjective,
        soapObjective: data.objective || data.soapObjective || s.soapObjective,
        soapAssessment: data.assessment || data.soapAssessment || s.soapAssessment,
        soapPlan: data.plan || data.soapPlan || s.soapPlan,
        notes: data.summary || data.notes || s.notes,
      }));
      setTab('notes');
      setStatus({
        type: 'success',
        message:
          'Draft filled from Clinical note assistant (draft). Review and edit before saving — this is not a live AI vendor.',
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setScribing(false);
    }
  };

  const fieldClass =
    'mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#8b8b8b]/200 focus:ring-2 focus:ring-[#e41e1f]';

  return (
    <DoctorLayout
      title="Consultations"
      subtitle="Open a patient chart, document in SOAP, prescribe, and raise orders or referrals."
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
          Select patient
          <select
            value={patientId}
            onChange={(e) => onSelectPatient(e.target.value)}
            disabled={loadingPatients}
            className={fieldClass}
          >
            <option value="">Choose a patient with appointments…</option>
            {patients.map((p) => {
              const id = p._id || p.id || p.patientId;
              return (
                <option key={id} value={id}>
                  {patientLabel(p)}
                  {p.nextAppointment ? ` · next ${p.nextAppointment}` : ''}
                </option>
              );
            })}
          </select>
        </label>
        {chart?.triageFlag && (
          <p className="mt-3 text-sm font-semibold text-[#e41e1f]">
            Triage flag: {String(chart.triageFlag).toUpperCase()}
          </p>
        )}
      </section>

      {!patientId ? (
        <p className="text-sm text-[#8b8b8b]">Select a patient to open the consultation chart.</p>
      ) : loadingChart ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={20} /> Loading chart…
        </div>
      ) : (
        <>
          <section className="mb-6 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[#1f1f1f]">{patientLabel(profile)}</h2>
            <p className="mt-1 text-sm text-[#8b8b8b]">
              {[profile.gender, profile.dob, profile.bloodType].filter(Boolean).join(' · ') ||
                'Demographics on file'}
            </p>
            <div className="mt-3 grid gap-2 text-sm text-[#8b8b8b] sm:grid-cols-2">
              <p>
                <span className="font-semibold text-[#1f1f1f]">Allergies:</span>{' '}
                {profile.allergies || 'None recorded'}
              </p>
              <p>
                <span className="font-semibold text-[#1f1f1f]">Conditions:</span>{' '}
                {profile.existingConditions || 'None recorded'}
              </p>
            </div>
          </section>

          <div className="mb-4 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === t.id
                    ? 'bg-[#e41e1f] text-[#ffffff]'
                    : 'bg-[#ffffff] text-[#1f1f1f] ring-1 ring-[#8b8b8b]/30 hover:bg-[#f8f8f8]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'history' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
                <h3 className="mb-3 font-bold text-[#1f1f1f]">Clinical notes</h3>
                {notes.length === 0 ? (
                  <p className="text-sm text-[#8b8b8b]">No notes yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {notes.slice(0, 8).map((n) => (
                      <li
                        key={n._id || n.id}
                        className="rounded-xl border border-[#8b8b8b]/20 bg-[#f8f8f8] p-3 text-sm"
                      >
                        <p className="font-semibold text-[#1f1f1f]">
                          {n.visitDate || 'Visit'} · {n.diagnosis || n.chiefComplaint || 'Note'}
                        </p>
                        <p className="mt-1 text-[#8b8b8b] line-clamp-3">
                          {n.notes || n.treatmentPlan || n.soapPlan || '—'}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
                <h3 className="mb-3 font-bold text-[#1f1f1f]">Prescriptions & labs</h3>
                <ul className="mb-4 space-y-2 text-sm">
                  {prescriptions.length === 0 && (
                    <li className="text-[#8b8b8b]">No prescriptions on chart.</li>
                  )}
                  {prescriptions.slice(0, 6).map((p) => (
                    <li key={p._id || p.id} className="text-[#1f1f1f]">
                      {p.medication || p.medicationName} — {p.dosage} · {p.frequency}
                    </li>
                  ))}
                </ul>
                <ul className="space-y-2 text-sm">
                  {labs.length === 0 && <li className="text-[#8b8b8b]">No lab results listed.</li>}
                  {labs.slice(0, 6).map((l) => (
                    <li key={l._id || l.id} className="text-[#1f1f1f]">
                      {l.testName || l.name || 'Lab'} · {l.result || l.resultSummary || l.status}
                    </li>
                  ))}
                </ul>
                {appointments.length > 0 && (
                  <div className="mt-4 border-t border-[#8b8b8b]/20 pt-4">
                    <h4 className="mb-2 text-sm font-bold text-[#1f1f1f]">Visit history</h4>
                    <ul className="space-y-1 text-sm text-[#8b8b8b]">
                      {appointments.slice(0, 5).map((a) => (
                        <li key={a._id || a.id}>
                          {a.date} {a.time} · {a.reason || a.purpose || a.status}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === 'notes' && (
            <div className="grid gap-6 lg:grid-cols-5">
              <form
                onSubmit={saveNote}
                className="space-y-4 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm lg:col-span-3"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Visit date
                    <input
                      type="date"
                      name="visitDate"
                      value={soap.visitDate}
                      onChange={onSoapChange}
                      className={fieldClass}
                      required
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Note template
                    <select
                      name="noteTemplate"
                      value={soap.noteTemplate}
                      onChange={(e) => applyTemplate(e.target.value)}
                      className={fieldClass}
                    >
                      {templateOptions.map((t) => {
                        const id = t.id || t.name || t.code;
                        return (
                          <option key={id} value={id}>
                            {t.label || t.name || id}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                </div>

                {['soapSubjective', 'soapObjective', 'soapAssessment', 'soapPlan'].map((key) => {
                  const labels = {
                    soapSubjective: 'Subjective (S)',
                    soapObjective: 'Objective (O)',
                    soapAssessment: 'Assessment (A)',
                    soapPlan: 'Plan (P)',
                  };
                  return (
                    <label key={key} className="block text-sm font-semibold text-[#1f1f1f]">
                      {labels[key]}
                      <textarea
                        name={key}
                        rows={3}
                        value={soap[key]}
                        onChange={onSoapChange}
                        className={fieldClass}
                      />
                    </label>
                  );
                })}

                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Additional notes / narrative
                  <textarea
                    name="notes"
                    rows={3}
                    value={soap.notes}
                    onChange={onSoapChange}
                    className={fieldClass}
                  />
                </label>

                <button
                  type="submit"
                  disabled={savingNote}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
                >
                  <Save size={16} />
                  {savingNote ? 'Saving…' : 'Save clinical note'}
                </button>
              </form>

              <aside className="rounded-2xl border border-amber-200 bg-[#f8f8f8]/80 p-5 shadow-sm lg:col-span-2">
                <div className="mb-2 flex items-center gap-2 text-[#1f1f1f]">
                  <Mic size={18} />
                  <h3 className="font-bold">Clinical note assistant (draft)</h3>
                </div>
                <p className="mb-3 text-xs text-[#1f1f1f]/90">
                  Paste spoken notes or a transcript. The portal returns a structured draft for you
                  to review — not a live AI vendor integration.
                </p>
                <textarea
                  rows={10}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Patient reports… On exam… Assessment… Plan…"
                  className="w-full rounded-lg border border-amber-200 bg-[#ffffff] px-3 py-2 text-sm outline-none focus:border-[#8b8b8b]/200 focus:ring-2 focus:ring-[#e41e1f]"
                />
                <button
                  type="button"
                  onClick={runScribe}
                  disabled={scribing}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f5f5f5] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#f5f5f5] disabled:bg-slate-400"
                >
                  {scribing ? (
                    <>
                      <LoaderCircle className="animate-spin" size={16} /> Drafting…
                    </>
                  ) : (
                    'Generate draft into SOAP'
                  )}
                </button>
              </aside>
            </div>
          )}

          {tab === 'prescribe' && (
            <form
              onSubmit={prescribe}
              className="max-w-xl space-y-4 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm"
            >
              <h3 className="font-bold text-[#1f1f1f]">Prescribe medication</h3>
              {[
                ['medication', 'Medication'],
                ['dosage', 'Dosage'],
                ['frequency', 'Frequency'],
              ].map(([name, label]) => (
                <label key={name} className="block text-sm font-semibold text-[#1f1f1f]">
                  {label}
                  <input
                    name={name}
                    value={rx[name]}
                    onChange={(e) => setRx((r) => ({ ...r, [name]: e.target.value }))}
                    required
                    className={fieldClass}
                  />
                </label>
              ))}
              <button
                type="submit"
                disabled={savingRx}
                className="inline-flex items-center gap-2 rounded-xl bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
              >
                <Save size={16} />
                {savingRx ? 'Saving…' : 'Prescribe'}
              </button>
            </form>
          )}

          {tab === 'orders' && (
            <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
              <h3 className="mb-2 font-bold text-[#1f1f1f]">Orders & referrals</h3>
              <p className="mb-4 text-sm text-[#8b8b8b]">
                Raise investigations or transfer care for this patient without leaving the
                consultation workflow.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/doctor/orders?patientId=${patientId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f]"
                >
                  Create lab / imaging order
                </Link>
                <Link
                  to={`/doctor/referrals?patientId=${patientId}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] hover:border-[#8b8b8b]/40"
                >
                  <Send size={16} /> Create referral letter
                </Link>
              </div>
            </section>
          )}
        </>
      )}
    </DoctorLayout>
  );
}

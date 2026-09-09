import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ClipboardCheck,
  GraduationCap,
  LoaderCircle,
  Plus,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch, getRole } from '../auth';
import { brand } from '../brand';
import HrLayout from './hr/HrLayout';

const TABS = [
  { id: 'assignments', label: 'Intern assignments', icon: Users },
  { id: 'logs', label: 'Supervision logs', icon: ClipboardCheck },
  { id: 'cycles', label: 'PMDS cycles', icon: GraduationCap },
];

const emptyAssignment = {
  internName: '',
  supervisorName: '',
  department: '',
  startDate: '',
};
const emptyLog = {
  assignmentId: '',
  sessionDate: '',
  topic: '',
  notes: '',
};
const emptyCycle = {
  staffName: '',
  cycleYear: String(new Date().getFullYear()),
  status: 'IN_PROGRESS',
  milestone: '',
};

export default function PmdsSupervision() {
  const navigate = useNavigate();
  const role = getRole();
  const isAdmin = role === 'admin';

  const [tab, setTab] = useState('assignments');
  const [summary, setSummary] = useState({
    assignments: 0,
    logs: 0,
    cyclesOpen: 0,
    cyclesCompleted: 0,
  });
  const [assignments, setAssignments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignment);
  const [logForm, setLogForm] = useState(emptyLog);
  const [cycleForm, setCycleForm] = useState(emptyCycle);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, assignRes, logsRes, cyclesRes] = await Promise.all([
        apiFetch('/hr/pmds/summary', { navigate }),
        apiFetch('/hr/pmds/assignments', { navigate }),
        apiFetch('/hr/pmds/logs', { navigate }),
        apiFetch('/hr/pmds/cycles', { navigate }),
      ]);
      const [summaryData, assignData, logsData, cyclesData] = await Promise.all([
        summaryRes.json().catch(() => ({})),
        assignRes.json().catch(() => []),
        logsRes.json().catch(() => []),
        cyclesRes.json().catch(() => []),
      ]);
      if (!summaryRes.ok) throw new Error(summaryData.error || 'Unable to load PMDS summary');
      if (!assignRes.ok) throw new Error(assignData.error || 'Unable to load assignments');
      if (!logsRes.ok) throw new Error(logsData.error || 'Unable to load supervision logs');
      if (!cyclesRes.ok) throw new Error(cyclesData.error || 'Unable to load PMDS cycles');

      const assignList = Array.isArray(assignData) ? assignData : assignData.assignments || [];
      const logList = Array.isArray(logsData) ? logsData : logsData.logs || [];
      const cycleList = Array.isArray(cyclesData) ? cyclesData : cyclesData.cycles || [];

      setAssignments(assignList);
      setLogs(logList);
      setCycles(cycleList);
      setSummary({
        assignments: summaryData.assignments ?? assignList.length,
        logs: summaryData.logs ?? logList.length,
        cyclesOpen:
          summaryData.cyclesOpen ??
          cycleList.filter((c) => (c.status || '').toUpperCase() !== 'COMPLETED').length,
        cyclesCompleted:
          summaryData.cyclesCompleted ??
          cycleList.filter((c) => (c.status || '').toUpperCase() === 'COMPLETED').length,
      });
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

  const post = async (path, body, successMessage) => {
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await apiFetch(path, {
        method: 'POST',
        navigate,
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to save');
      setStatus({ type: 'success', message: successMessage });
      await loadData();
      return true;
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submitAssignment = async (event) => {
    event.preventDefault();
    const ok = await post(
      '/hr/pmds/assignments',
      {
        internName: assignmentForm.internName.trim(),
        supervisorName: assignmentForm.supervisorName.trim(),
        department: assignmentForm.department.trim(),
        startDate: assignmentForm.startDate || null,
      },
      'Intern assignment saved.'
    );
    if (ok) setAssignmentForm(emptyAssignment);
  };

  const submitLog = async (event) => {
    event.preventDefault();
    const ok = await post(
      '/hr/pmds/logs',
      {
        assignmentId: logForm.assignmentId,
        sessionDate: logForm.sessionDate,
        topic: logForm.topic.trim(),
        notes: logForm.notes.trim() || null,
      },
      'Supervision encounter logged.'
    );
    if (ok) setLogForm(emptyLog);
  };

  const submitCycle = async (event) => {
    event.preventDefault();
    const ok = await post(
      '/hr/pmds/cycles',
      {
        staffName: cycleForm.staffName.trim(),
        cycleYear: Number(cycleForm.cycleYear),
        status: cycleForm.status,
        milestone: cycleForm.milestone.trim() || null,
      },
      'PMDS cycle recorded.'
    );
    if (ok) setCycleForm(emptyCycle);
  };

  const cards = [
    { label: 'Assignments', value: summary.assignments },
    { label: 'Supervision logs', value: summary.logs },
    { label: 'Open cycles', value: summary.cyclesOpen },
    { label: 'Completed cycles', value: summary.cyclesCompleted },
  ];

  const refreshBtn = (
    <button
      type="button"
      onClick={loadData}
      className="inline-flex items-center gap-2 rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2 text-sm font-semibold hover:bg-[#f8f8f8]"
    >
      <RefreshCw size={16} /> Refresh
    </button>
  );

  const body = (
    <>
        {status.message && (
          <p
            role="alert"
            className={`mb-6 rounded-lg px-4 py-3 text-sm ${
              status.type === 'success' ? 'bg-[#f8f8f8] text-[#e41e1f]' : 'bg-[#f8f8f8] text-[#e41e1f]'
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
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
                    {card.label}
                  </p>
                  <p className="mt-3 text-2xl font-bold text-[#e41e1f]">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-6 flex flex-wrap gap-2 border-b border-[#8b8b8b]/30 pb-3">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                    tab === t.id
                      ? 'bg-[#e41e1f] text-[#ffffff]'
                      : 'bg-[#ffffff] text-[#1f1f1f] ring-1 ring-[#8b8b8b]/30 hover:bg-[#f8f8f8]'
                  }`}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'assignments' && (
              <div className="grid gap-6 lg:grid-cols-5">
                <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm lg:col-span-2">
                  <h2 className="flex items-center gap-2 font-bold">
                    <Plus size={18} className="text-[#e41e1f]" /> Assign supervisor
                  </h2>
                  <form onSubmit={submitAssignment} className="mt-4 space-y-3">
                    <Field
                      label="Intern / CS name"
                      name="internName"
                      value={assignmentForm.internName}
                      onChange={(e) =>
                        setAssignmentForm({ ...assignmentForm, internName: e.target.value })
                      }
                      required
                    />
                    <Field
                      label="Supervisor"
                      name="supervisorName"
                      value={assignmentForm.supervisorName}
                      onChange={(e) =>
                        setAssignmentForm({ ...assignmentForm, supervisorName: e.target.value })
                      }
                      required
                    />
                    <Field
                      label="Department"
                      name="department"
                      value={assignmentForm.department}
                      onChange={(e) =>
                        setAssignmentForm({ ...assignmentForm, department: e.target.value })
                      }
                      required
                    />
                    <Field
                      label="Start date"
                      name="startDate"
                      type="date"
                      value={assignmentForm.startDate}
                      onChange={(e) =>
                        setAssignmentForm({ ...assignmentForm, startDate: e.target.value })
                      }
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-bold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
                    >
                      Save assignment
                    </button>
                  </form>
                </section>
                <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-3">
                  <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                    <h2 className="font-bold">Assignments</h2>
                  </div>
                  {assignments.length === 0 ? (
                    <p className="px-5 py-12 text-center text-sm text-[#8b8b8b]">
                      No intern assignments yet.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#8b8b8b]/25">
                      {assignments.map((a) => (
                        <li key={a._id || a.id} className="px-5 py-3">
                          <p className="font-medium">{a.internName}</p>
                          <p className="text-sm text-[#8b8b8b]">
                            Supervisor: {a.supervisorName} · {a.department}
                            {a.startDate ? ` · from ${a.startDate}` : ''}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}

            {tab === 'logs' && (
              <div className="grid gap-6 lg:grid-cols-5">
                <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm lg:col-span-2">
                  <h2 className="flex items-center gap-2 font-bold">
                    <Plus size={18} className="text-[#e41e1f]" /> Log supervision
                  </h2>
                  <form onSubmit={submitLog} className="mt-4 space-y-3">
                    <label className="block text-sm font-semibold text-[#1f1f1f]">
                      Assignment
                      <select
                        required
                        value={logForm.assignmentId}
                        onChange={(e) => setLogForm({ ...logForm, assignmentId: e.target.value })}
                        className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm"
                      >
                        <option value="">Select assignment</option>
                        {assignments.map((a) => (
                          <option key={a._id || a.id} value={a._id || a.id}>
                            {a.internName} → {a.supervisorName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Field
                      label="Session date"
                      type="date"
                      required
                      value={logForm.sessionDate}
                      onChange={(e) => setLogForm({ ...logForm, sessionDate: e.target.value })}
                    />
                    <Field
                      label="Topic"
                      required
                      value={logForm.topic}
                      onChange={(e) => setLogForm({ ...logForm, topic: e.target.value })}
                    />
                    <label className="block text-sm font-semibold text-[#1f1f1f]">
                      Notes
                      <textarea
                        rows={3}
                        value={logForm.notes}
                        onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                        className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={saving || assignments.length === 0}
                      className="w-full rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-bold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
                    >
                      Save log
                    </button>
                  </form>
                </section>
                <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-3">
                  <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                    <h2 className="font-bold">Supervision logs</h2>
                  </div>
                  {logs.length === 0 ? (
                    <p className="px-5 py-12 text-center text-sm text-[#8b8b8b]">
                      No supervision encounters logged yet.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#8b8b8b]/25">
                      {logs.map((log) => (
                        <li key={log._id || log.id} className="px-5 py-3">
                          <p className="font-medium">{log.topic}</p>
                          <p className="text-sm text-[#8b8b8b]">
                            {log.sessionDate || '—'} · {log.internName || log.assignmentLabel || 'Assignment'}
                          </p>
                          {log.notes && <p className="mt-1 text-sm text-[#8b8b8b]">{log.notes}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}

            {tab === 'cycles' && (
              <div className="grid gap-6 lg:grid-cols-5">
                <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm lg:col-span-2">
                  <h2 className="flex items-center gap-2 font-bold">
                    <Plus size={18} className="text-[#e41e1f]" /> PMDS cycle
                  </h2>
                  <form onSubmit={submitCycle} className="mt-4 space-y-3">
                    <Field
                      label="Staff name"
                      required
                      value={cycleForm.staffName}
                      onChange={(e) => setCycleForm({ ...cycleForm, staffName: e.target.value })}
                    />
                    <Field
                      label="Cycle year"
                      type="number"
                      required
                      value={cycleForm.cycleYear}
                      onChange={(e) => setCycleForm({ ...cycleForm, cycleYear: e.target.value })}
                    />
                    <label className="block text-sm font-semibold text-[#1f1f1f]">
                      Status
                      <select
                        value={cycleForm.status}
                        onChange={(e) => setCycleForm({ ...cycleForm, status: e.target.value })}
                        className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm"
                      >
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="MID_YEAR">Mid-year review</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="OVERDUE">Overdue</option>
                      </select>
                    </label>
                    <Field
                      label="Milestone (optional)"
                      value={cycleForm.milestone}
                      onChange={(e) => setCycleForm({ ...cycleForm, milestone: e.target.value })}
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-bold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
                    >
                      Save cycle
                    </button>
                  </form>
                </section>
                <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-3">
                  <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                    <h2 className="font-bold">PMDS cycles</h2>
                  </div>
                  {cycles.length === 0 ? (
                    <p className="px-5 py-12 text-center text-sm text-[#8b8b8b]">
                      No PMDS cycles recorded yet.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#8b8b8b]/25">
                      {cycles.map((c) => (
                        <li
                          key={c._id || c.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                        >
                          <div>
                            <p className="font-medium">{c.staffName}</p>
                            <p className="text-sm text-[#8b8b8b]">
                              {c.cycleYear}
                              {c.milestone ? ` · ${c.milestone}` : ''}
                            </p>
                          </div>
                          <span className="rounded bg-[#f8f8f8] px-2 py-0.5 text-xs font-semibold text-[#e41e1f]">
                            {(c.status || 'IN_PROGRESS').replace(/_/g, ' ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </>
        )}
    </>
  );

  if (isAdmin) {
    return (
      <HrLayout
        title="PMDS & intern supervision"
        subtitle="Assign supervisors, log supervision encounters, and track PMDS cycle milestones."
        actions={refreshBtn}
      >
        {body}
      </HrLayout>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] px-5 py-8 text-[#1f1f1f] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate('/doctor')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e41e1f] hover:text-[#e41e1f]"
        >
          <ArrowLeft size={16} /> Back to doctor
        </button>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#e41e1f]">
              {brand.shortName} · HR Strengthening
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              PMDS &amp; intern supervision
            </h1>
            <p className="mt-2 text-[#8b8b8b]">
              Assign supervisors, log supervision encounters, and track PMDS cycle milestones.
            </p>
          </div>
          {refreshBtn}
        </div>
        {body}
      </div>
    </main>
  );
}

function Field({ label, className = '', ...props }) {
  return (
    <label className={`block text-sm font-semibold text-[#1f1f1f] ${className}`}>
      {label}
      <input
        {...props}
        className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
      />
    </label>
  );
}

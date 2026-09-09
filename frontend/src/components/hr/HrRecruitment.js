import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Pencil, Plus, RefreshCw, Timer, UserPlus } from 'lucide-react';

import { apiFetch } from '../../auth';
import HrLayout from './HrLayout';

const APPLICANT_STATUSES = [
  'APPLIED',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
  'TALENT_POOL',
];

const emptyApplicant = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  appliedPost: '',
  specialty: '',
  status: 'APPLIED',
  source: '',
  notes: '',
  vacancyId: '',
};

const emptyOnboarding = {
  employeeId: '',
  employeeName: '',
  department: '',
  status: 'IN_PROGRESS',
  documentsCollected: false,
  orientationScheduled: false,
  accountCreated: false,
  hpcsaVerified: false,
};

function StatusBanner({ status }) {
  if (!status?.message) return null;
  return (
    <div
      className={`mb-6 rounded-xl px-4 py-3 text-sm ${
        status.type === 'error' ? 'bg-[#f8f8f8] text-[#e41e1f]' : 'bg-[#f8f8f8] text-[#e41e1f]'
      }`}
    >
      {status.message}
    </div>
  );
}

export default function HrRecruitment() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('applicants');
  const [statusFilter, setStatusFilter] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [onboarding, setOnboarding] = useState([]);
  const [avgTimeToFill, setAvgTimeToFill] = useState(null);
  const [applicantForm, setApplicantForm] = useState(emptyApplicant);
  const [onboardingForm, setOnboardingForm] = useState(emptyOnboarding);
  const [editingApplicantId, setEditingApplicantId] = useState(null);
  const [editingOnboardingId, setEditingOnboardingId] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
      const [appRes, onRes, dashRes] = await Promise.all([
        apiFetch(`/hr/applicants${qs}`, { navigate }),
        apiFetch('/hr/onboarding', { navigate }),
        apiFetch('/hr/dashboard', { navigate }),
      ]);
      const [appData, onData, dashData] = await Promise.all([
        appRes.json().catch(() => []),
        onRes.json().catch(() => []),
        dashRes.json().catch(() => ({})),
      ]);
      if (!appRes.ok) throw new Error(appData.error || 'Unable to load applicants');
      if (!onRes.ok) throw new Error(onData.error || 'Unable to load onboarding');

      setApplicants(Array.isArray(appData) ? appData : appData.applicants || []);
      setOnboarding(Array.isArray(onData) ? onData : onData.onboarding || []);
      if (dashRes.ok) {
        setAvgTimeToFill(dashData.avgTimeToFillDays ?? null);
      }
      setStatus({ type: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [navigate, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const submitApplicant = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        firstName: applicantForm.firstName.trim(),
        lastName: applicantForm.lastName.trim(),
        email: applicantForm.email.trim(),
        phone: applicantForm.phone.trim() || null,
        appliedPost: applicantForm.appliedPost.trim(),
        specialty: applicantForm.specialty.trim() || null,
        status: applicantForm.status,
        source: applicantForm.source.trim() || null,
        notes: applicantForm.notes.trim() || null,
        vacancyId: applicantForm.vacancyId.trim() || null,
      };
      const path = editingApplicantId
        ? `/hr/applicants/${editingApplicantId}`
        : '/hr/applicants';
      const res = await apiFetch(path, {
        navigate,
        method: editingApplicantId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save applicant');
      setStatus({
        type: 'success',
        message: editingApplicantId ? 'Applicant updated.' : 'Applicant added.',
      });
      setApplicantForm(emptyApplicant);
      setEditingApplicantId(null);
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const submitOnboarding = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        employeeId: onboardingForm.employeeId.trim() || null,
        employeeName: onboardingForm.employeeName.trim(),
        department: onboardingForm.department.trim(),
        status: onboardingForm.status,
        documentsCollected: Boolean(onboardingForm.documentsCollected),
        orientationScheduled: Boolean(onboardingForm.orientationScheduled),
        accountCreated: Boolean(onboardingForm.accountCreated),
        hpcsaVerified: Boolean(onboardingForm.hpcsaVerified),
      };
      const path = editingOnboardingId
        ? `/hr/onboarding/${editingOnboardingId}`
        : '/hr/onboarding';
      const res = await apiFetch(path, {
        navigate,
        method: editingOnboardingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save onboarding record');
      setStatus({
        type: 'success',
        message: editingOnboardingId ? 'Onboarding updated.' : 'Onboarding started.',
      });
      setOnboardingForm(emptyOnboarding);
      setEditingOnboardingId(null);
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const startEditApplicant = (row) => {
    setEditingApplicantId(row.id || row._id);
    setApplicantForm({
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      email: row.email || '',
      phone: row.phone || '',
      appliedPost: row.appliedPost || '',
      specialty: row.specialty || '',
      status: row.status || 'APPLIED',
      source: row.source || '',
      notes: row.notes || '',
      vacancyId: row.vacancyId != null ? String(row.vacancyId) : '',
    });
    setTab('applicants');
  };

  const startEditOnboarding = (row) => {
    setEditingOnboardingId(row.id || row._id);
    setOnboardingForm({
      employeeId: row.employeeId != null ? String(row.employeeId) : '',
      employeeName: row.employeeName || '',
      department: row.department || '',
      status: row.status || 'IN_PROGRESS',
      documentsCollected: Boolean(row.documentsCollected),
      orientationScheduled: Boolean(row.orientationScheduled),
      accountCreated: Boolean(row.accountCreated),
      hpcsaVerified: Boolean(row.hpcsaVerified),
    });
    setTab('onboarding');
  };

  return (
    <HrLayout
      title="Recruitment & onboarding"
      subtitle="Talent pool, applicant pipeline, and new-starter checklists."
      actions={
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] hover:border-[#8b8b8b]/40"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <StatusBanner status={status} />

      {avgTimeToFill != null && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#8b8b8b]/30 bg-[#f8f8f8]/80 px-5 py-4 text-sm text-[#1f1f1f]">
          <Timer size={18} className="mt-0.5 shrink-0" />
          <p>
            Average time-to-fill is currently <strong>{avgTimeToFill} days</strong> from advertisement
            to filled post. Use the vacancy tracker to keep advertised and filled dates current.
          </p>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2 border-b border-[#8b8b8b]/30 pb-3">
        {[
          { id: 'applicants', label: 'Talent pool / applicants', icon: UserPlus },
          { id: 'onboarding', label: 'Onboarding', icon: Plus },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === id
                ? 'bg-[#e41e1f] text-[#ffffff]'
                : 'border border-[#8b8b8b]/30 bg-[#ffffff] text-[#1f1f1f] hover:border-[#8b8b8b]/40'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={28} />
        </div>
      ) : tab === 'applicants' ? (
        <div className="space-y-8">
          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1f1f1f]">
              {editingApplicantId ? <Pencil size={18} /> : <Plus size={18} />}
              {editingApplicantId ? 'Edit applicant' : 'Add applicant'}
            </h2>
            <form onSubmit={submitApplicant} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="First name"
                required
                value={applicantForm.firstName}
                onChange={(v) => setApplicantForm({ ...applicantForm, firstName: v })}
              />
              <Field
                label="Last name"
                required
                value={applicantForm.lastName}
                onChange={(v) => setApplicantForm({ ...applicantForm, lastName: v })}
              />
              <Field
                label="Email"
                type="email"
                required
                value={applicantForm.email}
                onChange={(v) => setApplicantForm({ ...applicantForm, email: v })}
              />
              <Field
                label="Phone"
                value={applicantForm.phone}
                onChange={(v) => setApplicantForm({ ...applicantForm, phone: v })}
              />
              <Field
                label="Applied post"
                required
                value={applicantForm.appliedPost}
                onChange={(v) => setApplicantForm({ ...applicantForm, appliedPost: v })}
              />
              <Field
                label="Specialty"
                value={applicantForm.specialty}
                onChange={(v) => setApplicantForm({ ...applicantForm, specialty: v })}
              />
              <Select
                label="Status"
                value={applicantForm.status}
                onChange={(v) => setApplicantForm({ ...applicantForm, status: v })}
                options={APPLICANT_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
              />
              <Field
                label="Source"
                value={applicantForm.source}
                onChange={(v) => setApplicantForm({ ...applicantForm, source: v })}
              />
              <Field
                label="Vacancy ID (optional)"
                value={applicantForm.vacancyId}
                onChange={(v) => setApplicantForm({ ...applicantForm, vacancyId: v })}
              />
              <label className="block text-sm sm:col-span-2 lg:col-span-3">
                <span className="mb-1 block font-medium text-[#1f1f1f]">Notes</span>
                <textarea
                  rows={2}
                  value={applicantForm.notes}
                  onChange={(e) => setApplicantForm({ ...applicantForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-[#8b8b8b]/30 px-3 py-2 shadow-sm focus:border-[#8b8b8b]/200 focus:outline-none focus:ring-2 focus:ring-[#e41e1f]"
                />
              </label>
              <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-50"
                >
                  {editingApplicantId ? 'Save changes' : 'Add applicant'}
                </button>
                {editingApplicantId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingApplicantId(null);
                      setApplicantForm(emptyApplicant);
                    }}
                    className="rounded-lg border border-[#8b8b8b]/30 px-4 py-2.5 text-sm font-semibold text-[#1f1f1f]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="font-bold text-[#1f1f1f]">Applicants ({applicants.length})</h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-[#8b8b8b]/30 bg-[#ffffff] px-3 py-2 text-sm"
              >
                <option value="">All statuses</option>
                {APPLICANT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            {applicants.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#8b8b8b]">No applicants found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Name</th>
                      <th className="px-5 py-3 font-semibold">Post</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8b8b8b]/25">
                    {applicants.map((row) => (
                      <tr key={row.id || row._id}>
                        <td className="px-5 py-3">
                          <p className="font-medium">
                            {row.firstName} {row.lastName}
                          </p>
                          <p className="text-xs text-[#8b8b8b]">{row.email}</p>
                        </td>
                        <td className="px-5 py-3 text-[#8b8b8b]">{row.appliedPost}</td>
                        <td className="px-5 py-3">
                          <span className="rounded-md bg-[#f8f8f8] px-2 py-0.5 text-xs font-semibold text-[#e41e1f]">
                            {row.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => startEditApplicant(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#8b8b8b]/30 px-3 py-1.5 text-xs font-semibold hover:bg-[#f8f8f8]"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-8">
          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">
              {editingOnboardingId ? 'Update onboarding' : 'Start onboarding'}
            </h2>
            <form onSubmit={submitOnboarding} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Employee name"
                required
                value={onboardingForm.employeeName}
                onChange={(v) => setOnboardingForm({ ...onboardingForm, employeeName: v })}
              />
              <Field
                label="Department"
                required
                value={onboardingForm.department}
                onChange={(v) => setOnboardingForm({ ...onboardingForm, department: v })}
              />
              <Field
                label="Employee ID (optional)"
                value={onboardingForm.employeeId}
                onChange={(v) => setOnboardingForm({ ...onboardingForm, employeeId: v })}
              />
              <Select
                label="Status"
                value={onboardingForm.status}
                onChange={(v) => setOnboardingForm({ ...onboardingForm, status: v })}
                options={[
                  { value: 'IN_PROGRESS', label: 'In progress' },
                  { value: 'COMPLETED', label: 'Completed' },
                ]}
              />
              <Check
                label="Documents collected"
                checked={onboardingForm.documentsCollected}
                onChange={(v) => setOnboardingForm({ ...onboardingForm, documentsCollected: v })}
              />
              <Check
                label="Orientation scheduled"
                checked={onboardingForm.orientationScheduled}
                onChange={(v) => setOnboardingForm({ ...onboardingForm, orientationScheduled: v })}
              />
              <Check
                label="Account created"
                checked={onboardingForm.accountCreated}
                onChange={(v) => setOnboardingForm({ ...onboardingForm, accountCreated: v })}
              />
              <Check
                label="HPCSA verified"
                checked={onboardingForm.hpcsaVerified}
                onChange={(v) => setOnboardingForm({ ...onboardingForm, hpcsaVerified: v })}
              />
              <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-50"
                >
                  {editingOnboardingId ? 'Save changes' : 'Create checklist'}
                </button>
                {editingOnboardingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOnboardingId(null);
                      setOnboardingForm(emptyOnboarding);
                    }}
                    className="rounded-lg border border-[#8b8b8b]/30 px-4 py-2.5 text-sm font-semibold text-[#1f1f1f]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
            <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="font-bold text-[#1f1f1f]">Onboarding checklists ({onboarding.length})</h2>
            </div>
            {onboarding.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#8b8b8b]">No onboarding records yet.</p>
            ) : (
              <ul className="divide-y divide-[#8b8b8b]/25">
                {onboarding.map((row) => (
                  <li
                    key={row.id || row._id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div>
                      <p className="font-semibold text-[#1f1f1f]">{row.employeeName}</p>
                      <p className="text-sm text-[#8b8b8b]">
                        {row.department} · {row.status}
                      </p>
                      <p className="mt-1 text-xs text-[#8b8b8b]">
                        Docs {row.documentsCollected ? '✓' : '—'} · Orientation{' '}
                        {row.orientationScheduled ? '✓' : '—'} · Account{' '}
                        {row.accountCreated ? '✓' : '—'} · HPCSA {row.hpcsaVerified ? '✓' : '—'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEditOnboarding(row)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#8b8b8b]/30 px-3 py-1.5 text-xs font-semibold hover:bg-[#f8f8f8]"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </HrLayout>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-[#1f1f1f]">
        {label}
        {required ? ' *' : ''}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#8b8b8b]/30 px-3 py-2 text-[#1f1f1f] shadow-sm focus:border-[#8b8b8b]/200 focus:outline-none focus:ring-2 focus:ring-[#e41e1f]"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-[#1f1f1f]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#8b8b8b]/30 bg-[#ffffff] px-3 py-2 shadow-sm focus:border-[#8b8b8b]/200 focus:outline-none focus:ring-2 focus:ring-[#e41e1f]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-[#8b8b8b]/30 bg-[#f8f8f8] px-3 py-2 text-sm font-medium text-[#1f1f1f]">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-[#8b8b8b]/40 text-[#e41e1f] focus:ring-[#e41e1f]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

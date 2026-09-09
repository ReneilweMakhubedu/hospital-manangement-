import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch, getRole } from '../auth';
import HrLayout from './hr/HrLayout';

const emptyForm = {
  title: '',
  department: '',
  specialty: '',
  gradeOrRank: '',
  postsApproved: '1',
  postsFilled: '0',
  critical: false,
  status: 'OPEN',
  notes: '',
};

const STATUS_LABELS = {
  OPEN: 'Open',
  IN_RECRUITMENT: 'In recruitment',
  FILLED: 'Filled',
  ON_HOLD: 'On hold',
};

export default function HrVacancies() {
  const navigate = useNavigate();
  const isAdmin = getRole() === 'admin';

  const [vacancies, setVacancies] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    critical: 0,
    vacancyRateApprox: 0,
    gap: 0,
  });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        apiFetch('/hr/vacancies', { navigate }),
        apiFetch('/hr/vacancies/summary', { navigate }),
      ]);
      const [list, summaryData] = await Promise.all([
        listRes.json().catch(() => []),
        summaryRes.json().catch(() => ({})),
      ]);
      if (!listRes.ok) throw new Error(list.error || 'Unable to load vacancies');
      if (!summaryRes.ok) throw new Error(summaryData.error || 'Unable to load vacancy summary');
      setVacancies(Array.isArray(list) ? list : list.vacancies || []);
      setSummary(summaryData);
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

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (vacancy) => {
    setEditingId(vacancy.id || vacancy._id);
    setForm({
      title: vacancy.title || '',
      department: vacancy.department || '',
      specialty: vacancy.specialty || '',
      gradeOrRank: vacancy.gradeOrRank || '',
      postsApproved: String(vacancy.postsApproved ?? 0),
      postsFilled: String(vacancy.postsFilled ?? 0),
      critical: Boolean(vacancy.critical),
      status: vacancy.status || 'OPEN',
      notes: vacancy.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    setStatus({ type: '', message: '' });
    const payload = {
      title: form.title.trim(),
      department: form.department.trim(),
      specialty: form.specialty.trim() || null,
      gradeOrRank: form.gradeOrRank.trim() || null,
      postsApproved: Number(form.postsApproved),
      postsFilled: Number(form.postsFilled),
      critical: form.critical,
      status: form.status,
      notes: form.notes.trim() || null,
    };
    try {
      const path = editingId ? `/hr/vacancies/${editingId}` : '/hr/vacancies';
      const res = await apiFetch(path, {
        navigate,
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus({
        type: 'success',
        message: editingId ? 'Vacancy updated.' : 'Vacancy added.',
      });
      resetForm();
      await loadData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const deleteVacancy = async (vacancy) => {
    if (!isAdmin) return;
    const id = vacancy.id || vacancy._id;
    if (!window.confirm(`Delete vacancy “${vacancy.title}”?`)) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/hr/vacancies/${id}`, { navigate, method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to delete vacancy');
      }
      setStatus({ type: 'success', message: 'Vacancy deleted.' });
      if (editingId === id) resetForm();
      await loadData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const refreshBtn = (
    <button
      type="button"
      onClick={loadData}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2 text-sm font-semibold text-[#1f1f1f] hover:border-[#8b8b8b]/40 disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      Refresh
    </button>
  );

  const body = (
    <>
      {status.message && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            status.type === 'error' ? 'bg-[#f8f8f8] text-[#e41e1f]' : 'bg-[#f8f8f8] text-[#e41e1f]'
          }`}
        >
          {status.message}
        </div>
      )}

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={Briefcase} label="Open / in recruitment" value={summary.open ?? 0} />
        <SummaryCard icon={AlertTriangle} label="Critical posts" value={summary.critical ?? 0} />
        <SummaryCard
          icon={Users}
          label="Approx. vacancy gap"
          value={`${summary.gap ?? 0} (${summary.vacancyRateApprox ?? 0}%)`}
        />
      </section>

      {isAdmin && (
        <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-[#1f1f1f]">
            {editingId ? <Pencil className="h-5 w-5 text-[#e41e1f]" /> : <Plus className="h-5 w-5 text-[#e41e1f]" />}
            {editingId ? 'Edit vacancy' : 'Add vacancy'}
          </h2>
          <form onSubmit={submitForm} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Title">
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Specialist Nephrologist"
              />
            </Field>
            <Field label="Department">
              <input
                required
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. Internal Medicine"
              />
            </Field>
            <Field label="Specialty (optional)">
              <input
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                placeholder="e.g. Nephrology"
              />
            </Field>
            <Field label="Grade / rank (optional)">
              <input
                value={form.gradeOrRank}
                onChange={(e) => setForm({ ...form, gradeOrRank: e.target.value })}
                placeholder="e.g. Medical Officer Grade 1"
              />
            </Field>
            <Field label="Posts approved">
              <input
                required
                min="0"
                type="number"
                value={form.postsApproved}
                onChange={(e) => setForm({ ...form, postsApproved: e.target.value })}
              />
            </Field>
            <Field label="Posts filled">
              <input
                required
                min="0"
                type="number"
                value={form.postsFilled}
                onChange={(e) => setForm({ ...form, postsFilled: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-end gap-3 pb-2 text-sm font-medium text-[#1f1f1f]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#8b8b8b]/40 text-[#e41e1f] focus:ring-[#e41e1f]"
                checked={form.critical}
                onChange={(e) => setForm({ ...form, critical: e.target.checked })}
              />
              Mark as critical shortage
            </label>
            <Field label="Notes (optional)" className="sm:col-span-2 lg:col-span-3">
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Recruitment notes, service impact…"
              />
            </Field>
            <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#e41e1f] px-4 py-2.5 font-semibold text-[#ffffff] hover:bg-[#f8f8f8] disabled:opacity-50"
              >
                {editingId ? 'Save changes' : 'Add vacancy'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-[#8b8b8b]/30 px-4 py-2.5 font-medium text-[#1f1f1f] hover:bg-[#f8f8f8]"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="border-b border-[#8b8b8b]/30 p-6">
          <h2 className="text-xl font-bold text-[#1f1f1f]">Establishment vacancies</h2>
          <p className="mt-1 text-sm text-[#8b8b8b]">
            {loading ? 'Loading…' : `${vacancies.length} post${vacancies.length === 1 ? '' : 's'} tracked`}
          </p>
        </div>
        {loading ? (
          <p className="p-6 text-[#8b8b8b]">Loading vacancies…</p>
        ) : vacancies.length === 0 ? (
          <p className="p-6 text-[#8b8b8b]">No vacancies recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                <tr>
                  <th className="px-6 py-3 font-semibold">Post</th>
                  <th className="px-6 py-3 font-semibold">Department</th>
                  <th className="px-6 py-3 font-semibold">Filled / approved</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  {isAdmin && <th className="px-6 py-3 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25 text-[#1f1f1f]">
                {vacancies.map((vacancy) => (
                  <tr key={vacancy.id || vacancy._id} className="hover:bg-[#f8f8f8]">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#1f1f1f]">{vacancy.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#8b8b8b]">
                        {vacancy.gradeOrRank && <span>{vacancy.gradeOrRank}</span>}
                        {vacancy.specialty && <span>· {vacancy.specialty}</span>}
                        {vacancy.critical && (
                          <span className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-[#1f1f1f]">
                            Critical
                          </span>
                        )}
                      </div>
                      {vacancy.notes && (
                        <p className="mt-2 max-w-md text-xs text-[#8b8b8b]">{vacancy.notes}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#8b8b8b]">{vacancy.department}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#e41e1f]">
                        {vacancy.postsFilled}/{vacancy.postsApproved}
                      </span>
                      <span className="ml-2 text-xs text-[#8b8b8b]">
                        gap {vacancy.gap ?? Math.max(0, vacancy.postsApproved - vacancy.postsFilled)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={vacancy.status} />
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => startEdit(vacancy)}
                            className="inline-flex items-center gap-1 rounded border border-[#8b8b8b]/30 px-2 py-1 text-xs font-medium text-[#1f1f1f] hover:bg-[#f8f8f8] disabled:opacity-50"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => deleteVacancy(vacancy)}
                            className="inline-flex items-center gap-1 rounded border border-[#e41e1f]/40 px-2 py-1 text-xs font-medium text-[#e41e1f] hover:bg-[#f8f8f8] disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );

  if (isAdmin) {
    return (
      <HrLayout
        title="Vacancy tracking"
        subtitle="Establishment posts, fill rates, and critical shortage alerts."
        actions={refreshBtn}
      >
        {body}
      </HrLayout>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] px-5 py-8 text-[#1f1f1f] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => navigate('/doctor')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e41e1f] hover:text-[#e41e1f]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to doctor portal
        </button>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-[#1f1f1f]">
              <Briefcase className="h-8 w-8 text-[#e41e1f]" />
              Vacancy tracking
            </h1>
            <p className="mt-1 text-[#8b8b8b]">Funded posts vs filled</p>
          </div>
          {refreshBtn}
        </div>
        {body}
      </div>
    </main>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-[#8b8b8b]">
        <Icon className="h-4 w-4 text-[#e41e1f]" />
        {label}
      </div>
      <p className="mt-2 text-3xl font-bold text-[#1f1f1f]">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    OPEN: 'bg-[#f8f8f8] text-[#e41e1f]',
    IN_RECRUITMENT: 'bg-[#f8f8f8] text-[#1f1f1f]',
    FILLED: 'bg-[#f8f8f8] text-[#e41e1f]',
    ON_HOLD: 'bg-[#f5f5f5] text-[#1f1f1f]',
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${styles[status] || styles.OPEN}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block text-sm font-medium text-[#1f1f1f] ${className}`}>
      {label}
      <span className="mt-1 block [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-[#8b8b8b]/30 [&_input]:bg-[#ffffff] [&_input]:px-3 [&_input]:py-2 [&_input]:text-[#1f1f1f] [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-[#8b8b8b]/30 [&_select]:bg-[#ffffff] [&_select]:px-3 [&_select]:py-2 [&_select]:text-[#1f1f1f] [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-[#8b8b8b]/30 [&_textarea]:bg-[#ffffff] [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-[#1f1f1f]">
        {children}
      </span>
    </label>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, LoaderCircle, Plus, RefreshCw } from 'lucide-react';

import { apiFetch } from '../../auth';
import HrLayout from './HrLayout';

const CATEGORIES = ['CPD', 'MANDATORY', 'LEADERSHIP', 'CLINICAL', 'WSP'];
const COURSE_STATUSES = ['PLANNED', 'OPEN', 'COMPLETED', 'CANCELLED'];
const ATTENDANCE = ['REGISTERED', 'ATTENDED', 'ABSENT'];

const emptyCourse = {
  title: '',
  category: 'CPD',
  provider: '',
  scheduledDate: '',
  cpdPoints: '',
  capacity: '',
  status: 'PLANNED',
};

const emptyEnrolment = {
  courseId: '',
  employeeId: '',
  employeeName: '',
  attendance: 'REGISTERED',
  evaluationScore: '',
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

export default function HrTraining() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [enrolments, setEnrolments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [enrolForm, setEnrolForm] = useState(emptyEnrolment);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, eRes, sRes] = await Promise.all([
        apiFetch('/hr/training/courses', { navigate }),
        apiFetch('/hr/training/enrolments', { navigate }),
        apiFetch('/hr/training/summary', { navigate }),
      ]);
      const [cData, eData, sData] = await Promise.all([
        cRes.json().catch(() => []),
        eRes.json().catch(() => []),
        sRes.json().catch(() => ({})),
      ]);
      if (!cRes.ok) throw new Error(cData.error || 'Unable to load courses');
      if (!eRes.ok) throw new Error(eData.error || 'Unable to load enrolments');
      setCourses(Array.isArray(cData) ? cData : cData.courses || []);
      setEnrolments(Array.isArray(eData) ? eData : eData.enrolments || []);
      if (sRes.ok) setSummary(sData);
      setStatus({ type: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const submitCourse = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        title: courseForm.title.trim(),
        category: courseForm.category,
        provider: courseForm.provider.trim() || null,
        scheduledDate: courseForm.scheduledDate || null,
        cpdPoints: courseForm.cpdPoints ? Number(courseForm.cpdPoints) : null,
        capacity: courseForm.capacity ? Number(courseForm.capacity) : null,
        status: courseForm.status,
      };
      const res = await apiFetch('/hr/training/courses', {
        navigate,
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to create course');
      setStatus({ type: 'success', message: 'Course created.' });
      setCourseForm(emptyCourse);
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateCourseStatus = async (course, nextStatus) => {
    const id = course.id || course._id;
    if (!id) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/hr/training/courses/${id}`, {
        navigate,
        method: 'PUT',
        body: JSON.stringify({ ...course, status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to update course');
      setStatus({ type: 'success', message: `Course marked ${nextStatus}.` });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const submitEnrolment = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        courseId: enrolForm.courseId ? Number(enrolForm.courseId) || enrolForm.courseId : null,
        employeeId: enrolForm.employeeId ? Number(enrolForm.employeeId) || enrolForm.employeeId : null,
        employeeName: enrolForm.employeeName.trim(),
        attendance: enrolForm.attendance,
        evaluationScore: enrolForm.evaluationScore ? Number(enrolForm.evaluationScore) : null,
      };
      const res = await apiFetch('/hr/training/enrolments', {
        navigate,
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to enrol');
      setStatus({ type: 'success', message: 'Enrolment recorded.' });
      setEnrolForm(emptyEnrolment);
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const categoryCounts = summary?.byCategory || summary?.categoryCounts || {};
  const summaryCards = [
    { label: 'Courses', value: summary?.coursesTotal ?? courses.length },
    {
      label: 'Open / planned',
      value:
        summary?.openCount ??
        courses.filter((c) => ['OPEN', 'PLANNED'].includes(c.status)).length,
    },
    { label: 'Enrolments', value: summary?.enrolmentsTotal ?? enrolments.length },
    {
      label: 'WSP progress',
      value: summary?.wspProgressHint || summary?.wspHint || summary?.trainingCompletionHint || '—',
    },
  ];

  return (
    <HrLayout
      title="Training & CPD"
      subtitle="Courses, enrolments, and workplace skills plan progress."
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

      {loading && courses.length === 0 ? (
        <div className="flex justify-center py-16">
          <LoaderCircle className="animate-spin text-[#e41e1f]" size={28} />
        </div>
      ) : (
        <>
          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-[#1f1f1f]">{card.value}</p>
              </div>
            ))}
          </section>

          {Object.keys(categoryCounts).length > 0 && (
            <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
              <h2 className="mb-3 font-bold text-[#1f1f1f]">Courses by category</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryCounts).map(([cat, count]) => (
                  <span
                    key={cat}
                    className="rounded-lg bg-[#f8f8f8] px-3 py-1.5 text-sm font-semibold text-[#e41e1f]"
                  >
                    {cat}: {count}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Plus size={18} className="text-[#e41e1f]" /> Add course
            </h2>
            <form onSubmit={submitCourse} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Title"
                required
                value={courseForm.title}
                onChange={(v) => setCourseForm({ ...courseForm, title: v })}
              />
              <Select
                label="Category"
                value={courseForm.category}
                onChange={(v) => setCourseForm({ ...courseForm, category: v })}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
              <Field
                label="Provider"
                value={courseForm.provider}
                onChange={(v) => setCourseForm({ ...courseForm, provider: v })}
              />
              <Field
                label="Scheduled date"
                type="date"
                value={courseForm.scheduledDate}
                onChange={(v) => setCourseForm({ ...courseForm, scheduledDate: v })}
              />
              <Field
                label="CPD points"
                type="number"
                value={courseForm.cpdPoints}
                onChange={(v) => setCourseForm({ ...courseForm, cpdPoints: v })}
              />
              <Field
                label="Capacity"
                type="number"
                value={courseForm.capacity}
                onChange={(v) => setCourseForm({ ...courseForm, capacity: v })}
              />
              <Select
                label="Status"
                value={courseForm.status}
                onChange={(v) => setCourseForm({ ...courseForm, status: v })}
                options={COURSE_STATUSES.map((s) => ({ value: s, label: s }))}
              />
              <div className="sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-50"
                >
                  Create course
                </button>
              </div>
            </form>
          </section>

          <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#8b8b8b]/30 px-5 py-4">
              <GraduationCap className="text-[#e41e1f]" size={20} />
              <h2 className="font-bold text-[#1f1f1f]">Courses ({courses.length})</h2>
            </div>
            {courses.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#8b8b8b]">No courses yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Course</th>
                      <th className="px-5 py-3 font-semibold">Category</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8b8b8b]/25">
                    {courses.map((c) => (
                      <tr key={c.id || c._id}>
                        <td className="px-5 py-3">
                          <p className="font-medium">{c.title}</p>
                          <p className="text-xs text-[#8b8b8b]">
                            {c.provider || '—'}
                            {c.cpdPoints != null ? ` · ${c.cpdPoints} CPD` : ''}
                          </p>
                        </td>
                        <td className="px-5 py-3">{c.category}</td>
                        <td className="px-5 py-3">{c.scheduledDate || '—'}</td>
                        <td className="px-5 py-3">
                          <span className="rounded-md bg-[#f8f8f8] px-2 py-0.5 text-xs font-semibold text-[#e41e1f]">
                            {c.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {c.status !== 'OPEN' && c.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => updateCourseStatus(c, 'OPEN')}
                              className="text-xs font-semibold text-[#e41e1f] hover:underline"
                            >
                              Open
                            </button>
                          )}
                          {c.status === 'OPEN' && (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => updateCourseStatus(c, 'COMPLETED')}
                              className="text-xs font-semibold text-[#e41e1f] hover:underline"
                            >
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Enrol staff</h2>
            <form onSubmit={submitEnrolment} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-[#1f1f1f]">Course *</span>
                <select
                  required
                  value={enrolForm.courseId}
                  onChange={(e) => setEnrolForm({ ...enrolForm, courseId: e.target.value })}
                  className="w-full rounded-lg border border-[#8b8b8b]/30 bg-[#ffffff] px-3 py-2 shadow-sm"
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Employee name"
                required
                value={enrolForm.employeeName}
                onChange={(v) => setEnrolForm({ ...enrolForm, employeeName: v })}
              />
              <Field
                label="Employee ID (optional)"
                value={enrolForm.employeeId}
                onChange={(v) => setEnrolForm({ ...enrolForm, employeeId: v })}
              />
              <Select
                label="Attendance"
                value={enrolForm.attendance}
                onChange={(v) => setEnrolForm({ ...enrolForm, attendance: v })}
                options={ATTENDANCE.map((a) => ({ value: a, label: a }))}
              />
              <Field
                label="Evaluation score"
                type="number"
                value={enrolForm.evaluationScore}
                onChange={(v) => setEnrolForm({ ...enrolForm, evaluationScore: v })}
              />
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-50"
                >
                  Enrol
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
            <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="font-bold text-[#1f1f1f]">Enrolments ({enrolments.length})</h2>
            </div>
            {enrolments.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#8b8b8b]">No enrolments yet.</p>
            ) : (
              <ul className="divide-y divide-[#8b8b8b]/25">
                {enrolments.map((e) => {
                  const course = courses.find((c) => String(c.id || c._id) === String(e.courseId));
                  return (
                    <li key={e.id || e._id} className="px-5 py-4 text-sm">
                      <p className="font-semibold text-[#1f1f1f]">{e.employeeName}</p>
                      <p className="text-[#8b8b8b]">
                        {course?.title || `Course #${e.courseId}`} · {e.attendance}
                        {e.evaluationScore != null ? ` · score ${e.evaluationScore}` : ''}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
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
        className="w-full rounded-lg border border-[#8b8b8b]/30 px-3 py-2 shadow-sm focus:border-[#8b8b8b]/200 focus:outline-none focus:ring-2 focus:ring-[#e41e1f]"
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
        className="w-full rounded-lg border border-[#8b8b8b]/30 bg-[#ffffff] px-3 py-2 shadow-sm"
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

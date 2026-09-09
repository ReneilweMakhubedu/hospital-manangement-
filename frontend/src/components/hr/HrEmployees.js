import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, LoaderCircle, Pencil, Plus, RefreshCw, Users } from 'lucide-react';

import { apiFetch } from '../../auth';
import HrLayout from './HrLayout';

const CATEGORIES = ['PERMANENT', 'CONTRACT', 'INTERN', 'COMMUNITY_SERVICE'];
const STATUSES = ['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'RETIRED'];

const emptyForm = {
  employeeNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
  jobTitle: '',
  employmentCategory: 'PERMANENT',
  startDate: '',
  endDate: '',
  status: 'ACTIVE',
  hpcsaNumber: '',
  qualifications: '',
  managerName: '',
  yearsOfService: '',
  dateOfBirth: '',
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

export default function HrEmployees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, compRes] = await Promise.all([
        apiFetch('/hr/employees', { navigate }),
        apiFetch('/hr/employees/compliance', { navigate }),
      ]);
      const [listData, compData] = await Promise.all([
        listRes.json().catch(() => []),
        compRes.json().catch(() => []),
      ]);
      if (!listRes.ok) throw new Error(listData.error || 'Unable to load employees');
      setEmployees(Array.isArray(listData) ? listData : listData.employees || []);
      if (compRes.ok) {
        setCompliance(
          Array.isArray(compData)
            ? compData
            : compData.employees || compData.items || compData.compliance || []
        );
      } else {
        setCompliance([]);
      }
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

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (row) => {
    setEditingId(row.id || row._id);
    setForm({
      employeeNumber: row.employeeNumber || '',
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      email: row.email || '',
      phone: row.phone || '',
      department: row.department || '',
      jobTitle: row.jobTitle || '',
      employmentCategory: row.employmentCategory || 'PERMANENT',
      startDate: row.startDate ? String(row.startDate).slice(0, 10) : '',
      endDate: row.endDate ? String(row.endDate).slice(0, 10) : '',
      status: row.status || 'ACTIVE',
      hpcsaNumber: row.hpcsaNumber || '',
      qualifications: row.qualifications || '',
      managerName: row.managerName || '',
      yearsOfService: row.yearsOfService != null ? String(row.yearsOfService) : '',
      dateOfBirth: row.dateOfBirth ? String(row.dateOfBirth).slice(0, 10) : '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        employeeNumber: form.employeeNumber.trim() || null,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        department: form.department.trim(),
        jobTitle: form.jobTitle.trim(),
        employmentCategory: form.employmentCategory,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        status: form.status,
        hpcsaNumber: form.hpcsaNumber.trim() || null,
        qualifications: form.qualifications.trim() || null,
        managerName: form.managerName.trim() || null,
        yearsOfService: form.yearsOfService ? Number(form.yearsOfService) : null,
        dateOfBirth: form.dateOfBirth || null,
      };
      const path = editingId ? `/hr/employees/${editingId}` : '/hr/employees';
      const res = await apiFetch(path, {
        navigate,
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save employee');
      setStatus({
        type: 'success',
        message: editingId ? 'Employee updated.' : 'Employee created.',
      });
      resetForm();
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <HrLayout
      title="Employee records"
      subtitle="Workforce profiles, employment category, HPCSA numbers, and compliance gaps."
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

      <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1f1f1f]">
          {editingId ? <Pencil size={18} className="text-[#e41e1f]" /> : <Plus size={18} className="text-[#e41e1f]" />}
          {editingId ? 'Edit employee' : 'Add employee'}
        </h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Employee number" value={form.employeeNumber} onChange={(v) => setForm({ ...form, employeeNumber: v })} />
          <Field label="First name" required value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
          <Field label="Last name" required value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Department" required value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
          <Field label="Job title" required value={form.jobTitle} onChange={(v) => setForm({ ...form, jobTitle: v })} />
          <Select
            label="Category"
            value={form.employmentCategory}
            onChange={(v) => setForm({ ...form, employmentCategory: v })}
            options={CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') }))}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
          />
          <Field label="HPCSA number" value={form.hpcsaNumber} onChange={(v) => setForm({ ...form, hpcsaNumber: v })} />
          <Field label="Start date" type="date" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
          <Field label="End date" type="date" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
          <Field label="Manager" value={form.managerName} onChange={(v) => setForm({ ...form, managerName: v })} />
          <Field label="Years of service" type="number" value={form.yearsOfService} onChange={(v) => setForm({ ...form, yearsOfService: v })} />
          <Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
          <label className="block text-sm sm:col-span-2 lg:col-span-3">
            <span className="mb-1 block font-medium text-[#1f1f1f]">Qualifications</span>
            <textarea
              rows={2}
              value={form.qualifications}
              onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
              className="w-full rounded-lg border border-[#8b8b8b]/30 px-3 py-2 shadow-sm focus:border-[#8b8b8b]/200 focus:outline-none focus:ring-2 focus:ring-[#e41e1f]"
            />
          </label>
          <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-50"
            >
              {editingId ? 'Save changes' : 'Add employee'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-[#8b8b8b]/30 px-4 py-2.5 text-sm font-semibold text-[#1f1f1f]"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {compliance.length > 0 && (
        <section className="mb-8 rounded-2xl border border-amber-200 bg-[#f8f8f8]/60 shadow-sm">
          <div className="border-b border-amber-200 px-5 py-4">
            <h2 className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle size={18} /> Compliance gaps ({compliance.length})
            </h2>
            <p className="mt-1 text-sm text-[#1f1f1f]/80">
              Employees needing HPCSA numbers or missing qualifications.
            </p>
          </div>
          <ul className="divide-y divide-amber-100">
            {compliance.map((row) => (
              <li key={row.id || row._id || `${row.firstName}-${row.lastName}`} className="px-5 py-3 text-sm">
                <span className="font-semibold text-[#1f1f1f]">
                  {row.firstName} {row.lastName}
                </span>
                <span className="text-[#8b8b8b]">
                  {' '}
                  · {row.jobTitle || '—'} · {row.department || '—'}
                </span>
                <span className="ml-2 text-xs font-semibold text-[#1f1f1f]">
                  {!row.hpcsaNumber ? 'Missing HPCSA' : ''}
                  {!row.hpcsaNumber && !row.qualifications ? ' · ' : ''}
                  {!row.qualifications ? 'Missing qualifications' : ''}
                  {row.issue || row.reason || ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#8b8b8b]/30 px-5 py-4">
          <Users className="text-[#e41e1f]" size={20} />
          <div>
            <h2 className="font-bold text-[#1f1f1f]">Employees</h2>
            <p className="text-sm text-[#8b8b8b]">
              {loading ? 'Loading…' : `${employees.length} record(s)`}
            </p>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <LoaderCircle className="animate-spin text-[#e41e1f]" size={28} />
          </div>
        ) : employees.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#8b8b8b]">No employees recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Employee</th>
                  <th className="px-5 py-3 font-semibold">Department / title</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">HPCSA</th>
                  <th className="px-5 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25">
                {employees.map((row) => (
                  <tr key={row.id || row._id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#1f1f1f]">
                        {row.firstName} {row.lastName}
                      </p>
                      <p className="text-xs text-[#8b8b8b]">{row.employeeNumber || row.email}</p>
                    </td>
                    <td className="px-5 py-3 text-[#8b8b8b]">
                      {row.department}
                      <br />
                      <span className="text-xs">{row.jobTitle}</span>
                    </td>
                    <td className="px-5 py-3">{(row.employmentCategory || '').replace(/_/g, ' ')}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-md bg-[#f8f8f8] px-2 py-0.5 text-xs font-semibold text-[#e41e1f]">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#8b8b8b]">{row.hpcsaNumber || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => startEdit(row)}
                          className="inline-flex items-center gap-1 rounded border border-[#8b8b8b]/30 px-2 py-1 text-xs font-semibold hover:bg-[#f8f8f8]"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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

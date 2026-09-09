import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LoaderCircle, Plus, RefreshCw, X } from 'lucide-react';

import { apiFetch } from '../../auth';
import PayrollLayout from './PayrollLayout';

const SHIFT_TYPES = ['MORNING', 'EVENING', 'NIGHT', 'EMERGENCY'];

const emptyForm = {
  employeeNumber: '',
  employeeName: '',
  department: '',
  workDate: '',
  shiftType: 'MORNING',
  hoursWorked: '8',
  overtimeHours: '0',
  status: 'SUBMITTED',
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

function statusStyle(s) {
  const key = (s || '').toUpperCase();
  if (key === 'APPROVED') return 'bg-[#f8f8f8] text-[#e41e1f]';
  if (key === 'REJECTED') return 'bg-[#f8f8f8] text-[#e41e1f]';
  if (key === 'SUBMITTED') return 'bg-[#f8f8f8] text-[#1f1f1f]';
  return 'bg-[#f5f5f5] text-[#1f1f1f]';
}

export default function PayrollTimesheets() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filterStatus ? `?status=${encodeURIComponent(filterStatus)}` : '';
      const res = await apiFetch(`/payroll/timesheets${qs}`, { navigate });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'Unable to load timesheets');
      setRows(Array.isArray(data) ? data : data.timesheets || []);
      setStatus({ type: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [navigate, filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        employeeNumber: form.employeeNumber.trim(),
        employeeName: form.employeeName.trim(),
        department: form.department.trim(),
        workDate: form.workDate,
        shiftType: form.shiftType,
        hoursWorked: Number(form.hoursWorked || 0),
        overtimeHours: Number(form.overtimeHours || 0),
        status: form.status || 'SUBMITTED',
      };
      const res = await apiFetch('/payroll/timesheets', {
        navigate,
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to create timesheet');
      setForm(emptyForm);
      setStatus({ type: 'success', message: 'Timesheet recorded.' });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (row, nextStatus) => {
    const id = row.id || row._id;
    if (!id) return;
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch(`/payroll/timesheets/${id}`, {
        navigate,
        method: 'PUT',
        body: JSON.stringify({ ...row, status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Unable to ${nextStatus.toLowerCase()} timesheet`);
      setStatus({
        type: 'success',
        message: nextStatus === 'APPROVED' ? 'Timesheet approved.' : 'Timesheet rejected.',
      });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PayrollLayout
      title="Time & attendance"
      subtitle="Capture shift timesheets, overtime hours, and approve submissions."
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
          <Plus size={18} className="text-[#e41e1f]" /> New timesheet
        </h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Employee number
            <input
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.employeeNumber}
              onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Employee name
            <input
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.employeeName}
              onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Department
            <input
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Work date
            <input
              type="date"
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.workDate}
              onChange={(e) => setForm({ ...form, workDate: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Shift type
            <select
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.shiftType}
              onChange={(e) => setForm({ ...form, shiftType: e.target.value })}
            >
              {SHIFT_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Hours worked
            <input
              type="number"
              step="0.25"
              min="0"
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.hoursWorked}
              onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Overtime hours
            <input
              type="number"
              step="0.25"
              min="0"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.overtimeHours}
              onChange={(e) => setForm({ ...form, overtimeHours: e.target.value })}
            />
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
            >
              <Plus size={16} />
              {saving ? 'Saving…' : 'Submit timesheet'}
            </button>
          </div>
        </form>
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-[#1f1f1f]">
          Filter status
          <select
            className="ml-2 rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </label>
      </div>

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
          <h2 className="font-bold text-[#1f1f1f]">Timesheets</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-16 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={28} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Employee</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Shift</th>
                  <th className="px-5 py-3 font-semibold">Hours</th>
                  <th className="px-5 py-3 font-semibold">OT</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-[#8b8b8b]">
                      No timesheets found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id || `${row.employeeNumber}-${row.workDate}`}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#1f1f1f]">{row.employeeName || '—'}</p>
                        <p className="text-xs text-[#8b8b8b]">
                          {row.employeeNumber || '—'} · {row.department || '—'}
                        </p>
                      </td>
                      <td className="px-5 py-3">{row.workDate || '—'}</td>
                      <td className="px-5 py-3">{row.shiftType || '—'}</td>
                      <td className="px-5 py-3">{row.hoursWorked ?? 0}</td>
                      <td className="px-5 py-3">{row.overtimeHours ?? 0}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(
                            row.status
                          )}`}
                        >
                          {row.status || 'DRAFT'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {(row.status === 'SUBMITTED' || row.status === 'DRAFT') && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => updateStatus(row, 'APPROVED')}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#e41e1f] px-2.5 py-1.5 text-xs font-semibold text-[#ffffff] hover:bg-[#f8f8f8] disabled:opacity-50"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => updateStatus(row, 'REJECTED')}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#e41e1f] px-2.5 py-1.5 text-xs font-semibold text-[#ffffff] hover:bg-[#f8f8f8] disabled:opacity-50"
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PayrollLayout>
  );
}

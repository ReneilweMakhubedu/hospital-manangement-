import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarOff, Check, LoaderCircle, Plus, RefreshCw, X } from 'lucide-react';

import { apiFetch } from '../../auth';
import HrLayout from './HrLayout';

const LEAVE_TYPES = ['ANNUAL', 'SICK', 'FAMILY', 'STUDY', 'UNPAID'];

const emptyForm = {
  employeeId: '',
  leaveType: 'ANNUAL',
  startDate: '',
  endDate: '',
  days: '',
  reason: '',
  approverName: '',
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
  if (key === 'REJECTED' || key === 'CANCELLED') return 'bg-[#f8f8f8] text-[#e41e1f]';
  return 'bg-[#f8f8f8] text-[#1f1f1f]';
}

export default function HrLeave() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leaveRes, empRes] = await Promise.all([
        apiFetch('/hr/leave', { navigate }),
        apiFetch('/hr/employees', { navigate }),
      ]);
      const [leaveData, empData] = await Promise.all([
        leaveRes.json().catch(() => []),
        empRes.json().catch(() => []),
      ]);
      if (!leaveRes.ok) throw new Error(leaveData.error || 'Unable to load leave requests');
      setRequests(Array.isArray(leaveData) ? leaveData : leaveData.requests || leaveData.leave || []);
      if (empRes.ok) {
        setEmployees(Array.isArray(empData) ? empData : empData.employees || []);
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

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        employeeId: form.employeeId ? Number(form.employeeId) || form.employeeId : null,
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        days: form.days ? Number(form.days) : null,
        reason: form.reason.trim() || null,
        status: 'PENDING',
      };
      const res = await apiFetch('/hr/leave', {
        navigate,
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to create leave request');
      setStatus({ type: 'success', message: 'Leave request submitted.' });
      setForm(emptyForm);
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
      const res = await apiFetch(`/hr/leave/${id}`, {
        navigate,
        method: 'PUT',
        body: JSON.stringify({
          status: nextStatus,
          approverName: form.approverName.trim() || localStorage.getItem('userEmail') || 'HR Admin',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Unable to ${nextStatus.toLowerCase()} leave`);
      setStatus({
        type: 'success',
        message: nextStatus === 'APPROVED' ? 'Leave approved.' : 'Leave rejected.',
      });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const employeeLabel = (row) => {
    if (row.employeeName) return row.employeeName;
    const match = employees.find((e) => String(e.id || e._id) === String(row.employeeId));
    if (match) return `${match.firstName} ${match.lastName}`;
    return row.employeeId ? `Employee #${row.employeeId}` : '—';
  };

  return (
    <HrLayout
      title="Leave & attendance"
      subtitle="Capture leave requests and approve or reject pending applications."
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
          <Plus size={18} className="text-[#e41e1f]" /> New leave request
        </h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#1f1f1f]">Employee *</span>
            <select
              required
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="w-full rounded-lg border border-[#8b8b8b]/30 bg-[#ffffff] px-3 py-2 shadow-sm focus:border-[#8b8b8b]/200 focus:outline-none focus:ring-2 focus:ring-[#e41e1f]"
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id || e._id} value={e.id || e._id}>
                  {e.firstName} {e.lastName} ({e.department})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#1f1f1f]">Leave type</span>
            <select
              value={form.leaveType}
              onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
              className="w-full rounded-lg border border-[#8b8b8b]/30 bg-[#ffffff] px-3 py-2 shadow-sm"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#1f1f1f]">Days</span>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={form.days}
              onChange={(e) => setForm({ ...form, days: e.target.value })}
              className="w-full rounded-lg border border-[#8b8b8b]/30 px-3 py-2 shadow-sm focus:border-[#8b8b8b]/200 focus:outline-none focus:ring-2 focus:ring-[#e41e1f]"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#1f1f1f]">Start date *</span>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full rounded-lg border border-[#8b8b8b]/30 px-3 py-2 shadow-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#1f1f1f]">End date *</span>
            <input
              type="date"
              required
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full rounded-lg border border-[#8b8b8b]/30 px-3 py-2 shadow-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#1f1f1f]">Approver name (for decisions)</span>
            <input
              value={form.approverName}
              onChange={(e) => setForm({ ...form, approverName: e.target.value })}
              className="w-full rounded-lg border border-[#8b8b8b]/30 px-3 py-2 shadow-sm"
              placeholder="HR / line manager"
            />
          </label>
          <label className="block text-sm sm:col-span-2 lg:col-span-3">
            <span className="mb-1 block font-medium text-[#1f1f1f]">Reason</span>
            <textarea
              rows={2}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full rounded-lg border border-[#8b8b8b]/30 px-3 py-2 shadow-sm"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-50"
            >
              Submit request
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#8b8b8b]/30 px-5 py-4">
          <CalendarOff className="text-[#e41e1f]" size={20} />
          <div>
            <h2 className="font-bold text-[#1f1f1f]">Leave requests</h2>
            <p className="text-sm text-[#8b8b8b]">
              {loading ? 'Loading…' : `${requests.length} request(s)`}
            </p>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <LoaderCircle className="animate-spin text-[#e41e1f]" size={28} />
          </div>
        ) : requests.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#8b8b8b]">No leave requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Employee</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Dates</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25">
                {requests.map((row) => {
                  const pending = (row.status || '').toUpperCase() === 'PENDING';
                  return (
                    <tr key={row.id || row._id}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#1f1f1f]">{employeeLabel(row)}</p>
                        {row.reason && <p className="text-xs text-[#8b8b8b]">{row.reason}</p>}
                      </td>
                      <td className="px-5 py-3">
                        {row.leaveType}
                        {row.days != null ? ` · ${row.days}d` : ''}
                      </td>
                      <td className="px-5 py-3 text-[#8b8b8b]">
                        {row.startDate} → {row.endDate}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusStyle(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {pending && (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => updateStatus(row, 'APPROVED')}
                              className="inline-flex items-center gap-1 rounded border border-[#8b8b8b]/30 px-2 py-1 text-xs font-semibold text-[#e41e1f] hover:bg-[#f8f8f8]"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => updateStatus(row, 'REJECTED')}
                              className="inline-flex items-center gap-1 rounded border border-[#e41e1f]/40 px-2 py-1 text-xs font-semibold text-[#e41e1f] hover:bg-[#f8f8f8]"
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </HrLayout>
  );
}

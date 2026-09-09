import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Plus, RefreshCw } from 'lucide-react';

import { apiFetch } from '../../auth';
import PayrollLayout from './PayrollLayout';

const STATUSES = ['FLAGGED', 'UNDER_REVIEW', 'CLEARED', 'CONFIRMED', 'ESCALATED'];

const emptyForm = {
  referenceNumber: '',
  employeeNumber: '',
  employeeName: '',
  department: '',
  riskScore: '50',
  status: 'FLAGGED',
  amountAtRisk: '',
  notes: '',
};

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(n);
}

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
  if (key === 'CLEARED') return 'bg-[#f8f8f8] text-[#e41e1f]';
  if (key === 'CONFIRMED' || key === 'ESCALATED') return 'bg-[#f8f8f8] text-[#e41e1f]';
  if (key === 'UNDER_REVIEW') return 'bg-[#f8f8f8] text-[#1f1f1f]';
  return 'bg-[#f5f5f5] text-[#1f1f1f]';
}

export default function PayrollGhostCases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/payroll/ghost-cases', { navigate });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'Unable to load ghost cases');
      setCases(Array.isArray(data) ? data : data.cases || data.ghostCases || []);
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
        referenceNumber: form.referenceNumber.trim() || null,
        employeeNumber: form.employeeNumber.trim(),
        employeeName: form.employeeName.trim(),
        department: form.department.trim(),
        riskScore: Number(form.riskScore || 0),
        status: form.status,
        amountAtRisk: Number(form.amountAtRisk || 0),
        notes: form.notes.trim() || null,
      };
      const path = editingId ? `/payroll/ghost-cases/${editingId}` : '/payroll/ghost-cases';
      const res = await apiFetch(path, {
        navigate,
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save ghost case');
      setForm(emptyForm);
      setEditingId(null);
      setStatus({
        type: 'success',
        message: editingId ? 'Ghost case updated.' : 'Ghost case recorded.',
      });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const editCase = (row) => {
    setEditingId(row.id || row._id);
    setForm({
      referenceNumber: row.referenceNumber || '',
      employeeNumber: row.employeeNumber || '',
      employeeName: row.employeeName || '',
      department: row.department || '',
      riskScore: row.riskScore ?? '50',
      status: row.status || 'FLAGGED',
      amountAtRisk: row.amountAtRisk ?? '',
      notes: row.notes || '',
    });
  };

  const setCaseStatus = async (row, nextStatus) => {
    const id = row.id || row._id;
    if (!id) return;
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch(`/payroll/ghost-cases/${id}`, {
        navigate,
        method: 'PUT',
        body: JSON.stringify({ ...row, status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to update case status');
      setStatus({ type: 'success', message: `Case marked ${nextStatus}.` });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PayrollLayout
      title="Ghost worker cases"
      subtitle="Track flagged payroll anomalies through review, clearance, confirmation, and escalation."
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
          <Plus size={18} className="text-[#e41e1f]" />
          {editingId ? 'Update ghost case' : 'New ghost case'}
        </h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Reference
            <input
              placeholder="Auto if blank"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.referenceNumber}
              onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
            />
          </label>
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
            Risk score
            <input
              type="number"
              min="0"
              max="100"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.riskScore}
              onChange={(e) => setForm({ ...form, riskScore: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Amount at risk
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.amountAtRisk}
              onChange={(e) => setForm({ ...form, amountAtRisk: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f]">
            Status
            <select
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2 lg:col-span-3">
            Notes
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Update case' : 'Create case'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="rounded-lg border border-[#8b8b8b]/40 px-4 py-2.5 text-sm font-semibold text-[#1f1f1f]"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
          <h2 className="font-bold text-[#1f1f1f]">Open & historical cases</h2>
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
                  <th className="px-5 py-3 font-semibold">Reference</th>
                  <th className="px-5 py-3 font-semibold">Employee</th>
                  <th className="px-5 py-3 font-semibold">Risk</th>
                  <th className="px-5 py-3 font-semibold">At risk</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25">
                {cases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-[#8b8b8b]">
                      No ghost-worker cases recorded.
                    </td>
                  </tr>
                ) : (
                  cases.map((row) => (
                    <tr key={row.id || row.referenceNumber}>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => editCase(row)}
                          className="font-semibold text-[#e41e1f] hover:underline"
                        >
                          {row.referenceNumber || `#${row.id}`}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#1f1f1f]">{row.employeeName || '—'}</p>
                        <p className="text-xs text-[#8b8b8b]">
                          {row.employeeNumber || '—'} · {row.department || '—'}
                        </p>
                      </td>
                      <td className="px-5 py-3">{row.riskScore ?? '—'}</td>
                      <td className="px-5 py-3">{formatMoney(row.amountAtRisk)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(
                            row.status
                          )}`}
                        >
                          {row.status || 'FLAGGED'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {STATUSES.filter((s) => s !== row.status).map((s) => (
                            <button
                              key={s}
                              type="button"
                              disabled={saving}
                              onClick={() => setCaseStatus(row, s)}
                              className="rounded border border-[#8b8b8b]/30 px-2 py-1 text-[10px] font-semibold uppercase text-[#8b8b8b] hover:border-[#8b8b8b]/40 hover:text-[#e41e1f] disabled:opacity-50"
                            >
                              {s.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
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

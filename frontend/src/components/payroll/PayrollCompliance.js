import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Plus, RefreshCw } from 'lucide-react';

import { apiFetch } from '../../auth';
import PayrollLayout from './PayrollLayout';

const CERT_TYPES = ['HPCSA', 'SANC', 'OTHER'];
const CERT_STATUSES = ['VALID', 'EXPIRING', 'EXPIRED'];

const emptyForm = {
  employeeNumber: '',
  employeeName: '',
  certType: 'HPCSA',
  licenceNumber: '',
  expiryDate: '',
  status: 'VALID',
  department: '',
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
  if (key === 'VALID') return 'bg-[#f8f8f8] text-[#e41e1f]';
  if (key === 'EXPIRED') return 'bg-[#f8f8f8] text-[#e41e1f]';
  return 'bg-[#f8f8f8] text-[#1f1f1f]';
}

export default function PayrollCompliance() {
  const navigate = useNavigate();
  const [certs, setCerts] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [certsRes, expRes] = await Promise.all([
        apiFetch('/payroll/certifications', { navigate }),
        apiFetch('/payroll/certifications/expiring', { navigate }),
      ]);
      const [certsData, expData] = await Promise.all([
        certsRes.json().catch(() => []),
        expRes.json().catch(() => []),
      ]);
      if (!certsRes.ok) throw new Error(certsData.error || 'Unable to load certifications');
      setCerts(Array.isArray(certsData) ? certsData : certsData.certifications || []);
      if (expRes.ok) {
        setExpiring(Array.isArray(expData) ? expData : expData.expiring || []);
      } else {
        setExpiring([]);
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
        employeeNumber: form.employeeNumber.trim(),
        employeeName: form.employeeName.trim(),
        certType: form.certType,
        licenceNumber: form.licenceNumber.trim(),
        expiryDate: form.expiryDate,
        status: form.status,
        department: form.department.trim(),
      };
      const path = editingId
        ? `/payroll/certifications/${editingId}`
        : '/payroll/certifications';
      const res = await apiFetch(path, {
        navigate,
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save certification');
      setForm(emptyForm);
      setEditingId(null);
      setStatus({
        type: 'success',
        message: editingId ? 'Certification updated.' : 'Certification recorded.',
      });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const editRow = (row) => {
    setEditingId(row.id || row._id);
    setForm({
      employeeNumber: row.employeeNumber || '',
      employeeName: row.employeeName || '',
      certType: row.certType || 'HPCSA',
      licenceNumber: row.licenceNumber || '',
      expiryDate: row.expiryDate ? String(row.expiryDate).slice(0, 10) : '',
      status: row.status || 'VALID',
      department: row.department || '',
    });
  };

  return (
    <PayrollLayout
      title="Compliance & certifications"
      subtitle="HPCSA, SANC, and other professional licences — including those nearing expiry."
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

      {loading && certs.length === 0 ? (
        <div className="flex justify-center py-20 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={28} />
        </div>
      ) : (
        <>
          <section className="mb-8 rounded-2xl border border-amber-200 bg-[#f8f8f8]/50 shadow-sm">
            <div className="border-b border-amber-200 px-5 py-4">
              <h2 className="font-bold text-amber-950">Expiring certifications</h2>
              <p className="mt-1 text-sm text-[#1f1f1f]">Licences due within the monitoring window.</p>
            </div>
            {expiring.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[#1f1f1f]/70">No certifications currently expiring.</p>
            ) : (
              <ul className="divide-y divide-amber-100">
                {expiring.map((row) => (
                  <li
                    key={row.id || `${row.employeeNumber}-${row.licenceNumber}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                  >
                    <div>
                      <p className="font-medium text-[#1f1f1f]">{row.employeeName || '—'}</p>
                      <p className="text-xs text-[#8b8b8b]">
                        {row.certType || '—'} · {row.licenceNumber || '—'} · {row.department || '—'}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-[#1f1f1f]">
                      Expires {row.expiryDate || '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1f1f1f]">
              <Plus size={18} className="text-[#e41e1f]" />
              {editingId ? 'Update certification' : 'Add certification'}
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
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Cert type
                <select
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.certType}
                  onChange={(e) => setForm({ ...form, certType: e.target.value })}
                >
                  {CERT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Licence number
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.licenceNumber}
                  onChange={(e) => setForm({ ...form, licenceNumber: e.target.value })}
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Expiry date
                <input
                  type="date"
                  required
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Status
                <select
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {CERT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
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
              <h2 className="font-bold text-[#1f1f1f]">All certifications</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Employee</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Licence</th>
                    <th className="px-5 py-3 font-semibold">Expiry</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8b8b8b]/25">
                  {certs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-[#8b8b8b]">
                        No certifications recorded.
                      </td>
                    </tr>
                  ) : (
                    certs.map((row) => (
                      <tr key={row.id || row.licenceNumber}>
                        <td className="px-5 py-3">
                          <p className="font-medium text-[#1f1f1f]">{row.employeeName || '—'}</p>
                          <p className="text-xs text-[#8b8b8b]">
                            {row.employeeNumber || '—'} · {row.department || '—'}
                          </p>
                        </td>
                        <td className="px-5 py-3">{row.certType || '—'}</td>
                        <td className="px-5 py-3">{row.licenceNumber || '—'}</td>
                        <td className="px-5 py-3">{row.expiryDate || '—'}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(
                              row.status
                            )}`}
                          >
                            {row.status || 'VALID'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button
                            type="button"
                            onClick={() => editRow(row)}
                            className="text-sm font-semibold text-[#e41e1f] hover:underline"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </PayrollLayout>
  );
}

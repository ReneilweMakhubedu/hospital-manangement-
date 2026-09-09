import React, { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch, getRole } from '../../auth';
import HrLayout from './HrLayout';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
};

export default function HrUsers() {
  const navigate = useNavigate();
  const role = getRole();
  const isAdmin = role === 'admin' || role === 'super_admin';

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await apiFetch('/admin/hr-users', { navigate });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'Unable to load HR users');
      setUsers(Array.isArray(data) ? data : []);
      setStatus({ type: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isAdmin) {
    return (
      <HrLayout title="HR users" subtitle="Only hospital admin can create HR login accounts.">
        <p className="rounded-xl bg-[#f8f8f8] px-4 py-3 text-sm text-[#1f1f1f]">
          You do not have permission to manage HR login accounts.
        </p>
      </HrLayout>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch('/admin/add-hr', {
        navigate,
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to create HR user');
      setForm(emptyForm);
      setStatus({ type: 'success', message: 'HR user created. They can sign in with their email and password.' });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <HrLayout
      title="HR login accounts"
      subtitle="Create HR officer accounts that sign in to the HR portal."
      actions={
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-[#8b8b8b]/30 bg-[#ffffff] px-3 py-2 text-sm font-semibold text-[#1f1f1f]"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      }
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

      <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <UserCog className="text-[#e41e1f]" size={20} />
          <h2 className="text-lg font-bold text-[#1f1f1f]">Create HR officer</h2>
        </div>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-[#1f1f1f]">
            First name
            <input
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </label>
          <label className="text-sm font-semibold text-[#1f1f1f]">
            Last name
            <input
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </label>
          <label className="text-sm font-semibold text-[#1f1f1f]">
            Work email
            <input
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="text-sm font-semibold text-[#1f1f1f]">
            Temporary password
            <input
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
            >
              <Plus size={16} />
              {saving ? 'Creating…' : 'Create HR account'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">HR officers</h2>
        {loading ? (
          <p className="text-sm text-[#8b8b8b]">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-[#8b8b8b]">No HR login accounts yet.</p>
        ) : (
          <ul className="divide-y divide-[#8b8b8b]/25">
            {users.map((u) => (
              <li key={u.id || u._id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-semibold text-[#1f1f1f]">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-sm text-[#8b8b8b]">{u.email}</p>
                </div>
                <span className="rounded-full bg-[#f8f8f8] px-3 py-1 text-xs font-semibold text-[#e41e1f]">
                  {u.role || 'hr'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </HrLayout>
  );
}

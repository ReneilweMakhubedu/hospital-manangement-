import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '../auth';
import { brand } from '../brand';

export default function Settings() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/admin/profile', { navigate });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Unable to load profile');
        if (!cancelled) {
          setForm({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
          });
        }
      } catch (error) {
        if (!cancelled) setStatus({ type: 'error', message: error.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch('/admin/profile', {
        navigate,
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save settings');
      setForm({
        firstName: data.firstName || form.firstName,
        lastName: data.lastName || form.lastName,
        email: data.email || form.email,
      });
      setStatus({ type: 'success', message: 'Admin profile updated.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8f8f8] via-[#f8f8f8]/40 to-[#f5f5f5] px-5 py-8">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e41e1f]"
        >
          <ArrowLeft size={16} /> Back to admin
        </button>

        <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#e41e1f]">{brand.shortName}</p>
          <h1 className="mt-1 text-3xl font-bold text-[#1f1f1f]">Admin settings</h1>
          <p className="mt-2 text-[#8b8b8b]">Update your hospital administrator profile.</p>

          {status.message && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                status.type === 'error' ? 'bg-[#f8f8f8] text-[#e41e1f]' : 'bg-[#f8f8f8] text-[#e41e1f]'
              }`}
            >
              {status.message}
            </div>
          )}

          {loading ? (
            <p className="mt-6 text-[#8b8b8b]">Loading…</p>
          ) : (
            <form onSubmit={save} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                First name
                <input
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Last name
                <input
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Email
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? 'Saving…' : 'Save settings'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

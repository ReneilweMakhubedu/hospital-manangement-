import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  LoaderCircle,
  Plus,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch, getRole } from '../auth';
import { brand } from '../brand';

const emptyForm = {
  theatreId: '',
  sessionDate: '',
  startTime: '08:00',
  endTime: '12:00',
  procedure: '',
  status: 'BOOKED',
};

const STATUS_STYLES = {
  BOOKED: 'bg-[#f8f8f8] text-[#1f1f1f]',
  IN_PROGRESS: 'bg-amber-100 text-[#1f1f1f]',
  COMPLETED: 'bg-[#f8f8f8] text-[#e41e1f]',
  CANCELLED: 'bg-red-100 text-[#e41e1f]',
  IDLE: 'bg-[#f5f5f5] text-[#1f1f1f]',
};

export default function TheatreUtilisation() {
  const navigate = useNavigate();
  const role = getRole();
  const isAdmin = role === 'admin';

  const [theatres, setTheatres] = useState([]);
  const [utilisation, setUtilisation] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [theatresRes, utilRes, sessionsRes] = await Promise.all([
        apiFetch('/theatres', { navigate }),
        apiFetch('/theatres/utilisation', { navigate }),
        apiFetch('/theatres/sessions', { navigate }),
      ]);
      const [theatresData, utilData, sessionsData] = await Promise.all([
        theatresRes.json().catch(() => []),
        utilRes.json().catch(() => []),
        sessionsRes.json().catch(() => []),
      ]);
      if (!theatresRes.ok) throw new Error(theatresData.error || 'Unable to load theatres');
      if (!utilRes.ok) throw new Error(utilData.error || 'Unable to load utilisation');
      if (!sessionsRes.ok) throw new Error(sessionsData.error || 'Unable to load sessions');

      const theatreList = Array.isArray(theatresData) ? theatresData : theatresData.theatres || [];
      setTheatres(theatreList);
      setUtilisation(Array.isArray(utilData) ? utilData : utilData.utilisation || []);
      setSessions(Array.isArray(sessionsData) ? sessionsData : sessionsData.sessions || []);
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

  const change = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await apiFetch('/theatres/sessions', {
        method: 'POST',
        navigate,
        body: JSON.stringify({
          theatreId: form.theatreId,
          sessionDate: form.sessionDate,
          startTime: form.startTime,
          endTime: form.endTime,
          procedure: form.procedure.trim(),
          status: form.status,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to book theatre session');
      setForm(emptyForm);
      setStatus({ type: 'success', message: 'Theatre session booked.' });
      await loadData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const utilFor = (theatreId) => {
    const row = utilisation.find(
      (u) => String(u.theatreId || u._id || u.id) === String(theatreId)
    );
    return row?.utilisationPercent ?? row?.percent ?? row?.utilisation ?? null;
  };

  return (
    <main className="min-h-screen bg-[#f8f8f8] px-5 py-8 text-[#1f1f1f] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate(isAdmin ? '/admin' : '/doctor')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e41e1f] hover:text-[#e41e1f]"
        >
          <ArrowLeft size={16} /> Back to {isAdmin ? 'admin' : 'doctor'}
        </button>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#e41e1f]">
              {brand.shortName} · Infrastructure Recovery
            </p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold tracking-tight">
              <Building2 className="h-8 w-8 text-[#e41e1f]" />
              Theatre utilisation
            </h1>
            <p className="mt-2 text-[#8b8b8b]">
              Monitor booked vs used theatre capacity. Link scheduled cases from the surgical waitlist.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2 text-sm font-semibold hover:bg-[#f8f8f8]"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {status.message && (
          <p
            role="alert"
            className={`mb-6 rounded-lg px-4 py-3 text-sm ${
              status.type === 'success' ? 'bg-[#f8f8f8] text-[#e41e1f]' : 'bg-[#f8f8f8] text-[#e41e1f]'
            }`}
          >
            {status.message}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoaderCircle className="animate-spin text-[#e41e1f]" size={32} />
          </div>
        ) : (
          <>
            <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {theatres.length === 0 ? (
                <p className="text-sm text-[#8b8b8b] sm:col-span-2 lg:col-span-3">
                  No theatres configured yet.
                </p>
              ) : (
                theatres.map((theatre) => {
                  const id = theatre._id || theatre.id;
                  const pct = utilFor(id);
                  return (
                    <div
                      key={id}
                      className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm"
                    >
                      <h2 className="font-bold text-[#1f1f1f]">
                        {theatre.name || theatre.code || `Theatre ${id}`}
                      </h2>
                      <p className="mt-1 text-sm text-[#8b8b8b]">
                        {theatre.specialty || theatre.type || 'General'}
                      </p>
                      <p className="mt-4 text-3xl font-bold text-[#e41e1f]">
                        {pct == null ? '—' : `${Math.round(Number(pct))}%`}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
                        Utilisation
                      </p>
                    </div>
                  );
                })
              )}
            </section>

            <div className="grid gap-6 lg:grid-cols-5">
              <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm lg:col-span-2 sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Plus size={18} className="text-[#e41e1f]" /> Book session
                </h2>
                <form onSubmit={submit} className="mt-4 space-y-4">
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Theatre
                    <select
                      required
                      name="theatreId"
                      value={form.theatreId}
                      onChange={change}
                      className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                    >
                      <option value="">Select theatre</option>
                      {theatres.map((t) => (
                        <option key={t._id || t.id} value={t._id || t.id}>
                          {t.name || t.code || `Theatre ${t._id || t.id}`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Date
                    <input
                      required
                      type="date"
                      name="sessionDate"
                      value={form.sessionDate}
                      onChange={change}
                      className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm font-semibold text-[#1f1f1f]">
                      Start
                      <input
                        required
                        type="time"
                        name="startTime"
                        value={form.startTime}
                        onChange={change}
                        className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-[#1f1f1f]">
                      End
                      <input
                        required
                        type="time"
                        name="endTime"
                        value={form.endTime}
                        onChange={change}
                        className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                      />
                    </label>
                  </div>
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Procedure
                    <input
                      required
                      name="procedure"
                      value={form.procedure}
                      onChange={change}
                      className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[#1f1f1f]">
                    Status
                    <select
                      name="status"
                      value={form.status}
                      onChange={change}
                      className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                    >
                      <option value="BOOKED">Booked</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </label>
                  <button
                    type="submit"
                    disabled={saving || theatres.length === 0}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-bold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
                  >
                    {saving && <LoaderCircle size={16} className="animate-spin" />}
                    {saving ? 'Booking…' : 'Book session'}
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-3">
                <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                  <h2 className="flex items-center gap-2 font-bold">
                    <CalendarClock size={18} className="text-[#e41e1f]" /> Sessions
                  </h2>
                </div>
                {sessions.length === 0 ? (
                  <p className="px-5 py-16 text-center text-sm text-[#8b8b8b]">
                    No theatre sessions booked yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-[#f8f8f8] text-[#8b8b8b]">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Theatre</th>
                          <th className="px-5 py-3 font-semibold">Date / time</th>
                          <th className="px-5 py-3 font-semibold">Procedure</th>
                          <th className="px-5 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#8b8b8b]/25">
                        {sessions.map((session) => {
                          const id = session._id || session.id;
                          const st = (session.status || 'BOOKED').toUpperCase();
                          return (
                            <tr key={id}>
                              <td className="px-5 py-3 font-medium">
                                {session.theatreName || session.theatre || '—'}
                              </td>
                              <td className="px-5 py-3 text-[#8b8b8b]">
                                {session.sessionDate || session.date || '—'}
                                {(session.startTime || session.endTime) && (
                                  <span className="block text-xs">
                                    {session.startTime || '?'} – {session.endTime || '?'}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3">{session.procedure || '—'}</td>
                              <td className="px-5 py-3">
                                <span
                                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                    STATUS_STYLES[st] || STATUS_STYLES.BOOKED
                                  }`}
                                >
                                  {st}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

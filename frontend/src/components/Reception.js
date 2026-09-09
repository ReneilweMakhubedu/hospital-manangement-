import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  UserPlus,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { apiFetch, getRole } from '../auth';
import { brand } from '../brand';

export default function Reception() {
  const navigate = useNavigate();
  const role = getRole();
  const isAdmin = role === 'admin';

  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [walkInReason, setWalkInReason] = useState('');
  const [bookedPatientId, setBookedPatientId] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [lastQueue, setLastQueue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/queue/patients', { navigate });
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data.error || 'Unable to load patients');
        if (!cancelled) setPatients(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) setStatus({ type: 'error', message: error.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const addToQueue = async (selectedId, reason) => {
    if (!selectedId) {
      setStatus({ type: 'error', message: 'Select a registered patient first.' });
      return;
    }
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch('/queue', {
        navigate,
        method: 'POST',
        body: JSON.stringify({ patientId: Number(selectedId), reason: reason || 'Reception check-in' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to add patient to queue');
      const ticket = data.queue?.queueNumber ?? data.queue?.number ?? '';
      setLastQueue(ticket ? `Q${ticket}` : '');
      setStatus({
        type: 'success',
        message: data.message || 'Patient checked in and added to today’s queue.',
      });
      setWalkInReason('');
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const startWalkIn = (event) => {
    event.preventDefault();
    addToQueue(patientId, walkInReason.trim() || 'Walk-in');
  };

  const startBooked = async (event) => {
    event.preventDefault();
    if (!bookedPatientId) {
      setStatus({ type: 'error', message: 'Select the booked patient to check in.' });
      return;
    }
    await addToQueue(bookedPatientId, 'Booked appointment arrival');
  };

  const patientOptions = patients.map((p) => ({
    id: String(p.id || p._id),
    label: `${p.firstName || ''} ${p.lastName || ''}`.trim() + (p.idNumber ? ` · ${p.idNumber}` : ''),
  }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8f8f8] via-[#f8f8f8]/40 to-[#f5f5f5] px-5 py-8 text-[#1f1f1f] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate(isAdmin ? '/admin' : '/doctor')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e41e1f] hover:text-[#e41e1f]"
        >
          <ArrowLeft size={16} /> Back to {isAdmin ? 'admin' : 'doctor'}
        </button>

        <header className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm backdrop-blur sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#e41e1f]">
            {brand.shortName} · Patient Experience
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f] sm:text-4xl">
            Digital reception
          </h1>
          <p className="mt-2 max-w-2xl text-[#8b8b8b]">
            Check patients into the live queue. New patients must be registered first, then selected here.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/queue"
              className="inline-flex items-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-bold text-[#ffffff] hover:bg-[#e41e1f]"
            >
              <ClipboardList size={16} /> Open smart queue
            </Link>
            <Link
              to="/appointments"
              className="inline-flex items-center gap-2 rounded-lg border border-[#e41e1f] px-4 py-2.5 text-sm font-bold text-[#e41e1f] hover:bg-[#f8f8f8]"
            >
              <CalendarDays size={16} /> Open appointments
            </Link>
            <Link
              to="/patients"
              className="inline-flex items-center gap-2 rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] hover:bg-[#f8f8f8]"
            >
              <Users size={16} /> Patient register
            </Link>
          </div>
        </header>

        {status.message && (
          <p
            role="alert"
            className={`mb-6 rounded-lg px-4 py-3 text-sm ${
              status.type === 'success' ? 'bg-[#f8f8f8] text-[#1f1f1f]' : 'bg-[#f8f8f8] text-[#e41e1f]'
            }`}
          >
            {status.message}
            {lastQueue && status.type === 'success' && (
              <span className="mt-2 block font-semibold">Queue ticket: {lastQueue}</span>
            )}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-[#e41e1f]">
              <UserPlus size={20} />
              <h2 className="text-lg font-bold text-[#1f1f1f]">Walk-in check-in</h2>
            </div>
            <p className="mb-5 text-sm text-[#8b8b8b]">
              Select a registered patient and place them on today’s waiting list.
            </p>
            <form onSubmit={startWalkIn} className="space-y-4">
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Patient
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2.5 text-sm"
                  required
                >
                  <option value="">Select patient…</option>
                  {patientOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label || p.id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Reason for visit
                <textarea
                  rows={3}
                  value={walkInReason}
                  onChange={(e) => setWalkInReason(e.target.value)}
                  placeholder="Chief complaint or clinic destination"
                  className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2.5 text-sm"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-bold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
              >
                {saving ? 'Checking in…' : 'Check in to queue'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-[#e41e1f]">
              <CalendarDays size={20} />
              <h2 className="text-lg font-bold text-[#1f1f1f]">Booked patient arrival</h2>
            </div>
            <p className="mb-5 text-sm text-[#8b8b8b]">
              Patient has an appointment — add them to the live queue on arrival.
            </p>
            <form onSubmit={startBooked} className="space-y-4">
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Patient
                <select
                  value={bookedPatientId}
                  onChange={(e) => setBookedPatientId(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2.5 text-sm"
                  required
                >
                  <option value="">Select patient…</option>
                  {patientOptions.map((p) => (
                    <option key={`b-${p.id}`} value={p.id}>
                      {p.label || p.id}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-bold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
              >
                {saving ? 'Checking in…' : 'Check in booked patient'}
              </button>
              <Link to="/appointments" className="block text-center text-sm font-semibold text-[#e41e1f]">
                Review appointments →
              </Link>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

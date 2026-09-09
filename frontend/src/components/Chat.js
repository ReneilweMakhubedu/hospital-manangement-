import React, { useEffect, useState } from 'react';
import { ArrowLeft, Megaphone, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch, getRole } from '../auth';
import { brand } from '../brand';

export default function Chat() {
  const navigate = useNavigate();
  const role = getRole();
  const home = role === 'doctor' ? '/doctor' : '/admin';
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/audit/recent', { navigate });
      const data = await res.json().catch(() => ([]));
      if (!res.ok) {
        const err = data?.error || 'Unable to load staff activity';
        throw new Error(err);
      }
      setEvents(Array.isArray(data) ? data : data.events || data.items || []);
      setStatus({ type: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8f8f8] via-[#f8f8f8]/40 to-[#f5f5f5] px-5 py-8">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate(home)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e41e1f]"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#f8f8f8] p-3 text-[#e41e1f]">
              <Megaphone size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#e41e1f]">{brand.shortName}</p>
              <h1 className="text-3xl font-bold text-[#1f1f1f]">Staff activity board</h1>
              <p className="mt-2 text-[#8b8b8b]">
                Recent clinical and admin actions across the hospital system for coordination.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2 text-sm font-semibold text-[#ffffff]"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </header>

        {status.message && (
          <div className="mb-4 rounded-xl bg-[#f8f8f8] px-4 py-3 text-sm text-[#e41e1f]">{status.message}</div>
        )}

        {loading ? (
          <p className="text-[#8b8b8b]">Loading activity…</p>
        ) : events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#8b8b8b]/40 bg-[#ffffff] p-6 text-[#8b8b8b]">
            No recent staff activity logged yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {events.slice(0, 40).map((ev, idx) => (
              <li
                key={ev.id || ev._id || idx}
                className="rounded-xl border border-[#8b8b8b]/30 bg-[#ffffff] px-4 py-3 shadow-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-[#1f1f1f]">
                    {ev.action || 'Action'} · {ev.resourceType || ev.entityType || 'System'}
                  </p>
                  <p className="text-xs text-[#8b8b8b]">
                    {ev.createdAt || ev.timestamp || ''}
                  </p>
                </div>
                <p className="mt-1 text-sm text-[#8b8b8b]">
                  {ev.actorEmail || ev.actorRole || 'Staff'}
                  {ev.detail || ev.details || ev.message ? ` — ${ev.detail || ev.details || ev.message}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

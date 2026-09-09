import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Filter, LoaderCircle, RefreshCw, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '../auth';
import { brand } from '../brand';

export default function AuditTrail() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    actor: '',
    action: '',
    entity: '',
    q: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let response = await apiFetch('/audit/recent', { navigate });
      if (!response.ok && response.status === 404) {
        response = await apiFetch('/audit', { navigate });
      }
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data.error || 'Unable to load audit events');

      setEvents(Array.isArray(data) ? data : data.events || data.recent || []);
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
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));

  const filtered = useMemo(() => {
    const actor = filters.actor.trim().toLowerCase();
    const action = filters.action.trim().toLowerCase();
    const entity = filters.entity.trim().toLowerCase();
    const q = filters.q.trim().toLowerCase();
    return events.filter((e) => {
      const actorVal = String(e.actor || e.userEmail || e.userId || '').toLowerCase();
      const actionVal = String(e.action || e.eventType || '').toLowerCase();
      const entityVal = String(e.entity || e.resourceType || '').toLowerCase();
      if (actor && !actorVal.includes(actor)) return false;
      if (action && !actionVal.includes(action)) return false;
      if (entity && !entityVal.includes(entity)) return false;
      if (q && !JSON.stringify(e).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, filters]);

  return (
    <main className="min-h-screen bg-[#f8f8f8] px-5 py-8 text-[#1f1f1f] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e41e1f] hover:text-[#e41e1f]"
        >
          <ArrowLeft size={16} /> Back to admin
        </button>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#e41e1f]">
              {brand.shortName} · Monitoring &amp; Evaluation
            </p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold tracking-tight">
              <Shield className="h-8 w-8 text-[#e41e1f]" />
              POPIA audit trail
            </h1>
            <p className="mt-2 text-[#8b8b8b]">
              Append-only review of sensitive access and changes. Retention: retain operational logs
              per hospital POPIA policy (typically ≥ 3 years for clinical access logs).
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
          <p role="alert" className="mb-6 rounded-lg bg-[#f8f8f8] px-4 py-3 text-sm text-[#e41e1f]">
            {status.message}
          </p>
        )}

        <section className="mb-6 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#8b8b8b]">
            <Filter size={16} /> Filters
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm font-semibold text-[#1f1f1f]">
              Actor
              <input
                name="actor"
                value={filters.actor}
                onChange={change}
                placeholder="email / user id"
                className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
              />
            </label>
            <label className="block text-sm font-semibold text-[#1f1f1f]">
              Action
              <input
                name="action"
                value={filters.action}
                onChange={change}
                placeholder="READ / UPDATE / LOGIN"
                className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
              />
            </label>
            <label className="block text-sm font-semibold text-[#1f1f1f]">
              Entity
              <input
                name="entity"
                value={filters.entity}
                onChange={change}
                placeholder="Patient / User / …"
                className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
              />
            </label>
            <label className="block text-sm font-semibold text-[#1f1f1f]">
              Free text
              <input
                name="q"
                value={filters.q}
                onChange={change}
                placeholder="Search loaded events"
                className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
              />
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
          <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
            <h2 className="font-bold">Recent events</h2>
            <p className="mt-1 text-sm text-[#8b8b8b]">
              {loading ? 'Loading…' : `${filtered.length} event${filtered.length === 1 ? '' : 's'}`}
            </p>
          </div>
          {loading ? (
            <div className="flex justify-center py-16">
              <LoaderCircle className="animate-spin text-[#e41e1f]" size={32} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-5 py-16 text-center text-sm text-[#8b8b8b]">
              No audit events match the current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#f8f8f8] text-[#8b8b8b]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">When</th>
                    <th className="px-5 py-3 font-semibold">Actor</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                    <th className="px-5 py-3 font-semibold">Entity</th>
                    <th className="px-5 py-3 font-semibold">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8b8b8b]/25">
                  {filtered.map((event) => {
                    const id = event._id || event.id || `${event.timestamp}-${event.action}`;
                    const when = event.timestamp || event.createdAt || event.at;
                    return (
                      <tr key={id} className="hover:bg-[#f8f8f8]/80">
                        <td className="whitespace-nowrap px-5 py-3 text-[#8b8b8b]">
                          {when ? new Date(when).toLocaleString() : '—'}
                        </td>
                        <td className="px-5 py-3 font-medium">
                          {event.actor || event.userEmail || event.userId || '—'}
                        </td>
                        <td className="px-5 py-3">
                          <span className="rounded bg-[#f8f8f8] px-2 py-0.5 text-xs font-semibold text-[#e41e1f]">
                            {event.action || event.eventType || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[#8b8b8b]">
                          {event.entity || event.resourceType || '—'}
                          {event.entityId || event.resourceId
                            ? ` #${event.entityId || event.resourceId}`
                            : ''}
                        </td>
                        <td className="max-w-xs truncate px-5 py-3 text-[#8b8b8b]">
                          {event.detail || event.message || event.summary || '—'}
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
    </main>
  );
}

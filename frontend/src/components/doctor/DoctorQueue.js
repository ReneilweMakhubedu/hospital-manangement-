import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoaderCircle, Stethoscope } from 'lucide-react';

import { apiFetch } from '../../auth';
import DoctorLayout from './DoctorLayout';

function urgencyStyle(urgency) {
  const u = String(urgency || '').toUpperCase();
  if (u === 'RED' || u === 'CRITICAL') return 'bg-red-100 text-[#e41e1f] border-[#e41e1f]/40';
  if (u === 'ORANGE' || u === 'URGENT') return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-[#f8f8f8] text-[#e41e1f] border-[#8b8b8b]/30';
}

function nameOf(row) {
  return (
    row.patientName ||
    [row.patientFirstName, row.patientLastName].filter(Boolean).join(' ') ||
    [row.firstName, row.lastName].filter(Boolean).join(' ') ||
    `Patient #${row.patientId || '—'}`
  );
}

export default function DoctorQueue() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [qRes, aRes] = await Promise.all([
          apiFetch('/doctor/queue', { navigate }),
          apiFetch('/doctor/appointments', { navigate }),
        ]);
        if (!qRes.ok) {
          const err = await qRes.json().catch(() => ({}));
          throw new Error(err.error || 'Unable to load queue');
        }
        const qData = await qRes.json();
        const aData = aRes.ok ? await aRes.json() : [];
        if (!cancelled) {
          setQueue(Array.isArray(qData) ? qData : qData.entries || qData.queue || []);
          setAppointments(Array.isArray(aData) ? aData : []);
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

  return (
    <DoctorLayout
      title="Queue & schedule"
      subtitle="Live waiting list with triage flags and today's booked slots."
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

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={20} /> Loading queue…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">Waiting now</h2>
            {queue.length === 0 ? (
              <p className="text-sm text-[#8b8b8b]">No patients currently waiting.</p>
            ) : (
              <ul className="space-y-3">
                {queue.map((entry) => {
                  const wait =
                    entry.waitMinutes ??
                    entry.estimatedWaitMinutes ??
                    entry.waitEstimateMinutes;
                  const flag = entry.triageFlag || entry.urgency || entry.priority;
                  return (
                    <li
                      key={entry._id || entry.id || `${entry.patientId}-${entry.queueNumber}`}
                      className="rounded-xl border border-[#8b8b8b]/20 bg-[#f8f8f8]/80 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[#1f1f1f]">{nameOf(entry)}</p>
                            {entry.mine && (
                              <span className="rounded-full bg-[#f8f8f8] px-2 py-0.5 text-xs font-semibold text-[#e41e1f]">
                                My clinic
                              </span>
                            )}
                            {flag && (
                              <span
                                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${urgencyStyle(
                                  flag
                                )}`}
                              >
                                {String(flag).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-[#8b8b8b]">
                            Ticket {entry.queueNumber || entry.ticketNumber || '—'}
                            {entry.status ? ` · ${entry.status}` : ''}
                            {wait != null ? ` · ~${wait} min` : ''}
                          </p>
                        </div>
                        {entry.patientId && (
                          <Link
                            to={`/doctor/consult?patientId=${entry.patientId}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#e41e1f] px-3 py-1.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f]"
                          >
                            <Stethoscope size={14} /> Call to consult
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">Today&apos;s appointments</h2>
            {appointments.length === 0 ? (
              <p className="text-sm text-[#8b8b8b]">No appointments booked for today.</p>
            ) : (
              <ul className="divide-y divide-[#8b8b8b]/25">
                {appointments.map((apt) => (
                  <li
                    key={apt._id || apt.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-semibold text-[#1f1f1f]">{nameOf(apt)}</p>
                      <p className="text-sm text-[#8b8b8b]">
                        {apt.time || '—'}
                        {apt.reason || apt.purpose ? ` · ${apt.reason || apt.purpose}` : ''}
                        {apt.urgency
                          ? ` · ${String(apt.urgency).toUpperCase()}`
                          : ''}
                      </p>
                    </div>
                    {apt.patientId && (
                      <Link
                        to={`/doctor/consult?patientId=${apt.patientId}`}
                        className="rounded-lg bg-[#f8f8f8] px-3 py-1.5 text-sm font-semibold text-[#e41e1f] hover:bg-[#f8f8f8]"
                      >
                        Consult
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </DoctorLayout>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  Clock3,
  HeartPulse,
  LoaderCircle,
  MessageSquare,
  Pill,
  UserCircle2,
} from 'lucide-react';

import { apiFetch } from '../auth';
import PatientLayout from './patient/PatientLayout';

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

function WelcomeCard({ icon: Icon, label, value, detail, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#8b8b8b]/40 hover:shadow-md"
    >
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8f8f8] text-[#e41e1f]">
        <Icon size={18} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#1f1f1f]">{value}</p>
      {detail && <p className="mt-1 text-sm text-[#8b8b8b]">{detail}</p>}
    </button>
  );
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/patient/dashboard', { navigate });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Unable to load dashboard');
        }
        const json = await res.json();
        if (!cancelled) setData(json);
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

  const firstName = data?.firstName || data?.profile?.firstName || localStorage.getItem('userEmail')?.split('@')[0];
  const upcoming = data?.upcomingAppointments || [];
  const medSummary = data?.medicationSummary || {};
  const unread = data?.unreadNotifications ?? 0;
  const queue = data?.queueStatus;
  const tips = data?.healthTips || [];
  const recentAppointments = upcoming.slice(0, 3);
  const recentNotes = data?.recentNotifications || data?.notifications || [];

  return (
    <PatientLayout
      title={`Welcome back${firstName ? `, ${firstName}` : ''}`}
      subtitle="Your appointments, medications, and care updates in one place."
    >
      <StatusBanner status={status} />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={20} /> Loading your dashboard…
        </div>
      ) : (
        <>
          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <WelcomeCard
              icon={CalendarDays}
              label="Upcoming appointment"
              value={
                upcoming[0]
                  ? `${upcoming[0].date || '—'}${upcoming[0].time ? ` · ${upcoming[0].time}` : ''}`
                  : 'None scheduled'
              }
              detail={
                upcoming[0]
                  ? upcoming[0].doctorName || upcoming[0].department || upcoming[0].purpose || 'Booked visit'
                  : 'Book a visit when you need care'
              }
              onClick={() => navigate('/patient/appointments')}
            />
            <WelcomeCard
              icon={Pill}
              label="Medication status"
              value={
                medSummary.activeCount != null
                  ? `${medSummary.activeCount} active`
                  : 'View medications'
              }
              detail={
                medSummary.nextCollectionDate
                  ? `Next CCMDD collection: ${medSummary.nextCollectionDate}`
                  : 'Prescriptions and reminders'
              }
              onClick={() => navigate('/patient/medications')}
            />
            <WelcomeCard
              icon={Bell}
              label="Notifications"
              value={unread > 0 ? `${unread} unread` : 'All caught up'}
              detail="Appointment and medication alerts"
              onClick={() => navigate('/patient/notifications')}
            />
            <WelcomeCard
              icon={Clock3}
              label="Queue status"
              value={
                queue
                  ? `Ticket ${queue.queueNumber || queue.ticketNumber || '—'}`
                  : 'Not in queue'
              }
              detail={
                queue
                  ? `${queue.status || 'Waiting'}${
                      queue.estimatedWaitMinutes != null
                        ? ` · ~${queue.estimatedWaitMinutes} min`
                        : ''
                    }`
                  : 'Shown when you check in at reception'
              }
              onClick={() => navigate('/patient/appointments')}
            />
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-[#1f1f1f]">Quick actions</h2>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Book appointment', path: '/patient/appointments', icon: CalendarDays },
                { label: 'My medications', path: '/patient/medications', icon: Pill },
                { label: 'Health records', path: '/patient/records', icon: HeartPulse },
                { label: 'Give feedback', path: '/patient/feedback', icon: MessageSquare },
                { label: 'Update profile', path: '/patient/profile', icon: UserCircle2 },
              ].map(({ label, path, icon: Icon }) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] shadow-sm transition hover:bg-[#e41e1f]"
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Recent appointments</h2>
              </div>
              {recentAppointments.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">No upcoming appointments yet.</p>
              ) : (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {recentAppointments.map((apt) => (
                    <li key={apt._id || apt.id || `${apt.date}-${apt.time}`} className="px-5 py-4">
                      <p className="font-semibold text-[#1f1f1f]">
                        {apt.doctorName || apt.department || apt.purpose || 'Appointment'}
                      </p>
                      <p className="text-sm text-[#8b8b8b]">
                        {apt.date} {apt.time ? `· ${apt.time}` : ''}
                      </p>
                      {apt.reason && <p className="mt-1 text-sm text-[#8b8b8b]">{apt.reason}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold text-[#1f1f1f]">Recent activity</h2>
              </div>
              {Array.isArray(recentNotes) && recentNotes.length > 0 ? (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {recentNotes.slice(0, 5).map((n) => (
                    <li key={n._id || n.id || n.title} className="px-5 py-4">
                      <p className="font-semibold text-[#1f1f1f]">{n.title || n.type || 'Update'}</p>
                      <p className="text-sm text-[#8b8b8b]">{n.body || n.message || ''}</p>
                    </li>
                  ))}
                </ul>
              ) : tips.length > 0 ? (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {tips.map((tip, i) => (
                    <li key={i} className="px-5 py-4 text-sm text-[#8b8b8b]">
                      {typeof tip === 'string' ? tip : tip.title || tip.body}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-8 text-sm text-[#8b8b8b]">
                  Check notifications for appointment and medication updates.
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </PatientLayout>
  );
}

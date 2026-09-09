import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, LoaderCircle } from 'lucide-react';

import { apiFetch } from '../../auth';
import PatientLayout from './PatientLayout';

const CHANNEL_STYLES = {
  SMS: 'bg-sky-100 text-sky-800',
  WHATSAPP: 'bg-[#f8f8f8] text-[#e41e1f]',
  APP: 'bg-[#f8f8f8] text-[#e41e1f]',
  EMAIL: 'bg-[#f8f8f8] text-[#1f1f1f]',
};

function channelBadge(channel) {
  const key = (channel || 'APP').toUpperCase();
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        CHANNEL_STYLES[key] || 'bg-[#f5f5f5] text-[#1f1f1f]'
      }`}
    >
      {key}
    </span>
  );
}

export default function PatientNotifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/patient/notifications', { navigate });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : data.notifications || []);
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Unable to load notifications');
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id) => {
    setSaving(true);
    try {
      const res = await apiFetch(`/patient/notifications/${id}/read`, {
        navigate,
        method: 'PUT',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Unable to mark as read');
      }
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const markAllRead = async () => {
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch('/patient/notifications/read-all', {
        navigate,
        method: 'PUT',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Unable to mark all as read');
      }
      setStatus({ type: 'success', message: 'All notifications marked as read.' });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const unreadCount = items.filter((n) => !n.readFlag && !n.read).length;

  return (
    <PatientLayout
      title="Notifications"
      subtitle="Appointment, medication, and care alerts across SMS, WhatsApp, and the portal."
      actions={
        <button
          type="button"
          disabled={saving || unreadCount === 0}
          onClick={markAllRead}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
        >
          <CheckCheck size={16} /> Mark all read
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

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="flex items-center justify-between border-b border-[#8b8b8b]/30 px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold text-[#1f1f1f]">
            <Bell size={18} className="text-[#e41e1f]" /> Inbox
          </h2>
          <span className="text-xs font-semibold text-[#8b8b8b]">
            {unreadCount} unread
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={20} /> Loading…
          </div>
        ) : items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-[#8b8b8b]">No notifications yet.</p>
        ) : (
          <ul className="divide-y divide-[#8b8b8b]/25">
            {items.map((n) => {
              const id = n._id || n.id;
              const read = n.readFlag || n.read;
              return (
                <li
                  key={id}
                  className={`px-5 py-4 ${read ? 'bg-[#ffffff]' : 'bg-[#f8f8f8]/40'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        {channelBadge(n.channel)}
                        {n.type && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8b8b8b]">
                            {n.type}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-[#1f1f1f]">{n.title || 'Notification'}</p>
                      <p className="mt-1 text-sm text-[#8b8b8b]">{n.body || n.message}</p>
                      {n.createdAt && (
                        <p className="mt-2 text-xs text-[#8b8b8b]">
                          {String(n.createdAt).replace('T', ' ').slice(0, 16)}
                        </p>
                      )}
                    </div>
                    {!read && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => markRead(id)}
                        className="rounded-lg border border-[#8b8b8b]/30 px-3 py-1.5 text-xs font-semibold text-[#e41e1f] hover:bg-[#f8f8f8]"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PatientLayout>
  );
}

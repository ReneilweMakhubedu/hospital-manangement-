import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Ban,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch, getRole } from '../auth';
import { brand } from '../brand';

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-[#1f1f1f]',
  SENT: 'bg-[#f8f8f8] text-[#e41e1f]',
  FAILED: 'bg-red-100 text-[#e41e1f]',
  OPTED_OUT: 'bg-[#f5f5f5] text-[#1f1f1f]',
  QUEUED: 'bg-[#f8f8f8] text-[#1f1f1f]',
};

export default function SmsReminders() {
  const navigate = useNavigate();
  const role = getRole();
  const isAdmin = role === 'admin';

  const [summary, setSummary] = useState({
    pending: 0,
    sent: 0,
    failed: 0,
    optedOut: 0,
  });
  const [reminders, setReminders] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, listRes] = await Promise.all([
        apiFetch('/sms/summary', { navigate }),
        apiFetch('/sms', { navigate }),
      ]);
      const [summaryData, listData] = await Promise.all([
        summaryRes.json().catch(() => ({})),
        listRes.json().catch(() => []),
      ]);
      if (!summaryRes.ok) throw new Error(summaryData.error || 'Unable to load SMS summary');
      if (!listRes.ok) throw new Error(listData.error || 'Unable to load SMS reminders');

      setSummary({
        pending: summaryData.pending ?? 0,
        sent: summaryData.sent ?? 0,
        failed: summaryData.failed ?? 0,
        optedOut: summaryData.optedOut ?? summaryData.optOut ?? 0,
      });
      setReminders(Array.isArray(listData) ? listData : listData.reminders || []);
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

  const generate = async () => {
    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await apiFetch('/sms/generate-for-tomorrow', {
        method: 'POST',
        navigate,
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to generate reminders');
      setStatus({
        type: 'success',
        message: data.message || 'Reminders generated for tomorrow’s appointments (T-24h).',
      });
      await loadData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  };

  const sendOne = async (id) => {
    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await apiFetch(`/sms/${id}/send`, {
        method: 'POST',
        navigate,
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to send reminder');
      setStatus({ type: 'success', message: 'Reminder marked sent (mock gateway).' });
      await loadData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  };

  const optOut = async (id) => {
    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await apiFetch(`/sms/${id}/opt-out`, {
        method: 'POST',
        navigate,
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to record opt-out');
      setStatus({ type: 'success', message: 'Opt-out / consent withdrawal recorded (POPIA).' });
      await loadData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  };

  const cards = [
    { label: 'Pending', value: summary.pending },
    { label: 'Sent', value: summary.sent },
    { label: 'Failed', value: summary.failed },
    { label: 'Opted out', value: summary.optedOut },
  ];

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
              {brand.shortName} · Patient Experience
            </p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold tracking-tight">
              <MessageSquare className="h-8 w-8 text-[#e41e1f]" />
              SMS appointment reminders
            </h1>
            <p className="mt-2 text-[#8b8b8b]">
              T-24h reminders for upcoming appointments. Gateway is mock — POPIA consent required
              before live SMS.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2 text-sm font-semibold hover:bg-[#f8f8f8]"
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={generate}
              className="inline-flex items-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2 text-sm font-bold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
            >
              <Sparkles size={16} /> Generate for tomorrow
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-amber-200 bg-[#f8f8f8] px-4 py-3 text-sm text-[#1f1f1f]">
          <strong>POPIA note:</strong> Only send reminders where the patient has consented to SMS.
          Opt-out must be honoured. Delivery uses a mock gateway in this environment.
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
                    {card.label}
                  </p>
                  <p className="mt-3 text-2xl font-bold">{card.value}</p>
                </div>
              ))}
            </div>

            <section className="mt-8 overflow-hidden rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold">Reminder queue</h2>
              </div>
              {reminders.length === 0 ? (
                <p className="px-5 py-16 text-center text-sm text-[#8b8b8b]">
                  No reminders yet. Generate for tomorrow’s appointments to populate the queue.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#f8f8f8] text-[#8b8b8b]">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Patient</th>
                        <th className="px-5 py-3 font-semibold">Appointment</th>
                        <th className="px-5 py-3 font-semibold">Mobile</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8b8b8b]/25">
                      {reminders.map((item) => {
                        const id = item._id || item.id;
                        const st = (item.status || 'PENDING').toUpperCase();
                        return (
                          <tr key={id} className="hover:bg-[#f8f8f8]/80">
                            <td className="px-5 py-3 font-medium text-[#1f1f1f]">
                              {item.patientName || item.patient || '—'}
                            </td>
                            <td className="px-5 py-3 text-[#8b8b8b]">
                              {item.appointmentDate || item.scheduledFor
                                ? new Date(item.appointmentDate || item.scheduledFor).toLocaleString()
                                : '—'}
                              {item.doctorName ? ` · ${item.doctorName}` : ''}
                            </td>
                            <td className="px-5 py-3 text-[#8b8b8b]">{item.mobile || item.phone || '—'}</td>
                            <td className="px-5 py-3">
                              <span
                                className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                  STATUS_STYLES[st] || STATUS_STYLES.PENDING
                                }`}
                              >
                                {st}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex flex-wrap gap-2">
                                {['PENDING', 'QUEUED', 'FAILED'].includes(st) && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => sendOne(id)}
                                    className="inline-flex items-center gap-1 rounded border border-[#e41e1f] px-2 py-1 text-xs font-semibold text-[#e41e1f] hover:bg-[#f8f8f8] disabled:opacity-50"
                                  >
                                    <Send size={12} /> Send
                                  </button>
                                )}
                                {st !== 'OPTED_OUT' && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => optOut(id)}
                                    className="inline-flex items-center gap-1 rounded border border-[#8b8b8b] px-2 py-1 text-xs font-semibold text-[#1f1f1f] hover:bg-[#f8f8f8] disabled:opacity-50"
                                  >
                                    <Ban size={12} /> Opt-out
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

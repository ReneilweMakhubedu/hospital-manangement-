import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, MessageSquare, Send } from 'lucide-react';

import { apiFetch } from '../../auth';
import PatientLayout from './PatientLayout';

const emptyForm = {
  type: 'RATING',
  rating: '5',
  category: 'SERVICE',
  subject: '',
  message: '',
};

function statusLabel(item) {
  const status = (item.status || 'OPEN').toUpperCase();
  if (item.type === 'COMPLAINT' || (item.type || '').toUpperCase() === 'COMPLAINT') {
    if (status === 'OPEN') {
      return 'Open — acknowledgement due within 5 working days';
    }
    if (status === 'ACKNOWLEDGED') {
      return 'Acknowledged — resolution target within 25 working days';
    }
    if (status === 'RESOLVED' || status === 'CLOSED') {
      return status === 'CLOSED' ? 'Closed' : 'Resolved';
    }
  }
  return status;
}

export default function PatientFeedback() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/patient/feedback', { navigate });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : data.feedback || []);
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

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) {
      setStatus({ type: 'error', message: 'Please enter your message.' });
      return;
    }
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const body = {
        type: form.type,
        category: form.category,
        subject: form.subject || form.type,
        message: form.message,
      };
      if (form.type === 'RATING') body.rating = Number(form.rating);
      const res = await apiFetch('/patient/feedback', {
        navigate,
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to submit feedback');
      setStatus({
        type: 'success',
        message: data.referenceNumber
          ? `Submitted. Reference ${data.referenceNumber}.`
          : data.message || 'Feedback submitted.',
      });
      setForm(emptyForm);
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PatientLayout
      title="Feedback"
      subtitle="Rate your experience, suggest improvements, or lodge a complaint."
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

      <div className="mb-6 rounded-2xl border border-amber-200 bg-[#f8f8f8] px-4 py-3 text-sm text-amber-950">
        Complaints are acknowledged within <strong>5 working days</strong> and aim to be resolved
        within <strong>25 working days</strong>, in line with hospital service standards.
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-[#1f1f1f]">
            <Send size={18} className="text-[#e41e1f]" /> Submit feedback
          </h2>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-semibold text-[#1f1f1f]">
              Type
              <select
                name="type"
                value={form.type}
                onChange={onChange}
                className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
              >
                <option value="RATING">Rating</option>
                <option value="COMPLAINT">Complaint</option>
                <option value="SUGGESTION">Suggestion</option>
                <option value="SURVEY">Survey response</option>
              </select>
            </label>
            {form.type === 'RATING' && (
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Rating (1–5)
                <select
                  name="rating"
                  value={form.rating}
                  onChange={onChange}
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block text-sm font-semibold text-[#1f1f1f]">
              Category
              <select
                name="category"
                value={form.category}
                onChange={onChange}
                className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
              >
                <option value="SERVICE">Service</option>
                <option value="WAIT_TIME">Waiting time</option>
                <option value="CLINICAL">Clinical care</option>
                <option value="PHARMACY">Pharmacy / CCMDD</option>
                <option value="FACILITY">Facility</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-[#1f1f1f]">
              Subject
              <input
                name="subject"
                value={form.subject}
                onChange={onChange}
                className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                placeholder="Short summary"
              />
            </label>
            <label className="block text-sm font-semibold text-[#1f1f1f]">
              Message
              <textarea
                name="message"
                value={form.message}
                onChange={onChange}
                rows={4}
                className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                required
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
            >
              {saving ? 'Submitting…' : 'Submit'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
          <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
            <h2 className="flex items-center gap-2 font-bold text-[#1f1f1f]">
              <MessageSquare size={18} className="text-[#e41e1f]" /> Your submissions
            </h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-[#8b8b8b]">
              <LoaderCircle className="animate-spin" size={18} /> Loading…
            </div>
          ) : items.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[#8b8b8b]">No feedback submitted yet.</p>
          ) : (
            <ul className="divide-y divide-[#8b8b8b]/25">
              {items.map((item) => (
                <li key={item._id || item.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[10px] font-bold uppercase text-[#8b8b8b]">
                      {item.type}
                    </span>
                    {item.referenceNumber && (
                      <span className="text-xs text-[#8b8b8b]">{item.referenceNumber}</span>
                    )}
                    {item.rating != null && (
                      <span className="text-xs font-semibold text-[#e41e1f]">{item.rating}/5</span>
                    )}
                  </div>
                  <p className="mt-1 font-semibold text-[#1f1f1f]">{item.subject || 'Feedback'}</p>
                  <p className="mt-1 text-sm text-[#8b8b8b]">{item.message}</p>
                  <p className="mt-2 text-xs font-medium text-[#8b8b8b]">{statusLabel(item)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PatientLayout>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  Globe,
  LoaderCircle,
  MessageCircle,
  Phone,
  Smartphone,
} from 'lucide-react';

import { apiFetch } from '../../auth';
import { brand } from '../../brand';
import PatientLayout from './PatientLayout';

const FAQ = [
  {
    q: 'How do I book an appointment online?',
    a: 'Open Appointments, choose purpose and department, describe your symptoms, pick a date and available time, then submit. You will receive a reference number.',
  },
  {
    q: 'What if I have chest pain or cannot breathe?',
    a: 'Do not use the booking form for emergencies. Go to the Emergency Department immediately or call emergency services.',
  },
  {
    q: 'How does CCMDD collection work?',
    a: 'If you are enrolled, check Medications for your next collection date and pickup point. You can update the pickup point there or under Profile.',
  },
  {
    q: 'How long do complaints take?',
    a: 'Complaints are acknowledged within 5 working days and aim to be resolved within 25 working days. Track status under Feedback.',
  },
  {
    q: 'Can I use WhatsApp or USSD instead?',
    a: 'Yes — channels are explained below. Enable SMS/WhatsApp consent on your Profile. USSD is for feature phones and provides basic status checks when available from the province.',
  },
];

const CHANNELS = [
  {
    title: 'Web portal',
    icon: Globe,
    body: 'This site — full self-service for appointments, medications, records, feedback, and profile.',
  },
  {
    title: 'SMS',
    icon: Smartphone,
    body: 'Appointment and medication reminders by text when you consent. Best for quick alerts with low data use.',
  },
  {
    title: 'WhatsApp',
    icon: MessageCircle,
    body: 'Reminders and guided chat when enabled. Popular for everyday communication in South Africa.',
  },
  {
    title: 'USSD',
    icon: Phone,
    body: 'Informational: feature-phone dial codes (when published by the province) support basic booking status and queue checks. This portal does not simulate a live USSD session.',
  },
];

export default function PatientSupport() {
  const navigate = useNavigate();
  const [education, setEducation] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/patient/education', { navigate });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setEducation(Array.isArray(data) ? data : data.guides || []);
        }
      } catch {
        /* education optional */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <PatientLayout
      title="Support"
      subtitle={`Help, contacts, and health education for ${brand.hospital}.`}
    >
      <section className="mb-6 rounded-2xl border border-[#e41e1f]/40 bg-[#f8f8f8] p-5 text-red-950">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-[#e41e1f]" size={22} />
          <div>
            <h2 className="font-bold">Emergency guidance</h2>
            <p className="mt-1 text-sm">
              For chest pain, severe shortness of breath, uncontrolled bleeding, stroke symptoms
              (face droop, arm weakness, speech difficulty), seizures, or loss of consciousness —
              go to the Emergency Department immediately. Do not wait for an online appointment.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
        <h2 className="mb-2 font-bold text-[#1f1f1f]">Hospital contact</h2>
        <p className="text-sm text-[#8b8b8b]">{brand.hospital}</p>
        <p className="text-sm text-[#8b8b8b]">{brand.location}</p>
        <p className="mt-3 text-sm text-[#1f1f1f]">
          Switchboard and department numbers are available at reception. For portal account help,
          use Feedback or speak to Patient Administration during clinic hours.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-[#1f1f1f]">How to reach us</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CHANNELS.map(({ title, icon: Icon, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8f8f8] text-[#e41e1f]">
                <Icon size={18} />
              </div>
              <h3 className="font-bold text-[#1f1f1f]">{title}</h3>
              <p className="mt-2 text-sm text-[#8b8b8b]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
          <h2 className="font-bold text-[#1f1f1f]">Frequently asked questions</h2>
        </div>
        <ul className="divide-y divide-[#8b8b8b]/25">
          {FAQ.map((item, index) => {
            const open = openFaq === index;
            return (
              <li key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? -1 : index)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="font-semibold text-[#1f1f1f]">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#8b8b8b] transition ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && <p className="px-5 pb-4 text-sm text-[#8b8b8b]">{item.a}</p>}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold text-[#1f1f1f]">
            <BookOpen size={18} className="text-[#e41e1f]" /> Health education
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={18} /> Loading guides…
          </div>
        ) : education.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#8b8b8b]">
            Education guides will appear here when available from the hospital.
          </p>
        ) : (
          <ul className="divide-y divide-[#8b8b8b]/25">
            {education.map((guide, i) => (
              <li key={guide.id || guide.title || i} className="px-5 py-4">
                <p className="font-semibold text-[#1f1f1f]">{guide.title || guide.name}</p>
                <p className="mt-1 text-sm text-[#8b8b8b]">
                  {guide.summary || guide.description || guide.body}
                </p>
                {guide.url && (
                  <a
                    href={guide.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-[#e41e1f] hover:underline"
                  >
                    Open guide
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </PatientLayout>
  );
}

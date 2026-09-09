import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LoaderCircle } from 'lucide-react';

import { apiFetch } from '../../auth';
import DoctorLayout from './DoctorLayout';

export default function DoctorGovernance() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/doctor/governance', { navigate });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Unable to load governance metrics');
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

  const metrics = [
    { label: 'Patients seen today', value: data?.patientsSeenToday },
    { label: 'Average wait hint', value: data?.averageWaitHint },
    { label: 'Prescriptions this week', value: data?.prescriptionsIssuedWeek },
    { label: 'Open referrals', value: data?.openReferrals },
    { label: 'Lab orders pending', value: data?.labOrdersPending },
  ];

  const guidelines = data?.guidelines || [];
  const tips = data?.chronicFocusTips || [];

  return (
    <DoctorLayout
      title="Governance"
      subtitle="Clinic metrics and point-of-care guideline cards for junior clinicians."
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
          <LoaderCircle className="animate-spin" size={20} /> Loading governance…
        </div>
      ) : (
        <>
          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
                  {m.label}
                </p>
                <p className="mt-2 text-xl font-bold text-[#1f1f1f]">
                  {m.value != null && m.value !== '' ? String(m.value) : '—'}
                </p>
              </div>
            ))}
          </section>

          {tips.length > 0 && (
            <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-[#1f1f1f]">Chronic care focus</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[#8b8b8b]">
                {tips.map((tip) => (
                  <li key={typeof tip === 'string' ? tip : tip.title || tip.id}>
                    {typeof tip === 'string' ? tip : tip.title || tip.text || tip.summary}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">Point-of-care guidelines</h2>
            {guidelines.length === 0 ? (
              <p className="text-sm text-[#8b8b8b]">No guidelines returned from the API.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {guidelines.map((g) => (
                  <article
                    key={g.id || g.title}
                    className="rounded-2xl border border-[#8b8b8b]/25 bg-gradient-to-br from-white to-[#f5f5f5]/60 p-5 shadow-sm"
                  >
                    <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#f8f8f8] text-[#e41e1f]">
                      <BookOpen size={16} />
                    </div>
                    <h3 className="font-bold text-[#1f1f1f]">{g.title || g.name}</h3>
                    <p className="mt-2 text-sm text-[#8b8b8b]">
                      {g.blurb || g.summary || g.description || 'Clinical reference card.'}
                    </p>
                    {g.source && (
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#e41e1f]">
                        {g.source}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </DoctorLayout>
  );
}

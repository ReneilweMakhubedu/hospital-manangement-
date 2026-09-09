import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  LoaderCircle,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { apiFetch, getRole } from '../auth';
import HrLayout from './hr/HrLayout';

const emptySummary = {
  doctors: 0,
  patients: 0,
  vacancyGap: 0,
  criticalVacancies: 0,
  vacancyRate: 0,
  doctorsBySpecialty: [],
  criticalVacanciesList: [],
};

export default function HrStaffing() {
  const navigate = useNavigate();
  const isAdmin = getRole() === 'admin';
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/hr/staffing/summary', { navigate });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to load staffing summary');
      const vacancies = data.vacancies || {};
      const criticalList = Array.isArray(data.criticalVacancies)
        ? data.criticalVacancies
        : data.criticalVacanciesList || data.criticalList || [];
      setSummary({
        doctors: data.doctorsTotal ?? data.doctors ?? data.totalDoctors ?? 0,
        patients: data.patientsTotal ?? data.patients ?? data.totalPatients ?? 0,
        vacancyGap: vacancies.gap ?? data.vacancyGap ?? data.gap ?? 0,
        criticalVacancies: vacancies.critical ?? (Array.isArray(criticalList) ? criticalList.length : 0),
        vacancyRate: vacancies.vacancyRateApprox ?? data.vacancyRate ?? data.vacancyRateApprox ?? 0,
        doctorsBySpecialty: Array.isArray(data.doctorsBySpecialty) ? data.doctorsBySpecialty : [],
        criticalVacanciesList: Array.isArray(criticalList) ? criticalList : [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const cards = [
    { label: 'Doctors', value: summary.doctors, icon: Users },
    { label: 'Patients', value: summary.patients, icon: Users },
    { label: 'Vacancy gap', value: summary.vacancyGap, icon: Briefcase },
    { label: 'Critical vacancies', value: summary.criticalVacancies, icon: AlertTriangle },
    {
      label: 'Vacancy rate',
      value: `${Number(summary.vacancyRate).toFixed(1)}%`,
      icon: Briefcase,
    },
  ];

  const body = (
    <>
      {error && (
        <p role="alert" className="mb-6 rounded-lg bg-[#f8f8f8] px-4 py-3 text-sm text-[#e41e1f]">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoaderCircle className="animate-spin text-[#e41e1f]" size={32} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
                      {card.label}
                    </p>
                    <Icon size={16} className="text-[#e41e1f]" />
                  </div>
                  <p className="mt-3 text-2xl font-bold text-[#1f1f1f]">{card.value}</p>
                </div>
              );
            })}
          </div>

          <section className="mt-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
            <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="font-bold">Doctors by specialty</h2>
            </div>
            {summary.doctorsBySpecialty.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#8b8b8b]">
                No specialty breakdown available.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Specialty</th>
                      <th className="px-5 py-3 font-semibold">Doctors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8b8b8b]/25">
                    {summary.doctorsBySpecialty.map((row) => (
                      <tr key={row.specialty || row.name}>
                        <td className="px-5 py-3 font-medium">
                          {row.specialty || row.name || 'Unspecified'}
                        </td>
                        <td className="px-5 py-3">{row.count ?? row.doctors ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mt-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
            <div className="flex items-center justify-between border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="flex items-center gap-2 font-bold">
                <AlertTriangle size={18} className="text-amber-600" /> Critical vacancies
              </h2>
              <Link
                to="/hr/vacancies"
                className="text-sm font-semibold text-[#e41e1f] hover:underline"
              >
                View all vacancies
              </Link>
            </div>
            {summary.criticalVacanciesList.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#8b8b8b]">
                No critical vacancies flagged.
              </p>
            ) : (
              <ul className="divide-y divide-[#8b8b8b]/25">
                {summary.criticalVacanciesList.map((item) => (
                  <li key={item._id || item.id || item.title} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-[#8b8b8b]">
                          {item.department}
                          {item.specialty ? ` · ${item.specialty}` : ''}
                        </p>
                      </div>
                      <Link
                        to="/hr/vacancies"
                        className="text-sm font-semibold text-[#e41e1f] hover:underline"
                      >
                        Manage
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );

  const refreshBtn = (
    <button
      type="button"
      onClick={loadSummary}
      className="inline-flex items-center gap-2 rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2 text-sm font-semibold hover:bg-[#f8f8f8]"
    >
      <RefreshCw size={16} /> Refresh
    </button>
  );

  if (isAdmin) {
    return (
      <HrLayout
        title="Staffing snapshot"
        subtitle="Workforce snapshot, specialty coverage, and critical vacancy alerts."
        actions={refreshBtn}
      >
        {body}
      </HrLayout>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] px-5 py-8 text-[#1f1f1f] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate('/doctor')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e41e1f] hover:text-[#e41e1f]"
        >
          <ArrowLeft size={16} /> Back to doctor portal
        </button>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Staffing dashboard</h1>
            <p className="mt-2 text-[#8b8b8b]">
              Workforce snapshot, specialty coverage, and critical vacancy alerts.
            </p>
          </div>
          {refreshBtn}
        </div>
        {body}
      </div>
    </main>
  );
}

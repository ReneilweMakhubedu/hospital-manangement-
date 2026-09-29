import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch, logout } from '../auth';
import { brand } from '../brand';
import BrandLogo from './BrandLogo';
import ReportFilters from './ReportFilters';
import { portalChrome as ui } from '../theme';

export default function OperationsInsight() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filters = {
    department: params.get('department') || '',
    ward: params.get('ward') || '',
    period: params.get('period') || '7d',
  };
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(filters).toString();
    let cancelled = false;
    apiFetch(`/insights/operations?${query}`, { navigate })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Unable to load operations');
        if (!cancelled) setReport(data);
      })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [filters.department, filters.ward, filters.period, navigate]);

  const kpis = report?.kpis || {};
  const exceptions = Array.isArray(report?.exceptions) ? report.exceptions : [];
  const beds = report?.predictions?.bedDemand || {};

  return (
    <div className={ui.page}>
      <aside className={ui.aside}>
        <div className={ui.brandBlock}>
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12 shrink-0" />
            <div>
              <h2 className={ui.brandTitle}>{brand.shortName}</h2>
              <p className={ui.brandPortal}>Operations</p>
            </div>
          </div>
        </div>
        <div className={ui.footer}>
          <Link to="/approvals" className={ui.footerLink}>Approvals</Link>
          <button type="button" onClick={() => logout(navigate)} className={ui.logout}>Logout</button>
        </div>
      </aside>
      <main className="ml-72 flex-1 overflow-y-auto px-6 py-8 sm:px-8 lg:px-10">
        <p className={ui.eyebrow}>{brand.hospital}</p>
        <h1 className="mt-2 text-3xl font-bold text-[#1f1f1f]">Operations view</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#8b8b8b]">The same department, ward, and period filters apply here from every department dashboard.</p>
        <div className="mt-6">
          <ReportFilters {...filters} onChange={(next) => setParams(next)} />
        </div>
        {error && <p className="mb-4 text-sm text-[#e41e1f]">{error}</p>}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(kpis).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">{key.replace(/([A-Z])/g, ' $1')}</p>
              <p className="mt-2 text-2xl font-bold text-[#1f1f1f]">{String(value)}</p>
            </div>
          ))}
        </section>
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[#1f1f1f]">Exceptions</h2>
            {exceptions.length === 0 ? <p className="mt-3 text-sm text-[#8b8b8b]">No exceptions for this filter.</p> : (
              <ul className="mt-3 space-y-2">
                {exceptions.map((row) => (
                  <li key={`${row.area}-${row.detail}`} className="text-sm text-[#1f1f1f]"><span className="font-semibold">{row.area}.</span> {row.detail}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[#1f1f1f]">Predictive alerts</h2>
            <p className="mt-3 text-sm text-[#1f1f1f]">Bed forecast: {beds.predictedOccupied ?? '—'} occupied, {beds.availableNow ?? '—'} available.</p>
            <p className="mt-2 text-sm text-[#1f1f1f]">{report?.predictions?.stockDepletion}</p>
            <p className="mt-2 text-sm text-[#1f1f1f]">{report?.predictions?.staffing}</p>
            <p className="mt-3 text-xs text-[#8b8b8b]">Forecasts support planning. Staff still confirm every action.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

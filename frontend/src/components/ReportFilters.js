import React from 'react';
import { Link } from 'react-router-dom';

export const REPORT_PERIODS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
];

export function reportQuery({ department = '', ward = '', period = '7d' } = {}) {
  const params = new URLSearchParams();
  if (department.trim()) params.set('department', department.trim());
  if (ward.trim()) params.set('ward', ward.trim());
  params.set('period', period || '7d');
  return params.toString();
}

export default function ReportFilters({ department, ward, period, onChange }) {
  const set = (key, value) => onChange({ department, ward, period, [key]: value });
  const field = 'rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#e41e1f]';
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-4">
      <label className="text-sm font-semibold text-[#1f1f1f]">
        Department
        <input className={`mt-1 block ${field}`} value={department} onChange={(event) => set('department', event.target.value)} placeholder="Nursing" />
      </label>
      <label className="text-sm font-semibold text-[#1f1f1f]">
        Ward
        <input className={`mt-1 block ${field}`} value={ward} onChange={(event) => set('ward', event.target.value)} placeholder="Medical Ward A" />
      </label>
      <label className="text-sm font-semibold text-[#1f1f1f]">
        Period
        <select className={`mt-1 block ${field}`} value={period} onChange={(event) => set('period', event.target.value)}>
          {REPORT_PERIODS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <Link to={`/operations?${reportQuery({ department, ward, period })}`} className="rounded-lg bg-[#e41e1f] px-4 py-2 text-sm font-semibold text-[#ffffff]">
        Open operations view
      </Link>
    </div>
  );
}

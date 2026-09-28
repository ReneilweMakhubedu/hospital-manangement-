import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { apiFetch, logout } from '../auth';
import { brand } from '../brand';
import BrandLogo from './BrandLogo';
import { portalChrome as ui } from '../theme';

export default function WardBoard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');

  const search = async (event) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      setRows([]);
      setStatus('Enter a patient name.');
      return;
    }
    const res = await apiFetch(`/stay/locate?q=${encodeURIComponent(q)}`, { navigate });
    const data = await res.json().catch(() => []);
    if (!res.ok) {
      setStatus(data.error || 'Unable to find that patient');
      setRows([]);
      return;
    }
    const list = Array.isArray(data) ? data : [];
    setRows(list);
    setStatus(list.length ? '' : 'No occupied bed matches that name.');
  };

  return (
    <div className={ui.page}>
      <aside className={ui.aside}>
        <div className={ui.brandBlock}>
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12 shrink-0" />
            <div>
              <h2 className={ui.brandTitle}>{brand.shortName}</h2>
              <p className={ui.brandPortal}>Ward board</p>
            </div>
          </div>
          <p className={ui.brandHospital}>{brand.hospital}</p>
        </div>
        <div className={ui.footer}>
          <Link to="/nursing" className={ui.footerLink}>Nursing</Link>
          <button type="button" onClick={() => logout(navigate)} className={ui.logout}>Logout</button>
        </div>
      </aside>
      <main className="ml-72 flex-1 overflow-y-auto px-6 py-8 sm:px-8 lg:px-10">
        <p className={ui.eyebrow}>{brand.hospital}</p>
        <h1 className="mt-2 text-3xl font-bold text-[#1f1f1f]">Find a patient</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#8b8b8b]">
          Staff can look up the floor, ward, and bed of a patient who is currently admitted. Patients look up their own bed, and relatives who named them, from the patient home.
        </p>
        <form onSubmit={search} className="mt-6 flex max-w-xl gap-2">
          <input
            className="w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#e41e1f]"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Patient name"
          />
          <button type="submit" className={ui.btnPrimary}><Search size={16} /> Find</button>
        </form>
        {status && <p className="mt-4 text-sm text-[#e41e1f]">{status}</p>}
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <li key={`${row.patientName}-${row.location}`} className="rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-5 shadow-sm">
              <p className="font-bold text-[#1f1f1f]">{row.patientName}</p>
              <p className="mt-1 text-[#1f1f1f]">{row.location}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

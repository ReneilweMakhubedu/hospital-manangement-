import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch, getRole, logout } from '../auth';
import { brand } from '../brand';
import BrandLogo from './BrandLogo';
import { portalChrome as ui } from '../theme';

const CAN_DECIDE = {
  BILLING_ADJUSTMENT: ['admin', 'super_admin'],
  STOCK_WRITE_OFF: ['admin', 'super_admin'],
  PAYROLL_CHANGE: ['admin', 'super_admin'],
  EMERGENCY_DISCHARGE: ['nurse_manager', 'doctor'],
};

export default function Approvals() {
  const navigate = useNavigate();
  const role = getRole();
  const [rows, setRows] = useState([]);
  const [notes, setNotes] = useState({});
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    const res = await apiFetch('/governance/approvals', { navigate });
    const data = await res.json().catch(() => []);
    if (!res.ok) {
      setStatus(data.error || 'Unable to load approvals');
      return;
    }
    setRows(Array.isArray(data) ? data : []);
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id, decision) => {
    const note = (notes[id] || '').trim();
    const res = await apiFetch(`/governance/approvals/${id}/decide`, {
      navigate,
      method: 'POST',
      body: JSON.stringify({ decision, note }),
    });
    const data = await res.json().catch(() => ({}));
    setStatus(data.error || data.message || 'Saved');
    if (res.ok) load();
  };

  return (
    <div className={ui.page}>
      <aside className={ui.aside}>
        <div className={ui.brandBlock}>
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12 shrink-0" />
            <div>
              <h2 className={ui.brandTitle}>{brand.shortName}</h2>
              <p className={ui.brandPortal}>Approvals</p>
            </div>
          </div>
        </div>
        <div className={ui.footer}>
          <Link to="/operations" className={ui.footerLink}>Operations</Link>
          <button type="button" onClick={() => logout(navigate)} className={ui.logout}>Logout</button>
        </div>
      </aside>
      <main className="ml-72 flex-1 overflow-y-auto px-6 py-8 sm:px-8 lg:px-10">
        <p className={ui.eyebrow}>{brand.hospital}</p>
        <h1 className="mt-2 text-3xl font-bold text-[#1f1f1f]">Sensitive approvals</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#8b8b8b]">Billing adjustments, stock write-offs, emergency discharges, and payroll closures wait for a second person.</p>
        {status && <p className="mt-4 text-sm text-[#e41e1f]">{status}</p>}
        <ul className="mt-6 space-y-3">
          {rows.map((row) => {
            const canDecide = row.status === 'PENDING' && (CAN_DECIDE[row.actionType] || []).includes(role);
            return (
              <li key={row.id} className="rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">{row.actionType} · {row.status}</p>
                <p className="mt-1 font-bold text-[#1f1f1f]">{row.summary}</p>
                <p className="mt-1 text-sm text-[#1f1f1f]">Reason: {row.reason}</p>
                <p className="mt-1 text-xs text-[#8b8b8b]">Requested by {row.requestedByEmail || row.requestedByRole}</p>
                {row.decisionNote && <p className="mt-1 text-sm text-[#1f1f1f]">Decision: {row.decisionNote}</p>}
                {canDecide && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      className="w-full max-w-md rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                      placeholder="Decision note"
                      value={notes[row.id] || ''}
                      onChange={(event) => setNotes({ ...notes, [row.id]: event.target.value })}
                    />
                    <button type="button" className={ui.btnPrimary} onClick={() => decide(row.id, 'APPROVED')}>Approve</button>
                    <button type="button" className={ui.btnSecondary} onClick={() => decide(row.id, 'REJECTED')}>Reject</button>
                  </div>
                )}
              </li>
            );
          })}
          {rows.length === 0 && <li className="text-sm text-[#8b8b8b]">No approval requests for your role.</li>}
        </ul>
      </main>
    </div>
  );
}

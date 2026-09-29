import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search } from 'lucide-react';
import { apiFetch, getRole } from '../../auth';
import { portalChrome as ui } from '../../theme';
import NursingLayout from './NursingLayout';

const inputClass =
  'mt-1 w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#e41e1f]';

const emptyForm = {
  floor: '',
  wardName: '',
  bedNumber: '',
  status: 'AVAILABLE',
  patientName: '',
  acuity: 'LOW',
};

function canManageBeds(role) {
  return role === 'nurse_manager' || role === 'admin' || role === 'super_admin';
}

export default function NursingBeds() {
  const navigate = useNavigate();
  const role = getRole();
  const manager = canManageBeds(role);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState(null);
  const [status, setStatus] = useState('');
  const [dischargeReason, setDischargeReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bedRes, summaryRes] = await Promise.all([
        apiFetch('/nursing/beds', { navigate }),
        apiFetch('/nursing/beds/summary', { navigate }),
      ]);
      const bedData = await bedRes.json().catch(() => []);
      const summaryData = await summaryRes.json().catch(() => ({}));
      if (!bedRes.ok) throw new Error(bedData.error || 'Unable to load beds');
      setRows(Array.isArray(bedData) ? bedData : []);
      setSummary(summaryRes.ok ? summaryData : null);
      setStatus('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to load beds');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const locate = async (event) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      setMatches(null);
      return;
    }
    const res = await apiFetch(`/nursing/beds/locate?q=${encodeURIComponent(q)}`, { navigate });
    const data = await res.json().catch(() => []);
    if (!res.ok) {
      setStatus(data.error || 'Unable to find that patient');
      return;
    }
    setMatches(Array.isArray(data) ? data : []);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const path = editingId == null ? '/nursing/beds' : `/nursing/beds/${editingId}`;
      const res = await apiFetch(path, {
        navigate,
        method: editingId == null ? 'POST' : 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save bed');
      const note = data.stayNote;
      const created = editingId == null;
      setForm(emptyForm);
      setEditingId(null);
      setStatus(note || (created ? 'Bed added.' : 'Bed updated.'));
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save bed');
    } finally {
      setSaving(false);
    }
  };

  const requestDischarge = async (row) => {
    setSaving(true);
    try {
      const res = await apiFetch(`/nursing/beds/${row.id}/emergency-discharge`, {
        navigate,
        method: 'POST',
        body: JSON.stringify({ reason: dischargeReason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to request discharge');
      setDischargeReason('');
      setStatus(data.message || 'Emergency discharge submitted for approval.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to request discharge');
    } finally {
      setSaving(false);
    }
  };

  const edit = (row) => {
    setEditingId(row.id);
    setForm({
      floor: row.floor ?? '',
      wardName: row.wardName ?? '',
      bedNumber: row.bedNumber ?? '',
      status: row.status ?? 'AVAILABLE',
      patientName: row.patientName ?? '',
      acuity: row.acuity ?? 'LOW',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const counts = [
    ['Total beds', summary?.totalBeds],
    ['Occupied', summary?.occupiedBeds],
    ['Available', summary?.availableBeds],
    ['Cleaning', summary?.cleaningBeds],
    ['Blocked', summary?.blockedBeds],
  ];

  return (
    <NursingLayout
      title="Beds & wards"
      subtitle="Each patient has one bed: floor, ward, and bed number. A nurse manager adds beds. The nurse who places a patient is recorded."
      actions={<button type="button" onClick={load} className={ui.btnSecondary}><RefreshCw size={16} /> Refresh</button>}
    >
      {status && <div className="mb-6 rounded-xl bg-[#f8f8f8] px-4 py-3 text-sm text-[#e41e1f]">{status}</div>}

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {counts.map(([label, value]) => (
          <div key={label} className={`${ui.card} px-4 py-3`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[#1f1f1f]">{value ?? '—'}</p>
          </div>
        ))}
      </section>

      {Array.isArray(summary?.byFloorWard) && summary.byFloorWard.length > 0 && (
        <section className={`${ui.card} mb-6 overflow-hidden`}>
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8f8f8] text-[#8b8b8b]">
              <tr>
                <th className="px-4 py-3">Floor</th>
                <th className="px-4 py-3">Ward</th>
                <th className="px-4 py-3">Beds</th>
                <th className="px-4 py-3">Occupied</th>
                <th className="px-4 py-3">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8b8b8b]/25">
              {summary.byFloorWard.map((row) => (
                <tr key={`${row.floor}-${row.wardName}`}>
                  <td className="px-4 py-3">{row.floor}</td>
                  <td className="px-4 py-3">{row.wardName}</td>
                  <td className="px-4 py-3">{row.totalBeds}</td>
                  <td className="px-4 py-3">{row.occupiedBeds}</td>
                  <td className="px-4 py-3">{row.availableBeds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <form onSubmit={locate} className={`${ui.card} mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end`}>
        <label className="flex-1 text-sm font-semibold text-[#1f1f1f]">
          Find patient
          <input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Patient name" />
        </label>
        <button type="submit" className={ui.btnPrimary}><Search size={16} /> Find bed</button>
      </form>
      {matches && (
        <div className="mb-6 rounded-xl bg-[#f8f8f8] px-4 py-3 text-sm text-[#1f1f1f]">
          {matches.length === 0
            ? 'No occupied bed matches that patient.'
            : matches.map((bed) => <p key={bed.id}>{bed.patientName}: {bed.location}. Allocated by {bed.allocatedByEmail || '—'}</p>)}
        </div>
      )}

      {(manager || editingId != null) ? (
        <section className={`${ui.card} mb-8 p-6`}>
          <h2 className="mb-1 text-lg font-bold text-[#1f1f1f]">{editingId == null ? 'Add bed' : 'Update bed'}</h2>
          {!manager && <p className="mb-4 text-sm text-[#8b8b8b]">You can place or discharge a patient. Floor, ward, and bed number stay with the nurse manager.</p>}
          {manager && editingId == null && <p className="mb-4 text-sm text-[#8b8b8b]">You are responsible for this bed. Your login is stored as the person who added it.</p>}
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-semibold text-[#1f1f1f]">Floor
              <input required disabled={!manager} className={inputClass} value={form.floor} onChange={(event) => setForm({ ...form, floor: event.target.value })} />
            </label>
            <label className="text-sm font-semibold text-[#1f1f1f]">Ward
              <input required disabled={!manager} className={inputClass} value={form.wardName} onChange={(event) => setForm({ ...form, wardName: event.target.value })} />
            </label>
            <label className="text-sm font-semibold text-[#1f1f1f]">Bed number
              <input required disabled={!manager} className={inputClass} value={form.bedNumber} onChange={(event) => setForm({ ...form, bedNumber: event.target.value })} />
            </label>
            <label className="text-sm font-semibold text-[#1f1f1f]">Status
              <select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {['AVAILABLE', 'OCCUPIED', 'CLEANING', 'BLOCKED'].map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-[#1f1f1f]">Patient
              <input className={inputClass} value={form.patientName} onChange={(event) => setForm({ ...form, patientName: event.target.value })} placeholder="Required when occupied" />
            </label>
            <label className="text-sm font-semibold text-[#1f1f1f]">Acuity
              <select className={inputClass} value={form.acuity} onChange={(event) => setForm({ ...form, acuity: event.target.value })}>
                {['LOW', 'MEDIUM', 'HIGH'].map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={saving} className={ui.btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>
              {editingId != null && <button type="button" className={ui.btnSecondary} onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
            </div>
          </form>
        </section>
      ) : (
        <p className="mb-6 text-sm text-[#8b8b8b]">A nurse manager adds beds. Open Update on a bed to place a patient. The system records your login as the nurse responsible for that allocation.</p>
      )}

      <label className="mb-4 block max-w-xl text-sm font-semibold text-[#1f1f1f]">
        Emergency discharge reason
        <input className={`mt-1 ${inputClass}`} value={dischargeReason} onChange={(event) => setDischargeReason(event.target.value)} placeholder="Why this patient must leave before the usual discharge" />
      </label>

      <section className={`${ui.card} overflow-hidden`}>
        {loading ? <p className="p-6 text-sm text-[#8b8b8b]">Loading…</p> : rows.length === 0 ? (
          <p className="p-6 text-sm text-[#8b8b8b]">No beds yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-[#8b8b8b]">
                <tr>
                  {['Location', 'Status', 'Patient', 'Added by', 'Allocated by', ''].map((heading) => (
                    <th key={heading || 'action'} className="px-4 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-[#1f1f1f]">{row.location}</td>
                    <td className="px-4 py-3">{row.status}</td>
                    <td className="px-4 py-3">{row.patientName || '—'}</td>
                    <td className="px-4 py-3">{row.createdByEmail || '—'}</td>
                    <td className="px-4 py-3">{row.allocatedByEmail || '—'}</td>
                    <td className="px-4 py-3">
                      <button type="button" className="font-semibold text-[#e41e1f]" onClick={() => edit(row)}>Update</button>
                      {row.status === 'OCCUPIED' && (
                        <button type="button" className="ml-3 font-semibold text-[#1f1f1f]" onClick={() => requestDischarge(row)}>Emergency discharge</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </NursingLayout>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Plus,
  RefreshCw,
  Users,
} from 'lucide-react';

import BrandLogo from './BrandLogo';
import { brand } from '../brand';
import { apiFetch, getRole, logout } from '../auth';
import { portalChrome as ui } from '../theme';
import { AssistPanel, StaffAlertsBell } from './AssistTools';

const inputClass =
  'mt-1 w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#e41e1f]';
const emptyList = [];

export function DepartmentLayout({ portal, eyebrow, nav, title, subtitle, children, actions, assistPortal }) {
  const navigate = useNavigate();
  const role = getRole();
  const isAdmin = role === 'admin' || role === 'super_admin';
  const assistKey = useMemo(() => {
    const raw = (assistPortal || portal || '').toLowerCase();
    if (raw.includes('nurs')) return 'nursing';
    if (raw.includes('casual') || raw.includes('emerg')) return 'casualty';
    if (raw.includes('lab')) return 'lab';
    if (raw.includes('radio')) return 'radiology';
    if (raw.includes('facilit')) return 'facilities';
    if (raw.includes('allied')) return 'allied';
    if (raw.includes('pharm')) return 'pharmacy';
    if (raw.includes('doctor') || raw.includes('clinic')) return 'doctor';
    if (raw.includes('procur')) return 'procurement';
    return raw.replace(/\s+/g, '') || 'admin';
  }, [assistPortal, portal]);

  return (
    <div className={ui.page}>
      <aside className={ui.aside}>
        <div className={ui.brandBlock}>
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12 shrink-0" />
            <div>
              <h2 className={ui.brandTitle}>{brand.shortName}</h2>
              <p className={ui.brandPortal}>{portal} portal</p>
            </div>
          </div>
          <p className={ui.brandHospital}>{brand.hospital}</p>
          {localStorage.getItem('userEmail') && (
            <p className={ui.brandEmail}>{localStorage.getItem('userEmail')}</p>
          )}
        </div>
        <nav className={ui.nav}>
          {nav.filter((item) => !item.adminOnly || isAdmin).map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={Boolean(end)} className={({ isActive }) => ui.navItem(isActive)}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className={ui.footer}>
          {isAdmin && (
            <NavLink to="/admin" className={ui.footerLink}>
              <ArrowLeft size={18} /> Back to Admin
            </NavLink>
          )}
          <button type="button" onClick={() => logout(navigate)} className={ui.logout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      <main className="ml-72 flex-1 overflow-y-auto px-6 py-8 sm:px-8 lg:px-10">
        {(title || actions) && (
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={ui.eyebrow}>{brand.hospital} · {eyebrow || portal}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f]">{title}</h1>
              {subtitle && <p className="mt-2 max-w-2xl text-sm text-[#8b8b8b]">{subtitle}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <StaffAlertsBell />
              {actions}
            </div>
          </header>
        )}
        {children}
        <AssistPanel portal={assistKey || 'admin'} />
      </main>
    </div>
  );
}

function message(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}

function extractRows(data, keys = []) {
  if (Array.isArray(data)) return data;
  for (const key of keys) if (Array.isArray(data?.[key])) return data[key];
  return Array.isArray(data?.items) ? data.items : Array.isArray(data?.content) ? data.content : [];
}

export function DepartmentDashboard({ Layout, endpoint, title, subtitle, links }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(endpoint, { navigate });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Unable to load ${title.toLowerCase()}`);
      setData(json);
      setError('');
    } catch (e) {
      setError(message(e, 'Unable to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, [endpoint, navigate, title]);
  useEffect(() => { load(); }, [load]);

  const metrics = useMemo(() => {
    if (!data || typeof data !== 'object') return [];
    const source = data.metrics && typeof data.metrics === 'object' ? data.metrics : data;
    return Object.entries(source)
      .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
      .slice(0, 8);
  }, [data]);

  return (
    <Layout title={title} subtitle={subtitle} actions={
      <button type="button" onClick={load} disabled={loading} className={ui.btnSecondary}>
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
      </button>
    }>
      {error && <div className="mb-6 rounded-xl bg-[#f8f8f8] px-4 py-3 text-sm text-[#e41e1f]">{error}</div>}
      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 py-20 text-[#8b8b8b]">
          <LoaderCircle size={20} className="animate-spin" /> Loading dashboard…
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.length ? metrics.map(([key, value]) => (
              <div key={key} className={`${ui.card} p-5`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
                  {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                </p>
                <p className="mt-2 text-2xl font-bold text-[#1f1f1f]">{String(value)}</p>
              </div>
            )) : (
              <div className={`${ui.card} p-6 text-sm text-[#8b8b8b] sm:col-span-2`}>
                No dashboard metrics have been recorded yet.
              </div>
            )}
          </section>
          <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={`${ui.card} px-4 py-3 text-sm font-semibold text-[#e41e1f] hover:border-[#8b8b8b]/40`}>
                {link.label}
              </NavLink>
            ))}
          </section>
        </>
      )}
    </Layout>
  );
}

export function ResourcePage({
  Layout,
  endpoint,
  title,
  subtitle,
  itemName,
  fields,
  listKeys = emptyList,
  allowCreate = true,
  allowUpdate = false,
}) {
  const navigate = useNavigate();
  const blank = useMemo(() => Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ''])), [fields]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(endpoint, { navigate });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || `Unable to load ${title.toLowerCase()}`);
      setRows(extractRows(data, listKeys));
      setStatus('');
    } catch (e) {
      setStatus(message(e, `Unable to load ${title.toLowerCase()}`));
    } finally {
      setLoading(false);
    }
  }, [endpoint, listKeys, navigate, title]);
  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const path = editingId == null ? endpoint : `${endpoint}/${editingId}`;
      const res = await apiFetch(path, {
        navigate,
        method: editingId == null ? 'POST' : 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Unable to save ${itemName}`);
      setForm(blank);
      setEditingId(null);
      setStatus(`${itemName} saved.`);
      await load();
    } catch (e) {
      setStatus(message(e, `Unable to save ${itemName}`));
    } finally {
      setSaving(false);
    }
  };

  const edit = (row) => {
    setEditingId(row.id ?? row._id);
    setForm(Object.fromEntries(fields.map((f) => [f.name, row[f.name] ?? ''])));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout title={title} subtitle={subtitle} actions={
      <button type="button" onClick={load} className={ui.btnSecondary}><RefreshCw size={16} /> Refresh</button>
    }>
      {status && <div className="mb-6 rounded-xl bg-[#f8f8f8] px-4 py-3 text-sm text-[#e41e1f]">{status}</div>}
      {(allowCreate || editingId != null) && (
        <section className={`${ui.card} mb-8 p-6`}>
          <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">{editingId == null ? `Add ${itemName}` : `Update ${itemName}`}</h2>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => (
              <label key={field.name} className="text-sm font-semibold text-[#1f1f1f]">
                {field.label}
                {field.type === 'select' ? (
                  <select required={field.required !== false} className={inputClass} value={form[field.name]} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}>
                    <option value="">Select</option>
                    {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea required={field.required !== false} className={inputClass} value={form[field.name]} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />
                ) : (
                  <input type={field.type || 'text'} required={field.required !== false} className={inputClass} value={form[field.name]} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />
                )}
              </label>
            ))}
            <div className="flex items-end gap-2">
              <button type="submit" disabled={saving} className={ui.btnPrimary}><Plus size={16} /> {saving ? 'Saving…' : 'Save'}</button>
              {editingId != null && <button type="button" className={ui.btnSecondary} onClick={() => { setEditingId(null); setForm(blank); }}>Cancel</button>}
            </div>
          </form>
        </section>
      )}
      <section className={`${ui.card} overflow-hidden`}>
        {loading ? <p className="p-6 text-sm text-[#8b8b8b]">Loading…</p> : rows.length === 0 ? (
          <p className="p-6 text-sm text-[#8b8b8b]">No {title.toLowerCase()} found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-[#8b8b8b]">
                <tr>{fields.map((f) => <th key={f.name} className="px-4 py-3 font-semibold">{f.label}</th>)}{allowUpdate && <th className="px-4 py-3">Action</th>}</tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25">
                {rows.map((row, index) => (
                  <tr key={row.id ?? row._id ?? index}>
                    {fields.map((f) => <td key={f.name} className="max-w-xs px-4 py-3 text-[#1f1f1f]">{String(row[f.name] ?? '—')}</td>)}
                    {allowUpdate && <td className="px-4 py-3"><button type="button" className="font-semibold text-[#e41e1f]" onClick={() => edit(row)}>Update</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  );
}

export function DepartmentUsers({
  Layout,
  department,
  usersEndpoint,
  addEndpoint,
  managerUsersEndpoint,
  managerAddEndpoint,
}) {
  const navigate = useNavigate();
  const isAdmin = ['admin', 'super_admin'].includes(getRole());
  const [usersList, setUsersList] = useState([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: department });
  const [status, setStatus] = useState('');
  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const endpoints = [usersEndpoint, managerUsersEndpoint].filter(Boolean);
      const responses = await Promise.all(endpoints.map((path) => apiFetch(path, { navigate })));
      const payloads = await Promise.all(responses.map((res) => res.json().catch(() => [])));
      const failed = responses.findIndex((res) => !res.ok);
      if (failed >= 0) throw new Error(payloads[failed].error || 'Unable to load users');
      setUsersList(payloads.flatMap((data) => extractRows(data, ['users'])));
    } catch (e) { setStatus(message(e, 'Unable to load users')); }
  }, [isAdmin, managerUsersEndpoint, navigate, usersEndpoint]);
  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const target = form.role === 'nurse_manager' && managerAddEndpoint ? managerAddEndpoint : addEndpoint;
      const res = await apiFetch(target, { navigate, method: 'POST', body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to create user');
      setForm({ firstName: '', lastName: '', email: '', password: '', role: department });
      setStatus('Login account created.');
      await load();
    } catch (e) { setStatus(message(e, 'Unable to create user')); }
  };

  return (
    <Layout title={`${department.replace('_', ' ')} login accounts`} subtitle="Hospital administrators can create and review department login accounts.">
      {!isAdmin ? <p className="rounded-xl bg-[#f8f8f8] p-4 text-sm text-[#1f1f1f]">You do not have permission to manage login accounts.</p> : (
        <>
          {status && <div className="mb-6 rounded-xl bg-[#f8f8f8] p-4 text-sm text-[#e41e1f]">{status}</div>}
          <section className={`${ui.card} mb-8 p-6`}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1f1f1f]"><Users size={20} className="text-[#e41e1f]" /> Create account</h2>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {['firstName', 'lastName', 'email', 'password'].map((name) => (
                <label key={name} className="text-sm font-semibold capitalize text-[#1f1f1f]">
                  {name.replace(/([A-Z])/g, ' $1')}
                  <input required minLength={name === 'password' ? 6 : undefined} type={name === 'email' ? 'email' : name === 'password' ? 'password' : 'text'} className={inputClass} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
                </label>
              ))}
              {managerAddEndpoint && (
                <label className="text-sm font-semibold text-[#1f1f1f]">Role
                  <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="nurse">Nurse</option><option value="nurse_manager">Nurse manager</option>
                  </select>
                </label>
              )}
              <div className="flex items-end"><button type="submit" className={ui.btnPrimary}><Plus size={16} /> Create account</button></div>
            </form>
          </section>
          <section className={`${ui.card} p-6`}>
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">Department users</h2>
            {usersList.length === 0 ? <p className="text-sm text-[#8b8b8b]">No login accounts found.</p> : (
              <ul className="divide-y divide-[#8b8b8b]/25">{usersList.map((user, index) => (
                <li key={user.id ?? user._id ?? index} className="flex items-center justify-between gap-3 py-3">
                  <div><p className="font-semibold text-[#1f1f1f]">{user.firstName} {user.lastName}</p><p className="text-sm text-[#8b8b8b]">{user.email}</p></div>
                  <span className="rounded-full bg-[#f8f8f8] px-3 py-1 text-xs font-semibold text-[#e41e1f]">{user.role || department}</span>
                </li>
              ))}</ul>
            )}
          </section>
        </>
      )}
    </Layout>
  );
}

export { LayoutDashboard, Users };

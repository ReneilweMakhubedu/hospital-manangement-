import React, { useCallback, useEffect, useState } from 'react';
import { BedDouble, ClipboardList, LayoutDashboard, Users } from 'lucide-react';
import { DepartmentDashboard, DepartmentLayout, DepartmentUsers, ResourcePage } from '../DepartmentPortal';
import { apiFetch, getRole } from '../../auth';
import { portalChrome as ui } from '../../theme';

function OpsLayout({ portal, ...props }) {
  const nav = [
    { to: portal.home, label: 'Dashboard', icon: LayoutDashboard, end: true },
  ];
  if (portal.work) nav.push({ to: portal.work.path, label: portal.work.label, icon: ClipboardList });
  if (portal.beds) nav.push({ to: portal.beds.path, label: portal.beds.label, icon: BedDouble });
  (portal.extraLinks || []).forEach((link) => nav.push({ to: link.to, label: link.label, icon: ClipboardList }));
  (portal.users || []).forEach((users) => nav.push({ to: users.path, label: users.label, icon: Users, adminOnly: true }));
  return <DepartmentLayout portal={portal.title} eyebrow={portal.eyebrow} nav={nav} assistPortal={portal.desk} {...props} />;
}

function layoutFor(portal) {
  return function BoundLayout(props) {
    return <OpsLayout portal={portal} {...props} />;
  };
}

export function OpsDashboard({ portal }) {
  const links = [];
  if (portal.work) links.push({ to: portal.work.path, label: portal.work.label });
  if (portal.beds) links.push({ to: portal.beds.path, label: portal.beds.label });
  (portal.extraLinks || []).forEach((link) => links.push(link));
  return (
    <DepartmentDashboard
      Layout={layoutFor(portal)}
      endpoint={`/ops/${portal.desk}/dashboard`}
      title={portal.dashboardTitle}
      subtitle={portal.subtitle}
      links={links}
    />
  );
}

export function OpsWork({ portal }) {
  const role = getRole();
  const viewOnly = (portal.work.viewOnly || []).includes(role);
  return (
    <ResourcePage
      Layout={layoutFor(portal)}
      endpoint={`/ops/${portal.desk}/items`}
      title={portal.work.label}
      subtitle={portal.subtitle}
      itemName={portal.work.label.toLowerCase().replace(/s$/, '')}
      fields={portal.work.fields}
      allowCreate={!viewOnly}
      allowUpdate={!viewOnly}
    />
  );
}

export function OpsUsers({ portal, users }) {
  return (
    <DepartmentUsers
      Layout={layoutFor(portal)}
      department={users.label}
      usersEndpoint={users.usersEndpoint}
      addEndpoint={users.addEndpoint}
    />
  );
}

export function HousekeepingBeds({ portal }) {
  const Layout = layoutFor(portal);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/housekeeping/beds');
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'Unable to load beds');
      setRows(Array.isArray(data) ? data : []);
      setStatus('');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markReady = async (id) => {
    setStatus('');
    try {
      const res = await apiFetch(`/housekeeping/beds/${id}/ready`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to mark the bed available');
      setStatus('Bed marked available.');
      await load();
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <Layout title="Beds to clean" subtitle="Housekeeping can release a bed from cleaning to available. Floor, ward, and bed number stay with the nurse manager.">
      {status && <div className="mb-6 rounded-xl bg-[#f8f8f8] px-4 py-3 text-sm text-[#e41e1f]">{status}</div>}
      <section className={`${ui.card} overflow-hidden`}>
        {loading ? <p className="p-6 text-sm text-[#8b8b8b]">Loading…</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-[#8b8b8b]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/25">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-[#1f1f1f]">{row.location}</td>
                    <td className="px-4 py-3 text-[#1f1f1f]">{row.status}</td>
                    <td className="px-4 py-3">
                      {row.status === 'CLEANING' ? (
                        <button type="button" className="font-semibold text-[#e41e1f]" onClick={() => markReady(row.id)}>Mark available</button>
                      ) : '—'}
                    </td>
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

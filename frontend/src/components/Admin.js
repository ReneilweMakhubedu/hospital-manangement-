import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ChartBar,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { asiphileniPillars, brand } from '../brand';
import { portalChrome as ui } from '../theme';

const pillarIcons = {
  infrastructure: Building2,
  hr: Users,
  finance: Wallet,
  patient: HeartPulse,
  monitoring: ChartBar,
};

export default function Admin() {
  const navigate = useNavigate();
  const [activePillar, setActivePillar] = useState('hr');

  const pillar = asiphileniPillars.find((p) => p.id === activePillar) || asiphileniPillars[0];
  const PillarIcon = pillarIcons[pillar.id] || LayoutDashboard;

  const moduleTotal = asiphileniPillars.reduce((n, p) => n + p.modules.length, 0);

  return (
    <div className={ui.page}>
      <aside className={`${ui.asideStatic} min-h-screen`}>
        <div className={ui.brandBlock}>
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12 shrink-0" />
            <div>
              <h2 className={ui.brandTitle}>{brand.shortName}</h2>
              <p className={ui.brandPortal}>{brand.hospital}</p>
            </div>
          </div>
          <p className="mt-3 text-xs font-medium text-[#8b8b8b]">{brand.programmeLabel}</p>
        </div>

        <nav className="mt-4 space-y-1 px-2 pb-8">
          <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#e41e1f]">
            Turnaround pillars
          </p>

          {asiphileniPillars.map((p) => {
            const Icon = pillarIcons[p.id] || LayoutDashboard;
            const isActive = activePillar === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePillar(p.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
                  isActive ? ui.navActive : ui.navIdle
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{p.shortTitle}</span>
              </button>
            );
          })}

          <div className="my-4 border-t border-[#8b8b8b]/25" />

          <button type="button" onClick={() => navigate('/dashboard')} className={ui.footerLink}>
            <LayoutDashboard size={20} />
            Operations dashboard
          </button>

          <button type="button" onClick={() => navigate('/settings')} className={ui.footerLink}>
            <Settings size={20} />
            Settings
          </button>

          <button
            type="button"
            onClick={() => {
              localStorage.clear();
              navigate('/');
            }}
            className={`${ui.logout} mt-4`}
          >
            <LogOut size={20} />
            Logout
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-10">
        <div className="mb-8 rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-8 shadow-sm">
          <p className={ui.eyebrow}>Administration</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1f1f1f] sm:text-4xl">
            {brand.shortName} command centre
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-[#8b8b8b]">
            Modules are organised by {brand.programme} so infrastructure, HR, finance, patient
            experience, and monitoring stay aligned with provincial priorities.
          </p>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-5 shadow-sm">
            <h3 className="text-sm text-[#8b8b8b]">Modules</h3>
            <p className="mt-1 text-3xl font-bold text-[#e41e1f]">{moduleTotal}</p>
          </div>
          <div className="rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-5 shadow-sm">
            <h3 className="text-sm text-[#8b8b8b]">Programme pillars</h3>
            <p className="mt-1 text-3xl font-bold text-[#e41e1f]">{asiphileniPillars.length}</p>
          </div>
          <div className="rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-5 shadow-sm">
            <h3 className="text-sm text-[#8b8b8b]">Facility</h3>
            <p className="mt-1 text-lg font-bold text-[#1f1f1f]">Tertiary · Mbombela</p>
          </div>
        </div>

        <section className="rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-8 shadow-sm">
          <div className="mb-6 flex items-start gap-4">
            <div className="rounded-lg bg-[#f8f8f8] p-3">
              <PillarIcon className="h-8 w-8 text-[#e41e1f]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1f1f1f]">{pillar.title}</h2>
              <p className="mt-2 max-w-2xl text-[#8b8b8b]">{pillar.description}</p>
            </div>
          </div>

          {pillar.modules.length > 0 ? (
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#e41e1f]">
                Modules
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pillar.modules.map((module) => (
                  <div
                    key={module.route}
                    className="rounded-xl border border-[#8b8b8b]/30 bg-[#f5f5f5] p-5 transition hover:border-[#8b8b8b]/40"
                  >
                    <h4 className="font-bold text-[#1f1f1f]">{module.title}</h4>
                    <p className="mt-2 text-sm text-[#8b8b8b]">{module.description}</p>
                    <button
                      type="button"
                      onClick={() => navigate(module.route)}
                      className="mt-4 w-full rounded-lg bg-[#e41e1f] px-4 py-2 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f]"
                    >
                      Open module
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#8b8b8b]">No modules listed for this pillar.</p>
          )}
        </section>
      </main>
    </div>
  );
}

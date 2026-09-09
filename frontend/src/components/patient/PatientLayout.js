import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Pill,
  UserCircle2,
} from 'lucide-react';

import BrandLogo from '../BrandLogo';
import { brand } from '../../brand';
import { logout } from '../../auth';
import { portalChrome as ui } from '../../theme';

const NAV = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/patient/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/patient/medications', label: 'Medications', icon: Pill },
  { to: '/patient/records', label: 'Health records', icon: FileText },
  { to: '/patient/notifications', label: 'Notifications', icon: Bell },
  { to: '/patient/feedback', label: 'Feedback', icon: MessageSquare },
  { to: '/patient/profile', label: 'Profile', icon: UserCircle2 },
  { to: '/patient/support', label: 'Support', icon: HelpCircle },
];

export default function PatientLayout({ title, subtitle, children, actions }) {
  const navigate = useNavigate();
  const email = localStorage.getItem('userEmail');

  return (
    <div className={ui.page}>
      <aside className={ui.aside}>
        <div className={ui.brandBlock}>
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12 shrink-0" />
            <div>
              <h2 className={ui.brandTitle}>{brand.shortName}</h2>
              <p className={ui.brandPortal}>Patient portal</p>
            </div>
          </div>
          <p className={ui.brandHospital}>{brand.hospital}</p>
          {email && (
            <p className={ui.brandEmail} title={email}>
              {email}
            </p>
          )}
        </div>

        <nav className={ui.nav}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => ui.navItem(isActive)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={ui.footer}>
          <button
            type="button"
            onClick={() => logout(navigate)}
            className={ui.logout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="ml-72 flex-1 overflow-y-auto px-6 py-8 sm:px-8 lg:px-10">
        {(title || actions) && (
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {title && (
                <>
                  <p className={ui.eyebrow}>
                    {brand.hospital}
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f]">{title}</h1>
                </>
              )}
              {subtitle && <p className="mt-2 max-w-2xl text-sm text-[#8b8b8b]">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </header>
        )}
        {children}
      </main>
    </div>
  );
}

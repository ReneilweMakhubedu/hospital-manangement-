import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardPlus,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Package,
  Pill,
  Timer,
  Users,
  Wallet,
} from 'lucide-react';

import BrandLogo from '../BrandLogo';
import { brand } from '../../brand';
import { logout } from '../../auth';
import { portalChrome as ui } from '../../theme';

const NAV = [
  { to: '/pharmacy', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pharmacy/operations', label: 'Operations', icon: Timer },
  { to: '/pharmacy/clinical', label: 'Clinical quality', icon: HeartPulse },
  { to: '/pharmacy/finance', label: 'Financial', icon: Wallet },
  { to: '/pharmacy/inventory', label: 'Inventory & supply', icon: Package },
  { to: '/pharmacy/dispense', label: 'Dispense desk', icon: Pill },
  { to: '/pharmacy/users', label: 'Pharmacy logins', icon: Users, adminOnly: true },
];

export default function PharmacyLayout({ title, subtitle, children, actions }) {
  const navigate = useNavigate();
  const email = localStorage.getItem('userEmail');
  const role = localStorage.getItem('userRole');
  const isAdmin = role === 'admin' || role === 'super_admin';
  const navItems = NAV.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className={ui.page}>
      <aside className={ui.aside}>
        <div className={ui.brandBlock}>
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12 shrink-0" />
            <div>
              <h2 className={ui.brandTitle}>{brand.shortName}</h2>
              <p className={ui.brandPortal}>Pharmacy portal</p>
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
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={Boolean(end)}
              className={({ isActive }) => ui.navItem(isActive)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={ui.footer}>
          {isAdmin && (
            <NavLink to="/admin" className={ui.footerLink}>
              <ArrowLeft size={18} />
              Back to Admin
            </NavLink>
          )}
          {role === 'doctor' && (
            <NavLink to="/doctor" className={ui.footerLink}>
              <ClipboardPlus size={18} />
              Back to Doctor
            </NavLink>
          )}
          <button type="button" onClick={() => logout(navigate)} className={ui.logout}>
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
                    {brand.hospital} · Pharmacy Command
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

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Landmark,
  LayoutDashboard,
  LogOut,
  PieChart,
  Receipt,
  ShoppingCart,
  Users,
} from 'lucide-react';

import BrandLogo from '../BrandLogo';
import { brand } from '../../brand';
import { logout } from '../../auth';
import { portalChrome as ui } from '../../theme';

const NAV = [
  { to: '/finance', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/finance/billing', label: 'Billing & revenue', icon: Receipt },
  { to: '/finance/procurement', label: 'Procurement portal', icon: ShoppingCart },
  { to: '/finance/budget', label: 'Budgeting', icon: PieChart },
  { to: '/finance/accounting', label: 'Accounting', icon: BookOpen },
  { to: '/finance/irregular', label: 'Irregular expenditure', icon: AlertTriangle },
  { to: '/finance/cost-centres', label: 'Cost centres', icon: Landmark },
  { to: '/finance/users', label: 'Finance logins', icon: Users, adminOnly: true },
];

export default function FinanceLayout({ title, subtitle, children, actions }) {
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
              <p className={ui.brandPortal}>Finance portal</p>
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
            <NavLink
              to="/admin"
              className={ui.footerLink}
            >
              <ArrowLeft size={18} />
              Back to Admin
            </NavLink>
          )}
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
                    {brand.hospital} · Financial Governance
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

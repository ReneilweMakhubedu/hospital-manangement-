import React from 'react';
import { ClipboardList, LayoutDashboard, PackageSearch, Users } from 'lucide-react';
import { DepartmentLayout } from '../DepartmentPortal';

const nav = [
  { to: '/facilities', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/facilities/work-orders', label: 'Work orders', icon: ClipboardList },
  { to: '/facilities/assets', label: 'Assets', icon: PackageSearch },
  { to: '/facilities/users', label: 'Users', icon: Users, adminOnly: true },
];

export default function FacilitiesLayout(props) {
  return <DepartmentLayout portal="Facilities" eyebrow="Infrastructure Operations" nav={nav} {...props} />;
}

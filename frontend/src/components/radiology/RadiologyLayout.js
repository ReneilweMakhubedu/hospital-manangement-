import React from 'react';
import { LayoutDashboard, ScanLine, Users } from 'lucide-react';
import { DepartmentLayout } from '../DepartmentPortal';

const nav = [
  { to: '/radiology', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/radiology/orders', label: 'Imaging orders', icon: ScanLine },
  { to: '/radiology/users', label: 'Users', icon: Users, adminOnly: true },
];

export default function RadiologyLayout(props) {
  return <DepartmentLayout portal="Radiology" eyebrow="Diagnostic Imaging" nav={nav} {...props} />;
}

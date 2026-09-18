import React from 'react';
import { Bed, ClipboardCheck, HeartPulse, LayoutDashboard, Pill, Users } from 'lucide-react';
import { DepartmentLayout } from '../DepartmentPortal';

const nav = [
  { to: '/nursing', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/nursing/beds', label: 'Beds & wards', icon: Bed },
  { to: '/nursing/vitals', label: 'Vitals', icon: HeartPulse },
  { to: '/nursing/meds', label: 'Meds admin', icon: Pill },
  { to: '/nursing/handovers', label: 'Handovers', icon: ClipboardCheck },
  { to: '/nursing/users', label: 'Users', icon: Users, adminOnly: true },
];

export default function NursingLayout(props) {
  return <DepartmentLayout portal="Nursing" eyebrow="Nursing Operations" nav={nav} {...props} />;
}

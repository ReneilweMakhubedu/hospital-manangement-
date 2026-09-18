import React from 'react';
import { Activity, LayoutDashboard, Users } from 'lucide-react';
import { DepartmentLayout } from '../DepartmentPortal';

const nav = [
  { to: '/casualty', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/casualty/visits', label: 'Triage board', icon: Activity },
  { to: '/casualty/users', label: 'Users', icon: Users, adminOnly: true },
];

export default function CasualtyLayout(props) {
  return <DepartmentLayout portal="Casualty" eyebrow="Emergency Care" nav={nav} {...props} />;
}

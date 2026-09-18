import React from 'react';
import { FlaskConical, LayoutDashboard, Users } from 'lucide-react';
import { DepartmentLayout } from '../DepartmentPortal';

const nav = [
  { to: '/lab', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/lab/orders', label: 'Lab orders', icon: FlaskConical },
  { to: '/lab/users', label: 'Users', icon: Users, adminOnly: true },
];

export default function LabLayout(props) {
  return <DepartmentLayout portal="Laboratory" eyebrow="Diagnostic Laboratory" nav={nav} {...props} />;
}

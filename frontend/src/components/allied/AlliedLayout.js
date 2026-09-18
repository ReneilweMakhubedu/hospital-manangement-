import React from 'react';
import { HandHeart, LayoutDashboard, Users } from 'lucide-react';
import { DepartmentLayout } from '../DepartmentPortal';

const nav = [
  { to: '/allied', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/allied/referrals', label: 'Referrals', icon: HandHeart },
  { to: '/allied/users', label: 'Users', icon: Users, adminOnly: true },
];

export default function AlliedLayout(props) {
  return <DepartmentLayout portal="Allied Health" eyebrow="Allied Health Services" nav={nav} {...props} />;
}

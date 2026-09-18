import React from 'react';
import { DepartmentDashboard } from '../DepartmentPortal';
import AlliedLayout from './AlliedLayout';

export default function AlliedDashboard() {
  return <DepartmentDashboard Layout={AlliedLayout} endpoint="/allied/dashboard" title="Allied health dashboard" subtitle="Referral demand, service workload, and patient progress across allied disciplines." links={[{ to: '/allied/referrals', label: 'Open allied referrals' }]} />;
}

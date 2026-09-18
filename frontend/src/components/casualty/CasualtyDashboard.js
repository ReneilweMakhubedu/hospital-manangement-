import React from 'react';
import { DepartmentDashboard } from '../DepartmentPortal';
import CasualtyLayout from './CasualtyLayout';

export default function CasualtyDashboard() {
  return <DepartmentDashboard Layout={CasualtyLayout} endpoint="/casualty/dashboard" title="Casualty dashboard" subtitle="Emergency arrivals, acuity, waiting times, and patient flow." links={[{ to: '/casualty/visits', label: 'Open triage board' }]} />;
}

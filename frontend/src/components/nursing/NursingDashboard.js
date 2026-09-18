import React from 'react';
import { DepartmentDashboard } from '../DepartmentPortal';
import NursingLayout from './NursingLayout';

export default function NursingDashboard() {
  return <DepartmentDashboard Layout={NursingLayout} endpoint="/nursing/dashboard" title="Nursing dashboard" subtitle="Ward capacity, clinical observations, medication administration, and shift continuity." links={[
    { to: '/nursing/beds', label: 'Beds & wards' }, { to: '/nursing/vitals', label: 'Record vitals' },
    { to: '/nursing/meds', label: 'Medication administration' }, { to: '/nursing/handovers', label: 'Shift handovers' },
  ]} />;
}

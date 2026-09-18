import React from 'react';
import { DepartmentDashboard } from '../DepartmentPortal';
import FacilitiesLayout from './FacilitiesLayout';

export default function FacilitiesDashboard() {
  return <DepartmentDashboard Layout={FacilitiesLayout} endpoint="/facilities/dashboard" title="Facilities dashboard" subtitle="Maintenance demand, response performance, and asset condition." links={[
    { to: '/facilities/work-orders', label: 'Open work orders' }, { to: '/facilities/assets', label: 'Open asset register' },
  ]} />;
}

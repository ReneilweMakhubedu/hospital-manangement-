import React from 'react';
import { DepartmentDashboard } from '../DepartmentPortal';
import RadiologyLayout from './RadiologyLayout';

export default function RadiologyDashboard() {
  return <DepartmentDashboard Layout={RadiologyLayout} endpoint="/radiology/dashboard" title="Radiology dashboard" subtitle="Imaging workload, reporting status, and turnaround performance." links={[{ to: '/radiology/orders', label: 'Open imaging orders' }]} />;
}

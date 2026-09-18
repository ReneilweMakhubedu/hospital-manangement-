import React from 'react';
import { DepartmentDashboard } from '../DepartmentPortal';
import LabLayout from './LabLayout';

export default function LabDashboard() {
  return <DepartmentDashboard Layout={LabLayout} endpoint="/lab/dashboard" title="Laboratory dashboard" subtitle="Specimen workload, turnaround performance, and result status." links={[{ to: '/lab/orders', label: 'Open laboratory orders' }]} />;
}

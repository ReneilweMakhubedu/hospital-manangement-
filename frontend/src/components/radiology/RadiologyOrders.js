import React from 'react';
import { ResourcePage } from '../DepartmentPortal';
import RadiologyLayout from './RadiologyLayout';

const fields = [
  { name: 'patientName', label: 'Patient' },
  { name: 'modality', label: 'Modality', type: 'select', options: ['XRAY', 'CT', 'US', 'MRI'] },
  { name: 'studyName', label: 'Study' }, { name: 'priority', label: 'Priority', type: 'select', options: ['ROUTINE', 'URGENT', 'STAT'] },
  { name: 'status', label: 'Status', type: 'select', options: ['ORDERED', 'SCHEDULED', 'IN_PROGRESS', 'REPORTED', 'CANCELLED'] },
  { name: 'reportSummary', label: 'Report summary', required: false },
];

export default function RadiologyOrders() {
  return <ResourcePage Layout={RadiologyLayout} endpoint="/radiology/orders" title="Imaging orders" subtitle="Schedule, perform, and report diagnostic imaging studies." itemName="imaging order" fields={fields} listKeys={['orders']} allowUpdate />;
}

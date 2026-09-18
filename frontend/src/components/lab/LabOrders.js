import React from 'react';
import { ResourcePage } from '../DepartmentPortal';
import LabLayout from './LabLayout';

const fields = [
  { name: 'patientName', label: 'Patient' }, { name: 'testName', label: 'Test' },
  { name: 'priority', label: 'Priority', type: 'select', options: ['ROUTINE', 'STAT'] },
  { name: 'status', label: 'Status', type: 'select', options: ['ORDERED', 'IN_PROGRESS', 'RESULTED', 'CANCELLED'] },
  { name: 'resultSummary', label: 'Result summary', required: false },
];

export default function LabOrders() {
  return <ResourcePage Layout={LabLayout} endpoint="/lab/orders" title="Laboratory orders" subtitle="Track specimens and progress tests through to verified results." itemName="lab order" fields={fields} listKeys={['orders']} allowUpdate />;
}

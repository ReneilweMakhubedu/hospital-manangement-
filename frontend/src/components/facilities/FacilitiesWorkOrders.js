import React from 'react';
import { ResourcePage } from '../DepartmentPortal';
import FacilitiesLayout from './FacilitiesLayout';

const fields = [
  { name: 'title', label: 'Title' }, { name: 'location', label: 'Location' },
  { name: 'category', label: 'Category', type: 'select', options: ['HVAC', 'ELECTRICAL', 'PLUMBING', 'BIOMED', 'GENERAL'] },
  { name: 'priority', label: 'Priority', type: 'select', options: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
  { name: 'status', label: 'Status', type: 'select', options: ['OPEN', 'IN_PROGRESS', 'DONE'] },
  { name: 'assetTag', label: 'Asset tag', required: false },
];

export default function FacilitiesWorkOrders() {
  return <ResourcePage Layout={FacilitiesLayout} endpoint="/facilities/work-orders" title="Facilities work orders" subtitle="Log, prioritise, assign, and close maintenance work." itemName="work order" fields={fields} listKeys={['workOrders']} allowUpdate />;
}

import React from 'react';
import { ResourcePage } from '../DepartmentPortal';
import FacilitiesLayout from './FacilitiesLayout';

const fields = [
  { name: 'assetTag', label: 'Asset tag' }, { name: 'name', label: 'Asset name' },
  { name: 'location', label: 'Location' },
  { name: 'status', label: 'Status', type: 'select', options: ['IN_SERVICE', 'DOWN', 'MAINTENANCE'] },
  { name: 'nextPmDate', label: 'Next planned maintenance', type: 'date', required: false },
];

export default function FacilitiesAssets() {
  return <ResourcePage Layout={FacilitiesLayout} endpoint="/facilities/assets" title="Asset register" subtitle="Maintain equipment location, condition, and service due dates." itemName="asset" fields={fields} listKeys={['assets']} allowUpdate />;
}

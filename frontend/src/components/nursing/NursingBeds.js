import React from 'react';
import { ResourcePage } from '../DepartmentPortal';
import NursingLayout from './NursingLayout';

const fields = [
  { name: 'wardName', label: 'Ward' }, { name: 'bedNumber', label: 'Bed number' },
  { name: 'status', label: 'Status', type: 'select', options: ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'BLOCKED'] },
  { name: 'patientName', label: 'Patient', required: false },
  { name: 'acuity', label: 'Acuity', type: 'select', options: ['LOW', 'MEDIUM', 'HIGH'] },
];

export default function NursingBeds() {
  return <ResourcePage Layout={NursingLayout} endpoint="/nursing/beds" title="Beds & wards" subtitle="Review ward capacity and update bed status or patient allocation." itemName="bed" fields={fields} listKeys={['beds']} allowUpdate />;
}

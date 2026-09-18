import React from 'react';
import { ResourcePage } from '../DepartmentPortal';
import NursingLayout from './NursingLayout';

const fields = [
  { name: 'wardName', label: 'Ward' }, { name: 'shift', label: 'Shift', type: 'select', options: ['DAY', 'NIGHT'] },
  { name: 'summary', label: 'Handover summary', type: 'textarea' },
];

export default function NursingHandovers() {
  return <ResourcePage Layout={NursingLayout} endpoint="/nursing/handovers" title="Shift handovers" subtitle="Capture structured patient and ward handover notes." itemName="handover" fields={fields} listKeys={['handovers']} />;
}

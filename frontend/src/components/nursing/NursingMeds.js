import React from 'react';
import { ResourcePage } from '../DepartmentPortal';
import NursingLayout from './NursingLayout';

const fields = [
  { name: 'patientName', label: 'Patient' }, { name: 'medication', label: 'Medication' },
  { name: 'dose', label: 'Dose' }, { name: 'route', label: 'Route' },
  { name: 'status', label: 'Status', type: 'select', options: ['GIVEN', 'HELD', 'MISSED'] },
];

export default function NursingMeds() {
  return <ResourcePage Layout={NursingLayout} endpoint="/nursing/meds" title="Medication administration" subtitle="Document every administered, held, or missed dose." itemName="administration" fields={fields} listKeys={['meds']} />;
}

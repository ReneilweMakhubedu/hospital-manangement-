import React from 'react';
import { ResourcePage } from '../DepartmentPortal';
import NursingLayout from './NursingLayout';

const fields = [
  { name: 'patientName', label: 'Patient' }, { name: 'bedId', label: 'Bed ID', type: 'number', required: false },
  { name: 'tempC', label: 'Temperature °C', type: 'number' },
  { name: 'bpSystolic', label: 'Systolic', type: 'number' }, { name: 'bpDiastolic', label: 'Diastolic', type: 'number' },
  { name: 'pulse', label: 'Pulse', type: 'number' }, { name: 'spo2', label: 'Oxygen saturation %', type: 'number' },
];

export default function NursingVitals() {
  return <ResourcePage Layout={NursingLayout} endpoint="/nursing/vitals" title="Patient vitals" subtitle="Record and review clinical observations." itemName="vital record" fields={fields} listKeys={['vitals', 'observations']} />;
}

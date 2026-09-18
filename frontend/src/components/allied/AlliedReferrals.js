import React from 'react';
import { ResourcePage } from '../DepartmentPortal';
import AlliedLayout from './AlliedLayout';

const fields = [
  { name: 'patientName', label: 'Patient' },
  { name: 'discipline', label: 'Discipline', type: 'select', options: ['PHYSIO', 'OT', 'DIETETICS', 'SOCIAL_WORK', 'PSYCHOLOGY', 'SPEECH'] },
  { name: 'reason', label: 'Referral reason', type: 'textarea' },
  { name: 'status', label: 'Status', type: 'select', options: ['NEW', 'ACTIVE', 'COMPLETED'] },
  { name: 'notes', label: 'Notes', required: false },
];

export default function AlliedReferrals() {
  return <ResourcePage Layout={AlliedLayout} endpoint="/allied/referrals" title="Allied health referrals" subtitle="Receive, prioritise, and complete multidisciplinary referrals." itemName="referral" fields={fields} listKeys={['referrals']} allowUpdate />;
}

import React from 'react';
import { ResourcePage } from '../DepartmentPortal';
import CasualtyLayout from './CasualtyLayout';

const fields = [
  { name: 'patientName', label: 'Patient' }, { name: 'chiefComplaint', label: 'Chief complaint' },
  { name: 'triageCategory', label: 'Triage', type: 'select', options: ['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE'] },
  { name: 'status', label: 'Status', type: 'select', options: ['WAITING', 'IN_TRIAGE', 'IN_TREATMENT', 'DISCHARGED', 'ADMITTED'] },
  { name: 'disposition', label: 'Disposition', required: false },
];

export default function CasualtyVisits() {
  return <ResourcePage Layout={CasualtyLayout} endpoint="/casualty/visits" title="Casualty visits" subtitle="Create visits, assign triage acuity, and update patient flow." itemName="visit" fields={fields} listKeys={['visits']} allowUpdate />;
}

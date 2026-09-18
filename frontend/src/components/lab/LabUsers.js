import React from 'react';
import { DepartmentUsers } from '../DepartmentPortal';
import LabLayout from './LabLayout';

export default function LabUsers() {
  return <DepartmentUsers Layout={LabLayout} department="lab" usersEndpoint="/admin/lab-users" addEndpoint="/admin/add-lab" />;
}

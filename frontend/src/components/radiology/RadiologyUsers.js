import React from 'react';
import { DepartmentUsers } from '../DepartmentPortal';
import RadiologyLayout from './RadiologyLayout';

export default function RadiologyUsers() {
  return <DepartmentUsers Layout={RadiologyLayout} department="radiology" usersEndpoint="/admin/radiology-users" addEndpoint="/admin/add-radiology" />;
}

import React from 'react';
import { DepartmentUsers } from '../DepartmentPortal';
import CasualtyLayout from './CasualtyLayout';

export default function CasualtyUsers() {
  return <DepartmentUsers Layout={CasualtyLayout} department="casualty" usersEndpoint="/admin/casualty-users" addEndpoint="/admin/add-casualty" />;
}

import React from 'react';
import { DepartmentUsers } from '../DepartmentPortal';
import AlliedLayout from './AlliedLayout';

export default function AlliedUsers() {
  return <DepartmentUsers Layout={AlliedLayout} department="allied" usersEndpoint="/admin/allied-users" addEndpoint="/admin/add-allied" />;
}

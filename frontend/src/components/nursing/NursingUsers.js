import React from 'react';
import { DepartmentUsers } from '../DepartmentPortal';
import NursingLayout from './NursingLayout';

export default function NursingUsers() {
  return <DepartmentUsers
    Layout={NursingLayout}
    department="nurse"
    usersEndpoint="/admin/nurse-users"
    addEndpoint="/admin/add-nurse"
    managerUsersEndpoint="/admin/nurse-manager-users"
    managerAddEndpoint="/admin/add-nurse-manager"
  />;
}

import React from 'react';
import { DepartmentUsers } from '../DepartmentPortal';
import FacilitiesLayout from './FacilitiesLayout';

export default function FacilitiesUsers() {
  return <DepartmentUsers Layout={FacilitiesLayout} department="facilities" usersEndpoint="/admin/facilities-users" addEndpoint="/admin/add-facilities" />;
}

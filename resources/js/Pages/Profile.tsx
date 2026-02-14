import React from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import { Profile as ProfileContent } from '../Components/Profile';
import { Employee, ProfileRequest, Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  userRole: UserRole;
  settings: Settings;
  employee: Employee;
  requests: ProfileRequest[];
}

export default function Profile({ userRole, settings, employee, requests }: Props) {
  const t = TRANSLATIONS[settings.language || 'en'];

  const handleRequestUpdate = (description: string) => {
    const newRequest = {
      employeeId: employee.id,
      description: description,
      date: new Date().toISOString(),
      status: 'Pending'
    };
    router.post('/requests', newRequest);
  };

  return (
    <AppLayout userRole={userRole} settings={settings}>
      <ProfileContent 
        employee={employee}
        requests={requests}
        onRequestUpdate={handleRequestUpdate}
        t={t} 
      />
    </AppLayout>
  );
}

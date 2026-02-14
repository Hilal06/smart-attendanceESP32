import React from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import { Requests as RequestsContent } from '../Components/Requests';
import { ProfileRequest, Employee, Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  userRole: UserRole;
  settings: Settings;
  requests: ProfileRequest[];
  employees: Employee[];
}

export default function Requests({ userRole, settings, requests, employees }: Props) {
  const t = TRANSLATIONS[settings.language || 'en'];

  const handleResolve = (id: string) => {
    router.put(`/requests/${id}`, { status: 'Resolved' });
  };

  const handleDelete = (id: string) => {
    router.delete(`/requests/${id}`);
  };

  return (
    <AppLayout userRole={userRole} settings={settings}>
      <RequestsContent 
        requests={requests}
        employees={employees}
        onResolve={handleResolve}
        onDelete={handleDelete}
        t={t} 
      />
    </AppLayout>
  );
}

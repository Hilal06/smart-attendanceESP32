import React from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import { Requests as RequestsContent } from '../Components/Requests';
import { ProfileRequest, Profile, Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  userRole: UserRole;
  settings: Settings;
  requests: ProfileRequest[];
  profiles: Profile[];
}

export default function Requests({ userRole, settings, requests, profiles }: Props) {
  const t = TRANSLATIONS[settings?.language || 'en'];

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
        profiles={profiles}
        onResolve={handleResolve}
        onDelete={handleDelete}
        t={t} 
      />
    </AppLayout>
  );
}

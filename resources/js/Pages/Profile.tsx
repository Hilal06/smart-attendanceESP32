import React from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import { Profile as ProfileContent } from '../Components/Profile';
import { Profile as ProfileType, ProfileRequest, Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  userRole: UserRole;
  settings: Settings;
  profile: ProfileType;
  requests: ProfileRequest[];
}

export default function Profile({ userRole, settings, profile, requests }: Props) {
  const { errors } = usePage().props;
  const t = TRANSLATIONS[settings?.language || 'en'];

  const handleRequestUpdate = (description: string) => {
    const newRequest = {
      profileId: profile.id,
      description: description,
      date: new Date().toISOString(),
      status: 'Pending'
    };
    router.post('/requests', newRequest);
  };

  return (
    <AppLayout userRole={userRole} settings={settings}>
      <ProfileContent
        profile={profile}
        requests={requests}
        onRequestUpdate={handleRequestUpdate}
        t={t}
        externalErrors={errors as Record<string, string>}
      />
    </AppLayout>
  );
}

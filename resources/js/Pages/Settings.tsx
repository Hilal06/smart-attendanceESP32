
import React from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import { Settings as SettingsComponent } from '../Components/Settings';
import { Settings as SettingsType, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  userRole: UserRole;
  settings: SettingsType;
}

export default function SettingsPage({ userRole, settings }: Props) {
  const t = TRANSLATIONS[settings.language || 'en'];

  const handleSave = (newSettings: SettingsType) => {
    router.post('/settings', newSettings);
  };

  return (
    <AppLayout userRole={userRole} settings={settings}>
      <SettingsComponent 
        settings={settings} 
        onSave={handleSave} 
        t={t} 
      />
    </AppLayout>
  );
}

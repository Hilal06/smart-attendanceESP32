import React from 'react';
import AppLayout from '../Layouts/AppLayout';
import { Reports as ReportsContent } from '../Components/Reports';
import { AttendanceRecord, Profile, Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  userRole: UserRole;
  settings: Settings;
  attendance: AttendanceRecord[];
  profiles: Profile[];
}

export default function Reports({ userRole, settings, attendance, profiles }: Props) {
  const t = TRANSLATIONS[settings?.language || 'en'];

  return (
    <AppLayout userRole={userRole} settings={settings}>
      <ReportsContent 
        attendance={attendance}
        profiles={profiles}
        t={t} 
      />
    </AppLayout>
  );
}

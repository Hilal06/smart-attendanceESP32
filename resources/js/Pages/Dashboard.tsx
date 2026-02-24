import React from 'react';
import AppLayout from '../Layouts/AppLayout';
import { Dashboard as DashboardContent } from '../Components/Dashboard';
import { Profile, AttendanceRecord, Announcement, Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  userRole: UserRole;
  settings: Settings;
  profiles: Profile[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
}

export default function Dashboard({ userRole, settings, profiles, attendance, announcements }: Props) {
  const t = TRANSLATIONS[settings.language || 'en'];

  return (
    <AppLayout userRole={userRole} settings={settings}>
      <DashboardContent
        profiles={profiles}
        attendance={attendance}
        announcements={announcements}
        t={t}
        userRole={userRole}
      />
    </AppLayout>
  );
}

import React from 'react';
import AppLayout from '../Layouts/AppLayout';
import { Dashboard as DashboardContent } from '../Components/DashboardContent';
import { Employee, AttendanceRecord, Announcement, Settings, UserRole } from '../types';
import { MOCK_EMPLOYEES, MOCK_ATTENDANCE, MOCK_ANNOUNCEMENTS, TRANSLATIONS } from '../constants';

interface Props {
  userRole: UserRole;
  settings: Settings;
}

export default function Dashboard({ userRole, settings }: Props) {
  const t = TRANSLATIONS[settings.language || 'en'];

  return (
    <AppLayout userRole={userRole} settings={settings}>
      <DashboardContent 
        employees={MOCK_EMPLOYEES} 
        attendance={MOCK_ATTENDANCE} 
        announcements={MOCK_ANNOUNCEMENTS} 
        t={t}
      />
    </AppLayout>
  );
}

import React from 'react';
import AppLayout from '../Layouts/AppLayout';
import { Dashboard as DashboardContent } from '../Components/Dashboard';
import { Employee, AttendanceRecord, Announcement, Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  userRole: UserRole;
  settings: Settings;
  employees: Employee[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
}

export default function Dashboard({ userRole, settings, employees, attendance, announcements }: Props) {
  const t = TRANSLATIONS[settings.language || 'en'];

  return (
    <AppLayout userRole={userRole} settings={settings}>
      <DashboardContent 
        employees={employees} 
        attendance={attendance} 
        announcements={announcements} 
        t={t}
      />
    </AppLayout>
  );
}

import React from 'react';
import AppLayout from '../Layouts/AppLayout';
import { Reports as ReportsContent } from '../Components/Reports';
import { AttendanceRecord, Employee, Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  userRole: UserRole;
  settings: Settings;
  attendance: AttendanceRecord[];
  employees: Employee[];
}

export default function Reports({ userRole, settings, attendance, employees }: Props) {
  const t = TRANSLATIONS[settings.language || 'en'];

  return (
    <AppLayout userRole={userRole} settings={settings}>
      <ReportsContent 
        attendance={attendance}
        employees={employees}
        t={t} 
      />
    </AppLayout>
  );
}

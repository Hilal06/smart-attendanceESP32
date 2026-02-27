import React from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import { Announcements as AnnouncementsContent } from '../Components/Announcements';
import { Announcement, Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  userRole: UserRole;
  settings: Settings;
  announcements: Announcement[];
}

export default function Announcements({ userRole, settings, announcements }: Props) {
  const t = TRANSLATIONS[settings?.language || 'en'];

  const handleAdd = (announcement: Announcement) => {
    router.post('/announcements', announcement);
  };

  const handleEdit = (announcement: Announcement) => {
    router.put(`/announcements/${announcement.id}`, announcement);
  };

  const handleDelete = (id: string) => {
    router.delete(`/announcements/${id}`);
  };

  return (
    <AppLayout userRole={userRole} settings={settings}>
      <AnnouncementsContent 
        announcements={announcements}
        userRole={userRole}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        t={t} 
      />
    </AppLayout>
  );
}

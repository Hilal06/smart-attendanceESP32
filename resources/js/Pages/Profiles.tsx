import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import { ProfileList } from '../Components/ProfileList';
import { Profile, Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  userRole: UserRole;
  settings: Settings;
  profiles: Profile[];
}

export default function Profiles({ userRole, settings, profiles }: Props) {
  const t = TRANSLATIONS[settings.language || 'en'];
  const { errors } = usePage().props;
  const [processing, setProcessing] = useState(false);

  const handleAdd = (emp: Profile, avatarFile?: File, faceDataFile?: File) => {
    setProcessing(true);
    const data: any = { ...emp };
    if (avatarFile) {
      data.avatar = avatarFile;
    }
    if (faceDataFile) {
      data.face_data = faceDataFile;
    }

    router.post('/profiles', data, {
      forceFormData: !!avatarFile || !!faceDataFile,
      onFinish: () => setProcessing(false),
      onError: () => {
        // Errors are automatically available in usePage().props.errors
      },
      onSuccess: () => {
        // Success logic here
      }
    });
  };

  const handleEdit = (emp: Profile, avatarFile?: File, faceDataFile?: File) => {
    setProcessing(true);
    const data: any = { ...emp };

    if (avatarFile) {
      data.avatar = avatarFile;
    }

    if (faceDataFile) {
      data.face_data = faceDataFile;
    }

    if (avatarFile || faceDataFile) {
      data._method = 'put';
      router.post(`/profiles/${emp.id}`, data, {
        forceFormData: true,
        onFinish: () => setProcessing(false),
        onError: () => {
          // Server errors passed back to component
        }
      });
    } else {
      const data: any = { ...emp };
      router.put(`/profiles/${emp.id}`, data, {
        onFinish: () => setProcessing(false),
        onError: () => {
          // Server errors passed back to component
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    setProcessing(true);
    router.delete(`/profiles/${id}`, {
      onFinish: () => setProcessing(false),
      onError: (err: any) => {
        // Custom delete error message if needed
      }
    });
  };

  return (
    <AppLayout userRole={userRole} settings={settings}>
      <ProfileList
        profiles={profiles}
        onAddProfile={handleAdd}
        onEditProfile={handleEdit}
        onDeleteProfile={handleDelete}
        t={t}
        isProcessing={processing}
        externalErrors={errors as Record<string, string>}
      />
    </AppLayout>
  );
}
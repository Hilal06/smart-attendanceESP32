import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import { EmployeeList } from '../Components/EmployeeList';
import { Employee, Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  userRole: UserRole;
  settings: Settings;
  employees: Employee[];
}

export default function Employees({ userRole, settings, employees }: Props) {
  const t = TRANSLATIONS[settings.language || 'en'];
  const { errors } = usePage().props;
  const [processing, setProcessing] = useState(false);

  const handleAdd = (emp: Employee, avatarFile?: File) => {
    setProcessing(true);
    const data: any = { ...emp };
    if (avatarFile) {
      data.avatar = avatarFile;
    }

    router.post('/employees', data, {
      forceFormData: !!avatarFile,
      onFinish: () => setProcessing(false),
      onError: () => {
        // Errors are automatically available in usePage().props.errors
      },
      onSuccess: () => {
        // Success logic here
      }
    });
  };

  const handleEdit = (emp: Employee, avatarFile?: File) => {
    setProcessing(true);
    const data: any = { ...emp };

    if (avatarFile) {
      data.avatar = avatarFile;
      data._method = 'put';
      router.post(`/employees/${emp.id}`, data, {
        forceFormData: true,
        onFinish: () => setProcessing(false),
        onError: () => {
          // Server errors passed back to component
        }
      });
    } else {
      const data: any = { ...emp };
      router.put(`/employees/${emp.id}`, data, {
        onFinish: () => setProcessing(false),
        onError: () => {
          // Server errors passed back to component
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    setProcessing(true);
    router.delete(`/employees/${id}`, {
      onFinish: () => setProcessing(false),
      onError: (err: any) => {
        // Custom delete error message if needed
      }
    });
  };

  return (
    <AppLayout userRole={userRole} settings={settings}>
      <EmployeeList
        employees={employees}
        onAddEmployee={handleAdd}
        onEditEmployee={handleEdit}
        onDeleteEmployee={handleDelete}
        t={t}
        isProcessing={processing}
        externalErrors={errors as Record<string, string>}
      />
    </AppLayout>
  );
}
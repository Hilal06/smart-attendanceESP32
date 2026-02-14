import React from 'react';
import { router } from '@inertiajs/react';
import { Login as LoginComponent } from '../Components/Login';
import { Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  settings: Settings;
}

export default function Login({ settings }: Props) {
  const t = TRANSLATIONS[settings.language || 'en'];

  const handleLogin = (role: UserRole, id?: string) => {
    router.post('/login', { role, id });
  };

  return (
    <LoginComponent onLogin={handleLogin} t={t} />
  );
}

import React, { useState } from 'react';
import { Sidebar } from '../Components/Sidebar';
import { Menu } from 'lucide-react';
import { Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  children: React.ReactNode;
  userRole: UserRole;
  settings: Settings;
}

export default function AppLayout({ children, userRole, settings }: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[settings.language || 'en'];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        userRole={userRole}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        t={t}
        settings={settings}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-slate-500 hover:text-slate-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-center px-4">
            {settings.companyLogo ? (
              <img src={settings.companyLogo} alt={settings.companyName} className="h-8 w-auto object-contain" />
            ) : (
              <span className="text-lg font-bold text-slate-900 truncate">{settings.companyName || 'SmartAttend'}</span>
            )}
          </div>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

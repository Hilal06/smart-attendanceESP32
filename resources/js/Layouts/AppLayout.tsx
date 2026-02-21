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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 overflow-hidden relative">
      {/* Global Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-400/10 dark:bg-indigo-600/10 blur-[100px]"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-600/5 blur-[100px]"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-emerald-400/5 dark:bg-emerald-600/5 blur-[120px]"></div>
      </div>

      <div className="z-10 flex h-full w-full">
        <Sidebar
          userRole={userRole}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
          t={t}
          settings={settings}
        />

        <div className="flex flex-1 flex-col overflow-hidden relative z-10">
          {/* Fixed mesh gradient behind main content */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="fixed inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-900/5 dark:via-purple-900/5 dark:to-pink-900/5 opacity-50 dark:opacity-30 blur-2xl"></div>
          </div>

          {/* Mobile Header - Sticky with Glassmorphism */}
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 lg:hidden transition-colors duration-200">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex flex-1 justify-center items-center gap-2 px-4">
              {settings.companyLogo && (
                <img src={settings.companyLogo} alt={settings.companyName} className="h-8 w-8 object-contain rounded border border-slate-100 dark:border-slate-800 bg-white p-0.5 shadow-sm" />
              )}
              <span className="text-lg font-bold text-slate-900 dark:text-white truncate">{settings.companyName || 'SmartAttend'}</span>
            </div>
            <div className="w-6" />
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-8 transition-colors duration-200 relative z-10">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-200 fill-mode-both">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

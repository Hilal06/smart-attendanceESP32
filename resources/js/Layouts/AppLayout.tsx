import React, { useState, useEffect } from 'react';
import { Sidebar } from '../Components/Sidebar';
import { Menu } from 'lucide-react';
import { Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import { Toaster, toast } from 'sonner';
import { usePage } from '@inertiajs/react';

interface Props {
  children: React.ReactNode;
  userRole: UserRole;
  settings: Settings;
}

export default function AppLayout({ children, userRole, settings }: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[settings?.language || 'en'];
  const { flash } = usePage<any>().props;

  useEffect(() => {
    if (flash?.message) {
      toast.success(flash.message);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);

  useEffect(() => {
    const handleColorThemeUpdate = () => {
      const theme = localStorage.getItem('smartattend-color-theme') || 'emerald';
      document.documentElement.setAttribute('data-color-theme', theme);
    };
    handleColorThemeUpdate();
    window.addEventListener('color-theme-updated', handleColorThemeUpdate);
    return () => window.removeEventListener('color-theme-updated', handleColorThemeUpdate);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden relative">
      <Toaster position="bottom-right" richColors />

      <div className="z-10 flex h-full w-full">
        <Sidebar
          userRole={userRole}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
          t={t}
          settings={settings}
        />

        <div className="flex flex-1 flex-col overflow-hidden relative z-10">


          {/* Mobile Header - Sticky with Glassmorphism */}
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 lg:hidden transition-colors duration-200">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-theme-primary"
              aria-label={t.language === 'id' ? 'Buka navigasi menu' : 'Open navigation menu'}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex flex-1 justify-center items-center gap-2 px-4">
              {settings?.companyLogo && (
                <img src={settings.companyLogo} alt={settings.companyName} className="h-8 w-8 object-contain rounded border border-slate-100 dark:border-slate-800 bg-white p-0.5 shadow-sm" />
              )}
              <span className="text-lg font-bold text-slate-900 dark:text-white truncate">{settings?.companyName || 'SmartAttend'}</span>
            </div>
            <div className="w-6" />
          </header>

          <main className="flex-1 overflow-y-auto px-6 lg:px-12 py-8 transition-colors duration-200 relative z-10">
            <div className="mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-2 duration-200 fill-mode-both">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

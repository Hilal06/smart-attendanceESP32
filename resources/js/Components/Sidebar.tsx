import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { UserRole, Settings } from '../types';
import { LayoutDashboard, Users, BarChart3, Settings as SettingsIcon, LogOut, UserCircle, Inbox, Megaphone } from 'lucide-react';

interface SidebarProps {
  userRole: UserRole;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  t: any;
  settings: Settings;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole,
  isMobileOpen,
  setIsMobileOpen,
  t,
  settings
}) => {
  const { url } = usePage();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Normalize URL for comparison (remove trailing slash if present, unless it's root)
  const currentPath = url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;

  const navItems = [
    { href: '/', label: t.dashboard, icon: LayoutDashboard, roles: ['admin', 'attendance'] },
    { href: '/announcements', label: t.announcements, icon: Megaphone, roles: ['admin', 'attendance'] },
    { href: '/profile', label: t.profile, icon: UserCircle, roles: ['attendance'] },
    { href: '/requests', label: t.requests, icon: Inbox, roles: ['admin'] },
    { href: '/employees', label: t.employees, icon: Users, roles: ['admin'] },
    { href: '/reports', label: t.reports, icon: BarChart3, roles: ['admin'] },
    { href: '/settings', label: t.settings, icon: SettingsIcon, roles: ['admin'] },
  ].filter(item => item.roles.includes(userRole));

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-start gap-3 border-b border-slate-800 px-4 mt-2 mb-2">
            {settings.companyLogo && (
              <img src={settings.companyLogo} alt={settings.companyName} className="h-10 w-10 object-contain rounded bg-white p-0.5" />
            )}
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent truncate flex-1">
              {settings.companyName || 'SmartAttend'}
            </h1>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              // Check if URL starts with the item href. Special case for root '/' to avoid matching everything.
              const isActive = item.href === '/'
                ? currentPath === '/'
                : currentPath.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`group flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <Icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() => {
                const html = document.documentElement;
                if (html.classList.contains('dark')) {
                  html.classList.remove('dark');
                  localStorage.setItem('vite-ui-theme', 'light');
                } else {
                  html.classList.add('dark');
                  localStorage.setItem('vite-ui-theme', 'dark');
                }
              }}
              className="flex w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <svg className="mr-3 h-5 w-5 hidden dark:block text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg className="mr-3 h-5 w-5 block dark:hidden text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              {t.language === 'id' ? 'Ganti Tema' : 'Toggle Theme'}
            </button>

            <button
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="flex w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-rose-900/20 hover:text-rose-400 hover:border-rose-900/50"
            >
              <LogOut className="mr-3 h-5 w-5" />
              {t.signOut}
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-800 p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">{t.signOut}?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
              {t.language === 'id' ? 'Anda yakin ingin keluar?' : 'Are you sure you want to sign out?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                autoFocus
              >
                {t.cancel}
              </button>
              <Link
                href="/logout"
                method="post"
                as="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 rounded-lg bg-rose-600 py-2.5 text-sm font-medium text-white hover:bg-rose-700 dark:hover:bg-rose-500 shadow-sm transition-colors text-center"
              >
                {t.signOut}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

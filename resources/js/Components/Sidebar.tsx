import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { UserRole, Settings } from '../types';
import { LayoutDashboard, Users, BarChart3, Settings as SettingsIcon, LogOut, UserCircle, Inbox, Megaphone } from 'lucide-react';
import Can from './Can';

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
  const { url, props } = usePage<any>();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const auth = props.auth;

  // Normalize URL for comparison (remove trailing slash if present, unless it's root)
  const currentPath = url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;

  const navItems = [
    { href: '/', label: t.dashboard, icon: LayoutDashboard, roles: ['admin', 'attendance', 'teacher', 'student'] },
    { href: '/announcements', label: t.announcements, icon: Megaphone, roles: ['admin', 'attendance', 'teacher', 'student'] },
    { href: '/profile', label: t.profile, icon: UserCircle, roles: ['attendance', 'teacher', 'student'] },
    { href: '/requests', label: t.requests, icon: Inbox, roles: ['admin', 'teacher'] },
    { href: '/profiles', label: t.profiles, icon: Users, roles: ['admin'], permission: 'manage users' },
    { href: '/students', label: t.students, icon: Users, roles: ['admin', 'teacher'] },
    { href: '/reports', label: t.reports, icon: BarChart3, roles: ['admin'], permission: 'view all reports' },
    { href: '/settings', label: t.settings, icon: SettingsIcon, roles: ['admin'], permission: 'manage settings' },
  ].filter(item => item.roles.includes(userRole));

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-slate-950 text-slate-300 border-r border-slate-800 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-start gap-3 border-b border-slate-800/50 px-6">
            {settings?.companyLogo && (
              <img src={settings.companyLogo} alt={settings.companyName} className="h-8 w-8 object-contain rounded-lg border border-slate-700 bg-slate-900 p-0.5 shadow-sm" />
            )}
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent truncate flex-1 leading-none pt-1">
              {settings?.companyName || 'SmartAttend'}
            </h1>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
            {navItems.map((item) => {
              const Icon = item.icon;
              // Check if URL starts with the item href. Special case for root '/' to avoid matching everything.
              const isActive = item.href === '/'
                ? currentPath === '/'
                : currentPath.startsWith(item.href);

              return (
                <Can key={item.href} permission={item.permission}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`group relative flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 overflow-hidden ${isActive
                      ? 'bg-indigo-900/40 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                  >
                    {/* Active Indicator Line */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full transition-transform duration-300 origin-left ${isActive ? 'scale-x-100' : 'scale-x-0'}`} />

                    <Icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-all duration-300 ${isActive ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                </Can>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800/50 bg-slate-900/50 shrink-0">
            {/* User Profile Mini */}
            <div className="flex items-center gap-3 px-2 py-3 mb-4 rounded-xl border border-slate-800/50 bg-slate-900 shadow-sm overflow-hidden">
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                {auth?.user?.avatar ? (
                  <img src={auth.user.avatar} alt={auth.user.name} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-bold text-slate-200 truncate" title={auth?.user?.name || (userRole === 'admin' ? 'Administrator' : 'Profile')}>
                  {auth?.user?.name || (userRole === 'admin' ? 'Administrator' : 'Profile')}
                </span>
                <span className="text-xs text-slate-500 truncate capitalize" title={auth?.user?.role ? `${auth.user.role} Access` : `${userRole} Access`}>
                  {auth?.user?.role ? auth.user.role : `${userRole} Access`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
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
                className="flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700 hover:text-white shadow-sm"
              >
                <svg className="mr-3 h-5 w-5 hidden dark:block text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <svg className="mr-3 h-5 w-5 block dark:hidden text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                {t.language === 'id' ? 'Ganti Tema' : 'Toggle Theme'}
              </button>

              <button
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="group flex w-full items-center justify-center rounded-xl border border-rose-900/30 bg-rose-900/10 px-4 py-2.5 text-sm font-medium text-rose-400 transition-all hover:bg-rose-600 hover:text-white shadow-sm"
              >
                <LogOut className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                {t.signOut}
              </button>
            </div>
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

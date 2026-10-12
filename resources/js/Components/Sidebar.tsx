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

  // Accessible Escape key handler for modal
  React.useEffect(() => {
    if (!isLogoutConfirmOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLogoutConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogoutConfirmOpen]);

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

      <aside className={`fixed inset-y-0 left-0 z-30 w-72 transform bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-start gap-3 border-b border-slate-200/80 dark:border-slate-800/80 px-5">
            {settings?.companyLogo ? (
              <img src={settings.companyLogo} alt={settings.companyName} className="h-8 w-8 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-0.5 shadow-xs shrink-0" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-theme-primary text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                {(settings?.companyName || 'S').charAt(0)}
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug line-clamp-2" title={settings?.companyName || 'SmartAttend'}>
                {settings?.companyName || 'SmartAttend'}
              </h1>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Attendance System</span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1 custom-scrollbar">
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
                    className={`group relative flex items-center rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 overflow-hidden ${isActive
                      ? 'bg-theme-primary-light text-theme-primary-text shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    {/* Active Indicator Line */}
                    <div className={`absolute left-0 top-1.5 bottom-1.5 w-1 bg-theme-primary rounded-r-full transition-transform duration-200 origin-left ${isActive ? 'scale-x-100' : 'scale-x-0'}`} />

                    <Icon className={`mr-3 h-4 w-4 flex-shrink-0 transition-colors ${isActive ? 'text-theme-primary' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`} />
                    <span className="relative z-10 truncate">{item.label}</span>
                  </Link>
                </Can>
              );
            })}
          </nav>

          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 shrink-0 space-y-2">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                {auth?.user?.avatar ? (
                  <img src={auth.user.avatar} alt={auth.user.name} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle className="h-4 w-4 text-slate-400" />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {auth?.user?.name || (userRole === 'admin' ? 'Administrator' : 'Profile')}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate capitalize">
                  {auth?.user?.role ? auth.user.role : `${userRole} Access`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
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
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 py-1.5 px-2 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <svg className="h-3.5 w-3.5 hidden dark:block text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <svg className="h-3.5 w-3.5 block dark:hidden text-theme-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span>{t.language === 'id' ? 'Tema' : 'Theme'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 py-1.5 px-2 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all shadow-2xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{t.language === 'id' ? 'Keluar' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setIsLogoutConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-desc"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-800 p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in duration-200"
          >
            <h3 id="logout-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">{t.signOut}?</h3>
            <p id="logout-dialog-desc" className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
              {t.language === 'id' ? 'Anda yakin ingin keluar?' : 'Are you sure you want to sign out?'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
                autoFocus
              >
                {t.cancel}
              </button>
              <Link
                href="/logout"
                method="post"
                as="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 rounded-lg bg-rose-600 py-2.5 text-sm font-medium text-white hover:bg-rose-700 dark:hover:bg-rose-500 shadow-xs transition-colors text-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
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

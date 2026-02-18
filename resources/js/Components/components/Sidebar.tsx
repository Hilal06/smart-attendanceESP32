import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Page, UserRole, Settings } from '../../types';
import { LayoutDashboard, Users, BarChart3, Settings as SettingsIcon, LogOut, UserCircle, Inbox, Megaphone } from 'lucide-react';

interface SidebarProps {
  currentPage: Page;
  userRole: UserRole | null;
  onNavigate?: (page: Page) => void; // Optional now, kept for backward compat if needed
  onLogout: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  t: any;
  settings: Settings;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  userRole,
  onNavigate,
  onLogout,
  isMobileOpen,
  setIsMobileOpen,
  t,
  settings
}) => {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const { url } = usePage();

  const allNavItems = [
    { page: Page.DASHBOARD, label: t.dashboard, icon: LayoutDashboard, roles: ['admin', 'attendance'], href: '/' },
    { page: Page.ANNOUNCEMENTS, label: t.announcements, icon: Megaphone, roles: ['admin', 'attendance'], href: '/announcements' },
    { page: Page.PROFILE, label: t.profile, icon: UserCircle, roles: ['attendance'], href: '/profile' },
    { page: Page.REQUESTS, label: t.requests, icon: Inbox, roles: ['admin'], href: '/requests' },
    { page: Page.EMPLOYEES, label: t.employees, icon: Users, roles: ['admin'], href: '/employees' },
    { page: Page.REPORTS, label: t.reports, icon: BarChart3, roles: ['admin'], href: '/reports' },
    { page: Page.SETTINGS, label: t.settings, icon: SettingsIcon, roles: ['admin'], href: '/settings' },
  ];

  const allowedNavItems = allNavItems.filter(item =>
    userRole && item.roles.includes(userRole)
  );

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-center border-b border-slate-800 font-bold text-xl tracking-tight">
          {settings.companyLogo ? (
            <img src={settings.companyLogo} alt={settings.companyName} className="h-8 w-auto object-contain max-w-[80%]" />
          ) : (
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{settings.companyName || 'SmartAttend'}</span>
          )}
        </div>

        <nav className="mt-6 px-4 space-y-1">
          {allowedNavItems.map((item) => (
            <Link
              key={item.page}
              href={item.href}
              onClick={() => {
                if (window.innerWidth < 1024) setIsMobileOpen(false);
              }}
              className={`group flex items-center rounded-lg px-2 py-3 text-sm font-medium transition-all duration-200 ${currentPage === item.page
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${currentPage === item.page ? 'text-white' : 'text-slate-500 group-hover:text-white'
                }`} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-slate-800 p-4">
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="flex w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-rose-900/20 hover:text-rose-400 hover:border-rose-900/50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t.signOut}
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">{t.signOut}?</h3>
            <p className="text-slate-500 text-center text-sm mb-6">{t.language === 'id' ? 'Anda yakin ingin keluar?' : 'Are you sure you want to sign out?'}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t.cancel}
              </button>
              <Link
                href="/logout"
                method="post"
                as="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 rounded-lg bg-rose-600 py-2.5 text-sm font-medium text-white hover:bg-rose-700 shadow-sm transition-colors"
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
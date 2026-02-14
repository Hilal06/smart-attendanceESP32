import React, { useState } from 'react';
import { Page, UserRole, Settings } from '../types';
import { LayoutDashboard, Users, BarChart3, Settings as SettingsIcon, LogOut, UserCircle, Inbox, Megaphone } from 'lucide-react';

interface SidebarProps {
  currentPage: Page;
  userRole: UserRole | null;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  t: any;
  // Fix: added settings to interface to handle localization strings in confirmation dialogs
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
  // Fix: destructured settings from props
  settings
}) => {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const allNavItems = [
    { page: Page.DASHBOARD, label: t.dashboard, icon: LayoutDashboard, roles: ['admin', 'attendance'] },
    { page: Page.ANNOUNCEMENTS, label: t.announcements, icon: Megaphone, roles: ['admin', 'attendance'] },
    { page: Page.PROFILE, label: t.profile, icon: UserCircle, roles: ['attendance'] },
    { page: Page.REQUESTS, label: t.requests, icon: Inbox, roles: ['admin'] },
    { page: Page.EMPLOYEES, label: t.employees, icon: Users, roles: ['admin'] },
    { page: Page.REPORTS, label: t.reports, icon: BarChart3, roles: ['admin'] },
    { page: Page.SETTINGS, label: t.settings, icon: SettingsIcon, roles: ['admin'] },
  ];

  const filteredNavItems = allNavItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  const handleLogoutClick = () => {
    setIsLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    onLogout();
  };

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-slate-900 text-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-center border-b border-slate-800 px-4">
            {settings.companyLogo ? (
              <img src={settings.companyLogo} alt={settings.companyName} className="max-h-10 w-auto object-contain" />
            ) : (
              <h1 className="text-xl font-bold tracking-wider text-indigo-400 truncate">{settings.companyName || 'SmartAttend'}</h1>
            )}
          </div>

          <div className="px-4 py-4">
            <div className="rounded-lg bg-slate-800 p-3">
              <p className="text-xs text-slate-400 uppercase tracking-wider">{userRole === 'admin' ? t.adminPortal : t.attendanceMode}</p>
              <p className="font-medium text-white capitalize">{userRole}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => {
                    onNavigate(item.page as Page);
                    setIsMobileOpen(false);
                  }}
                  className={`flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-800 p-4">
            <button 
              onClick={handleLogoutClick}
              className="flex w-full items-center rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              {t.signOut}
            </button>
          </div>
        </div>
      </aside>

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
              <LogOut className="h-6 w-6 text-rose-600" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg font-medium leading-6 text-slate-900">{t.signOut}</h3>
              <div className="mt-2">
                <p className="text-sm text-slate-500">
                  {/* Fix: settings is now available via props */}
                  {settings.language === 'id' ? 'Apakah Anda yakin ingin keluar?' : 'Are you sure you want to sign out?'}
                </p>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-rose-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 sm:text-sm"
                onClick={confirmLogout}
              >
                {t.signOut}
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:text-sm"
                onClick={() => setIsLogoutConfirmOpen(false)}
              >
                {/* Fix: settings is now available via props */}
                {settings.language === 'id' ? 'Batal' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
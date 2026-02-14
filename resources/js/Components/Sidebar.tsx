import React from 'react';
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
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-slate-900 text-white transition-transform lg:static lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-center border-b border-slate-800 px-4">
            {settings.companyLogo ? (
              <img src={settings.companyLogo} alt={settings.companyName} className="max-h-10 w-auto" />
            ) : (
              <h1 className="text-xl font-bold text-indigo-400 truncate">{settings.companyName}</h1>
            )}
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = url === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-slate-800">
            <Link href="/logout" method="post" as="button" className="flex w-full items-center rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <LogOut className="mr-3 h-5 w-5" />
              {t.signOut}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

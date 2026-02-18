import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Settings, UserRole, Page } from '../types';
import { Menu } from 'lucide-react';
import { router } from '@inertiajs/react';

interface AppLayoutProps {
    children: React.ReactNode;
    userRole: UserRole;
    settings: Settings;
    t: any;
    title?: string;
}

// Map current route to Page enum for Sidebar highlighting
const getCurrentPage = (): Page => {
    const path = window.location.pathname;
    if (path.includes('/employees')) return Page.EMPLOYEES;
    if (path.includes('/announcements')) return Page.ANNOUNCEMENTS;
    if (path.includes('/profile')) return Page.PROFILE;
    if (path.includes('/requests')) return Page.REQUESTS;
    if (path.includes('/reports')) return Page.REPORTS;
    if (path.includes('/settings')) return Page.SETTINGS;
    return Page.DASHBOARD;
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children, userRole, settings, t, title }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const currentPage = getCurrentPage();

    const handleNavigate = (page: Page) => {
        // Navigate using Inertia
        switch (page) {
            case Page.DASHBOARD: router.visit('/'); break;
            case Page.EMPLOYEES: router.visit('/employees'); break;
            case Page.ANNOUNCEMENTS: router.visit('/announcements'); break;
            case Page.PROFILE: router.visit('/profile'); break;
            case Page.REQUESTS: router.visit('/requests'); break;
            case Page.REPORTS: router.visit('/reports'); break;
            case Page.SETTINGS: router.visit('/settings'); break;
        }
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar
                currentPage={currentPage}
                userRole={userRole}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
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
};

import React, { useState } from 'react';
import { Page, Settings as SettingsType, Employee, UserRole, Announcement, ProfileRequest } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { EmployeeList } from './components/EmployeeList';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { Announcements } from './components/Announcements';
import { Profile } from './components/Profile';
import { Requests } from './components/Requests';
import { MOCK_EMPLOYEES, MOCK_ATTENDANCE, DEFAULT_SETTINGS, MOCK_ANNOUNCEMENTS, TRANSLATIONS } from './constants';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // App State
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [requests, setRequests] = useState<ProfileRequest[]>([]);

  const t = TRANSLATIONS[settings.language];

  const handleLogin = (role: UserRole, id?: string) => {
    setUserRole(role);
    setCurrentUserId(id || null);
    setCurrentPage(Page.DASHBOARD);
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUserId(null);
    setCurrentPage(Page.DASHBOARD);
  };

  const handleAddEmployee = (newEmployee: Employee) => {
    setEmployees((prev) => [...prev, newEmployee]);
  };

  const handleEditEmployee = (updatedEmployee: Employee) => {
    setEmployees((prev) => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter(emp => emp.id !== id));
  };

  const handleAddAnnouncement = (newAnnouncement: Announcement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  const handleEditAnnouncement = (updatedAnnouncement: Announcement) => {
    setAnnouncements(prev => prev.map(a => a.id === updatedAnnouncement.id ? updatedAnnouncement : a));
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const handleProfileUpdateRequest = (description: string) => {
    if (currentUserId) {
      const newRequest: ProfileRequest = {
        id: Date.now().toString(),
        employeeId: currentUserId,
        description,
        date: new Date().toISOString(),
        status: 'Pending',
      };
      setRequests(prev => [newRequest, ...prev]);
    }
  };

  const handleResolveRequest = (id: string) => {
    setRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'Resolved' } : req));
  };

  const handleDeleteRequest = (id: string) => {
    setRequests(prev => prev.filter(req => req.id !== id));
  };

  const renderContent = () => {
    switch (currentPage) {
      case Page.DASHBOARD:
        return <Dashboard employees={employees} attendance={MOCK_ATTENDANCE} announcements={announcements} onNavigate={setCurrentPage} t={t} />;
      case Page.EMPLOYEES:
        return (
          <EmployeeList 
            employees={employees} 
            onAddEmployee={handleAddEmployee}
            onEditEmployee={handleEditEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            t={t}
          />
        );
      case Page.ANNOUNCEMENTS:
        return (
          <Announcements 
            announcements={announcements}
            userRole={userRole!}
            onAdd={handleAddAnnouncement}
            onEdit={handleEditAnnouncement}
            onDelete={handleDeleteAnnouncement}
            t={t}
          />
        );
      case Page.PROFILE:
        const currentUser = employees.find(e => e.id === currentUserId);
        return <Profile employee={currentUser} onRequestUpdate={handleProfileUpdateRequest} t={t} />;
      case Page.REQUESTS:
        return <Requests requests={requests} employees={employees} onResolve={handleResolveRequest} onDelete={handleDeleteRequest} t={t} />;
      case Page.REPORTS:
        return <Reports attendance={MOCK_ATTENDANCE} employees={employees} t={t} />;
      case Page.SETTINGS:
        return <Settings settings={settings} onSave={setSettings} t={t} />;
      default:
        return <Dashboard employees={employees} attendance={MOCK_ATTENDANCE} announcements={announcements} onNavigate={setCurrentPage} t={t} />;
    }
  };

  if (!userRole) {
    return <Login onLogin={handleLogin} t={t} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        currentPage={currentPage} 
        userRole={userRole}
        onNavigate={setCurrentPage} 
        onLogout={handleLogout}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        t={t}
        // Fix: Added settings prop to Sidebar call
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
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
import React, { useState } from 'react';
import { UserRole } from '../types';
import { UserCheck, ShieldCheck, ArrowRight, Fingerprint } from 'lucide-react';

interface LoginProps {
  onLogin: (role: UserRole, id?: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>('attendance');
  const [empId, setEmpId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'attendance') {
      if (empId.trim().length > 0) {
        onLogin('attendance', empId);
      } else {
        setError('Please enter a valid Employee ID');
      }
    } else {
      // Simple mock validation for admin
      if (username === 'admin' && password === 'admin') {
        onLogin('admin', 'ADMIN-01');
      } else {
        setError('Invalid admin credentials (try admin/admin)');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20">
            <Fingerprint className="h-8 w-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">SmartAttend</h1>
          <p className="mt-2 text-slate-400">Secure Attendance Management</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => { setActiveTab('attendance'); setError(''); }}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'attendance'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserCheck className="h-4 w-4" />
              Attendance Mode
            </div>
          </button>
          <button
            onClick={() => { setActiveTab('admin'); setError(''); }}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'admin'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Admin Portal
            </div>
          </button>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {activeTab === 'attendance' ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  placeholder="Enter your ID (e.g., 1)"
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Try ID "1" for Alice Johnson's profile.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••"
                    className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-lg bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
            >
              {activeTab === 'attendance' ? 'Enter Dashboard' : 'Login as Admin'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
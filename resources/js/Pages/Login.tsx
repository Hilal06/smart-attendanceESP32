import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { UserRole, Settings } from '../types';
import { TRANSLATIONS } from '../constants';
import { UserCheck, ShieldCheck, ArrowRight, Fingerprint, Loader2 } from 'lucide-react';

interface LoginProps {
  settings: Settings;
  status?: string;
  canResetPassword?: boolean;
}

export default function Login({ settings, status, canResetPassword }: LoginProps) {
  // Fallback to 'en' if settings or language is missing (e.g. initial load error)
  const t = settings ? TRANSLATIONS[settings.language] : TRANSLATIONS['en'];

  const [activeTab, setActiveTab] = useState<UserRole>('attendance');

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    role: 'attendance',
    id: '',         // For attendance login
    email: '',      // For admin login
    password: '',   // For admin login
    remember: false,
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (activeTab === 'attendance' && !data.id.trim()) {
      // We can set manual error if needed, or rely on backend validation
      // But for better UX, let's let backend handle validation or do simple check
    }

    // transform role to activeTab before submit
    data.role = activeTab;

    post('/login', {
      onFinish: () => reset('password'),
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200 p-4">
      <Head title="Login" />
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-transparent dark:border-slate-800 transition-colors duration-200">
        <div className="bg-slate-900 dark:bg-slate-950 p-8 text-center rounded-t-2xl transition-colors duration-200">
          {settings?.companyLogo ? (
            <div className="mx-auto mb-6 flex h-24 w-auto max-w-[200px] items-center justify-center p-2 bg-white rounded-xl shadow-lg">
              <img src={settings.companyLogo} alt={settings.companyName || 'Company Logo'} className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-xl bg-white shadow-lg p-2">
              <Fingerprint className="h-10 w-10 text-indigo-600" />
            </div>
          )}

          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            {settings?.companyName || 'SmartAttend'}
          </h1>
          <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">Secure Attendance Portal</p>
        </div>

        <div className="flex border-b border-slate-100">
          <button
            onClick={() => { setActiveTab('attendance'); clearErrors(); setData('role', 'attendance'); }}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'attendance'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserCheck className="h-4 w-4" />
              {t.attendanceMode}
            </div>
          </button>
          <button
            onClick={() => { setActiveTab('admin'); clearErrors(); setData('role', 'admin'); }}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'admin'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {t.adminPortal}
            </div>
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {activeTab === 'attendance' ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={data.id}
                  onChange={(e) => setData('id', e.target.value)}
                  placeholder="Enter your ID (e.g., 123456)"
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Use your 6-digit Employee ID.
                </p>
                {errors.id && <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.id}</div>}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="admin@smartattend.com"
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                  {errors.email && <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.email}</div>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <input
                    type="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="•••••"
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                  {errors.password && <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.password}</div>}
                </div>
              </div>
            )}

            {errors.role && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400">
                {errors.role}
              </div>
            )}

            {status && (
              <div className="mb-4 font-medium text-sm text-green-600">
                {status}
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="flex w-full items-center justify-center rounded-lg bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {processing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              {activeTab === 'attendance' ? t.enterDashboard : t.loginAsAdmin}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

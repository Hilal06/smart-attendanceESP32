import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { UserRole, Settings } from '../types';
import { TRANSLATIONS } from '../constants';
import { UserCheck, ShieldCheck, ArrowRight, Fingerprint, Loader2, Hash, Mail, Lock, Sun, Moon } from 'lucide-react';

interface LoginProps {
  settings: Settings;
  status?: string;
  canResetPassword?: boolean;
}

export default function Login({ settings, status, canResetPassword }: LoginProps) {
  // Fallback to 'en' if settings or language is missing (e.g. initial load error)
  const t = settings ? TRANSLATIONS[settings.language] : TRANSLATIONS['en'];

  const [activeTab, setActiveTab] = useState<UserRole>('attendance');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial theme state on mount
    const isDark = document.documentElement.classList.contains('dark') ||
      localStorage.getItem('vite-ui-theme') === 'dark';
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('vite-ui-theme', 'light');
      setIsDarkMode(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('vite-ui-theme', 'dark');
      setIsDarkMode(true);
    }
  };

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
    <div className="relative flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950 transition-colors duration-200 p-4 overflow-hidden">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 shadow-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-110 active:scale-95"
        aria-label="Toggle Dark Mode"
      >
        {isDarkMode ? (
          <Sun className="h-5 w-5 text-amber-400" />
        ) : (
          <Moon className="h-5 w-5 text-indigo-500" />
        )}
      </button>

      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/30 dark:bg-indigo-600/20 rounded-full blur-[120px] opacity-80 dark:opacity-50 mix-blend-multiply dark:mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-cyan-500/30 dark:bg-cyan-500/10 rounded-full blur-[100px] opacity-80 dark:opacity-50 mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute left-0 bottom-0 w-[600px] h-[600px] bg-violet-500/30 dark:bg-violet-600/10 rounded-full blur-[120px] opacity-80 dark:opacity-50 mix-blend-multiply dark:mix-blend-screen"></div>
      </div>

      <Head title="Login" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-2xl border border-slate-200/80 dark:border-slate-800/60 transition-all duration-300">
        <div className="p-8 text-center pb-6">
          {settings?.companyLogo ? (
            <div className="mx-auto mb-6 flex h-24 w-auto max-w-[200px] items-center justify-center p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 dark:border-slate-700/50">
              <img src={settings.companyLogo} alt={settings.companyName || 'Company Logo'} className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30 p-2">
              <Fingerprint className="h-10 w-10 text-white" />
            </div>
          )}

          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2 tracking-tight">
            {settings?.companyName || 'SmartAttend'}
          </h1>
          <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">Secure Attendance Portal</p>
        </div>

        {/* Modern Segmented Control */}
        <div className="px-8 pb-4">
          <div className="relative flex rounded-xl bg-slate-200/80 dark:bg-slate-950/50 p-1 backdrop-blur-sm border border-slate-300/50 dark:border-slate-800/50">
            {/* Sliding Highlight Pill */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white dark:bg-slate-800 shadow-sm transition-transform duration-300 ease-spring ${activeTab === 'attendance' ? 'translate-x-0' : 'translate-x-full border border-slate-700/50 dark:border-slate-700'}`}
              style={{ left: activeTab === 'attendance' ? '4px' : '0px' }} // Account for padding
            />

            <button
              onClick={() => { setActiveTab('attendance'); clearErrors(); setData('role', 'attendance'); }}
              className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors duration-300 ${activeTab === 'attendance'
                ? 'text-indigo-600 dark:text-indigo-400'
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
              className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors duration-300 ${activeTab === 'admin'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                {t.adminPortal}
              </div>
            </button>
          </div>
        </div>

        <div className="px-8 pb-8 pt-4">
          <form onSubmit={handleLogin} className="space-y-5">
            {activeTab === 'attendance' ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Employee ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={data.id}
                    onChange={(e) => setData('id', e.target.value)}
                    placeholder="Enter your ID (e.g., 123456)"
                    className="block w-full pl-10 rounded-xl border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-950/50 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                  />
                </div>
                {errors.id ? (
                  <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.id}</div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Use your 6-digit Employee ID.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      placeholder="admin@smartattend.com"
                      className="block w-full pl-10 rounded-xl border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-950/50 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                    />
                  </div>
                  {errors.email && <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.email}</div>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={data.password}
                      onChange={(e) => setData('password', e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 rounded-xl border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-950/50 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                    />
                  </div>
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
              className="group relative flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 p-0.5 font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-50 mt-8"
            >
              <div className="flex w-full items-center justify-center rounded-[10px] bg-slate-900/0 py-3 transition-colors group-hover:bg-slate-900/10">
                {processing ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
                {activeTab === 'attendance' ? t.enterDashboard : t.loginAsAdmin}
                <ArrowRight className={`ml-2 h-5 w-5 transition-transform ${processing ? '' : 'group-hover:translate-x-1'}`} />
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

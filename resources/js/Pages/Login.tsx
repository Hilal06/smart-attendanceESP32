import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Settings } from '../types';
import { TRANSLATIONS } from '../constants';
import { ArrowRight, Fingerprint, Loader2, Mail, Lock, Sun, Moon, UserCircle } from 'lucide-react';

interface LoginProps {
  settings: Settings;
  status?: string;
  canResetPassword?: boolean;
}

export default function Login({ settings, status, canResetPassword }: LoginProps) {
  const t = settings ? TRANSLATIONS[settings.language] : TRANSLATIONS['en'];

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
    email: '',
    password: '',
    role: 'student',
    remember: false,
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

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
          <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">Secure Portal</p>
        </div>

        <div className="px-8 pb-8 pt-4">
          <form onSubmit={handleLogin} className="space-y-5">
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
                    placeholder="user@smartattend.com"
                    className="block w-full pl-10 rounded-xl border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-950/50 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                    required
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
                    required
                  />
                </div>
                {errors.password && <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.password}</div>}
              </div>

              {/* Role Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Account Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircle className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    value={data.role}
                    onChange={(e) => setData('role', e.target.value)}
                    className="block w-full appearance-none pl-10 rounded-xl border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-950/50 p-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                    required
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="super_admin">Administrator</option>
                  </select>
                </div>
                {errors.role && <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.role}</div>}
              </div>
            </div>

            {status && (
              <div className="mb-4 font-medium text-sm text-emerald-600">
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
                Welcome Back
                <ArrowRight className={`ml-2 h-5 w-5 transition-transform ${processing ? '' : 'group-hover:translate-x-1'}`} />
              </div>
            </button>

            <div className="text-center mt-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                New to the platform?{' '}
                <Link href="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Create an account
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

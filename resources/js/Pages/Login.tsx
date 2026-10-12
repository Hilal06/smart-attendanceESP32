import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Settings } from '../types';
import { TRANSLATIONS } from '../constants';
import { 
  ArrowRight, 
  Loader2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CreditCard, 
  Camera, 
  Scan, 
  CheckCircle2, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Zap, 
  Radio 
} from 'lucide-react';

interface LoginProps {
  settings: Settings;
  status?: string;
  canResetPassword?: boolean;
}

export default function Login({ settings, status, canResetPassword }: LoginProps) {
  const t = settings ? TRANSLATIONS[settings?.language] : TRANSLATIONS['en'];

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [simulatedScanMode, setSimulatedScanMode] = useState<'rfid' | 'face'>('rfid');
  const [scanSuccess, setScanSuccess] = useState(false);

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

  const simulateBiometricScan = (targetRole: string, email: string) => {
    setScanSuccess(true);
    setData('role', targetRole);
    setData('email', email);
    setData('password', 'password');

    setTimeout(() => {
      setScanSuccess(false);
    }, 2500);
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 flex items-center justify-center transition-colors">
      <Head title="Login Portal - SmartAttend" />

      {/* Top Floating Controls */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-theme-primary"
          aria-label="Toggle Mode"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-theme-primary" />
          )}
        </button>
      </div>

      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT: Cyber-Physical Biometric Chamber Visualizer (5 Cols) */}
                <div className="lg:col-span-5 bg-slate-50/80 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 relative">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-5">
                      <Scan className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <div>
                        <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Biometric Terminal
                        </h2>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          ESP32 + OpenCV AI
                        </p>
                      </div>
                    </div>

                    {/* Mode Switcher: RFID vs Face AI */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-theme-primary/20 dark:border-theme-primary/20 mb-6 transition-colors">
                      <button
                        type="button"
                        onClick={() => setSimulatedScanMode('rfid')}
                        className={`flex items-center justify-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                          simulatedScanMode === 'rfid'
                            ? 'bg-white dark:bg-slate-800 text-theme-primary border border-theme-primary/30 dark:border-theme-primary/30 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        <CreditCard className="h-3.5 w-3.5 shrink-0" />
                        <span>Kartu RFID</span>
                        {simulatedScanMode === 'rfid' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-theme-primary animate-pulse" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimulatedScanMode('face')}
                        className={`flex items-center justify-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                          simulatedScanMode === 'face'
                            ? 'bg-white dark:bg-slate-800 text-theme-primary border border-theme-primary/30 dark:border-theme-primary/30 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        <Camera className="h-3.5 w-3.5 shrink-0" />
                        <span>Face AI</span>
                        {simulatedScanMode === 'face' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-theme-primary animate-pulse" />
                        )}
                      </button>
                    </div>

                    {/* Interactive Visualizer Canvas */}
                    <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 relative overflow-hidden flex flex-col items-center justify-center min-h-[220px] shadow-xs">
                      {simulatedScanMode === 'rfid' ? (
                        /* RFID Card Mockup */
                        <div className="w-full flex flex-col items-center">
                          <div className={`w-48 h-28 rounded-xl p-3.5 flex flex-col justify-between border transition-all ${
                            scanSuccess
                              ? 'bg-white dark:bg-slate-850 border-theme-primary shadow-sm ring-1 ring-theme-primary/30'
                              : 'bg-slate-50 dark:bg-slate-850/80 border-slate-200 dark:border-slate-700'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="h-4 w-6 rounded-xs bg-amber-400/80 border border-amber-300"></div>
                              <Radio className="h-4 w-4 text-theme-primary animate-pulse" />
                            </div>
                            <div>
                              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">SMARTATTEND PASS</p>
                              <p className="text-xs font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                                {scanSuccess ? 'UID: 84:B2:7A:1F' : 'TEMPELKAN KARTU'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => simulateBiometricScan('student', 'student1@smartattend.com')}
                            className="mt-4 flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-900 dark:bg-theme-primary hover:bg-slate-800 dark:hover:bg-theme-primary-hover text-xs font-bold text-white transition-all shadow-xs"
                          >
                            <Zap className="h-3.5 w-3.5" />
                            <span>Uji Tempel Kartu Siswa</span>
                          </button>
                        </div>
                      ) : (
                        /* Face AI Camera Frame Mockup */
                        <div className="w-full flex flex-col items-center">
                          <div className={`w-48 h-32 rounded-xl border relative flex items-center justify-center transition-all ${
                            scanSuccess
                              ? 'bg-white dark:bg-slate-850 border-theme-primary'
                              : 'bg-slate-50 dark:bg-slate-850/80 border-slate-200 dark:border-slate-700'
                          }`}>
                            {/* Bounding box brackets */}
                            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-theme-primary"></div>
                            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-theme-primary"></div>
                            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-theme-primary"></div>
                            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-theme-primary"></div>

                            <div className="text-center">
                              <Camera className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-1" />
                              <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                                {scanSuccess ? 'Confidence: 99.4%' : 'Deteksi Wajah Aktif'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => simulateBiometricScan('teacher', 'teacher1@smartattend.com')}
                            className="mt-4 flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-900 dark:bg-theme-primary hover:bg-slate-800 dark:hover:bg-theme-primary-hover text-xs font-bold text-white transition-all shadow-xs"
                          >
                            <Zap className="h-3.5 w-3.5" />
                            <span>Uji Deteksi Wajah Guru</span>
                          </button>
                        </div>
                      )}

                      {scanSuccess && (
                        <div className="absolute inset-0 bg-white/95 dark:bg-slate-950/95 border-2 border-theme-primary flex flex-col items-center justify-center p-4 text-center animate-in fade-in">
                          <CheckCircle2 className="h-8 w-8 text-theme-primary mb-1" />
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Biometrik Teridentifikasi!</p>
                          <p className="text-xs text-theme-primary">Kredensial berhasil disinkronkan ke form</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 pt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-theme-primary" />
                    <span>Sistem Otentikasi Fisik & Digital Terpadu</span>
                  </div>
                </div>

        {/* RIGHT: High-Precision Credentials Form (7 Cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Masuk Gateway Akun
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Gunakan kredensial akun untuk login langsung ke antarmuka web
              </p>
            </div>

            {/* Role Radio Pills */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Pilih Hak Akses
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'student', label: 'Siswa' },
                  { id: 'teacher', label: 'Guru' },
                  { id: 'super_admin', label: 'Admin' },
                ].map((role) => {
                  const isSelected = data.role === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setData('role', role.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="bio-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Terdaftar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="bio-email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="user@smartattend.com"
                    className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-theme-primary focus:ring-2 focus:ring-theme-primary focus:outline-hidden transition-all shadow-2xs"
                    required
                  />
                </div>
                {errors.email && (
                  <p role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="bio-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kata Sandi
                  </label>
                  {canResetPassword && (
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-theme-primary hover:underline"
                    >
                      Lupa sandi?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="bio-password"
                    type={showPassword ? 'text' : 'password'}
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-theme-primary focus:ring-2 focus:ring-theme-primary focus:outline-hidden transition-all shadow-2xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  id="bio-remember"
                  type="checkbox"
                  checked={data.remember}
                  onChange={(e) => setData('remember', e.target.checked)}
                  className="h-4 w-4 rounded-md border-slate-300 text-theme-primary focus:ring-theme-primary"
                />
                <label htmlFor="bio-remember" className="ml-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Ingat sesi pada terminal ini
                </label>
              </div>

              {status && (
                <div role="status" className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {status}
                </div>
              )}

              <button
                type="submit"
                disabled={processing}
                className="flex w-full items-center justify-center rounded-xl bg-theme-primary hover:bg-theme-primary-hover active:scale-[0.99] py-3 px-4 font-semibold text-sm text-white transition-all disabled:opacity-50 mt-5 shadow-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-theme-primary"
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Buka Dashboard</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Belum memiliki akun terdaftar?{' '}
              <Link href="/register" className="font-semibold text-theme-primary hover:underline">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

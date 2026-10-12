import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Settings } from '../types';
import { TRANSLATIONS } from '../constants';
import { UserPlus, ArrowRight, Fingerprint, Loader2, Sun, Moon } from 'lucide-react';
import zxcvbn from 'zxcvbn';
import { RoleSelector } from '../Components/Register/RoleSelector';
import { RegisterFormFields } from '../Components/Register/RegisterFormFields';

const PasswordStrengthInput = React.lazy(() => import('../Components/Register/PasswordStrengthInput').then(module => ({ default: module.PasswordStrengthInput })));

interface RegisterProps {
    settings: Settings;
}

export default function Register({ settings }: RegisterProps) {
    const t = settings ? TRANSLATIONS[settings?.language] : TRANSLATIONS['en'];

    const [isDarkMode, setIsDarkMode] = useState(false);

    // Live validation states
    const [passwordScore, setPasswordScore] = useState(0);
    const [passwordFeedback, setPasswordFeedback] = useState('');
    const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
    const [isFormValid, setIsFormValid] = useState(false);

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
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'student', // default
        department: '',
        phone_number: '',
        address: '',
        institutional_id: '',
        class: '',
        age: '',
    });

    // Real-time password validation
    useEffect(() => {
        if (data.password) {
            const result = zxcvbn(data.password);
            setPasswordScore(result.score);
            setPasswordFeedback(result.feedback.warning || result.feedback.suggestions[0] || '');
        } else {
            setPasswordScore(0);
            setPasswordFeedback('');
        }

        if (data.password_confirmation) {
            setPasswordsMatch(data.password === data.password_confirmation);
        } else {
            setPasswordsMatch(null);
        }

        // Auto-format Institutional ID
        if (data.institutional_id) {
            setData('institutional_id', data.institutional_id.toUpperCase().trim());
        }

        // Basic form validity check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setIsFormValid(
            data.name.length > 0 &&
            emailRegex.test(data.email) &&
            data.password.length >= 8 &&
            data.password === data.password_confirmation &&
            (data.role === 'student' || data.role === 'teacher')
        );
    }, [data.password, data.password_confirmation, data.name, data.email, data.role]);

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const getPasswordColor = () => {
        switch (passwordScore) {
            case 0:
            case 1: return 'bg-rose-500';
            case 2: return 'bg-amber-500';
            case 3: return 'bg-lime-500';
            case 4: return 'bg-emerald-500';
            default: return 'bg-slate-200 dark:bg-slate-700';
        }
    };

    const getPasswordLabel = () => {
        switch (passwordScore) {
            case 0:
            case 1: return 'Weak';
            case 2: return 'Fair';
            case 3: return 'Good';
            case 4: return 'Strong';
            default: return 'Password Strength';
        }
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
                    <Moon className="h-5 w-5 text-theme-primary" />
                )}
            </button>

            {/* Subtle Ambient Background */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200/40 via-slate-100 to-slate-100 dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950" />

            <Head title="Register" />

            <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 transition-colors">
                <div className="p-8 text-center pb-6">
                    {settings?.companyLogo ? (
                        <div className="mx-auto mb-5 flex h-20 w-auto max-w-[180px] items-center justify-center p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                            <img src={settings?.companyLogo} alt={settings?.companyName || 'Company Logo'} className="h-full w-full object-contain" />
                        </div>
                    ) : (
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-theme-primary text-white shadow-xs">
                            <Fingerprint className="h-8 w-8 text-white" />
                        </div>
                    )}

                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
                        Create an Account
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">
                        Join the {settings?.companyName || 'SmartAttend'} platform
                    </p>
                </div>

                <div className="px-8 pb-8">
                    <form onSubmit={handleRegister} className="space-y-5">

                        {/* Role Selection */}
                        <RoleSelector role={data.role} setData={setData} error={errors.role} />

                        <RegisterFormFields data={data} setData={setData} errors={errors} />

                        {/* Passwords */}
                        <React.Suspense fallback={
                            <div className="md:col-span-2 p-4 text-center text-slate-500">
                                <Loader2 className="animate-spin inline mr-2 h-4 w-4" />
                                Loading secure password input...
                            </div>
                        }>
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                                <PasswordStrengthInput
                                    data={data}
                                    setData={setData}
                                    errors={errors}
                                    passwordScore={passwordScore}
                                    passwordFeedback={passwordFeedback}
                                    passwordsMatch={passwordsMatch}
                                    getPasswordLabel={getPasswordLabel}
                                    getPasswordColor={getPasswordColor}
                                />
                            </div>
                        </React.Suspense>

                        <button
                            type="submit"
                            disabled={processing || !isFormValid}
                            className={`flex w-full items-center justify-center rounded-xl py-3 px-4 font-semibold text-sm transition-colors mt-6 shadow-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 ${isFormValid
                                ? 'bg-theme-primary hover:bg-theme-primary-hover active:bg-theme-primary-hover text-white cursor-pointer'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                }`}
                        >
                            {processing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Daftarkan Akun
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </button>

                        <div className="text-center mt-6">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Already have an account?{' '}
                                <Link href="/login" className="font-semibold text-theme-primary hover:underline">
                                    Sign in here
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

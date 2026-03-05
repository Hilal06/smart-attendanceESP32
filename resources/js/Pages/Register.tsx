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
                    <Moon className="h-5 w-5 text-indigo-500" />
                )}
            </button>

            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute right-1/4 top-1/4 w-[600px] h-[600px] bg-emerald-500/30 dark:bg-emerald-600/20 rounded-full blur-[120px] opacity-80 dark:opacity-50 mix-blend-multiply dark:mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute left-1/4 bottom-1/4 w-[500px] h-[500px] bg-cyan-500/30 dark:bg-cyan-500/10 rounded-full blur-[100px] opacity-80 dark:opacity-50 mix-blend-multiply dark:mix-blend-screen"></div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-500/20 dark:bg-indigo-600/10 rounded-full blur-[120px] opacity-80 dark:opacity-50 mix-blend-multiply dark:mix-blend-screen"></div>
            </div>

            <Head title="Register" />

            <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-2xl border border-slate-200/80 dark:border-slate-800/60 transition-all duration-300">
                <div className="p-8 text-center pb-6">
                    {settings?.companyLogo ? (
                        <div className="mx-auto mb-6 flex h-24 w-auto max-w-[200px] items-center justify-center p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 dark:border-slate-700/50">
                            <img src={settings?.companyLogo} alt={settings?.companyName || 'Company Logo'} className="h-full w-full object-contain" />
                        </div>
                    ) : (
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/30 p-2">
                            <Fingerprint className="h-10 w-10 text-white" />
                        </div>
                    )}

                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2 tracking-tight">
                        Create an Account
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">
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
                            className={`group relative flex w-full items-center justify-center rounded-xl p-0.5 font-bold text-white transition-all mt-8 ${isFormValid
                                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            <div className={`flex w-full items-center justify-center rounded-[10px] py-3 transition-colors ${isFormValid ? 'bg-slate-900/0 group-hover:bg-slate-900/10' : 'bg-transparent'}`}>
                                {processing ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <UserPlus className="mr-2 h-5 w-5" />}
                                Register Account
                                <ArrowRight className={`ml-2 h-5 w-5 transition-transform ${processing || !isFormValid ? '' : 'group-hover:translate-x-1'}`} />
                            </div>
                        </button>

                        <div className="text-center mt-6">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Already have an account?{' '}
                                <Link href="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
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

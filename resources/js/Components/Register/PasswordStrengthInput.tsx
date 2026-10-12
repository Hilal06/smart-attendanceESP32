import React from 'react';
import { Lock, CheckCircle2, XCircle } from 'lucide-react';

interface PasswordStrengthInputProps {
    data: any;
    setData: (field: string, value: any) => void;
    errors: Record<string, string>;
    passwordScore: number;
    passwordFeedback: string;
    passwordsMatch: boolean | null;
    getPasswordLabel: () => string;
    getPasswordColor: () => string;
}

export const PasswordStrengthInput: React.FC<PasswordStrengthInputProps> = ({
    data,
    setData,
    errors,
    passwordScore,
    passwordFeedback,
    passwordsMatch,
    getPasswordLabel,
    getPasswordColor,
}) => {
    return (
        <>
            {/* Password */}
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
                        className={`block w-full pl-10 pr-10 rounded-xl border p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${data.password && passwordScore < 2
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/30 dark:bg-rose-900/10'
                            : data.password && passwordScore >= 2
                                ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-900/10'
                                : 'border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-950/50 focus:border-theme-primary focus:ring-theme-primary/20'
                            }`}
                        required
                    />
                    {data.password && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            {passwordScore >= 2 ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                                <XCircle className="h-5 w-5 text-rose-500" />
                            )}
                        </div>
                    )}
                </div>

                {/* Password Strength UI */}
                {data.password && (
                    <div className="mt-2 text-xs animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-600 dark:text-slate-400">
                                {getPasswordLabel()}
                            </span>
                        </div>
                        <div className="flex gap-1 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-full flex-1 transition-all duration-300 ${i <= passwordScore && passwordScore > 0 ? getPasswordColor() : 'bg-transparent'}`}
                                />
                            ))}
                        </div>
                        {passwordFeedback && (
                            <p className="mt-1 text-slate-500 dark:text-slate-400">{passwordFeedback}</p>
                        )}
                        {data.password.length > 0 && data.password.length < 8 && (
                            <p className="mt-1 text-rose-500">Password must be at least 8 characters.</p>
                        )}
                    </div>
                )}
                {errors.password && <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.password}</div>}
            </div>

            {/* Confirm Password */}
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Confirm Password
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder="••••••••"
                        className={`block w-full pl-10 pr-10 rounded-xl border p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${passwordsMatch === false
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/30 dark:bg-rose-900/10'
                            : passwordsMatch === true
                                ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-900/10'
                                : 'border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-950/50 focus:border-theme-primary focus:ring-theme-primary/20'
                            }`}
                        required
                    />
                    {data.password_confirmation && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            {passwordsMatch ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                                <XCircle className="h-5 w-5 text-rose-500" />
                            )}
                        </div>
                    )}
                </div>
                {passwordsMatch === false && (
                    <p className="mt-2 text-xs text-rose-500 animate-in fade-in">Passwords do not match.</p>
                )}
            </div>
        </>
    );
};

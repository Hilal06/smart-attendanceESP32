import React from 'react';
import { User, Briefcase } from 'lucide-react';

interface RoleSelectorProps {
    role: string;
    setData: (field: string, value: any) => void;
    error?: string;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ role, setData, error }) => {
    return (
        <>
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button
                    type="button"
                    onClick={() => setData('role', 'student')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${role === 'student'
                        ? 'border-theme-primary bg-theme-primary-light text-theme-primary-text shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-500 hover:border-theme-primary/40'
                        }`}
                >
                    <User className="h-6 w-6 mb-2" />
                    <span className="text-sm font-bold">Student</span>
                </button>

                <button
                    type="button"
                    onClick={() => setData('role', 'teacher')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${role === 'teacher'
                        ? 'border-theme-primary bg-theme-primary-light text-theme-primary-text shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-500 hover:border-theme-primary/40'
                        }`}
                >
                    <Briefcase className="h-6 w-6 mb-2" />
                    <span className="text-sm font-bold">Teacher</span>
                </button>
            </div>
            {error && <div className="text-sm text-rose-600 dark:text-rose-400">{error}</div>}
        </>
    );
};

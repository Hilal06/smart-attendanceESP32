import React, { useState } from 'react';
import { Shield, Smartphone, Lock, AlertCircle, Save, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Transition } from '@headlessui/react';

interface SecurityOptionsProps {
    adminForm: any;
    handleAdminSubmit: (e: React.FormEvent) => void;
    adminSaved: boolean;
    showAdminConfirm: boolean;
    setShowAdminConfirm: React.Dispatch<React.SetStateAction<boolean>>;
    confirmAdminSubmit: () => void;
    t: any;
}

export const SecurityOptions: React.FC<SecurityOptionsProps> = ({ adminForm, handleAdminSubmit, adminSaved, showAdminConfirm, setShowAdminConfirm, confirmAdminSubmit, t }) => {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);

    return (
        <>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl">
                <form onSubmit={handleAdminSubmit} className="space-y-6">
                    <div className="rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 shadow-sm border border-white/20 dark:border-slate-700/50 transition-colors duration-300">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-2 text-indigo-600 dark:text-indigo-400">
                                <Shield className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.adminCredentials || 'Admin Credentials'}</h3>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t.name || 'Name'}</label>
                                    <input
                                        type="text"
                                        value={adminForm.data.name}
                                        onChange={e => adminForm.setData('name', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    {adminForm.errors.name && <p className="mt-1 text-xs text-rose-500">{adminForm.errors.name}</p>}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t.email || 'Email'}</label>
                                    <input
                                        type="email"
                                        value={adminForm.data.email}
                                        onChange={e => adminForm.setData('email', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    {adminForm.errors.email && <p className="mt-1 text-xs text-rose-500">{adminForm.errors.email}</p>}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t.currentPassword || 'Current Password'}</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={adminForm.data.current_password}
                                            onChange={e => adminForm.setData('current_password', e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 pl-4 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-500 focus:outline-none"
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {adminForm.errors.current_password && <p className="mt-1 text-xs text-rose-500">{adminForm.errors.current_password}</p>}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t.newPassword || 'New Password'} <span className="text-xs text-slate-500 font-normal">{t.leaveBlankKeepCurrent || '(leave blank to keep current)'}</span></label>
                                    <input
                                        type="password"
                                        value={adminForm.data.new_password}
                                        onChange={e => adminForm.setData('new_password', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    {adminForm.errors.new_password && <p className="mt-1 text-xs text-rose-500">{adminForm.errors.new_password}</p>}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t.confirmNewPassword || 'Confirm New Password'}</label>
                                    <input
                                        type="password"
                                        value={adminForm.data.new_password_confirmation}
                                        onChange={e => adminForm.setData('new_password_confirmation', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-4">
                            <Transition
                                show={adminSaved}
                                enter="transition ease-in-out duration-300 transform"
                                enterFrom="opacity-0 translate-y-2"
                                enterTo="opacity-100 translate-y-0"
                                leave="transition ease-in-out duration-300 transform"
                                leaveFrom="opacity-100 translate-y-0"
                                leaveTo="opacity-0 translate-y-2"
                            >
                                <div className="flex items-center text-sm text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                    {t.credentialsUpdated || 'Credentials updated'}
                                </div>
                            </Transition>
                            <button
                                type="submit"
                                disabled={adminForm.processing}
                                className="flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                            >
                                {adminForm.processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {t.updateCredentials || 'Update Credentials'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* 2FA Stub */}
                <div className="rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 shadow-sm border border-white/20 dark:border-slate-700/50 transition-colors duration-300">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-2 text-indigo-600 dark:text-indigo-400">
                                <Smartphone className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.twoFactorAuth || 'Two-Factor Authentication'}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.twoFactorDesc || 'Add an extra layer of security to your admin account.'}</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {t.comingSoon || 'Coming Soon'}
                        </span>
                    </div>
                    <div className="opacity-50 pointer-events-none">
                        <button type="button" className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors">
                            <Lock className="mr-2 h-4 w-4" />
                            {t.setup2FA || 'Setup 2FA'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Admin Confirmation Modal */}
            {showAdminConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md transition-all duration-300">
                    <div className="w-full max-w-md rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 transition-colors">
                        {/* Sticky Header */}
                        <div className="flex items-center gap-3 border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-5 shrink-0 bg-white/50 dark:bg-slate-900/50 rounded-t-2xl z-10 transition-colors">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-sm ring-2 ring-white/50 dark:ring-slate-800/50">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">{t.confirmUpdate || 'Confirm Update'}</h3>
                        </div>

                        {/* Scrollable Body */}
                        <div className="p-6 overflow-y-auto flex-1 font-medium">
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {t.confirmUpdateDesc || 'Are you sure you want to update the admin credentials? You will need to use the new credentials on your next login.'}
                            </p>
                        </div>

                        {/* Sticky Footer */}
                        <div className="border-t border-slate-200/50 dark:border-slate-800/50 p-6 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl z-10 flex justify-end gap-3 transition-colors">
                            <button
                                type="button"
                                onClick={() => setShowAdminConfirm(false)}
                                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                            >
                                {t.cancel || 'Cancel'}
                            </button>
                            <button
                                type="button"
                                onClick={confirmAdminSubmit}
                                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 shadow-sm"
                            >
                                {t.yesUpdate || 'Yes, update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

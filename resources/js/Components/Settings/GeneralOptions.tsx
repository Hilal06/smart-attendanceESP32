import React, { useRef, useState } from 'react';
import { Settings as SettingsType } from '../../types';
import { Globe, ImageIcon, Upload, Trash2, Clock, AlertCircle } from 'lucide-react';

interface GeneralOptionsProps {
    formData: SettingsType;
    errors: Record<string, string>;
    t: any;
    handleGeneralChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    setFormData: React.Dispatch<React.SetStateAction<SettingsType>>;
}

export const GeneralOptions: React.FC<GeneralOptionsProps> = ({ formData, errors, t, handleGeneralChange, setFormData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDraggingLogo, setIsDraggingLogo] = useState(false);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("File is too large. Max size 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, companyLogo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setFormData(prev => ({ ...prev, companyLogo: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleLogoDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingLogo(true);
    };

    const handleLogoDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingLogo(false);
    };

    const handleLogoDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingLogo(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("File is too large. Max size 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, companyLogo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-3xl rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 shadow-sm border border-white/20 dark:border-slate-700/50 transition-colors duration-300">
            <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-2 text-indigo-600 dark:text-indigo-400">
                    <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.generalSettings || 'General Settings'}</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="mb-2 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                        <Globe className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        {t.companyName || 'Company Name'}
                    </label>
                    <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleGeneralChange}
                        className={`w-full rounded-lg border bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.companyName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                            }`}
                    />
                    {errors.companyName && <p className="mt-1 text-xs text-rose-500">{errors.companyName}</p>}
                </div>

                <div>
                    <label className="mb-2 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                        <Globe className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        {t.language || 'Language'}
                    </label>
                    <select
                        name="language"
                        id="language"
                        value={formData.language}
                        onChange={handleGeneralChange}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="en">English (US)</option>
                        <option value="id">Bahasa Indonesia</option>
                    </select>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="mb-3 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                        {/* Check if ImageIcon is available in local scope, otherwise define import - it's available */}
                        <ImageIcon className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        {t.companyLogo || 'Company Logo'}
                    </label>
                    <div
                        className={`flex flex-col sm:flex-row sm:items-center gap-6 p-4 rounded-xl border-2 border-dashed transition-colors duration-200 ${isDraggingLogo
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                        onDragOver={handleLogoDragOver}
                        onDragLeave={handleLogoDragLeave}
                        onDrop={handleLogoDrop}
                    >
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-colors">
                            {formData.companyLogo ? (
                                <img src={formData.companyLogo} alt="Logo" className="h-full w-full object-contain p-1" />
                            ) : (
                                <ImageIcon className="h-8 w-8 text-slate-300 dark:text-slate-500" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleLogoChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {t.uploadLogo || 'Upload Logo'}
                                </button>
                                {formData.companyLogo && (
                                    <button
                                        type="button"
                                        onClick={removeLogo}
                                        className="flex items-center rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/30 px-3 py-1.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {t.removeLogo || 'Remove'}
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t.recommendedSize || 'Recommended size: 200x50px. Max 2MB.'}</p>
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label htmlFor="lateThresholdMinutes" className="mb-2 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                        <Clock className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        {t.lateThreshold || 'Late Threshold (Minutes)'}
                    </label>
                    <input
                        type="number"
                        name="lateThresholdMinutes"
                        id="lateThresholdMinutes"
                        value={formData.lateThresholdMinutes}
                        onChange={handleGeneralChange}
                        className={`w-full rounded-lg border bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.lateThresholdMinutes ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                            }`}
                    />
                    {errors.lateThresholdMinutes ? (
                        <p className="mt-1 text-xs text-rose-500">{errors.lateThresholdMinutes}</p>
                    ) : (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.gracePeriod || 'Grace period before marking as late.'}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

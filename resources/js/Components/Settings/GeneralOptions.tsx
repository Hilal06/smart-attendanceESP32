import React, { useRef, useState, useEffect } from 'react';
import { Settings as SettingsType } from '../../types';
import { Globe, ImageIcon, Upload, Trash2, Clock, AlertCircle, LayoutTemplate, Palette } from 'lucide-react';

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
    const [dashboardPreset, setDashboardPreset] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('smartattend-dashboard-variant') || '2';
        }
        return '2';
    });

    const [colorTheme, setColorTheme] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('smartattend-color-theme') || 'emerald';
        }
        return 'emerald';
    });

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setDashboardPreset(val);
        if (typeof window !== 'undefined') {
            localStorage.setItem('smartattend-dashboard-variant', val);
            window.dispatchEvent(new Event('dashboard-variant-updated'));
        }
    };

    const handleColorThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setColorTheme(val);
        if (typeof window !== 'undefined') {
            localStorage.setItem('smartattend-color-theme', val);
            document.documentElement.setAttribute('data-color-theme', val);
            window.dispatchEvent(new Event('color-theme-updated'));
        }
    };

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
                <div className="rounded-lg bg-theme-primary-light p-2 text-theme-primary">
                    <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.generalSettings || 'General Settings'}</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="companyName" className="mb-2 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                        <Globe className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        {t.companyName || 'Company Name'}
                    </label>
                    <input
                        id="companyName"
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleGeneralChange}
                        className={`w-full rounded-lg border bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white transition-colors focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary ${errors.companyName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                            }`}
                    />
                    {errors.companyName && <p className="mt-1 text-xs text-rose-500">{errors.companyName}</p>}
                </div>

                <div>
                    <label htmlFor="language" className="mb-2 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                        <Globe className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        {t.language || 'Language'}
                    </label>
                    <select
                        name="language"
                        id="language"
                        value={formData.language}
                        onChange={handleGeneralChange}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white transition-colors focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
                    >
                        <option value="en">English (US)</option>
                        <option value="id">Bahasa Indonesia</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="colorTheme" className="mb-2 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                        <Palette className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        {t.colorTheme || (t.language === 'id' ? 'Tema Warna Institusi' : 'Institution Color Palette')}
                    </label>
                    <select
                        name="colorTheme"
                        id="colorTheme"
                        value={colorTheme}
                        onChange={handleColorThemeChange}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white transition-colors focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
                    >
                        <option value="emerald">{t.language === 'id' ? '🟢 Zamrud Presisi (Standar)' : '🟢 Emerald Precision — Default'}</option>
                        <option value="amber">{t.language === 'id' ? '🏛️ Amber Hangat' : '🏛️ Warm Amber'}</option>
                        <option value="nordic">{t.language === 'id' ? '🌊 Biru Nordik' : '🌊 Nordic Blue'}</option>
                        <option value="crimson">{t.language === 'id' ? '🍷 Merah Karmin' : '🍷 Carmine Crimson'}</option>
                        <option value="cobalt">{t.language === 'id' ? '⚡ Baja Kobalt' : '⚡ Cobalt Steel'}</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t.language === 'id'
                            ? 'Pilih skema palet warna identitas sistem untuk seluruh antarmuka.'
                            : 'Select system brand color palette for the entire interface.'}
                    </p>
                </div>

                <div>
                    <label htmlFor="dashboardPreset" className="mb-2 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                        <LayoutTemplate className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        {t.dashboardPreset || 'Dashboard Layout Preset'}
                    </label>
                    <select
                        name="dashboardPreset"
                        id="dashboardPreset"
                        value={dashboardPreset}
                        onChange={handlePresetChange}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white transition-colors focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
                    >
                        <option value="2">{t.language === 'id' ? 'Studio Akademik (Kisi Bento) — Standar' : 'Academic Studio (Bento Grid) — Default'}</option>
                        <option value="1">{t.language === 'id' ? 'Pusat Kendali Operasional' : 'Command Center (Telemetry & Ops Deck)'}</option>
                        <option value="3">{t.language === 'id' ? 'Minimalis Ringkas' : 'Nordic Minimal (Quiet)'}</option>
                        <option value="4">{t.language === 'id' ? 'Monitor Kios (Layar Penuh)' : 'Kiosk Monitor (High-Visibility)'}</option>
                        <option value="5">{t.language === 'id' ? 'Kolom Status (Papan Kerja)' : 'Status Columns (Kanban Workspace)'}</option>
                        <option value="classic">{t.language === 'id' ? 'Tampilan Klasik' : 'Classic View'}</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t.dashboardPresetHint || 'Pilih preset tata letak dasbor yang ingin Anda gunakan pada halaman utama.'}
                    </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label htmlFor="companyLogoInput" className="mb-3 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                        <ImageIcon className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        {t.companyLogo || 'Company Logo'}
                    </label>
                    <div
                        className={`flex flex-col sm:flex-row sm:items-center gap-6 p-4 rounded-xl border-2 border-dashed transition-colors duration-200 ${isDraggingLogo
                            ? 'border-theme-primary bg-theme-primary-light'
                            : 'border-slate-200 dark:border-slate-700 hover:border-theme-primary hover:bg-slate-50 dark:hover:bg-slate-800/50'
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
                                    id="companyLogoInput"
                                    name="companyLogo"
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
                        className={`w-full rounded-lg border bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white transition-colors focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary ${errors.lateThresholdMinutes ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-700'
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

import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import { Settings as SettingsType, DayStatus, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import { Save, Clock, Calendar, AlertCircle, Globe, Image as ImageIcon, Trash2, Upload, Loader2, CheckCircle2 } from 'lucide-react';

interface SettingsProps {
  settings: SettingsType;
  userRole: UserRole;
}

export default function Settings({ settings, userRole }: SettingsProps) {
  const t = TRANSLATIONS[settings.language];
  const [formData, setFormData] = useState<SettingsType>(settings);
  const [saved, setSaved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateField = (name: string, value: any) => {
    let error = '';
    if (name === 'companyName') {
      if (!value.trim()) error = `${t.companyName} ${t.errorRequired}`;
      else if (value.trim().length < 2) error = 'Name too short';
    } else if (name === 'lateThresholdMinutes') {
      const val = parseInt(value);
      if (isNaN(val)) error = 'Must be a number';
      else if (val < 0) error = 'Cannot be negative';
      else if (val > 120) error = 'Max threshold is 120 mins';
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[name] = error;
      else delete newErrors[name];
      return newErrors;
    });
    return !error;
  };

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'lateThresholdMinutes' ? value : value
    }));
    validateField(name, value);
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

  const handleScheduleChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newSchedule = [...prev.weeklySchedule];
      newSchedule[index] = {
        ...newSchedule[index],
        [field]: value
      };
      return { ...prev, weeklySchedule: newSchedule };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isNameValid = validateField('companyName', formData.companyName);
    const isThresholdValid = validateField('lateThresholdMinutes', formData.lateThresholdMinutes);

    if (isNameValid && isThresholdValid) {
      setIsProcessing(true);
      const finalData = {
        ...formData,
        lateThresholdMinutes: parseInt(formData.lateThresholdMinutes as any) || 0
      };

      router.post('/settings', finalData, {
        onSuccess: () => {
          setSaved(true);
          setIsProcessing(false);
          setTimeout(() => setSaved(false), 3000);
        },
        onError: () => setIsProcessing(false)
      });
    }
  };

  return (
    <AppLayout userRole={userRole} settings={settings}>
      <Head title={t.settings} />
      <div className="max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.settings}</h2>
          <p className="text-slate-500">Configure company details and weekly work schedules.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-indigo-500" />
              General Information
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">{t.companyName}</label>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  value={formData.companyName}
                  onChange={handleGeneralChange}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none sm:text-sm transition-all ${errors.companyName ? 'border-rose-500 ring-1 ring-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    }`}
                />
                {errors.companyName && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.companyName}</p>}
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="language" className="block text-sm font-medium text-slate-700 flex items-center">
                  <Globe className="h-3.5 w-3.5 mr-1" /> {t.language}
                </label>
                <select
                  name="language"
                  id="language"
                  value={formData.language}
                  onChange={handleGeneralChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="en">English</option>
                  <option value="id">Bahasa Indonesia</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.companyLogo}</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-20 w-40 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                    {formData.companyLogo ? (
                      <img src={formData.companyLogo} alt="Logo Preview" className="h-full w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex gap-2">
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
                      className="flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t.uploadLogo}
                    </button>
                    {formData.companyLogo && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t.removeLogo}
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">Recommended size: 200x50px. Max 2MB.</p>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="lateThresholdMinutes" className="block text-sm font-medium text-slate-700">{t.lateThreshold}</label>
                <input
                  type="number"
                  name="lateThresholdMinutes"
                  id="lateThresholdMinutes"
                  value={formData.lateThresholdMinutes}
                  onChange={handleGeneralChange}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none sm:text-sm transition-all ${errors.lateThresholdMinutes ? 'border-rose-500 ring-1 ring-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    }`}
                />
                {errors.lateThresholdMinutes ? (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.lateThresholdMinutes}</p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">Grace period before marking as late.</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-indigo-500" />
              {t.weeklySchedule}
            </h3>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Day</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Start Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">End Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {formData.weeklySchedule.map((day, index) => (
                    <tr key={day.day} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {day.day}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={day.status}
                          onChange={(e) => handleScheduleChange(index, 'status', e.target.value)}
                          className={`block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-sm ring-1 ring-inset focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 ${day.status === 'Work Day' ? 'text-emerald-700 bg-emerald-50 ring-emerald-200' :
                            day.status === 'Holiday' ? 'text-amber-700 bg-amber-50 ring-amber-200' :
                              'text-slate-500 bg-slate-50 ring-slate-200'
                            }`}
                        >
                          <option value="Work Day">Work Day</option>
                          <option value="Holiday">Holiday</option>
                          <option value="Off Day">Off Day</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                          disabled={day.status !== 'Work Day'}
                          className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:text-sm sm:leading-6"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                          disabled={day.status !== 'Work Day'}
                          className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:text-sm sm:leading-6"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            {saved && (
              <div className="mr-4 flex items-center gap-2 text-sm text-emerald-600 font-medium animate-pulse">
                <CheckCircle2 className="h-4 w-4" />
                {settings.language === 'id' ? 'Pengaturan Disimpan!' : 'Settings Saved!'}
              </div>
            )}
            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t.saveConfiguration}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

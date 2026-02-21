import React, { useState, useRef, Fragment } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import AppLayout from '../Layouts/AppLayout';
import { Settings as SettingsType, DayStatus, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import { Save, Clock, Calendar, AlertCircle, Globe, Image as ImageIcon, Trash2, Upload, Loader2, CheckCircle2, Shield } from 'lucide-react';

interface SettingsProps {
  settings: SettingsType;
  userRole: UserRole;
  admin?: {
    name: string;
    email: string;
  };
}

export default function Settings({ settings, userRole, admin }: SettingsProps) {
  const t = TRANSLATIONS[settings.language];
  const [formData, setFormData] = useState<SettingsType>(settings);
  const [saved, setSaved] = useState(false);
  const [adminSaved, setAdminSaved] = useState(false);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
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

  // Placeholder for handleSave, as it's used in the new header but not defined in the original code.
  // Assuming it will eventually call handleSubmit or a similar save logic.
  const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
    handleSubmit(e as any); // Cast to any to match event type, or define handleSave to take React.FormEvent
  };

  const adminForm = useForm({
    name: admin?.name || '',
    email: admin?.email || '',
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAdminConfirm(true);
  };

  const confirmAdminSubmit = () => {
    setShowAdminConfirm(false);
    adminForm.post('/settings/admin', {
      preserveScroll: true,
      onSuccess: () => {
        adminForm.reset('current_password', 'new_password', 'new_password_confirmation');
        setAdminSaved(true);
        setTimeout(() => setAdminSaved(false), 3000);
      }
    });
  };

  return (
    <AppLayout userRole={userRole} settings={settings}>
      <Head title={t.settings} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* General Settings */}
          <div className="rounded-xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-2 text-indigo-600 dark:text-indigo-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.generalSettings}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Globe className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  {t.companyName}
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleGeneralChange}
                  className={`w-full rounded-lg border bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.companyName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                />
                {errors.companyName && <p className="mt-1 text-xs text-rose-500">{errors.companyName}</p>}
              </div>

              <div>
                <label className="mb-2 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Globe className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  {t.language}
                </label>
                <select
                  name="language"
                  id="language"
                  value={formData.language}
                  onChange={handleGeneralChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="en">English (US)</option>
                  <option value="id">Bahasa Indonesia</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <label className="mb-3 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                  <ImageIcon className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  {t.companyLogo}
                </label>
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 transition-colors">
                    {formData.companyLogo ? (
                      <img src={formData.companyLogo} alt="Logo" className="h-full w-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-slate-300 dark:text-slate-500" />
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
                        className="flex items-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {t.uploadLogo}
                      </button>
                      {formData.companyLogo && (
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="flex items-center rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/30 px-3 py-1.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t.removeLogo}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Recommended size: 200x50px. Max 2MB.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <label htmlFor="lateThresholdMinutes" className="mb-2 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Clock className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  {t.lateThreshold}
                </label>
                <input
                  type="number"
                  name="lateThresholdMinutes"
                  id="lateThresholdMinutes"
                  value={formData.lateThresholdMinutes}
                  onChange={handleGeneralChange}
                  className={`w-full rounded-lg border bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.lateThresholdMinutes ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                />
                {errors.lateThresholdMinutes ? (
                  <p className="mt-1 text-xs text-rose-500">{errors.lateThresholdMinutes}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Grace period before marking as late.</p>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="rounded-xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-2 text-indigo-600 dark:text-indigo-400">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.weeklySchedule}</h3>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800/50 transition-colors duration-200">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Day</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Hours</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 transition-colors duration-200">
                  {formData.weeklySchedule.map((day, index) => (
                    <tr key={day.day} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                        {day.day.substring(0, 3)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={day.status}
                          onChange={(e) => handleScheduleChange(index, 'status', e.target.value)}
                          className={`block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-xs font-medium ring-1 ring-inset focus:ring-2 focus:ring-indigo-600 transition-colors ${day.status === 'Work Day' ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 ring-emerald-200 dark:ring-emerald-800/50' :
                            day.status === 'Holiday' ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 ring-amber-200 dark:ring-amber-800/50' :
                              'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 ring-slate-200 dark:ring-slate-700'
                            }`}
                        >
                          <option value="Work Day">Work Day</option>
                          <option value="Holiday">Holiday</option>
                          <option value="Off Day">Off Day</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden sm:flex items-center gap-2">
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                          disabled={day.status !== 'Work Day'}
                          className="block w-24 rounded-md border-0 py-1 px-2 font-mono text-xs text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 disabled:opacity-50 transition-colors"
                        />
                        <span className="text-slate-400 dark:text-slate-500">-</span>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                          disabled={day.status !== 'Work Day'}
                          className="block w-24 rounded-md border-0 py-1 px-2 font-mono text-xs text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 disabled:opacity-50 transition-colors"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={isProcessing}
          className="flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t.saveConfiguration}
        </button>
      </form>

      {userRole === 'admin' && admin && (
        <form onSubmit={handleAdminSubmit} className="space-y-6 mt-8">
          <div className="rounded-xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-2 text-indigo-600 dark:text-indigo-400">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Admin Credentials</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                  <input
                    type="text"
                    value={adminForm.data.name}
                    onChange={e => adminForm.setData('name', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {adminForm.errors.name && <p className="mt-1 text-xs text-rose-500">{adminForm.errors.name}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <input
                    type="email"
                    value={adminForm.data.email}
                    onChange={e => adminForm.setData('email', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {adminForm.errors.email && <p className="mt-1 text-xs text-rose-500">{adminForm.errors.email}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                  <input
                    type="password"
                    value={adminForm.data.current_password}
                    onChange={e => adminForm.setData('current_password', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {adminForm.errors.current_password && <p className="mt-1 text-xs text-rose-500">{adminForm.errors.current_password}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    value={adminForm.data.new_password}
                    onChange={e => adminForm.setData('new_password', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {adminForm.errors.new_password && <p className="mt-1 text-xs text-rose-500">{adminForm.errors.new_password}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                  <input
                    type="password"
                    value={adminForm.data.new_password_confirmation}
                    onChange={e => adminForm.setData('new_password_confirmation', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  Credentials updated
                </div>
              </Transition>
              <button
                type="submit"
                disabled={adminForm.processing}
                className="flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {adminForm.processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Update Credentials
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Admin Confirmation Modal */}
      {showAdminConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white pb-1">Confirm Update</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Are you sure you want to update the admin credentials? You will need to use the new credentials on your next login.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAdminConfirm(false)}
                className="inline-flex justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAdminSubmit}
                className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-colors"
              >
                Yes, update
              </button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
}

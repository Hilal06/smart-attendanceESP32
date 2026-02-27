import React, { useState, useRef, Fragment } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import AppLayout from '../Layouts/AppLayout';
import { Settings as SettingsType, DayStatus, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import { Save, Calendar, AlertCircle, Loader2, CheckCircle2, Shield, Settings2, Smartphone, Lock } from 'lucide-react';
import { GeneralOptions } from '../Components/Settings/GeneralOptions';
import { WeeklySchedule } from '../Components/Settings/WeeklySchedule';
import { SecurityOptions } from '../Components/Settings/SecurityOptions';

interface SettingsProps {
  settings: SettingsType;
  userRole: UserRole;
  admin?: {
    name: string;
    email: string;
  };
}

export default function Settings({ settings, userRole, admin }: SettingsProps) {
  const t = TRANSLATIONS[settings?.language || 'en'];
  const [formData, setFormData] = useState<SettingsType>(settings || {
    companyName: 'SmartAttend Inc',
    companyLogo: '',
    lateThresholdMinutes: 15,
    language: 'en',
    weeklySchedule: []
  });
  const [saved, setSaved] = useState(false);
  const [adminSaved, setAdminSaved] = useState(false);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'schedule' | 'security'>('general');
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

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

      {/* Tabs */}
      <div className="mb-8 flex space-x-1 border-b border-slate-200/50 dark:border-slate-800/50 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          type="button"
          className={`flex items-center whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'general'
            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 focus:outline-none'
            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300 focus:outline-none'
            }`}
        >
          <Settings2 className="mr-2 h-4 w-4" />
          General Options
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          type="button"
          className={`flex items-center whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'schedule'
            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 focus:outline-none'
            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300 focus:outline-none'
            }`}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Weekly Schedule
        </button>
        {userRole === 'admin' && (
          <button
            onClick={() => setActiveTab('security')}
            type="button"
            className={`flex items-center whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'security'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 focus:outline-none'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300 focus:outline-none'
              }`}
          >
            <Shield className="mr-2 h-4 w-4" />
            Security & Admin
          </button>
        )}
      </div>

      <div className="min-h-[400px]">
        {(activeTab === 'general' || activeTab === 'schedule') && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'general' && (
              <GeneralOptions
                formData={formData}
                errors={errors}
                t={t}
                handleGeneralChange={handleGeneralChange}
                setFormData={setFormData}
              />
            )}

            {/* Weekly Schedule */}
            {activeTab === 'schedule' && (
              <WeeklySchedule
                formData={formData}
                t={t}
                setFormData={setFormData}
              />
            )}
            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t.saveConfiguration}
            </button>
          </form>
        )}

        {activeTab === 'security' && userRole === 'admin' && admin && (
          <SecurityOptions
            adminForm={adminForm}
            handleAdminSubmit={handleAdminSubmit}
            adminSaved={adminSaved}
            showAdminConfirm={showAdminConfirm}
            setShowAdminConfirm={setShowAdminConfirm}
            confirmAdminSubmit={confirmAdminSubmit}
          />
        )}
      </div>
    </AppLayout>
  );
}

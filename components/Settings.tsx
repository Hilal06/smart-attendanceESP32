import React, { useState } from 'react';
import { Settings as SettingsType, DayStatus } from '../types';
import { Save, Clock, Calendar } from 'lucide-react';

interface SettingsProps {
  settings: SettingsType;
  onSave: (newSettings: SettingsType) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<SettingsType>(settings);
  const [saved, setSaved] = useState(false);

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'lateThresholdMinutes' ? parseInt(value) || 0 : value
    }));
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
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500">Configure company details and weekly work schedules.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
             <Calendar className="mr-2 h-5 w-5 text-indigo-500" />
             General Information
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">Company Name</label>
              <input
                type="text"
                name="companyName"
                id="companyName"
                value={formData.companyName}
                onChange={handleGeneralChange}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-1">
               <label htmlFor="lateThresholdMinutes" className="block text-sm font-medium text-slate-700">Late Threshold (Minutes)</label>
               <input
                type="number"
                name="lateThresholdMinutes"
                id="lateThresholdMinutes"
                value={formData.lateThresholdMinutes}
                onChange={handleGeneralChange}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Grace period before marking as late.</p>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-indigo-500" />
            Weekly Schedule
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
                        className={`block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-sm ring-1 ring-inset focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 ${
                          day.status === 'Work Day' ? 'text-emerald-700 bg-emerald-50 ring-emerald-200' : 
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
          {saved && <span className="mr-4 text-sm text-emerald-600 font-medium animate-pulse">Settings Saved!</span>}
          <button
            type="submit"
            className="flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
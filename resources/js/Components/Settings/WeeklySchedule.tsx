import React from 'react';
import { Settings as SettingsType } from '../../types';
import { Calendar, Copy } from 'lucide-react';

interface WeeklyScheduleProps {
    formData: SettingsType;
    t: any;
    setFormData: React.Dispatch<React.SetStateAction<SettingsType>>;
}

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ formData, t, setFormData }) => {

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

    const copyMondayToWeekdays = () => {
        const monday = formData.weeklySchedule.find(d => d.day === 'Monday');
        if (!monday) return;

        setFormData(prev => {
            const newSchedule = prev.weeklySchedule.map(day => {
                if (['Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day.day)) {
                    return { ...day, status: monday.status, startTime: monday.startTime, endTime: monday.endTime };
                }
                return day;
            });
            return { ...prev, weeklySchedule: newSchedule };
        });
    };

    return (
        <div className="max-w-4xl rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 shadow-sm border border-white/20 dark:border-slate-700/50 transition-colors duration-300">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-2 text-indigo-600 dark:text-indigo-400">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.weeklySchedule || 'Weekly Schedule'}</h3>
                </div>
                <button
                    type="button"
                    onClick={copyMondayToWeekdays}
                    className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    title={t.copyMonday || "Copy Monday's schedule to Tuesday-Friday"}
                >
                    <Copy className="mr-2 h-4 w-4" />
                    {t.copyMonday || 'Copy Monday to Weekdays'}
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/20 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm shadow-inner">
                <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-700/50">
                    <thead className="bg-white/50 dark:bg-slate-800/50 transition-colors duration-300">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.day || 'Day'}</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.status || 'Status'}</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">{t.hours || 'Hours'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50 transition-colors duration-300 bg-transparent">
                        {formData.weeklySchedule.map((day, index) => (
                            <tr key={day.day} className="hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                                    {day.day.substring(0, 3)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <select
                                        value={day.status}
                                        onChange={(e) => handleScheduleChange(index, 'status', e.target.value)}
                                        className={`block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-xs font-medium ring-1 ring-inset focus:ring-2 focus:ring-indigo-600 transition-colors ${day.status === 'Work Day' ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 ring-emerald-200 dark:ring-emerald-800/50' :
                                            day.status === 'Holiday' ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 ring-amber-200 dark:ring-amber-800/50' :
                                                'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 ring-slate-200 dark:ring-slate-700'
                                            }`}
                                    >
                                        <option value="Work Day">{t.workDay || 'Work Day'}</option>
                                        <option value="Holiday">{t.holiday || 'Holiday'}</option>
                                        <option value="Off Day">{t.offDay || 'Off Day'}</option>
                                    </select>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap hidden sm:flex items-center gap-2">
                                    <input
                                        type="time"
                                        value={day.startTime}
                                        onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                                        disabled={day.status !== 'Work Day'}
                                        className="block w-24 rounded-md border-0 py-1 px-2 font-mono text-xs text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-950 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 disabled:opacity-50 transition-colors"
                                    />
                                    <span className="text-slate-400 dark:text-slate-500">-</span>
                                    <input
                                        type="time"
                                        value={day.endTime}
                                        onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                                        disabled={day.status !== 'Work Day'}
                                        className="block w-24 rounded-md border-0 py-1 px-2 font-mono text-xs text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-950 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 disabled:opacity-50 transition-colors"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { AppLayout } from '../Layouts/AppLayout';
import { Profile, AttendanceRecord, AttendanceStatus, Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, Loader2, FileText, Filter, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Calendar } from 'lucide-react';
import { generateAttendanceInsights } from '../services/geminiService';

interface ReportsProps {
  attendance: AttendanceRecord[];
  profiles: Profile[];
  settings: Settings;
  userRole: UserRole;
}

export default function Reports({ attendance, profiles, settings, userRole }: ReportsProps) {
  const t = TRANSLATIONS[settings.language];
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Weekly');

  const ITEMS_PER_PAGE = 5;

  const handleGenerateInsights = async () => {
    setLoadingAI(true);
    try {
      const insights = await generateAttendanceInsights(attendance, profiles);
      setAiInsights(insights);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [t.date, 'ID', t.profile, t.department, t.position, 'Status', t.checkIn, t.checkOut];
    const csvRows = [headers.join(',')];

    attendance.forEach(record => {
      const emp = profiles.find(e => e.id === record.profileId);
      const row = [
        record.date,
        record.profileId,
        `"${emp?.name || 'Unknown'}"`,
        `"${emp?.department || ''}"`,
        `"${emp?.role || ''}"`,
        record.status,
        record.checkIn || '',
        record.checkOut || ''
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Use WIB date for filename
    const filenameDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    link.setAttribute('download', `report_${filenameDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const trendData = useMemo(() => {
    const data: any[] = [];
    const today = new Date();

    if (timeRange === 'Weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        data.push({
          date: d.toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short', timeZone: 'Asia/Jakarta' }),
          fullDate: dateStr,
          Present: 0, Late: 0, Absent: 0
        });
      }
    } else if (timeRange === 'Monthly') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        // Show day number for monthly view to save space
        data.push({
          date: d.getDate(),
          fullDate: dateStr,
          Present: 0, Late: 0, Absent: 0
        });
      }
    } else { // Yearly
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        data.push({
          date: d.toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { month: 'short', timeZone: 'Asia/Jakarta' }),
          monthKey: monthKey,
          Present: 0, Late: 0, Absent: 0
        });
      }
    }

    attendance.forEach(record => {
      const recordDate = new Date(record.date);

      if (timeRange === 'Yearly') {
        const recordMonthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        const entry = data.find(d => d.monthKey === recordMonthKey);
        if (entry) {
          if (record.status === AttendanceStatus.PRESENT) entry.Present++;
          else if (record.status === AttendanceStatus.LATE) entry.Late++;
          else if (record.status === AttendanceStatus.ABSENT) entry.Absent++;
        }
      } else {
        const dateStr = record.date;
        const entry = data.find(d => d.fullDate === dateStr);
        if (entry) {
          if (record.status === AttendanceStatus.PRESENT) entry.Present++;
          else if (record.status === AttendanceStatus.LATE) entry.Late++;
          else if (record.status === AttendanceStatus.ABSENT) entry.Absent++;
        }
      }
    });

    return data;
  }, [attendance, timeRange, t.language]);

  const statusStats = useMemo(() => {
    let present = 0, late = 0, absent = 0, leave = 0;
    attendance.forEach(r => {
      if (r.status === AttendanceStatus.PRESENT) present++;
      if (r.status === AttendanceStatus.LATE) late++;
      if (r.status === AttendanceStatus.ABSENT) absent++;
      if (r.status === AttendanceStatus.ON_LEAVE) leave++;
    });
    const total = attendance.length || 1;

    return {
      data: [
        { name: t.present, value: present, color: '#10b981' },
        { name: t.late, value: late, color: '#f59e0b' },
        { name: t.absent, value: absent, color: '#f43f5e' },
        { name: t.onLeave, value: leave, color: '#64748b' },
      ],
      total,
      details: [
        { label: t.present, value: present, percentage: Math.round((present / total) * 100), color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
        { label: t.late, value: late, percentage: Math.round((late / total) * 100), color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
        { label: t.absent, value: absent, percentage: Math.round((absent / total) * 100), color: 'bg-rose-500', textColor: 'text-rose-700', bgColor: 'bg-rose-50' },
        { label: t.onLeave, value: leave, percentage: Math.round((leave / total) * 100), color: 'bg-slate-500', textColor: 'text-slate-700', bgColor: 'bg-slate-50' },
      ]
    };
  }, [attendance, t]);

  const filteredAttendance = useMemo(() => {
    let data = [...attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (statusFilter !== 'All') data = data.filter(r => r.status === statusFilter);
    return data;
  }, [attendance, statusFilter]);

  const totalPages = Math.ceil(filteredAttendance.length / ITEMS_PER_PAGE);
  const paginatedData = filteredAttendance.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getProfile = (id: string) => profiles.find(e => e.id === id);

  return (
    <AppLayout userRole={userRole} settings={settings} t={t}>
      <Head title={t.reportsAnalytics} />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{t.reportsAnalytics}</h2>
            <p className="text-slate-500">{t.visualizeTrends}</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={handleExportCSV} className="flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">{t.exportCSV}</button>
            <button onClick={handleGenerateInsights} disabled={loadingAI} className="flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-75">
              {loadingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {loadingAI ? (t.language === 'id' ? 'Menganalisis...' : 'Analyzing...') : t.askAI}
            </button>
          </div>
        </div>

        {aiInsights && (
          <div className="rounded-xl bg-indigo-50 p-6 border border-indigo-100 animate-fade-in">
            <div className="flex items-center mb-4"><Sparkles className="h-5 w-5 text-indigo-600 mr-2" /><h3 className="font-semibold text-indigo-900">{t.aiAnalysis}</h3></div>
            <div className="prose prose-indigo prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: aiInsights }} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-semibold text-slate-900">{t.attendanceTrend}</h3>
              <div className="inline-flex rounded-lg bg-slate-100 p-1">
                {(['Weekly', 'Monthly', 'Yearly'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`flex items-center gap-2 rounded-md px-3 py-1 text-xs font-semibold transition-all ${timeRange === range
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    {range === 'Weekly' && <CalendarDays className="h-3.5 w-3.5" />}
                    {range === 'Monthly' && <CalendarRange className="h-3.5 w-3.5" />}
                    {range === 'Yearly' && <Calendar className="h-3.5 w-3.5" />}
                    {range === 'Weekly' ? t.weekly : range === 'Monthly' ? t.monthly : t.yearly}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} interval={timeRange === 'Monthly' ? 2 : 0} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Present" name={t.present} stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Late" name={t.late} stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Absent" name={t.absent} stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 flex flex-col">
            <h3 className="mb-4 font-semibold text-slate-900">{t.statusDistribution}</h3>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusStats.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusStats.data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full mt-4 space-y-3">
                {statusStats.details.map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                      <span className="text-slate-600">{stat.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">{stat.value}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stat.bgColor} ${stat.textColor}`}>{stat.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center"><FileText className="h-5 w-5 text-slate-500 mr-2" /><h3 className="font-semibold text-slate-900">{t.detailedLogs}</h3></div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              <Filter className="h-4 w-4 text-slate-500" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border-0 py-1.5 px-3 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600">
                <option value="All">{t.allStatus}</option>
                <option value={AttendanceStatus.PRESENT}>{t.present}</option>
                <option value={AttendanceStatus.LATE}>{t.late}</option>
                <option value={AttendanceStatus.ABSENT}>{t.absent}</option>
                <option value={AttendanceStatus.ON_LEAVE}>{t.onLeave}</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium uppercase text-slate-500">{t.date}</th>
                  <th className="px-6 py-3 text-left font-medium uppercase text-slate-500">{t.profile}</th>
                  <th className="px-6 py-3 text-left font-medium uppercase text-slate-500">{t.department}</th>
                  <th className="px-6 py-3 text-left font-medium uppercase text-slate-500">Status</th>
                  <th className="px-6 py-3 text-left font-medium uppercase text-slate-500">{t.checkIn}</th>
                  <th className="px-6 py-3 text-left font-medium uppercase text-slate-500">{t.checkOut}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedData.map((record) => {
                  const emp = getProfile(record.profileId);
                  return (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500">{record.date}</td>
                      <td className="px-6 py-4"><div className="flex items-center"><img className="h-8 w-8 rounded-full object-cover mr-3" src={emp?.avatar} alt="" /><div><p className="font-medium text-slate-900">{emp?.name || 'Unknown'}</p><p className="text-xs text-slate-500">{emp?.role}</p></div></div></td>
                      <td className="px-6 py-4 text-slate-500">{emp?.department || '-'}</td>
                      <td className="px-6 py-4"><span className={`rounded-full px-2 text-xs font-semibold leading-5 ${record.status === AttendanceStatus.PRESENT ? 'bg-emerald-100 text-emerald-800' : record.status === AttendanceStatus.LATE ? 'bg-amber-100 text-amber-800' : record.status === AttendanceStatus.ABSENT ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>{record.status === AttendanceStatus.PRESENT ? t.present : record.status === AttendanceStatus.LATE ? t.late : record.status === AttendanceStatus.ABSENT ? t.absent : t.onLeave}</span></td>
                      <td className="px-6 py-4 text-slate-500">{record.checkIn || '--:--'}</td>
                      <td className="px-6 py-4 text-slate-500">{record.checkOut || '--:--'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex items-center justify-between text-sm text-slate-500">
            <div>{t.showing} <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> {t.to} <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAttendance.length)}</span> {t.of} <span className="font-medium">{filteredAttendance.length}</span> {t.results}</div>
            <div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded bg-white border hover:bg-slate-50 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 rounded bg-white border hover:bg-slate-50 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button></div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
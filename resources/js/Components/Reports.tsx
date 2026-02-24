import React, { useState, useMemo } from 'react';
import { Profile, AttendanceRecord, AttendanceStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, Loader2, FileText, Filter, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Calendar, Search, X, Inbox } from 'lucide-react';
import { generateAttendanceInsights } from '../services/geminiService';

interface ReportsProps {
  attendance: AttendanceRecord[];
  profiles: Profile[];
  t: any;
}

export const Reports: React.FC<ReportsProps> = ({ attendance, profiles, t }) => {
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Weekly');
  const [searchQuery, setSearchQuery] = useState('');

  const ITEMS_PER_PAGE = 5;
  const isId = t.reportsAnalytics === 'Laporan & Analitik'; // Simple heuristic for language

  const filteredAttendanceByTime = useMemo(() => {
    const today = new Date();
    let startDate = new Date();

    if (timeRange === 'Weekly') {
      startDate.setDate(today.getDate() - 6);
    } else if (timeRange === 'Monthly') {
      startDate.setDate(today.getDate() - 29);
    } else { // Yearly
      startDate.setFullYear(today.getFullYear(), today.getMonth() - 11, 1);
    }

    const startStr = startDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

    return attendance.filter(r => r.date >= startStr && r.date <= todayStr);
  }, [attendance, timeRange]);

  const handleGenerateInsights = async () => {
    setLoadingAI(true);
    const insights = await generateAttendanceInsights(attendance, profiles);
    setAiInsights(insights);
    setLoadingAI(false);
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
    filteredAttendanceByTime.forEach(r => {
      if (r.status === AttendanceStatus.PRESENT) present++;
      if (r.status === AttendanceStatus.LATE) late++;
      if (r.status === AttendanceStatus.ABSENT) absent++;
      if (r.status === AttendanceStatus.ON_LEAVE) leave++;
    });
    const total = filteredAttendanceByTime.length || 1;

    return {
      data: [
        { name: t.present, value: present, color: '#10b981', statusKey: AttendanceStatus.PRESENT },
        { name: t.late, value: late, color: '#f59e0b', statusKey: AttendanceStatus.LATE },
        { name: t.absent, value: absent, color: '#f43f5e', statusKey: AttendanceStatus.ABSENT },
        { name: t.onLeave, value: leave, color: '#64748b', statusKey: AttendanceStatus.ON_LEAVE },
      ],
      total: filteredAttendanceByTime.length,
      details: [
        { label: t.present, value: present, percentage: Math.round((present / total) * 100), color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', statusKey: AttendanceStatus.PRESENT },
        { label: t.late, value: late, percentage: Math.round((late / total) * 100), color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50', statusKey: AttendanceStatus.LATE },
        { label: t.absent, value: absent, percentage: Math.round((absent / total) * 100), color: 'bg-rose-500', textColor: 'text-rose-700', bgColor: 'bg-rose-50', statusKey: AttendanceStatus.ABSENT },
        { label: t.onLeave, value: leave, percentage: Math.round((leave / total) * 100), color: 'bg-slate-500', textColor: 'text-slate-700', bgColor: 'bg-slate-50', statusKey: AttendanceStatus.ON_LEAVE },
      ]
    };
  }, [filteredAttendanceByTime, t]);

  const filteredAttendance = useMemo(() => {
    let data = [...filteredAttendanceByTime].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (statusFilter !== 'All') {
      data = data.filter(r => r.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(r => {
        const emp = profiles.find(e => e.id === r.profileId);
        return emp?.name.toLowerCase().includes(query) || emp?.id.toLowerCase().includes(query);
      });
    }

    return data;
  }, [filteredAttendanceByTime, statusFilter, searchQuery, profiles]);

  const totalPages = Math.ceil(filteredAttendance.length / ITEMS_PER_PAGE);
  const paginatedData = filteredAttendance.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getProfile = (id: string) => profiles.find(e => e.id === id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.reportsAnalytics}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t.visualizeTrends}</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleExportCSV} className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{t.exportCSV}</button>
          <button onClick={handleGenerateInsights} disabled={loadingAI} className="relative overflow-hidden group flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-75 disabled:hover:translate-y-0">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            {loadingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin relative z-10" /> : <Sparkles className="mr-2 h-4 w-4 relative z-10 group-hover:text-indigo-200 transition-colors" />}
            <span className="relative z-10">{loadingAI ? (t.language === 'id' ? 'Menganalisis...' : 'Analyzing...') : t.askAI}</span>
          </button>
        </div>
      </div>

      {aiInsights && (
        <div className="relative rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 border border-indigo-200/50 dark:border-indigo-500/30 shadow-[0_0_40px_-15px_rgba(99,102,241,0.3)] dark:shadow-[0_0_40px_-15px_rgba(99,102,241,0.15)] animate-in slide-in-from-top-4 fade-in duration-500 transition-all">
          <button
            onClick={() => setAiInsights(null)}
            className="absolute top-4 right-4 p-2 text-indigo-400 hover:text-indigo-600 dark:text-indigo-500 dark:hover:text-indigo-300 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/50 rounded-full transition-colors"
            title={isId ? "Tutup" : "Dismiss"}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center mb-5">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 mr-3 shadow-inner">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">{t.aiAnalysis}</h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{isId ? 'Dihasilkan oleh AI' : 'Generated by AI'}</p>
            </div>
          </div>
          <div className="prose prose-indigo prose-sm sm:prose-base max-w-none text-slate-700 dark:text-slate-300 leading-relaxed overflow-hidden">
            <div className="animate-[fade-in-up_0.8s_ease-out_forwards]" dangerouslySetInnerHTML={{ __html: aiInsights }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm border border-white/20 dark:border-slate-800 transition-colors duration-300 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
            <h3 className="font-semibold text-slate-900 dark:text-white">{t.attendanceTrend}</h3>
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 transition-colors">
              {(['Weekly', 'Monthly', 'Yearly'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`flex items-center gap-2 rounded-md px-3 py-1 text-xs font-semibold transition-all ${timeRange === range
                    ? 'bg-white/95 dark:bg-slate-600/90 shadow-sm border border-white/20 dark:border-slate-500 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
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
          <div className="flex-1 w-full min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} interval={timeRange === 'Monthly' ? 2 : 0} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '16px', fontWeight: 500 }} />
                <Bar dataKey="Present" name={t.present} stackId="a" fill="url(#colorPresent)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Late" name={t.late} stackId="a" fill="url(#colorLate)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Absent" name={t.absent} stackId="a" fill="url(#colorAbsent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm border border-white/20 dark:border-slate-800 flex flex-col transition-colors duration-300">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">{t.statusDistribution}</h3>
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

            <div className="w-full mt-6 grid grid-cols-2 gap-3">
              {statusStats.details.map((stat, idx) => {
                const isActive = statusFilter === stat.statusKey;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setStatusFilter(isActive ? 'All' : stat.statusKey);
                      setCurrentPage(1);
                    }}
                    className={`relative overflow-hidden flex flex-col p-4 rounded-xl transition-all duration-300 text-left ${isActive
                      ? 'bg-white dark:bg-slate-800 shadow-md ring-2 ring-indigo-500 scale-[1.02]'
                      : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-white/40 border hover:shadow-sm'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${stat.color} ${isActive ? 'ring-4 ring-' + stat.color.replace('bg-', '') + '/20' : ''}`}></div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${stat.bgColor.replace('50', '500/10')} ${stat.textColor.replace('700', '500 dark:text-' + stat.textColor.replace('text-', '').replace('700', '400'))}`}>{stat.percentage}%</span>
                    </div>
                    <div>
                      <span className={`block text-2xl font-bold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>{stat.value}</span>
                      <span className={`text-xs font-medium ${isActive ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>{stat.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border border-white/20 dark:border-slate-800 overflow-hidden transition-colors duration-300">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between px-6 py-4 border-b border-white/20 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 transition-colors gap-4">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-2" />
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              {t.detailedLogs}
              {statusFilter !== 'All' && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${statusFilter === AttendanceStatus.PRESENT ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400' :
                  statusFilter === AttendanceStatus.LATE ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400' :
                    statusFilter === AttendanceStatus.ABSENT ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-400' :
                      'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-400'
                  }`}>
                  {statusFilter === AttendanceStatus.PRESENT ? t.present : statusFilter === AttendanceStatus.LATE ? t.late : statusFilter === AttendanceStatus.ABSENT ? t.absent : t.onLeave} Filter
                </span>
              )}
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder={isId ? 'Cari nama atau ID...' : 'Search name or ID...'}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="block w-full pl-9 pr-3 py-2 text-sm border border-white/20 dark:border-slate-800 rounded-lg bg-white/80 dark:bg-slate-950/80 backdrop-blur-md text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm"
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400 hidden sm:block" />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="block w-full sm:w-auto rounded-lg border-white/20 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-2 pl-3 pr-8 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 transition-colors shadow-sm">
                <option value="All">{t.allStatus}</option>
                <option value={AttendanceStatus.PRESENT}>{t.present}</option>
                <option value={AttendanceStatus.LATE}>{t.late}</option>
                <option value={AttendanceStatus.ABSENT}>{t.absent}</option>
                <option value={AttendanceStatus.ON_LEAVE}>{t.onLeave}</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto px-6 pb-6 pt-2">
          <table className="min-w-full border-separate border-spacing-y-3 text-sm">
            <thead>
              <tr className="bg-transparent">
                <th className="px-6 py-3 text-left font-semibold uppercase text-slate-400 dark:text-slate-500 text-[10px] tracking-widest">{t.date}</th>
                <th className="px-6 py-3 text-left font-semibold uppercase text-slate-400 dark:text-slate-500 text-[10px] tracking-widest">{t.profile}</th>
                <th className="px-6 py-3 text-left font-semibold uppercase text-slate-400 dark:text-slate-500 text-[10px] tracking-widest">{t.department}</th>
                <th className="px-6 py-3 text-left font-semibold uppercase text-slate-400 dark:text-slate-500 text-[10px] tracking-widest">Status</th>
                <th className="px-6 py-3 text-left font-semibold uppercase text-slate-400 dark:text-slate-500 text-[10px] tracking-widest">{t.checkIn}</th>
                <th className="px-6 py-3 text-left font-semibold uppercase text-slate-400 dark:text-slate-500 text-[10px] tracking-widest">{t.checkOut}</th>
              </tr>
            </thead>
            <tbody className="bg-transparent">
              {paginatedData.length > 0 ? (
                paginatedData.map((record) => {
                  const emp = getProfile(record.profileId);
                  return (
                    <tr key={record.id} className="group relative bg-white/60 dark:bg-slate-800/60 shadow-sm border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                      <td colSpan={0} className="p-0 z-0"><div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 scale-y-50 group-hover:scale-y-100"></div></td>
                      <td className="px-6 py-4 rounded-l-2xl text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap relative z-10">{record.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap relative z-10"><div className="flex items-center"><img className="h-10 w-10 rounded-full object-cover mr-4 ring-2 ring-white/50 dark:ring-slate-800/50 shadow-sm" src={emp?.avatar} alt="" /><div><p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{emp?.name || 'Unknown'}</p><p className="text-xs font-medium text-slate-500 dark:text-slate-400">{emp?.role}</p></div></div></td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400 text-sm font-medium relative z-10">{emp?.department || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap relative z-10"><span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold shadow-sm border ${record.status === AttendanceStatus.PRESENT ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-800/30 dark:text-emerald-400' : record.status === AttendanceStatus.LATE ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-800/30 dark:text-amber-400' : record.status === AttendanceStatus.ABSENT ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-800/30 dark:text-rose-400' : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-500/10 dark:border-slate-700/50 dark:text-slate-300'}`}>{record.status === AttendanceStatus.PRESENT ? t.present : record.status === AttendanceStatus.LATE ? t.late : record.status === AttendanceStatus.ABSENT ? t.absent : t.onLeave}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-sm relative z-10">{record.checkIn || '--:--'}</td>
                      <td className="px-6 py-4 whitespace-nowrap rounded-r-2xl text-slate-600 dark:text-slate-300 font-mono text-sm relative z-10">{record.checkOut || '--:--'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <td colSpan={6} className="px-6 py-16 text-center rounded-2xl relative z-10">
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-full mb-4 inline-block shadow-sm ring-4 ring-slate-50 dark:ring-slate-900/50 animate-bounce">
                        <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-500" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                        {isId ? 'Tidak Ada Laporan' : 'No Records Found'}
                      </h4>
                      <p className="text-sm max-w-sm mx-auto">
                        {searchQuery
                          ? (isId ? 'Tidak ada laporan yang cocok dengan pencarian Anda.' : 'No records match your search query.')
                          : (isId ? 'Tidak ada laporan yang cocok dengan filter yang dipilih untuk rentang waktu ini.' : 'No records match the selected filters for this time period.')}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-white/20 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 px-6 py-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300 rounded-b-xl">
          <div>{t.showing} <span className="font-medium text-slate-900 dark:text-slate-300">{filteredAttendance.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> {t.to} <span className="font-medium text-slate-900 dark:text-slate-300">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAttendance.length)}</span> {t.of} <span className="font-medium text-slate-900 dark:text-slate-300">{filteredAttendance.length}</span> {t.results}</div>
          <div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded bg-white dark:bg-slate-900 border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"><ChevronLeft className="h-4 w-4" /></button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 rounded bg-white dark:bg-slate-900 border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"><ChevronRight className="h-4 w-4" /></button></div>
        </div>
      </div>
    </div>
  );
};

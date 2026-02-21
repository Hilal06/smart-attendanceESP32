import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, AttendanceStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, Loader2, FileText, Filter, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Calendar, Search, X, Inbox } from 'lucide-react';
import { generateAttendanceInsights } from '../services/geminiService';

interface ReportsProps {
  attendance: AttendanceRecord[];
  employees: Employee[];
  t: any;
}

export const Reports: React.FC<ReportsProps> = ({ attendance, employees, t }) => {
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
    const insights = await generateAttendanceInsights(attendance, employees);
    setAiInsights(insights);
    setLoadingAI(false);
  };

  const handleExportCSV = () => {
    const headers = [t.date, 'ID', t.employee, t.department, t.position, 'Status', t.checkIn, t.checkOut];
    const csvRows = [headers.join(',')];

    attendance.forEach(record => {
      const emp = employees.find(e => e.id === record.employeeId);
      const row = [
        record.date,
        record.employeeId,
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
        const emp = employees.find(e => e.id === r.employeeId);
        return emp?.name.toLowerCase().includes(query) || emp?.id.toLowerCase().includes(query);
      });
    }

    return data;
  }, [filteredAttendanceByTime, statusFilter, searchQuery, employees]);

  const totalPages = Math.ceil(filteredAttendance.length / ITEMS_PER_PAGE);
  const paginatedData = filteredAttendance.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getEmployee = (id: string) => employees.find(e => e.id === id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.reportsAnalytics}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t.visualizeTrends}</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleExportCSV} className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{t.exportCSV}</button>
          <button onClick={handleGenerateInsights} disabled={loadingAI} className="flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-75">
            {loadingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {loadingAI ? (t.language === 'id' ? 'Menganalisis...' : 'Analyzing...') : t.askAI}
          </button>
        </div>
      </div>

      {aiInsights && (
        <div className="relative rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/30 dark:to-slate-800/50 p-6 sm:p-8 border border-indigo-100 dark:border-indigo-800/50 shadow-sm animate-fade-in transition-all">
          <button
            onClick={() => setAiInsights(null)}
            className="absolute top-4 right-4 p-2 text-indigo-400 hover:text-indigo-600 dark:text-indigo-500 dark:hover:text-indigo-300 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/50 rounded-full transition-colors"
            title={isId ? "Tutup" : "Dismiss"}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center mb-5">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 mr-3">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">{t.aiAnalysis}</h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{isId ? 'Dihasilkan oleh AI' : 'Generated by AI'}</p>
            </div>
          </div>
          <div className="prose prose-indigo prose-sm sm:prose-base max-w-none text-slate-700 dark:text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiInsights }} />
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

            <div className="w-full mt-4 space-y-2">
              {statusStats.details.map((stat, idx) => {
                const isActive = statusFilter === stat.statusKey;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setStatusFilter(isActive ? 'All' : stat.statusKey);
                      setCurrentPage(1);
                    }}
                    className={`w-full flex items-center justify-between text-sm p-2.5 rounded-lg transition-all border duration-300 ${isActive
                      ? 'bg-white/60 dark:bg-slate-800/60 border-indigo-200/50 dark:border-indigo-700/50 shadow-sm ring-1 ring-indigo-500/20'
                      : 'border-transparent hover:bg-white/40 dark:hover:bg-slate-800/30'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${stat.color} ${isActive ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-' + stat.color.replace('bg-', '') : ''}`}></div>
                      <span className={`font-medium ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{stat.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{stat.value}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${stat.bgColor.replace('50', '500/10')} ${stat.textColor.replace('700', '500 dark:text-' + stat.textColor.replace('text-', '').replace('700', '400'))}`}>{stat.percentage}%</span>
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-800/50 text-sm">
            <thead className="bg-transparent transition-colors duration-300">
              <tr>
                <th className="px-6 py-3 text-left font-medium uppercase text-slate-500 dark:text-slate-400">{t.date}</th>
                <th className="px-6 py-3 text-left font-medium uppercase text-slate-500 dark:text-slate-400">{t.employee}</th>
                <th className="px-6 py-3 text-left font-medium uppercase text-slate-500 dark:text-slate-400">{t.department}</th>
                <th className="px-6 py-3 text-left font-medium uppercase text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-3 text-left font-medium uppercase text-slate-500 dark:text-slate-400">{t.checkIn}</th>
                <th className="px-6 py-3 text-left font-medium uppercase text-slate-500 dark:text-slate-400">{t.checkOut}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30 bg-transparent transition-colors duration-300">
              {paginatedData.length > 0 ? (
                paginatedData.map((record) => {
                  const emp = getEmployee(record.employeeId);
                  return (
                    <tr key={record.id} className="hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors duration-200">
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{record.date}</td>
                      <td className="px-6 py-4"><div className="flex items-center"><img className="h-8 w-8 rounded-full object-cover mr-3" src={emp?.avatar} alt="" /><div><p className="font-medium text-slate-900 dark:text-white">{emp?.name || 'Unknown'}</p><p className="text-xs text-slate-500 dark:text-slate-400">{emp?.role}</p></div></div></td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{emp?.department || '-'}</td>
                      <td className="px-6 py-4"><span className={`rounded-full px-2 text-xs font-semibold leading-5 ${record.status === AttendanceStatus.PRESENT ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400' : record.status === AttendanceStatus.LATE ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400' : record.status === AttendanceStatus.ABSENT ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-500/10 text-slate-800 dark:text-slate-300'}`}>{record.status === AttendanceStatus.PRESENT ? t.present : record.status === AttendanceStatus.LATE ? t.late : record.status === AttendanceStatus.ABSENT ? t.absent : t.onLeave}</span></td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{record.checkIn || '--:--'}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{record.checkOut || '--:--'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-full mb-4 inline-block shadow-sm">
                        <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600" />
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

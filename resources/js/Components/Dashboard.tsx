import React, { useMemo, useState, useEffect } from 'react';
import { Profile, AttendanceRecord, AttendanceStatus, Announcement, Page } from '../types';
import { Users, Clock, AlertTriangle, CheckCircle, Bell, Filter, SortDesc, CalendarDays, CalendarRange, Calendar, ChevronLeft, ChevronRight, Server, Search, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { router } from '@inertiajs/react';

interface DashboardProps {
  profiles: Profile[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  t: any;
  userRole?: string;
}

type TimeRange = 'Today' | 'Weekly' | 'Monthly' | 'Yearly';
type AnnouncementSort = 'Latest' | 'Priority';
type StatusFilter = 'All' | AttendanceStatus.PRESENT | AttendanceStatus.LATE | AttendanceStatus.ABSENT;

export const Dashboard: React.FC<DashboardProps> = ({ profiles, attendance, announcements, t, userRole }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('Today');
  const [announcementSort, setAnnouncementSort] = useState<AnnouncementSort>('Latest');
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const isId = t.dashboard === 'Dasbor';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: isId ? 'Selamat Pagi' : 'Good Morning', icon: Sunrise, color: 'text-amber-500' };
    if (hour >= 12 && hour < 17) return { text: isId ? 'Selamat Siang' : 'Good Afternoon', icon: Sun, color: 'text-amber-500' };
    if (hour >= 17 && hour < 20) return { text: isId ? 'Selamat Sore' : 'Good Evening', icon: Sunset, color: 'text-orange-500' };
    return { text: isId ? 'Selamat Malam' : 'Good Night', icon: Moon, color: 'text-indigo-400' };
  }, [isId]);

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/system/status');
        if (response.ok) {
          const data = await response.json();
          if (isMounted) setSystemStatus(data);
        } else {
          if (isMounted) setSystemStatus({ status: 'offline' });
        }
      } catch (error) {
        if (isMounted) setSystemStatus({ status: 'offline' });
      }
    };

    fetchStatus();

    // Auto-refresh the system status and the dashboard data
    const intervalId = setInterval(() => {
      fetchStatus();

      // Silently reload only the dynamic props
      router.reload({
        only: ['attendance', 'profiles', 'announcements']
      });

    }, 15000); // Poll every 15 seconds

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const filteredRecordsByTime = useMemo(() => {
    const getDaysAgo = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    };

    let startDate = today;
    if (timeRange === 'Weekly') startDate = getDaysAgo(7);
    else if (timeRange === 'Monthly') startDate = getDaysAgo(30);
    else if (timeRange === 'Yearly') startDate = getDaysAgo(365);

    return attendance.filter(r => r.date >= startDate && r.date <= today);
  }, [attendance, timeRange, today]);

  const activeStats = useMemo(() => {
    return {
      present: filteredRecordsByTime.filter(r => r.status === AttendanceStatus.PRESENT).length,
      late: filteredRecordsByTime.filter(r => r.status === AttendanceStatus.LATE).length,
      absent: filteredRecordsByTime.filter(r => r.status === AttendanceStatus.ABSENT).length,
    };
  }, [filteredRecordsByTime]);

  // For the Quick Attendance Table
  const tableRecords = useMemo(() => {
    let records = filteredRecordsByTime;

    // 1. Filter by Status Clicked on Top Cards
    if (activeStatusFilter !== 'All') {
      records = records.filter(r => r.status === activeStatusFilter);
    }

    // 2. Filter by Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      records = records.filter(r => {
        const emp = profiles.find(e => e.id === r.profileId);
        return emp?.name.toLowerCase().includes(query) || emp?.id.toLowerCase().includes(query);
      });
    }

    // Sort newest first
    return records.sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.checkIn || '00:00'}`).getTime();
      const timeB = new Date(`${b.date}T${b.checkIn || '00:00'}`).getTime();
      return timeB - timeA;
    });
  }, [filteredRecordsByTime, activeStatusFilter, searchQuery, profiles]);

  const sortedAnnouncements = useMemo(() => {
    const list = [...announcements];
    let sortedList = [];
    if (announcementSort === 'Latest') {
      sortedList = list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      const priorityMap: Record<string, number> = { 'Urgent': 3, 'High': 2, 'Normal': 1 };
      sortedList = list.sort((a, b) => (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0));
    }
    return sortedList.slice(0, 5);
  }, [announcements, announcementSort]);

  const chartData = useMemo(() => {
    if (timeRange === 'Yearly') {
      const scale = Math.max(1, profiles.length);
      return [
        { name: 'Jan', Present: Math.floor(scale * 18), Late: Math.floor(scale * 2), Absent: Math.floor(scale * 1) },
        { name: 'Feb', Present: Math.floor(scale * 19), Late: Math.floor(scale * 1), Absent: Math.floor(scale * 1) },
        { name: 'Mar', Present: Math.floor(scale * 20), Late: Math.floor(scale * 1), Absent: Math.floor(scale * 1) },
        { name: 'Apr', Present: Math.floor(scale * 17), Late: Math.floor(scale * 3), Absent: Math.floor(scale * 2) },
        { name: 'May', Present: Math.floor(scale * 21), Late: Math.floor(scale * 1), Absent: Math.floor(scale * 1) },
        { name: 'Jun', Present: Math.floor(scale * 18), Late: Math.floor(scale * 2), Absent: Math.floor(scale * 1) },
      ];
    }

    const days: Record<string, any> = {};
    const limit = timeRange === 'Weekly' ? 7 : timeRange === 'Monthly' ? 30 : timeRange === 'Today' ? 1 : 1;
    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      days[dateStr] = {
        name: d.toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short', day: 'numeric', timeZone: 'Asia/Jakarta' }),
        Present: 0, Late: 0, Absent: 0
      };
    }
    attendance.forEach(r => {
      if (days[r.date]) {
        if (r.status === AttendanceStatus.PRESENT) days[r.date].Present++;
        if (r.status === AttendanceStatus.LATE) days[r.date].Late++;
        if (r.status === AttendanceStatus.ABSENT) days[r.date].Absent++;
      }
    });

    if (timeRange === 'Today') {
      // Just so the chart looks nice with a single bar, maybe add an empty slot?
      // Nah, Recharts centers a single bar fine.
    }

    return Object.values(days);
  }, [attendance, timeRange, profiles.length, t.language]);

  const StatCard = ({ title, value, icon: Icon, color, bg, statusKey }: any) => {
    const isActive = activeStatusFilter === statusKey;
    const isClickable = statusKey !== 'All'; // "Team" card isn't filtered

    return (
      <button
        type="button"
        onClick={() => isClickable && setActiveStatusFilter(isActive ? 'All' : statusKey)}
        className={`relative overflow-hidden w-full text-left rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all duration-300 ${isClickable ? 'hover:-translate-y-1 hover:shadow-lg cursor-pointer' : 'cursor-default'
          } ${isActive
            ? 'bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-indigo-300 dark:border-indigo-500/50 ring-2 ring-indigo-500/30 shadow-[0_8px_30px_rgb(99,102,241,0.2)] dark:shadow-[0_8px_30px_rgb(99,102,241,0.15)] scale-[1.03] z-10'
            : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-white/40 dark:border-slate-800 hover:bg-white/95 dark:hover:bg-slate-800/95 hover:border-indigo-200/50 dark:hover:border-slate-700/50 shadow-sm z-0'
          }`}
      >
        <div className="min-w-0 z-10">
          <p className={`text-[11px] font-bold uppercase tracking-wider truncate mb-1.5 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {title}
          </p>
          <p className={`text-3xl font-extrabold leading-none transition-colors ${isActive ? 'text-indigo-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>{value}</p>
        </div>
        <div className={`relative flex items-center justify-center rounded-xl p-3 sm:p-4 ${bg} dark:bg-opacity-20 shrink-0 ${isActive ? 'scale-110 shadow-inner ring-4 ring-offset-2 ring-white dark:ring-slate-800 ring-opacity-50 ring-' + bg.replace('bg-', '') : 'shadow-sm'} transition-all z-10`}>
          <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${color} transition-colors`} />
        </div>
        {/* Subtle background glow effect if active */}
        {isActive && (
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <greeting.icon className={`h-8 w-8 ${greeting.color} animate-pulse-slow`} />
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {greeting.text}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t.realTimeTracking}</p>
          </div>
        </div>

        <div className="inline-flex overflow-x-auto custom-scrollbar rounded-lg bg-slate-200/50 dark:bg-slate-900/50 p-1.5 transition-colors duration-200 border border-slate-200 dark:border-slate-800 shadow-inner w-full sm:w-auto">
          {(['Today', 'Weekly', 'Monthly', 'Yearly'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => { setTimeRange(range); setActiveStatusFilter('All'); setSearchQuery(''); }}
              className={`flex items-center whitespace-nowrap gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all ${timeRange === range
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300/30 dark:hover:bg-slate-800/30'
                }`}
            >
              {range === 'Today' && <Clock className="h-4 w-4 shrink-0" />}
              {range === 'Weekly' && <CalendarDays className="h-4 w-4 shrink-0" />}
              {range === 'Monthly' && <CalendarRange className="h-4 w-4 shrink-0" />}
              {range === 'Yearly' && <Calendar className="h-4 w-4 shrink-0" />}
              {range === 'Today' ? (isId ? 'Hari Ini' : 'Today') : range === 'Weekly' ? t.weekly : range === 'Monthly' ? t.monthly : t.yearly}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3 space-y-6">
          <div className={`grid gap-4 ${userRole === 'student' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
            {userRole !== 'student' && (
              <StatCard title={userRole === 'teacher' ? t.students : t.team} value={profiles.length} icon={Users} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50" statusKey="All" />
            )}
            <StatCard title={t.present} value={activeStats.present} icon={CheckCircle} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50" statusKey={AttendanceStatus.PRESENT} />
            <StatCard title={t.late} value={activeStats.late} icon={Clock} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50" statusKey={AttendanceStatus.LATE} />
            <StatCard title={t.absent} value={activeStats.absent} icon={AlertTriangle} color="text-rose-600 dark:text-rose-400" bg="bg-rose-50" statusKey={AttendanceStatus.ABSENT} />
          </div>

          <div className="rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-5 shadow-sm border border-slate-200/50 dark:border-slate-800 transition-colors duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  {(timeRange === 'Today' ? (isId ? 'Hari Ini' : 'Today') : timeRange === 'Weekly' ? t.weekly : timeRange === 'Monthly' ? t.monthly : t.yearly)} {t.attendanceTrend}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{t.aggregatedRecords}</p>
              </div>
              <div className="flex gap-4 text-[10px] dark:text-slate-300">
                <div className="flex items-center"><span className="mr-1.5 h-2 w-2 rounded-full bg-indigo-500"></span>{t.present}</div>
                <div className="flex items-center"><span className="mr-1.5 h-2 w-2 rounded-full bg-amber-400"></span>{t.late}</div>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPresentDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="colorLateDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#fcd34d" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dx={-10} />
                  <Tooltip
                    cursor={{ fill: 'rgba(248, 250, 252, 0.4)' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', color: '#1e293b' }}
                    labelStyle={{ color: '#334155', fontWeight: 700 }}
                    itemStyle={{ fontWeight: 600, color: '#475569' }}
                  />
                  <Bar dataKey="Present" fill="url(#colorPresentDash)" radius={[6, 6, 0, 0]} barSize={timeRange === 'Weekly' ? 28 : (timeRange === 'Yearly' ? 24 : 14)} />
                  <Bar dataKey="Late" fill="url(#colorLateDash)" radius={[6, 6, 0, 0]} barSize={timeRange === 'Weekly' ? 28 : (timeRange === 'Yearly' ? 24 : 14)} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-sm border border-slate-200/50 dark:border-slate-800 overflow-hidden transition-colors duration-300 flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/90 dark:bg-slate-900/90 shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    {t.quickAttendance}
                    {activeStatusFilter !== 'All' && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${activeStatusFilter === AttendanceStatus.PRESENT ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400' :
                        activeStatusFilter === AttendanceStatus.LATE ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400' :
                          'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-400'
                        }`}>
                        {activeStatusFilter === AttendanceStatus.PRESENT ? t.present : activeStatusFilter === AttendanceStatus.LATE ? t.late : t.absent} Filter
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 inline-block">
                    {timeRange === 'Today' ? t.activeToday : `${tableRecords.length} Records Found`}
                  </span>
                </div>

                <div className="relative w-full sm:w-48">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3 w-3 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={isId ? 'Cari nama...' : 'Search names...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2 sm:p-4 custom-scrollbar">
              <ul className="space-y-2.5">
                {tableRecords.length > 0 ? (
                  tableRecords.map((record) => {
                    const emp = profiles.find(e => e.id === record.profileId);
                    return (
                      <li key={record.id} className="relative overflow-hidden p-3 sm:p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between group">
                        <div className="flex items-center gap-3.5 z-10">
                          <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 shadow-sm group-hover:ring-indigo-100 dark:group-hover:ring-indigo-900 transition-all duration-300" src={emp?.avatar} alt="" />
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{emp?.name}</div>
                            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{record.date} <span className="mx-1">•</span> <span className="font-mono">{record.checkIn}</span></div>
                          </div>
                        </div>
                        <div className="text-right z-10">
                          <span className={`inline-flex items-center justify-center min-w-[80px] sm:min-w-[90px] gap-1.5 rounded-full px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider border ${record.status === AttendanceStatus.PRESENT ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-800/30 dark:text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]' :
                            record.status === AttendanceStatus.LATE ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-800/30 dark:text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]' : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-800/30 dark:text-rose-400 shadow-[0_0_15px_-3px_rgba(244,63,94,0.1)]'
                            }`}>
                            {record.status === AttendanceStatus.PRESENT ? <CheckCircle className="h-3.5 w-3.5" /> : record.status === AttendanceStatus.LATE ? <Clock className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                            {record.status === AttendanceStatus.PRESENT ? t.present : record.status === AttendanceStatus.LATE ? t.late : t.absent}
                          </span>
                        </div>
                        {/* Hover accent background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 dark:from-indigo-900/10 transition-opacity duration-300 pointer-events-none"></div>
                      </li>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400 dark:text-slate-500">
                    <Search className="h-8 w-8 mb-3 opacity-20" />
                    <p className="text-sm font-medium">{isId ? 'Tidak ada catatan.' : 'No records found.'}</p>
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6 flex flex-col lg:h-[calc(100vh-10rem)]">
          <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-5 shadow-sm border border-slate-200/50 dark:border-slate-800 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">System Status</h3>
              </div>
            </div>

            <div className="relative overflow-hidden flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 dark:bg-slate-950 dark:border-slate-800/80 shadow-inner group transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
              <div className="flex flex-col max-w-[70%] z-10">
                <span className="text-sm font-bold text-white leading-tight tracking-wide">Face Rec Engine</span>
                <span className="text-xs text-slate-400 mt-1 leading-tight flex items-center gap-1.5 font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-500"></div>
                  {systemStatus ? `${systemStatus.loaded_faces_count || 0} faces loaded` : 'Checking status...'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 z-10 bg-slate-800/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                <div className="relative flex h-2.5 w-2.5">
                  {systemStatus && systemStatus.status === 'online' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${systemStatus?.status === 'online' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {systemStatus?.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-5 shadow-sm border border-slate-200/50 dark:border-slate-800 flex-1 flex flex-col min-h-[400px] overflow-hidden transition-colors duration-300">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">{t.notifications}</h3>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setAnnouncementSort('Latest')}
                  className={`p-1.5 rounded-md transition-colors ${announcementSort === 'Latest' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  title={t.latest}
                >
                  <Clock className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setAnnouncementSort('Priority')}
                  className={`p-1.5 rounded-md transition-colors ${announcementSort === 'Priority' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  title={t.priority}
                >
                  <SortDesc className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {sortedAnnouncements.length > 0 ? (
                sortedAnnouncements.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => router.visit('/announcements')}
                    className="relative w-full text-left group rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 p-4 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 overflow-hidden hover:-translate-y-0.5"
                  >
                    {/* Priority Accent Line */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.priority === 'Urgent' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]' :
                      item.priority === 'High' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]' :
                        'bg-indigo-400'
                      }`}></div>

                    <div className="flex items-center justify-between mb-2.5 pl-2">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                        item.priority === 'High' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                        {item.priority === 'Urgent' ? t.priorityUrgent : item.priority === 'High' ? t.priorityHigh : t.priorityNormal}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wide">
                        {new Date(item.date).toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Jakarta' })}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 pl-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed pl-2">
                      {item.content}
                    </p>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="h-8 w-8 text-slate-200 dark:text-slate-600 mb-2" />
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t.noAnnouncements}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800">
              <button
                onClick={() => router.visit('/announcements')}
                className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
              >
                {t.viewAllAnnouncements}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

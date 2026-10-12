import React, { useMemo, useState, useEffect } from 'react';
import { Profile, AttendanceRecord, AttendanceStatus, Announcement, Page } from '../types';
import { Users, Clock, AlertTriangle, CheckCircle, Bell, Filter, SortDesc, CalendarDays, CalendarRange, Calendar, ChevronLeft, ChevronRight, Server, Search, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { router } from '@inertiajs/react';
import { AcademicStudioDashboard } from './DashboardVariants/AcademicStudioDashboard';
import { CommandCenterDashboard } from './DashboardVariants/CommandCenterDashboard';
import { NordicMinimalDashboard } from './DashboardVariants/NordicMinimalDashboard';
import { KioskMonitorDashboard } from './DashboardVariants/KioskMonitorDashboard';
import { StatusWorkspaceDashboard } from './DashboardVariants/StatusWorkspaceDashboard';

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
  const [selectedVariant, setSelectedVariant] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('smartattend-dashboard-variant') || '2';
    }
    return '2';
  });

  useEffect(() => {
    const handleVariantSync = () => {
      if (typeof window !== 'undefined') {
        setSelectedVariant(localStorage.getItem('smartattend-dashboard-variant') || '2');
      }
    };
    window.addEventListener('storage', handleVariantSync);
    window.addEventListener('dashboard-variant-updated', handleVariantSync);
    return () => {
      window.removeEventListener('storage', handleVariantSync);
      window.removeEventListener('dashboard-variant-updated', handleVariantSync);
    };
  }, []);

  const [timeRange, setTimeRange] = useState<TimeRange>('Today');
  const [announcementSort, setAnnouncementSort] = useState<AnnouncementSort>('Latest');
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: '/' to search, 'Escape' to reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);
      if (isInput) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
          setSearchQuery('');
          setActiveStatusFilter('All');
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setActiveStatusFilter('All');
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const isId = t.dashboard === 'Dasbor';


  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: isId ? 'Selamat Pagi' : 'Good Morning', icon: Sunrise, color: 'text-amber-500' };
    if (hour >= 12 && hour < 17) return { text: isId ? 'Selamat Siang' : 'Good Afternoon', icon: Sun, color: 'text-amber-500' };
    if (hour >= 17 && hour < 20) return { text: isId ? 'Selamat Sore' : 'Good Evening', icon: Sunset, color: 'text-orange-500' };
    return { text: isId ? 'Selamat Malam' : 'Good Night', icon: Moon, color: 'text-sky-400' };
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
        role="button"
        aria-pressed={isClickable ? isActive : undefined}
        aria-label={`${title}: ${value}${isClickable ? (isActive ? ' (active filter, click to reset)' : ' (click to filter)') : ''}`}
        onClick={() => isClickable && setActiveStatusFilter(isActive ? 'All' : statusKey)}
        className={`relative w-full text-left rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all duration-200 ${isClickable ? 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer' : 'cursor-default'
          } ${isActive
            ? 'bg-white dark:bg-slate-900 border-2 border-theme-primary shadow-md ring-2 ring-theme-primary/20'
            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
          }`}
      >
        <div className="min-w-0 z-10">
          <p className={`text-[11px] font-bold uppercase tracking-wider truncate mb-1 transition-colors ${isActive ? 'text-theme-primary' : 'text-slate-500 dark:text-slate-400'}`}>
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">{value}</p>
        </div>
        <div className={`relative flex items-center justify-center rounded-xl p-3 shrink-0 ${bg} dark:bg-opacity-20 ${isActive ? 'scale-105 shadow-xs' : 'shadow-2xs'} transition-all z-10`}>
          <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${color} transition-colors`} />
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Render Selected Variant */}
      {selectedVariant === '2' && (
        <AcademicStudioDashboard
          profiles={profiles}
          attendance={attendance}
          announcements={announcements}
          t={t}
          userRole={userRole}
          systemStatus={systemStatus}
        />
      )}

      {selectedVariant === '1' && (
        <CommandCenterDashboard
          profiles={profiles}
          attendance={attendance}
          announcements={announcements}
          t={t}
          userRole={userRole}
          systemStatus={systemStatus}
        />
      )}

      {selectedVariant === '3' && (
        <NordicMinimalDashboard
          profiles={profiles}
          attendance={attendance}
          announcements={announcements}
          t={t}
          userRole={userRole}
          systemStatus={systemStatus}
        />
      )}

      {selectedVariant === '4' && (
        <KioskMonitorDashboard
          profiles={profiles}
          attendance={attendance}
          announcements={announcements}
          t={t}
          userRole={userRole}
          systemStatus={systemStatus}
        />
      )}

      {selectedVariant === '5' && (
        <StatusWorkspaceDashboard
          profiles={profiles}
          attendance={attendance}
          announcements={announcements}
          t={t}
          userRole={userRole}
          systemStatus={systemStatus}
        />
      )}

      {selectedVariant === 'classic' && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <greeting.icon className={`h-8 w-8 ${greeting.color} shrink-0`} />
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              {greeting.text}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">{t.realTimeTracking}</p>
          </div>
        </div>

        <div className="inline-flex overflow-x-auto custom-scrollbar rounded-xl bg-slate-200/70 dark:bg-slate-900 p-1 transition-colors duration-200 border border-slate-200 dark:border-slate-800 shadow-xs w-full sm:w-auto">
          {(['Today', 'Weekly', 'Monthly', 'Yearly'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => { setTimeRange(range); setActiveStatusFilter('All'); setSearchQuery(''); }}
              className={`flex items-center whitespace-nowrap gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${timeRange === range
                ? 'bg-white dark:bg-slate-800 text-theme-primary shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300/40 dark:hover:bg-slate-800/40'
                }`}
            >
              {range === 'Today' && <Clock className="h-3.5 w-3.5 shrink-0" />}
              {range === 'Weekly' && <CalendarDays className="h-3.5 w-3.5 shrink-0" />}
              {range === 'Monthly' && <CalendarRange className="h-3.5 w-3.5 shrink-0" />}
              {range === 'Yearly' && <Calendar className="h-3.5 w-3.5 shrink-0" />}
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

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-xs border border-slate-200 dark:border-slate-800 transition-colors duration-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {(timeRange === 'Today' ? (isId ? 'Hari Ini' : 'Today') : timeRange === 'Weekly' ? t.weekly : timeRange === 'Monthly' ? t.monthly : t.yearly)} {t.attendanceTrend}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t.aggregatedRecords}</p>
              </div>
              <div className="flex gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <div className="flex items-center"><span className="mr-1.5 h-2.5 w-2.5 rounded-full bg-theme-primary"></span>{t.present}</div>
                <div className="flex items-center"><span className="mr-1.5 h-2.5 w-2.5 rounded-full bg-amber-500"></span>{t.late}</div>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dx={-10} />
                  <Tooltip
                    cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.98)', color: '#0f172a' }}
                    labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                    itemStyle={{ fontWeight: 600, color: '#334155' }}
                  />
                  <Bar dataKey="Present" fill="var(--color-primary)" radius={[6, 6, 0, 0]} barSize={timeRange === 'Weekly' ? 24 : (timeRange === 'Yearly' ? 20 : 12)} />
                  <Bar dataKey="Late" fill="#d97706" radius={[6, 6, 0, 0]} barSize={timeRange === 'Weekly' ? 24 : (timeRange === 'Yearly' ? 20 : 12)} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200 flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    {t.quickAttendance}
                    {activeStatusFilter !== 'All' && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border inline-flex items-center gap-1 ${activeStatusFilter === AttendanceStatus.PRESENT ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' :
                        activeStatusFilter === AttendanceStatus.LATE ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300' :
                          'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                        }`}>
                        {activeStatusFilter === AttendanceStatus.PRESENT ? t.present : activeStatusFilter === AttendanceStatus.LATE ? t.late : t.absent} {t.filter || 'Filter'}
                      </span>
                    )}
                    {(activeStatusFilter !== 'All' || searchQuery) && (
                      <button
                        type="button"
                        onClick={() => { setActiveStatusFilter('All'); setSearchQuery(''); }}
                        className="text-[11px] font-semibold text-theme-primary hover:opacity-80 hover:underline flex items-center gap-0.5 transition-colors ml-1"
                        title="Reset all filters (Esc)"
                      >
                        ✕ {t.clearFilter || (isId ? 'Hapus Filter' : 'Clear')}
                      </button>
                    )}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 inline-block">
                    {timeRange === 'Today' && !searchQuery && activeStatusFilter === 'All' ? t.activeToday : `${tableRecords.length} ${t.recordsFound || 'Records Found'}`}
                  </span>
                </div>

                <div className="relative w-full sm:w-56">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t.searchNames || (isId ? 'Cari nama... (/)' : 'Search names... (/')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-8 pr-7 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-theme-primary/20 focus:border-theme-primary transition-all"
                  />
                  {!searchQuery ? (
                    <kbd className="hidden sm:inline-flex items-center justify-center absolute right-2 top-1.5 text-[9px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">
                      /
                    </kbd>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2 sm:p-3 custom-scrollbar">
              <ul className="space-y-2">
                {tableRecords.length > 0 ? (
                  tableRecords.map((record) => {
                    const emp = profiles.find(e => e.id === record.profileId);
                    return (
                      <li key={record.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl hover:border-theme-primary/40 hover:shadow-xs transition-all duration-200 flex items-center justify-between group">
                        <div className="flex items-center gap-3 min-w-0">
                          <img className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0" src={emp?.avatar} alt="" />
                          <div className="min-w-0 truncate">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-theme-primary transition-colors truncate">{emp?.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium flex items-center gap-1.5">
                              <span>{record.date}</span>
                              <span>•</span>
                              <span className="font-mono">{record.checkIn}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className={`inline-flex items-center justify-center min-w-[75px] gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${record.status === AttendanceStatus.PRESENT ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' :
                            record.status === AttendanceStatus.LATE ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300' : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                            }`}>
                            {record.status === AttendanceStatus.PRESENT ? <CheckCircle className="h-3 w-3" /> : record.status === AttendanceStatus.LATE ? <Clock className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                            {record.status === AttendanceStatus.PRESENT ? t.present : record.status === AttendanceStatus.LATE ? t.late : t.absent}
                          </span>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400 dark:text-slate-500">
                    <Search className="h-7 w-7 mb-2 opacity-30" />
                    <p className="text-xs font-medium">{t.noRecords || (isId ? 'Tidak ada catatan ditemukan.' : 'No records found.')}</p>
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6 flex flex-col lg:h-[calc(100vh-10rem)]">
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-xs border border-slate-200 dark:border-slate-800 transition-colors duration-200">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-theme-primary" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t.systemStatus || 'System Status'}</h3>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors duration-200">
              <div className="flex flex-col max-w-[70%]">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {t.faceRecEngine || 'Face Recognition Engine'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight flex items-center gap-1.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-600"></span>
                  {systemStatus && systemStatus.status === 'online'
                    ? `${systemStatus.loaded_faces_count || 0} ${t.facesLoaded || 'faces loaded'}`
                    : (t.deviceOfflineNotice || (isId ? 'Perangkat standby / offline' : 'Device in standby / disconnected'))
                  }
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="relative flex h-2 w-2">
                  {systemStatus && systemStatus.status === 'online' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400 dark:bg-slate-500"></span>
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${systemStatus?.status === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {systemStatus?.status === 'online' ? (t.online || 'Online') : (t.offline || 'Offline')}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-xs border border-slate-200 dark:border-slate-800 flex-1 flex flex-col min-h-[400px] overflow-hidden transition-colors duration-200">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-theme-primary" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t.notifications}</h3>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setAnnouncementSort('Latest')}
                  className={`p-1.5 rounded-lg transition-colors ${announcementSort === 'Latest' ? 'bg-theme-primary-light text-theme-primary-text font-bold' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  title={t.latest}
                  aria-label={t.latest}
                  aria-pressed={announcementSort === 'Latest'}
                >
                  <Clock className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAnnouncementSort('Priority')}
                  className={`p-1.5 rounded-lg transition-colors ${announcementSort === 'Priority' ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  title={t.priority}
                  aria-label={t.priority}
                  aria-pressed={announcementSort === 'Priority'}
                >
                  <SortDesc className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1.5 custom-scrollbar">
              {sortedAnnouncements.length > 0 ? (
                sortedAnnouncements.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => router.visit('/announcements')}
                    className="relative w-full text-left group rounded-xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-3.5 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-theme-primary/20 overflow-hidden"
                  >
                    {/* Priority Accent Line */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.priority === 'Urgent' ? 'bg-rose-500' :
                      item.priority === 'High' ? 'bg-amber-500' :
                        'bg-theme-primary'
                      }`} />

                    <div className="flex items-center justify-between mb-2 pl-2">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' :
                        item.priority === 'High' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                        {item.priority === 'Urgent' ? t.priorityUrgent : item.priority === 'High' ? t.priorityHigh : t.priorityNormal}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
                        {new Date(item.date).toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Jakarta' })}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1 pl-2 group-hover:text-theme-primary transition-colors line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed pl-2 font-normal">
                      {item.content}
                    </p>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{t.noAnnouncements}</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => router.visit('/announcements')}
                className="w-full text-center text-xs font-bold text-theme-primary hover:opacity-80 transition-colors"
              >
                {t.viewAllAnnouncements}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )}
</div>
);
};

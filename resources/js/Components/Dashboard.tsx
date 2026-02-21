import React, { useMemo, useState, useEffect } from 'react';
import { Employee, AttendanceRecord, AttendanceStatus, Announcement, Page } from '../types';
import { Users, Clock, AlertTriangle, CheckCircle, Bell, Filter, SortDesc, CalendarDays, CalendarRange, Calendar, ChevronLeft, ChevronRight, Server, Search, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { router } from '@inertiajs/react';

interface DashboardProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  t: any;
}

type TimeRange = 'Today' | 'Weekly' | 'Monthly' | 'Yearly';
type AnnouncementSort = 'Latest' | 'Priority';
type StatusFilter = 'All' | AttendanceStatus.PRESENT | AttendanceStatus.LATE | AttendanceStatus.ABSENT;

export const Dashboard: React.FC<DashboardProps> = ({ employees, attendance, announcements, t }) => {
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
    const interval = setInterval(fetchStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
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
        const emp = employees.find(e => e.id === r.employeeId);
        return emp?.name.toLowerCase().includes(query) || emp?.id.toLowerCase().includes(query);
      });
    }

    // Sort newest first
    return records.sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.checkIn || '00:00'}`).getTime();
      const timeB = new Date(`${b.date}T${b.checkIn || '00:00'}`).getTime();
      return timeB - timeA;
    });
  }, [filteredRecordsByTime, activeStatusFilter, searchQuery, employees]);

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
      const scale = Math.max(1, employees.length);
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
  }, [attendance, timeRange, employees.length, t.language]);

  const StatCard = ({ title, value, icon: Icon, color, bg, statusKey }: any) => {
    const isActive = activeStatusFilter === statusKey;
    const isClickable = statusKey !== 'All'; // "Team" card isn't filtered

    return (
      <button
        type="button"
        onClick={() => isClickable && setActiveStatusFilter(isActive ? 'All' : statusKey)}
        className={`w-full text-left rounded-xl p-4 shadow-sm flex items-center gap-4 transition-all duration-300 ${isClickable ? 'hover:-translate-y-1 hover:shadow-md cursor-pointer' : 'cursor-default'
          } ${isActive
            ? 'bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-indigo-200 dark:border-indigo-500/30 ring-2 ring-indigo-500/20 shadow-indigo-500/10'
            : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 dark:border-slate-800 hover:bg-white/95 dark:hover:bg-slate-900/90 hover:border-indigo-100/50 dark:hover:border-slate-700/50'
          }`}
      >
        <div className={`rounded-full p-3 ${bg} dark:bg-opacity-20 shrink-0 ${isActive ? 'scale-110' : ''} transition-transform`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className={`text-[11px] font-bold uppercase tracking-wider truncate mb-1 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{value}</p>
        </div>
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

        <div className="inline-flex rounded-lg bg-slate-200/50 dark:bg-slate-900/50 p-1.5 transition-colors duration-200 border border-slate-200 dark:border-slate-800 shadow-inner">
          {(['Today', 'Weekly', 'Monthly', 'Yearly'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => { setTimeRange(range); setActiveStatusFilter('All'); setSearchQuery(''); }}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all ${timeRange === range
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300/30 dark:hover:bg-slate-800/30'
                }`}
            >
              {range === 'Today' && <Clock className="h-4 w-4" />}
              {range === 'Weekly' && <CalendarDays className="h-4 w-4" />}
              {range === 'Monthly' && <CalendarRange className="h-4 w-4" />}
              {range === 'Yearly' && <Calendar className="h-4 w-4" />}
              {range === 'Today' ? (isId ? 'Hari Ini' : 'Today') : range === 'Weekly' ? t.weekly : range === 'Monthly' ? t.monthly : t.yearly}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3 space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard title={t.team} value={employees.length} icon={Users} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50" statusKey="All" />
            <StatCard title={t.present} value={activeStats.present} icon={CheckCircle} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50" statusKey={AttendanceStatus.PRESENT} />
            <StatCard title={t.late} value={activeStats.late} icon={Clock} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50" statusKey={AttendanceStatus.LATE} />
            <StatCard title={t.absent} value={activeStats.absent} icon={AlertTriangle} color="text-rose-600 dark:text-rose-400" bg="bg-rose-50" statusKey={AttendanceStatus.ABSENT} />
          </div>

          <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 shadow-sm border border-white/20 dark:border-slate-800 transition-colors duration-300">
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                  />
                  <Bar dataKey="Present" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={timeRange === 'Weekly' ? 32 : 16} />
                  <Bar dataKey="Late" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={timeRange === 'Weekly' ? 32 : 16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border border-white/20 dark:border-slate-800 overflow-hidden transition-colors duration-300 flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 shrink-0">
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

            <div className="overflow-y-auto flex-1 p-0 custom-scrollbar">
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {tableRecords.length > 0 ? (
                  tableRecords.map((record) => {
                    const emp = employees.find(e => e.id === record.employeeId);
                    return (
                      <li key={record.id} className="p-4 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <img className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 group-hover:border-indigo-300 dark:group-hover:border-indigo-600 transition-colors" src={emp?.avatar} alt="" />
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-200">{emp?.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{record.date} • {record.checkIn}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${record.status === AttendanceStatus.PRESENT ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            record.status === AttendanceStatus.LATE ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
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
                    <Search className="h-8 w-8 mb-3 opacity-20" />
                    <p className="text-sm font-medium">{isId ? 'Tidak ada catatan.' : 'No records found.'}</p>
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6 flex flex-col lg:h-[calc(100vh-10rem)]">
          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 shadow-sm border border-white/20 dark:border-slate-800 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">System Status</h3>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700 transition-colors duration-300">
              <div className="flex flex-col max-w-[70%]">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Face Rec Engine</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  {systemStatus ? `${systemStatus.loaded_faces_count || 0} faces loaded` : 'Checking status...'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative flex h-2.5 w-2.5">
                  {systemStatus && systemStatus.status === 'online' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${systemStatus?.status === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {systemStatus?.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 shadow-sm border border-white/20 dark:border-slate-800 flex-1 flex flex-col min-h-[400px] overflow-hidden transition-colors duration-300">
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
                    className="w-full text-left group rounded-xl border border-slate-200/50 dark:border-slate-800/50 p-4 transition-all hover:bg-white/90 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border dark:border-slate-700 dark:text-slate-300`}>
                        {item.priority === 'Urgent' ? t.priorityUrgent : item.priority === 'High' ? t.priorityHigh : t.priorityNormal}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {new Date(item.date).toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Jakarta' })}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
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

import React, { useMemo, useState, useEffect } from 'react';
import { Employee, AttendanceRecord, AttendanceStatus, Announcement, Page } from '../types';
import { Users, Clock, AlertTriangle, CheckCircle, Bell, Filter, SortDesc, CalendarDays, CalendarRange, Calendar, ChevronLeft, ChevronRight, Server } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { router } from '@inertiajs/react';

interface DashboardProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  t: any;
}

type TimeRange = 'Weekly' | 'Monthly' | 'Yearly';
type AnnouncementSort = 'Latest' | 'Priority';

export const Dashboard: React.FC<DashboardProps> = ({ employees, attendance, announcements, t }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('Weekly');
  const [announcementSort, setAnnouncementSort] = useState<AnnouncementSort>('Latest');
  const [attendancePage, setAttendancePage] = useState(1);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const ATTENDANCE_ROWS_PER_PAGE = 5;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

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

  const todaysStats = useMemo(() => {
    const todaysRecords = attendance.filter(r => r.date === today);
    return {
      present: todaysRecords.filter(r => r.status === AttendanceStatus.PRESENT).length,
      late: todaysRecords.filter(r => r.status === AttendanceStatus.LATE).length,
      absent: todaysRecords.filter(r => r.status === AttendanceStatus.ABSENT).length,
      records: todaysRecords,
    };
  }, [attendance, today]);

  const totalAttendancePages = Math.ceil(todaysStats.records.length / ATTENDANCE_ROWS_PER_PAGE);
  const paginatedTodaysRecords = useMemo(() => {
    const start = (attendancePage - 1) * ATTENDANCE_ROWS_PER_PAGE;
    return todaysStats.records.slice(start, start + ATTENDANCE_ROWS_PER_PAGE);
  }, [todaysStats.records, attendancePage]);

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
    const limit = timeRange === 'Weekly' ? 7 : 30;
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
    return Object.values(days);
  }, [attendance, timeRange, employees.length, t.language]);

  const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
    <div className={`rounded-xl bg-white dark:bg-slate-800 p-3 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3 transition-colors duration-200`}>
      <div className={`rounded-full p-2.5 ${bg} dark:bg-opacity-20 shrink-0`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{title}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white leading-none mt-1">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.dashboard}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.realTimeTracking}</p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-200 dark:bg-slate-800 p-1 transition-colors duration-200">
          {(['Weekly', 'Monthly', 'Yearly'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => { setTimeRange(range); setAttendancePage(1); }}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${timeRange === range
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-slate-700/50'
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard title={t.team} value={employees.length} icon={Users} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50" />
            <StatCard title={t.present} value={todaysStats.present} icon={CheckCircle} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50" />
            <StatCard title={t.late} value={todaysStats.late} icon={Clock} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50" />
            <StatCard title={t.absent} value={todaysStats.absent} icon={AlertTriangle} color="text-rose-600 dark:text-rose-400" bg="bg-rose-50" />
          </div>

          <div className="rounded-xl bg-white dark:bg-slate-800 p-5 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{(timeRange === 'Weekly' ? t.weekly : timeRange === 'Monthly' ? t.monthly : t.yearly) + " " + t.attendanceTrend}</h3>
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

          <div className="rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center transition-colors duration-200">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{t.quickAttendance}</h3>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.activeToday}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800 transition-colors duration-200">
                  {paginatedTodaysRecords.length > 0 ? (
                    paginatedTodaysRecords.map((record) => {
                      const emp = employees.find(e => e.id === record.employeeId);
                      return (
                        <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <img className="h-7 w-7 rounded-full object-cover border border-slate-100 dark:border-slate-600" src={emp?.avatar} alt="" />
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{emp?.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${record.status === AttendanceStatus.PRESENT ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                              record.status === AttendanceStatus.LATE ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                              }`}>
                              {record.status === AttendanceStatus.PRESENT ? t.present : record.status === AttendanceStatus.LATE ? t.late : t.absent}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        {t.noRecordsToday}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalAttendancePages > 1 && (
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 transition-colors duration-200">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.page} <span className="font-medium text-slate-700 dark:text-slate-200">{attendancePage}</span> {t.of} <span className="font-medium text-slate-700 dark:text-slate-200">{totalAttendancePages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={attendancePage === 1}
                    onClick={() => setAttendancePage(p => p - 1)}
                    className="p-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={attendancePage === totalAttendancePages}
                    onClick={() => setAttendancePage(p => p + 1)}
                    className="p-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 flex flex-col lg:h-[calc(100vh-10rem)]">
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">System Status</h3>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 transition-colors duration-200">
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

          <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex-1 flex flex-col min-h-[400px] overflow-hidden transition-colors duration-200">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">{t.notifications}</h3>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setAnnouncementSort('Latest')}
                  className={`p-1.5 rounded-md transition-colors ${announcementSort === 'Latest' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  title={t.latest}
                >
                  <Clock className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setAnnouncementSort('Priority')}
                  className={`p-1.5 rounded-md transition-colors ${announcementSort === 'Priority' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
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
                    className="w-full text-left group rounded-xl border border-slate-100 dark:border-slate-700 p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border dark:border-slate-600 dark:text-slate-300`}>
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

            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-700">
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

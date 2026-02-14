import React, { useMemo, useState } from 'react';
import { Employee, AttendanceRecord, AttendanceStatus, Announcement, Page } from '../types';
import { Users, Clock, AlertTriangle, CheckCircle, Bell, Filter, SortDesc, CalendarDays, CalendarRange, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  onNavigate: (page: Page) => void;
}

type TimeRange = 'Weekly' | 'Monthly' | 'Yearly';
type AnnouncementSort = 'Latest' | 'Priority';

export const Dashboard: React.FC<DashboardProps> = ({ employees, attendance, announcements, onNavigate }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('Weekly');
  const [announcementSort, setAnnouncementSort] = useState<AnnouncementSort>('Latest');
  const [attendancePage, setAttendancePage] = useState(1);
  const ATTENDANCE_ROWS_PER_PAGE = 5;
  const today = new Date().toISOString().split('T')[0];

  // Today's specific stats for the cards
  const todaysStats = useMemo(() => {
    const todaysRecords = attendance.filter(r => r.date === today);
    return {
      present: todaysRecords.filter(r => r.status === AttendanceStatus.PRESENT).length,
      late: todaysRecords.filter(r => r.status === AttendanceStatus.LATE).length,
      absent: todaysRecords.filter(r => r.status === AttendanceStatus.ABSENT).length,
      records: todaysRecords,
    };
  }, [attendance, today]);

  // Attendance Pagination Logic
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
    // Limit to 5 max as per request
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
      const dateStr = d.toISOString().split('T')[0];
      days[dateStr] = { 
        name: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }), 
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
  }, [attendance, timeRange, employees.length]);

  const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
    <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 flex items-center gap-3">
      <div className={`rounded-full p-2.5 ${bg} shrink-0`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{title}</p>
        <p className="text-xl font-bold text-slate-900 leading-none mt-1">{value}</p>
      </div>
    </div>
  );

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'High': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500 text-sm">Real-time attendance tracking and announcements.</p>
        </div>
        
        <div className="inline-flex rounded-lg bg-slate-200 p-1">
          {(['Weekly', 'Monthly', 'Yearly'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => { setTimeRange(range); setAttendancePage(1); }}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                timeRange === range
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range === 'Weekly' && <CalendarDays className="h-3.5 w-3.5" />}
              {range === 'Monthly' && <CalendarRange className="h-3.5 w-3.5" />}
              {range === 'Yearly' && <Calendar className="h-3.5 w-3.5" />}
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Main Section */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard title="Team" value={employees.length} icon={Users} color="text-blue-600" bg="bg-blue-50" />
            <StatCard title="Present" value={todaysStats.present} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard title="Late" value={todaysStats.late} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
            <StatCard title="Absent" value={todaysStats.absent} icon={AlertTriangle} color="text-rose-600" bg="bg-rose-50" />
          </div>

          {/* Chart Section - Made more compact */}
          <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">{timeRange} Attendance Trend</h3>
                <p className="text-[10px] text-slate-500">Aggregated records for the selected period</p>
              </div>
              <div className="flex gap-4 text-[10px]">
                <div className="flex items-center"><span className="mr-1.5 h-2 w-2 rounded-full bg-indigo-500"></span>Present</div>
                <div className="flex items-center"><span className="mr-1.5 h-2 w-2 rounded-full bg-amber-400"></span>Late</div>
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

          {/* Today Table (Condensed with Pagination) */}
          <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 text-sm">Quick Attendance View</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Today</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedTodaysRecords.length > 0 ? (
                    paginatedTodaysRecords.map((record) => {
                      const emp = employees.find(e => e.id === record.employeeId);
                      return (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <img className="h-7 w-7 rounded-full object-cover" src={emp?.avatar} alt="" />
                              <div className="text-sm font-medium text-slate-900">{emp?.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              record.status === AttendanceStatus.PRESENT ? 'bg-emerald-100 text-emerald-800' : 
                              record.status === AttendanceStatus.LATE ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-sm text-slate-500">
                        No records for today yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalAttendancePages > 1 && (
              <div className="px-6 py-3 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Page <span className="font-medium">{attendancePage}</span> of <span className="font-medium">{totalAttendancePages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={attendancePage === 1}
                    onClick={() => setAttendancePage(p => p - 1)}
                    className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={attendancePage === totalAttendancePages}
                    onClick={() => setAttendancePage(p => p + 1)}
                    className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Panel - Announcements (Limited to 5) */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-indigo-500" />
                <h3 className="font-bold text-slate-900">Notifications</h3>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setAnnouncementSort('Latest')}
                  className={`p-1.5 rounded-md transition-colors ${announcementSort === 'Latest' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
                  title="Sort by Latest"
                >
                  <Clock className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setAnnouncementSort('Priority')}
                  className={`p-1.5 rounded-md transition-colors ${announcementSort === 'Priority' ? 'bg-rose-50 text-rose-600' : 'text-slate-400 hover:bg-slate-100'}`}
                  title="Sort by Priority"
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
                    onClick={() => onNavigate(Page.ANNOUNCEMENTS)}
                    className="w-full text-left group rounded-xl border border-slate-100 p-4 transition-all hover:bg-slate-50 hover:border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${getPriorityStyle(item.priority)}`}>
                        {item.priority}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="h-8 w-8 text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400">No announcements found</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50">
              <button 
                onClick={() => onNavigate(Page.ANNOUNCEMENTS)}
                className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                View All Announcements
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Profile, AttendanceRecord, AttendanceStatus, Announcement } from '../../types';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Bell,
  CalendarDays,
  CalendarRange,
  Calendar,
  Server,
  Search,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { router } from '@inertiajs/react';

interface VariantProps {
  profiles: Profile[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  t: any;
  userRole?: string;
  systemStatus: any;
}

type TimeRange = 'Weekly' | 'Monthly' | 'Yearly';
type StatusFilter = 'All' | AttendanceStatus.PRESENT | AttendanceStatus.LATE | AttendanceStatus.ABSENT;

export const AcademicStudioDashboard: React.FC<VariantProps> = ({
  profiles,
  attendance,
  announcements,
  t,
  userRole,
  systemStatus
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('Weekly');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isId = t.dashboard === 'Dasbor';
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);
      if (isInput) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
          setSearchQuery('');
          setStatusFilter('All');
        }
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setStatusFilter('All');
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Today records calculation
  const todayRecords = useMemo(() => {
    return attendance.filter((r) => r.date === today);
  }, [attendance, today]);

  const todayStats = useMemo(() => {
    const present = todayRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const late = todayRecords.filter((r) => r.status === AttendanceStatus.LATE).length;
    const absent = todayRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const totalRecorded = todayRecords.length;
    const onTimeRate = totalRecorded > 0 ? Math.round((present / totalRecorded) * 100) : 0;

    // Average check-in calculation
    const checkIns = todayRecords.filter((r) => r.checkIn).map((r) => r.checkIn!);
    let avgCheckIn = '--:--';
    if (checkIns.length > 0) {
      const totalMinutes = checkIns.reduce((acc, cur) => {
        const [h, m] = cur.split(':').map(Number);
        return acc + h * 60 + m;
      }, 0);
      const avgM = Math.round(totalMinutes / checkIns.length);
      const hStr = String(Math.floor(avgM / 60)).padStart(2, '0');
      const mStr = String(avgM % 60).padStart(2, '0');
      avgCheckIn = `${hStr}:${mStr} WIB`;
    }

    return { present, late, absent, totalRecorded, onTimeRate, avgCheckIn };
  }, [todayRecords]);

  // Chart data calculation
  const chartData = useMemo(() => {
    if (timeRange === 'Yearly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.slice(0, 10).map((name) => ({
        name,
        Hadir: Math.floor(Math.random() * 8) + 12,
        Terlambat: Math.floor(Math.random() * 3) + 1,
      }));
    }

    const days: Record<string, any> = {};
    const count = timeRange === 'Weekly' ? 7 : 30;
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      days[dateStr] = {
        name: d.toLocaleDateString(isId ? 'id-ID' : 'en-US', { weekday: 'short', day: 'numeric', timeZone: 'Asia/Jakarta' }),
        Hadir: 0,
        Terlambat: 0
      };
    }

    attendance.forEach((r) => {
      if (days[r.date]) {
        if (r.status === AttendanceStatus.PRESENT) days[r.date].Hadir++;
        if (r.status === AttendanceStatus.LATE) days[r.date].Terlambat++;
      }
    });

    return Object.values(days);
  }, [attendance, timeRange, isId]);

  // Filtered table records
  const tableRecords = useMemo(() => {
    let records = todayRecords;
    if (statusFilter !== 'All') {
      records = records.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      records = records.filter((r) => {
        const emp = profiles.find((p) => p.id === r.profileId);
        return emp?.name.toLowerCase().includes(q) || emp?.id.toLowerCase().includes(q) || emp?.department?.toLowerCase().includes(q);
      });
    }
    return records.sort((a, b) => (b.checkIn || '00:00').localeCompare(a.checkIn || '00:00'));
  }, [todayRecords, statusFilter, searchQuery, profiles]);

  return (
    <div className="space-y-7">
      {/* Editorial Header Section */}
      <section className="border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              {isId ? 'Sesi Akademik Aktif' : 'Active Academic Session'}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {isId ? 'Ringkasan Eksekutif Kehadiran' : 'Executive Attendance Brief'}
            </h1>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed max-w-2xl">
              {isId
                ? `Hari ini tercatat ${todayStats.present} hadir tepat waktu, ${todayStats.late} terlambat, dan ${todayStats.absent} belum tercatat dari ${todayStats.totalRecorded || profiles.length} siswa & pengajar.`
                : `Today records ${todayStats.present} on-time, ${todayStats.late} late arrivals, and ${todayStats.absent} absences across ${todayStats.totalRecorded || profiles.length} enrolled members.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.visit('/reports')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all shadow-xs"
            >
              <Activity className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>{isId ? 'Laporan Rinci' : 'Detailed Report'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Row 1: Minimalist Metric Tiles (Bento Top) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Total Enrolled */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{isId ? 'Total Terdaftar' : 'Total Enrolled'}</span>
            <Users className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {profiles.length}
          </div>
          <div className="mt-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            {isId ? 'Siswa, pengajar & staf aktif' : 'Active students & teachers'}
          </div>
        </div>

        {/* Tile 2: On-Time Rate */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{isId ? 'Rasio Tepat Waktu' : 'On-Time Rate'}</span>
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight flex items-baseline gap-1.5">
            <span>{todayStats.onTimeRate}%</span>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 font-normal">
              ({todayStats.present}/{todayStats.totalRecorded})
            </span>
          </div>
          <div className="mt-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            {isId ? 'Memenuhi batas toleransi jam' : 'Within scheduled tolerance'}
          </div>
        </div>

        {/* Tile 3: Avg Check-In */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{isId ? 'Rata-Rata Masuk' : 'Avg Check-In'}</span>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight font-mono">
            {todayStats.avgCheckIn}
          </div>
          <div className="mt-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            {isId ? 'Pagi hari (WIB)' : 'Morning arrivals'}
          </div>
        </div>

        {/* Tile 4: Hardware Terminal */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{isId ? 'Terminal Pemindai' : 'Hardware Terminal'}</span>
            <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold text-zinc-800 dark:text-zinc-200 tracking-tight flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${systemStatus?.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'}`}></span>
            <span>{systemStatus?.status === 'online' ? 'Online' : 'Offline'}</span>
          </div>
          <div className="mt-3 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
            {systemStatus?.status === 'online'
              ? `${systemStatus.loaded_faces_count || 0} ${isId ? 'wajah terdaftar' : 'faces loaded'}`
              : (isId ? 'Perangkat terputus / offline' : 'Device disconnected / offline')}
          </div>
        </div>
      </section>

      {/* Row 2: Bento Grid 2:1 (Analytics + Diagnostics & Notices) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bento Main (Col 2/3): Trend Analytics */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/90 rounded-2xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>{isId ? 'Analitik Fluktuasi Kehadiran' : 'Attendance Fluctuations'}</span>
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {isId ? 'Perbandingan volume kehadiran tepat waktu vs terlambat' : 'Volume ratio of on-time versus late arrivals'}
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-1 border border-zinc-200 dark:border-zinc-700/80">
              {(['Weekly', 'Monthly', 'Yearly'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    timeRange === range
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {range === 'Weekly' ? (isId ? 'Mingguan' : 'Weekly') : range === 'Monthly' ? (isId ? 'Bulanan' : 'Monthly') : (isId ? 'Tahunan' : 'Yearly')}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#71717a" strokeOpacity={0.15} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 500 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(113, 113, 122, 0.08)' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgba(228, 228, 231, 0.8)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
                    fontSize: '12px',
                    backgroundColor: '#ffffff',
                    color: '#18181b'
                  }}
                  labelStyle={{ fontWeight: 700, color: '#09090b' }}
                />
                <Bar dataKey="Hadir" fill="var(--color-primary)" radius={[6, 6, 0, 0]} barSize={timeRange === 'Weekly' ? 24 : 14} />
                <Bar dataKey="Terlambat" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={timeRange === 'Weekly' ? 24 : 14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-theme-primary"></span>
                {isId ? 'Hadir Tepat Waktu' : 'Present'}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                {isId ? 'Terlambat' : 'Late'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">{today}</span>
          </div>
        </div>

        {/* Bento Secondary (Col 1/3): Diagnostic & Announcements Stack */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Diagnostic Card */}
          <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isId ? 'Kesehatan Perangkat' : 'Device Health'}</span>
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                WIB 07:00-16:00
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-600 dark:text-zinc-300 font-medium">ESP32 RFID Engine</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Ready
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-600 dark:text-zinc-300 font-medium">Face Recognition Cam</span>
                <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400 font-semibold text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
                  Standby
                </span>
              </div>
            </div>
          </div>

          {/* Announcements Card */}
          <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>{isId ? 'Warta & Pengumuman' : 'Announcements'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => router.visit('/announcements')}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>{isId ? 'Semua' : 'All'}</span>
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-3">
                {announcements.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => router.visit('/announcements')}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        item.priority === 'Urgent'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          : item.priority === 'High'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-zinc-200/60 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                      }`}>
                        {item.priority}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(item.date).toLocaleDateString(isId ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
              <span className="text-[11px] text-zinc-400 font-medium">
                {isId ? 'Dipublikasikan oleh Administrator' : 'Published by Administration'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Row 3: Modular Attendance Table */}
      <section className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
        {/* Table Header & Toolbar */}
        <div className="p-5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>{isId ? 'Log Kehadiran Hari Ini' : 'Today Attendance Log'}</span>
              {statusFilter !== 'All' && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                  {statusFilter}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {tableRecords.length} {isId ? 'data ditemukan untuk tanggal' : 'records found for'} <span className="font-mono">{today}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter Buttons */}
            <div className="inline-flex rounded-xl bg-white dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
              {(['All', AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.ABSENT] as StatusFilter[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? 'bg-zinc-900 dark:bg-zinc-700 text-white shadow-xs font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {st === 'All' ? (isId ? 'Semua' : 'All') : st === AttendanceStatus.PRESENT ? (isId ? 'Hadir' : 'Present') : st === AttendanceStatus.LATE ? (isId ? 'Telat' : 'Late') : (isId ? 'Absen' : 'Absent')}
                </button>
              ))}
            </div>

            {/* Search Input with Hotkey */}
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={isId ? 'Cari nama... (/)' : 'Search names... (/)'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center justify-center absolute right-2 top-2 text-[9px] font-mono px-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400">
                  /
                </kbd>
              )}
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-50/30 dark:bg-zinc-900/30">
                <th className="py-3 px-5">{isId ? 'Profil Siswa / Pengajar' : 'Member Profile'}</th>
                <th className="py-3 px-4">{isId ? 'Peran / Divisi' : 'Role & Dept'}</th>
                <th className="py-3 px-4 text-center">{isId ? 'Jam Masuk' : 'Check In'}</th>
                <th className="py-3 px-4 text-center">{isId ? 'Status Presensi' : 'Status'}</th>
                <th className="py-3 px-5 text-right">{isId ? 'Aksi Cepat' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-xs">
              {tableRecords.length > 0 ? (
                tableRecords.map((record) => {
                  const emp = profiles.find((p) => p.id === record.profileId);
                  return (
                    <tr key={record.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp?.name || 'User')}&background=random`}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{emp?.name || record.profileId}</div>
                            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{record.profileId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 font-medium">
                        <div>{emp?.department || emp?.class || '-'}</div>
                        <div className="text-[10px] text-zinc-400 capitalize">{emp?.role || 'Member'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                        {record.checkIn || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          record.status === AttendanceStatus.PRESENT
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                            : record.status === AttendanceStatus.LATE
                            ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                            : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                        }`}>
                          {record.status === AttendanceStatus.PRESENT ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : record.status === AttendanceStatus.LATE ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => router.visit('/reports')}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {isId ? 'Riwayat' : 'History'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <Search className="h-7 w-7 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">{isId ? 'Tidak ada catatan presensi yang sesuai.' : 'No matching attendance records found.'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

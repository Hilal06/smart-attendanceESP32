import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Profile, AttendanceRecord, AttendanceStatus, Announcement } from '../../types';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Bell,
  Search,
  Filter,
  CheckCheck,
  ChevronRight,
  TrendingUp,
  FileText
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

export const NordicMinimalDashboard: React.FC<VariantProps> = ({
  profiles,
  attendance,
  announcements,
  t,
  userRole,
  systemStatus
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isId = t.dashboard === 'Dasbor';
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

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

  const todayRecords = useMemo(() => {
    return attendance.filter((r) => r.date === today);
  }, [attendance, today]);

  const stats = useMemo(() => {
    const present = todayRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const late = todayRecords.filter((r) => r.status === AttendanceStatus.LATE).length;
    const absent = todayRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const total = todayRecords.length;
    return { present, late, absent, total };
  }, [todayRecords]);

  const chartData = useMemo(() => {
    const days: Record<string, any> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      days[dateStr] = {
        name: d.toLocaleDateString(isId ? 'id-ID' : 'en-US', { weekday: 'short', timeZone: 'Asia/Jakarta' }),
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
  }, [attendance, isId]);

  const tableRecords = useMemo(() => {
    let list = todayRecords;
    if (statusFilter !== 'All') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => {
        const emp = profiles.find((p) => p.id === r.profileId);
        return emp?.name.toLowerCase().includes(q) || emp?.id.toLowerCase().includes(q);
      });
    }
    return list.sort((a, b) => (b.checkIn || '00:00').localeCompare(a.checkIn || '00:00'));
  }, [todayRecords, statusFilter, searchQuery, profiles]);

  return (
    <div className="space-y-6">
      {/* Calm Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {isId ? 'Presensi Harian Terpadu' : 'Daily Attendance Overview'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isId ? 'Ruang kerja presensi tenang dan efisien untuk pemantauan harian.' : 'Calm, focused workspace for day-to-day attendance tracking.'}
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
          WIB • {today}
        </div>
      </div>

      {/* Integrated Single-Strip KPI Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 text-xs">
        <div className="flex items-center gap-3 pr-4">
          <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">{isId ? 'Terdaftar' : 'Enrolled'}</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">{profiles.length}</span>
        </div>

        <div className="flex items-center gap-3 px-4 pt-2 sm:pt-0">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="text-slate-600 dark:text-slate-300 font-semibold">{isId ? 'Hadir' : 'Present'}</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">{stats.present}</span>
        </div>

        <div className="flex items-center gap-3 px-4 pt-2 sm:pt-0">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span className="text-slate-600 dark:text-slate-300 font-semibold">{isId ? 'Terlambat' : 'Late'}</span>
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">{stats.late}</span>
        </div>

        <div className="flex items-center gap-3 px-4 pt-2 sm:pt-0">
          <span className="h-2 w-2 rounded-full bg-rose-500"></span>
          <span className="text-slate-600 dark:text-slate-300 font-semibold">{isId ? 'Absen' : 'Absent'}</span>
          <span className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">{stats.absent}</span>
        </div>

        <div className="flex items-center gap-2 pl-4 pt-2 sm:pt-0 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
          <span>{isId ? 'Terminal: Standby' : 'Terminal: Standby'}</span>
        </div>
      </div>

      {/* Main Workhorse Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {isId ? 'Daftar Presensi Hari Ini' : 'Today Attendance Log'}
            </span>
            <span className="text-[11px] font-mono text-slate-400">({tableRecords.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
              {(['All', AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.ABSENT] as string[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st === 'All' ? (isId ? 'Semua' : 'All') : st === AttendanceStatus.PRESENT ? (isId ? 'Hadir' : 'Present') : st === AttendanceStatus.LATE ? (isId ? 'Telat' : 'Late') : (isId ? 'Absen' : 'Absent')}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-44">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={isId ? 'Cari (/)...' : 'Search (/)...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-6 py-1 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-2.5 px-4">{isId ? 'Nama Lengkap' : 'Name'}</th>
                <th className="py-2.5 px-4">{isId ? 'Identitas / Kelas' : 'ID & Department'}</th>
                <th className="py-2.5 px-4 text-center">{isId ? 'Jam Masuk' : 'Check-In'}</th>
                <th className="py-2.5 px-4 text-center">{isId ? 'Status' : 'Status'}</th>
                <th className="py-2.5 px-4 text-right">{isId ? 'Tindakan' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tableRecords.length > 0 ? (
                tableRecords.map((r) => {
                  const emp = profiles.find((p) => p.id === r.profileId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {emp?.name || r.profileId}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {emp?.department || emp?.class || '-'} • {emp?.id}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                        {r.checkIn || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          r.status === AttendanceStatus.PRESENT
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : r.status === AttendanceStatus.LATE
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.status === AttendanceStatus.ABSENT ? (
                          <button
                            type="button"
                            onClick={() => router.visit('/requests')}
                            className="text-[11px] font-semibold text-theme-primary hover:underline"
                          >
                            {isId ? 'Cek Izin' : 'Check Request'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => router.visit('/reports')}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          >
                            {isId ? 'Riwayat' : 'History'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    {isId ? 'Tidak ada data presensi.' : 'No attendance data.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row: Analytics & Announcements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Trend Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            <span>{isId ? 'Grafik Mingguan' : 'Weekly Trend'}</span>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" strokeOpacity={0.15} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="Hadir" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="Terlambat" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notices */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            <span>{isId ? 'Papan Warta & Pengumuman' : 'Notices & Bulletins'}</span>
            <Bell className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-2 text-xs">
            {announcements.slice(0, 3).map((a) => (
              <div
                key={a.id}
                onClick={() => router.visit('/announcements')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{a.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {new Date(a.date).toLocaleDateString(isId ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

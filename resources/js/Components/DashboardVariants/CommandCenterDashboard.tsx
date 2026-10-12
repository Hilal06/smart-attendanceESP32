import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Profile, AttendanceRecord, AttendanceStatus, Announcement } from '../../types';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Bell,
  Server,
  Search,
  Download,
  Filter,
  Activity,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Shield,
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

export const CommandCenterDashboard: React.FC<VariantProps> = ({
  profiles,
  attendance,
  announcements,
  t,
  userRole,
  systemStatus
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isId = t.dashboard === 'Dasbor';
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);
      if (isInput) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
          setSearchQuery('');
          setStatusFilter('All');
          setSelectedDept('All');
        }
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setStatusFilter('All');
        setSelectedDept('All');
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
    const total = profiles.length || 1;
    return {
      present,
      late,
      absent,
      presentPct: Math.round((present / total) * 100),
      latePct: Math.round((late / total) * 100),
      absentPct: Math.round((absent / total) * 100)
    };
  }, [todayRecords, profiles]);

  // Unique departments for quick filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach((p) => {
      if (p.department) set.add(p.department);
      if (p.class) set.add(p.class);
    });
    return Array.from(set).slice(0, 5);
  }, [profiles]);

  // Chart 7-day data
  const chartData = useMemo(() => {
    const days: Record<string, any> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      days[dateStr] = {
        name: d.toLocaleDateString(isId ? 'id-ID' : 'en-US', { weekday: 'short', timeZone: 'Asia/Jakarta' }),
        Hadir: 0,
        Telat: 0
      };
    }
    attendance.forEach((r) => {
      if (days[r.date]) {
        if (r.status === AttendanceStatus.PRESENT) days[r.date].Hadir++;
        if (r.status === AttendanceStatus.LATE) days[r.date].Telat++;
      }
    });
    return Object.values(days);
  }, [attendance, isId]);

  // Filtered attendance list
  const filteredRecords = useMemo(() => {
    let list = todayRecords;
    if (statusFilter !== 'All') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (selectedDept !== 'All') {
      list = list.filter((r) => {
        const emp = profiles.find((p) => p.id === r.profileId);
        return emp?.department === selectedDept || emp?.class === selectedDept;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => {
        const emp = profiles.find((p) => p.id === r.profileId);
        return emp?.name.toLowerCase().includes(q) || emp?.id.toLowerCase().includes(q);
      });
    }
    return list.sort((a, b) => (b.checkIn || '00:00').localeCompare(a.checkIn || '00:00'));
  }, [todayRecords, statusFilter, selectedDept, searchQuery, profiles]);

  return (
    <div className="space-y-5">
      {/* Flight Telemetry Status Bar */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-3 border border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="font-mono font-bold tracking-wider uppercase text-[11px] text-emerald-400">
              COMMAND TELEMETRY
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-slate-300">
            LOC: <strong className="text-white">Asia/Jakarta (WIB)</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-slate-300">
            HARDWARE: <strong className={systemStatus?.status === 'online' ? 'text-emerald-400' : 'text-slate-400'}>{systemStatus?.status === 'online' ? 'ONLINE' : 'OFFLINE'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span>DATE: <strong className="text-white">{today}</strong></span>
          <span>RECORDS TODAY: <strong className="text-theme-primary">{todayRecords.length}</strong></span>
        </div>
      </div>

      {/* 3-Column Asymmetrical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Kolom Kiri: 3 Cols (Stat Stack + Hardware Deck) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Vertical Metric Stack */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              <span>{isId ? 'Metrik Hari Ini' : 'Today Metrics'}</span>
              <Activity className="h-4 w-4 text-theme-primary" />
            </div>

            {/* Present Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {isId ? 'Hadir' : 'Present'}
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {stats.present} ({stats.presentPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${stats.presentPct}%` }} />
              </div>
            </div>

            {/* Late Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {isId ? 'Terlambat' : 'Late'}
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {stats.late} ({stats.latePct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${stats.latePct}%` }} />
              </div>
            </div>

            {/* Absent Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {isId ? 'Absen' : 'Absent'}
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {stats.absent} ({stats.absentPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${stats.absentPct}%` }} />
              </div>
            </div>
          </div>

          {/* Hardware & Terminal Status Deck */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              <span>{isId ? 'Hardware Telemetri' : 'Hardware Telemetry'}</span>
              <Server className="h-4 w-4 text-blue-500" />
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">ESP32 RFID</span>
                <span className="text-emerald-500 font-bold">READY</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Face Engine</span>
                <span className={systemStatus?.status === 'online' ? 'text-emerald-500 font-bold' : 'text-slate-400 font-bold'}>
                  {systemStatus?.status === 'online' ? 'ACTIVE' : 'OFFLINE'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">DB Records</span>
                <span className="text-theme-primary font-bold">{profiles.length} Profiles</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Tengah: 6 Cols (Charts + Real-time Table) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Trend Bar Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-theme-primary" />
                {isId ? 'Tren Presensi Mingguan' : 'Weekly Attendance Trend'}
              </h3>
              <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-theme-primary"></span>{isId ? 'Hadir' : 'Present'}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500"></span>{isId ? 'Telat' : 'Late'}</span>
              </div>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" strokeOpacity={0.15} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '11px', backgroundColor: '#0f172a', color: '#fff', border: 'none' }}
                  />
                  <Bar dataKey="Hadir" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="Telat" fill="#d97706" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Real-time Attendance Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                  {isId ? 'Log Presensi Real-Time' : 'Real-Time Feed'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-theme-primary-light text-theme-primary-text font-bold">
                  {filteredRecords.length}
                </span>
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={isId ? 'Cari (/)...' : 'Search (/)...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-6 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-theme-primary/20 focus:border-theme-primary"
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => {
                  const emp = profiles.find((p) => p.id === r.profileId);
                  return (
                    <div key={r.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={emp?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp?.name || 'U')}&background=random`}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{emp?.name || r.profileId}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{emp?.department || emp?.class || r.profileId}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {r.checkIn || '--:--'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          r.status === AttendanceStatus.PRESENT
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : r.status === AttendanceStatus.LATE
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                  {isId ? 'Tidak ada catatan ditemukan.' : 'No records found.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: 3 Cols (Quick Actions + Announcements Feed) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Quick Actions & Department Filter */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              <span>{isId ? 'Aksi & Filter Cepat' : 'Quick Actions'}</span>
              <SlidersHorizontal className="h-4 w-4 text-theme-primary" />
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => router.visit('/reports')}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5 text-theme-primary" />
                  {isId ? 'Ekspor Laporan Presensi' : 'Export Reports'}
                </span>
                <ChevronRight className="h-3 w-3 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => router.visit('/requests')}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {isId ? 'Permohonan / Izin' : 'Requests & Leaves'}
                </span>
                <ChevronRight className="h-3 w-3 text-slate-400" />
              </button>
            </div>

            {/* Quick Department Filter Pills */}
            <div className="pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                {isId ? 'Filter Divisi / Kelas' : 'Filter Division'}
              </span>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedDept('All')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    selectedDept === 'All'
                      ? 'bg-slate-900 dark:bg-slate-700 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                {departments.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDept(dept)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                      selectedDept === dept
                        ? 'bg-theme-primary text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Feed Announcements */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              <span>{isId ? 'Warta Komando' : 'Bulletins'}</span>
              <Bell className="h-4 w-4 text-theme-primary" />
            </div>

            <div className="space-y-2">
              {announcements.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  onClick={() => router.visit('/announcements')}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className={`font-bold uppercase px-1 rounded ${
                      a.priority === 'High' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60' : 'text-slate-500'
                    }`}>
                      {a.priority}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {new Date(a.date).toLocaleDateString(isId ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{a.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

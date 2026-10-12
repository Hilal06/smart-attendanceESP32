import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Profile, AttendanceRecord, AttendanceStatus, Announcement } from '../../types';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Bell,
  Search,
  Server,
  Radio,
  ChevronRight,
  Monitor
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

export const KioskMonitorDashboard: React.FC<VariantProps> = ({
  profiles,
  attendance,
  announcements,
  t,
  userRole,
  systemStatus
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentTime, setCurrentTime] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isId = t.dashboard === 'Dasbor';
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

  // Digital clock timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayRecords = useMemo(() => {
    return attendance.filter((r) => r.date === today);
  }, [attendance, today]);

  const stats = useMemo(() => {
    const present = todayRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const late = todayRecords.filter((r) => r.status === AttendanceStatus.LATE).length;
    const absent = todayRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    return { present, late, absent, total: todayRecords.length };
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

  const filteredRecords = useMemo(() => {
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
    <div className="space-y-5">
      {/* Kiosk Terminal Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg shadow-xs">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">SmartAttend Kiosk Monitor</h1>
            <p className="text-xs text-slate-400 font-mono">Terminal Presensi Langsung • Gerbang Utama</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xl font-bold font-mono text-cyan-400">{currentTime || '--:--:--'} WIB</div>
            <div className="text-[10px] text-slate-400 font-mono">{today}</div>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
        </div>
      </div>

      {/* 50/50 Dual-Pane Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel Kiri: Live Attendance Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[650px] overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-cyan-500 animate-pulse" />
                <span>{isId ? 'Aliran Presensi Langsung' : 'Live Stream Feed'}</span>
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">{filteredRecords.length} {isId ? 'siswa & guru tercatat' : 'records logged'}</span>
            </div>

            <div className="relative w-44">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={isId ? 'Cari...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((r) => {
                const emp = profiles.find((p) => p.id === r.profileId);
                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-cyan-500/40 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={emp?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp?.name || 'U')}&background=random`}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{emp?.name || r.profileId}</div>
                        <div className="text-xs text-slate-500 font-medium truncate">
                          {emp?.department || emp?.class || '-'} • <span className="font-mono text-[11px]">{emp?.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        {r.checkIn || '--:--'}
                      </div>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        r.status === AttendanceStatus.PRESENT
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : r.status === AttendanceStatus.LATE
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                {isId ? 'Belum ada data presensi yang masuk.' : 'No attendance data recorded yet.'}
              </div>
            )}
          </div>
        </div>

        {/* Panel Kanan: Analytics & System Deck */}
        <div className="space-y-6">
          {/* Quick KPI 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">{isId ? 'Hadir Hari Ini' : 'Present'}</span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{stats.present}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">{isId ? 'Terlambat' : 'Late'}</span>
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">{stats.late}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">{isId ? 'Absen' : 'Absent'}</span>
              <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">{stats.absent}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">{isId ? 'Total Anggota' : 'Total'}</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{profiles.length}</span>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">
              {isId ? 'Tren Presensi Mingguan' : 'Weekly Trend'}
            </h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" strokeOpacity={0.15} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="Hadir" fill="#0284c7" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="Telat" fill="#f97316" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Terminal Hardware Deck */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{isId ? 'Terminal Pemindai ESP32' : 'ESP32 Scanner'}</div>
                <div className={`text-[11px] font-medium ${systemStatus?.status === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {systemStatus?.status === 'online' ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.visit('/reports')}
              className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              {isId ? 'Buka Laporan →' : 'View Reports →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

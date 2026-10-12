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
  ArrowRight,
  ChevronRight,
  Columns3
} from 'lucide-react';
import { router } from '@inertiajs/react';

interface VariantProps {
  profiles: Profile[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  t: any;
  userRole?: string;
  systemStatus: any;
}

export const StatusWorkspaceDashboard: React.FC<VariantProps> = ({
  profiles,
  attendance,
  announcements,
  t,
  userRole,
  systemStatus
}) => {
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
        }
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const todayRecords = useMemo(() => {
    return attendance.filter((r) => r.date === today);
  }, [attendance, today]);

  // Split into 3 status buckets
  const buckets = useMemo(() => {
    const presentList: any[] = [];
    const lateList: any[] = [];
    const absentList: any[] = [];

    // Profiles with records
    todayRecords.forEach((r) => {
      const p = profiles.find((prof) => prof.id === r.profileId);
      const item = { record: r, profile: p };
      if (r.status === AttendanceStatus.PRESENT) presentList.push(item);
      else if (r.status === AttendanceStatus.LATE) lateList.push(item);
      else if (r.status === AttendanceStatus.ABSENT) absentList.push(item);
    });

    // Profiles with no records for today -> add to absent/not logged
    profiles.forEach((p) => {
      const hasRecord = todayRecords.some((r) => r.profileId === p.id);
      if (!hasRecord) {
        absentList.push({
          record: { id: `auto-${p.id}`, profileId: p.id, date: today, checkIn: null, checkOut: null, status: AttendanceStatus.ABSENT },
          profile: p
        });
      }
    });

    return {
      present: presentList,
      late: lateList,
      absent: absentList
    };
  }, [todayRecords, profiles, today]);

  // Filter with search query
  const filteredBuckets = useMemo(() => {
    if (!searchQuery.trim()) return buckets;
    const q = searchQuery.toLowerCase();
    const filterFn = (item: any) => {
      const name = item.profile?.name?.toLowerCase() || '';
      const id = item.profile?.id?.toLowerCase() || '';
      return name.includes(q) || id.includes(q);
    };

    return {
      present: buckets.present.filter(filterFn),
      late: buckets.late.filter(filterFn),
      absent: buckets.absent.filter(filterFn)
    };
  }, [buckets, searchQuery]);

  const total = profiles.length || 1;
  const presentPct = Math.round((buckets.present.length / total) * 100);
  const latePct = Math.round((buckets.late.length / total) * 100);
  const absentPct = Math.round((buckets.absent.length / total) * 100);

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Columns3 className="h-5 w-5 text-theme-primary" />
            <span>{isId ? 'Papan Kerja Status Presensi' : 'Status Columns Workspace'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isId ? 'Kelola dan tindak lanjuti presensi harian per kelompok status secara langsung.' : 'Manage daily attendance actions segmented by status columns.'}
          </p>
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={isId ? 'Cari nama... (/)' : 'Search names... (/)'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-theme-primary/20 focus:border-theme-primary"
          />
        </div>
      </div>

      {/* Proportional Ribbon Meter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">{isId ? 'Distribusi Kehadiran Hari Ini' : 'Today Distribution'}</span>
          <span className="font-mono text-[11px] text-slate-400">{today}</span>
        </div>

        <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden">
          <div style={{ width: `${presentPct}%` }} className="bg-emerald-500 h-full transition-all" title={`Hadir: ${presentPct}%`} />
          <div style={{ width: `${latePct}%` }} className="bg-amber-500 h-full transition-all" title={`Terlambat: ${latePct}%`} />
          <div style={{ width: `${absentPct}%` }} className="bg-rose-500 h-full transition-all" title={`Absen: ${absentPct}%`} />
        </div>

        <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400 pt-1">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span>{isId ? 'Tepat Waktu' : 'On-Time'}: {buckets.present.length} ({presentPct}%)</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500"></span>{isId ? 'Terlambat' : 'Late'}: {buckets.late.length} ({latePct}%)</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500"></span>{isId ? 'Belum Tercatat' : 'Absent'}: {buckets.absent.length} ({absentPct}%)</span>
        </div>
      </div>

      {/* 3 Status Columns (Kanban Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Kolom 1: Tepat Waktu (Emerald) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[520px] overflow-hidden">
          <div className="h-1 w-full bg-emerald-500" />
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-950/20 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              {isId ? 'Tepat Waktu' : 'On-Time'}
            </span>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
              {filteredBuckets.present.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {filteredBuckets.present.length > 0 ? (
              filteredBuckets.present.map(({ record, profile }: any) => (
                <div key={record.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{profile?.name}</span>
                    <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">{record.checkIn}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">{profile?.department || profile?.class || '-'}</div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">Kosong</div>
            )}
          </div>
        </div>

        {/* Kolom 2: Terlambat (Amber) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[520px] overflow-hidden">
          <div className="h-1 w-full bg-amber-500" />
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-950/20 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {isId ? 'Terlambat Masuk' : 'Late Arrival'}
            </span>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
              {filteredBuckets.late.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {filteredBuckets.late.length > 0 ? (
              filteredBuckets.late.map(({ record, profile }: any) => (
                <div key={record.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 hover:border-amber-300 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{profile?.name}</span>
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">{record.checkIn}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">{profile?.department || profile?.class || '-'}</div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">Kosong</div>
            )}
          </div>
        </div>

        {/* Kolom 3: Tidak Hadir / Absen (Rose) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[520px] overflow-hidden">
          <div className="h-1 w-full bg-rose-500" />
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-rose-50/30 dark:bg-rose-950/20 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              {isId ? 'Belum Hadir / Absen' : 'Absent'}
            </span>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
              {filteredBuckets.absent.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {filteredBuckets.absent.length > 0 ? (
              filteredBuckets.absent.map(({ record, profile }: any) => (
                <div key={record.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 hover:border-rose-300 transition-colors flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{profile?.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{profile?.department || profile?.class || '-'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.visit('/requests')}
                    className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:underline shrink-0"
                  >
                    {isId ? 'Buat Izin' : 'Add Request'}
                  </button>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">Kosong</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

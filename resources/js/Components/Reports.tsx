import React, { useState, useMemo } from 'react';
import { Profile, AttendanceRecord, AttendanceStatus } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, Loader2, Download, Search, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Calendar, User, CheckCircle2, Clock, AlertTriangle, X } from 'lucide-react';
import { generateAttendanceInsights } from '../services/geminiService';

interface ReportsProps {
  attendance: AttendanceRecord[];
  profiles: Profile[];
  t: any;
  userRole?: string;
}

export const Reports: React.FC<ReportsProps> = ({
  attendance,
  profiles,
  t,
}) => {
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Weekly');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('ALL');
  const [themeColor, setThemeColor] = useState('#059669');

  React.useEffect(() => {
    const updateThemeColor = () => {
      const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
      if (primary) setThemeColor(primary);
    };
    updateThemeColor();
    window.addEventListener('color-theme-updated', updateThemeColor);
    return () => window.removeEventListener('color-theme-updated', updateThemeColor);
  }, []);

  const ITEMS_PER_PAGE = 8;
  const isId = t.reportsAnalytics === 'Laporan & Analitik';

  // Filter attendance by individual (if selected)
  const scopedAttendance = useMemo(() => {
    if (selectedProfileId === 'ALL') return attendance;
    return attendance.filter((r) => r.profileId === selectedProfileId);
  }, [attendance, selectedProfileId]);

  // Selected profile details
  const activeProfile = useMemo(() => {
    if (selectedProfileId === 'ALL') return null;
    return profiles.find((p) => p.id === selectedProfileId) || null;
  }, [profiles, selectedProfileId]);

  // Filter by time range
  const filteredAttendanceByTime = useMemo(() => {
    const today = new Date();
    let startDate = new Date();

    if (timeRange === 'Weekly') {
      startDate.setDate(today.getDate() - 6);
    } else if (timeRange === 'Monthly') {
      startDate.setDate(today.getDate() - 29);
    } else {
      startDate.setFullYear(today.getFullYear(), today.getMonth() - 11, 1);
    }

    const startStr = startDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

    return scopedAttendance.filter((r) => r.date >= startStr && r.date <= todayStr);
  }, [scopedAttendance, timeRange]);

  // High-level aggregate metrics
  const metrics = useMemo(() => {
    const total = filteredAttendanceByTime.length;
    let present = 0;
    let late = 0;
    let absent = 0;
    let onLeave = 0;

    filteredAttendanceByTime.forEach((r) => {
      if (r.status === AttendanceStatus.PRESENT) present++;
      else if (r.status === AttendanceStatus.LATE) late++;
      else if (r.status === AttendanceStatus.ABSENT) absent++;
      else if (r.status === AttendanceStatus.ON_LEAVE) onLeave++;
    });

    const attended = present + late;
    const overallRate = total > 0 ? Math.round((attended / total) * 100) : 0;
    const punctualityRate = attended > 0 ? Math.round((present / attended) * 100) : 0;

    return { total, present, late, absent, onLeave, overallRate, punctualityRate };
  }, [filteredAttendanceByTime]);

  // Cumulative Area Chart Data
  const cumulativeTrendData = useMemo(() => {
    const data: { label: string; dateStr: string; presentCount: number; cumulative: number }[] = [];
    const today = new Date();

    const daysCount = timeRange === 'Weekly' ? 7 : timeRange === 'Monthly' ? 30 : 12;

    if (timeRange === 'Yearly') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString(isId ? 'id-ID' : 'en-US', { month: 'short' });
        data.push({ label, dateStr: monthKey, presentCount: 0, cumulative: 0 });
      }

      scopedAttendance.forEach((record) => {
        const recordDate = new Date(record.date);
        const key = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        const item = data.find((d) => d.dateStr === key);
        if (item && (record.status === AttendanceStatus.PRESENT || record.status === AttendanceStatus.LATE)) {
          item.presentCount++;
        }
      });
    } else {
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        const label = timeRange === 'Weekly'
          ? d.toLocaleDateString(isId ? 'id-ID' : 'en-US', { weekday: 'short' })
          : String(d.getDate());
        data.push({ label, dateStr, presentCount: 0, cumulative: 0 });
      }

      scopedAttendance.forEach((record) => {
        const item = data.find((d) => d.dateStr === record.date);
        if (item && (record.status === AttendanceStatus.PRESENT || record.status === AttendanceStatus.LATE)) {
          item.presentCount++;
        }
      });
    }

    let runningTotal = 0;
    data.forEach((item) => {
      runningTotal += item.presentCount;
      item.cumulative = runningTotal;
    });

    return data;
  }, [scopedAttendance, timeRange, isId]);

  // Filtered table data with search & status tab
  const tableData = useMemo(() => {
    let list = [...filteredAttendanceByTime].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (statusFilter !== 'All') {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => {
        const profile = profiles.find((p) => p.id === r.profileId);
        return (
          profile?.name.toLowerCase().includes(q) ||
          profile?.id.toLowerCase().includes(q) ||
          (profile?.class && profile.class.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [filteredAttendanceByTime, statusFilter, searchQuery, profiles]);

  const totalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return tableData.slice(start, start + ITEMS_PER_PAGE);
  }, [tableData, currentPage]);

  const handleExportCSV = () => {
    const headers = [t.date, 'ID', t.profile, t.department, t.position, 'Status', t.checkIn, t.checkOut];
    const csvRows = [headers.join(',')];

    scopedAttendance.forEach((record) => {
      const emp = profiles.find((e) => e.id === record.profileId);
      const row = [
        record.date,
        record.profileId,
        `"${emp?.name || 'Unknown'}"`,
        `"${emp?.department || ''}"`,
        `"${emp?.role || ''}"`,
        record.status,
        record.checkIn || '',
        record.checkOut || '',
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filenameDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    link.setAttribute('download', `attendance_report_${filenameDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateInsights = async () => {
    setLoadingAI(true);
    const insights = await generateAttendanceInsights(scopedAttendance, profiles);
    setAiInsights(insights);
    setLoadingAI(false);
  };

  return (
    <div className="space-y-6">
      {/* Editorial Headline & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium tracking-normal">
            <span>{isId ? 'Tahun Ajaran 2026/2027' : 'Academic Year 2026/2027'}</span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
            <span className="text-slate-400 dark:text-slate-500">{isId ? 'Semester Ganjil' : 'Odd Semester'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {isId ? 'Laporan & Analitik Kehadiran' : 'Attendance Analytics & Reports'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            {isId
              ? 'Laporan komprehensif kehadiran institusi dengan visualisasi bento dan mode penelusuran profil individu.'
              : 'Comprehensive institutional attendance report with bento visualization and individual drill-down mode.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-1 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          {/* Scope Inset */}
          <div className="relative">
            <select
              value={selectedProfileId}
              onChange={(e) => {
                setSelectedProfileId(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none pl-8 pr-6 h-8 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-theme-primary"
            >
              <option value="ALL">{isId ? 'Agregat Institusi' : 'All Institutional'}</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.class ? `(${p.class})` : ''}
                </option>
              ))}
            </select>
            <User className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* Export & AI */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 h-8 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={t.exportCSV}
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={handleGenerateInsights}
            disabled={loadingAI}
            className="flex items-center gap-1.5 px-3 h-8 text-xs font-semibold rounded-lg bg-theme-primary hover:bg-theme-primary-hover text-white transition-all disabled:opacity-75"
          >
            {loadingAI ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-white/90" />}
            <span>{loadingAI ? '...' : (isId ? 'Analisis AI' : 'AI Analysis')}</span>
          </button>
        </div>
      </div>

      {/* Narrative Executive Brief Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {isId ? 'Ringkasan Naratif Periode Ini' : 'Executive Narrative Brief'}
            </span>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {activeProfile ? (
                <>
                  Pada rentang waktu ini, siswa <strong className="font-bold text-slate-950 dark:text-white">{activeProfile.name}</strong> mencatatkan total{' '}
                  <strong className="text-theme-primary font-bold">{metrics.total} log aktivitas</strong>, dengan rasio kehadiran{' '}
                  <strong className="text-theme-primary font-bold">{metrics.overallRate}%</strong> ({metrics.present} hadir tepat waktu,{' '}
                  {metrics.late} terlambat, dan {metrics.absent} tidak hadir).
                </>
              ) : (
                <>
                  Secara agregat institusi mencatatkan <strong className="text-theme-primary font-bold">{metrics.total} data kehadiran</strong>{' '}
                  dengan tingkat partisipasi <strong className="text-theme-primary font-bold">{metrics.overallRate}%</strong> dan indeks ketepatan
                  waktu berada pada angka <strong className="text-theme-primary font-bold">{metrics.punctualityRate}%</strong>.
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">{isId ? 'Kehadiran' : 'Attendance'}</span>
              <span className="text-lg font-extrabold text-theme-primary">{metrics.overallRate}%</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">{isId ? 'Tepat Waktu' : 'Punctual'}</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">{metrics.punctualityRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Card (if generated) */}
      {aiInsights && (
        <div className="relative p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-theme-primary/30 shadow-xs">
          <button
            onClick={() => setAiInsights(null)}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-theme-primary" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.aiAnalysis}</h3>
          </div>
          <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: aiInsights }} />
        </div>
      )}

      {/* Bento Grid: 3 Cards (60% Area Chart / 20% Radial Gauge / 20% Profile Dossier) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bento 1: Cumulative Area Chart (Cols 1-7) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isId ? 'Volume Kehadiran Kumulatif' : 'Cumulative Attendance Volume'}
              </h3>
              <p className="text-xs text-slate-500">
                {isId ? 'Akumulasi total siswa hadir dari waktu ke waktu' : 'Accumulated total attendance over time'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Range Tabs: Weekly / Monthly / Yearly */}
              <div className="inline-flex h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                {(['Weekly', 'Monthly', 'Yearly'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setTimeRange(range)}
                    className={`flex items-center gap-1 px-2.5 h-full rounded-md text-[11px] font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-white dark:bg-slate-700 text-theme-primary font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>{range === 'Weekly' ? t.weekly : range === 'Monthly' ? t.monthly : t.yearly}</span>
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-theme-primary bg-theme-primary-light border border-theme-primary/30 px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap">
                {metrics.present + metrics.late} Total Hadir
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="chronicleThemeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={themeColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={themeColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                  formatter={(value: any) => [value, isId ? 'Total Kumulatif' : 'Cumulative Total']}
                />
                <Area type="monotone" dataKey="cumulative" stroke={themeColor} strokeWidth={2.5} fill="url(#chronicleThemeGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bento 2: Radial Gauge / Status Breakdown (Cols 8-9) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between items-center text-center">
          <div className="w-full">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              {isId ? 'Indeks Ketepatan' : 'Punctuality Index'}
            </h3>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{metrics.punctualityRate}%</span>
          </div>

          <div className="relative h-32 w-32 my-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { value: metrics.punctualityRate, color: themeColor },
                    { value: 100 - metrics.punctualityRate, color: '#e2e8f0' },
                  ]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={50}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  <Cell fill={themeColor} />
                  <Cell fill="#e2e8f0" className="dark:fill-slate-800" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <CheckCircle2 className="h-5 w-5 text-theme-primary" />
            </div>
          </div>

          <div className="w-full space-y-1 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tepat:</span>
              <strong className="text-emerald-600">{metrics.present}</strong>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Terlambat:</span>
              <strong className="text-amber-600">{metrics.late}</strong>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tidak Hadir:</span>
              <strong className="text-rose-600">{metrics.absent}</strong>
            </div>
          </div>
        </div>

        {/* Bento 3: Individual Profile Dossier / Institutional Summary (Cols 10-12) */}
        <div className="lg:col-span-3 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              {activeProfile ? (isId ? 'Dossier Profil Siswa' : 'Student Dossier') : isId ? 'Fokus Institusi' : 'Institution Focus'}
            </span>

            {activeProfile ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0">
                    {activeProfile.avatar ? (
                      <img src={activeProfile.avatar} alt={activeProfile.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center font-bold text-slate-600 text-sm">
                        {activeProfile.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{activeProfile.name}</h4>
                    <p className="text-xs text-slate-500 truncate">{activeProfile.class || activeProfile.role}</p>
                    <span className="text-[10px] font-mono text-theme-primary">ID: {activeProfile.id}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Keaktifan:</span>
                    <span className="font-bold text-theme-primary">Aktif Terdaftar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Streak Tepat:</span>
                    <span className="font-bold text-amber-600">🔥 14 Hari Beruntun</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rata-rata Scan:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">07:12 WIB</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                    {isId ? 'Semua Siswa Terpantau' : 'All Students Monitored'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isId
                      ? 'Gunakan menu pemilih di kanan atas untuk menyaring dossier performa per siswa secara mendalam.'
                      : 'Use the selector dropdown on the top right to drill down into personal student dossiers.'}
                  </p>
                </div>
                <div className="text-xs space-y-1.5 pt-1">
                  <div className="flex items-center justify-between gap-2 text-slate-500">
                    <span className="shrink-0">Total Profil:</span>
                    <strong className="text-slate-900 dark:text-white font-semibold truncate">{profiles.length} Individu</strong>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-slate-500">
                    <span className="shrink-0">Rentang Terpilih:</span>
                    <strong className="text-slate-900 dark:text-white font-semibold truncate">
                      {timeRange === 'Weekly' ? (isId ? 'Mingguan' : 'Weekly') : timeRange === 'Monthly' ? (isId ? 'Bulanan' : 'Monthly') : (isId ? 'Tahunan' : 'Yearly')}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
            SmartAttend Analytics Platform
          </div>
        </div>
      </div>

      {/* Editorial Attendance Data Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.detailedLogs}</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {tableData.length} {t.results}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Tabs */}
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
              {[
                { id: 'All', label: isId ? 'Semua' : 'All' },
                { id: AttendanceStatus.PRESENT, label: t.present },
                { id: AttendanceStatus.LATE, label: t.late },
                { id: AttendanceStatus.ABSENT, label: t.absent },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    statusFilter === tab.id
                      ? 'bg-theme-primary text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={isId ? 'Cari nama atau ID...' : 'Search name or ID...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-theme-primary/20 focus:border-theme-primary"
              />
            </div>
          </div>
        </div>

        {/* Table Rows */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="px-5 py-3 text-left">{t.date}</th>
                <th className="px-5 py-3 text-left">{t.profile}</th>
                <th className="px-5 py-3 text-left">{t.department}</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">{t.checkIn}</th>
                <th className="px-5 py-3 text-left">{t.checkOut}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((record) => {
                  const emp = profiles.find((p) => p.id === record.profileId);
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">{record.date}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                            {emp?.avatar ? (
                              <img src={emp.avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center font-bold text-[10px] text-slate-500">
                                {emp?.name?.slice(0, 2).toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{emp?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{record.profileId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {emp?.department || emp?.class || '-'}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            record.status === AttendanceStatus.PRESENT
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                              : record.status === AttendanceStatus.LATE
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                              : record.status === AttendanceStatus.ABSENT
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {record.status === AttendanceStatus.PRESENT
                            ? t.present
                            : record.status === AttendanceStatus.LATE
                            ? t.late
                            : record.status === AttendanceStatus.ABSENT
                            ? t.absent
                            : t.onLeave}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">{record.checkIn || '--:--'}</td>
                      <td className="px-5 py-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">{record.checkOut || '--:--'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    {isId ? 'Tidak ada data laporan yang sesuai.' : 'No matching records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            {t.showing} <strong className="text-slate-900 dark:text-slate-200">{tableData.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</strong> {t.to}{' '}
            <strong className="text-slate-900 dark:text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, tableData.length)}</strong> {t.of}{' '}
            <strong className="text-slate-900 dark:text-slate-200">{tableData.length}</strong> {t.results}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:border-theme-primary/40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs px-2 font-semibold">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:border-theme-primary/40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

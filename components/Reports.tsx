import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, AttendanceStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, Loader2, Download, FileText, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateAttendanceInsights } from '../services/geminiService';

interface ReportsProps {
  attendance: AttendanceRecord[];
  employees: Employee[];
  t: any;
}

export const Reports: React.FC<ReportsProps> = ({ attendance, employees, t }) => {
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const handleGenerateInsights = async () => {
    setLoadingAI(true);
    const insights = await generateAttendanceInsights(attendance, employees);
    setAiInsights(insights);
    setLoadingAI(false);
  };

  const handleExportCSV = () => {
    const headers = [t.date, 'ID', t.employee, t.department, t.position, 'Status', t.checkIn, t.checkOut];
    const csvRows = [headers.join(',')];

    attendance.forEach(record => {
      const emp = employees.find(e => e.id === record.employeeId);
      const row = [
        record.date,
        record.employeeId,
        `"${emp?.name || 'Unknown'}"`,
        `"${emp?.department || ''}"`,
        `"${emp?.role || ''}"`,
        record.status,
        record.checkIn || '',
        record.checkOut || ''
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const last7DaysData = useMemo(() => {
    const days: Record<string, any> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        days[dateStr] = {
            date: d.toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' }),
            Present: 0, Late: 0, Absent: 0
        };
    }
    attendance.forEach(record => {
        if (days[record.date]) {
            if (record.status === AttendanceStatus.PRESENT) days[record.date].Present++;
            else if (record.status === AttendanceStatus.LATE) days[record.date].Late++;
            else if (record.status === AttendanceStatus.ABSENT) days[record.date].Absent++;
        }
    });
    return Object.values(days);
  }, [attendance, t.language]);

  const statusDistribution = useMemo(() => {
      let present = 0, late = 0, absent = 0, leave = 0;
      attendance.forEach(r => {
          if (r.status === AttendanceStatus.PRESENT) present++;
          if (r.status === AttendanceStatus.LATE) late++;
          if (r.status === AttendanceStatus.ABSENT) absent++;
          if (r.status === AttendanceStatus.ON_LEAVE) leave++;
      });
      return [
          { name: t.present, value: present, color: '#10b981' },
          { name: t.late, value: late, color: '#f59e0b' },
          { name: t.absent, value: absent, color: '#f43f5e' },
          { name: t.onLeave, value: leave, color: '#64748b' },
      ];
  }, [attendance, t]);

  const filteredAttendance = useMemo(() => {
    let data = [...attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (statusFilter !== 'All') data = data.filter(r => r.status === statusFilter);
    return data;
  }, [attendance, statusFilter]);

  const totalPages = Math.ceil(filteredAttendance.length / ITEMS_PER_PAGE);
  const paginatedData = filteredAttendance.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getEmployee = (id: string) => employees.find(e => e.id === id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.reportsAnalytics}</h2>
          <p className="text-slate-500">{t.visualizeTrends}</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleExportCSV} className="flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium">{t.exportCSV}</button>
          <button onClick={handleGenerateInsights} disabled={loadingAI} className="flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-indigo-700">
            {loadingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {loadingAI ? (t.language === 'id' ? 'Menganalisis...' : 'Analyzing...') : t.askAI}
          </button>
        </div>
      </div>

      {aiInsights && (
        <div className="rounded-xl bg-indigo-50 p-6 border border-indigo-100 animate-fade-in">
          <div className="flex items-center mb-4"><Sparkles className="h-5 w-5 text-indigo-600 mr-2" /><h3 className="font-semibold text-indigo-900">{t.aiAnalysis}</h3></div>
          <div className="prose prose-indigo prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: aiInsights }} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm border border-slate-100">
             <h3 className="mb-6 font-semibold text-slate-900">{t.weeklyAttendanceTrend}</h3>
             <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={last7DaysData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend />
                        <Bar dataKey="Present" name={t.present} stackId="a" fill="#3b82f6" />
                        <Bar dataKey="Late" name={t.late} stackId="a" fill="#f59e0b" />
                        <Bar dataKey="Absent" name={t.absent} stackId="a" fill="#f43f5e" />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <h3 className="mb-6 font-semibold text-slate-900">{t.statusDistribution}</h3>
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">{statusDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip /></PieChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center"><FileText className="h-5 w-5 text-slate-500 mr-2" /><h3 className="font-semibold text-slate-900">{t.detailedLogs}</h3></div>
          <div className="flex items-center space-x-2"><Filter className="h-4 w-4 text-slate-500" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border-0 py-1.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300">
              <option value="All">{t.allStatus}</option>
              <option value={AttendanceStatus.PRESENT}>{t.present}</option>
              <option value={AttendanceStatus.LATE}>{t.late}</option>
              <option value={AttendanceStatus.ABSENT}>{t.absent}</option>
              <option value={AttendanceStatus.ON_LEAVE}>{t.onLeave}</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium uppercase text-slate-500">{t.date}</th>
                <th className="px-6 py-3 text-left font-medium uppercase text-slate-500">{t.employee}</th>
                <th className="px-6 py-3 text-left font-medium uppercase text-slate-500">{t.department}</th>
                <th className="px-6 py-3 text-left font-medium uppercase text-slate-500">Status</th>
                <th className="px-6 py-3 text-left font-medium uppercase text-slate-500">{t.checkIn}</th>
                <th className="px-6 py-3 text-left font-medium uppercase text-slate-500">{t.checkOut}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedData.map((record) => {
                const emp = getEmployee(record.employeeId);
                return (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{record.date}</td>
                    <td className="px-6 py-4"><div className="flex items-center"><img className="h-8 w-8 rounded-full object-cover mr-3" src={emp?.avatar} alt="" /><div><p className="font-medium text-slate-900">{emp?.name || 'Unknown'}</p><p className="text-xs text-slate-500">{emp?.role}</p></div></div></td>
                    <td className="px-6 py-4 text-slate-500">{emp?.department || '-'}</td>
                    <td className="px-6 py-4"><span className={`rounded-full px-2 text-xs font-semibold leading-5 ${record.status === AttendanceStatus.PRESENT ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{record.status === AttendanceStatus.PRESENT ? t.present : record.status === AttendanceStatus.LATE ? t.late : t.absent}</span></td>
                    <td className="px-6 py-4 text-slate-500">{record.checkIn || '--:--'}</td>
                    <td className="px-6 py-4 text-slate-500">{record.checkOut || '--:--'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex items-center justify-between text-sm text-slate-500">
            <div>{t.showing} <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> {t.to} <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAttendance.length)}</span> {t.of} <span className="font-medium">{filteredAttendance.length}</span> {t.results}</div>
            <div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 rounded bg-white border"><ChevronLeft className="h-4 w-4" /></button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 rounded bg-white border"><ChevronRight className="h-4 w-4" /></button></div>
        </div>
      </div>
    </div>
  );
};
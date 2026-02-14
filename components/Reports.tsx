import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, AttendanceStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, Loader2, Download, FileText, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateAttendanceInsights } from '../services/geminiService';

interface ReportsProps {
  attendance: AttendanceRecord[];
  employees: Employee[];
}

export const Reports: React.FC<ReportsProps> = ({ attendance, employees }) => {
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
    const headers = ['Date', 'Employee ID', 'Employee Name', 'Department', 'Role', 'Status', 'Check In', 'Check Out'];
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
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare Chart Data
  const last7DaysData = useMemo(() => {
    const days: Record<string, any> = {};
    const today = new Date();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        days[dateStr] = {
            date: d.toLocaleDateString('en-US', { weekday: 'short' }),
            Present: 0,
            Late: 0,
            Absent: 0
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
  }, [attendance]);

  const statusDistribution = useMemo(() => {
      let present = 0, late = 0, absent = 0, leave = 0;
      attendance.forEach(r => {
          if (r.status === AttendanceStatus.PRESENT) present++;
          if (r.status === AttendanceStatus.LATE) late++;
          if (r.status === AttendanceStatus.ABSENT) absent++;
          if (r.status === AttendanceStatus.ON_LEAVE) leave++;
      });
      return [
          { name: 'Present', value: present, color: '#10b981' },
          { name: 'Late', value: late, color: '#f59e0b' },
          { name: 'Absent', value: absent, color: '#f43f5e' },
          { name: 'On Leave', value: leave, color: '#64748b' },
      ];
  }, [attendance]);

  // Filtered attendance
  const filteredAttendance = useMemo(() => {
    let data = [...attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (statusFilter !== 'All') {
      data = data.filter(r => r.status === statusFilter);
    }
    return data;
  }, [attendance, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAttendance.length / ITEMS_PER_PAGE);
  const paginatedData = filteredAttendance.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filter changes
  useMemo(() => {
      setCurrentPage(1);
  }, [statusFilter]);


  const getEmployee = (id: string) => employees.find(e => e.id === id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
          <p className="text-slate-500">Visualize attendance trends and generate insights.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </button>
          <button 
            onClick={handleGenerateInsights}
            disabled={loadingAI}
            className="flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 transition-all"
          >
            {loadingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {loadingAI ? 'Analyzing...' : 'Ask AI Insights'}
          </button>
        </div>
      </div>

      {/* AI Insights Panel */}
      {aiInsights && (
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6 border border-indigo-100 animate-fade-in">
          <div className="flex items-center mb-4">
             <Sparkles className="h-5 w-5 text-indigo-600 mr-2" />
             <h3 className="font-semibold text-indigo-900">AI Analysis</h3>
          </div>
          <div 
            className="prose prose-indigo prose-sm max-w-none text-slate-700"
            dangerouslySetInnerHTML={{ __html: aiInsights }}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Bar Chart */}
          <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm border border-slate-100">
             <h3 className="mb-6 font-semibold text-slate-900">Weekly Attendance Trends</h3>
             <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={last7DaysData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="Present" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="Late" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Absent" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Pie Chart */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <h3 className="mb-6 font-semibold text-slate-900">Status Distribution</h3>
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={statusDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                          >
                              {statusDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* Detailed Attendance Log */}
      <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 gap-4">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-slate-500 mr-2" />
            <h3 className="font-semibold text-slate-900">Detailed Attendance Logs</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="All">All Status</option>
              <option value={AttendanceStatus.PRESENT}>Present</option>
              <option value={AttendanceStatus.LATE}>Late</option>
              <option value={AttendanceStatus.ABSENT}>Absent</option>
              <option value={AttendanceStatus.ON_LEAVE}>On Leave</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Check Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedData.length > 0 ? (
                paginatedData.map((record) => {
                  const emp = getEmployee(record.employeeId);
                  return (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {record.date}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          {emp?.avatar && (
                            <img 
                              className="h-8 w-8 rounded-full object-cover mr-3" 
                              src={emp.avatar} 
                              alt="" 
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-900">{emp?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{emp?.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {emp?.department || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                          ${record.status === AttendanceStatus.PRESENT ? 'bg-emerald-100 text-emerald-800' : 
                            record.status === AttendanceStatus.LATE ? 'bg-amber-100 text-amber-800' :
                            record.status === AttendanceStatus.ABSENT ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {record.checkIn || '--:--'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {record.checkOut || '--:--'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    No records found matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex items-center justify-between">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-slate-500">
                        Showing <span className="font-medium">{filteredAttendance.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAttendance.length)}</span> of <span className="font-medium">{filteredAttendance.length}</span> results
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        
                        {/* Simple Page Indicator */}
                        <div className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-300 focus:outline-offset-0 bg-white">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
            
            {/* Mobile Pagination View */}
            <div className="flex items-center justify-between w-full sm:hidden">
                 <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    Previous
                </button>
                <p className="text-sm text-slate-500">
                    {currentPage} / {Math.max(1, totalPages)}
                </p>
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
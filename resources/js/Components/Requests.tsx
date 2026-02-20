import React from 'react';
import { ProfileRequest, Employee } from '../types';
import { Inbox, CheckCircle, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';

interface RequestsProps {
  requests: ProfileRequest[];
  employees: Employee[];
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  t: any;
}

export const Requests: React.FC<RequestsProps> = ({ requests = [], employees = [], onResolve, onDelete, t }) => {
  const getEmployee = (id: string) => employees.find(e => e.id === id);
  const isId = t.dashboard === 'Dasbor'; // Simple locale detection based on translation

  // Sort requests by date (newest first)
  const sortedRequests = [...(requests || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.updateRequests}</h2>
        <p className="text-slate-500 dark:text-slate-400">{t.manageRequests}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        {sortedRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-slate-50 dark:bg-slate-700/50 p-4 mb-3 transition-colors"><Inbox className="h-8 w-8 text-slate-300 dark:text-slate-500" /></div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.noPendingRequests}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{isId ? 'Semua permintaan telah selesai diproses!' : 'Everything is up to date!'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.employee}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.requestDetails}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.date}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{isId ? 'Aksi' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800 transition-colors">
                {sortedRequests.map((request) => {
                  const emp = getEmployee(request.employeeId);
                  return (
                    <tr key={request.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={emp?.avatar || `https://ui-avatars.com/api/?name=${request.employeeId}`}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 border border-slate-100 dark:border-slate-700"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{emp?.name || request.employeeId}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              {emp?.role || 'Unknown Role'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2" title={request.description}>{request.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="mr-1.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          {new Date(request.date).toLocaleDateString(isId ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Jakarta' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border transition-colors ${request.status === 'Pending'
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/50'
                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50'
                          }`}>
                          {request.status === 'Pending' ? <Clock className="mr-1 h-3 w-3" /> : <CheckCircle className="mr-1 h-3 w-3" />}
                          {request.status === 'Pending' ? t.pending : t.resolved}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {request.status === 'Pending' && (
                            <button
                              onClick={() => onResolve(request.id)}
                              className="p-1.5 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-800/50 transition-all"
                              title={t.markResolved}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(request.id)}
                            className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 border border-transparent hover:border-rose-100 dark:hover:border-rose-800/50 transition-all"
                            title={t.dismiss}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sortedRequests.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 px-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {t.adminNote}
        </div>
      )}
    </div>
  );
};

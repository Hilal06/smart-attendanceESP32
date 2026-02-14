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

export const Requests: React.FC<RequestsProps> = ({ requests, employees, onResolve, onDelete, t }) => {
  const getEmployee = (id: string) => employees.find(e => e.id === id);
  const isId = t.dashboard === 'Dasbor'; // Simple locale detection based on translation

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{t.updateRequests}</h2>
        <p className="text-slate-500">{t.manageRequests}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-slate-50 p-4 mb-3"><Inbox className="h-8 w-8 text-slate-300" /></div>
            <h3 className="text-sm font-bold text-slate-900">{t.noPendingRequests}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">{isId ? 'Semua permintaan telah selesai diproses!' : 'Everything is up to date!'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t.employee}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t.requestDetails}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t.date}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">{isId ? 'Aksi' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {requests.map((request) => {
                  const emp = getEmployee(request.employeeId);
                  return (
                    <tr key={request.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img 
                            src={emp?.avatar || `https://ui-avatars.com/api/?name=${request.employeeId}`} 
                            alt="" 
                            className="h-8 w-8 rounded-full object-cover ring-2 ring-white border border-slate-100" 
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900">{emp?.name || request.employeeId}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              {emp?.role || 'Unknown Role'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                           <p className="text-sm text-slate-700 line-clamp-2" title={request.description}>{request.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-xs text-slate-500">
                           <Calendar className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                           {new Date(request.date).toLocaleDateString(isId ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Jakarta' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                          request.status === 'Pending' 
                            ? 'bg-amber-50 text-amber-700 border-amber-100' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
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
                              className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all"
                              title={t.markResolved}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => onDelete(request.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
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
      
      {requests.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {t.adminNote}
        </div>
      )}
    </div>
  );
};
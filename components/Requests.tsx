import React from 'react';
import { ProfileRequest, Employee } from '../types';
import { Inbox, CheckCircle, Trash2, User, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

interface RequestsProps {
  requests: ProfileRequest[];
  employees: Employee[];
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
}

export const Requests: React.FC<RequestsProps> = ({ requests, employees, onResolve, onDelete }) => {
  const getEmployee = (id: string) => employees.find(e => e.id === id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Update Requests</h2>
        <p className="text-slate-500">Manage employee profile change requests from the attendance portal.</p>
      </div>

      <div className="grid gap-6">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="rounded-full bg-slate-50 p-6 mb-4">
              <Inbox className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Pending Requests</h3>
            <p className="text-slate-500 mt-1 max-w-xs">Everything is up to date! Requests will appear here when employees submit update forms.</p>
          </div>
        ) : (
          requests.map((request) => {
            const emp = getEmployee(request.employeeId);
            return (
              <div 
                key={request.id} 
                className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border transition-all ${
                  request.status === 'Pending' ? 'border-slate-100' : 'border-emerald-100 bg-emerald-50/20'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <div className="flex flex-col items-center md:items-start shrink-0">
                    <img
                      src={emp?.avatar || 'https://ui-avatars.com/api/?name=Unknown'}
                      alt={emp?.name}
                      className="h-14 w-14 rounded-full object-cover shadow-sm mb-3"
                    />
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      request.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                       <div>
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                             {emp?.name || 'Unknown Employee'}
                             <span className="text-xs font-normal text-slate-400">({request.employeeId})</span>
                          </h3>
                          <div className="flex items-center text-xs text-slate-500 mt-1">
                             <Calendar className="h-3 w-3 mr-1" />
                             Submitted on {new Date(request.date).toLocaleDateString()}
                          </div>
                       </div>
                       
                       <div className="flex gap-2">
                          {request.status === 'Pending' && (
                            <button
                              onClick={() => onResolve(request.id)}
                              className="flex items-center px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                              Mark Resolved
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(request.id)}
                            className="flex items-center px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Dismiss
                          </button>
                       </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative">
                       <MessageSquare className="h-4 w-4 text-slate-300 absolute top-4 right-4" />
                       <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Request Details</h4>
                       <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {request.description}
                       </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                       <AlertCircle className="h-3.5 w-3.5" />
                       Admin Note: Update this information in the "Employees" tab after resolving.
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
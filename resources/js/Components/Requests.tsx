import React, { useState } from 'react';
import { Transition } from '@headlessui/react';
import { ProfileRequest, Employee } from '../types';
import { Inbox, CheckCircle, Trash2, Calendar, Clock, AlertCircle, Search, CheckCircle2 } from 'lucide-react';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Resolved'>('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Sort requests by date (newest first)
  const sortedRequests = [...(requests || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter requests
  const filteredRequests = sortedRequests.filter(req => {
    if (filterStatus !== 'All' && req.status !== filterStatus) return false;

    if (searchQuery) {
      const emp = getEmployee(req.employeeId);
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = emp?.name.toLowerCase().includes(searchLower) || req.employeeId.toLowerCase().includes(searchLower);
      const descMatch = req.description.toLowerCase().includes(searchLower);
      if (!nameMatch && !descMatch) return false;
    }

    return true;
  });

  const handleResolveRequest = (id: string) => {
    onResolve(id);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const confirmDeleteRequest = () => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.updateRequests}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t.manageRequests}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isId ? "Cari nama..." : "Search name..."}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg w-full sm:w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex p-1 space-x-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            {(['All', 'Pending', 'Resolved'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterStatus === status
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
              >
                {status === 'All' ? (isId ? 'Semua' : 'All') :
                  status === 'Pending' ? t.pending : t.resolved}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="rounded-full bg-slate-50 dark:bg-slate-800/50 p-4 mb-3 transition-colors">
              {filterStatus === 'Pending' ? <CheckCircle className="h-8 w-8 text-emerald-400 dark:text-emerald-500" /> : <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-500" />}
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {filterStatus === 'Pending'
                ? (isId ? 'Tugas Selesai!' : 'All Caught Up!')
                : t.noPendingRequests}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              {searchQuery
                ? (isId ? 'Tidak ada permintaan yang cocok dengan pencarian Anda.' : 'No requests match your search criteria.')
                : (filterStatus === 'Pending'
                  ? (isId ? 'Tidak ada permintaan yang perlu diproses.' : 'No pending requests left to resolve.')
                  : (isId ? 'Tidak ada permintaan yang ditemukan.' : 'No requests found.'))}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.employee}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.requestDetails}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.date}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{isId ? 'Aksi' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 transition-colors">
                {filteredRequests.map((request) => {
                  const emp = getEmployee(request.employeeId);
                  return (
                    <tr key={request.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={emp?.avatar || `https://ui-avatars.com/api/?name=${request.employeeId}`}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 border border-slate-100 dark:border-slate-800"
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
                              onClick={() => handleResolveRequest(request.id)}
                              className="p-1.5 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-800/50 transition-all"
                              title={t.markResolved}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirmId(request.id)}
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

      {requests.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 px-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {t.adminNote}
        </div>
      )}

      {/* Toast Notification */}
      <Transition
        show={showSuccessToast}
        enter="transition ease-out duration-300 transform"
        enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        enterTo="opacity-100 translate-y-0 sm:scale-100"
        leave="transition ease-in duration-200 transform"
        leaveFrom="opacity-100 translate-y-0 sm:scale-100"
        leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        className="fixed bottom-4 right-4 z-50 flex"
      >
        <div className="flex items-center gap-3 bg-slate-800 dark:bg-slate-800 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 dark:border-slate-700">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">{isId ? 'Berhasil' : 'Success'}</p>
            <p className="text-xs text-slate-300">{isId ? 'Permintaan telah ditandai selesai.' : 'Request marked as resolved.'}</p>
          </div>
        </div>
      </Transition>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-xl transition-all border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white pb-1">{isId ? 'Hapus Permintaan?' : 'Delete Request?'}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isId ? 'Apakah Anda yakin ingin menghapus permintaan ini secara permanen? Tindakan ini tidak dapat dibatalkan.'
                    : 'Are you sure you want to permanently delete this request? This action cannot be undone.'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="inline-flex justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 transition-colors"
              >
                {isId ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteRequest}
                className="inline-flex justify-center rounded-lg border border-transparent bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 transition-colors"
              >
                {isId ? 'Ya, Hapus' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

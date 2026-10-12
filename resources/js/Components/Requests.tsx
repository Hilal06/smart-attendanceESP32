import React, { useState } from 'react';
import { Transition } from '@headlessui/react';
import { ProfileRequest, Profile } from '../types';
import { Inbox, CheckCircle, Trash2, Calendar, Clock, AlertCircle, Search, CheckCircle2, XCircle } from 'lucide-react';

interface RequestsProps {
  requests: ProfileRequest[];
  profiles: Profile[];
  onResolve: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  t: any;
}

export const Requests: React.FC<RequestsProps> = ({ requests = [], profiles = [], onResolve, onReject, onDelete, t }) => {
  const getProfile = (id: string) => profiles.find(e => e.id === id);
  const isId = t.dashboard === 'Dasbor'; // Simple locale detection based on translation

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Accessible Escape key listener
  React.useEffect(() => {
    if (!deleteConfirmId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDeleteConfirmId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteConfirmId]);

  // Sort requests by date (newest first)
  const sortedRequests = [...(requests || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter requests
  const filteredRequests = sortedRequests.filter(req => {
    if (filterStatus !== 'All' && req.status !== filterStatus) return false;

    if (searchQuery) {
      const emp = getProfile(req.profileId);
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = emp?.name.toLowerCase().includes(searchLower) || req.profileId.toLowerCase().includes(searchLower);
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

  const handleRejectRequest = (id: string) => {
    onReject(id);
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
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg w-full sm:w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-theme-primary/20 focus:border-theme-primary transition-colors"
            />
          </div>

          <div className="flex p-1 space-x-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterStatus === status
                  ? 'bg-white dark:bg-slate-800 text-theme-primary font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
              >
                {status === 'All' ? (isId ? 'Semua' : 'All') :
                  status === 'Pending' ? t.pending :
                    status === 'Approved' ? t.approved : t.rejected}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm transition-colors">
        {filteredRequests.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.noPendingRequests}</h3>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {filteredRequests.map((request) => {
              const emp = getProfile(request.profileId);
              return (
                <div key={`timeline-${request.id}`} className="relative">
                  {/* Node circle on timeline */}
                  <span className={`absolute -left-6 sm:-left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-slate-900 border-2 ${
                    request.status === 'Pending' ? 'border-amber-500 text-amber-500' : request.status === 'Approved' ? 'border-emerald-500 text-emerald-500' : 'border-rose-500 text-rose-500'
                  }`}>
                    {request.status === 'Pending' ? <Clock className="h-3 w-3" /> : request.status === 'Approved' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  </span>

                  <div className="bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800/80 p-4 hover:border-theme-primary/30 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={emp?.avatar || `https://ui-avatars.com/api/?name=${request.profileId}`}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white mr-2">
                            {emp?.name || request.profileId}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                            {emp?.role || 'User'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{new Date(request.date).toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className={`font-semibold px-2 py-0.5 rounded-full border ${request.status === 'Pending' ? 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800' : request.status === 'Approved' ? 'bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800' : 'bg-rose-100/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800'}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                      {request.description}
                    </p>

                    <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80">
                      {request.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleResolveRequest(request.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>{isId ? 'Setujui' : 'Approve'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(request.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>{isId ? 'Tolak' : 'Reject'}</span>
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(request.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        title={t.dismiss}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-theme-primary-light text-theme-primary border border-theme-primary/20">
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-900/50 backdrop-blur-xs p-4"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-request-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-xl transition-all border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 id="delete-request-title" className="text-lg font-bold text-slate-900 dark:text-white pb-1">{isId ? 'Hapus Permintaan?' : 'Delete Request?'}</h3>
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

import React, { useState } from 'react';
import { Announcement, UserRole } from '../types';
import { Plus, Edit, Trash2, X, AlertTriangle, Megaphone, Calendar, AlertCircle, Search, Filter, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface AnnouncementsProps {
  announcements: Announcement[];
  userRole: UserRole;
  onAdd: (announcement: Announcement) => void;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
  t: any;
}

export const Announcements: React.FC<AnnouncementsProps> = ({ announcements, userRole, onAdd, onEdit, onDelete, t }) => {
  const isAdmin = userRole === 'admin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initialFormState: Announcement = {
    // Default to WIB date
    id: '', title: '', content: '', date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }), priority: 'Normal',
  };

  const [formData, setFormData] = useState<Announcement>(initialFormState);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Search, Filter, and Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Filter and Paginate Announcements
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'All' || announcement.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const totalPages = Math.ceil(filteredAnnouncements.length / ITEMS_PER_PAGE);
  const paginatedAnnouncements = filteredAnnouncements.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset to page 1 when search or filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, priorityFilter]);

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'title' && !value.trim()) error = `${t.language === 'id' ? 'Judul' : 'Title'} ${t.errorRequired}`;
    else if (name === 'content' && !value.trim()) error = `${t.language === 'id' ? 'Konten' : 'Content'} ${t.errorRequired}`;

    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[name] = error; else delete newErrors[name];
      return newErrors;
    });
    return !error;
  };

  const handleOpenAdd = () => { setFormData({ ...initialFormState, id: Date.now().toString() }); setErrors({}); setIsEditMode(false); setIsModalOpen(true); };
  const handleOpenEdit = (announcement: Announcement) => { setFormData(announcement); setErrors({}); setIsEditMode(true); setIsModalOpen(true); };
  const handleOpenDelete = (id: string) => { setDeleteId(id); setIsDeleteConfirmOpen(true); };

  // Added handleDelete to process the deletion after confirmation
  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setIsDeleteConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateField('title', formData.title) && validateField('content', formData.content)) {
      setIsProcessing(true);
      try {
        if (isEditMode) onEdit(formData); else onAdd(formData);
        setIsModalOpen(false);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Urgent': return 'bg-rose-600 text-white border-rose-600';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'Normal': return t.priorityNormal;
      case 'High': return t.priorityHigh;
      case 'Urgent': return t.priorityUrgent;
      default: return priority;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.announcements}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t.stayUpdated}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.language === 'id' ? 'Cari pengumuman...' : 'Search announcements...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="pl-9 pr-8 py-2 w-full sm:w-auto rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
            >
              <option value="All">{t.language === 'id' ? 'Semua Prioritas' : 'All Priorities'}</option>
              <option value="Normal">{t.priorityNormal}</option>
              <option value="High">{t.priorityHigh}</option>
              <option value="Urgent">{t.priorityUrgent}</option>
            </select>
          </div>
          {isAdmin && (
            <button onClick={handleOpenAdd} className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" />
              {t.newAnnouncement}
            </button>
          )}
        </div>
      </div>

      {/* Announcements Grid */}
      <div className="grid gap-6">
        {filteredAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm p-12 text-center shadow-sm border border-dashed border-slate-200 dark:border-slate-700 transition-colors">
            <div className="rounded-full bg-white dark:bg-slate-800 p-4 mb-4 transition-colors shadow-sm ring-4 ring-slate-50 dark:ring-slate-900/50 animate-bounce">
              <Megaphone className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {searchTerm || priorityFilter !== 'All'
                ? (t.language === 'id' ? 'Pengumuman Tidak Ditemukan' : 'No Announcements Found')
                : t.noAnnouncements}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
              {searchTerm || priorityFilter !== 'All'
                ? (t.language === 'id' ? 'Coba sesuaikan kata kunci pencarian atau filter Anda.' : 'Try adjusting your search keywords or filters.')
                : t.checkLater}
            </p>
          </div>
        ) : (
          paginatedAnnouncements.map((announcement) => (
            <div key={announcement.id} className={`group relative overflow-hidden rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 shadow-sm border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${announcement.priority === 'Urgent' ? 'border-rose-200/50 dark:border-rose-900/30 bg-rose-50/40 dark:bg-rose-900/10 hover:border-rose-300 dark:hover:border-rose-500/30' : announcement.priority === 'High' ? 'border-amber-200/50 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-900/10 hover:border-amber-300 dark:hover:border-amber-500/30' : 'border-white/20 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-500/30'}`}>
              {announcement.priority === 'Urgent' && (<div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]"></div>)}
              {announcement.priority === 'High' && (<div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]"></div>)}
              {announcement.priority === 'Normal' && (<div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] opacity-0 group-hover:opacity-100 transition-opacity"></div>)}
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-10">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(announcement.priority).includes('rose') ? (announcement.priority === 'Urgent' ? 'bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-200 dark:shadow-none' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-800/50') : announcement.priority === 'High' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800/50'}`}>
                      {announcement.priority === 'Urgent' && <AlertTriangle className="mr-1.5 h-3 w-3" />}
                      {getPriorityLabel(announcement.priority)}
                    </span>
                    <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                      <Calendar className="mr-1.5 h-4 w-4 text-slate-400" />
                      {new Date(announcement.date).toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' })}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{announcement.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{announcement.content}</p>
                </div>
                {isAdmin && (
                  <div className="flex space-x-1 ml-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-100 dark:border-slate-700/50">
                    <button onClick={() => handleOpenEdit(announcement)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm rounded-md transition-all" title={t.editAnnouncement}>
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleOpenDelete(announcement.id)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm rounded-md transition-all" title={t.delete}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border border-white/20 dark:border-slate-800 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md px-4 py-3 sm:px-6 rounded-xl shadow-sm transition-colors mt-6">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {t.language === 'id' ? 'Menampilkan' : 'Showing'}{' '}
                <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>{' '}
                {t.language === 'id' ? 'hingga' : 'to'}{' '}
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredAnnouncements.length)}
                </span>{' '}
                {t.language === 'id' ? 'dari' : 'of'}{' '}
                <span className="font-medium">{filteredAnnouncements.length}</span>{' '}
                {t.language === 'id' ? 'hasil' : 'results'}
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <div className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-600">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
          {/* Mobile simplistic pagination */}
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </button>
            <span className="text-sm flex items-center text-slate-600 dark:text-slate-400 font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-2xl rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 transition-colors">

            {/* Sticky Header */}
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-5 shrink-0 bg-white/50 dark:bg-slate-900/50 rounded-t-2xl z-10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                  {isEditMode ? <Edit className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
                </div>
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">{isEditMode ? t.editAnnouncement : t.newAnnouncement}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700" disabled={isProcessing}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="announcement-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.language === 'id' ? 'Judul' : 'Title'} <span className="text-rose-500">*</span></label>
                <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} disabled={isProcessing} className={`block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 transition-all ${errors.title ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30 dark:bg-rose-900/20' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`} />
                {errors.title && <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.title}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.priority}</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })} disabled={isProcessing} className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-colors appearance-none">
                    <option value="Normal">{t.priorityNormal}</option>
                    <option value="High">{t.priorityHigh}</option>
                    <option value="Urgent">{t.priorityUrgent}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.date}</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} disabled={isProcessing} className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-colors [color-scheme:light] dark:[color-scheme:dark]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.language === 'id' ? 'Konten' : 'Content'} <span className="text-rose-500">*</span></label>
                <textarea required rows={6} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} disabled={isProcessing} className={`block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 transition-all ${errors.content ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30 dark:bg-rose-900/20' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`} />
                {errors.content && <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.content}</p>}
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="border-t border-slate-200/50 dark:border-slate-800/50 p-6 shrink-0 bg-white/50 dark:bg-slate-900/50 rounded-b-xl z-10 flex justify-end space-x-3 transition-colors">
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isProcessing} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">{t.cancel}</button>
              <button type="submit" form="announcement-form" disabled={isProcessing} className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] transition-all">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.language === 'id' ? 'Memproses...' : 'Processing...'}
                  </>
                ) : (
                  isEditMode ? t.saveChanges : t.postAnnouncement
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-sm rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 overflow-hidden text-center transition-colors">
            <div className="bg-rose-500/10 dark:bg-rose-500/20 px-6 py-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/30 ring-4 ring-rose-50 dark:ring-rose-500/10 mb-4">
                <AlertCircle className="h-7 w-7 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-rose-400">{t.confirmDeletion}</h3>
              <p className="mt-2 text-sm text-rose-600/80 dark:text-rose-400/80 font-medium">{t.actionUndone}</p>
            </div>
            <div className="grid grid-cols-2 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="px-4 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none">{t.cancel}</button>
              <button onClick={handleDelete} className="px-4 py-4 border-l border-slate-100 dark:border-slate-800/50 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/30 focus:outline-none transition-colors">{t.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

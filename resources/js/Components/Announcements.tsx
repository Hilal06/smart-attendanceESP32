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

  // Accessible Escape key listener for dialogs
  React.useEffect(() => {
    if (!isModalOpen && !isDeleteConfirmOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setIsDeleteConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isDeleteConfirmOpen]);

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
              className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="pl-9 pr-8 py-2 w-full sm:w-auto rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 transition-colors appearance-none"
            >
              <option value="All">{t.language === 'id' ? 'Semua Prioritas' : 'All Priorities'}</option>
              <option value="Normal">{t.priorityNormal}</option>
              <option value="High">{t.priorityHigh}</option>
              <option value="Urgent">{t.priorityUrgent}</option>
            </select>
          </div>
          {isAdmin && (
            <button onClick={handleOpenAdd} className="flex items-center justify-center rounded-lg bg-theme-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-theme-primary-hover transition-colors whitespace-nowrap">
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
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-4 mb-4 transition-colors text-slate-400 dark:text-slate-500 shadow-xs">
              <Megaphone className="h-8 w-8" />
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
            <div key={announcement.id} className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs border transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 ${
              announcement.priority === 'Urgent'
                ? 'border-rose-300/70 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10'
                : announcement.priority === 'High'
                ? 'border-amber-300/70 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10'
                : 'border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${
                      announcement.priority === 'Urgent'
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                        : announcement.priority === 'High'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        announcement.priority === 'Urgent' ? 'bg-rose-500' : announcement.priority === 'High' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      {getPriorityLabel(announcement.priority)}
                    </span>
                    <div className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
                      <Calendar className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                      {new Date(announcement.date).toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' })}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{announcement.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{announcement.content}</p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0 p-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <button onClick={() => handleOpenEdit(announcement)} className="p-1.5 text-slate-500 hover:text-theme-primary hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all" title={t.editAnnouncement}>
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleOpenDelete(announcement.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all" title={t.delete}>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-all duration-300"
          onClick={() => setIsModalOpen(false)}
        >
                    <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 transition-colors overflow-hidden"
          >
            {/* Header: Executive Precision Console */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-5 shrink-0 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-xs rounded-t-2xl z-10 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-theme-primary-light border border-theme-primary/20 rounded-xl text-theme-primary">
                  {isEditMode ? <Edit className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
                </div>
                <div>
                  <h3 id="announcement-modal-title" className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    {isEditMode ? t.editAnnouncement : t.newAnnouncement}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.language === 'id' ? 'Siarkan pengumuman atau instruksi resmi ke sivitas' : 'Official institutional broadcast bulletin'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label={t.language === 'id' ? 'Tutup dialog' : 'Close dialog'}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-theme-primary"
                disabled={isProcessing}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body with Segmented Priority Selector */}
            <form id="announcement-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  {t.language === 'id' ? 'Judul Pengumuman' : 'Announcement Title'} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={isProcessing}
                  placeholder={t.language === 'id' ? 'Contoh: Libur Nasional & Jadwal Pengganti' : 'e.g., Campus Maintenance Advisory'}
                  className={`block w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all ${
                    errors.title
                      ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30 dark:bg-rose-900/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20'
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {errors.title}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.priority}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    {(['Normal', 'High', 'Urgent'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        disabled={isProcessing}
                        onClick={() => setFormData({ ...formData, priority: p })}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                          formData.priority === p
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          p === 'Normal' ? 'bg-emerald-500' : p === 'High' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        <span>{p === 'Normal' ? t.priorityNormal : p === 'High' ? t.priorityHigh : t.priorityUrgent}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.date}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      disabled={isProcessing}
                      className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 pl-9 pr-3.5 py-2 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  {t.language === 'id' ? 'Isi Pengumuman' : 'Announcement Content'} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  disabled={isProcessing}
                  placeholder={t.language === 'id' ? 'Tuliskan detail pengumuman secara lengkap...' : 'Write the complete announcement details...'}
                  className={`block w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all resize-y ${
                    errors.content
                      ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30 dark:bg-rose-900/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20'
                  }`}
                />
                {errors.content && (
                  <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {errors.content}
                  </p>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-slate-200/80 dark:border-slate-800/80 px-6 py-4 shrink-0 bg-slate-50/80 dark:bg-slate-900/90 rounded-b-2xl z-10 flex justify-end items-center gap-3 transition-colors">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isProcessing}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-2xs"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                form="announcement-form"
                disabled={isProcessing}
                className="flex items-center justify-center rounded-xl btn-theme-primary px-5 py-2 text-xs font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] transition-all"
              >
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs transition-all duration-300"
          onClick={() => setIsDeleteConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-delete-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden text-center transition-colors"
          >
            <div className="bg-rose-50 dark:bg-rose-950/30 px-6 py-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40 mb-4">
                <AlertCircle className="h-7 w-7 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 id="announcement-delete-title" className="text-xl font-bold text-slate-900 dark:text-white">
                {t.confirmDeletion}
              </h3>
              <p className="mt-2 text-sm text-rose-600 dark:text-rose-400 font-medium">{t.actionUndone}</p>
            </div>
            <div className="grid grid-cols-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-3.5 border-l border-slate-200 dark:border-slate-800 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 focus:outline-hidden transition-colors"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

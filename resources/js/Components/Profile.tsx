import React, { useState } from 'react';
import { Profile as ProfileType, ProfileRequest } from '../types';
import { Mail, Phone, MapPin, Briefcase, Calendar, Shield, Send, X, AlertCircle, Clock, CheckCircle, ChevronLeft, ChevronRight, FileText, Search, Loader2, Lock, User } from 'lucide-react';
import { router } from '@inertiajs/react';

interface ProfileProps {
  profile: ProfileType | undefined;
  requests?: ProfileRequest[];
  onRequestUpdate: (description: string) => void;
  t: any;
  externalErrors?: Record<string, string>;
}

export const Profile: React.FC<ProfileProps> = ({ profile, requests = [], onRequestUpdate, t, externalErrors = {} }) => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [requestDescription, setRequestDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const ITEMS_PER_PAGE = 3;

  // Accessible Escape key listener for dialogs
  React.useEffect(() => {
    if (!isRequestModalOpen && !isPasswordModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsRequestModalOpen(false);
        setIsPasswordModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRequestModalOpen, isPasswordModalOpen]);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.language === 'id' ? 'Profil Karyawan Tidak Ditemukan' : 'Profile Profile Not Found'}</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{t.language === 'id' ? 'Silakan masuk dengan ID Karyawan yang valid.' : 'Please log in with a valid Profile ID to view your profile.'}</p>
      </div>
    );
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestDescription.trim()) {
      setIsProcessing(true);
      try {
        await onRequestUpdate(requestDescription);
        setSubmitted(true);
        setTimeout(() => {
          setIsRequestModalOpen(false);
          setSubmitted(false);
          setRequestDescription('');
        }, 2000);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    router.post('/profile/password', passwordForm, {
      preserveScroll: true,
      onSuccess: () => {
        setIsPasswordModalOpen(false);
        setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
        setIsProcessing(false);
      },
      onError: () => setIsProcessing(false),
      onFinish: () => setIsProcessing(false)
    });
  };

  // Filter and sort requests
  const filteredRequests = requests.filter(req =>
    req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedRequests = [...filteredRequests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPages = Math.ceil(sortedRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = sortedRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page on search
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="profile-bento max-w-6xl mx-auto space-y-6 pb-12">
          {/* Header with High-Contrast Meta */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={profile.avatar} alt={profile.name} className="h-16 w-16 rounded-2xl border-2 border-slate-100 dark:border-slate-800 object-cover shadow-sm" />
                <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 ${profile.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{profile.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-theme-primary-light text-theme-primary-text border border-theme-primary/20">{profile.role}</span>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3">
                  <span>ID: <strong className="text-slate-700 dark:text-slate-200">{profile.id}</strong></span>
                  <span>•</span>
                  <span>{profile.department}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!(profile.role.toLowerCase() === 'student' && !profile.canChangePassword) && (
                <button onClick={() => setIsPasswordModalOpen(true)} className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all">
                  <Lock className="mr-1.5 h-3.5 w-3.5" />{t.language === 'id' ? 'Ubah Sandi' : 'Change Password'}
                </button>
              )}
              <button type="button" onClick={() => setIsRequestModalOpen(true)} className="flex items-center rounded-xl btn-theme-primary px-5 py-2.5 text-xs font-bold shadow-xs transition-colors">
                <Send className="mr-1.5 h-3.5 w-3.5" />{t.requestUpdate}
              </button>
            </div>
          </div>

          {/* Bento 3-Grid Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bento-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400"><Clock className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.joinDate}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{new Date(profile.joinDate).toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
            <div className="bento-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400"><Shield className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.accessRole}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{t.standardUser}</p>
              </div>
            </div>
            <div className="bento-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400"><CheckCircle className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Presensi</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{profile.status === 'Active' ? t.active : t.onLeave}</p>
              </div>
            </div>
          </div>

          {/* 2-Column Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Card */}
            <div className="bento-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Mail className="h-4 w-4 text-theme-primary" /> {t.personalContact}
              </h4>
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">{t.emailAddress}</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">{profile.email}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">{t.phoneNumber}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{profile.phoneNumber || '-'}</span>
                </div>
                <div className="flex justify-between items-start py-1">
                  <span className="text-slate-500 font-medium shrink-0">{t.address}</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right max-w-xs">{profile.address || '-'}</span>
                </div>
              </div>
            </div>

            {/* Employment / Student Info */}
            <div className="bento-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Briefcase className="h-4 w-4 text-theme-primary" /> {profile.role.toLowerCase() === 'student' ? 'Student Information' : t.employmentInfo}
              </h4>
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">{t.position}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{profile.role}</span>
                </div>
                {profile.role.toLowerCase() === 'student' && profile.class && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-medium">Class</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{profile.class}</span>
                  </div>
                )}
                {profile.age && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-medium">Age</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{profile.age}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">{t.department}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{profile.department}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Policy note */}
          <div className="rounded-xl bg-amber-50/80 dark:bg-amber-900/20 p-4 border border-amber-200/50 dark:border-amber-800/50 flex gap-3 text-xs text-amber-800 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{t.infoPolicy}</p>
          </div>

          {/* Request Logs Table Container */}
          <div className="requests-table-container bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="font-bold flex items-center text-slate-900 dark:text-white text-base">
                <FileText className="h-4 w-4 mr-2 text-theme-primary" /> {t.language === 'id' ? 'Riwayat Permintaan' : 'Request History'}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.language === 'id' ? 'Cari permintaan...' : 'Search requests...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 w-full sm:w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-theme-primary"
                />
              </div>
            </div>

            {sortedRequests.length > 0 ? (
              <>
                <div className="overflow-x-auto p-4">
                  <table className="min-w-full border-separate border-spacing-y-2">
                    <thead className="bg-transparent text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2 text-left">{t.date}</th>
                        <th className="px-4 py-2 text-left">{t.requestDetails}</th>
                        <th className="px-4 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRequests.map((req) => (
                        <tr key={req.id} className="bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-600 dark:text-slate-300 rounded-l-xl">
                            {new Date(req.date).toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { timeZone: 'Asia/Jakarta', month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-slate-900 dark:text-slate-200 max-w-md truncate">
                            {req.description}
                          </td>
                          <td className="px-4 py-3 text-right rounded-r-xl">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${req.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                              {req.status === 'Pending' ? <Clock className="mr-1 h-3 w-3" /> : <CheckCircle className="mr-1 h-3 w-3" />}
                              {req.status === 'Pending' ? t.pending : t.resolved}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
                    <p className="text-slate-500">
                      {t.page} <span className="font-medium">{currentPage}</span> {t.of} <span className="font-medium">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                      <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 disabled:opacity-40">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 disabled:opacity-40">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                {t.language === 'id' ? 'Belum ada riwayat permintaan.' : 'No request history found.'}
              </div>
            )}
          </div>

          {/* Shared Modals */}
          {isRequestModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.requestUpdate}</h3>
                  <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
                  {submitted ? (
                    <div className="py-8 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-3"><Send className="h-7 w-7 text-emerald-600" /></div><h4 className="text-base font-bold">{t.requestSubmitted}</h4><p className="text-slate-500 text-xs mt-1">{t.adminReview}</p></div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{t.language === 'id' ? 'Silakan jelaskan informasi apa yang perlu diperbarui. Berikan detail spesifik.' : 'Please describe what information needs to be updated. Be specific.'}</p>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">{t.changeDescription}</label>
                        <textarea required rows={4} value={requestDescription} onChange={(e) => setRequestDescription(e.target.value)} className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs" />
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-lg">{t.cancel}</button>
                        <button type="submit" disabled={isProcessing} className="rounded-lg btn-theme-primary px-5 py-2 text-xs font-bold disabled:opacity-50">
                          {isProcessing ? <Loader2 className="animate-spin inline-block mr-1.5 h-3.5 w-3.5" /> : null}
                          {t.sendRequest}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </div>
          )}

          {isPasswordModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.language === 'id' ? 'Ubah Kata Sandi' : 'Change Password'}</h3>
                  <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                </div>
                <form id="password-form-v1" onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">{t.language === 'id' ? 'Kata Sandi Saat Ini' : 'Current Password'}</label>
                    <input type="password" required value={passwordForm.current_password} onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">{t.language === 'id' ? 'Kata Sandi Baru' : 'New Password'}</label>
                    <input type="password" required value={passwordForm.new_password} onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">{t.language === 'id' ? 'Konfirmasi Kata Sandi Baru' : 'Confirm New Password'}</label>
                    <input type="password" required value={passwordForm.new_password_confirmation} onChange={e => setPasswordForm(f => ({ ...f, new_password_confirmation: e.target.value }))} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-lg">{t.cancel}</button>
                    <button type="submit" disabled={isProcessing} className="rounded-lg btn-theme-primary px-5 py-2 text-xs font-bold disabled:opacity-50">
                      {isProcessing ? <Loader2 className="animate-spin inline-block mr-1.5 h-3.5 w-3.5" /> : null}
                      {t.language === 'id' ? 'Simpan Sandi' : 'Save Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
      </div>
  );
};

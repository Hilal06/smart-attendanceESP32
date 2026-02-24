import React, { useState } from 'react';
import { Profile as ProfileType, ProfileRequest } from '../types';
import { Mail, Phone, MapPin, Briefcase, Calendar, Shield, Send, X, AlertCircle, Clock, CheckCircle, ChevronLeft, ChevronRight, FileText, Search, Loader2, Lock } from 'lucide-react';
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
    <div className="max-w-4xl space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t.profile}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t.language === 'id' ? 'Lihat informasi pribadi dan pekerjaan Anda.' : 'View your personal and employment information.'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {!(profile.role.toLowerCase() === 'student' && !profile.canChangePassword) && (
            <button onClick={() => setIsPasswordModalOpen(true)} className="flex items-center rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:-translate-y-0.5 transition-all">
              <Lock className="mr-2 h-4 w-4" />{t.language === 'id' ? 'Ubah Sandi' : 'Change Password'}
            </button>
          )}
          <button onClick={() => setIsRequestModalOpen(true)} className="flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <Send className="mr-2 h-4 w-4" />{t.requestUpdate}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/20 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-md group">
            <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 dark:from-indigo-600 dark:via-purple-700 dark:to-indigo-800 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 pointer-events-none"></div>
            </div>
            <div className="px-6 pb-8 text-center relative">
              <div className="-mt-16 flex justify-center mb-4">
                <div className="rounded-full p-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-lg transition-transform duration-300 group-hover:scale-105">
                  <img src={profile.avatar} alt={profile.name} className="h-28 w-28 rounded-full border-2 border-slate-100 dark:border-slate-800 object-cover shadow-sm transition-colors duration-200" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{profile.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{profile.role}</p>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-md">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock className="h-3 w-3" /> {t.language === 'id' ? 'Statistik Cepat' : 'Quick Stats'}
            </h4>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <span className="font-medium text-slate-500 dark:text-slate-400">ID</span><span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">{profile.id}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <span className="font-medium text-slate-500 dark:text-slate-400">{t.department}</span><span className="font-bold text-slate-900 dark:text-white">{profile.department}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <span className="font-medium text-slate-500 dark:text-slate-400">{t.joinDate}</span><span className="font-bold text-slate-900 dark:text-white">{new Date(profile.joinDate).toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <div className="px-6 py-4 border-b border-white/20 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 font-bold text-slate-900 dark:text-white flex items-center"><MapPin className="h-4 w-4 mr-2 text-indigo-500" />{t.personalContact}</div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm relative">
              <div className="flex gap-4 items-start group">
                <div className="p-3 bg-blue-50/80 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 mt-0.5 group-hover:scale-110 transition-transform duration-300 shadow-sm"><Mail className="h-5 w-5" /></div>
                <div><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{t.emailAddress}</p><p className="font-medium text-slate-900 dark:text-slate-200">{profile.email}</p></div>
              </div>
              <div className="flex gap-4 items-start group">
                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 mt-0.5 group-hover:scale-110 transition-transform duration-300 shadow-sm"><Phone className="h-5 w-5" /></div>
                <div><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{t.phoneNumber}</p><p className="font-medium text-slate-900 dark:text-slate-200">{profile.phoneNumber || '-'}</p></div>
              </div>
              <div className="md:col-span-2 flex gap-4 items-start group">
                <div className="p-3 bg-amber-50/80 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 mt-0.5 group-hover:scale-110 transition-transform duration-300 shadow-sm"><MapPin className="h-5 w-5" /></div>
                <div><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{t.address}</p><p className="font-medium leading-relaxed text-slate-900 dark:text-slate-200 max-w-xl">{profile.address || '-'}</p></div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <div className="px-6 py-4 border-b border-white/20 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 font-bold text-slate-900 dark:text-white flex items-center"><Briefcase className="h-4 w-4 mr-2 text-indigo-500" />{t.employmentInfo}</div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex gap-4 items-start group">
                <div className="p-3 bg-indigo-50/80 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 mt-0.5 group-hover:scale-110 transition-transform duration-300 shadow-sm"><Briefcase className="h-5 w-5" /></div>
                <div><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{t.position}</p><p className="font-bold text-slate-900 dark:text-slate-100">{profile.role}</p></div>
              </div>
              <div className="flex gap-4 items-start group">
                <div className="p-3 bg-rose-50/80 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400 mt-0.5 group-hover:scale-110 transition-transform duration-300 shadow-sm"><Shield className="h-5 w-5" /></div>
                <div><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{t.accessRole}</p><p className="font-bold text-slate-900 dark:text-slate-100">{t.standardUser}</p></div>
              </div>
              <div className="flex gap-4 items-start group">
                <div className="p-3 bg-teal-50/80 dark:bg-teal-900/30 rounded-xl text-teal-600 dark:text-teal-400 mt-0.5 group-hover:scale-110 transition-transform duration-300 shadow-sm"><Calendar className="h-5 w-5" /></div>
                <div><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{t.joinDate}</p><p className="font-bold text-slate-900 dark:text-slate-100">{new Date(profile.joinDate).toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: 'short', day: 'numeric' })}</p></div>
              </div>
              <div className="flex gap-4 items-start group">
                <div className="p-3 bg-sky-50/80 dark:bg-sky-900/30 rounded-xl text-sky-600 dark:text-sky-400 mt-0.5 group-hover:scale-110 transition-transform duration-300 shadow-sm"><CheckCircle className="h-5 w-5" /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Status</p>
                  <p className={`font-bold inline-flex px-2 py-0.5 rounded-full text-[11px] uppercase tracking-wider ${profile.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'}`}>
                    {profile.status === 'Active' ? t.active : t.onLeave}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm p-4 border border-amber-200/50 dark:border-amber-800/50 flex gap-3 text-sm text-amber-800 dark:text-amber-400 transition-colors duration-200 shadow-sm"><AlertCircle className="h-5 w-5 shrink-0" /><p>{t.infoPolicy}</p></div>
        </div>
      </div>

      {/* Request Logs Table */}
      {/* Request Logs Table - Upgraded to floating rows */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300 mt-6 pb-2">
        <div className="px-6 py-5 border-b border-white/20 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-300">
          <div className="font-extrabold flex items-center text-slate-900 dark:text-white text-lg"><FileText className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" /> {t.language === 'id' ? 'Riwayat Permintaan' : 'Request History'}</div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.language === 'id' ? 'Cari permintaan...' : 'Search requests...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-xl border border-slate-300/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
            />
          </div>
        </div>

        {sortedRequests.length > 0 ? (
          <>
            <div className="overflow-x-auto p-4">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead className="bg-transparent text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-2 text-left">{t.date}</th>
                    <th className="px-6 py-2 text-left">{t.requestDetails}</th>
                    <th className="px-6 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-transparent transition-colors duration-300">
                  {paginatedRequests.map((req) => (
                    <tr key={req.id} className="relative bg-white/60 dark:bg-slate-800/60 shadow-sm border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300 rounded-l-2xl z-10 relative">
                        {new Date(req.date).toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { timeZone: 'Asia/Jakarta', month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200 max-w-md truncate z-10 relative">
                        {req.description}
                      </td>
                      <td className="px-6 py-4 text-right rounded-r-2xl z-10 relative">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm border ${req.status === 'Pending' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-800/30 dark:text-amber-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-800/30 dark:text-emerald-400'}`}>
                          {req.status === 'Pending' ? <Clock className="mr-1.5 h-3.5 w-3.5" /> : <CheckCircle className="mr-1.5 h-3.5 w-3.5" />}
                          {req.status === 'Pending' ? t.pending : t.resolved}
                        </span>
                      </td>
                      {/* Professional Hover accent background */}
                      <td className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 dark:from-indigo-900/10 transition-opacity duration-300 pointer-events-none rounded-2xl w-full h-full block" colSpan={0}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 transition-colors duration-200">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.page} <span className="font-medium text-slate-900 dark:text-white">{currentPage}</span> {t.of} <span className="font-medium text-slate-900 dark:text-white">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 text-sm">
            <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-full mb-4 inline-block shadow-sm">
              <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {searchTerm
                ? (t.language === 'id' ? 'Permintaan Tidak Ditemukan' : 'No Requests Found')
                : (t.language === 'id' ? 'Belum Ada Permintaan' : 'No Request History')}
            </h4>
            <p className="max-w-sm mx-auto">
              {searchTerm
                ? (t.language === 'id' ? 'Tidak ada riwayat permintaan yang cocok dengan kriteria pencarian Anda.' : 'No requests match your search criteria.')
                : (t.language === 'id' ? 'Anda belum pernah membuat permintaan untuk memperbarui profil Anda.' : 'You have not made any requests to update your profile yet.')}
            </p>
          </div>
        )}
      </div>

      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-lg rounded-2xl bg-white/95 dark:bg-slate-900/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/20 dark:border-slate-800 max-h-[90vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 transition-colors backdrop-blur-xl">
            {/* Sticky Header */}
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 px-6 py-5 shrink-0 rounded-t-2xl z-10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Send className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">{t.requestUpdate}</h3>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700"
                disabled={isProcessing || submitted}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="request-form" onSubmit={handleSubmitRequest} className="p-8 space-y-4 overflow-y-auto flex-1">
              {submitted ? (
                <div className="py-10 text-center animate-in zoom-in duration-300">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 mb-6 shadow-inner ring-4 ring-emerald-50/50 dark:ring-emerald-500/5">
                    <Send className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{t.requestSubmitted}</h4>
                  <p className="text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto">{t.adminReview}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 font-medium">{t.language === 'id' ? 'Silakan jelaskan informasi apa yang perlu diperbarui. Berikan detail spesifik.' : 'Please describe what information needs to be updated. Be specific.'}</p>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.changeDescription} <span className="text-rose-500">*</span></label>
                    <textarea
                      required
                      rows={5}
                      value={requestDescription}
                      onChange={(e) => setRequestDescription(e.target.value)}
                      disabled={isProcessing}
                      className="block w-full rounded-xl border border-slate-300/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm p-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all resize-none shadow-inner placeholder:text-slate-400/70"
                      placeholder={t.language === 'id' ? 'Contoh: Saya baru saja pindah rumah, alamat baru saya adalah...' : 'Example: I recently moved, my new address is...'}
                    />
                  </div>
                </>
              )}
            </form>

            {/* Sticky Footer */}
            {!submitted && (
              <div className="border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 px-6 py-5 shrink-0 rounded-b-2xl z-10 flex justify-end space-x-3 transition-colors">
                <button type="button" onClick={() => setIsRequestModalOpen(false)} disabled={isProcessing} className="rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm disabled:opacity-50 transition-all">{t.cancel}</button>
                <button type="submit" form="request-form" disabled={isProcessing || !requestDescription.trim()} className="flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all">
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.language === 'id' ? 'Mengirim...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {t.sendRequest}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-md rounded-2xl bg-white/95 dark:bg-slate-900/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/20 dark:border-slate-800 flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 transition-colors backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 px-6 py-5 shrink-0 rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">{t.language === 'id' ? 'Ubah Kata Sandi' : 'Change Password'}</h3>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-all focus:outline-none"
                disabled={isProcessing}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form id="password-form" onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t.language === 'id' ? 'Kata Sandi Saat Ini' : 'Current Password'} <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  disabled={isProcessing}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-white transition-all ${externalErrors['current_password'] ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30 dark:bg-rose-900/20' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                />
                {externalErrors['current_password'] && <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {externalErrors['current_password']}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t.language === 'id' ? 'Kata Sandi Baru' : 'New Password'} <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  disabled={isProcessing}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-white transition-all ${externalErrors['new_password'] ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30 dark:bg-rose-900/20' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                />
                {externalErrors['new_password'] && <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {externalErrors['new_password']}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t.language === 'id' ? 'Konfirmasi Kata Sandi Baru' : 'Confirm New Password'} <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="password"
                  value={passwordForm.new_password_confirmation}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                  disabled={isProcessing}
                  className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </form>

            <div className="border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 px-6 py-4 shrink-0 rounded-b-2xl z-10 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsPasswordModalOpen(false)} disabled={isProcessing} className="rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm disabled:opacity-50 transition-all">{t.cancel}</button>
              <button type="submit" form="password-form" disabled={isProcessing} className="flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all">
                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.language === 'id' ? 'Menyimpan...' : 'Saving...'}</> : (t.language === 'id' ? 'Perbarui Sandi' : 'Update Password')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

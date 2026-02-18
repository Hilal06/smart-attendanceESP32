import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AppLayout } from '../Layouts/AppLayout';
import { Employee, ProfileRequest, Settings, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import { Mail, Phone, MapPin, Briefcase, Calendar, Shield, Send, X, AlertCircle, Clock, CheckCircle, ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react';

interface ProfileProps {
  employee: Employee | undefined;
  requests?: ProfileRequest[];
  settings: Settings;
  userRole: UserRole;
  flash?: { success?: string; error?: string };
}

export default function Profile({ employee, requests = [], settings, userRole }: ProfileProps) {
  const t = TRANSLATIONS[settings.language];
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestDescription, setRequestDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const ITEMS_PER_PAGE = 3;

  if (!employee) {
    return (
      <AppLayout userRole={userRole} settings={settings} t={t}>
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-900">{t.language === 'id' ? 'Profil Karyawan Tidak Ditemukan' : 'Employee Profile Not Found'}</h3>
          <p className="text-slate-500 mt-2">{t.language === 'id' ? 'Silakan masuk dengan ID Karyawan yang valid.' : 'Please log in with a valid Employee ID to view your profile.'}</p>
        </div>
      </AppLayout>
    );
  }

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestDescription.trim()) {
      setIsProcessing(true);
      router.post('/profile/update-request', { description: requestDescription }, {
        onSuccess: () => {
          setSubmitted(true);
          setIsProcessing(false);
          setTimeout(() => { setIsRequestModalOpen(false); setSubmitted(false); setRequestDescription(''); }, 2000);
        },
        onError: () => setIsProcessing(false)
      });
    }
  };

  // Sort requests by date descending
  const sortedRequests = [...requests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPages = Math.ceil(sortedRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = sortedRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <AppLayout userRole={userRole} settings={settings} t={t}>
      <Head title={t.profile} />
      <div className="max-w-4xl space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><h2 className="text-2xl font-bold text-slate-900">{t.profile}</h2><p className="text-slate-500">{t.language === 'id' ? 'Lihat informasi pribadi dan pekerjaan Anda.' : 'View your personal and employment information.'}</p></div>
          <button onClick={() => setIsRequestModalOpen(true)} className="flex items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"><Send className="mr-2 h-4 w-4" />{t.requestUpdate}</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="h-32 bg-indigo-600"></div>
              <div className="px-6 pb-6 text-center">
                <div className="-mt-16 flex justify-center"><img src={employee.avatar} alt={employee.name} className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-sm" /></div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">{employee.name}</h3><p className="text-slate-500 font-medium">{employee.role}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">{t.language === 'id' ? 'Statistik Cepat' : 'Quick Stats'}</h4>
              <div className="space-y-4 text-sm"><div className="flex justify-between"><span>ID</span><span className="font-bold">{employee.id}</span></div><div className="flex justify-between"><span>{t.department}</span><span className="font-bold">{employee.department}</span></div><div className="flex justify-between"><span>{t.joinDate}</span><span className="font-bold">{new Date(employee.joinDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })}</span></div></div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-slate-50/50 font-bold">{t.personalContact}</div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-1"><Mail className="h-3 w-3 mr-1" />{t.emailAddress}</p><p className="font-medium">{employee.email}</p></div>
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-1"><Phone className="h-3 w-3 mr-1" />{t.phoneNumber}</p><p className="font-medium">{employee.phoneNumber || '-'}</p></div>
                <div className="md:col-span-2"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-1"><MapPin className="h-3 w-3 mr-1" />{t.address}</p><p className="font-medium leading-relaxed">{employee.address || '-'}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-slate-50/50 font-bold">{t.employmentInfo}</div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t.position}</p><p className="font-medium">{employee.role}</p></div>
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t.accessRole}</p><p className="font-medium">{t.standardUser}</p></div>
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t.joinDate}</p><p className="font-medium">{new Date(employee.joinDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })}</p></div>
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p><p className="font-bold text-emerald-600">{employee.status === 'Active' ? t.active : t.onLeave}</p></div>
              </div>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 border border-amber-100 flex gap-3 text-sm text-amber-800"><AlertCircle className="h-5 w-5 shrink-0" /><p>{t.infoPolicy}</p></div>
          </div>
        </div>

        {/* Request Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div className="font-bold flex items-center text-slate-900"><FileText className="h-4 w-4 mr-2 text-indigo-500" /> {t.language === 'id' ? 'Riwayat Permintaan' : 'Request History'}</div>
          </div>

          {sortedRequests.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium uppercase text-slate-500 text-xs">{t.date}</th>
                      <th className="px-6 py-3 text-left font-medium uppercase text-slate-500 text-xs">{t.requestDetails}</th>
                      <th className="px-6 py-3 text-right font-medium uppercase text-slate-500 text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {new Date(req.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })}
                        </td>
                        <td className="px-6 py-4 text-slate-900 max-w-md truncate">
                          {req.description}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold uppercase ${req.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
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
                <div className="px-6 py-3 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    {t.page} <span className="font-medium">{currentPage}</span> {t.of} <span className="font-medium">{totalPages}</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              {t.language === 'id' ? 'Belum ada riwayat permintaan.' : 'No request history found.'}
            </div>
          )}
        </div>

        {isRequestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b flex items-center justify-between"><h3 className="text-lg font-bold">{t.requestUpdate}</h3><button onClick={() => setIsRequestModalOpen(false)}><X className="h-6 w-6" /></button></div>
              <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
                {submitted ? (
                  <div className="py-8 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4"><Send className="h-8 w-8 text-emerald-600" /></div><h4 className="text-lg font-bold">{t.requestSubmitted}</h4><p className="text-slate-500 text-sm mt-1">{t.adminReview}</p></div>
                ) : (
                  <>
                    <p className="text-sm text-slate-600">{t.language === 'id' ? 'Silakan jelaskan informasi apa yang perlu diperbarui. Berikan detail spesifik.' : 'Please describe what information needs to be updated. Be specific.'}</p>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{t.changeDescription}</label>
                      <textarea required rows={5} value={requestDescription} onChange={(e) => setRequestDescription(e.target.value)} className="block w-full rounded-xl border p-4 text-sm" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">{t.cancel}</button>
                      <button type="submit" disabled={isProcessing} className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50">
                        {isProcessing ? <Loader2 className="animate-spin inline-block mr-2 h-4 w-4" /> : null}
                        {t.sendRequest}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
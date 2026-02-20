import React, { useState } from 'react';
import { Employee, ProfileRequest } from '../types';
import { Mail, Phone, MapPin, Briefcase, Calendar, Shield, Send, X, AlertCircle, Clock, CheckCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface ProfileProps {
  employee: Employee | undefined;
  requests?: ProfileRequest[];
  onRequestUpdate: (description: string) => void;
  t: any;
}

export const Profile: React.FC<ProfileProps> = ({ employee, requests = [], onRequestUpdate, t }) => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestDescription, setRequestDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
        <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.language === 'id' ? 'Profil Karyawan Tidak Ditemukan' : 'Employee Profile Not Found'}</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{t.language === 'id' ? 'Silakan masuk dengan ID Karyawan yang valid.' : 'Please log in with a valid Employee ID to view your profile.'}</p>
      </div>
    );
  }

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestDescription.trim()) {
      onRequestUpdate(requestDescription);
      setSubmitted(true);
      setTimeout(() => { setIsRequestModalOpen(false); setSubmitted(false); setRequestDescription(''); }, 2000);
    }
  };

  // Sort requests by date descending
  const sortedRequests = [...requests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPages = Math.ceil(sortedRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = sortedRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.profile}</h2><p className="text-slate-500 dark:text-slate-400">{t.language === 'id' ? 'Lihat informasi pribadi dan pekerjaan Anda.' : 'View your personal and employment information.'}</p></div>
        <button onClick={() => setIsRequestModalOpen(true)} className="flex items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"><Send className="mr-2 h-4 w-4" />{t.requestUpdate}</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-200">
            <div className="h-32 bg-indigo-600 dark:bg-indigo-900/50"></div>
            <div className="px-6 pb-6 text-center">
              <div className="-mt-16 flex justify-center"><img src={employee.avatar} alt={employee.name} className="h-32 w-32 rounded-full border-4 border-white dark:border-slate-800 object-cover shadow-sm transition-colors duration-200" /></div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{employee.name}</h3><p className="text-slate-500 dark:text-slate-400 font-medium">{employee.role}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-4">{t.language === 'id' ? 'Statistik Cepat' : 'Quick Stats'}</h4>
            <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300"><div className="flex justify-between"><span>ID</span><span className="font-bold text-slate-900 dark:text-white">{employee.id}</span></div><div className="flex justify-between"><span>{t.department}</span><span className="font-bold text-slate-900 dark:text-white">{employee.department}</span></div><div className="flex justify-between"><span>{t.joinDate}</span><span className="font-bold text-slate-900 dark:text-white">{new Date(employee.joinDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })}</span></div></div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">{t.personalContact}</div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div><p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center mb-1"><Mail className="h-3 w-3 mr-1" />{t.emailAddress}</p><p className="font-medium text-slate-900 dark:text-slate-300">{employee.email}</p></div>
              <div><p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center mb-1"><Phone className="h-3 w-3 mr-1" />{t.phoneNumber}</p><p className="font-medium text-slate-900 dark:text-slate-300">{employee.phoneNumber || '-'}</p></div>
              <div className="md:col-span-2"><p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center mb-1"><MapPin className="h-3 w-3 mr-1" />{t.address}</p><p className="font-medium leading-relaxed text-slate-900 dark:text-slate-300">{employee.address || '-'}</p></div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">{t.employmentInfo}</div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div><p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t.position}</p><p className="font-medium text-slate-900 dark:text-slate-300">{employee.role}</p></div>
              <div><p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t.accessRole}</p><p className="font-medium text-slate-900 dark:text-slate-300">{t.standardUser}</p></div>
              <div><p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t.joinDate}</p><p className="font-medium text-slate-900 dark:text-slate-300">{new Date(employee.joinDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })}</p></div>
              <div><p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Status</p><p className="font-bold text-emerald-600 dark:text-emerald-400">{employee.status === 'Active' ? t.active : t.onLeave}</p></div>
            </div>
          </div>
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-100 dark:border-amber-800/50 flex gap-3 text-sm text-amber-800 dark:text-amber-500 transition-colors duration-200"><AlertCircle className="h-5 w-5 shrink-0" /><p>{t.infoPolicy}</p></div>
        </div>
      </div>

      {/* Request Logs Table */}
      {/* Request Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center transition-colors duration-200">
          <div className="font-bold flex items-center text-slate-900 dark:text-white"><FileText className="h-4 w-4 mr-2 text-indigo-500 dark:text-indigo-400" /> {t.language === 'id' ? 'Riwayat Permintaan' : 'Request History'}</div>
        </div>

        {sortedRequests.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800/50 transition-colors duration-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium uppercase text-slate-500 dark:text-slate-400 text-xs">{t.date}</th>
                    <th className="px-6 py-3 text-left font-medium uppercase text-slate-500 dark:text-slate-400 text-xs">{t.requestDetails}</th>
                    <th className="px-6 py-3 text-right font-medium uppercase text-slate-500 dark:text-slate-400 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 transition-colors duration-200">
                  {paginatedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {new Date(req.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })}
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-slate-200 max-w-md truncate">
                        {req.description}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold uppercase ${req.status === 'Pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
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
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 transition-colors duration-200">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.page} <span className="font-medium text-slate-900 dark:text-white">{currentPage}</span> {t.of} <span className="font-medium text-slate-900 dark:text-white">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            {t.language === 'id' ? 'Belum ada riwayat permintaan.' : 'No request history found.'}
          </div>
        )}
      </div>

      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in transition-colors duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between transition-colors duration-200"><h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.requestUpdate}</h3><button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X className="h-6 w-6" /></button></div>
            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              {submitted ? (
                <div className="py-8 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4"><Send className="h-8 w-8 text-emerald-600 dark:text-emerald-400" /></div><h4 className="text-lg font-bold text-slate-900 dark:text-white">{t.requestSubmitted}</h4><p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t.adminReview}</p></div>
              ) : (
                <><p className="text-sm text-slate-600 dark:text-slate-300">{t.language === 'id' ? 'Silakan jelaskan informasi apa yang perlu diperbarui. Berikan detail spesifik.' : 'Please describe what information needs to be updated. Be specific.'}</p><div><label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">{t.changeDescription}</label><textarea required rows={5} value={requestDescription} onChange={(e) => setRequestDescription(e.target.value)} className="block w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 p-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" /></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors">{t.cancel}</button><button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700 transition-colors">{t.sendRequest}</button></div></>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Employee, ProfileRequest } from '../types';
import { Mail, Phone, MapPin, Briefcase, Calendar, Shield, Send, X, AlertCircle } from 'lucide-react';

interface ProfileProps {
  employee: Employee | undefined;
  onRequestUpdate: (description: string) => void;
  t: any;
}

export const Profile: React.FC<ProfileProps> = ({ employee, onRequestUpdate, t }) => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestDescription, setRequestDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-xl font-bold text-slate-900">{t.language === 'id' ? 'Profil Karyawan Tidak Ditemukan' : 'Employee Profile Not Found'}</h3>
        <p className="text-slate-500 mt-2">{t.language === 'id' ? 'Silakan masuk dengan ID Karyawan yang valid.' : 'Please log in with a valid Employee ID to view your profile.'}</p>
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

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-slate-900">{t.profile}</h2><p className="text-slate-500">{t.language === 'id' ? 'Lihat informasi pribadi dan pekerjaan Anda.' : 'View your personal and employment information.'}</p></div>
        <button onClick={() => setIsRequestModalOpen(true)} className="flex items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white"><Send className="mr-2 h-4 w-4" />{t.requestUpdate}</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="h-32 bg-indigo-600"></div>
            <div className="px-6 pb-6 text-center">
              <div className="-mt-16 flex justify-center"><img src={employee.avatar} alt={employee.name} className="h-32 w-32 rounded-full border-4 border-white object-cover" /></div>
              <h3 className="mt-4 text-xl font-bold text-slate-900">{employee.name}</h3><p className="text-slate-500 font-medium">{employee.role}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">{t.language === 'id' ? 'Statistik Cepat' : 'Quick Stats'}</h4>
            <div className="space-y-4 text-sm"><div className="flex justify-between"><span>ID</span><span className="font-bold">{employee.id}</span></div><div className="flex justify-between"><span>{t.department}</span><span className="font-bold">{employee.department}</span></div><div className="flex justify-between"><span>{t.joinDate}</span><span className="font-bold">{employee.joinDate}</span></div></div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50/50 font-bold">{t.personalContact}</div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-1"><Mail className="h-3 w-3 mr-1" />{t.emailAddress}</p><p className="font-medium">{employee.email}</p></div>
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-1"><Phone className="h-3 w-3 mr-1" />{t.phoneNumber}</p><p className="font-medium">{employee.phoneNumber || '-'}</p></div>
                <div className="md:col-span-2"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-1"><MapPin className="h-3 w-3 mr-1" />{t.address}</p><p className="font-medium leading-relaxed">{employee.address || '-'}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50/50 font-bold">{t.employmentInfo}</div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t.position}</p><p className="font-medium">{employee.role}</p></div>
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t.accessRole}</p><p className="font-medium">{t.standardUser}</p></div>
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t.joinDate}</p><p className="font-medium">{employee.joinDate}</p></div>
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p><p className="font-bold text-emerald-600">{employee.status === 'Active' ? t.active : t.onLeave}</p></div>
            </div>
          </div>
          <div className="rounded-xl bg-amber-50 p-4 border border-amber-100 flex gap-3 text-sm text-amber-800"><AlertCircle className="h-5 w-5 shrink-0" /><p>{t.infoPolicy}</p></div>
        </div>
      </div>

      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b flex items-center justify-between"><h3 className="text-lg font-bold">{t.requestUpdate}</h3><button onClick={() => setIsRequestModalOpen(false)}><X className="h-6 w-6" /></button></div>
            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              {submitted ? (
                <div className="py-8 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4"><Send className="h-8 w-8 text-emerald-600" /></div><h4 className="text-lg font-bold">{t.requestSubmitted}</h4><p className="text-slate-500 text-sm mt-1">{t.adminReview}</p></div>
              ) : (
                <><p className="text-sm text-slate-600">{t.language === 'id' ? 'Silakan jelaskan informasi apa yang perlu diperbarui. Berikan detail spesifik.' : 'Please describe what information needs to be updated. Be specific.'}</p><div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">{t.changeDescription}</label><textarea required rows={5} value={requestDescription} onChange={(e) => setRequestDescription(e.target.value)} className="block w-full rounded-xl border p-4 text-sm" /></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 py-2 text-sm">{t.cancel}</button><button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white">{t.sendRequest}</button></div></>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
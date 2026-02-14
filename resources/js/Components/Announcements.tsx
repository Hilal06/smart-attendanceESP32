import React, { useState } from 'react';
import { Announcement, UserRole } from '../types';
import { Plus, Edit, Trash2, X, AlertTriangle, Megaphone, Calendar, AlertCircle } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateField('title', formData.title) && validateField('content', formData.content)) {
      if (isEditMode) onEdit(formData); else onAdd(formData);
      setIsModalOpen(false);
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
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">{t.announcements}</h2><p className="text-slate-500">{t.stayUpdated}</p></div>
        {isAdmin && (<button onClick={handleOpenAdd} className="flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"><Plus className="mr-2 h-4 w-4" />{t.newAnnouncement}</button>)}
      </div>

      <div className="grid gap-6">
        {announcements.length === 0 ? (
           <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center shadow-sm border border-slate-100"><div className="rounded-full bg-slate-100 p-4 mb-4"><Megaphone className="h-8 w-8 text-slate-400" /></div><h3 className="text-lg font-medium text-slate-900">{t.noAnnouncements}</h3><p className="text-slate-500 mt-1">{t.checkLater}</p></div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
              {announcement.priority === 'Urgent' && (<div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-600"></div>)}
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-10">
                  <div className="flex items-center gap-3 mb-2"><span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(announcement.priority)}`}>{announcement.priority === 'Urgent' && <AlertTriangle className="mr-1 h-3 w-3" />}{getPriorityLabel(announcement.priority)}</span><div className="flex items-center text-xs text-slate-500"><Calendar className="mr-1 h-3 w-3" />{new Date(announcement.date).toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' })}</div></div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{announcement.title}</h3><p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{announcement.content}</p>
                </div>
                {isAdmin && (<div className="flex space-x-2 ml-4"><button onClick={() => handleOpenEdit(announcement)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit className="h-4 w-4" /></button><button onClick={() => handleOpenDelete(announcement.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="h-4 w-4" /></button></div>)}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h3 className="text-lg font-bold text-slate-900">{isEditMode ? t.editAnnouncement : t.newAnnouncement}</h3><button onClick={() => setIsModalOpen(false)}><X className="h-6 w-6" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{t.language === 'id' ? 'Judul' : 'Title'} <span className="text-red-500">*</span></label><input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{t.priority}</label><select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="Normal">{t.priorityNormal}</option><option value="High">{t.priorityHigh}</option><option value="Urgent">{t.priorityUrgent}</option></select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{t.date}</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{t.language === 'id' ? 'Konten' : 'Content'} <span className="text-red-500">*</span></label><textarea required rows={4} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm">{t.cancel}</button><button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">{isEditMode ? t.saveChanges : t.postAnnouncement}</button></div>
            </form>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-fade-in"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100"><AlertCircle className="h-6 w-6 text-rose-600" /></div><div className="mt-3 text-center sm:mt-5"><h3 className="text-lg font-medium text-slate-900">{t.confirmDeletion}</h3><p className="mt-2 text-sm text-slate-500">{t.actionUndone}</p></div><div className="mt-5 sm:grid sm:grid-cols-2 sm:gap-3"><button onClick={handleDelete} className="w-full bg-rose-600 text-white rounded-md px-4 py-2 text-sm font-medium">{t.delete}</button><button onClick={() => setIsDeleteConfirmOpen(false)} className="mt-3 sm:mt-0 w-full bg-white border border-slate-300 rounded-md px-4 py-2 text-sm font-medium">{t.cancel}</button></div></div>
        </div>
      )}
    </div>
  );
};

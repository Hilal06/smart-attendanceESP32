
import React, { useState } from 'react';
import { Announcement, UserRole } from '../types';
import { Plus, Edit, Trash2, X, AlertTriangle, Megaphone, Calendar, AlertCircle } from 'lucide-react';

interface AnnouncementsProps {
  announcements: Announcement[];
  userRole: UserRole;
  onAdd: (announcement: Announcement) => void;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
  // Fix: added 't' to props interface for localization support
  t: any;
}

export const Announcements: React.FC<AnnouncementsProps> = ({ 
  announcements, 
  userRole, 
  onAdd, 
  onEdit, 
  onDelete,
  // Fix: destructured 't' from props
  t
}) => {
  const isAdmin = userRole === 'admin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const initialFormState: Announcement = {
    id: '',
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    priority: 'Normal',
  };
  
  const [formData, setFormData] = useState<Announcement>(initialFormState);
  const [isEditMode, setIsEditMode] = useState(false);

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'title') {
      if (!value.trim()) error = 'Title is required';
      else if (value.trim().length < 5) error = 'Title must be at least 5 characters';
    } else if (name === 'content') {
      if (!value.trim()) error = 'Content is required';
      else if (value.trim().length < 10) error = 'Content must be at least 10 characters';
    }
    
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[name] = error;
      else delete newErrors[name];
      return newErrors;
    });
    return !error;
  };

  const handleOpenAdd = () => {
    setFormData({ ...initialFormState, id: Date.now().toString() });
    setErrors({});
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (announcement: Announcement) => {
    setFormData(announcement);
    setErrors({});
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isTitleValid = validateField('title', formData.title);
    const isContentValid = validateField('content', formData.content);

    if (isTitleValid && isContentValid) {
      if (isEditMode) {
        onEdit(formData);
      } else {
        onAdd(formData);
      }
      setIsModalOpen(false);
    }
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setIsDeleteConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Urgent': return 'bg-rose-600 text-white border-rose-600';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Announcements</h2>
          <p className="text-slate-500">Stay updated with the latest company news.</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </button>
        )}
      </div>

      <div className="grid gap-6">
        {announcements.length === 0 ? (
           <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center shadow-sm border border-slate-100">
             <div className="rounded-full bg-slate-100 p-4 mb-4">
               <Megaphone className="h-8 w-8 text-slate-400" />
             </div>
             <h3 className="text-lg font-medium text-slate-900">No announcements yet</h3>
             <p className="text-slate-500 mt-1">Check back later for updates.</p>
           </div>
        ) : (
          announcements.map((announcement) => (
            <div 
              key={announcement.id} 
              className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md"
            >
              {/* Priority Stripe */}
              {announcement.priority === 'Urgent' && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-600"></div>
              )}
              
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-10">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority === 'Urgent' && <AlertTriangle className="mr-1 h-3 w-3" />}
                      {announcement.priority}
                    </span>
                    <div className="flex items-center text-xs text-slate-500">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(announcement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{announcement.title}</h3>
                  <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{announcement.content}</p>
                </div>

                {isAdmin && (
                  <div className="flex space-x-2 ml-4">
                    <button 
                      onClick={() => handleOpenEdit(announcement)}
                      className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleOpenDelete(announcement.id)}
                      className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">{isEditMode ? 'Edit Announcement' : 'New Announcement'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    validateField('title', e.target.value);
                  }}
                  className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none transition-all ${
                    errors.title ? 'border-rose-500 ring-1 ring-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  }`}
                  placeholder="e.g., Office Closure"
                />
                {errors.title && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => {
                    setFormData({ ...formData, content: e.target.value });
                    validateField('content', e.target.value);
                  }}
                  className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none transition-all ${
                    errors.content ? 'border-rose-500 ring-1 ring-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  }`}
                  placeholder="Enter details..."
                />
                {errors.content && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.content}</p>}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  {isEditMode ? 'Save Changes' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-fade-in">
             <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
              <AlertCircle className="h-6 w-6 text-rose-600" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Delete Announcement?</h3>
              <div className="mt-2">
                <p className="text-sm text-slate-500">
                  This action cannot be undone. Are you sure you want to delete this announcement?
                </p>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-rose-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 sm:text-sm"
                onClick={confirmDelete}
              >
                Delete
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:text-sm"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

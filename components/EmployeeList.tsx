import React, { useState, useEffect, useRef } from 'react';
import { Employee, EmployeeStatus } from '../types';
import { Plus, Search, Mail, Briefcase, MoreVertical, X, Phone, MapPin, AlertCircle, Edit, Trash2, Calendar, Filter, Loader2, AlertTriangle, Upload, Camera, ChevronRight } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  t: any;
  // New props for robust error handling
  isProcessing?: boolean;
  externalErrors?: Record<string, string>;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ 
  employees, 
  onAddEmployee, 
  onEditEmployee, 
  onDeleteEmployee, 
  t,
  isProcessing = false,
  externalErrors = {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusWarning, setStatusWarning] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState: Employee = {
    id: '',
    name: '',
    role: '',
    department: '',
    email: '',
    phoneNumber: '',
    address: '',
    avatar: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: EmployeeStatus.ACTIVE,
  };

  const [formData, setFormData] = useState<Employee>(initialFormState);

  // Sync external errors (from server) to local error state
  useEffect(() => {
    if (Object.keys(externalErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...externalErrors }));
    }
  }, [externalErrors]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'id') {
      if (!value.trim()) error = `${t.id} ${t.errorRequired}`;
      else if (!isEditMode && employees.some(e => e.id === value.trim())) error = 'ID already exists';
    } else if (name === 'name') {
      if (!value.trim()) error = `${t.fullName} ${t.errorRequired}`;
    } else if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) error = `${t.emailAddress} ${t.errorRequired}`;
      else if (!emailRegex.test(value)) error = 'Invalid format';
    } else if (name === 'role' && !value.trim()) {
      error = `${t.position} ${t.errorRequired}`;
    } else if (name === 'department' && !value.trim()) {
      error = `${t.department} ${t.errorRequired}`;
    }
    
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[name] = error;
      else delete newErrors[name];
      return newErrors;
    });

    if (name === 'status') {
      if (value === EmployeeStatus.TERMINATED) {
        setStatusWarning(t.language === 'id' ? "Hati-hati: Menandai sebagai Diberhentikan akan membatasi akses sistem." : "Caution: Mark as Terminated will restrict system access.");
      } else if (value === EmployeeStatus.ON_LEAVE) {
        setStatusWarning(t.language === 'id' ? "Catatan: Pastikan Tanggal Bergabung mencerminkan kontrak saat ini." : "Note: Ensure the Join Date reflects the current contract.");
      } else {
        setStatusWarning(null);
      }
    }

    return !error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
       validateField(name, value);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setErrors({});
    setStatusWarning(null);
    setIsEditMode(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setFormData({ ...employee });
    setErrors({});
    setStatusWarning(null);
    setIsEditMode(true);
    setIsFormModalOpen(true);
    setActiveMenuId(null);
  };

  const validateForm = () => {
    const idValid = validateField('id', formData.id);
    const nameValid = validateField('name', formData.name);
    const emailValid = validateField('email', formData.email);
    const roleValid = validateField('role', formData.role);
    const deptValid = validateField('department', formData.department);
    return idValid && nameValid && emailValid && roleValid && deptValid;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSaveConfirmOpen(true);
    }
  };

  const handleConfirmSave = () => {
    if (isEditMode) onEditEmployee(formData);
    else onAddEmployee(formData);
    setIsSaveConfirmOpen(false);
  };

  const confirmDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteConfirmOpen(true);
    setActiveMenuId(null);
  };

  const handleDelete = () => {
    if (deleteTargetId) {
      onDeleteEmployee(deleteTargetId);
    }
  };

  // Close modals on success (if managed by parent)
  useEffect(() => {
     if (!isProcessing && Object.keys(externalErrors).length === 0) {
        setIsDeleteConfirmOpen(false);
        if (isSaveConfirmOpen) setIsFormModalOpen(false); // Close main form on successful save
        setIsSaveConfirmOpen(false);
     }
  }, [isProcessing, externalErrors]);

  const getStatusColor = (status: EmployeeStatus) => {
    switch (status) {
      case EmployeeStatus.ACTIVE: return 'bg-emerald-100 text-emerald-800';
      case EmployeeStatus.ON_LEAVE: return 'bg-amber-100 text-amber-800';
      case EmployeeStatus.TERMINATED: return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: EmployeeStatus) => {
    switch (status) {
      case EmployeeStatus.ACTIVE: return t.active;
      case EmployeeStatus.ON_LEAVE: return t.onLeave;
      case EmployeeStatus.TERMINATED: return t.terminated;
      default: return status;
    }
  };

  // Reusable Tooltip Component Helper
  const Tooltip = ({ text, children, position = 'top' }: { text: string, children: React.ReactNode, position?: 'top' | 'left' | 'right' }) => {
    const positionClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return (
      <div className="group relative flex items-center justify-center">
        {children}
        <div className={`absolute ${positionClasses[position]} hidden group-hover:flex items-center justify-center z-[100] animate-in fade-in zoom-in duration-150`}>
          <div className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap">
            {text}
          </div>
          <div className={`absolute w-2 h-2 bg-slate-800 rotate-45 ${position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' : position === 'left' ? '-right-1 top-1/2 -translate-y-1/2' : '-left-1 top-1/2 -translate-y-1/2'}`}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.employees}</h2>
          <p className="text-slate-500">{t.manageTeam}</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          {t.addEmployee}
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={t.searchEmployees}
            className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-48">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Filter className="h-4 w-4 text-slate-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-8 text-sm text-slate-700"
          >
            <option value="All">{t.allStatus}</option>
            <option value={EmployeeStatus.ACTIVE}>{t.active}</option>
            <option value={EmployeeStatus.ON_LEAVE}>{t.onLeave}</option>
            <option value={EmployeeStatus.TERMINATED}>{t.terminated}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="group relative rounded-xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center space-x-4">
                <img src={employee.avatar} alt={employee.name} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{employee.name}</h3>
                  <p className="text-sm text-slate-500">{employee.role}</p>
                </div>
              </div>

               <div className="relative">
                <Tooltip text={t.language === 'id' ? 'Aksi' : 'Actions'}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === employee.id ? null : employee.id); }}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 focus:outline-none"
                    aria-label="Toggle Menu"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </Tooltip>
                {activeMenuId === employee.id && (
                  <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 z-20 animate-in slide-in-from-top-1 duration-150">
                    <div className="py-1">
                      <button 
                        onClick={() => openEditModal(employee)} 
                        className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors group"
                      >
                        <Edit className="mr-2 h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
                        {t.language === 'id' ? 'Ubah' : 'Edit'}
                        <div className="ml-auto hidden group-hover:block text-[8px] uppercase font-bold text-indigo-400">Ctrl+E</div>
                      </button>
                      <button 
                        onClick={() => confirmDelete(employee.id)} 
                        className="flex w-full items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors group"
                      >
                        <Trash2 className="mr-2 h-4 w-4 text-rose-400 group-hover:text-rose-500" /> 
                        {t.language === 'id' ? 'Hapus' : 'Delete'}
                        <div className="ml-auto hidden group-hover:block text-[8px] uppercase font-bold text-rose-300">Del</div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(employee.status)}`}>
                  {getStatusLabel(employee.status)}
                </span>
                <span className="text-xs text-slate-400">ID: {employee.id}</span>
            </div>
            
            <div className="space-y-2 border-t border-slate-50 pt-4">
              <div className="flex items-center text-sm text-slate-600">
                <Briefcase className="mr-2 h-4 w-4 text-slate-400" />
                <span className="truncate">{employee.department}</span>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Mail className="mr-2 h-4 w-4 text-slate-400" />
                <span className="truncate">{employee.email}</span>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
                <Tooltip text={t.viewProfile} position="left">
                  <button onClick={() => setViewEmployee(employee)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center transition-colors">
                      {t.viewProfile} <span className="ml-1"><ChevronRight className="h-3 w-3" /></span>
                  </button>
                </Tooltip>
            </div>
          </div>
        ))}
      </div>

      {isFormModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">{isEditMode ? t.editEmployee : t.newEmployee}</h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-slate-600" disabled={isProcessing}>
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6">
              {/* Global Error Banner */}
              {externalErrors.message && (
                <div className="mb-6 rounded-lg bg-rose-50 p-4 flex items-start gap-3 border border-rose-100">
                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                  <div className="text-sm text-rose-700 font-medium">{externalErrors.message}</div>
                </div>
              )}

              <div className="mb-6 flex flex-col items-center">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-indigo-100 bg-slate-50 flex items-center justify-center">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <Tooltip text={t.uploadPhoto} position="right">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
                      aria-label={t.uploadPhoto}
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </button>
                  </Tooltip>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 font-medium">{t.uploadPhoto} ({t.language === 'id' ? 'Opsional' : 'Optional'})</p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">ID <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="text" 
                    name="id" 
                    value={formData.id} 
                    onChange={handleInputChange} 
                    disabled={isEditMode || isProcessing} 
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm transition-colors ${errors.id ? 'border-rose-500 ring-rose-500 bg-rose-50/30' : 'border-slate-300'} ${isEditMode ? 'bg-slate-100' : ''}`} 
                  />
                  {errors.id && <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t.allStatus} <span className="text-red-500">*</span></label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange} 
                    disabled={isProcessing}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value={EmployeeStatus.ACTIVE}>{t.active}</option>
                    <option value={EmployeeStatus.ON_LEAVE}>{t.onLeave}</option>
                    <option value={EmployeeStatus.TERMINATED}>{t.terminated}</option>
                  </select>
                  {statusWarning && <div className="mt-2 text-xs font-medium text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-100">{statusWarning}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t.fullName} <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    disabled={isProcessing}
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm ${errors.name ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`} 
                  />
                  {errors.name && <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t.position} <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="text" 
                    name="role" 
                    value={formData.role} 
                    onChange={handleInputChange} 
                    disabled={isProcessing}
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm ${errors.role ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`} 
                  />
                  {errors.role && <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.role}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t.department} <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="text" 
                    name="department" 
                    value={formData.department} 
                    onChange={handleInputChange} 
                    disabled={isProcessing}
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm ${errors.department ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`} 
                  />
                  {errors.department && <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.department}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t.emailAddress} <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    disabled={isProcessing}
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm ${errors.email ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`} 
                  />
                  {errors.email && <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t.joinDate} <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="date" 
                    name="joinDate" 
                    value={formData.joinDate} 
                    onChange={handleInputChange} 
                    disabled={isProcessing}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" 
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsFormModalOpen(false)} 
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  disabled={isProcessing}
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit" 
                  className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] transition-all"
                  disabled={isProcessing}
                >
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? t.updateEmployee : t.saveEmployee}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSaveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 mb-4">
                <AlertCircle className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">{t.confirmSave}</h3>
              <p className="mt-2 text-sm text-slate-500">{t.areYouSureSave}</p>
            </div>
            <div className="mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
              <button 
                onClick={handleConfirmSave} 
                className="flex items-center justify-center w-full bg-indigo-600 text-white rounded-md px-4 py-2 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                disabled={isProcessing}
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.save}
              </button>
              <button 
                onClick={() => setIsSaveConfirmOpen(false)} 
                className="mt-3 sm:mt-0 w-full bg-white border border-slate-300 rounded-md px-4 py-2 font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
                disabled={isProcessing}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-in zoom-in duration-200">
            {externalErrors.delete && (
              <div className="mb-4 rounded-lg bg-rose-50 p-3 border border-rose-100 text-xs text-rose-700">
                {externalErrors.delete}
              </div>
            )}
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 mb-4">
                <Trash2 className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">{t.confirmDeletion}</h3>
              <p className="mt-2 text-sm text-slate-500">{t.actionUndone}</p>
            </div>
            <div className="mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
              <button 
                onClick={handleDelete} 
                className="flex items-center justify-center w-full bg-rose-600 text-white rounded-md px-4 py-2 font-medium hover:bg-rose-700 disabled:opacity-50 transition-colors"
                disabled={isProcessing}
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.delete}
              </button>
              <button 
                onClick={() => setIsDeleteConfirmOpen(false)} 
                className="mt-3 sm:mt-0 w-full bg-white border border-slate-300 rounded-md px-4 py-2 font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
                disabled={isProcessing}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
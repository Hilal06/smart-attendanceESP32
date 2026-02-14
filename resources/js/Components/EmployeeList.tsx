import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Employee, EmployeeStatus } from '../types';
import { Plus, Search, Mail, Briefcase, MoreVertical, X, Phone, MapPin, AlertCircle, Edit, Trash2, Calendar, Filter, Loader2, AlertTriangle, Upload, Camera, ChevronRight, CheckCircle2, User, LayoutGrid, List, ArrowUpDown } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  t: any;
  isProcessing?: boolean;
  externalErrors?: Record<string, string>;
}

type ToastType = 'success' | 'error';
type ViewMode = 'grid' | 'list';
type SortConfig = { key: keyof Employee; direction: 'asc' | 'desc' } | null;

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
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusWarning, setStatusWarning] = useState<string | null>(null);
  const [shakeModal, setShakeModal] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

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
    // Default to WIB date
    joinDate: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
    status: EmployeeStatus.ACTIVE,
  };

  const [formData, setFormData] = useState<Employee>(initialFormState);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  // Sync external errors and handle toast triggers
  useEffect(() => {
    if (Object.keys(externalErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...externalErrors }));
      
      // If there's a specific general error or delete error, show it in a toast
      if (externalErrors.message || externalErrors.delete) {
        showToast(externalErrors.message || externalErrors.delete, 'error');
      }
      
      // Trigger shake on form errors
      if (isFormModalOpen) {
        setShakeModal(true);
        setTimeout(() => setShakeModal(false), 500);
      }
    }
  }, [externalErrors, isFormModalOpen, showToast]);

  // Handle successful completion of operations
  const prevProcessing = useRef(isProcessing);
  useEffect(() => {
    if (prevProcessing.current && !isProcessing && Object.keys(externalErrors).length === 0) {
      // Operation finished successfully
      const successMsg = t.language === 'id' ? 'Operasi berhasil diselesaikan' : 'Operation completed successfully';
      showToast(successMsg, 'success');
      
      setIsDeleteConfirmOpen(false);
      setIsFormModalOpen(false);
      setIsSaveConfirmOpen(false);
    }
    prevProcessing.current = isProcessing;
  }, [isProcessing, externalErrors, t.language, showToast]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const handleSort = (key: keyof Employee) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Robust case-insensitive comparison for status
    const matchesStatus = statusFilter === 'All' || 
      emp.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aValue = a[key];
    let bValue = b[key];

    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'id') {
      if (!value.trim()) error = `${t.id || 'ID'} ${t.errorRequired}`;
      else if (!isEditMode && employees.some(e => e.id === value.trim())) error = t.language === 'id' ? 'ID sudah ada' : 'ID already exists';
    } else if (name === 'name') {
      if (!value.trim()) error = `${t.fullName} ${t.errorRequired}`;
    } else if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) error = `${t.emailAddress} ${t.errorRequired}`;
      else if (!emailRegex.test(value)) error = t.language === 'id' ? 'Format email tidak valid' : 'Invalid email format';
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
      if (file.size > 1024 * 1024) {
        showToast(t.language === 'id' ? 'Ukuran file terlalu besar (Maks 1MB)' : 'File size too large (Max 1MB)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
        showToast(t.language === 'id' ? 'Foto diunggah' : 'Photo uploaded', 'success');
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
    
    const isValid = idValid && nameValid && emailValid && roleValid && deptValid;
    if (!isValid) {
      setShakeModal(true);
      setTimeout(() => setShakeModal(false), 500);
      showToast(t.language === 'id' ? 'Harap periksa form kembali' : 'Please check the form for errors', 'error');
    }
    return isValid;
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
    // Modal closing is now handled by the processing useEffect for robust syncing
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

  const Tooltip = ({ text, children, position = 'top' }: { text: string, children: React.ReactNode, position?: 'top' | 'left' | 'right' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const showTimeoutRef = useRef<number | null>(null);
    const hideTimeoutRef = useRef<number | null>(null);

    const handleMouseEnter = () => {
      // Clear any pending hide timeout to prevent flickering if re-entering quickly
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
      
      // Set delay for showing the tooltip (1 second)
      showTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(true);
        // Set auto-hide timeout (5 seconds)
        hideTimeoutRef.current = window.setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }, 1000);
    };

    const handleMouseLeave = () => {
      // Clear the show timer so it doesn't pop up if we leave before 1s
      if (showTimeoutRef.current) window.clearTimeout(showTimeoutRef.current);
      // Clear the hide timer
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
      // Hide immediately on leave
      setIsVisible(false);
    };

    const positionClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return (
      <div 
        className="relative flex items-center justify-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
        {isVisible && (
          <div className={`absolute ${positionClasses[position]} flex items-center justify-center z-[100] animate-in fade-in zoom-in duration-150`}>
            <div className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap">
              {text}
            </div>
            <div className={`absolute w-2 h-2 bg-slate-800 rotate-45 ${position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' : position === 'left' ? '-right-1 top-1/2 -translate-y-1/2' : '-left-1 top-1/2 -translate-y-1/2'}`}></div>
          </div>
        )}
      </div>
    );
  };

  const SortIcon = ({ column }: { column: keyof Employee }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-50" />;
    return <ArrowUpDown className={`h-4 w-4 text-indigo-600 ${sortConfig.direction === 'asc' ? '' : 'rotate-180'}`} />;
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-right-full duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <p className="text-sm font-semibold">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.employees}</h2>
          <p className="text-slate-500">{t.manageTeam}</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">{t.allStatus}</option>
              <option value={EmployeeStatus.ACTIVE}>{t.active}</option>
              <option value={EmployeeStatus.ON_LEAVE}>{t.onLeave}</option>
              <option value={EmployeeStatus.TERMINATED}>{t.terminated}</option>
            </select>
          </div>
          
          <div className="flex rounded-lg border border-slate-300 bg-white p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {viewMode === 'grid' && (
        <div className="flex justify-end">
           <div className="relative inline-block text-left">
             <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Sort by:</span>
                <select 
                   className="text-xs font-semibold text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer pr-8"
                   onChange={(e) => handleSort(e.target.value as keyof Employee)}
                   value={(sortConfig?.key as string) || ''}
                >
                   <option value="">Default</option>
                   <option value="name">Name</option>
                   <option value="role">Role</option>
                   <option value="department">Department</option>
                   <option value="status">Status</option>
                </select>
             </div>
           </div>
        </div>
      )}

      {viewMode === 'grid' ? (
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
                  <span className="text-xs text-slate-400 font-mono">ID: {employee.id}</span>
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
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th 
                    scope="col" 
                    className="group px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      {t.employee}
                      <SortIcon column="name" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="group px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center gap-2">
                      {t.position}
                      <SortIcon column="role" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="group px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('department')}
                  >
                     <div className="flex items-center gap-2">
                      {t.department}
                      <SortIcon column="department" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="group px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <SortIcon column="status" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {t.language === 'id' ? 'Aksi' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img className="h-10 w-10 rounded-full object-cover" src={employee.avatar} alt="" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{employee.name}</div>
                          <div className="text-xs text-slate-500">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{employee.role}</div>
                      <div className="text-xs text-slate-500">ID: {employee.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{employee.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(employee.status)}`}>
                        {getStatusLabel(employee.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                       <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setViewEmployee(employee)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                            title={t.viewProfile}
                          >
                             <User className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => openEditModal(employee)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                            title={t.editEmployee}
                          >
                             <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => confirmDelete(employee.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                            title={t.delete}
                          >
                             <Trash2 className="h-4 w-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {viewEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden animate-in zoom-in duration-200">
             <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-600">
                <button 
                  onClick={() => setViewEmployee(null)} 
                  className="absolute top-4 right-4 p-1 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
             </div>
             <div className="px-8 pb-8">
                <div className="relative -mt-16 mb-4 flex justify-between items-end">
                   <div className="rounded-full p-1 bg-white">
                      <img src={viewEmployee.avatar} alt={viewEmployee.name} className="h-32 w-32 rounded-full object-cover border-2 border-white shadow-md" />
                   </div>
                   <span className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(viewEmployee.status)}`}>
                      {getStatusLabel(viewEmployee.status)}
                   </span>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900">{viewEmployee.name}</h2>
                <p className="text-slate-500 font-medium mb-6 flex items-center gap-2">
                   {viewEmployee.role} <span className="text-slate-300">•</span> {viewEmployee.department}
                </p>

                <div className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                         <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><User className="h-3 w-3" /> ID</p>
                         <p className="text-sm font-semibold text-slate-800">{viewEmployee.id}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                         <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> {t.joinDate}</p>
                         <p className="text-sm font-semibold text-slate-800">{new Date(viewEmployee.joinDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })}</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                         <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Mail className="h-4 w-4" /></div>
                         <div className="overflow-hidden">
                            <p className="text-xs text-slate-500">{t.emailAddress}</p>
                            <p className="text-sm font-medium text-slate-900 truncate">{viewEmployee.email}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                         <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Phone className="h-4 w-4" /></div>
                         <div>
                            <p className="text-xs text-slate-500">{t.phoneNumber}</p>
                            <p className="text-sm font-medium text-slate-900">{viewEmployee.phoneNumber || '-'}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                         <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><MapPin className="h-4 w-4" /></div>
                         <div>
                            <p className="text-xs text-slate-500">{t.address}</p>
                            <p className="text-sm font-medium text-slate-900">{viewEmployee.address || '-'}</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {isFormModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200 ${shakeModal ? 'animate-shake' : ''}`}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">{isEditMode ? t.editEmployee : t.newEmployee}</h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-slate-600" disabled={isProcessing}>
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6">
              {/* Robust Global Error Banner */}
              {Object.keys(externalErrors).length > 0 && (
                <div className="mb-6 rounded-lg bg-rose-50 p-4 flex items-start gap-3 border border-rose-200 animate-in fade-in slide-in-from-top-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-rose-800 font-bold">{t.language === 'id' ? 'Terjadi Kesalahan' : 'Action Failed'}</div>
                    <div className="text-xs text-rose-700 mt-0.5">
                      {externalErrors.message || (t.language === 'id' ? 'Harap periksa kembali detail yang dimasukkan.' : 'Please review the entered details.')}
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6 flex flex-col items-center">
                <div className="relative group">
                  <div className={`h-24 w-24 rounded-full overflow-hidden border-2 bg-slate-50 flex items-center justify-center transition-colors ${formData.avatar ? 'border-indigo-100' : 'border-slate-200'}`}>
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
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm transition-all ${errors.id ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30' : 'border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} ${isEditMode ? 'bg-slate-100' : ''}`} 
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
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  >
                    <option value={EmployeeStatus.ACTIVE}>{t.active}</option>
                    <option value={EmployeeStatus.ON_LEAVE}>{t.onLeave}</option>
                    <option value={EmployeeStatus.TERMINATED}>{t.terminated}</option>
                  </select>
                  {statusWarning && <div className="mt-2 text-xs font-medium text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-100 flex gap-2"><AlertCircle className="h-3 w-3 shrink-0" /> {statusWarning}</div>}
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
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm transition-all ${errors.name ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30' : 'border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`} 
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
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm transition-all ${errors.role ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30' : 'border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`} 
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
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm transition-all ${errors.department ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30' : 'border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`} 
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
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm transition-all ${errors.email ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30' : 'border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`} 
                  />
                  {errors.email && <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.email}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">{t.joinDate} <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="date" 
                    name="joinDate" 
                    value={formData.joinDate} 
                    onChange={handleInputChange} 
                    disabled={isProcessing}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" 
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
                  className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] transition-all"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.language === 'id' ? 'Memproses...' : 'Processing...'}
                    </>
                  ) : (
                    isEditMode ? t.updateEmployee : t.saveEmployee
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal with Robust Handling */}
      {isSaveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 mb-4">
                <AlertCircle className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{t.confirmSave}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{t.areYouSureSave}</p>
            </div>
            <div className="mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
              <button 
                onClick={handleConfirmSave} 
                className="flex items-center justify-center w-full bg-indigo-600 text-white rounded-md px-4 py-2 font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200"
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

      {/* Delete Confirmation Modal with Robust Error Display */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-in zoom-in duration-200">
            {externalErrors.delete && (
              <div className="mb-4 rounded-lg bg-rose-50 p-3 border border-rose-200 text-xs text-rose-800 font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {externalErrors.delete}
              </div>
            )}
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 mb-4">
                <Trash2 className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{t.confirmDeletion}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{t.actionUndone}</p>
            </div>
            <div className="mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
              <button 
                onClick={handleDelete} 
                className="flex items-center justify-center w-full bg-rose-600 text-white rounded-md px-4 py-2 font-bold hover:bg-rose-700 disabled:opacity-50 transition-all shadow-lg shadow-rose-200"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  t.delete
                )}
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
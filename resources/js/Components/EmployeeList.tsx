import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Employee, EmployeeStatus, AttendanceRecord } from '../types';
import { generateEmployeePerformanceSummary } from '../services/geminiService';
import { Plus, Search, Mail, Briefcase, MoreVertical, X, Phone, MapPin, AlertCircle, Edit, Trash2, Calendar, Filter, Loader2, AlertTriangle, Upload, Camera, ChevronRight, ChevronLeft, CheckCircle2, User, LayoutGrid, List, ArrowUpDown } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  onAddEmployee: (employee: Employee, avatarFile?: File, faceDataFile?: File) => void;
  onEditEmployee: (employee: Employee, avatarFile?: File, faceDataFile?: File) => void;
  onDeleteEmployee: (id: string) => void;
  t: any;
  isProcessing?: boolean;
  externalErrors?: Record<string, string> & { message?: string; delete?: string };
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

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE_GRID = 9;
  const ITEMS_PER_PAGE_LIST = 10;

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [faceDataFile, setFaceDataFile] = useState<File | null>(null);
  const [faceDataPreview, setFaceDataPreview] = useState<string | null>(null);

  const faceDataInputRef = useRef<HTMLInputElement>(null);

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
      if (externalErrors['message'] || externalErrors['delete']) {
        showToast(externalErrors['message'] || externalErrors['delete'] || 'An error occurred', 'error');
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

  const handleGenerateAISummary = async (emp: Employee) => {
    setIsGeneratingSummary(true);
    setGenerateError(null);
    try {
      // In a real app we'd fetch this employee's actual attendance records via API here.
      // For this frontend demo, we'll pass an empty array, and the AI will still generate
      // a summary based on the employee's basic info using the fallback prompt logic.
      const records: AttendanceRecord[] = [];
      const htmlResponse = await generateEmployeePerformanceSummary(emp, records);
      setAiSummary(htmlResponse);
    } catch (err) {
      console.error(err);
      setGenerateError(t.language === 'id' ? 'Gagal menghasilkan ringkasan AI.' : 'Failed to generate AI summary.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

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

  const getItemsPerPage = () => viewMode === 'grid' ? ITEMS_PER_PAGE_GRID : ITEMS_PER_PAGE_LIST;
  const totalPages = Math.ceil(filteredEmployees.length / getItemsPerPage());
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * getItemsPerPage(), currentPage * getItemsPerPage());

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, viewMode]);

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
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(t.language === 'id' ? 'Ukuran file terlalu besar (Maks 5MB)' : 'File size too large (Max 5MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(prev => ({ ...prev, avatar: dataUrl }));

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            setAvatarFile(compressedFile);
          }
        }, 'image/jpeg', 0.8);

        showToast(t.language === 'id' ? 'Foto dioptimalkan dan diunggah' : 'Photo optimized and uploaded', 'success');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFaceDataUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(t.language === 'id' ? 'Ukuran file terlalu besar (Maks 5MB)' : 'File size too large (Max 5MB)', 'error');
      return;
    }

    setFaceDataFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFaceDataPreview(event.target?.result as string);
      showToast(t.language === 'id' ? 'Data wajah ditambahkan' : 'Face data added', 'success');
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setAvatarFile(null);
    setFaceDataFile(null);
    setFaceDataPreview(null);
    setErrors({});
    setStatusWarning(null);
    setIsEditMode(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setFormData({ ...employee });
    setAvatarFile(null);
    setFaceDataFile(null);
    setFaceDataPreview(null);
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
    if (isEditMode) onEditEmployee(formData, avatarFile || undefined, faceDataFile || undefined);
    else onAddEmployee(formData, avatarFile || undefined, faceDataFile || undefined);
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
        <div className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-right-full duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.employees}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t.manageTeam}</p>
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
            <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
          <input
            type="text"
            placeholder={t.searchEmployees}
            className="block w-full rounded-lg border border-white/20 dark:border-slate-700/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-2 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full appearance-none rounded-lg border border-white/20 dark:border-slate-700/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-2 pl-10 pr-8 text-sm text-slate-700 dark:text-slate-200 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
            >
              <option value="All">{t.allStatus}</option>
              <option value={EmployeeStatus.ACTIVE}>{t.active}</option>
              <option value={EmployeeStatus.ON_LEAVE}>{t.onLeave}</option>
              <option value={EmployeeStatus.TERMINATED}>{t.terminated}</option>
            </select>
          </div>
          <div className="flex rounded-lg border border-white/20 dark:border-slate-700/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md p-1 shadow-sm transition-colors duration-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1.5 transition-all ${viewMode === 'grid' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md p-1.5 transition-all ${viewMode === 'list' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'}`}
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
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sort by:</span>
              <select
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-transparent border-none focus:ring-0 cursor-pointer pr-8"
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
            <div key={employee.id} className="group relative rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm border border-white/20 dark:border-slate-800 hover:shadow-md hover:bg-white/95 dark:hover:bg-slate-900/95 hover:border-indigo-200/50 dark:hover:border-indigo-900/50 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <img src={employee.avatar} alt={employee.name} className="h-12 w-12 rounded-full object-cover" />
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{employee.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{employee.role}</p>
                  </div>
                </div>

                <div className="relative">
                  <Tooltip text={t.language === 'id' ? 'Aksi' : 'Actions'}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === employee.id ? null : employee.id); }}
                      className="rounded-full p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition-colors"
                      aria-label="Toggle Menu"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </Tooltip>
                  {activeMenuId === employee.id && (
                    <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-lg bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 z-20 animate-in slide-in-from-top-1 duration-150">
                      <div className="py-1">
                        <button
                          onClick={() => openEditModal(employee)}
                          className="flex w-full items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                        >
                          <Edit className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                          {t.language === 'id' ? 'Ubah' : 'Edit'}
                          <div className="ml-auto hidden group-hover:block text-[8px] uppercase font-bold text-indigo-400 dark:text-indigo-500">Ctrl+E</div>
                        </button>
                        <button
                          onClick={() => confirmDelete(employee.id)}
                          className="flex w-full items-center px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/40 transition-colors group"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-rose-400 dark:text-rose-500 group-hover:text-rose-500 dark:group-hover:text-rose-400" />
                          {t.language === 'id' ? 'Hapus' : 'Delete'}
                          <div className="ml-auto hidden group-hover:block text-[8px] uppercase font-bold text-rose-300 dark:text-rose-600">Del</div>
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
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">ID: {employee.id}</span>
              </div>

              <div className="space-y-2 border-t border-slate-50 dark:border-slate-800/50 pt-4">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Briefcase className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{employee.department}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Mail className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{employee.email}</span>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Tooltip text={t.viewProfile} position="left">
                  <button onClick={() => setViewEmployee(employee)} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center transition-colors">
                    {t.viewProfile} <span className="ml-1"><ChevronRight className="h-3 w-3" /></span>
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}

          {filteredEmployees.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-full mb-4 inline-block shadow-sm">
                <Search className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {t.language === 'id' ? 'Karyawan Tidak Ditemukan' : 'No Employees Found'}
              </h4>
              <p className="text-sm max-w-sm mx-auto text-center">
                {searchTerm
                  ? (t.language === 'id' ? 'Tidak ada karyawan yang cocok dengan pencarian Anda.' : 'No employees match your search criteria.')
                  : (t.language === 'id' ? 'Tidak ada karyawan yang cocok dengan filter yang dipilih.' : 'No employees match the selected filters.')}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/20 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm overflow-hidden transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full lg:min-w-full max-w-full divide-y divide-slate-200/50 dark:divide-slate-800/50">
              <thead className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md transition-colors duration-300 sticky top-0 z-20 shadow-sm border-b border-white/20 dark:border-slate-800">
                <tr className="flex items-center justify-between w-full">
                  <th
                    scope="col"
                    className="group px-6 py-3 text-left hidden sm:flex flex-1 min-w-[200px] text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      {t.employee}
                      <SortIcon column="name" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="group px-6 py-3 text-left hidden sm:flex flex-1 min-w-[150px] text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center gap-2">
                      {t.position}
                      <SortIcon column="role" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="group px-6 py-3 text-left hidden sm:flex flex-1 min-w-[150px] text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => handleSort('department')}
                  >
                    <div className="flex items-center gap-2">
                      {t.department}
                      <SortIcon column="department" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="group px-6 py-3 text-left hidden sm:flex flex-shrink-0 min-w-[120px] text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      {t.language === 'id' ? 'Status' : 'Status'}
                      <SortIcon column="status" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right hidden sm:block flex-shrink-0 min-w-[120px] text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t.language === 'id' ? 'Aksi' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent flex flex-col gap-2 mt-2 transition-colors duration-300 px-1 pb-1">
                {paginatedEmployees.length > 0 ? (
                  paginatedEmployees.map((employee) => (
                    <tr key={employee.id} className="relative overflow-hidden bg-white dark:bg-slate-900 shadow-sm border border-transparent rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between group">
                      <td className="px-6 py-4 whitespace-nowrap min-w-[200px] flex-1 z-10">
                        <div className="flex items-center gap-4">
                          <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 shadow-sm group-hover:ring-indigo-100 dark:group-hover:ring-indigo-900 transition-all duration-300" src={employee.avatar} alt="" />
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{employee.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap min-w-[150px] flex-1 z-10">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-300">{employee.role}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-500 font-mono">ID: {employee.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap min-w-[150px] flex-1 z-10">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{employee.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap min-w-[120px] flex-shrink-0 z-10">
                        <span className={`inline-flex items-center justify-center min-w-[80px] rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${employee.status === EmployeeStatus.ACTIVE ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-800/30 dark:text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]' :
                          employee.status === EmployeeStatus.ON_LEAVE ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-800/30 dark:text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]' :
                            'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-800/30 dark:text-rose-400 shadow-[0_0_15px_-3px_rgba(244,63,94,0.1)]'
                          }`}>
                          {getStatusLabel(employee.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex-shrink-0 z-10">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setViewEmployee(employee)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-400 transition-colors"
                            title={t.viewProfile}
                          >
                            <User className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(employee)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-400 transition-colors"
                            title={t.editEmployee}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(employee.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 dark:hover:text-rose-400 transition-colors"
                            title={t.delete}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      {/* Professional Hover accent background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 dark:from-indigo-900/10 transition-opacity duration-300 pointer-events-none"></div>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-full mb-4 inline-block shadow-sm">
                          <Search className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                          {t.language === 'id' ? 'Karyawan Tidak Ditemukan' : 'No Employees Found'}
                        </h4>
                        <p className="text-sm max-w-sm mx-auto">
                          {searchTerm
                            ? (t.language === 'id' ? 'Tidak ada karyawan yang cocok dengan pencarian Anda.' : 'No employees match your search criteria.')
                            : (t.language === 'id' ? 'Tidak ada karyawan yang cocok dengan filter yang dipilih.' : 'No employees match the selected filters.')}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/20 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 sm:px-6 rounded-xl shadow-sm transition-colors duration-300 mt-6 overflow-hidden">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between relative z-10">
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {t.language === 'id' ? 'Menampilkan' : 'Showing'}{' '}
                <span className="font-medium">{(currentPage - 1) * getItemsPerPage() + 1}</span>{' '}
                {t.language === 'id' ? 'hingga' : 'to'}{' '}
                <span className="font-medium">
                  {Math.min(currentPage * getItemsPerPage(), filteredEmployees.length)}
                </span>{' '}
                {t.language === 'id' ? 'dari' : 'of'}{' '}
                <span className="font-medium">{filteredEmployees.length}</span>{' '}
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

      {/* View Profile Modal */}
      {viewEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md transition-all duration-300">
          <div className="flex min-h-full p-4 sm:p-6">
            <div className="m-auto w-full max-w-lg rounded-2xl bg-white/95 dark:bg-slate-900/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/20 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300 transition-colors">
              <div className="relative h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 dark:from-indigo-600 dark:via-purple-700 dark:to-indigo-800">
                <button
                  onClick={() => {
                    setViewEmployee(null);
                    setAiSummary(null);
                  }}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all backdrop-blur-sm"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-8 pb-8 relative">
                <div className="absolute -top-16 left-8 flex items-end gap-4">
                  <div className="rounded-full p-1.5 bg-white dark:bg-slate-900 shadow-lg transition-colors duration-200">
                    <img src={viewEmployee.avatar} alt={viewEmployee.name} className="h-28 w-28 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800" />
                  </div>
                  <div className="pb-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold shadow-sm border ${viewEmployee.status === EmployeeStatus.ACTIVE ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-800/30 dark:text-emerald-400' :
                      viewEmployee.status === EmployeeStatus.ON_LEAVE ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-800/30 dark:text-amber-400' :
                        'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-800/30 dark:text-rose-400'
                      }`}>
                      {getStatusLabel(viewEmployee.status)}
                    </span>
                  </div>
                </div>

                <div className="pt-20 sm:flex sm:justify-between sm:items-start">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">{viewEmployee.name}</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1">
                      {viewEmployee.role} <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span> {viewEmployee.department}
                    </p>
                  </div>
                  <button
                    onClick={() => handleGenerateAISummary(viewEmployee)}
                    disabled={isGeneratingSummary}
                    className="mt-4 sm:mt-0 flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all w-full sm:w-auto overflow-hidden relative group"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative z-10 flex items-center gap-2">
                      {isGeneratingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>✨</span>}
                      {isGeneratingSummary ? (t.language === 'id' ? 'Menghasilkan...' : 'Generating...') : 'AI Summary'}
                    </span>
                  </button>
                </div>

                {/* AI Summary Display */}
                {(isGeneratingSummary || aiSummary || generateError) && (
                  <div className="mt-6 rounded-xl border border-indigo-100 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-900/10 p-5 backdrop-blur-sm shadow-sm transition-all duration-300 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">✨</span>
                      <h3 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200 uppercase tracking-widest">{t.language === 'id' ? 'Ringkasan Kinerja AI' : 'AI Performance Summary'}</h3>
                    </div>

                    {isGeneratingSummary && (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-indigo-200/50 dark:bg-indigo-700/50 rounded w-3/4"></div>
                        <div className="h-4 bg-indigo-200/50 dark:bg-indigo-700/50 rounded w-full"></div>
                        <div className="h-4 bg-indigo-200/50 dark:bg-indigo-700/50 rounded w-5/6"></div>
                      </div>
                    )}

                    {generateError && !isGeneratingSummary && (
                      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-medium">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>{generateError}</p>
                      </div>
                    )}

                    {aiSummary && !isGeneratingSummary && !generateError && (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed prose-p:mb-2 prose-strong:text-indigo-700 dark:prose-strong:text-indigo-300"
                        dangerouslySetInnerHTML={{ __html: aiSummary }}
                      />
                    )}
                  </div>
                )}

                <div className="mt-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-colors flex items-center gap-4">
                      <div className="p-2.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-400 dark:text-slate-300">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.language === 'id' ? 'ID Karyawan' : 'Employee ID'}</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{viewEmployee.id}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-colors flex items-center gap-4">
                      <div className="p-2.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-400 dark:text-slate-300">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.joinDate}</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{new Date(viewEmployee.joinDate).toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-50 dark:border-slate-800/50">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0"><Mail className="h-5 w-5" /></div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.emailAddress}</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate mt-0.5">{viewEmployee.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-50 dark:border-slate-800/50">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0"><Phone className="h-5 w-5" /></div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.phoneNumber}</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 mt-0.5">{viewEmployee.phoneNumber || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0"><MapPin className="h-5 w-5" /></div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.address}</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 leading-relaxed mt-0.5 max-w-[300px]">{viewEmployee.address || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFormModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md transition-all duration-300">
          <div className={`w-full max-w-2xl rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 transition-colors backdrop-blur-xl ${shakeModal ? 'animate-shake' : ''}`}>

            {/* Sticky Header */}
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-5 shrink-0 bg-white/50 dark:bg-slate-900/50 rounded-t-2xl z-10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                  {isEditMode ? <Edit className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">{isEditMode ? t.editEmployee : t.newEmployee}</h3>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700" disabled={isProcessing}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="employee-form" onSubmit={handleFormSubmit} className="p-6 overflow-y-auto flex-1">
              {/* Robust Global Error Banner */}
              {Object.keys(externalErrors).length > 0 && (
                <div className="mb-6 rounded-lg bg-rose-50 dark:bg-rose-900/20 p-4 flex items-start gap-3 border border-rose-200 dark:border-rose-800/50 animate-in fade-in slide-in-from-top-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-rose-800 dark:text-rose-400 font-bold">{t.language === 'id' ? 'Terjadi Kesalahan' : 'Action Failed'}</div>
                    <div className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                      {externalErrors['message'] || (t.language === 'id' ? 'Harap periksa kembali detail yang dimasukkan.' : 'Please review the entered details.')}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className={`h-24 w-24 rounded-full overflow-hidden border-2 bg-slate-50 dark:bg-slate-800 flex items-center justify-center transition-colors ${formData.avatar ? 'border-indigo-100 dark:border-indigo-800' : 'border-slate-200 dark:border-slate-700'}`}>
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-8 w-8 text-slate-300 dark:text-slate-500" />
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
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium text-center">{t.uploadPhoto}<br /><span className="opacity-75">({t.language === 'id' ? 'Profil' : 'Profile'})</span></p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="relative group">
                    <div className={`h-24 w-24 rounded-xl overflow-hidden border-2 bg-slate-50 dark:bg-slate-800 flex items-center justify-center transition-colors ${faceDataPreview ? 'border-emerald-100 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-700 border-dashed'}`}>
                      {faceDataPreview ? (
                        <img src={faceDataPreview} alt="Face Data Preview" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-slate-300 dark:text-slate-500" />
                      )}
                    </div>
                    <Tooltip text={t.language === 'id' ? 'Unggah Data Wajah' : 'Upload Face Data'} position="right">
                      <button
                        type="button"
                        onClick={() => faceDataInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 p-1.5 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors"
                        aria-label="Upload Face Data"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </button>
                    </Tooltip>
                    <input
                      type="file"
                      ref={faceDataInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFaceDataUpload}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium text-center">{t.language === 'id' ? 'Data Wajah' : 'Face Data'}<br /><span className="opacity-75">({t.language === 'id' ? 'Pengenalan AI' : 'AI Recognition'})</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">ID <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    disabled={isEditMode || isProcessing}
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-white transition-all ${errors.id ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30 dark:bg-rose-900/20' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} ${isEditMode ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed' : ''}`}
                  />
                  {errors.id && <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.allStatus} <span className="text-rose-500">*</span></label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={isProcessing}
                    className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  >
                    <option value={EmployeeStatus.ACTIVE}>{t.active}</option>
                    <option value={EmployeeStatus.ON_LEAVE}>{t.onLeave}</option>
                    <option value={EmployeeStatus.TERMINATED}>{t.terminated}</option>
                  </select>
                  {statusWarning && <div className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-800/50 flex gap-2"><AlertCircle className="h-3 w-3 shrink-0" /> {statusWarning}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.fullName} <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isProcessing}
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-white transition-all ${errors.name ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30 dark:bg-rose-900/20' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.position} <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    disabled={isProcessing}
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-white transition-all ${errors.role ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30 dark:bg-rose-900/20' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                  />
                  {errors.role && <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.role}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.department} <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    disabled={isProcessing}
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-white transition-all ${errors.department ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30 dark:bg-rose-900/20' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                  />
                  {errors.department && <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.department}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.emailAddress} <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isProcessing}
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-white transition-all ${errors.email ? 'border-rose-500 ring-rose-500/20 ring-4 bg-rose-50/30 dark:bg-rose-900/20' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.email}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.joinDate} <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="date"
                    name="joinDate"
                    value={formData.joinDate}
                    onChange={handleInputChange}
                    disabled={isProcessing}
                    className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>

            </form>

            {/* Sticky Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-6 shrink-0 bg-white dark:bg-slate-900 rounded-b-xl z-10 flex justify-end space-x-3 transition-colors">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                disabled={isProcessing}
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                form="employee-form"
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
          </div>
        </div>
      )}

      {/* Save Confirmation Modal with Robust Handling */}
      {isSaveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4 transition-all duration-300">
          <div className="w-full max-w-md rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-slate-800 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200 transition-colors backdrop-blur-xl">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 mb-6 shadow-inner ring-4 ring-indigo-50/50 dark:ring-indigo-500/5">
                <AlertCircle className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.confirmSave}</h3>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto">{t.areYouSureSave}</p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleConfirmSave}
                className="flex items-center justify-center w-full bg-indigo-600 text-white rounded-md px-4 py-2 font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                disabled={isProcessing}
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.save}
              </button>
              <button
                onClick={() => setIsSaveConfirmOpen(false)}
                className="mt-3 sm:mt-0 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md px-4 py-2 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4 transition-all duration-300">
          <div className="w-full max-w-md rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-slate-800 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200 transition-colors backdrop-blur-xl">
            {externalErrors['delete'] && (
              <div className="mb-6 rounded-lg bg-rose-50 dark:bg-rose-500/10 p-4 border border-rose-200/50 dark:border-rose-500/20 text-sm text-rose-800 dark:text-rose-400 font-bold flex items-center gap-3 shadow-inner">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                {externalErrors['delete']}
              </div>
            )}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10 mb-6 shadow-inner ring-4 ring-rose-50/50 dark:ring-rose-500/5">
                <Trash2 className="h-8 w-8 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.confirmDeletion}</h3>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto">{t.actionUndone}</p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDelete}
                className="flex items-center justify-center w-full bg-rose-600 text-white rounded-md px-4 py-2 font-bold hover:bg-rose-700 disabled:opacity-50 transition-all shadow-lg shadow-rose-200 dark:shadow-none"
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
                className="mt-3 sm:mt-0 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md px-4 py-2 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
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
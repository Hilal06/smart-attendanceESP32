import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Profile, ProfileStatus, AttendanceRecord } from '../types';
import { router, usePage } from '@inertiajs/react';
import { generateProfilePerformanceSummary } from '../services/geminiService';
import { Plus, Search, Mail, Briefcase, MoreVertical, X, Phone, MapPin, AlertCircle, Edit, Trash2, Calendar, Filter, Loader2, AlertTriangle, Upload, Camera, ChevronRight, ChevronLeft, CheckCircle2, User, LayoutGrid, List, ArrowUpDown, Lock, Unlock, GraduationCap, Users, Building2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileListProps {
  profiles: Profile[];
  onAddProfile: (profile: Profile, avatarFile?: File, faceDataFile?: File) => void;
  onEditProfile: (profile: Profile, avatarFile?: File, faceDataFile?: File) => void;
  onDeleteProfile: (id: string) => void;
  t: any;
  isProcessing?: boolean;
  externalErrors?: Record<string, string> & { message?: string; delete?: string };
  pageType?: 'profiles' | 'students';
}

type ToastType = 'success' | 'error';
type ViewMode = 'grid' | 'list';
type SortConfig = { key: keyof Profile; direction: 'asc' | 'desc' } | null;

const AvatarWithSkeleton = ({ src, alt, className = '' }: { src: string, alt: string, className?: string }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 ${!loaded ? 'animate-pulse' : ''} ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
};

export const ProfileList: React.FC<ProfileListProps> = ({
  profiles,
  onAddProfile,
  onEditProfile,
  onDeleteProfile,
  t,
  isProcessing = false,
  externalErrors = {},
  pageType = 'profiles'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const { flash } = usePage().props as any;

  // Default to grid on mobile (<= 768px), list on larger screens
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    typeof window !== 'undefined' && window.innerWidth <= 768 ? 'grid' : 'list'
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Auto-switch view on resize (optional, but good UX: if user hasn't explicitly clicked, but realistically just set once)
  useEffect(() => {
    const handleResize = () => {
      // We only auto-switch if we cross the breakpoint, maybe too aggressive, so let's just use initial state above.
      // But if requested, we could uncomment logic here.
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [viewProfile, setViewProfile] = useState<Profile | null>(null);

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState: Profile = {
    id: '',
    name: '',
    role: '',
    department: '',
    email: '',
    phoneNumber: '',
    avatar: '',
    joinDate: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
    status: ProfileStatus.ACTIVE,
    class: '',
    age: undefined,
    password: '',
    password_confirmation: '',
  };

  const [formData, setFormData] = useState<Profile>(initialFormState);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [faceDataFile, setFaceDataFile] = useState<File | null>(null);
  const [faceDataPreview, setFaceDataPreview] = useState<string | null>(null);

  const faceDataInputRef = useRef<HTMLInputElement>(null);

  // Sync external errors and handle toast triggers
  useEffect(() => {
    if (Object.keys(externalErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...externalErrors }));

      // If there's a specific general error or delete error, show it in a toast
      if (externalErrors['message'] || externalErrors['delete']) {
        toast.error(externalErrors['message'] || externalErrors['delete'] || 'An error occurred');
      }

      // Trigger shake on form errors
      if (isFormModalOpen) {
        setShakeModal(true);
        setTimeout(() => setShakeModal(false), 500);
      }
    }
  }, [externalErrors, isFormModalOpen]);
  // Handle successful completion of operations
  const prevProcessing = useRef(isProcessing);
  useEffect(() => {
    if (prevProcessing.current && !isProcessing && Object.keys(externalErrors).length === 0) {
      // Operation finished successfully
      const defaultSuccessMsg = t.language === 'id' ? 'Operasi berhasil diselesaikan' : 'Operation completed successfully';
      const successMsg = flash?.message || defaultSuccessMsg;

      // If the message contains "failed", it's a partial success but warrants an error/warning toast
      const isWarning = successMsg.toLowerCase().includes('failed');
      if (isWarning) {
        toast.error(successMsg);
      } else {
        toast.success(successMsg);
      }

      setIsDeleteConfirmOpen(false);
      setIsFormModalOpen(false);
      setIsSaveConfirmOpen(false);
    }
    prevProcessing.current = isProcessing;
  }, [isProcessing, externalErrors, t.language, flash?.message]);

  const handleGenerateAISummary = async (emp: Profile) => {
    setIsGeneratingSummary(true);
    setGenerateError(null);
    try {
      // In a real app we'd fetch this profile's actual attendance records via API here.
      // For this frontend demo, we'll pass an empty array, and the AI will still generate
      // a summary based on the profile's basic info using the fallback prompt logic.
      const records: AttendanceRecord[] = [];
      const htmlResponse = await generateProfilePerformanceSummary(emp, records);
      setAiSummary(htmlResponse);
    } catch (err) {
      console.error(err);
      setGenerateError(t.language === 'id' ? 'Gagal menghasilkan ringkasan AI.' : 'Failed to generate AI summary.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleTogglePassword = (id: string) => {
    router.put(`/profiles/${id}/toggle-password`, {}, {
      preserveScroll: true
    });
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const handleSort = (key: keyof Profile) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredProfiles = profiles.filter(emp => {
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
  const totalPages = Math.ceil(filteredProfiles.length / getItemsPerPage());
  const paginatedProfiles = filteredProfiles.slice((currentPage - 1) * getItemsPerPage(), currentPage * getItemsPerPage());

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, viewMode]);

  // Accessible Escape key listener for dialogs and active menus
  useEffect(() => {
    if (!viewProfile && !isFormModalOpen && !isDeleteConfirmOpen && !activeMenuId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewProfile(null);
        setIsFormModalOpen(false);
        setIsDeleteConfirmOpen(false);
        setActiveMenuId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewProfile, isFormModalOpen, isDeleteConfirmOpen, activeMenuId]);

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'id') {
      if (!value.trim()) error = `${t.id || 'ID'} ${t.errorRequired}`;
      else if (!isEditMode && profiles.some(e => e.id === value.trim())) error = t.language === 'id' ? 'ID sudah ada' : 'ID already exists';
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
    } else if (name === 'password') {
      if (!isEditMode && (!value || value.length < 8)) error = t.language === 'id' ? 'Kata sandi minimal 8 karakter' : 'Password must be at least 8 characters';
      else if (isEditMode && value && value.length < 8) error = t.language === 'id' ? 'Kata sandi minimal 8 karakter' : 'Password must be at least 8 characters';
    } else if (name === 'password_confirmation') {
      if (!isEditMode && value !== formData.password) error = t.language === 'id' ? 'Konfirmasi kata sandi tidak cocok' : 'Password confirmation does not match';
      else if (isEditMode && formData.password && value !== formData.password) error = t.language === 'id' ? 'Konfirmasi kata sandi tidak cocok' : 'Password confirmation does not match';
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[name] = error;
      else delete newErrors[name];
      return newErrors;
    });

    if (name === 'status') {
      if (value === ProfileStatus.TERMINATED) {
        setStatusWarning(t.language === 'id' ? "Hati-hati: Menandai sebagai Diberhentikan akan membatasi akses sistem." : "Caution: Mark as Terminated will restrict system access.");
      } else if (value === ProfileStatus.ON_LEAVE) {
        setStatusWarning(t.language === 'id' ? "Catatan: Pastikan Tanggal Bergabung mencerminkan kontrak saat ini." : "Note: Ensure the Join Date reflects the current contract.");
      } else {
        setStatusWarning(null);
      }
    }

    return !error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue: any = value;
    if (name === 'age') {
      finalValue = value === '' ? undefined : parseInt(value, 10);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) {
      validateField(name, value);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t.language === 'id' ? 'Ukuran file terlalu besar (Maks 5MB)' : 'File size too large (Max 5MB)');
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

        toast.success(t.language === 'id' ? 'Foto dioptimalkan dan diunggah' : 'Photo optimized and uploaded');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFaceDataUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t.language === 'id' ? 'Ukuran file terlalu besar (Maks 5MB)' : 'File size too large (Max 5MB)');
      return;
    }

    setFaceDataFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFaceDataPreview(event.target?.result as string);
      toast.success(t.language === 'id' ? 'Data wajah ditambahkan' : 'Face data added');
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setFormData({ ...initialFormState, role: pageType === 'students' ? 'student' : '', class: '', age: undefined });
    setAvatarFile(null);
    setFaceDataFile(null);
    setFaceDataPreview(null);
    setErrors({});
    setStatusWarning(null);
    setIsEditMode(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (profile: Profile) => {
    setFormData({ ...profile, class: profile.class || '', age: profile.age || undefined });
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
    const passValid = validateField('password', formData.password || '');
    const passConfValid = validateField('password_confirmation', formData.password_confirmation || '');

    const isValid = idValid && nameValid && emailValid && roleValid && deptValid && passValid && passConfValid;
    if (!isValid) {
      setShakeModal(true);
      setTimeout(() => setShakeModal(false), 500);
      toast.error(t.language === 'id' ? 'Harap periksa form kembali' : 'Please check the form for errors');
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
    if (isEditMode) onEditProfile(formData, avatarFile || undefined, faceDataFile || undefined);
    else onAddProfile(formData, avatarFile || undefined, faceDataFile || undefined);
    // Modal closing is now handled by the processing useEffect for robust syncing
  };

  const confirmDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteConfirmOpen(true);
    setActiveMenuId(null);
  };

  const handleDelete = () => {
    if (deleteTargetId) {
      onDeleteProfile(deleteTargetId);
    }
  };

  const getStatusColor = (status: ProfileStatus) => {
    switch (status) {
      case ProfileStatus.ACTIVE: return 'bg-emerald-100 text-emerald-800';
      case ProfileStatus.ON_LEAVE: return 'bg-amber-100 text-amber-800';
      case ProfileStatus.TERMINATED: return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: ProfileStatus) => {
    switch (status) {
      case ProfileStatus.ACTIVE: return t.active;
      case ProfileStatus.ON_LEAVE: return t.onLeave;
      case ProfileStatus.TERMINATED: return t.terminated;
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

  const SortIcon = ({ column }: { column: keyof Profile }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-50" />;
    return <ArrowUpDown className={`h-4 w-4 text-theme-primary ${sortConfig.direction === 'asc' ? '' : 'rotate-180'}`} />;
  };

  const totalCount = profiles.length;
  const activeCount = profiles.filter(p => p.status === ProfileStatus.ACTIVE).length;
  const onLeaveCount = profiles.filter(p => p.status === ProfileStatus.ON_LEAVE).length;
  const terminatedCount = profiles.filter(p => p.status === ProfileStatus.TERMINATED).length;
  const uniqueDepartments = Array.from(new Set(profiles.map(p => p.department).filter(Boolean)));
  const deptCount = uniqueDepartments.length;

  return (
    <div className="space-y-6 relative">
        <div className="space-y-4">
          {/* Top Bar with Inline Quick Stats */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {pageType === 'students' ? 'Workspace Siswa' : 'Workspace Tim'}
              </h2>
              <p className="text-xs text-slate-500">Panel data split interaktif dengan filter instan</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Total: {totalCount}</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">{activeCount} Aktif</span>
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 rounded-lg bg-theme-primary hover:bg-theme-primary-hover text-white font-semibold text-xs py-1.5 px-3 shadow-2xs transition-all"
                disabled={isProcessing}
              >
                <Plus className="h-3.5 w-3.5" />
                {pageType === 'students' ? t.addStudent : t.addProfile}
              </button>
            </div>
          </div>

          {/* Quick Status Chips & Progress Strip */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              {[
                { label: 'Semua', val: 'All', count: totalCount },
                { label: 'Aktif', val: ProfileStatus.ACTIVE, count: activeCount },
                { label: 'Izin/Cuti', val: ProfileStatus.ON_LEAVE, count: onLeaveCount },
                { label: 'Nonaktif', val: ProfileStatus.TERMINATED, count: terminatedCount }
              ].map(item => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setStatusFilter(item.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === item.val ? 'bg-theme-primary text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  {item.label} <span className="opacity-75">({item.count})</span>
                </button>
              ))}
            </div>

            <div className="w-full md:w-56 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                <span>Keaktifan</span>
                <span className="text-emerald-600">{Math.round((activeCount / (totalCount || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.round((activeCount / (totalCount || 1)) * 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari siswa..."
                className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-9.5 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-theme-primary/30 focus:border-theme-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-md p-1.5 transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-theme-primary shadow-2xs font-semibold' : 'text-slate-400'}`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-md p-1.5 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-theme-primary shadow-2xs font-semibold' : 'text-slate-400'}`}
                title="Table View"
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
                onChange={(e) => handleSort(e.target.value as keyof Profile)}
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
          {paginatedProfiles.map((profile) => (
            <div key={profile.id} className="group relative rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm border border-white/20 dark:border-slate-800 hover:shadow-md hover:bg-white/95 dark:hover:bg-slate-900/95 hover:border-theme-primary/40 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4 min-w-0">
                  <AvatarWithSkeleton src={profile.avatar} alt={profile.name} className="h-12 w-12 rounded-full" />
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white transition-colors truncate">{profile.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{profile.role}</p>
                  </div>
                </div>

                <div className="relative">
                  <Tooltip text={t.language === 'id' ? 'Aksi' : 'Actions'}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === profile.id ? null : profile.id); }}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-hidden transition-colors"
                      aria-label="Toggle Menu"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </Tooltip>
                  {activeMenuId === profile.id && (
                    <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 z-20 animate-in slide-in-from-top-1 duration-150">
                      <div className="py-1">
                        {pageType === 'students' && (
                          <button
                            type="button"
                            onClick={() => { setActiveMenuId(null); handleTogglePassword(profile.id); }}
                            className="flex w-full items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-theme-primary transition-colors group"
                            title={profile.canChangePassword ? 'Revoke Password Change Permission' : 'Grant Password Change Permission'}
                          >
                            {profile.canChangePassword ? (
                              <Unlock className="mr-2 h-4 w-4 text-emerald-500 group-hover:text-emerald-600" />
                            ) : (
                              <Lock className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-theme-primary" />
                            )}
                            {profile.canChangePassword ? (t.language === 'id' ? 'Kunci Ubah Sandi' : 'Lock Password Reset') : (t.language === 'id' ? 'Buka Ubah Sandi' : 'Allow Password Reset')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(profile)}
                          className="flex w-full items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-theme-primary transition-colors group"
                        >
                          <Edit className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-theme-primary" />
                          {t.language === 'id' ? 'Ubah' : 'Edit'}
                          <div className="ml-auto hidden group-hover:block text-[8px] uppercase font-bold text-theme-primary">Ctrl+E</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(profile.id)}
                          className="flex w-full items-center px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors group"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-rose-500 group-hover:text-rose-600 dark:group-hover:text-rose-300" />
                          {t.language === 'id' ? 'Hapus' : 'Delete'}
                          <div className="ml-auto hidden group-hover:block text-[8px] uppercase font-bold text-rose-400 dark:text-rose-500">Del</div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(profile.status)}`}>
                  {getStatusLabel(profile.status)}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">ID: {profile.id}</span>
              </div>

              <div className="space-y-2 border-t border-slate-50 dark:border-slate-800/50 pt-4 min-w-0">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Briefcase className="mr-2 h-4 w-4 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{profile.department}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Mail className="mr-2 h-4 w-4 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{profile.email}</span>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Tooltip text={t.viewProfile} position="left">
                  <button onClick={() => setViewProfile(profile)} className="text-xs font-medium text-theme-primary hover:opacity-80 flex items-center transition-colors">
                    {t.viewProfile} <span className="ml-1"><ChevronRight className="h-3 w-3" /></span>
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}

          {filteredProfiles.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-full mb-4 inline-block shadow-sm">
                <Search className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {t.language === 'id' ? 'Karyawan Tidak Ditemukan' : 'No Profiles Found'}
              </h4>
              <p className="text-sm max-w-sm mx-auto text-center">
                {searchTerm
                  ? (t.language === 'id' ? 'Tidak ada karyawan yang cocok dengan pencarian Anda.' : 'No profiles match your search criteria.')
                  : (t.language === 'id' ? 'Tidak ada karyawan yang cocok dengan filter yang dipilih.' : 'No profiles match the selected filters.')}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
              {/* Header sort bar */}
              <div className="hidden sm:grid grid-cols-[2.5fr_1.3fr_1.3fr_130px_140px] items-center px-6 py-2.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-100/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <div
                  className="cursor-pointer hover:text-theme-primary transition-colors flex items-center gap-1.5"
                  onClick={() => handleSort('name')}
                >
                  {t.profile} <SortIcon column="name" />
                </div>
                <div
                  className="cursor-pointer hover:text-theme-primary transition-colors flex items-center gap-1.5"
                  onClick={() => handleSort('role')}
                >
                  {t.position} <SortIcon column="role" />
                </div>
                <div
                  className="cursor-pointer hover:text-theme-primary transition-colors flex items-center gap-1.5"
                  onClick={() => handleSort('department')}
                >
                  {t.department} <SortIcon column="department" />
                </div>
                <div
                  className="cursor-pointer hover:text-theme-primary transition-colors flex items-center gap-1.5"
                  onClick={() => handleSort('status')}
                >
                  {t.language === 'id' ? 'Status' : 'Status'} <SortIcon column="status" />
                </div>
                <div className="text-right">
                  {t.language === 'id' ? 'Aksi' : 'Actions'}
                </div>
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-2.5">
                {paginatedProfiles.length > 0 ? (
                  paginatedProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-theme-primary/40 hover:-translate-y-0.5 transition-all duration-200 p-4 sm:px-6 sm:py-3.5 grid grid-cols-1 sm:grid-cols-[2.5fr_1.3fr_1.3fr_130px_140px] items-center gap-4"
                    >
                      {/* Identity */}
                      <div className="flex items-center gap-4 min-w-0">
                        <AvatarWithSkeleton
                          src={profile.avatar}
                          alt={profile.name}
                          className="h-11 w-11 rounded-xl ring-2 ring-slate-100 dark:ring-slate-800 shadow-xs flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-theme-primary transition-colors truncate">
                              {profile.name}
                            </span>
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-theme-primary-light text-theme-primary-text border border-theme-primary/30">
                              {profile.id}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate mt-1">
                            <Mail className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{profile.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Role & Class */}
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {profile.role}
                        </span>
                        {profile.class && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 font-medium">
                            <GraduationCap className="h-3.5 w-3.5 text-theme-primary" />
                            <span>{profile.class}</span>
                          </div>
                        )}
                      </div>

                      {/* Department & Join */}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{profile.department}</span>
                        </div>
                        {profile.joinDate && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>{profile.joinDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Status with luminous dot */}
                      <div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs ${
                            profile.status === ProfileStatus.ACTIVE
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-800/40 dark:text-emerald-400'
                              : profile.status === ProfileStatus.ON_LEAVE
                              ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-800/40 dark:text-amber-400'
                              : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-800/40 dark:text-rose-400'
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              profile.status === ProfileStatus.ACTIVE
                                ? 'bg-emerald-500 animate-pulse'
                                : profile.status === ProfileStatus.ON_LEAVE
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          {getStatusLabel(profile.status)}
                        </span>
                      </div>

                      {/* Action Dock */}
                      <div className="flex items-center justify-end gap-1.5">
                        {pageType === 'students' && (
                          <button
                            type="button"
                            onClick={() => handleTogglePassword(profile.id)}
                            aria-label={profile.canChangePassword ? (t.language === 'id' ? 'Kunci Ubah Sandi' : 'Lock Password Reset') : (t.language === 'id' ? 'Buka Ubah Sandi' : 'Allow Password Reset')}
                            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-theme-primary hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-colors shadow-2xs"
                            title={profile.canChangePassword ? (t.language === 'id' ? 'Kunci Ubah Sandi' : 'Lock Password Reset') : (t.language === 'id' ? 'Buka Ubah Sandi' : 'Allow Password Reset')}
                          >
                            {profile.canChangePassword ? <Unlock className="h-4 w-4 text-emerald-500" /> : <Lock className="h-4 w-4" />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setViewProfile(profile)}
                          aria-label={t.viewProfile || 'View Profile'}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-theme-primary hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-colors shadow-2xs"
                          title={t.viewProfile}
                        >
                          <User className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(profile)}
                          aria-label={t.editProfile || 'Edit Profile'}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-theme-primary hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-colors shadow-2xs"
                          title={t.editProfile}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(profile.id)}
                          aria-label={t.delete || 'Delete Profile'}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-rose-50/60 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200/60 dark:border-rose-900/40 transition-colors shadow-2xs"
                          title={t.delete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-xs">
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3 inline-block">
                      <Search className="h-8 w-8 text-slate-400" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                      {t.language === 'id' ? 'Data Tidak Ditemukan' : 'No Profiles Found'}
                    </h4>
                    <p className="text-sm max-w-sm mx-auto text-slate-500 dark:text-slate-400">
                      {searchTerm
                        ? (t.language === 'id' ? 'Tidak ada data yang cocok dengan kriteria pencarian.' : 'No profiles match your search criteria.')
                        : (t.language === 'id' ? 'Tidak ada data yang cocok dengan filter yang dipilih.' : 'No profiles match the selected filters.')}
                    </p>
                  </div>
                )}
              </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/20 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-4 sm:px-6 rounded-xl shadow-sm transition-colors duration-300 mt-6 overflow-hidden gap-4">
          <div className="w-full flex justify-center sm:justify-start sm:w-auto">
            <p className="text-sm text-slate-700 dark:text-slate-300 text-center sm:text-left">
              {t.language === 'id' ? 'Menampilkan' : 'Showing'}{' '}
              <span className="font-medium">{(currentPage - 1) * getItemsPerPage() + 1}</span>{' '}
              {t.language === 'id' ? 'hingga' : 'to'}{' '}
              <span className="font-medium">
                {Math.min(currentPage * getItemsPerPage(), filteredProfiles.length)}
              </span>{' '}
              {t.language === 'id' ? 'dari' : 'of'}{' '}
              <span className="font-medium">{filteredProfiles.length}</span>{' '}
              {t.language === 'id' ? 'hasil' : 'results'}
            </p>
          </div>
          <div className="w-full sm:w-auto flex justify-center sm:justify-end">
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-3 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-600 bg-white/50 dark:bg-slate-800/50">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-3 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {viewProfile && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md transition-all duration-300">
          <div className="flex min-h-full p-4 sm:p-6">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="view-profile-name"
              className="m-auto w-full max-w-lg rounded-2xl bg-white/95 dark:bg-slate-900/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300 transition-colors"
            >
              <div className="relative h-28 bg-slate-800 dark:bg-slate-950 border-b border-slate-700/50">
                <button
                  onClick={() => {
                    setViewProfile(null);
                    setAiSummary(null);
                  }}
                  className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/40"
                  aria-label={t.language === 'id' ? 'Tutup detail profil' : 'Close profile view'}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-8 pb-8 relative">
                <div className="absolute -top-14 left-8 flex items-end gap-4">
                  <div className="rounded-full p-1.5 bg-white dark:bg-slate-900 shadow-lg transition-colors duration-200">
                    <img src={viewProfile.avatar} alt={viewProfile.name} className="h-28 w-28 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800" />
                  </div>
                  <div className="pb-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold shadow-sm border ${viewProfile.status === ProfileStatus.ACTIVE ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-800/30 dark:text-emerald-400' :
                      viewProfile.status === ProfileStatus.ON_LEAVE ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-800/30 dark:text-amber-400' :
                        'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-800/30 dark:text-rose-400'
                      }`}>
                    {getStatusLabel(viewProfile.status)}
                    </span>
                  </div>
                </div>

                <div className="pt-20 sm:flex sm:justify-between sm:items-start">
                  <div>
                    <h2 id="view-profile-name" className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">{viewProfile.name}</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1">
                      {viewProfile.role} <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span> {viewProfile.department}
                    </p>
                  </div>
                  <button
                    onClick={() => handleGenerateAISummary(viewProfile)}
                    disabled={isGeneratingSummary}
                    className="mt-4 sm:mt-0 flex shrink-0 items-center justify-center gap-2 rounded-xl bg-theme-primary hover:bg-theme-primary-hover px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
                  >
                    {isGeneratingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>✨</span>}
                    {isGeneratingSummary ? (t.language === 'id' ? 'Menghasilkan...' : 'Generating...') : 'AI Summary'}
                  </button>
                </div>

                {/* AI Summary Display */}
                {(isGeneratingSummary || aiSummary || generateError) && (
                  <div className="mt-6 rounded-xl border border-theme-primary/30 bg-theme-primary-light p-5 backdrop-blur-sm shadow-sm transition-all duration-300 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">✨</span>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest">{t.language === 'id' ? 'Ringkasan Kinerja AI' : 'AI Performance Summary'}</h3>
                    </div>

                    {isGeneratingSummary && (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-theme-primary/20 rounded w-3/4"></div>
                        <div className="h-4 bg-theme-primary/20 rounded w-full"></div>
                        <div className="h-4 bg-theme-primary/20 rounded w-5/6"></div>
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
                        className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed prose-p:mb-2 prose-strong:text-theme-primary"
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
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.language === 'id' ? 'ID Karyawan' : 'Profile ID'}</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{viewProfile.id}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-colors flex items-center gap-4">
                      <div className="p-2.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-400 dark:text-slate-300">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.joinDate}</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{new Date(viewProfile.joinDate).toLocaleDateString(t.language === 'id' ? 'id-ID' : 'en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    {viewProfile.role.toLowerCase() === 'student' && viewProfile.class && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-colors flex items-center gap-4">
                        <div className="p-2.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-400 dark:text-slate-300">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Class</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{viewProfile.class}</p>
                        </div>
                      </div>
                    )}
                    {viewProfile.age && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-colors flex items-center gap-4">
                        <div className="p-2.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-400 dark:text-slate-300">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Age</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{viewProfile.age}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-50 dark:border-slate-800/50">
                      <div className="p-2 bg-theme-primary-light text-theme-primary-text rounded-lg shrink-0"><Mail className="h-5 w-5" /></div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.emailAddress}</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate mt-0.5">{viewProfile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-50 dark:border-slate-800/50">
                      <div className="p-2 bg-theme-primary-light text-theme-primary-text rounded-lg shrink-0"><Phone className="h-5 w-5" /></div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.phoneNumber}</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 mt-0.5">{viewProfile.phoneNumber || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="p-2 bg-theme-primary-light text-theme-primary-text rounded-lg shrink-0"><MapPin className="h-5 w-5" /></div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.address}</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 leading-relaxed mt-0.5 max-w-[300px]">{viewProfile.address || '-'}</p>
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
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-form-title"
            className={`w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-xl max-h-[90vh] flex flex-col ${shakeModal ? 'animate-shake' : ''}`}
          >
            {/* Header with compact status */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 shrink-0 bg-white dark:bg-slate-900 rounded-t-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-theme-primary" />
                <h3 id="profile-form-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {isEditMode
                    ? (pageType === 'students' ? t.editStudent : t.editProfile)
                    : (pageType === 'students' ? t.newStudent : t.newProfile)}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                disabled={isProcessing}
                aria-label={t.cancel || 'Tutup'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Body */}
            <form id="profile-form" onSubmit={handleFormSubmit} className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
                  {/* Inline Compact Biometric Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-300 dark:border-slate-600 flex items-center justify-center">
                        {formData.avatar ? (
                          <img src={formData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{t.language === 'id' ? 'Foto Profil' : 'Profile Photo'}</div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] font-medium text-theme-primary hover:underline"
                        >
                          {formData.avatar ? (t.language === 'id' ? 'Ubah File' : 'Change') : (t.language === 'id' ? 'Pilih Berkas' : 'Select File')}
                        </button>
                      </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-300 dark:border-slate-600 flex items-center justify-center">
                        {faceDataPreview ? (
                          <img src={faceDataPreview} alt="Face Data" className="h-full w-full object-cover" />
                        ) : (
                          <Camera className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{t.language === 'id' ? 'Data Wajah (AI)' : 'Face Biometrics'}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded ${faceDataPreview ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                            {faceDataPreview ? 'Ready' : 'Pending'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => faceDataInputRef.current?.click()}
                          className="text-[11px] font-medium text-theme-primary hover:underline"
                        >
                          {faceDataPreview ? (t.language === 'id' ? 'Ubah Template' : 'Change') : (t.language === 'id' ? 'Rekam Wajah' : 'Enroll')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">ID Profil <span className="text-rose-500">*</span></label>
                      <input
                        required
                        type="text"
                        name="id"
                        value={formData.id}
                        onChange={handleInputChange}
                        disabled={isEditMode || isProcessing}
                        className={`w-full rounded-md border px-3 py-1.5 font-mono ${errors.id ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary'} ${isEditMode ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{t.allStatus} <span className="text-rose-500">*</span></label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                      >
                        <option value={ProfileStatus.ACTIVE}>{t.active}</option>
                        <option value={ProfileStatus.ON_LEAVE}>{t.onLeave}</option>
                        <option value={ProfileStatus.TERMINATED}>{t.terminated}</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{t.fullName} <span className="text-rose-500">*</span></label>
                      <input
                        required
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{t.position} <span className="text-rose-500">*</span></label>
                      <input
                        required
                        type="text"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        disabled={isProcessing || pageType === 'students'}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{t.department} <span className="text-rose-500">*</span></label>
                      <input
                        required
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{t.emailAddress} <span className="text-rose-500">*</span></label>
                      <input
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{t.address}</label>
                      <textarea
                        name="address"
                        value={formData.address || ''}
                        onChange={handleInputChange as any}
                        disabled={isProcessing}
                        rows={2}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{t.phoneNumber}</label>
                      <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber || ''}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{t.joinDate} <span className="text-rose-500">*</span></label>
                      <input
                        required
                        type="date"
                        name="joinDate"
                        value={formData.joinDate}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                      />
                    </div>
                    {formData.role.toLowerCase() === 'student' && (
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Kelas</label>
                        <input
                          type="text"
                          name="class"
                          value={formData.class}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^a-zA-Z0-9\s-]/g, '');
                            setFormData(prev => ({ ...prev, class: val }));
                          }}
                          disabled={isProcessing}
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Usia</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t.language === 'id' ? 'Kata Sandi' : 'Password'} {isEditMode ? '' : <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password || ''}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t.language === 'id' ? 'Konfirmasi Sandi' : 'Confirm Password'} {isEditMode ? '' : <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="password"
                        name="password_confirmation"
                        value={formData.password_confirmation || ''}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                      />
                    </div>
                  </div>
                </form>

                {/* Footer */}
                <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-3 shrink-0 bg-slate-50 dark:bg-slate-900 rounded-b-xl flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="rounded-md border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    disabled={isProcessing}
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    form="profile-form"
                    className="rounded-md bg-theme-primary px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-theme-primary-hover disabled:opacity-50 min-w-[100px] flex items-center justify-center"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        {t.language === 'id' ? 'Memproses...' : 'Processing...'}
                      </>
                    ) : (
                      isEditMode
                        ? (pageType === 'students' ? t.updateStudent : t.updateProfile)
                        : (pageType === 'students' ? t.saveStudent : t.saveProfile)
                    )}
                  </button>
                </div>
              </div>
        </div>
      )}

      {/* Save Confirmation Modal with Robust Handling */}
      {isSaveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4 transition-all duration-300">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-save-title"
            className="w-full max-w-md rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200 transition-colors backdrop-blur-xl"
          >
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-theme-primary-light mb-6 shadow-inner ring-4 ring-theme-primary/10">
                <AlertCircle className="h-8 w-8 text-theme-primary" />
              </div>
              <h3 id="confirm-save-title" className="text-xl font-bold text-slate-900 dark:text-white">{t.confirmSave}</h3>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto">{t.areYouSureSave}</p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleConfirmSave}
                className="flex items-center justify-center w-full bg-theme-primary text-white rounded-md px-4 py-2 font-bold hover:bg-theme-primary-hover disabled:opacity-50 transition-all shadow-sm"
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
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            className="w-full max-w-md rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200 transition-colors backdrop-blur-xl"
          >
            {externalErrors['delete'] && (
              <div role="alert" className="mb-6 rounded-lg bg-rose-50 dark:bg-rose-500/10 p-4 border border-rose-200/50 dark:border-rose-500/20 text-sm text-rose-800 dark:text-rose-400 font-bold flex items-center gap-3 shadow-inner">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                {externalErrors['delete']}
              </div>
            )}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10 mb-6 shadow-inner ring-4 ring-rose-50/50 dark:ring-rose-500/5">
                <Trash2 className="h-8 w-8 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 id="confirm-delete-title" className="text-xl font-bold text-slate-900 dark:text-white">{t.confirmDeletion}</h3>
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
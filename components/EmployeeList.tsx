import React, { useState, useEffect } from 'react';
import { Employee, EmployeeStatus } from '../types';
import { Plus, Search, Mail, Briefcase, MoreVertical, X, Phone, MapPin, AlertCircle, Edit, Trash2, Calendar, Filter } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onAddEmployee, onEditEmployee, onDeleteEmployee }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  
  // Selection and Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
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

  // Close menus when clicking outside
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Form Actions
  const openAddModal = () => {
    setFormData(initialFormState);
    setIsEditMode(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setFormData({ ...employee });
    setIsEditMode(true);
    setIsFormModalOpen(true);
    setActiveMenuId(null); // Close menu
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.id || !formData.email) {
      alert('Please fill in at least Name, ID, and Email.');
      return;
    }
    setIsSaveConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    const employeeData: Employee = {
      ...formData,
      avatar: formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,
    };

    if (isEditMode) {
      onEditEmployee(employeeData);
    } else {
      onAddEmployee(employeeData);
    }

    setIsSaveConfirmOpen(false);
    setIsFormModalOpen(false);
    setFormData(initialFormState);
  };

  // Delete Actions
  const confirmDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteConfirmOpen(true);
    setActiveMenuId(null);
  };

  const handleDelete = () => {
    if (deleteTargetId) {
      onDeleteEmployee(deleteTargetId);
      setIsDeleteConfirmOpen(false);
      setDeleteTargetId(null);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Employees</h2>
          <p className="text-slate-500">Manage your team members and their details.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search employees..."
            className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
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
            className="block w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-8 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Status</option>
            <option value={EmployeeStatus.ACTIVE}>Active</option>
            <option value={EmployeeStatus.ON_LEAVE}>On Leave</option>
            <option value={EmployeeStatus.TERMINATED}>Terminated</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="group relative rounded-xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center space-x-4">
                <img 
                  src={employee.avatar} 
                  alt={employee.name} 
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {employee.name}
                  </h3>
                  <p className="text-sm text-slate-500">{employee.role}</p>
                </div>
              </div>

               {/* Menu Button and Dropdown */}
               <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === employee.id ? null : employee.id);
                  }}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 focus:outline-none"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                
                {activeMenuId === employee.id && (
                  <div className="absolute right-0 mt-2 w-32 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-10 animate-fade-in">
                    <div className="py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(employee);
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Edit className="mr-2 h-4 w-4 text-slate-500" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(employee.id);
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4 text-rose-500" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(employee.status)}`}>
                  {employee.status}
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
                <button 
                  onClick={() => setViewEmployee(employee)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                    View Profile <span className="ml-1">&rarr;</span>
                </button>
            </div>
          </div>
        ))}
      </div>
      
      {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
              <p className="text-slate-500">No employees found matching your search.</p>
          </div>
      )}

      {/* Add/Edit Employee Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* ID */}
                <div>
                  <label className="block text-sm font-medium text-slate-700">Employee ID <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    disabled={isEditMode}
                    className={`mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isEditMode ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                    placeholder="e.g. EMP-001"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700">Status <span className="text-red-500">*</span></label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={EmployeeStatus.ACTIVE}>Active</option>
                    <option value={EmployeeStatus.ON_LEAVE}>On Leave</option>
                    <option value={EmployeeStatus.TERMINATED}>Terminated</option>
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700">Full Name <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="John Doe"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-slate-700">Position / Role <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Software Engineer"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-slate-700">Department <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Engineering"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email Address <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700">Phone Number</label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber || ''}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border border-slate-300 pl-10 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                {/* Profile Picture URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Profile Picture URL</label>
                  <input
                    type="text"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="https://example.com/photo.jpg (Leave blank for default avatar)"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Address</label>
                  <div className="relative mt-1">
                     <div className="pointer-events-none absolute top-3 left-0 flex items-center pl-3">
                      <MapPin className="h-4 w-4 text-slate-400" />
                    </div>
                    <textarea
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="block w-full rounded-lg border border-slate-300 pl-10 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Street Address, City, State, Zip"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {isEditMode ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {isSaveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <AlertCircle className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Are you sure?</h3>
              <div className="mt-2">
                <p className="text-sm text-slate-500">
                  Do you really want to {isEditMode ? 'update' : 'add'} <strong>{formData.name}</strong>?
                </p>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                onClick={handleConfirmSave}
              >
                Yes, {isEditMode ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:text-sm"
                onClick={() => setIsSaveConfirmOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
              <Trash2 className="h-6 w-6 text-rose-600" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Confirm Deletion</h3>
              <div className="mt-2">
                <p className="text-sm text-slate-500">
                  Are you sure you want to remove this employee? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-rose-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 sm:text-sm"
                onClick={handleDelete}
              >
                Yes, Delete
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

      {/* View Profile Modal */}
      {viewEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-indigo-600 px-6 py-8 text-center relative">
              <button 
                onClick={() => setViewEmployee(null)}
                className="absolute top-4 right-4 text-indigo-200 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="mx-auto h-24 w-24 rounded-full border-4 border-white overflow-hidden bg-white">
                <img src={viewEmployee.avatar} alt={viewEmployee.name} className="h-full w-full object-cover" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">{viewEmployee.name}</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                 <p className="text-indigo-200">{viewEmployee.role}</p>
                 <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-white/20 text-white border border-white/20`}>
                  {viewEmployee.status}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase">Employee ID</p>
                  <p className="text-sm font-semibold text-slate-900">{viewEmployee.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase">Joined Date</p>
                  <div className="flex items-center text-sm font-semibold text-slate-900">
                    <Calendar className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                    {viewEmployee.joinDate}
                  </div>
                </div>
                <div className="col-span-2 space-y-1 border-t border-slate-100 pt-3">
                  <p className="text-xs font-medium text-slate-500 uppercase">Department</p>
                  <div className="flex items-center text-sm text-slate-900">
                    <Briefcase className="mr-2 h-4 w-4 text-slate-400" />
                    {viewEmployee.department}
                  </div>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase">Contact Info</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-slate-900">
                      <Mail className="mr-2 h-4 w-4 text-slate-400" />
                      {viewEmployee.email}
                    </div>
                    {viewEmployee.phoneNumber && (
                      <div className="flex items-center text-sm text-slate-900">
                        <Phone className="mr-2 h-4 w-4 text-slate-400" />
                        {viewEmployee.phoneNumber}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-2 space-y-1 border-t border-slate-100 pt-3">
                  <p className="text-xs font-medium text-slate-500 uppercase">Address</p>
                  <div className="flex items-start text-sm text-slate-900">
                    <MapPin className="mr-2 h-4 w-4 text-slate-400 mt-0.5" />
                    <span>{viewEmployee.address || 'No address provided'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                   onClick={() => setViewEmployee(null)}
                   className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
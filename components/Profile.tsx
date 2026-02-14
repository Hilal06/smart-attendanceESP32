
import React, { useState } from 'react';
import { Employee, ProfileRequest } from '../types';
import { Mail, Phone, MapPin, Briefcase, Calendar, Shield, Send, X, AlertCircle } from 'lucide-react';

interface ProfileProps {
  employee: Employee | undefined;
  onRequestUpdate: (description: string) => void;
  // Fix: added 't' to props interface for localization support
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
        <h3 className="text-xl font-bold text-slate-900">Employee Profile Not Found</h3>
        <p className="text-slate-500 mt-2">Please log in with a valid Employee ID to view your profile.</p>
      </div>
    );
  }

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestDescription.trim()) {
      onRequestUpdate(requestDescription);
      setSubmitted(true);
      setTimeout(() => {
        setIsRequestModalOpen(false);
        setSubmitted(false);
        setRequestDescription('');
      }, 2000);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Profile</h2>
          <p className="text-slate-500">View your personal and employment information.</p>
        </div>
        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Send className="mr-2 h-4 w-4" />
          Request Info Update
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-indigo-600 to-indigo-900"></div>
            <div className="px-6 pb-6">
              <div className="-mt-16 flex justify-center">
                <img
                  src={employee.avatar}
                  alt={employee.name}
                  className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-md"
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold text-slate-900">{employee.name}</h3>
                <p className="text-slate-500 font-medium">{employee.role}</p>
                <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                  employee.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {employee.status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Quick Stats</h4>
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Employee ID</span>
                  <span className="text-sm font-bold text-slate-900">{employee.id}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Department</span>
                  <span className="text-sm font-bold text-slate-900">{employee.department}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Member Since</span>
                  <span className="text-sm font-bold text-slate-900">{employee.joinDate}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Personal & Contact Details</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <Mail className="h-3 w-3 mr-1.5" /> Email Address
                  </p>
                  <p className="text-slate-900 font-medium">{employee.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <Phone className="h-3 w-3 mr-1.5" /> Phone Number
                  </p>
                  <p className="text-slate-900 font-medium">{employee.phoneNumber || 'Not provided'}</p>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <p className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <MapPin className="h-3 w-3 mr-1.5" /> Home Address
                  </p>
                  <p className="text-slate-900 font-medium leading-relaxed">
                    {employee.address || 'No address information on file.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Employment Information</h3>
            </div>
            <div className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      <Briefcase className="h-3 w-3 mr-1.5" /> Position
                    </p>
                    <p className="text-slate-900 font-medium">{employee.role}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      <Shield className="h-3 w-3 mr-1.5" /> Access Role
                    </p>
                    <p className="text-slate-900 font-medium">Standard Attendance User</p>
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      <Calendar className="h-3 w-3 mr-1.5" /> Join Date
                    </p>
                    <p className="text-slate-900 font-medium">{employee.joinDate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      <AlertCircle className="h-3 w-3 mr-1.5" /> Status
                    </p>
                    <p className="text-emerald-600 font-bold">{employee.status}</p>
                  </div>
               </div>
            </div>
          </div>
          
          <div className="rounded-xl bg-amber-50 p-4 border border-amber-100 flex gap-3">
             <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
             <p className="text-sm text-amber-800">
               <strong>Information Policy:</strong> For security reasons, your profile information can only be updated by HR. Use the "Request Update" button if your details change.
             </p>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-fade-in overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Request Information Update</h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              {submitted ? (
                <div className="py-8 text-center animate-bounce">
                   <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                     <Send className="h-8 w-8 text-emerald-600" />
                   </div>
                   <h4 className="text-lg font-bold text-slate-900">Request Submitted!</h4>
                   <p className="text-slate-500 text-sm mt-1">Admin will review your request soon.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Please describe what information needs to be updated. Be specific about changes like new phone numbers, address updates, or department transfers.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Change Description</label>
                    <textarea
                      required
                      rows={5}
                      value={requestDescription}
                      onChange={(e) => setRequestDescription(e.target.value)}
                      placeholder="Example: Please update my phone number to +1 (555) 999-8888 and my current address to 742 Evergreen Terrace..."
                      className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsRequestModalOpen(false)}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white shadow-md hover:bg-indigo-700 transition-all"
                    >
                      Send Request
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

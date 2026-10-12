import React from 'react';
import { User, Mail, Briefcase, Phone, MapPin, Fingerprint } from 'lucide-react';

interface RegisterFormFieldsProps {
    data: any;
    setData: (field: string, value: any) => void;
    errors: Partial<Record<string, string>>;
}

export function RegisterFormFields({ data, setData, errors }: RegisterFormFieldsProps) {
    return (
        <>
            {/* Institutional ID (Dynamic) */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label htmlFor="reg-institutional-id" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {data.role === 'student' ? 'Student ID' : 'Teacher ID'}
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Fingerprint className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        id="reg-institutional-id"
                        type="text"
                        value={data.institutional_id}
                        onChange={(e) => setData('institutional_id', e.target.value)}
                        placeholder={data.role === 'student' ? 'STU-2026-001' : 'TCH-2026-001'}
                        className="block w-full pl-10 rounded-xl border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-950/50 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-theme-primary focus:outline-hidden focus:ring-2 focus:ring-theme-primary/20 transition-all shadow-xs"
                    />
                </div>
                {errors.institutional_id && <div role="alert" className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.institutional_id}</div>}
            </div>

            {data.role === 'student' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label htmlFor="reg-class" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Class
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Briefcase className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="reg-class"
                            type="text"
                            value={data.class}
                            onChange={(e) => setData('class', e.target.value.replace(/[^a-zA-Z0-9\s-]/g, ''))}
                            maxLength={20}
                            placeholder="e.g. 10A, CS101"
                            className="block w-full pl-10 rounded-xl border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-950/50 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-theme-primary focus:outline-hidden focus:ring-2 focus:ring-theme-primary/20 transition-all shadow-xs"
                        />
                    </div>
                    {errors.class && <div role="alert" className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.class}</div>}
                </div>
            )}

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label htmlFor="reg-age" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Age
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        id="reg-age"
                        type="number"
                        value={data.age}
                        onChange={(e) => setData('age', e.target.value)}
                        placeholder="e.g. 15, 30"
                        className="block w-full pl-10 rounded-xl border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-950/50 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-theme-primary focus:outline-hidden focus:ring-2 focus:ring-theme-primary/20 transition-all shadow-xs"
                        min="0"
                        max="150"
                    />
                </div>
                {errors.age && <div role="alert" className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.age}</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
                {/* Name */}
                <div className="md:col-span-2">
                    <label htmlFor="reg-name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Full Name
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="reg-name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="John Doe"
                            className="block w-full pl-10 rounded-xl border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-950/50 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-theme-primary focus:outline-hidden focus:ring-2 focus:ring-theme-primary/20 transition-all shadow-xs"
                            required
                        />
                    </div>
                    {errors.name && <div role="alert" className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.name}</div>}
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                    <label htmlFor="reg-email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Email Address
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="reg-email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="john@example.com"
                            className="block w-full pl-10 rounded-xl border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-950/50 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-theme-primary focus:outline-hidden focus:ring-2 focus:ring-theme-primary/20 transition-all shadow-xs"
                            required
                        />
                    </div>
                    {errors.email && <div role="alert" className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.email}</div>}
                </div>

                {/* Department */}
                <div className="md:col-span-2">
                    <label htmlFor="reg-dept" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Department/Class
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Briefcase className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="reg-dept"
                            type="text"
                            value={data.department}
                            onChange={(e) => setData('department', e.target.value)}
                            placeholder="Computer Science"
                            className="block w-full pl-10 rounded-xl border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-950/50 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-theme-primary focus:outline-hidden focus:ring-2 focus:ring-theme-primary/20 transition-all shadow-xs"
                        />
                    </div>
                    {errors.department && <div role="alert" className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.department}</div>}
                </div>

                {/* Phone Number */}
                <div>
                    <label htmlFor="reg-phone" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Phone Number
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="reg-phone"
                            type="tel"
                            value={data.phone_number}
                            onChange={(e) => setData('phone_number', e.target.value)}
                            placeholder="+1 234 567 890"
                            className="block w-full pl-10 rounded-xl border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-950/50 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-theme-primary focus:outline-hidden focus:ring-2 focus:ring-theme-primary/20 transition-all shadow-xs"
                        />
                    </div>
                    {errors.phone_number && <div role="alert" className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.phone_number}</div>}
                </div>

                {/* Address */}
                <div>
                    <label htmlFor="reg-address" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Address
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="reg-address"
                            type="text"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            placeholder="123 Main St"
                            className="block w-full pl-10 rounded-xl border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-950/50 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-theme-primary focus:outline-hidden focus:ring-2 focus:ring-theme-primary/20 transition-all shadow-xs"
                        />
                    </div>
                    {errors.address && <div role="alert" className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.address}</div>}
                </div>
            </div>
        </>
    );
}

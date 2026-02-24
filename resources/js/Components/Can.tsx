import React from 'react';
import { usePage } from '@inertiajs/react';
import { Auth } from '../types';

interface CanProps {
    permission?: string;
    role?: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    key?: React.Key;
}

export default function Can({ permission, role, children, fallback = null }: CanProps) {
    const { auth } = usePage<{ auth: Auth }>().props;

    const hasRole = () => {
        if (!role) return true;
        // Check both the broad session role, and the specific authenticated user role 
        return auth.role === role || auth.user?.role === role;
    };

    const hasPermission = () => {
        if (!permission) return true;

        // Admins pass all checks intrinsically in our setup, but we also check the array
        if (auth.role === 'admin' || auth.user?.role === 'admin') return true;

        return auth.user?.permissions?.includes(permission) ?? false;
    };

    if (hasRole() && hasPermission()) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}

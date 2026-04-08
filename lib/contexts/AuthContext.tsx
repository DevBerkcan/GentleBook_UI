// lib/contexts/AuthContext.tsx
'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi, Employee, LoginCredentials, TenantAdminLoginCredentials } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

// Extended to support TenantAdmin and Employee roles
export interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;           // legacy Employee field
  role: string;            // SuperAdmin | TenantAdmin | Employee | Admin | Mitarbeiterin
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string;
  // Legacy Employee fields
  username?: string;
  specialty?: string;
  location?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  /** @deprecated use user instead */
  employee: Employee | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  tenantAdminLogin: (credentials: TenantAdminLoginCredentials) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshEmployee: () => Promise<void>;
  hasRole: (roles: string | string[]) => boolean;
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const stored = localStorage.getItem('auth_user') || localStorage.getItem('employee');

    if (token && stored) {
      try {
        const parsed = JSON.parse(stored);
        // Normalize both old Employee format and new AuthUser format
        const normalized: AuthUser = {
          id: parsed.id ?? parsed.Id,
          email: parsed.email ?? parsed.Email,
          firstName: parsed.firstName ?? parsed.FirstName,
          lastName: parsed.lastName ?? parsed.LastName,
          name: parsed.name ?? parsed.Name,
          role: parsed.role ?? parsed.Role ?? 'Employee',
          tenantId: parsed.tenantId,
          tenantSlug: parsed.tenantSlug,
          tenantName: parsed.tenantName,
          username: parsed.username,
        };
        setUser(normalized);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('employee');
      }
    }

    setLoading(false);
  }, []);

  // Employee login (username + password)
  const login = async (credentials: LoginCredentials) => {
    const result = await authApi.login(credentials);

    if (result.success && result.token && result.employee) {
      const emp = result.employee;
      const normalized: AuthUser = {
        id: emp.id ?? (emp as any).Id,
        email: (emp as any).email,
        firstName: (emp as any).firstName,
        lastName: (emp as any).lastName,
        name: emp.name,
        role: emp.role,
        tenantId: (emp as any).tenantId,
        tenantSlug: (emp as any).tenantSlug,
        tenantName: (emp as any).tenantName,
        username: emp.username,
      };

      localStorage.setItem('access_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(normalized));
      // Keep legacy key for existing components
      localStorage.setItem('employee', JSON.stringify(result.employee));
      setUser(normalized);
    }

    return { success: result.success, message: result.message };
  };

  // TenantAdmin login (tenantSlug + email + password)
  const tenantAdminLogin = async (credentials: TenantAdminLoginCredentials) => {
    const result = await authApi.tenantAdminLogin(credentials);

    if (result.success && result.token && result.user) {
      const u = result.user;
      const normalized: AuthUser = {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        name: `${u.firstName} ${u.lastName}`.trim(),
        role: u.role,
        tenantId: u.tenantId,
        tenantSlug: u.tenantSlug,
        tenantName: u.tenantName,
      };

      localStorage.setItem('access_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(normalized));
      setUser(normalized);
    }

    return { success: result.success, message: result.message };
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('employee');
    setUser(null);
    router.push('/admin/login');
  };

  const refreshEmployee = async () => {
    const result = await authApi.getCurrentEmployee();
    if (result.success && result.employee) {
      localStorage.setItem('employee', JSON.stringify(result.employee));
    } else {
      await logout();
    }
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      employee: user as any,  // legacy compatibility
      loading,
      isAuthenticated: !!user,
      login,
      tenantAdminLogin,
      logout,
      refreshEmployee,
      hasRole,
      isSuperAdmin: user?.role === 'SuperAdmin',
      isTenantAdmin: user?.role === 'TenantAdmin',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// lib/api/auth.ts
import api from './client';

export interface Employee {
  id: string;
  name: string;
  username: string;
  role: string;
  specialty: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TenantAdminLoginCredentials {
  tenantSlug: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  employee: Employee;
  message?: string;
}

export interface TenantAdminLoginResponse {
  success: boolean;
  token: string;
  mustChangePassword?: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
    tenantSlug: string;
    tenantName?: string;
  } | null;
  message?: string;
}

export const authApi = {
  // Employee login (existing)
  login: async (credentials: LoginCredentials) => {
    try {
      const response = await api.post('/employee-auth/login', credentials);
      const responseData = response.data;

      if (responseData.token && responseData.employee) {
        return {
          success: true,
          token: responseData.token,
          employee: responseData.employee,
          message: responseData.message,
        };
      }

      return {
        success: false,
        message: responseData.message || 'Ungültige Anmeldedaten',
        token: '',
        employee: null,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Fehler bei der Anmeldung',
        token: '',
        employee: null,
      };
    }
  },

  // TenantAdmin login (new)
  tenantAdminLogin: async (credentials: TenantAdminLoginCredentials): Promise<TenantAdminLoginResponse> => {
    try {
      const response = await api.post('/auth/login', credentials);
      const data = response.data;

      if (data.token && data.user) {
        return {
          success: true,
          token: data.token,
          mustChangePassword: data.mustChangePassword ?? false,
          user: data.user,
          message: data.message,
        };
      }

      return {
        success: false,
        message: data.message || 'Ungültige Anmeldedaten',
        token: '',
        user: null,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Fehler bei der Anmeldung',
        token: '',
        user: null,
      };
    }
  },

  logout: async () => {
    try {
      await api.post('/employee-auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  getCurrentEmployee: async () => {
    try {
      const response = await api.get('/employee-auth/me');
      const { employee } = response.data;
      return { success: true, employee };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Fehler beim Abrufen des Benutzers',
        employee: null,
      };
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const response = await api.put('/employee-auth/change-password', {
        currentPassword,
        newPassword,
      });
      return { success: true, message: response.data.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Fehler bei der Passwortänderung',
      };
    }
  },
};

// lib/api/client.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not configured');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request: attach JWT from localStorage.
// SuperAdmin calls (/superadmin/*) use superadmin_token; all others use access_token.
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const isSuperAdminRoute = config.url?.includes('/superadmin');
      const token = isSuperAdminRoute
        ? localStorage.getItem('superadmin_token')
        : localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response: handle 401/402 globally.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window === 'undefined') return Promise.reject(error);

    const status = error.response?.status;
    const path = window.location.pathname;

    if (status === 401) {
      if (path.startsWith('/superadmin')) {
        localStorage.removeItem('superadmin_token');
        localStorage.removeItem('superadmin_user');
        if (!path.includes('/superadmin/login')) {
          window.location.href = '/superadmin/login';
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('employee');
        if (!path.includes('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
    }

    if (status === 402) {
      // Trial expired — redirect to subscription info page (future)
      console.warn('Subscription expired or trial ended.');
    }

    return Promise.reject(error);
  }
);

export const extractData = <T>(response: any, isList = true): T => {
  try {
    const { data } = response;
    if (!data) return (isList ? [] : null) as T;
    const responseData = data.data !== undefined ? data.data
      : data.Data !== undefined ? data.Data
      : data;
    return responseData as T;
  } catch {
    return (isList ? [] : null) as T;
  }
};

export default api;

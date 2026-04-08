// lib/api/superadmin.ts
// API calls for the Super Admin panel.
import api from './client';

export interface TenantListItem {
  id: string;
  name: string;
  slug: string;
  industryType: string;
  isActive: boolean;
  createdAt: string;
  companyName: string;
  logoUrl?: string;
  subscription?: {
    plan: string;
    status: string;
    trialEndsAt: string;
    trialDaysRemaining: number;
    isInTrial: boolean;
    isAccessAllowed: boolean;
  };
}

export interface CreateTenantPayload {
  name: string;
  slug: string;
  industryType: string;
  currency?: string;
  timeZone?: string;
  adminEmail?: string;
  adminPassword?: string;
  adminFirstName?: string;
  adminLastName?: string;
}

export interface UpdateTenantSettingsPayload {
  companyName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  welcomeMessage?: string;
  cancellationPolicy?: string;
  defaultCurrency?: string;
  timeZone?: string;
  bookingIntervalMinutes?: number;
  maxAdvanceBookingDays?: number;
}

export const superAdminApi = {
  // ── Tenants ──────────────────────────────────────────────────
  async getTenants(page = 1, pageSize = 20) {
    const { data } = await api.get('/superadmin/tenants', { params: { page, pageSize } });
    return data as { items: TenantListItem[]; totalCount: number; page: number; pageSize: number };
  },

  async getTenant(id: string) {
    const { data } = await api.get(`/superadmin/tenants/${id}`);
    return data;
  },

  async createTenant(payload: CreateTenantPayload) {
    const { data } = await api.post('/superadmin/tenants', payload);
    return data as { id: string; name: string; slug: string; trialEndsAt: string };
  },

  async updateTenant(id: string, payload: { name?: string; industryType?: string }) {
    await api.put(`/superadmin/tenants/${id}`, payload);
  },

  async activateTenant(id: string) {
    await api.patch(`/superadmin/tenants/${id}/activate`);
  },

  async deactivateTenant(id: string) {
    await api.patch(`/superadmin/tenants/${id}/deactivate`);
  },

  // ── Settings / Branding ──────────────────────────────────────
  async updateSettings(id: string, payload: UpdateTenantSettingsPayload) {
    await api.put(`/superadmin/tenants/${id}/settings`, payload);
  },

  async uploadLogo(id: string, file: File) {
    const form = new FormData();
    form.append('logo', file);
    const { data } = await api.post(`/superadmin/tenants/${id}/logo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data as { logoUrl: string };
  },

  // ── Users ────────────────────────────────────────────────────
  async createUser(tenantId: string, payload: {
    email: string; password: string; firstName: string; lastName: string;
  }) {
    const { data } = await api.post(`/superadmin/tenants/${tenantId}/users`, payload);
    return data;
  },

  // ── Trial ────────────────────────────────────────────────────
  async extendTrial(tenantId: string, days: number) {
    const { data } = await api.post(`/superadmin/tenants/${tenantId}/trial/extend`, { days });
    return data as { trialEndsAt: string; trialDaysRemaining: number };
  },

  // ── Stats ────────────────────────────────────────────────────
  async getStats() {
    const { data } = await api.get('/superadmin/stats');
    return data as {
      totalTenants: number;
      activeTenants: number;
      trialTenants: number;
      activeSubscriptions: number;
      expiredTenants: number;
      totalBookings: number;
    };
  },
};

// ── SuperAdmin Login (uses separate secret) ───────────────────
export async function superAdminLogin(email: string, password: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error('NEXT_PUBLIC_API_URL is not configured');

  const res = await fetch(`${apiUrl}/auth/superadmin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Login failed');
  }

  return res.json() as Promise<{ token: string; user: { id: string; email: string; firstName: string; lastName: string; role: string } }>;
}

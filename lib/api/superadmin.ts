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
  primaryColor?: string;
  employeeCount?: number;
  bookingCount?: number;
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
  adminFirstName?: string;
  adminLastName?: string;
  sendWelcomeEmail?: boolean;
  plan?: string;
  personalNote?: string;
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
    return data as { id: string; name: string; slug: string; status: string; activationExpiresAt: string };
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

  async deleteTenant(id: string) {
    await api.delete(`/superadmin/tenants/${id}`);
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

  // ── Trial & Plan ─────────────────────────────────────────────
  async extendTrial(tenantId: string, days: number) {
    const { data } = await api.post(`/superadmin/tenants/${tenantId}/trial/extend`, { days });
    return data as { trialEndsAt: string; trialDaysRemaining: number };
  },

  async activatePreparedTrial(tenantId: string) {
    const { data } = await api.post(`/superadmin/tenants/${tenantId}/trial/activate`);
    return data as { status: string; trialStartedAt: string; trialEndsAt: string; activatedByUserId?: string; sentTo: string };
  },

  async changePlan(tenantId: string, plan: string, options?: {
    interval?: string;
    negotiatedMonthlyPrice?: number;
    negotiatedAnnualPrice?: number;
  }) {
    const { data } = await api.patch(`/superadmin/tenants/${tenantId}/plan`, {
      plan,
      interval: options?.interval,
      negotiatedMonthlyPrice: options?.negotiatedMonthlyPrice,
      negotiatedAnnualPrice: options?.negotiatedAnnualPrice,
    });
    return data as { plan: string; status: string; displayName: string; maxEmployees: number; maxServices: number };
  },

  async resendWelcomeEmail(tenantId: string) {
    const { data } = await api.post(`/superadmin/tenants/${tenantId}/resend-welcome`);
    return data as { sent: boolean; sentTo: string };
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
      mrr: number;
      planDistribution: { plan: string; count: number; monthlyPrice: number }[];
    };
  },

  // ── Email Logs ───────────────────────────────────────────────
  async getEmailLogs(params?: { tenantId?: string; status?: string; emailType?: string; page?: number; pageSize?: number }) {
    const { data } = await api.get('/superadmin/email-logs', { params });
    return data as {
      items: EmailLogItem[];
      totalCount: number;
      page: number;
      pageSize: number;
      sentCount: number;
      failedCount: number;
    };
  },

  // ── Tenant Stats ─────────────────────────────────────────────
  async getTenantStats(id: string) {
    const { data } = await api.get(`/superadmin/tenants/${id}/stats`);
    return data as TenantStats;
  },

  // ── Eigene Domain ────────────────────────────────────────────
  async getTenantDomain(id: string) {
    const { data } = await api.get(`/superadmin/tenants/${id}/domain`);
    return data as { domain: string | null; status: string; requestedAt: string | null };
  },

  async setTenantDomainStatus(id: string, status: 'PendingVerification' | 'Verified' | 'Failed') {
    const { data } = await api.post(`/superadmin/tenants/${id}/domain/status`, { status });
    return data as { domain: string | null; status: string };
  },

  // ── Impersonate ──────────────────────────────────────────────
  async impersonate(tenantId: string): Promise<{
    access_token: string;
    tenant_slug: string;
    tenant_name: string;
    user_email: string;
    user_id: string;
  }> {
    const { data } = await api.post(`/superadmin/tenants/${tenantId}/impersonate`);
    return data;
  },

  // ── Activity Feed ────────────────────────────────────────────
  async getActivity(limit = 30) {
    const { data } = await api.get('/superadmin/activity', { params: { limit } });
    return data as ActivityItem[];
  },

  // ── Platform Overview (charts + health) ──────────────────────
  async getOverview() {
    const { data } = await api.get('/superadmin/overview');
    return data as OverviewData;
  },

  // ── AI usage/cost (last 30 days, per tenant) ──────────────────
  async getAiUsage() {
    const { data } = await api.get('/superadmin/ai-usage');
    return data as {
      since: string;
      totalCostLast30Days: number;
      tenants: {
        tenantId: string;
        tenantName: string;
        totalCost: number;
        totalCalls: number;
        inputTokens: number;
        outputTokens: number;
      }[];
    };
  },

  // ── Subscription Requests ────────────────────────────────────
  async getSubscriptionRequests(status?: string) {
    const { data } = await api.get('/superadmin/subscription-requests', { params: status ? { status } : {} });
    return data as { data: SubscriptionRequestItem[]; pendingCount: number };
  },

  async activateSubscriptionRequest(id: string, options?: {
    confirmOverrideMollie?: boolean;
    negotiatedMonthlyPrice?: number;
    negotiatedAnnualPrice?: number;
  }) {
    const { data } = await api.post(`/superadmin/subscription-requests/${id}/activate`, {
      confirmOverrideMollie: options?.confirmOverrideMollie ?? false,
      negotiatedMonthlyPrice: options?.negotiatedMonthlyPrice,
      negotiatedAnnualPrice: options?.negotiatedAnnualPrice,
    });
    return data as { message: string };
  },

  async sendAgencyOffer(id: string, monthlyPrice: number, annualPrice: number, validForDays = 14, note?: string) {
    const { data } = await api.post(`/superadmin/subscription-requests/${id}/offer`, {
      monthlyPrice, annualPrice, validForDays, note,
    });
    return data as { message: string };
  },

  async declineSubscriptionRequest(id: string) {
    const { data } = await api.post(`/superadmin/subscription-requests/${id}/decline`);
    return data as { message: string };
  },

  // ── Plan Pricing ─────────────────────────────────────────────
  async getPlanPricing() {
    const { data } = await api.get('/superadmin/plan-pricing');
    return data as PlanPriceItem[];
  },

  async updatePlanPricing(plan: string, monthlyPrice: number, annualPrice: number) {
    const { data } = await api.put(`/superadmin/plan-pricing/${plan}`, { monthlyPrice, annualPrice });
    return data as { plan: string; monthlyPrice: number; annualPrice: number };
  },

  // ── Audit Log ────────────────────────────────────────────────
  async getAuditLog(params?: { page?: number; pageSize?: number; tenantId?: string; action?: string }) {
    const { data } = await api.get('/superadmin/audit-log', { params });
    return data as { items: AuditLogItem[]; totalCount: number; page: number; pageSize: number };
  },

  // ── At-risk subscriptions (cancelling / dunning) ────────────
  async getAtRiskSubscriptions() {
    const { data } = await api.get('/superadmin/at-risk-subscriptions');
    return data as {
      cancelling: AtRiskCancellingItem[];
      dunning: AtRiskDunningItem[];
      totalAtRisk: number;
    };
  },

  // ── Invoices ─────────────────────────────────────────────────
  async getInvoices(params?: { tenantId?: string; page?: number; pageSize?: number }) {
    const { data } = await api.get('/superadmin/invoices', { params });
    return data as {
      items: InvoiceItem[];
      totalCount: number;
      page: number;
      pageSize: number;
      totalAmount: number;
    };
  },

  invoicePdfUrl(id: string) {
    return `${process.env.NEXT_PUBLIC_API_URL}/superadmin/invoices/${id}/pdf`;
  },

  async resendInvoice(id: string) {
    const { data } = await api.post(`/superadmin/invoices/${id}/resend`);
    return data as { message: string };
  },
};

// ── Extra Types ───────────────────────────────────────────────────────────────

export interface SubscriptionRequestItem {
  id: string;
  requestedPlan: string;
  contactEmail: string;
  status: string;
  note?: string;
  interval?: 'Monthly' | 'Yearly';
  offeredMonthlyPrice?: number;
  offeredAnnualPrice?: number;
  offeredAt?: string;
  offerExpiresAt?: string;
  acceptedInterval?: 'Monthly' | 'Yearly';
  acceptedPrice?: number;
  acceptedAt?: string;
  acceptedByEmail?: string;
  createdAt: string;
  processedAt?: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

export interface AuditLogItem {
  id: string;
  tenantId?: string;
  actorType: string;
  actorName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AtRiskCancellingItem {
  tenantId: string;
  companyName: string;
  tenantSlug: string;
  plan: string;
  cancelRequestedAt: string;
  cancelReason?: string;
  currentPeriodEnd?: string;
}

export interface AtRiskDunningItem {
  tenantId: string;
  companyName: string;
  tenantSlug: string;
  plan: string;
  pastDueSince: string;
  failedPaymentCount: number;
  dunningWarningEmailSent: boolean;
  daysUntilAutoCancel: number;
}

export interface PlanPriceItem {
  plan: string;
  displayName: string;
  monthlyPrice: number;
  annualPrice: number;
  maxEmployees: number;
  maxServices: number;
}

export interface InvoiceItem {
  id: string;
  tenantId: string;
  companyName: string;
  tenantSlug: string;
  invoiceNumber: string;
  issueDate: string;
  periodStart: string;
  periodEnd: string;
  planName: string;
  amount: number;
  currency: string;
  molliePaymentId: string;
  emailSent: boolean;
  emailSentAt?: string;
}

export interface EmailLogItem {
  id: string;
  tenantId: string;
  companyName: string;
  tenantSlug: string;
  recipientEmail: string;
  subject: string;
  emailType: string;
  status: string;
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface TenantStats {
  monthlyStats: { year: number; month: number; label: string; bookings: number; revenue: number }[];
  totalBookings: number;
  totalRevenue: number;
  totalCustomers: number;
  totalEmployees: number;
  confirmedCount: number;
  cancelledCount: number;
  completedCount: number;
}

export interface ActivityItem {
  type: string;
  icon: string;
  title: string;
  detail: string;
  tenantId?: string;
  timestamp: string;
}

export interface OverviewData {
  monthlyData: Array<{
    year: number; month: number; label: string;
    bookings: number; confirmed: number; cancelled: number; newTenants: number;
  }>;
  emailStats: { sent: number; failed: number; pending: number };
  topTenants: Array<{ tenantId: string; companyName: string; slug: string; bookingCount: number }>;
}

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

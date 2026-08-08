// lib/api/admin.ts
import api from './client';

export const adminApi = {
  getDashboard,
  getStatistics,
  getBookings,
  updateBookingStatus,
  deleteBooking,
  createManualBooking,
  getServices,
  getAvailability,
  getBlockedSlots,
  createBlockedSlot,
  createBlockedDateRange,
  updateBlockedSlot,
  deleteBlockedSlot,
  getTrackingStatistics,
  getRevenueStatistics,
  trackLinkClick,
  getServicesByEmployee,

  async requestPlan(plan: string, contactEmail?: string, note?: string, interval: 'Monthly' | 'Yearly' = 'Monthly') {
    const { data } = await api.post('/tenant/subscription-request', {
      plan, contactEmail: contactEmail ?? '', note, interval,
      businessConfirmed: true, termsAccepted: true, billingTermsAccepted: true,
    });
    return data as { message: string; requestId: string };
  },

  async getSubscriptionRequestStatus() {
    const { data } = await api.get('/tenant/subscription-request/status');
    return data as {
      hasPendingRequest: boolean;
      request: {
        id: string;
        requestedPlan: string;
        status: string;
        createdAt: string;
        processedAt?: string;
      } | null;
    };
  },

  async startMollieMandateFlow(plan: string, interval: 'Monthly' | 'Yearly' = 'Monthly') {
    const { data } = await api.post('/tenant/subscription/mollie/start', {
      plan, interval, businessConfirmed: true, termsAccepted: true, billingTermsAccepted: true,
    });
    return data as { checkoutUrl: string };
  },

  async getMollieStatus() {
    const { data } = await api.get('/tenant/subscription/mollie/status');
    return data as { isLiveMode: boolean; plan: string; status: string; hasMollieSubscription: boolean };
  },

  async changeSubscriptionPlan(plan: string, interval: 'Monthly' | 'Yearly') {
    const { data } = await api.post('/tenant/subscription/change-plan', { plan, interval });
    return data as { message: string; plan?: string; interval?: string };
  },

  async getPlanPricing() {
    const { data } = await api.get('/tenant/plan-pricing');
    return data as { plan: string; displayName: string; monthlyPrice: number; annualPrice: number; maxEmployees: number; maxServices: number }[];
  },

  async cancelSubscription(reason?: string) {
    const { data } = await api.post('/tenant/subscription/cancel', { reason: reason ?? null });
    return data as { cancelRequestedAt: string; currentPeriodEnd: string | null; message: string };
  },

  async getApiKeys() {
    const { data } = await api.get('/tenant/api-keys');
    return data as ApiKeySummary[];
  },

  async createApiKey(name: string) {
    const { data } = await api.post('/tenant/api-keys', { name });
    return data as { id: string; name: string; rawKey: string; keyPrefix: string; createdAt: string };
  },

  async revokeApiKey(id: string) {
    const { data } = await api.delete(`/tenant/api-keys/${id}`);
    return data as { message: string };
  },

  async getInvoices(page = 1, pageSize = 50) {
    const { data } = await api.get('/tenant/invoices', { params: { page, pageSize } });
    return data as { items: TenantInvoiceItem[]; totalCount: number; page: number; pageSize: number };
  },

  invoicePdfUrl(id: string) {
    return `${process.env.NEXT_PUBLIC_API_URL}/tenant/invoices/${id}/pdf`;
  },

  async getDomain() {
    const { data } = await api.get('/tenant/domain');
    return data as TenantDomainInfo;
  },

  async updateDomain(domain: string) {
    const { data } = await api.put('/tenant/domain', { domain });
    return data as TenantDomainInfo;
  },

  async removeDomain() {
    const { data } = await api.delete('/tenant/domain');
    return data as { message: string };
  },

  async getDigestFrequency() {
    const { data } = await api.get('/tenant/digest');
    return data as { frequency: 'None' | 'Daily' | 'Weekly' };
  },

  async updateDigestFrequency(frequency: 'None' | 'Daily' | 'Weekly') {
    const { data } = await api.put('/tenant/digest', { frequency });
    return data as { frequency: 'None' | 'Daily' | 'Weekly' };
  },

  async getLoyaltySettings() {
    const { data } = await api.get('/tenant/loyalty');
    return data as LoyaltySettings;
  },

  async updateLoyaltySettings(settings: LoyaltySettings) {
    const { data } = await api.put('/tenant/loyalty', {
      pointsPerBooking: settings.pointsPerBooking,
      rewardEveryNVisits: settings.rewardEveryNVisits,
      rewardType: settings.rewardType,
      rewardValue: settings.rewardValue,
    });
    return data as LoyaltySettings;
  },

  async getCustomerLoyalty(customerId: string) {
    const { data } = await api.get(`/customers/${customerId}/loyalty`);
    return data as { points: number; history: LoyaltyTransaction[] };
  },

  async adjustCustomerLoyalty(customerId: string, points: number, reason?: string) {
    const { data } = await api.post(`/customers/${customerId}/loyalty/adjust`, { points, reason });
    return data as { points: number };
  },

  async getVouchers(search?: string) {
    const { data } = await api.get('/admin/vouchers', { params: search ? { search } : undefined });
    return data as AdminVoucher[];
  },

  async issueVoucher(dto: { type: 'MonetaryValue' | 'SessionPackage' | 'PercentageDiscount'; customerId?: string | null; amount?: number | null; sessions?: number | null; percentageValue?: number | null; expiresAt?: string | null; note?: string | null }) {
    const { data } = await api.post('/admin/vouchers', dto);
    return data as AdminVoucher;
  },

  async cancelVoucher(id: string) {
    const { data } = await api.post(`/admin/vouchers/${id}/cancel`);
    return data as { message: string };
  },

  async getIntakeFormFields() {
    const { data } = await api.get('/admin/intake-form/fields');
    return data as IntakeFormField[];
  },

  async createIntakeFormField(field: IntakeFormFieldRequest) {
    const { data } = await api.post('/admin/intake-form/fields', field);
    return data as IntakeFormField;
  },

  async updateIntakeFormField(id: string, field: IntakeFormFieldRequest) {
    const { data } = await api.put(`/admin/intake-form/fields/${id}`, field);
    return data as IntakeFormField;
  },

  async deleteIntakeFormField(id: string) {
    await api.delete(`/admin/intake-form/fields/${id}`);
  },

  async reorderIntakeFormFields(orderedIds: string[]) {
    await api.patch('/admin/intake-form/fields/reorder', orderedIds);
  },

  async getIntakeFormTemplates() {
    const { data } = await api.get('/admin/intake-form/fields/templates');
    return data as { key: string; label: string; fieldCount: number }[];
  },

  async applyIntakeFormTemplate(key: string, categoryId?: string | null) {
    const { data } = await api.post(`/admin/intake-form/fields/templates/${key}/apply`, null, {
      params: categoryId ? { categoryId } : undefined,
    });
    return data as IntakeFormField[];
  },

  async getIntakeFormResponseForBooking(bookingId: string) {
    const { data } = await api.get(`/admin/intake-form/responses/by-booking/${bookingId}`);
    return data as { hasResponse: boolean; submittedAt?: string; answers?: { label: string; value: string }[] };
  },

  async getReviews() {
    const { data } = await api.get('/admin/reviews');
    return data as AdminReview[];
  },

  async setReviewPublished(id: string, isPublished: boolean) {
    const { data } = await api.put(`/admin/reviews/${id}/publish`, { isPublished });
    return data as { id: string; isPublished: boolean };
  },
};

export interface TenantDomainInfo {
  domain: string | null;
  status: 'None' | 'PendingVerification' | 'Verified' | 'Failed';
  requestedAt: string | null;
}

export interface AdminVoucher {
  id: string;
  code: string;
  type: 'MonetaryValue' | 'SessionPackage' | 'PercentageDiscount';
  status: 'Active' | 'Redeemed' | 'Expired' | 'Cancelled';
  initialAmount: number | null;
  remainingAmount: number | null;
  initialSessions: number | null;
  remainingSessions: number | null;
  percentageValue: number | null;
  expiresAt: string | null;
  issuedAt: string;
  note: string | null;
  customerName: string | null;
}

export type IntakeFormFieldType = 'Text' | 'Textarea' | 'YesNo' | 'MultipleChoice' | 'Checkboxes' | 'Date';
export type IntakeFormType = 'Anamnese' | 'Einverstaendnis' | 'Fragebogen' | 'Nachsorge';

export interface IntakeFormField {
  id: string;
  label: string;
  fieldType: IntakeFormFieldType;
  formType: IntakeFormType;
  optionsJson: string | null;
  categoryId: string | null;
  categoryName?: string | null;
  conditionalOnFieldId: string | null;
  conditionalOnValue: string | null;
  isRequired: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface IntakeFormFieldRequest {
  label: string;
  fieldType: string;
  formType?: string;
  optionsJson?: string | null;
  categoryId?: string | null;
  conditionalOnFieldId?: string | null;
  conditionalOnValue?: string | null;
  isRequired: boolean;
  isActive?: boolean;
}

export interface LoyaltySettings {
  pointsPerBooking: number;
  rewardEveryNVisits: number;
  rewardType: 'MonetaryValue' | 'PercentageDiscount' | 'SessionPackage';
  rewardValue: number | null;
}

export interface LoyaltyTransaction {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
}

export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  isPublished: boolean;
  createdAt: string;
  serviceName: string;
  customerName: string;
}

export interface ApiKeySummary {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface TenantInvoiceItem {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  periodStart: string;
  periodEnd: string;
  planName: string;
  amount: number;
  currency: string;
  emailSent: boolean;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardOverview {
  today: TodayOverview;
  nextBooking: UpcomingBooking | null;
  statistics: DashboardStatistics;
}

export interface TodayOverview {
  date: string;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  bookings: BookingListItem[];
}

export interface UpcomingBooking {
  id: string;
  bookingNumber: string;
  serviceName: string;
  customerName: string;
  date: string;
  startTime: string;
  endTime: string;
  minutesUntil: number;
}

export interface DashboardStatistics {
  totalBookingsThisMonth: number;
  totalBookingsLastMonth: number;
  revenueThisMonthCHF: number;
  revenueLastMonthCHF: number;
  revenueThisMonthEUR: number;
  revenueLastMonthEUR: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  popularServices: PopularService[];
  revenueThisMonthByCurrency: Record<string, number>;
  revenueLastMonthByCurrency: Record<string, number>;
}

export interface PopularService {
  serviceName: string;
  bookingCount: number;
  revenueCHF: number;
  revenueEUR: number;
}
export interface BookingListItem {
  id: string;
  bookingNumber: string;
  status: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  price: number;
  currency: string;
  customerNotes: string | null;
  createdAt: string;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BookingFilter {
  status?: string;
  fromDate?: string;
  toDate?: string;
  serviceId?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  all?: boolean;
  employeeId?: string;
}

export interface UpdateBookingStatus {
  status: string;
  adminNotes?: string;
}

export interface BlockedTimeSlot {
  id: string;
  blockDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
  createdAt: string;
  employeeId?: string | null;
}

export interface CreateBlockedSlot {
  blockDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface CreateBlockedDateRange {
  fromDate: string;
  toDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface UpdateBlockedSlot {
  blockDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationMinutes: number;
  bufferTimeMinutes: number;
  isActive: boolean;
}

export interface CreateManualBookingDto {
  serviceId: string;
  bookingDate: string;
  startTime: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  employeeId?: string | null;
  customerNotes: string | null;
  voucherCode?: string | null;
}

export interface ManualBookingResponse {
  id: string;
  bookingNumber: string;
  status: string;
  confirmationSent: boolean;
  booking: {
    serviceId: string;
    serviceName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    price: number;
    currency: string;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  employee?: {
    id: string;
    name: string;
    role: string;
    specialty: string | null;
  } | null;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface AvailabilityResponse {
  date: string;
  serviceId: string;
  serviceDuration: number;
  availableSlots: TimeSlot[];
}

export interface SimplifiedTrackingStatistics {
  totalBookings: number;
  totalPageViews: number;
  totalLinkClicks: number;
  totalRevenueCHF: number;
  totalRevenueEUR: number;
  averageBookingValueCHF: number;
  averageBookingValueEUR: number;
  totalRevenueByCurrency: Record<string, number>;
  averageBookingValueByCurrency: Record<string, number>;
  linkClicks: LinkClickStatistic[];
}


export interface LinkClickStatistic {
  linkName: string;
  clickCount: number;
  percentage: number;
}

export interface RevenueStatistics {
  todayRevenueCHF: number;
  todayRevenueEUR: number;
  weekRevenueCHF: number;
  weekRevenueEUR: number;
  monthRevenueCHF: number;
  monthRevenueEUR: number;
  todayBookings: number;
  weekBookings: number;
  monthBookings: number;
  allTimeRevenueCHF: number;
  allTimeRevenueEUR: number;
  todayRevenueByCurrency: Record<string, number>;
  weekRevenueByCurrency: Record<string, number>;
  monthRevenueByCurrency: Record<string, number>;
  allTimeRevenueByCurrency: Record<string, number>;
  allTimeBookings: number;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboard(all: boolean = false): Promise<DashboardOverview> {
  const params = new URLSearchParams();
  if (all) params.append("all", "true");
  
  const response = await api.get(`/admin/dashboard${params.toString() ? `?${params}` : ''}`);
  return response.data;
}

export async function getStatistics(all: boolean = false): Promise<DashboardStatistics> {
  const params = new URLSearchParams();
  if (all) params.append("all", "true");

  const response = await api.get(`/admin/statistics${params.toString() ? `?${params}` : ''}`);
  return response.data;
}

export interface OnboardingStatus {
  hasLogo: boolean;
  hasCompany: boolean;
  hasServices: boolean;
  hasEmployees: boolean;
  hasHours: boolean;
  hasBooking: boolean;
  isComplete: boolean;
  completedSteps: number;
  totalSteps: number;
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const response = await api.get('/admin/onboarding');
  return response.data;
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export async function getBookings(
  filter: BookingFilter = {}
): Promise<PagedResponse<BookingListItem>> {
  const params = new URLSearchParams();
  if (filter.status) params.append("status", filter.status);
  if (filter.fromDate) params.append("fromDate", filter.fromDate);
  if (filter.toDate) params.append("toDate", filter.toDate);
  if (filter.serviceId) params.append("serviceId", filter.serviceId);
  if (filter.searchTerm) params.append("searchTerm", filter.searchTerm);
  if (filter.page) params.append("page", filter.page.toString());
  if (filter.pageSize) params.append("pageSize", filter.pageSize.toString());
  if (filter.all) params.append("all", "true");
  if (filter.employeeId) params.append("employeeId", filter.employeeId);

  const response = await api.get(`/admin/bookings?${params}`);
  return response.data;
}

export async function updateBookingStatus(
  bookingId: string,
  data: UpdateBookingStatus
): Promise<BookingListItem> {
  const response = await api.patch(`/admin/bookings/${bookingId}/status`, data);
  return response.data;
}

export async function deleteBooking(
  bookingId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`/admin/bookings/${bookingId}`, {
    data: { reason: reason || "Manuell gelöscht" }
  });
  return response.data;
}

export async function resendConfirmation(
  bookingId: string
): Promise<{ message: string }> {
  const response = await api.post(`/admin/bookings/${bookingId}/resend-confirmation`);
  return response.data;
}

// ── Manual booking ────────────────────────────────────────────────────────────

export async function createManualBooking(
  data: CreateManualBookingDto
): Promise<ManualBookingResponse> {
  const response = await api.post('/admin/manual/booking', {
    ...data,
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    customerNotes: data.customerNotes?.trim() || null,
    employeeId: data.employeeId || null,
    voucherCode: data.voucherCode?.trim() || null,
  });
  return response.data;
}

export async function getServicesByEmployee(employeeId: string): Promise<Service[]> {
  const response = await api.get(`/admin/services/employees/${employeeId}/services`);
  return response.data;
}


export async function checkEmailConflict(
  email: string,
  firstName: string,
  lastName: string,
  employeeId?: string
): Promise<{ hasConflict: boolean; existingName?: string; existingEmail?: string }> {
  const params = new URLSearchParams({
    email: email.trim(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
  });
  
  if (employeeId) params.append("employeeId", employeeId);

  const response = await api.get(`/admin/manual/booking/check-email?${params.toString()}`);
  return response.data;
}


// ── Services & Availability ───────────────────────────────────────────────────

export async function getServices(): Promise<Service[]> {
  const response = await api.get('/services');
  return response.data;
}

export async function getAvailability(
  serviceId: string,
  date: string
): Promise<AvailabilityResponse> {
  const response = await api.get(`/availability/${serviceId}?date=${date}`);
  return response.data;
}

// ── Blocked time slots ────────────────────────────────────────────────────────

export async function getBlockedSlots(
  fromDate?: string,
  toDate?: string,
  all: boolean = false
): Promise<BlockedTimeSlot[]> {
  const params = new URLSearchParams();
  if (fromDate) params.append("startDate", fromDate);
  if (toDate) params.append("endDate", toDate);
  if (all) params.append("all", "true");

  const response = await api.get(`/BlockedTimeSlots?${params}`);
  return response.data;
}

export async function createBlockedSlot(
  data: CreateBlockedSlot
): Promise<BlockedTimeSlot> {
  const response = await api.post('/BlockedTimeSlots', data);
  return response.data;
}

export async function createBlockedDateRange(
  data: CreateBlockedDateRange
): Promise<BlockedTimeSlot[]> {
  const response = await api.post('/BlockedTimeSlots/range', data);
  return response.data;
}

export async function updateBlockedSlot(
  id: string,
  data: UpdateBlockedSlot
): Promise<BlockedTimeSlot> {
  const response = await api.put(`/BlockedTimeSlots/${id}`, data);
  return response.data;
}

export async function deleteBlockedSlot(id: string): Promise<void> {
  await api.delete(`/BlockedTimeSlots/${id}`);
}

// ── Tracking ──────────────────────────────────────────────────────────────────

export async function getTrackingStatistics(
  fromDate?: string,
  toDate?: string,
  all: boolean = false
): Promise<SimplifiedTrackingStatistics> {
  const params = new URLSearchParams();
  if (fromDate) params.append("fromDate", fromDate);
  if (toDate) params.append("toDate", toDate);
  if (all) params.append("all", "true");

  const response = await api.get(`/admin/tracking${params.toString() ? `?${params}` : ''}`);
  return response.data;
}

export async function getRevenueStatistics(
  all: boolean = false
): Promise<RevenueStatistics> {
  const params = new URLSearchParams();
  if (all) params.append("all", "true");
  
  const response = await api.get(`/admin/tracking/revenue${params.toString() ? `?${params}` : ''}`);
  return response.data;
}

export async function trackLinkClick(data: {
  linkName: string;
  linkUrl: string;
  sessionId?: string;
}): Promise<void> {
  await api.post('/admin/tracking/click', data).catch(() => {});
}

export function getBookingsExportUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  return `${base}/bookings/export/csv`;
}

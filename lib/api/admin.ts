// lib/api/admin.ts
import { get } from 'http';
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
};

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

export async function getBookingsExportUrl(filter: Pick<BookingFilter, 'status' | 'fromDate' | 'toDate'>): Promise<string> {
  const params = new URLSearchParams();
  if (filter.status) params.append('status', filter.status);
  if (filter.fromDate) params.append('fromDate', filter.fromDate);
  if (filter.toDate) params.append('toDate', filter.toDate);
  // Return the full URL; caller will use axios with responseType: 'blob'
  return `/admin/bookings/export?${params}`;
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
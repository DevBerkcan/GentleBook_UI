// lib/api/booking.ts
// Public-facing booking API.
// credentials: "include" is set on all calls so the JWT cookie is forwarded
// when the user is authenticated (e.g. an employee using the admin UI).
// Anonymous callers simply have no cookie and the server treats them as guests.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not configured');
}

  export const bookingApi = {
  getEmployees,
  getServiceCategories,
  getServicesByCategory,
  getServices,
  getAvailability,
  createBooking,
  getBookingsByEmail,
  cancelBooking,
  getEmployeesByService,
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  displayOrder: number;
  currency: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  services: Service[];
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

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  specialty: string | null;
  isActive: boolean;
  location?: string | null;
}

export interface CreateBookingRequest {
  serviceId: string;
  bookingDate: string;
  startTime: string;
  customer: CustomerInfo;
  customerNotes?: string;
  employeeId?: string | null;
}

export interface BookingResponse {
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
    email: string | null;
  };
  employee?: {
    id: string;
    name: string;
    role: string;
    specialty: string | null;
  } | null;
}

/**
 * Get employees by service ID - only returns employees that can perform this service
 */
export async function getEmployeesByService(serviceId: string, tenantSlug?: string): Promise<Employee[]> {
  let url = `${API_BASE_URL}/employees/by-service/${serviceId}?activeOnly=true`;
  if (tenantSlug) url += `&tenantSlug=${tenantSlug}`;
  const res = await fetch(url, {
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Fehler beim Laden der Mitarbeiter für diesen Service");
  }
  return res.json();
}

// ── Employees ─────────────────────────────────────────────────────────────────

/**
 * Fetch active employees for the booking widget.
 * The /employees endpoint is [AllowAnonymous] for public use.
 * credentials:include so the JWT cookie is forwarded when present.
 */
export async function getEmployees(tenantSlug?: string): Promise<Employee[]> {
  const url = tenantSlug
    ? `${API_BASE_URL}/employees?activeOnly=true&tenantSlug=${tenantSlug}`
    : `${API_BASE_URL}/employees?activeOnly=true`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Fehler beim Laden der Mitarbeiter");
  return res.json();
}

// ── Services ──────────────────────────────────────────────────────────────────

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const res = await fetch(`${API_BASE_URL}/services/categories`);
  if (!res.ok) throw new Error("Fehler beim Laden der Kategorien");
  return res.json();
}

export async function getServicesByCategory(
  categoryId: string
): Promise<Service[]> {
  const res = await fetch(`${API_BASE_URL}/services/services/${categoryId}`);
  if (!res.ok)
    throw new Error("Fehler beim Laden der Services für diese Kategorie");
  return res.json();
}

export async function getServices(tenantSlug?: string): Promise<Service[]> {
  const url = tenantSlug
    ? `${API_BASE_URL}/services?tenantSlug=${tenantSlug}`
    : `${API_BASE_URL}/services`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fehler beim Laden der Services");
  return res.json();
}

export async function getTenantInfo(tenantSlug: string): Promise<{
  name: string; companyName?: string; primaryColor?: string; tagline?: string; welcomeMessage?: string; logoUrl?: string;
}> {
  const res = await fetch(`${API_BASE_URL}/booking/${tenantSlug}/info`);
  if (!res.ok) return { name: tenantSlug };
  return res.json();
}

export interface TenantLink {
  id: string;
  title: string;
  url: string;
  iconType: string;
  displayOrder: number;
}

export async function getTenantLinks(tenantSlug: string): Promise<TenantLink[]> {
  const res = await fetch(`${API_BASE_URL}/booking/${tenantSlug}/links`);
  if (!res.ok) return [];
  return res.json();
}

// lib/api/booking.ts - Update getAvailability

export async function getAvailability(
  serviceId: string,
  date: string,
  employeeId?: string,
  tenantSlug?: string,
): Promise<AvailabilityResponse> {
  let url = `${API_BASE_URL}/availability/${serviceId}?date=${date}`;
  if (employeeId) url += `&employeeId=${employeeId}`;
  if (tenantSlug) url += `&tenantSlug=${tenantSlug}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fehler beim Laden der Verfügbarkeit");
  return res.json();
}

// ── Bookings ──────────────────────────────────────────────────────────────────

/**
 * Create a booking.
 * credentials:include forwards the JWT cookie so the backend can
 * auto-assign the authenticated employee when no employeeId is specified.
 */
export async function createBooking(
  data: CreateBookingRequest,
  tenantSlug?: string,
): Promise<BookingResponse> {
  const url = tenantSlug
    ? `${API_BASE_URL}/bookings?tenantSlug=${tenantSlug}`
    : `${API_BASE_URL}/bookings`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Fehler beim Buchen");
  }
  return res.json();
}

export async function getBookingsByEmail(
  email: string
): Promise<BookingResponse[]> {
  const res = await fetch(
    `${API_BASE_URL}/bookings/by-email/${encodeURIComponent(email)}`
  );
  if (!res.ok) throw new Error("Fehler beim Laden der Buchungen");
  return res.json();
}

export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reason: reason || "Vom Kunden storniert",
      notifyCustomer: true,
    }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Fehler beim Stornieren");
  }
  return res.json();
}
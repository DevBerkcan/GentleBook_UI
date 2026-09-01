"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

import { ServiceSelector } from "@/components/booking/ServiceSelector";
import { EmployeeSelector } from "@/components/booking/EmployeeSelector";
import { LocationSelector } from "@/components/booking/LocationSelector";
import { DateTimePicker } from "@/components/booking/DateTimePicker";
import { ContactForm } from "@/components/booking/ContactForm";
import { WaitlistPanel } from "@/components/booking/WaitlistPanel";

import {
  getServices,
  getLocations,
  getAvailability,
  createBooking,
  type Service,
  type TimeSlot,
  type CustomerInfo,
  type Employee,
  type Location,
} from "@/lib/api/booking";
import { BookingEvents } from "@/lib/tracking";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageContext";
import { getPublicFinderBootstrap } from "@/lib/api/ai-finder";

const FONT_QUERY: Record<string, string> = {
  playfair:   "Playfair+Display:wght@400;600;700",
  montserrat: "Montserrat:wght@400;600;700",
  "dm-serif": "DM+Serif+Display",
  josefin:    "Josefin+Sans:wght@400;600;700",
};
const FONT_FAMILY: Record<string, string> = {
  inter:      "Inter, sans-serif",
  playfair:   "'Playfair Display', serif",
  montserrat: "'Montserrat', sans-serif",
  "dm-serif": "'DM Serif Display', serif",
  josefin:    "'Josefin Sans', sans-serif",
};

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}
function lighten(hex: string, amount = 0.85) {
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${Math.round(r+(255-r)*amount)},${Math.round(g+(255-g)*amount)},${Math.round(b+(255-b)*amount)})`;
  } catch { return "#F6F5FA"; }
}
function getBorderRadius(style?: string) {
  if (style === "pill")   return "9999px";
  if (style === "square") return "4px";
  return "16px";
}

export default function TenantBookingPage() {
  return (
    <LanguageProvider>
      <BookingPageInner />
    </LanguageProvider>
  );
}

function BookingPageInner() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { lang, setLang, t } = useTranslation();
  const [waitlistToken, setWaitlistToken] = useState<string | undefined>();
  const [currentStep, setCurrentStep] = useState(1);
  const [tenantName, setTenantName] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState<string>('#6355E4');
  const [tenantAddress, setTenantAddress] = useState<string | null>(null);
  const [fontFamily, setFontFamily] = useState<string>('inter');
  const [buttonStyle, setButtonStyle] = useState<string>('rounded');
  const [bookingTheme, setBookingTheme] = useState<string>('light');
  const [serviceLayout, setServiceLayout] = useState<string>('list');
  const [showPrices, setShowPrices] = useState<boolean>(true);

  const [services, setServices] = useState<Service[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationsLoaded, setLocationsLoaded] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [noSlotsMessage, setNoSlotsMessage] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: "", lastName: "", email: "", phone: "",
  });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [finderEnabled, setFinderEnabled] = useState(false);

  useEffect(() => {
    setWaitlistToken(new URLSearchParams(window.location.search).get("waitlistToken") ?? undefined);
  }, []);

  useEffect(() => {
    if (!slug) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL;

    fetch(`${apiBase}/booking/${slug}/info`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (r.status === 423) { setUnavailable(true); return null; }
        if (!r.ok) throw new Error("Booking page could not be loaded");
        return r.json();
      })
      .then((info) => {
        if (!info) return;
        setTenantName(info.companyName ?? info.name ?? slug);
        if (info.primaryColor) setPrimaryColor(info.primaryColor);
        if (info.address) setTenantAddress(info.address);
        try {
          const cfg = typeof info.linktreeConfig === 'string'
            ? JSON.parse(info.linktreeConfig)
            : info.linktreeConfig ?? {};
          if (cfg.fontFamily) setFontFamily(cfg.fontFamily);
          if (cfg.buttonStyle) setButtonStyle(cfg.buttonStyle);
          if (cfg.bookingTheme) setBookingTheme(cfg.bookingTheme);
          if (cfg.serviceLayout) setServiceLayout(cfg.serviceLayout);
          if (cfg.showPrices !== undefined) setShowPrices(cfg.showPrices);
        } catch {}
      })
      .catch(() => setTenantName(slug));

    getLocations(slug)
      .then((locs) => {
        setLocations(locs);
        // Only fetch services immediately when there's ≤1 location — a multi-location
        // tenant's customer must pick a location first, which then filters the service list.
        if (locs.length <= 1) {
          getServices(slug)
            .then(setServices)
            .catch(() => setError(t.booking.errorLoadServices));
        }
      })
      .catch(() => {
        // Locations endpoint failing must never block booking — fall back to the
        // unfiltered, pre-multi-location behavior.
        getServices(slug)
          .then(setServices)
          .catch(() => setError(t.booking.errorLoadServices));
      })
      .finally(() => setLocationsLoaded(true));
  }, [slug, t.booking.errorLoadServices]);

  const hasMultipleLocations = locations.length > 1;
  const stepOffset = hasMultipleLocations ? 1 : 0;
  const TOTAL_STEPS = 4 + stepOffset;

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setServices([]);
    setSelectedService(null);
    getServices(slug, location.id)
      .then(setServices)
      .catch(() => setError(t.booking.errorLoadServices));
  };

  useEffect(() => {
    if (!slug) return;
    // Fail closed: only show the finder promo banner once we've confirmed the tenant
    // actually has it enabled — otherwise every tenant's booking page would advertise
    // a feature that dead-ends for most of them.
    getPublicFinderBootstrap(slug)
      .then((data) => setFinderEnabled(data.enabled))
      .catch(() => setFinderEnabled(false));
  }, [slug]);

  const handleLoadSlots = async (date: string, employeeId?: string) => {
    if (!selectedService) return;
    const empId = employeeId || selectedEmployee?.id;
    if (!empId) return;
    setLoadingSlots(true);
    setSelectedTime(null);
    try {
      const data = await getAvailability(selectedService.id, date, empId, slug, waitlistToken);
      setAvailableSlots(data.availableSlots);
      setNoSlotsMessage(data.message ?? null);
      BookingEvents.dateSelected(date);
    } catch {
      setError(t.booking.errorLoadAvailability);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    BookingEvents.serviceSelected(service.name, service.price);
  };

  const handleEmployeeSelect = (employee: Employee) => {
    if (selectedEmployee?.id !== employee.id) {
      setAvailableSlots([]);
      setSelectedDate(null);
      setSelectedTime(null);
    }
    setSelectedEmployee(employee);
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!selectedService || !selectedDate || !selectedTime) {
      setError(t.booking.errorFillRequired);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!privacyAccepted) {
      setError(t.booking.errorPrivacy);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerInfo.firstName.trim() || !customerInfo.lastName.trim() ||
        !customerInfo.email.trim() || !customerInfo.phone.trim()) {
      setError(t.booking.errorFillAllRequired);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!emailRegex.test(customerInfo.email.trim())) {
      setError(t.booking.errorInvalidEmail);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const booking = await createBooking({
        serviceId: selectedService.id,
        bookingDate: selectedDate,
        startTime: selectedTime,
        customer: customerInfo,
        employeeId: selectedEmployee?.id ?? null,
        waitlistToken,
      }, slug);
      BookingEvents.bookingCompleted(booking.bookingNumber, selectedService.name, selectedService.price, {}, selectedService.currency);
      router.push(`/booking/confirmation/${booking.id}?slug=${slug}`);
    } catch (err: unknown) {
      const responseMessage = err instanceof Error ? err.message : undefined;
      setError(lang === "de" ? (responseMessage || t.booking.errorBooking) : t.booking.errorBooking);
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setCurrentStep((s) => Math.max(s - 1, 1));

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-2xl font-bold text-gray-800 mb-2">{t.booking.bookingSystemNotFound}</p>
          <p className="text-gray-500">{t.booking.bookingSystemNotFoundDesc} <span className="font-mono">/booking/{slug}</span> {t.booking.bookingSystemNotFoundDesc2}</p>
        </div>
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md text-center p-8">
          <p className="text-2xl font-bold text-gray-800 mb-2">{t.booking.unavailableTitle}</p>
          <p className="text-gray-500">{t.booking.unavailableDesc}</p>
        </div>
      </div>
    );
  }

  const bgStyle = (() => {
    if (bookingTheme === 'dark') return { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' };
    if (bookingTheme === 'branded') return { background: `linear-gradient(135deg, ${lighten(primaryColor, 0.82)} 0%, ${lighten(primaryColor, 0.92)} 60%, #ffffff 100%)` };
    return { background: `linear-gradient(135deg, ${lighten(primaryColor, 0.88)} 0%, ${lighten(primaryColor, 0.94)} 60%, #ffffff 100%)` };
  })();
  const isDark = bookingTheme === 'dark';
  const fontStyle = { fontFamily: FONT_FAMILY[fontFamily] ?? FONT_FAMILY.inter };
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().slice(0, 5);
  const hasBookableSlot = availableSlots.some(
    (slot) =>
      slot.isAvailable &&
      (selectedDate !== today || slot.startTime > currentTime),
  );

  return (
    <div className="min-h-screen" style={{ ...bgStyle, ...fontStyle }}>
      {FONT_QUERY[fontFamily] && (
        // eslint-disable-next-line @next/next/no-head-element
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${FONT_QUERY[fontFamily]}&display=swap`}
        />
      )}
      {/* Header */}
      <div className={`border-b sticky top-0 z-10 backdrop-blur-sm ${isDark ? 'border-white/10 bg-black/40' : 'border-gray-100 bg-white/80'}`}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push(`/booking/${slug}`)}
            className={`flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70 flex-shrink-0 ${isDark ? 'text-white/70' : 'text-gray-500'}`}
            title={`${t.back} ${tenantName || slug}`}
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">{t.back}</span>
          </button>
          <div className="flex-1">
            <p className={`font-bold text-sm leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {tenantName || slug}
            </p>
            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-400'}`}>{t.booking.onlineBooking}</p>
          </div>
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "de" ? "en" : "de")}
            className={`flex-shrink-0 text-xs font-bold px-2.5 py-1.5 rounded-full border transition-all ${
              isDark
                ? 'border-white/20 text-white/70 hover:bg-white/10'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {lang === "de" ? "EN" : "DE"}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
        {finderEnabled && (
          <div className={`mb-5 rounded-xl border p-3 flex items-center justify-between gap-3 ${isDark ? 'border-white/15 bg-white/5' : 'border-[#DAD7F8] bg-[#F4F2FF]'}`}>
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#2D2568]'}`}>{t.booking.finderTitle}</p>
              <p className={`text-xs ${isDark ? 'text-white/70' : 'text-[#5E55A3]'}`}>{t.booking.finderDesc}</p>
            </div>
            <button
              onClick={() => router.push(`/booking/${slug}/finder`)}
              className="rounded-lg px-3 py-2 text-xs font-bold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {t.booking.finderStart}
            </button>
          </div>
        )}

        {/* Step indicators */}
        {(() => {
          const stepLabels = hasMultipleLocations
            ? [t.booking.locationStep, ...t.booking.stepLabels]
            : t.booking.stepLabels;
          return (
            <div className="mb-8 flex justify-center items-start gap-2 sm:gap-3">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
                <div key={step} className="flex items-start">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        currentStep > step
                          ? "text-white"
                          : currentStep === step
                          ? "text-white ring-4 ring-opacity-20"
                          : isDark ? "bg-white/10 text-white/40" : "text-[#8A8A8A]"
                      }`}
                      style={currentStep >= step
                        ? { backgroundColor: primaryColor }
                        : isDark ? {} : { backgroundColor: lighten(primaryColor, 0.82) }}
                    >
                      {currentStep > step ? <Check size={18} /> : step}
                    </div>
                    <p className={`text-[10px] sm:text-xs font-medium text-center leading-tight transition-colors ${
                      isDark
                        ? currentStep === step ? 'text-white' : 'text-white/40'
                        : currentStep === step ? 'text-gray-700' : currentStep > step ? 'text-gray-400' : 'text-gray-300'
                    }`}>
                      {stepLabels[step - 1]}
                    </p>
                  </div>
                  {step < TOTAL_STEPS && (
                    <div
                      className="w-6 sm:w-10 h-1 mx-1 sm:mx-2 rounded transition-all mt-4 sm:mt-[18px] flex-shrink-0"
                      style={{ backgroundColor: currentStep > step ? primaryColor : isDark ? 'rgba(255,255,255,0.1)' : lighten(primaryColor, 0.75) }}
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`shadow-2xl p-5 sm:p-8 ${isDark ? 'bg-white/10 backdrop-blur-md ring-1 ring-white/10' : 'bg-white ring-1'}`}
          style={{
            borderRadius: getBorderRadius(buttonStyle),
            boxShadow: isDark ? '0 25px 60px rgba(0,0,0,0.5)' : undefined,
            ...(isDark ? {} : { '--tw-ring-color': `${primaryColor}33` } as any),
          }}
        >
          {!locationsLoaded ? (
            <div className="flex justify-center py-16">
              <span
                className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: lighten(primaryColor, 0.82), borderTopColor: primaryColor }}
              />
            </div>
          ) : (
          <AnimatePresence mode="wait">
            {currentStep === 1 && hasMultipleLocations && (
              <motion.div key="step-location" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <LocationSelector
                  locations={locations}
                  selectedLocation={selectedLocation}
                  onSelect={handleLocationSelect}
                  onNext={next}
                  primaryColor={primaryColor}
                  title={t.booking.chooseLocation}
                  subtitle={t.booking.stepOf.replace('{current}', '1').replace('{total}', String(TOTAL_STEPS))}
                />
              </motion.div>
            )}
            {currentStep === 1 + stepOffset && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ServiceSelector
                  services={services}
                  selectedService={selectedService}
                  onSelect={handleServiceSelect}
                  onNext={next}
                  tenantSlug={slug}
                  primaryColor={primaryColor}
                />
              </motion.div>
            )}
            {currentStep === 2 + stepOffset && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <EmployeeSelector
                  selectedEmployee={selectedEmployee}
                  onSelect={handleEmployeeSelect}
                  onNext={next}
                  onBack={back}
                  selectedService={selectedService}
                  tenantSlug={slug}
                  primaryColor={primaryColor}
                />
              </motion.div>
            )}
            {currentStep === 3 + stepOffset && selectedService && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <DateTimePicker
                  service={selectedService}
                  selectedEmployee={selectedEmployee}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  availableSlots={availableSlots}
                  noSlotsMessage={noSlotsMessage}
                  onDateSelect={setSelectedDate}
                  onTimeSelect={(t) => { setSelectedTime(t); BookingEvents.timeSlotSelected(t); }}
                  onLoadSlots={handleLoadSlots}
                  onNext={next}
                  onBack={back}
                  loading={loadingSlots}
                  primaryColor={primaryColor}
                />
              </motion.div>
            )}
            {currentStep === 4 + stepOffset && selectedService && selectedDate && selectedTime && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ContactForm
                  service={selectedService}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  customerInfo={customerInfo}
                  onCustomerInfoChange={setCustomerInfo}
                  privacyAccepted={privacyAccepted}
                  onPrivacyChange={setPrivacyAccepted}
                  selectedEmployee={selectedEmployee}
                  onSubmitAttempt={submitAttempted}
                  submitError={error}
                  onBack={back}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                  primaryColor={primaryColor}
                  tenantAddress={tenantAddress}
                />
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </div>

        {currentStep === 3 + stepOffset &&
          selectedDate &&
          selectedService &&
          selectedEmployee &&
          !loadingSlots && (
            <WaitlistPanel
              key={`${selectedDate}-${selectedEmployee.id}`}
              slug={slug}
              service={selectedService}
              employee={selectedEmployee}
              date={selectedDate}
              slots={availableSlots}
              noBookableSlots={!hasBookableSlot}
              primaryColor={primaryColor}
              isDark={isDark}
              borderRadius={getBorderRadius(buttonStyle)}
            />
          )}
      </div>
    </div>
  );
}

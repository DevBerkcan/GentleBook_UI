"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

import { ServiceSelector } from "@/components/booking/ServiceSelector";
import { EmployeeSelector } from "@/components/booking/EmployeeSelector";
import { DateTimePicker } from "@/components/booking/DateTimePicker";
import { ContactForm } from "@/components/booking/ContactForm";

import {
  getServices,
  getAvailability,
  createBooking,
  type Service,
  type TimeSlot,
  type CustomerInfo,
  type Employee,
} from "@/lib/api/booking";
import { BookingEvents } from "@/lib/tracking";

const TOTAL_STEPS = 4;

export default function TenantBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [tenantName, setTenantName] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState<string>('#E8C7C3');

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: "", lastName: "", email: "", phone: "",
  });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    // Load tenant info + services in parallel
    const apiBase = process.env.NEXT_PUBLIC_API_URL;

    fetch(`${apiBase}/booking/${slug}/info`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((info) => {
        if (!info) return;
        setTenantName(info.companyName ?? info.name ?? slug);
        if (info.primaryColor) setPrimaryColor(info.primaryColor);
      })
      .catch(() => setTenantName(slug));

    getServices(slug)
      .then(setServices)
      .catch(() => setError("Fehler beim Laden der Services"));
  }, [slug]);

  const handleLoadSlots = async (date: string, employeeId?: string) => {
    if (!selectedService) return;
    const empId = employeeId || selectedEmployee?.id;
    if (!empId) return;
    setLoadingSlots(true);
    setSelectedTime(null);
    try {
      const data = await getAvailability(selectedService.id, date, empId, slug);
      setAvailableSlots(data.availableSlots);
      BookingEvents.dateSelected(date);
    } catch {
      setError("Fehler beim Laden der Verfügbarkeit");
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
      setError("Bitte alle Felder ausfüllen");
      return;
    }
    if (!privacyAccepted) {
      setError("Bitte stimmen Sie den Datenschutzbestimmungen zu");
      return;
    }
    const hasErrors =
      !customerInfo.firstName.trim() || !customerInfo.lastName.trim() ||
      !customerInfo.email.trim() || !customerInfo.phone.trim();
    if (hasErrors) return;

    setSubmitting(true);
    setError(null);
    try {
      const booking = await createBooking({
        serviceId: selectedService.id,
        bookingDate: selectedDate,
        startTime: selectedTime,
        customer: customerInfo,
        employeeId: selectedEmployee?.id ?? null,
      }, slug);
      BookingEvents.bookingCompleted(booking.bookingNumber, selectedService.name, selectedService.price, {});
      router.push(`/booking/confirmation/${booking.id}`);
    } catch (err: any) {
      setError(err.message || "Fehler beim Buchen. Bitte versuchen Sie es erneut.");
      setSubmitting(false);
    }
  };

  const next = () => setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setCurrentStep((s) => Math.max(s - 1, 1));

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-2xl font-bold text-gray-800 mb-2">Buchungssystem nicht gefunden</p>
          <p className="text-gray-500">Der Link <span className="font-mono">/booking/{slug}</span> ist nicht gültig.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] via-[#F5EDEB] to-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: primaryColor }} />
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">
              {tenantName || slug}
            </p>
            <p className="text-xs text-gray-400">Online-Buchung</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
        {/* Step indicators */}
        <div className="mb-8 flex justify-center items-center gap-2 sm:gap-4">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  currentStep > step
                    ? "text-white"
                    : currentStep === step
                    ? "text-white ring-4 ring-opacity-20"
                    : "bg-[#F0E6E4] text-[#8A8A8A]"
                }`}
                style={currentStep >= step ? { backgroundColor: primaryColor } : {}}
              >
                {currentStep > step ? <Check size={18} /> : step}
              </div>
              {step < TOTAL_STEPS && (
                <div
                  className="w-8 sm:w-12 h-1 mx-1 sm:mx-2 rounded transition-all"
                  style={{ backgroundColor: currentStep > step ? primaryColor : '#F0E6E4' }}
                />
              )}
            </div>
          ))}
        </div>

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

        <div className="bg-white rounded-3xl shadow-2xl p-5 sm:p-8 ring-1 ring-[#E8C7C3]/20">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ServiceSelector
                  services={services}
                  selectedService={selectedService}
                  onSelect={handleServiceSelect}
                  onNext={next}
                />
              </motion.div>
            )}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <EmployeeSelector
                  selectedEmployee={selectedEmployee}
                  onSelect={handleEmployeeSelect}
                  onNext={next}
                  onBack={back}
                  selectedService={selectedService}
                  tenantSlug={slug}
                />
              </motion.div>
            )}
            {currentStep === 3 && selectedService && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <DateTimePicker
                  service={selectedService}
                  selectedEmployee={selectedEmployee}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  availableSlots={availableSlots}
                  onDateSelect={setSelectedDate}
                  onTimeSelect={(t) => { setSelectedTime(t); BookingEvents.timeSlotSelected(t); }}
                  onLoadSlots={handleLoadSlots}
                  onNext={next}
                  onBack={back}
                  loading={loadingSlots}
                />
              </motion.div>
            )}
            {currentStep === 4 && selectedService && selectedDate && selectedTime && (
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
                  onBack={back}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

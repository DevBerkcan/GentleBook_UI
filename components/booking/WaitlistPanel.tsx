"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { joinWaitlist } from "@/lib/api/waitlist";
import type { Employee, Service, TimeSlot } from "@/lib/api/booking";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface WaitlistPanelProps {
  slug: string;
  service: Service;
  employee: Employee;
  date: string;
  slots: TimeSlot[];
  noBookableSlots: boolean;
  primaryColor: string;
  isDark: boolean;
  borderRadius: string;
}

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
};

export function WaitlistPanel({
  slug,
  service,
  employee,
  date,
  slots,
  noBookableSlots,
  primaryColor,
  isDark,
  borderRadius,
}: WaitlistPanelProps) {
  const { t, lang } = useTranslation();
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().slice(0, 5);
  const unavailableSlots = slots.filter(
    (slot) => !slot.isAvailable && (date !== today || slot.startTime > currentTime),
  );
  const [open, setOpen] = useState(noBookableSlots);
  const [mode, setMode] = useState<"flexible" | "exact">("flexible");
  const [preferredTime, setPreferredTime] = useState(unavailableSlots[0]?.startTime ?? "");
  const [allowOtherEmployees, setAllowOtherEmployees] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError(t.booking.waitlistFirstLastRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError(t.booking.errorInvalidEmail);
      return;
    }
    if (mode === "exact" && !preferredTime) {
      setError(t.booking.waitlistPreferredTimeRequired);
      return;
    }

    const selectedSlot = unavailableSlots.find((slot) => slot.startTime === preferredTime);
    setSubmitting(true);
    try {
      await joinWaitlist(slug, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        notes: form.notes.trim() || undefined,
        serviceId: service.id,
        employeeId: allowOtherEmployees ? undefined : employee.id,
        preferredDate: date,
        preferredStartTime: mode === "exact" ? selectedSlot?.startTime : undefined,
        preferredEndTime: mode === "exact" ? selectedSlot?.endTime : undefined,
      });
      setDone(true);
    } catch (requestError: unknown) {
      const responseMessage =
        typeof requestError === "object" &&
        requestError !== null &&
        "response" in requestError
          ? (requestError as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(lang === "de" ? (responseMessage || t.booking.waitlistError) : t.booking.waitlistError);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 w-full flex items-center justify-center gap-2 border-2 px-4 py-3 font-semibold transition-opacity hover:opacity-80"
        style={{ color: primaryColor, borderColor: primaryColor, borderRadius }}
      >
        <Bell size={17} />
        {t.booking.waitlistOpen}
      </button>
    );
  }

  return (
    <section
      className={`mt-6 shadow-xl p-5 sm:p-8 ${
        isDark ? "bg-white/10 backdrop-blur-md ring-1 ring-white/10" : "bg-white ring-1"
      }`}
      style={{ borderRadius }}
    >
      {done ? (
        <div className="text-center py-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Check size={28} style={{ color: primaryColor }} />
          </div>
          <p className={`font-bold text-lg mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
            {t.booking.waitlistSuccessTitle}
          </p>
          <p className={`text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>
            {t.booking.waitlistSuccessDesc}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <h3 className={`font-bold text-base mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
              {t.booking.waitlistFor} {service.name}
            </h3>
            <p className={`text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>
              {new Date(`${date}T00:00:00`).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}{" "}
              {t.booking.waitlistAt} {employee.name}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => setMode("flexible")}
              className="border px-3 py-2 text-sm font-medium"
              style={{
                borderRadius,
                borderColor: mode === "flexible" ? primaryColor : "#E5E7EB",
                backgroundColor: mode === "flexible" ? `${primaryColor}15` : "transparent",
                color: isDark ? "white" : "#374151",
              }}
            >
              {t.booking.waitlistAnyTime}
            </button>
            <button
              type="button"
              onClick={() => setMode("exact")}
              disabled={unavailableSlots.length === 0}
              className="border px-3 py-2 text-sm font-medium disabled:opacity-40"
              style={{
                borderRadius,
                borderColor: mode === "exact" ? primaryColor : "#E5E7EB",
                backgroundColor: mode === "exact" ? `${primaryColor}15` : "transparent",
                color: isDark ? "white" : "#374151",
              }}
            >
              {t.booking.waitlistExactTime}
            </button>
          </div>

          {mode === "exact" && (
            <label className={`block text-xs font-medium mb-4 ${isDark ? "text-white/70" : "text-gray-600"}`}>
              {t.booking.waitlistPreferredTime}
              <select
                value={preferredTime}
                onChange={(event) => setPreferredTime(event.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm"
              >
                {unavailableSlots.map((slot) => (
                  <option key={slot.startTime} value={slot.startTime}>
                    {slot.startTime} – {slot.endTime}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className={`mb-4 flex items-start gap-2 text-sm ${isDark ? "text-white/70" : "text-gray-600"}`}>
            <input
              type="checkbox"
              checked={allowOtherEmployees}
              onChange={(event) => setAllowOtherEmployees(event.target.checked)}
              className="mt-1"
            />
            {t.booking.waitlistOtherEmployees}
          </label>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {([
              ["firstName", `${t.booking.firstName} *`, "text"],
              ["lastName", `${t.booking.lastName} *`, "text"],
              ["email", `${t.booking.email} *`, "email"],
              ["phone", t.booking.phone, "tel"],
            ] as const).map(([key, label, type]) => (
              <label key={key} className={`text-xs font-medium ${isDark ? "text-white/70" : "text-gray-600"}`}>
                {label}
                <input
                  type={type}
                  value={form[key]}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  className={`mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                    isDark
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-gray-50 border-gray-200 text-gray-900"
                  }`}
                />
              </label>
            ))}
          </div>

          <label className={`block text-xs font-medium mb-5 ${isDark ? "text-white/70" : "text-gray-600"}`}>
            {t.booking.notesOptional}
            <textarea
              rows={2}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className={`mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none ${
                isDark
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-gray-50 border-gray-200 text-gray-900"
              }`}
            />
          </label>

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="w-full py-3 px-6 font-semibold text-sm text-white disabled:opacity-60"
            style={{ backgroundColor: primaryColor, borderRadius }}
          >
            {submitting ? t.booking.waitlistSubmitting : t.booking.waitlistSubmit}
          </button>
        </>
      )}
    </section>
  );
}

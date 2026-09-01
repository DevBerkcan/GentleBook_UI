"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, ArrowRight, ArrowLeft, CheckCircle, Clock } from "lucide-react";
import { Button } from "@nextui-org/button";
import type { Service, TimeSlot, Employee } from "@/lib/api/booking";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface DateTimePickerProps {
  service: Service;
  selectedEmployee: Employee | null;
  selectedDate: string | null;
  selectedTime: string | null;
  availableSlots: TimeSlot[];
  noSlotsMessage?: string | null;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
  onLoadSlots: (date: string, employeeId?: string) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
  primaryColor?: string;
}

function lighten(hex: string, amount = 0.85) {
  try {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
  } catch { return "#F6F5FA"; }
}

export function DateTimePicker({
  service,
  selectedEmployee,
  selectedDate,
  selectedTime,
  availableSlots,
  noSlotsMessage,
  onDateSelect,
  onTimeSelect,
  onLoadSlots,
  onNext,
  onBack,
  loading,
  primaryColor = "#6355E4",
}: DateTimePickerProps) {
  const { t, lang } = useTranslation();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday;
  });

  const lightBg   = lighten(primaryColor, 0.90);
  const veryLight = lighten(primaryColor, 0.88);
  const locale = lang === "en" ? "en-GB" : "de-DE";

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  const formatDate    = (date: Date) => date.toISOString().split("T")[0];
  const formatDayName = (date: Date) => date.toLocaleDateString(locale, { weekday: "short" });
  const formatDayNumber = (date: Date) => date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });

  const goToPreviousWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); setCurrentWeekStart(d); };
  const goToNextWeek     = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); setCurrentWeekStart(d); };

  const isToday  = (date: Date) => formatDate(date) === formatDate(new Date());
  const isPast   = (date: Date) => { const t = new Date(); t.setHours(0, 0, 0, 0); return date < t; };
  const isSunday = (date: Date) => date.getDay() === 0;

  const isSlotPast = (slot: TimeSlot): boolean => {
    if (!selectedDate) return false;
    const now = new Date();
    if (selectedDate !== formatDate(now)) return false;
    const [h, m] = slot.startTime.split(":").map(Number);
    const slotTime = new Date();
    slotTime.setHours(h, m, 0, 0);
    return slotTime <= now;
  };

  const canProceed = selectedDate !== null && selectedTime !== null;

  if (!selectedEmployee) {
    return (
      <div className="text-center py-12">
        <p className="text-[#8A8A8A]">{t.booking.noEmployeeSelected}</p>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-6 ${canProceed ? "pb-28" : "pb-4"}`}>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#14162B] mb-2">{t.booking.chooseDatetime}</h2>
          <p className="text-sm sm:text-base text-[#8A8A8A]">
            {t.booking.step3of4} • {service.name} • {selectedEmployee.name}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Button isIconOnly variant="flat" onPress={goToPreviousWeek} style={{ backgroundColor: lightBg }}>
            <ChevronLeft size={20} />
          </Button>
          <div className="flex items-center gap-2 text-[#6B6B6B]">
            <Calendar size={18} />
            <span className="font-semibold text-sm sm:text-base">
              {currentWeekStart.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" })}
              {" – "}
              {weekDays[6].toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          </div>
          <Button isIconOnly variant="flat" onPress={goToNextWeek} style={{ backgroundColor: lightBg }}>
            <ChevronRight size={20} />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((date, index) => {
            const dateStr   = formatDate(date);
            const isSelected = selectedDate === dateStr;
            const isDisabled = isPast(date) || isSunday(date);

            return (
              <motion.button
                key={dateStr}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  if (!isDisabled) { onDateSelect(dateStr); onLoadSlots(dateStr, selectedEmployee.id); }
                }}
                disabled={isDisabled}
                className="py-2 sm:py-3 px-1 sm:px-2 rounded-xl transition-all text-center border-2"
                style={
                  isSelected
                    ? { backgroundColor: primaryColor, color: 'white', borderColor: primaryColor }
                    : isDisabled
                    ? { backgroundColor: lightBg, color: '#8A8A8A', borderColor: 'transparent', opacity: 0.5, cursor: 'not-allowed' }
                    : { backgroundColor: 'white', borderColor: primaryColor }
                }
              >
                <div className="text-xs font-medium mb-0.5">{formatDayName(date)}</div>
                <div className="text-sm font-bold">{formatDayNumber(date).split(".")[0]}</div>
                {isToday(date) && !isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1" style={{ backgroundColor: primaryColor }} />
                )}
              </motion.button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[#14162B] text-sm sm:text-base">
              {t.booking.availableTimesOn}{" "}
              {new Date(selectedDate + "T00:00:00").toLocaleDateString(locale, { weekday: "long", day: "2-digit", month: "long" })}
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: primaryColor }} />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8 rounded-xl text-[#8A8A8A] text-sm" style={{ backgroundColor: lightBg }}>
                {lang === "de" ? (noSlotsMessage ?? t.booking.noTimesAvailable) : t.booking.noTimesAvailable}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {availableSlots.map((slot, index) => {
                  const slotDisabled = !slot.isAvailable || isSlotPast(slot);
                  return (
                    <motion.button
                      key={slot.startTime}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => !slotDisabled && onTimeSelect(slot.startTime)}
                      disabled={slotDisabled}
                      className="py-3 px-2 rounded-lg font-semibold text-sm transition-all border-2"
                      style={
                        selectedTime === slot.startTime
                          ? { backgroundColor: primaryColor, color: 'white', borderColor: primaryColor }
                          : slotDisabled
                          ? { backgroundColor: lightBg, color: '#8A8A8A', borderColor: 'transparent', opacity: 0.5, cursor: 'not-allowed' }
                          : { backgroundColor: 'white', borderColor: primaryColor }
                      }
                    >
                      {slot.startTime}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {canProceed && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-sm shadow-2xl"
            style={{ borderTop: `2px solid ${primaryColor}4D` }}
          >
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex-shrink-0 flex items-center gap-1 hover:opacity-80 active:scale-95 text-[#14162B] font-semibold py-3 px-4 rounded-xl transition-all"
                style={{ backgroundColor: veryLight }}
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">{t.back}</span>
              </button>

              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                  <CheckCircle className="text-white" size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#8A8A8A]">{t.booking.selected}</p>
                  <p className="font-bold text-[#14162B] text-sm truncate">
                    {new Date(selectedDate! + "T00:00:00").toLocaleDateString(locale, { day: "2-digit", month: "2-digit" })}{" "}
                    {lang === "en" ? "at" : "um"} {selectedTime}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-[#8A8A8A]">
                    <Clock size={10} />
                    {service.durationMinutes} {t.booking.minutes}
                  </div>
                </div>
              </div>

              <button
                onClick={onNext}
                className="flex-shrink-0 flex items-center gap-2 active:scale-95 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
                style={{ background: `linear-gradient(to right, ${primaryColor}, ${lighten(primaryColor, 0.2)})` }}
              >
                {t.next}
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

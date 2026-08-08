// components/admin/bookings/IntakeFormAnswersPanel.tsx
// Shows the customer's intake-form answers for a booking, if any were submitted.
// Renders nothing if there's no response, no active form, or the tenant isn't on Agency.
"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api/admin";

export function IntakeFormAnswersPanel({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<{ label: string; value: string }[] | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminApi.getIntakeFormResponseForBooking(bookingId)
      .then((data) => { if (active) setAnswers(data.hasResponse ? data.answers ?? [] : null); })
      .catch(() => { if (active) setAnswers(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20 flex items-center gap-2 text-xs text-[#8A8A8A]">
        <Loader2 size={13} className="animate-spin" /> Lade Formular…
      </div>
    );
  }

  if (!answers || answers.length === 0) return null;

  return (
    <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20">
      <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3 flex items-center gap-1.5">
        <ClipboardList size={14} className="text-[#6355E4]" /> Formular
      </h3>
      <div className="space-y-2">
        {answers.map((a, i) => (
          <div key={i} className="bg-white p-3 rounded-lg">
            <p className="text-xs text-[#8A8A8A]">{a.label}</p>
            <p className="text-sm font-medium text-[#1E1E1E]">{a.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

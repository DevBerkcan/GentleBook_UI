// components/admin/customers/CustomerLoyaltyCardModal.tsx
// Printable "Kundenkarte" showing visit progress toward the next auto-reward threshold —
// browser print (window.print()), same download/print spirit as QrCodeModal.tsx. Only rendered
// when TenantSettings.LoyaltyRewardEveryNVisits > 0 (checked by the caller).
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Printer, Award } from "lucide-react";

export function CustomerLoyaltyCardModal({
  open, onClose, customerName, totalBookings, threshold, tenantName,
}: {
  open: boolean;
  onClose: () => void;
  customerName: string;
  totalBookings: number;
  threshold: number;
  tenantName?: string | null;
}) {
  const progress = totalBookings % threshold === 0 && totalBookings > 0 ? threshold : totalBookings % threshold;
  const stamps = Array.from({ length: threshold }, (_, i) => i < progress);

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="loyalty-card-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden"
          onClick={onClose}
        >
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #loyalty-card-print, #loyalty-card-print * { visibility: visible; }
              #loyalty-card-print { position: fixed; inset: 0; margin: auto; width: 380px; height: fit-content; }
            }
          `}</style>
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="bg-white rounded-3xl shadow-2xl shadow-black/10 p-7 w-full max-w-sm flex flex-col items-center gap-5 border border-[#E5E7EB]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full print:hidden">
              <div>
                <p className="font-semibold text-[#111318] text-base">Kundenkarte</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Zum Ausdrucken für {customerName}</p>
              </div>
              <button onClick={onClose}
                className="text-[#9CA3AF] hover:text-[#374151] p-1.5 hover:bg-[#F3F4F6] rounded-xl transition-colors">
                <X size={17} />
              </button>
            </div>

            <div id="loyalty-card-print" className="w-full bg-[#F7F7F8] rounded-2xl border border-[#E5E7EB] p-5 flex flex-col items-center gap-3">
              {tenantName && <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">{tenantName}</p>}
              <div className="w-10 h-10 bg-[#6355E4] rounded-xl flex items-center justify-center">
                <Award size={18} className="text-white" />
              </div>
              <p className="font-bold text-[#111318]">{customerName}</p>
              <p className="text-sm text-[#6B7280]">{progress} von {threshold} Besuchen</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-[280px]">
                {stamps.map((filled, i) => (
                  <div key={i}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      filled ? "bg-[#6355E4] border-[#6355E4] text-white" : "border-[#D1D5DB] text-[#D1D5DB]"
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#9CA3AF] text-center mt-1">Beim {threshold}. Besuch gibt es eine Belohnung.</p>
            </div>

            <button onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-[#6355E4] text-white hover:bg-[#4338CA] transition-colors print:hidden">
              <Printer size={14} />Drucken
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

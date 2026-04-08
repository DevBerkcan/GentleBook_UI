"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const cookieConsent = localStorage.getItem("gentlebook_cookie_consent");
    if (!cookieConsent) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("gentlebook_cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("gentlebook_cookie_consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md md:left-auto md:right-8"
        >
          <div className="relative overflow-hidden rounded-2xl border-2 border-[#E8C7C3] bg-white p-6 shadow-2xl">
            {/* Close button */}
            <button
              onClick={handleDecline}
              className="absolute right-3 top-3 rounded-full p-1 text-[#8A8A8A] transition-colors hover:bg-[#F5EDEB] hover:text-[#1E1E1E]"
              aria-label="Cookie-Banner schließen"
            >
              <X size={20} />
            </button>

            {/* Icon */}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8C7C3]/10">
                <Cookie className="text-[#E8C7C3]" size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#1E1E1E]">
                Cookie-Hinweis
              </h3>
            </div>

            {/* Text */}
            <p className="mb-4 text-sm text-[#8A8A8A]">
              Wir verwenden Cookies, um deine Erfahrung zu verbessern und zu
              analysieren, wie unsere Website genutzt wird.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <motion.button
                onClick={handleAccept}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-shadow hover:shadow-lg"
              >
                Akzeptieren
              </motion.button>
              <motion.button
                onClick={handleDecline}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 rounded-xl border-2 border-[#E8C7C3] bg-white px-4 py-2.5 text-sm font-semibold text-[#1E1E1E] transition-colors hover:bg-[#F5EDEB]"
              >
                Ablehnen
              </motion.button>
            </div>

            {/* Decorative gradient */}
            <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-[#E8C7C3]/10 to-[#C09995]/10 blur-3xl" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
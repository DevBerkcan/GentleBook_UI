// components/Footer.tsx
"use client";

import { motion } from "framer-motion";
import { Instagram, Facebook, Mail } from "lucide-react";
import { KlaroCookieSettingsButton } from "./KlaroCookieConsent";

export const Footer = () => {
  const socialLinks: { name: string; href: string; icon: any }[] = [];

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="mt-12 pb-8 text-center"
    >
      <div className="mb-4 flex items-center justify-center gap-4">
        {socialLinks.map((social, index) => (
          <motion.a
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.name}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 + index * 0.1 }}
            whileHover={{ scale: 1.2, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0E6E4] text-[#8A8A8A] transition-colors hover:bg-[#E8C7C3] hover:text-white"
          >
            <social.icon size={18} />
          </motion.a>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-center gap-4 text-xs text-[#8A8A8A]">
        <a
          href="/impressum"
          className="transition-colors hover:text-[#E8C7C3] hover:underline"
        >
          Impressum
        </a>
        <span className="text-[#F0E6E4]">•</span>
        <a
          href="/datenschutz"
          className="transition-colors hover:text-[#E8C7C3] hover:underline"
        >
          Datenschutz
        </a>
        <span className="text-[#F0E6E4]">•</span>
        <KlaroCookieSettingsButton />
      </div>

      <p className="text-xs text-[#8A8A8A]">
        © {new Date().getFullYear()} GentleBook. Alle Rechte vorbehalten.
      </p>
    </motion.footer>
  );
};
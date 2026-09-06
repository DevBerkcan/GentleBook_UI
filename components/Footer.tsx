// components/Footer.tsx
"use client";

import { motion } from "framer-motion";
import { KlaroCookieSettingsButton } from "./KlaroCookieConsent";
import { legalConfig } from "@/lib/config";

export const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="mt-12 pb-8 text-center"
    >
      <div className="mb-4 flex flex-wrap items-center justify-center gap-4 text-xs text-[#8A8A8A]">
        <a
          href={legalConfig.imprint}
          className="transition-colors hover:text-[#ECEBF2] hover:underline"
        >
          Impressum
        </a>
        <span className="text-[#ECEBF2]">•</span>
        <a
          href={legalConfig.privacy}
          className="transition-colors hover:text-[#ECEBF2] hover:underline"
        >
          Datenschutz
        </a>
        <span className="text-[#ECEBF2]">•</span>
        <a
          href={legalConfig.terms}
          className="transition-colors hover:text-[#ECEBF2] hover:underline"
        >
          AGB
        </a>
        <span className="text-[#ECEBF2]">•</span>
        <a
          href={legalConfig.b2b}
          className="transition-colors hover:text-[#ECEBF2] hover:underline"
        >
          B2B-Hinweis
        </a>
        <span className="text-[#ECEBF2]">•</span>
        <KlaroCookieSettingsButton />
        <a href={legalConfig.processing} className="hover:underline">AV-Vertrag</a>
        <a href={legalConfig.subprocessors} className="hover:underline">Unterauftragsverarbeiter</a>
        <a href={legalConfig.acceptableUse} className="hover:underline">Nutzungsrichtlinien</a>
      </div>

      <p className="text-xs text-[#8A8A8A]">
        © {new Date().getFullYear()} GentleBook. Alle Rechte vorbehalten.
      </p>
    </motion.footer>
  );
};

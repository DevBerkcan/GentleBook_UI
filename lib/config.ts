// lib/config.ts
import { Calendar, Instagram, MapPin, MessageCircle } from "lucide-react";

export const siteConfig = {
  title: "GentleBook",
  description: "Das Buchungssystem für Salons, Beauty & mehr",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://app.gentlebook.app",
};

const legalSiteUrl = (process.env.NEXT_PUBLIC_LEGAL_SITE_URL || "https://gentlebook.app").replace(/\/$/, "");

export const legalConfig = {
  baseUrl: legalSiteUrl,
  sepa: `${legalSiteUrl}/sepa`,
  trial: `${legalSiteUrl}/testphase`,
  cancellation: `${legalSiteUrl}/kuendigung`,
  imprint: `${legalSiteUrl}/impressum`,
  privacy: `${legalSiteUrl}/datenschutz`,
  terms: `${legalSiteUrl}/agb`,
  b2b: `${legalSiteUrl}/b2b`,
  processing: `${legalSiteUrl}/auftragsverarbeitung`,
  subprocessors: `${legalSiteUrl}/unterauftragsverarbeiter`,
  cookies: `${legalSiteUrl}/cookies`,
  acceptableUse: `${legalSiteUrl}/nutzungsrichtlinien`,
  securityMeasures: `${legalSiteUrl}/tom`,
  retention: `${legalSiteUrl}/loeschkonzept`,
};

// Zentraler Betreiber-Support-Kontakt — bitte NUR hier pflegen,
// alle Seiten/Komponenten importieren diese Werte.
export const supportConfig = {
  email: "support@gentlegroup.de",
  whatsappNumber: "491754701892", // ohne "+" für wa.me-Links
  whatsappUrl: (text?: string) =>
    `https://wa.me/491754701892${text ? `?text=${encodeURIComponent(text)}` : ""}`,
  mailto: (subject?: string) =>
    `mailto:support@gentlegroup.de${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`,
};

export const socialLinks = [
  {
    label: "Online buchen",
    href: "/booking",
    icon: Calendar,
    variant: "primary" as const,
  },
  {
    label: "Instagram",
    href: "#",
    icon: Instagram,
    variant: "secondary" as const,
  },
  {
    label: "Standort",
    href: "#",
    icon: MapPin,
    variant: "maps" as const,
  },
  {
    label: "WhatsApp",
    href: "#",
    icon: MessageCircle,
    variant: "whatsapp" as const,
  },
];

export const footerLinks = [
  {
    label: "Impressum",
    href: legalConfig.imprint,
    category: "footer"
  },
  {
    label: "Datenschutz",
    href: legalConfig.privacy,
    category: "footer"
  },
  {
    label: "Cookie-Einstellungen",
    href: "#cookie",
    category: "footer"
  }
];

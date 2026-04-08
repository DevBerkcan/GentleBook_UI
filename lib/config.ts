// lib/config.ts
import { Calendar, Instagram, MapPin, MessageCircle } from "lucide-react";

export const siteConfig = {
  title: "GentleBook",
  description: "Das Buchungssystem für Salons, Beauty & mehr",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://gentlebook.vercel.app",
  image: "/og-image.jpg",
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
    href: "/impressum",
    category: "footer"
  },
  {
    label: "Datenschutz",
    href: "/datenschutz",
    category: "footer"
  },
  {
    label: "Cookie-Einstellungen",
    href: "#cookie",
    category: "footer"
  }
];
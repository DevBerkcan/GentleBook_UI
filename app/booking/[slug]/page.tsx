"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar, Instagram, MessageCircle, MapPin, Facebook, Youtube,
  Globe, Phone, Mail, ExternalLink, Loader2
} from "lucide-react";
import { getTenantInfo, getTenantLinks, type TenantLink } from "@/lib/api/booking";

const ICON_MAP: Record<string, React.ReactNode> = {
  Booking:    <Calendar size={20} />,
  Instagram:  <Instagram size={20} />,
  WhatsApp:   <MessageCircle size={20} />,
  GoogleMaps: <MapPin size={20} />,
  Facebook:   <Facebook size={20} />,
  TikTok:     <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>,
  YouTube:    <Youtube size={20} />,
  Website:    <Globe size={20} />,
  Phone:      <Phone size={20} />,
  Email:      <Mail size={20} />,
  Custom:     <ExternalLink size={20} />,
};

export default function TenantLinktreePage() {
  const { slug } = useParams<{ slug: string }>();
  const [tenantName, setTenantName] = useState("");
  const [tagline, setTagline] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#E8C7C3");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [links, setLinks] = useState<TenantLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    Promise.all([
      getTenantInfo(slug),
      getTenantLinks(slug),
    ]).then(([info, tenantLinks]) => {
      if (!info || !info.name) {
        setNotFound(true);
        return;
      }
      setTenantName(info.companyName ?? info.name ?? slug);
      setTagline(info.tagline ?? null);
      if (info.primaryColor) setPrimaryColor(info.primaryColor);
      if (info.logoUrl) setLogoUrl(info.logoUrl);
      setLinks(tenantLinks);
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F5EDEB] to-white">
        <Loader2 className="animate-spin text-[#E8C7C3]" size={32} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-2xl font-bold text-gray-800 mb-2">Profil nicht gefunden</p>
          <p className="text-gray-500">Der Link <span className="font-mono">/booking/{slug}</span> existiert nicht.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EDEB] to-white">
      <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center gap-6">

        {/* Profile Card */}
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Avatar / Logo */}
          {logoUrl ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}${logoUrl}`}
              alt={tenantName}
              className="w-20 h-20 rounded-full object-cover shadow-lg"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {tenantName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-bold text-[#1E1E1E]">{tenantName}</h1>
          {tagline && (
            <p className="text-sm text-[#8A8A8A] max-w-xs">{tagline}</p>
          )}
        </div>

        {/* Links */}
        <div className="w-full flex flex-col gap-3 mt-2">
          {/* Booking button — always first, always shown */}
          <Link
            href={`/booking/${slug}/book`}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
          >
            <span className="flex-shrink-0 bg-white/20 p-2 rounded-xl">
              <Calendar size={20} />
            </span>
            <span className="flex-1">Termin buchen</span>
            <span className="text-white/60 text-sm">→</span>
          </Link>

          {/* Custom links */}
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-white border border-gray-100 text-[#1E1E1E] font-semibold text-base shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-95"
            >
              <span
                className="flex-shrink-0 p-2 rounded-xl text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {ICON_MAP[link.iconType] ?? <ExternalLink size={20} />}
              </span>
              <span className="flex-1">{link.title}</span>
              <ExternalLink size={14} className="text-gray-300" />
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-300">
            Powered by{" "}
            <span className="font-semibold" style={{ color: primaryColor }}>
              GentleBook
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

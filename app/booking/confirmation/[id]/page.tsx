// app/booking/confirmation/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Calendar, Sparkles, Mail, User, ArrowLeft, PartyPopper, Copy, Check as CheckIcon, Download } from "lucide-react";
import Link from "next/link";

interface BookingDetails {
  id: string;
  bookingNumber: string;
  status: string;
  booking: {
    serviceName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    price: number;
    currency?: string;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface TenantInfo {
  companyName?: string;
  name?: string;
  primaryColor?: string;
  logoUrl?: string;
  tagline?: string;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return { r: parseInt(clean.slice(0,2),16), g: parseInt(clean.slice(2,4),16), b: parseInt(clean.slice(4,6),16) };
}
function withAlpha(hex: string, a: number) {
  try { const {r,g,b} = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; } catch { return hex; }
}
function lighten(hex: string, amount = 0.7) {
  try {
    const {r,g,b} = hexToRgb(hex);
    return `rgb(${Math.round(r+(255-r)*amount)},${Math.round(g+(255-g)*amount)},${Math.round(b+(255-b)*amount)})`;
  } catch { return "#F5EDEB"; }
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } };
const slideUp = { hidden: { opacity:0, y:20 }, visible: { opacity:1, y:0, transition:{ type:"spring", stiffness:280, damping:22 } } };

export default function ConfirmationPage({ params }: { params: { id: string } }) {
  const searchParams   = useSearchParams();
  const slug           = searchParams.get("slug");

  const [booking,    setBooking]    = useState<BookingDetails | null>(null);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [copied,     setCopied]     = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

  useEffect(() => {
    async function load() {
      try {
        const [bookRes, tenantRes] = await Promise.all([
          fetch(`${API_URL}/bookings/${params.id}`),
          slug ? fetch(`${API_URL}/booking/${slug}/info`) : Promise.resolve(null),
        ]);
        if (bookRes.ok) setBooking(await bookRes.json());
        if (tenantRes?.ok) setTenantInfo(await tenantRes.json());
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [params.id, slug, API_URL]);

  const primary   = tenantInfo?.primaryColor ?? "#E8C7C3";
  const lightBg   = lighten(primary, 0.88);

  function copyBookingNumber() {
    if (!booking) return;
    navigator.clipboard.writeText(booking.bookingNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function buildGoogleCalendarUrl() {
    if (!booking) return '#';
    const date = booking.booking.bookingDate.replace(/-/g, '');
    const start = `${date}T${booking.booking.startTime.replace(':', '')}00`;
    const end   = `${date}T${booking.booking.endTime.replace(':', '')}00`;
    const title = encodeURIComponent(`${booking.booking.serviceName}${name ? ` bei ${name}` : ''}`);
    const details = encodeURIComponent(`Buchungs-Nr: ${booking.bookingNumber}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  }

  function downloadIcal() {
    if (!booking) return;
    const date = booking.booking.bookingDate.replace(/-/g, '');
    const start = `${date}T${booking.booking.startTime.replace(':', '')}00`;
    const end   = `${date}T${booking.booking.endTime.replace(':', '')}00`;
    const title = `${booking.booking.serviceName}${name ? ` bei ${name}` : ''}`;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      `DTSTART:${start}`, `DTEND:${end}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:Buchungs-Nr: ${booking.bookingNumber}`,
      `UID:${booking.id}@gentlebook`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `termin-${booking.bookingNumber}.ics`;
    a.click(); URL.revokeObjectURL(url);
  }
  const logoSrc   = tenantInfo?.logoUrl
    ? (tenantInfo.logoUrl.startsWith("http") ? tenantInfo.logoUrl : `${API_URL}${tenantInfo.logoUrl}`)
    : null;
  const name      = tenantInfo?.companyName ?? tenantInfo?.name ?? null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("de-DE", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${lightBg}, #ffffff)` }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${primary} transparent ${primary} ${primary}` }} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${lightBg}, #ffffff)` }}>
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Buchung nicht gefunden</h1>
          <p className="text-gray-500 mb-6 text-sm">Die Buchung konnte nicht geladen werden.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: primary }}>
            Zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(160deg, ${lightBg} 0%, #ffffff 60%, ${lighten(primary, 0.82)} 100%)` }}>

      {/* Glow blob */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: primary }} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-15" style={{ background: primary }} />
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-12">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-5">

          {/* ── Hero card ── */}
          <motion.div variants={slideUp}
            className="rounded-3xl overflow-hidden shadow-2xl"
            style={{ boxShadow: `0 20px 60px ${withAlpha(primary, 0.2)}` }}
          >
            {/* Header */}
            <div className="relative px-8 pt-10 pb-8 text-center text-white overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${primary} 0%, ${withAlpha(primary, 0.75)} 100%)` }}
            >
              {/* Confetti-like dots */}
              {[...Array(6)].map((_, i) => (
                <motion.div key={i}
                  className="absolute w-2 h-2 rounded-full bg-white/30"
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], y: [-10, -40 - i * 12], x: [(i % 2 === 0 ? -1 : 1) * i * 8, (i % 2 === 0 ? 1 : -1) * i * 6] }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 1.2, ease: "easeOut" }}
                  style={{ left: `${15 + i * 13}%`, top: "30%" }}
                />
              ))}

              {/* Logo or icon */}
              <div className="relative mb-4 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border-4 border-white/40">
                  {logoSrc
                    ? <img src={logoSrc} alt={name ?? "Logo"} className="w-full h-full rounded-full object-cover" />
                    : <CheckCircle size={40} className="text-white" />
                  }
                </div>
                {/* Green check badge */}
                <div className="absolute -bottom-1 -right-1 translate-x-1/3 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <CheckCircle size={16} className="text-white" />
                </div>
              </div>

              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <PartyPopper size={18} className="opacity-80" />
                  <h1 className="text-2xl font-bold">Termin bestätigt!</h1>
                  <PartyPopper size={18} className="opacity-80 scale-x-[-1]" />
                </div>
                {name && <p className="text-white/75 text-sm mt-1">bei {name}</p>}
                <button
                  onClick={copyBookingNumber}
                  className="inline-flex items-center gap-1.5 text-white/60 text-xs mt-2 hover:text-white/90 transition-colors group"
                >
                  #{booking.bookingNumber}
                  {copied
                    ? <CheckIcon size={11} className="text-green-300" />
                    : <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                </button>
              </motion.div>
            </div>

            {/* Details */}
            <div className="bg-white p-6 space-y-4">

              {/* Date & Time */}
              <motion.div variants={slideUp} className="flex items-start gap-4 p-4 rounded-2xl" style={{ background: lightBg }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: withAlpha(primary, 0.15) }}>
                  <Calendar size={18} style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide font-medium">Datum & Uhrzeit</p>
                  <p className="font-semibold text-gray-800">{formatDate(booking.booking.bookingDate)}</p>
                  <p className="text-sm text-gray-500">{booking.booking.startTime} – {booking.booking.endTime} Uhr</p>
                </div>
              </motion.div>

              {/* Service */}
              <motion.div variants={slideUp} className="flex items-start gap-4 p-4 rounded-2xl" style={{ background: lightBg }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: withAlpha(primary, 0.15) }}>
                  <Sparkles size={18} style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide font-medium">Leistung</p>
                  <p className="font-semibold text-gray-800">{booking.booking.serviceName}</p>
                  <p className="text-sm font-medium" style={{ color: primary }}>
                    {booking.booking.price.toFixed(2)} {booking.booking.currency ?? "CHF"}
                  </p>
                </div>
              </motion.div>

              {/* Customer */}
              <motion.div variants={slideUp} className="flex items-start gap-4 p-4 rounded-2xl" style={{ background: lightBg }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: withAlpha(primary, 0.15) }}>
                  <User size={18} style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide font-medium">Gebucht von</p>
                  <p className="font-semibold text-gray-800">{booking.customer.firstName} {booking.customer.lastName}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Mail size={12} /> {booking.customer.email}
                  </p>
                </div>
              </motion.div>

              {/* Email notice */}
              <motion.div variants={slideUp}
                className="flex items-start gap-3 p-4 rounded-2xl border-2"
                style={{ borderColor: withAlpha(primary, 0.3), background: withAlpha(primary, 0.04) }}
              >
                <Mail size={16} className="flex-shrink-0 mt-0.5" style={{ color: primary }} />
                <p className="text-sm text-gray-600">
                  Eine Bestätigung wurde an <strong className="text-gray-800">{booking.customer.email}</strong> gesendet.
                </p>
              </motion.div>

              {/* Add to calendar */}
              <motion.div variants={slideUp} className="flex gap-2 pt-1">
                <a
                  href={buildGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
                  style={{ borderColor: withAlpha(primary, 0.35), color: primary, background: withAlpha(primary, 0.06) }}
                >
                  <Calendar size={14} /> Google Kalender
                </a>
                <button
                  onClick={downloadIcal}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
                  style={{ borderColor: withAlpha(primary, 0.35), color: primary, background: withAlpha(primary, 0.06) }}
                >
                  <Download size={14} /> iCal / Outlook
                </button>
              </motion.div>
            </div>
          </motion.div>

          {/* ── Back button ── */}
          <motion.div variants={slideUp} className="flex flex-col sm:flex-row gap-3">
            {slug && (
              <Link href={`/booking/${slug}`}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] text-white"
                style={{ background: primary, boxShadow: `0 4px 20px ${withAlpha(primary, 0.35)}` }}
              >
                <ArrowLeft size={15} /> Zurück zum Profil
              </Link>
            )}
            <Link href="/"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold border bg-white text-gray-600 hover:bg-gray-50 transition-all active:scale-[0.98]"
              style={{ borderColor: withAlpha(primary, 0.2) }}
            >
              Zur Startseite
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar, Clock, TrendingUp, TrendingDown, Users,
  Euro, Copy, Check, ExternalLink, Sparkles,
  ArrowUpRight, ChevronRight,
} from "lucide-react";
import { getDashboard, type DashboardOverview } from "@/lib/api/admin";
import { formatPrice } from "@/lib/utils/currency";
import { useAuth } from "@/lib/contexts/AuthContext";

// ── helpers ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  Confirmed:  { label: "Bestätigt",       dot: "bg-emerald-400", bg: "bg-emerald-50",  text: "text-emerald-700" },
  Pending:    { label: "Ausstehend",      dot: "bg-amber-400",   bg: "bg-amber-50",    text: "text-amber-700"   },
  Completed:  { label: "Abgeschlossen",   dot: "bg-[#017172]",   bg: "bg-teal-50",     text: "text-teal-700"    },
  Cancelled:  { label: "Storniert",       dot: "bg-red-400",     bg: "bg-red-50",      text: "text-red-600"     },
  NoShow:     { label: "Nicht erschienen",dot: "bg-gray-400",    bg: "bg-gray-100",    text: "text-gray-600"    },
};

function formatTime(mins: number) {
  if (mins < 60)   return `${mins} Min`;
  if (mins < 1440) return `${Math.floor(mins / 60)} Std`;
  const d = Math.floor(mins / 1440);
  return `${d} Tag${d > 1 ? "e" : ""}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Guten Morgen";
  if (h < 17) return "Guten Tag";
  return "Guten Abend";
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

// ── StatCard ──────────────────────────────────────────────────────────────
function StatCard({
  icon, value, label, growth, accent,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  growth?: number | null;
  accent: string;
}) {
  return (
    <motion.div variants={fadeUp}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
          {icon}
        </div>
        {growth != null && growth !== 0 && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${
            growth > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
          }`}>
            {growth > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(growth).toFixed(0)}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-[#1E1E1E] mb-1 tabular-nums">{value}</div>
      <div className="text-xs text-[#8A8A8A] font-medium">{label}</div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { user, isTenantAdmin } = useAuth();
  const [dashboard,        setDashboard]       = useState<DashboardOverview | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState<string | null>(null);
  const [copied,           setCopied]           = useState(false);
  const [defaultCurrency,  setDefaultCurrency]  = useState("EUR");

  useEffect(() => {
    getDashboard()
      .then(setDashboard)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    import("@/lib/api/client").then(({ default: api }) => {
      api.get("/tenant/settings").then((res) => {
        const d = res.data?.data ?? res.data;
        if (d?.defaultCurrency) setDefaultCurrency(d.defaultCurrency);
      }).catch(() => {});
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2EFED]">
        <div className="w-10 h-10 rounded-full border-4 border-[#017172] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2EFED] p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-sm">
          <p className="text-2xl mb-3">⚠️</p>
          <h2 className="text-lg font-bold text-[#1E1E1E] mb-2">Fehler beim Laden</h2>
          <p className="text-sm text-[#8A8A8A]">{error || "Dashboard nicht verfügbar"}</p>
        </div>
      </div>
    );
  }

  const { today, nextBooking, statistics } = dashboard;

  const revenueThis = defaultCurrency === "CHF" ? statistics.revenueThisMonthCHF  : statistics.revenueThisMonthEUR;
  const revenueLast = defaultCurrency === "CHF" ? statistics.revenueLastMonthCHF  : statistics.revenueLastMonthEUR;

  const monthGrowth   = statistics.totalBookingsLastMonth > 0
    ? ((statistics.totalBookingsThisMonth - statistics.totalBookingsLastMonth) / statistics.totalBookingsLastMonth) * 100 : 0;
  const revenueGrowth = revenueLast > 0
    ? ((revenueThis - revenueLast) / revenueLast) * 100 : 0;

  const todayDate = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div className="min-h-screen bg-[#F2EFED]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* ── Header ───────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-xs text-[#8A8A8A] font-medium mb-0.5">{todayDate}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">
            {greeting()}{user?.firstName ? `, ${user.firstName}` : ""}! 👋
          </h1>
          <p className="text-sm text-[#8A8A8A] mt-1">Hier ist deine heutige Übersicht.</p>
        </motion.div>

        {/* ── Booking Link Banner ───────────────────────────────────── */}
        {isTenantAdmin && user?.tenantSlug && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl p-5 text-white"
            style={{ background: "linear-gradient(135deg, #017172 0%, #01a0a2 50%, #01b8ba 100%)" }}
          >
            {/* Decorative blobs */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/8 rounded-full" />

            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ExternalLink size={14} className="opacity-70" />
                  <p className="text-white/70 text-xs font-medium">Dein Buchungslink</p>
                </div>
                <p className="text-white font-mono text-sm sm:text-base font-semibold truncate">
                  {typeof window !== "undefined" ? window.location.origin : ""}/booking/{user.tenantSlug}
                </p>
                {user.tenantName && <p className="text-white/50 text-xs mt-0.5">{user.tenantName}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/booking/${user.tenantSlug}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors backdrop-blur-sm"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Kopiert!" : "Kopieren"}
                </button>
                <a
                  href={`/booking/${user.tenantSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-white text-[#017172] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors shadow-sm"
                >
                  <ArrowUpRight size={14} /> Öffnen
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Stat Cards ────────────────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          variants={stagger} initial="hidden" animate="visible"
        >
          <StatCard
            icon={<Calendar size={20} style={{ color: "#017172" }} />}
            value={statistics.totalBookingsThisMonth}
            label="Buchungen diesen Monat"
            growth={monthGrowth}
            accent="#017172"
          />
          <StatCard
            icon={<Euro size={20} style={{ color: "#E8C7C3" }} />}
            value={formatPrice(revenueThis, defaultCurrency)}
            label={`Umsatz ${defaultCurrency} diesen Monat`}
            growth={revenueGrowth}
            accent="#D8B0AC"
          />
          <StatCard
            icon={<Users size={20} style={{ color: "#8B5CF6" }} />}
            value={statistics.totalCustomers}
            label={`Kunden gesamt (${statistics.newCustomersThisMonth} neu)`}
            growth={null}
            accent="#8B5CF6"
          />
        </motion.div>

        {/* ── Main Grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Today Column ─────────────────────────────────────── */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div>
                  <h2 className="text-base font-bold text-[#1E1E1E]">Heute</h2>
                  <p className="text-xs text-[#8A8A8A]">{todayDate}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#8A8A8A]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </div>
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-4 divide-x divide-gray-50 border-b border-gray-50">
                {[
                  { value: today.totalBookings,     label: "Gesamt",     color: "text-[#1E1E1E]",  bg: "" },
                  { value: today.completedBookings, label: "Erledigt",   color: "text-emerald-600", bg: "bg-emerald-50/50" },
                  { value: today.pendingBookings,   label: "Ausstehend", color: "text-amber-600",   bg: "bg-amber-50/50" },
                  { value: today.cancelledBookings, label: "Storniert",  color: "text-red-400",     bg: "bg-red-50/30" },
                ].map(({ value, label, color, bg }) => (
                  <div key={label} className={`text-center py-4 px-2 ${bg}`}>
                    <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
                    <div className="text-[11px] text-[#8A8A8A] mt-0.5 font-medium">{label}</div>
                  </div>
                ))}
              </div>

              {/* Bookings list */}
              <div className="p-5">
                {today.bookings.length > 0 ? (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
                    {today.bookings.map((b, i) => {
                      const s = STATUS_MAP[b.status] ?? STATUS_MAP["Pending"];
                      return (
                        <motion.div
                          key={b.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-4 p-3.5 rounded-xl bg-[#F8F6F5] hover:bg-[#F2EFED] transition-colors border border-transparent hover:border-gray-100"
                        >
                          {/* Time */}
                          <div className="text-center min-w-[52px]">
                            <div className="text-sm font-bold text-[#1E1E1E] tabular-nums">{b.startTime}</div>
                            <div className="text-[11px] text-[#8A8A8A]">{b.endTime}</div>
                          </div>
                          {/* Status dot */}
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#1E1E1E] truncate">{b.customerName}</p>
                            <p className="text-xs text-[#8A8A8A] truncate">{b.serviceName}</p>
                          </div>
                          {/* Status badge */}
                          <span className={`hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text} whitespace-nowrap`}>
                            {s.label}
                          </span>
                          {/* Price */}
                          <div className="text-right min-w-[64px]">
                            <div className="text-sm font-bold text-[#017172] tabular-nums">{formatPrice(b.price, b.currency)}</div>
                            <div className="text-[10px] text-[#8A8A8A] font-mono">{b.bookingNumber.slice(-6)}</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 bg-[#F2EFED] rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Calendar size={22} className="text-[#E8C7C3]" />
                    </div>
                    <p className="text-sm font-medium text-[#8A8A8A]">Keine Termine heute</p>
                    <p className="text-xs text-[#8A8A8A]/60 mt-1">Genieße den freien Tag!</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Right Column ────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Next Booking */}
            {nextBooking ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#017172]/10 flex items-center justify-center">
                    <Clock size={16} className="text-[#017172]" />
                  </div>
                  <h3 className="font-bold text-[#1E1E1E] text-sm">Nächster Termin</h3>
                </div>
                <div className="p-5">
                  {/* Countdown */}
                  <div className="text-center mb-4 py-4 bg-gradient-to-br from-[#017172]/8 to-[#01a0a2]/5 rounded-xl border border-[#017172]/10">
                    <div className="text-4xl font-black text-[#017172] tabular-nums">
                      {formatTime(nextBooking.minutesUntil)}
                    </div>
                    <div className="text-xs text-[#8A8A8A] mt-1">bis zum nächsten Termin</div>
                  </div>
                  {/* Details */}
                  <div className="space-y-2.5">
                    {[
                      { label: "Service",  value: nextBooking.serviceName },
                      { label: "Kunde",    value: nextBooking.customerName },
                      { label: "Uhrzeit",  value: `${nextBooking.startTime} – ${nextBooking.endTime}` },
                      { label: "Datum",    value: new Date(nextBooking.date).toLocaleDateString("de-DE") },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <span className="text-xs text-[#8A8A8A] flex-shrink-0">{label}</span>
                        <span className="text-xs font-semibold text-[#1E1E1E] text-right truncate">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center"
              >
                <div className="w-12 h-12 bg-[#F2EFED] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles size={20} className="text-[#E8C7C3]" />
                </div>
                <p className="text-sm font-medium text-[#8A8A8A]">Kein bevorstehender Termin</p>
              </motion.div>
            )}

            {/* Popular Services */}
            {statistics.popularServices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-bold text-[#1E1E1E] text-sm">Beliebte Services</h3>
                </div>
                <div className="p-3">
                  {statistics.popularServices.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F8F6F5] transition-colors">
                      {/* Rank */}
                      <span className="text-xs font-bold text-[#8A8A8A] w-4 text-center">{idx + 1}</span>
                      {/* Service */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1E1E1E] truncate">{s.serviceName}</p>
                        <p className="text-xs text-[#8A8A8A]">{s.bookingCount}× gebucht</p>
                      </div>
                      {/* Revenue */}
                      <span className="text-sm font-bold text-[#017172] whitespace-nowrap">
                        {formatPrice(defaultCurrency === "CHF" ? s.revenueCHF : s.revenueEUR, defaultCurrency)}
                      </span>
                      <ChevronRight size={13} className="text-gray-200 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

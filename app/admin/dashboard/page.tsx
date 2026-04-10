// app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardBody } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { Calendar, Clock, TrendingUp, TrendingDown, Users, Euro, Copy, Check, ExternalLink } from "lucide-react";
import { getDashboard, type DashboardOverview } from "@/lib/api/admin";
import { formatPrice } from "@/lib/utils/currency";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function AdminDashboardPage() {
  const { user, isTenantAdmin } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState<string>('EUR');

  useEffect(() => {
    loadDashboard();
    // Fetch tenant settings to get defaultCurrency
    import('@/lib/api/client').then(({ default: api }) => {
      api.get('/tenant/settings').then((res) => {
        const data = res.data?.data ?? res.data;
        if (data?.defaultCurrency) setDefaultCurrency(data.defaultCurrency);
      }).catch(() => {/* ignore */});
    });
  }, []);

  async function loadDashboard() {
    try {
      const data = await getDashboard();
      setDashboard(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#017172]" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border-2 border-[#E8C7C3]/20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] mb-2">Fehler</h1>
          <p className="text-[#8A8A8A] mb-6">
            {error || "Dashboard konnte nicht geladen werden"}
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed": return "success";
      case "Pending": return "warning";
      case "Completed": return "primary";
      case "Cancelled": return "danger";
      case "NoShow": return "default";
      default: return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Confirmed": return "Bestätigt";
      case "Pending": return "Ausstehend";
      case "Completed": return "Abgeschlossen";
      case "Cancelled": return "Storniert";
      case "NoShow": return "Nicht erschienen";
      default: return status;
    }
  };

  const formatTime = (minutesUntil: number) => {
    if (minutesUntil < 60) return `${minutesUntil} Min`;
    if (minutesUntil < 1440) return `${Math.floor(minutesUntil / 60)} Std`;
    return `${Math.floor(minutesUntil / 1440)} Tag${Math.floor(minutesUntil / 1440) > 1 ? "e" : ""}`;
  };

  const { today, nextBooking, statistics } = dashboard;

  const monthGrowth =
    statistics.totalBookingsLastMonth > 0
      ? ((statistics.totalBookingsThisMonth - statistics.totalBookingsLastMonth) /
        statistics.totalBookingsLastMonth) *
      100
      : 0;

  const revenueThisMonth = defaultCurrency === 'CHF' ? statistics.revenueThisMonthCHF : statistics.revenueThisMonthEUR;
  const revenueLastMonth = defaultCurrency === 'CHF' ? statistics.revenueLastMonthCHF : statistics.revenueLastMonthEUR;

  const revenueGrowth =
    revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E] mb-1">Dashboard</h1>
          <p className="text-sm text-[#8A8A8A]">Übersicht und Statistiken</p>
        </div>

        {/* ── Booking Link Banner ─────────────────────────────────────────── */}
        {isTenantAdmin && user?.tenantSlug && (
          <div className="mb-6 sm:mb-8 bg-gradient-to-r from-[#017172] to-[#01a0a2] rounded-2xl p-5 sm:p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs sm:text-sm font-medium mb-1">Ihr Buchungslink</p>
                <div className="flex items-center gap-2 min-w-0">
                  <code className="text-white text-sm sm:text-base font-mono truncate">
                    /booking/{user.tenantSlug}
                  </code>
                </div>
                {user.tenantName && (
                  <p className="text-white/60 text-xs mt-1">{user.tenantName}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/booking/${user.tenantSlug}`;
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "Kopiert!" : "Kopieren"}
                </button>
                <a
                  href={`/booking/${user.tenantSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-white text-[#017172] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors"
                >
                  <ExternalLink size={15} />
                  Öffnen
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
          initial="hidden" animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {[
            {
              icon: <Calendar className="text-[#017172]" size={20} />,
              value: statistics.totalBookingsThisMonth,
              label: "Buchungen diesen Monat",
              badge: monthGrowth !== 0 ? { pct: monthGrowth } : null,
            },
            {
              icon: <Euro className="text-[#017172]" size={20} />,
              value: formatPrice(revenueThisMonth, defaultCurrency),
              label: `Umsatz ${defaultCurrency} diesen Monat`,
              badge: revenueGrowth !== 0 ? { pct: revenueGrowth } : null,
            },
            {
              icon: <Users className="text-[#017172]" size={20} />,
              value: statistics.totalCustomers,
              label: `Gesamt Kunden (${statistics.newCustomersThisMonth} neu)`,
              badge: null,
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } } }}
            >
              <Card className="border border-[#E8C7C3]/30 shadow-xl h-full">
                <CardBody className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-[#017172]/10 rounded-lg">{card.icon}</div>
                    {card.badge && (
                      <div className={`flex items-center gap-1 text-xs sm:text-sm ${card.badge.pct > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {card.badge.pct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span className="font-semibold">{Math.abs(card.badge.pct).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#1E1E1E] mb-1">{card.value}</div>
                  <div className="text-xs sm:text-sm text-[#8A8A8A]">{card.label}</div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Main Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Today */}
          <div className="lg:col-span-2">
            <Card className="border border-[#E8C7C3]/30 shadow-xl h-full">
              <CardBody className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[#1E1E1E] mb-4 sm:mb-6">Heute</h2>

                {/* Mini stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="text-center p-3 sm:p-4 bg-[#F5EDEB] rounded-lg border border-[#E8C7C3]/30">
                    <div className="text-xl sm:text-2xl font-bold text-[#1E1E1E]">{today.totalBookings}</div>
                    <div className="text-xs sm:text-sm text-[#8A8A8A]">Gesamt</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-[#F5EDEB] rounded-lg border border-[#017172]/20">
                    <div className="text-xl sm:text-2xl font-bold text-[#017172]">{today.completedBookings}</div>
                    <div className="text-xs sm:text-sm text-[#8A8A8A]">Erledigt</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="text-xl sm:text-2xl font-bold text-amber-600">{today.pendingBookings}</div>
                    <div className="text-xs sm:text-sm text-amber-500 font-medium">Ausstehend</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="text-xl sm:text-2xl font-bold text-red-400">{today.cancelledBookings}</div>
                    <div className="text-xs sm:text-sm text-red-400 font-medium">Storniert</div>
                  </div>
                </div>

                {/* Appointment list */}
                {today.bookings.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-[#1E1E1E] text-sm sm:text-base mb-2 sm:mb-3">
                      Heutige Termine
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {today.bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-[#F5EDEB] rounded-lg border border-[#E8C7C3]/30 hover:border-[#017172]/30 transition-colors gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="font-semibold text-[#1E1E1E] text-sm sm:text-base">
                                {booking.startTime}
                              </span>
                              <span className="text-[#8A8A8A] text-xs sm:text-sm">–</span>
                              <span className="text-[#8A8A8A] text-xs sm:text-sm">{booking.endTime}</span>
                              <Chip color={getStatusColor(booking.status)} size="sm" variant="flat" className="ml-0 sm:ml-2">
                                {getStatusLabel(booking.status)}
                              </Chip>
                            </div>
                            <div className="text-[#1E1E1E] font-medium text-sm sm:text-base break-words">
                              {booking.customerName}
                            </div>
                            <div className="text-xs sm:text-sm text-[#8A8A8A] break-words">
                              {booking.serviceName}
                            </div>
                          </div>
                          <div className="text-right flex sm:block justify-between items-center">
                            <div className="font-bold text-[#017172] text-base sm:text-lg">
                              {formatPrice(booking.price, booking.currency)}
                            </div>
                            <div className="text-xs text-[#8A8A8A] font-mono">
                              {booking.bookingNumber.slice(-6)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 text-[#8A8A8A]">
                    <Calendar className="mx-auto mb-4 text-[#E8C7C3]" size={40} />
                    <p className="text-sm sm:text-base">Keine Termine für heute</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Next Booking */}
            {nextBooking && (
              <Card className="border border-[#E8C7C3]/30 shadow-xl">
                <CardBody className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="p-2 bg-[#017172]/10 rounded-lg">
                      <Clock className="text-[#017172]" size={18} />
                    </div>
                    <h3 className="font-bold text-[#1E1E1E] text-base sm:text-lg">Nächster Termin</h3>
                  </div>
                  <div className="mb-3 sm:mb-4">
                    <div className="text-2xl sm:text-3xl font-bold text-[#017172] mb-1">
                      {formatTime(nextBooking.minutesUntil)}
                    </div>
                    <div className="text-xs sm:text-sm text-[#8A8A8A]">bis zum nächsten Termin</div>
                  </div>
                  <div className="space-y-2 bg-[#F5EDEB] p-3 sm:p-4 rounded-lg border border-[#E8C7C3]/30">
                    {[
                      { label: "Service", value: nextBooking.serviceName },
                      { label: "Kunde", value: nextBooking.customerName },
                      { label: "Zeit", value: `${nextBooking.startTime} – ${nextBooking.endTime}`, nowrap: true },
                      { label: "Datum", value: new Date(nextBooking.date).toLocaleDateString("de-DE"), nowrap: true },
                    ].map(({ label, value, nowrap }) => (
                      <div key={label} className="flex justify-between gap-2">
                        <span className="text-xs sm:text-sm text-[#8A8A8A] shrink-0">{label}:</span>
                        <span className={`text-xs sm:text-sm font-semibold text-[#1E1E1E] text-right ${nowrap ? "whitespace-nowrap" : "break-words"}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Popular Services */}
            {statistics.popularServices.length > 0 && (
              <Card className="border border-[#E8C7C3]/30 shadow-xl">
                <CardBody className="p-4 sm:p-6">
                  <h3 className="font-bold text-[#1E1E1E] text-base sm:text-lg mb-3 sm:mb-4">
                    Beliebte Services
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {statistics.popularServices.map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 sm:p-3 bg-[#F5EDEB] rounded-lg border border-[#E8C7C3]/30 gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#1E1E1E] text-sm sm:text-base break-words">
                            {service.serviceName}
                          </div>
                          <div className="text-xs sm:text-sm text-[#8A8A8A]">
                            {service.bookingCount} Buchungen
                          </div>
                        </div>
                        <div className="font-bold text-[#017172] text-sm sm:text-base whitespace-nowrap text-right">
                          {formatPrice(
                            defaultCurrency === "CHF" ? service.revenueCHF : service.revenueEUR,
                            defaultCurrency
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2, Clock, CheckCircle, AlertCircle, Calendar, Plus,
  TrendingUp, Users, Mail, Activity, AlertTriangle, Zap, ArrowRight,
  RefreshCw, XCircle, UserPlus, Bell, Euro,
} from 'lucide-react';
import { superAdminApi, TenantListItem, ActivityItem, OverviewData, SubscriptionRequestItem, AtRiskDunningItem } from '@/lib/api/superadmin';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { HelpTip } from '@/components/ui/help-tip';

interface Stats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  activeSubscriptions: number;
  expiredTenants: number;
  totalBookings: number;
  mrr?: number;
  planDistribution?: { plan: string; count: number; monthlyPrice: number }[];
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  building:  <Building2 size={14} />,
  check:     <CheckCircle size={14} />,
  ban:       <XCircle size={14} />,
  zap:       <Zap size={14} />,
  calendar:  <Calendar size={14} />,
  user:      <UserPlus size={14} />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  TenantCreated:    'bg-blue-100 text-blue-600',
  TenantActivated:  'bg-green-100 text-green-600',
  TenantDeactivated:'bg-red-100 text-red-600',
  TrialExtended:    'bg-amber-100 text-amber-600',
  BookingCreated:   'bg-purple-100 text-purple-600',
  UserCreated:      'bg-teal-100 text-teal-600',
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'gerade eben';
  if (diff < 3600) return `vor ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `vor ${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

export default function SuperAdminDashboard() {
  const [stats,          setStats]          = useState<Stats | null>(null);
  const [tenants,        setTenants]        = useState<TenantListItem[]>([]);
  const [activity,       setActivity]       = useState<ActivityItem[]>([]);
  const [overview,       setOverview]       = useState<OverviewData | null>(null);
  const [pendingRequests,setPendingRequests] = useState<SubscriptionRequestItem[]>([]);
  const [dunning,        setDunning]        = useState<AtRiskDunningItem[]>([]);
  const [aiUsage,        setAiUsage]        = useState<Awaited<ReturnType<typeof superAdminApi.getAiUsage>> | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [loadError,      setLoadError]      = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const [s, t, a, ov, req, risk, ai] = await Promise.all([
        superAdminApi.getStats(),
        superAdminApi.getTenants(1, 100),
        superAdminApi.getActivity(20),
        superAdminApi.getOverview(),
        superAdminApi.getSubscriptionRequests('Pending').catch(() => ({ data: [], pendingCount: 0 })),
        superAdminApi.getAtRiskSubscriptions().catch(() => ({ cancelling: [], dunning: [], totalAtRisk: 0 })),
        superAdminApi.getAiUsage().catch(() => null),
      ]);
      setStats(s);
      setTenants(t.items);
      setActivity(a);
      setOverview(ov);
      setPendingRequests(req.data);
      setDunning(risk.dunning);
      setAiUsage(ai);
    } catch (err: any) {
      setLoadError(err.response?.data?.message || err.message || 'Daten konnten nicht geladen werden');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const expiringSoon = tenants.filter(
    t => t.subscription?.isInTrial && (t.subscription.trialDaysRemaining ?? 99) <= 7
  );
  const planCounts = {
    Trial:        tenants.filter(t => t.subscription?.isInTrial).length,
    Starter:      tenants.filter(t => t.subscription?.plan === 'Starter' && !t.subscription?.isInTrial).length,
    Professional: tenants.filter(t => t.subscription?.plan === 'Professional' && !t.subscription?.isInTrial).length,
    Agency:       tenants.filter(t => t.subscription?.plan === 'Agency' && !t.subscription?.isInTrial).length,
  };

  const recentTenants = [...tenants]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statCards: { label: string; value: number; icon: React.ReactNode; accent: string; bg: string; help: string; suffix?: string }[] = stats ? [
    { label: 'MRR',               value: stats.mrr ?? 0,           icon: <TrendingUp size={18} />, accent: '#16a34a', bg: '#f0fdf4', suffix: ' €', help: 'Monatlich wiederkehrender Umsatz: Summe der Monatspreise aller aktiven Abos' },
    { label: 'Systeme gesamt',    value: stats.totalTenants,       icon: <Building2 size={18} />, accent: '#3b82f6', bg: '#eff6ff', help: 'Alle registrierten Buchungssysteme auf der Plattform (aktiv + inaktiv)' },
    { label: 'Aktiv',             value: stats.activeTenants,      icon: <CheckCircle size={18} />, accent: '#22c55e', bg: '#f0fdf4', help: 'Systeme die aktuell aktiv sind und von Kunden genutzt werden können' },
    { label: 'Im Trial',          value: stats.trialTenants,       icon: <Clock size={18} />, accent: '#eab308', bg: '#fefce8', help: 'Systeme die sich noch in der kostenlosen 14-Tage-Testphase befinden' },
    { label: 'Aktive Abos',       value: stats.activeSubscriptions,icon: <TrendingUp size={18} />, accent: '#8b5cf6', bg: '#f5f3ff', help: 'Systeme mit einem bezahlten und aktiven Abonnement (Starter, Pro oder Agency)' },
    { label: 'Abgelaufen',        value: stats.expiredTenants,     icon: <AlertCircle size={18} />, accent: '#ef4444', bg: '#fef2f2', help: 'Systeme deren Trial oder Abo abgelaufen ist — kein Kundenzugang mehr möglich' },
    { label: 'Buchungen gesamt',  value: stats.totalBookings,      icon: <Calendar size={18} />, accent: '#06b6d4', bg: '#ecfeff', help: 'Gesamtzahl aller Buchungen über alle Systeme und alle Zeiten hinweg' },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 -m-8 p-8 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plattform-Übersicht</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            aria-label="Dashboard aktualisieren"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors shadow-sm border border-gray-100"
          >
            <RefreshCw size={16} />
          </button>
          <Link
            href="/superadmin/tenants/new"
            className="flex items-center gap-2 bg-[#6355E4] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#5646D6] transition-colors shadow-sm"
          >
            <Plus size={15} />
            Neues System
          </Link>
        </div>
      </div>

      {/* ── Fehlerzustand ──────────────────────────────────────────────── */}
      {!loading && loadError && (
        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Daten konnten nicht geladen werden</p>
              <p className="text-xs text-gray-400">{loadError}</p>
            </div>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#6355E4] text-white text-xs font-semibold hover:bg-[#5646D6] transition-colors"
            aria-label="Daten neu laden"
          >
            <RefreshCw size={13} /> Erneut versuchen
          </button>
        </div>
      )}

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
          {statCards.map(({ label, value, icon, accent, bg, help, suffix }) => (
            <GlowingEffect key={label} glowColor={accent} spread={45}>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 relative z-[1] hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: bg }}>
                  <span style={{ color: accent }}>{icon}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 leading-none">
                  <AnimatedNumber value={value} duration={1.4} />{suffix ?? ''}
                </p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  {label}
                  <HelpTip text={help} />
                </p>
                {label === 'MRR' && (
                  <Link href="/superadmin/revenue" className="text-[11px] text-blue-500 hover:underline mt-1 inline-flex items-center gap-1">
                    Tatsächlicher Umsatz →
                  </Link>
                )}
              </div>
            </GlowingEffect>
          ))}
        </div>
      )}

      {/* ── Trial-Alarm ────────────────────────────────────────────────── */}
      {!loading && expiringSoon.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <h2 className="font-semibold text-gray-800 text-sm">
                {expiringSoon.length} {expiringSoon.length === 1 ? 'System' : 'Systeme'} — Trial läuft bald ab
              </h2>
            </div>
            <Link href="/superadmin/tenants" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
              Alle anzeigen <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {expiringSoon.map(t => (
              <Link
                key={t.id}
                href={`/superadmin/tenants/${t.id}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors hover:shadow-sm ${
                  (t.subscription?.trialDaysRemaining ?? 99) <= 2
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                <AlertTriangle size={13} />
                {t.companyName || t.name}
                <span className="font-bold">{t.subscription?.trialDaysRemaining}d</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Mahnwesen-Alarm ────────────────────────────────────────────── */}
      {!loading && dunning.length > 0 && (
        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <h2 className="font-semibold text-gray-800 text-sm">
                {dunning.length} {dunning.length === 1 ? 'Kunde' : 'Kunden'} mit fehlgeschlagener Zahlung
              </h2>
            </div>
            <Link href="/superadmin/at-risk" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
              Alle anzeigen <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {dunning.slice(0, 6).map(d => (
              <Link
                key={d.tenantId}
                href={`/superadmin/tenants/${d.tenantId}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors hover:shadow-sm ${
                  d.daysUntilAutoCancel <= 2 ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                <AlertTriangle size={13} />
                {d.companyName}
                <span className="font-bold">noch {d.daysUntilAutoCancel}d</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Plan-Verteilung ────────────────────────────────────────────── */}
      {!loading && tenants.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { plan: 'Trial',        count: planCounts.Trial,        color: '#6b7280', bg: '#f3f4f6', label: 'Im Trial' },
            { plan: 'Starter',      count: planCounts.Starter,      color: '#3b82f6', bg: '#eff6ff', label: 'Starter (€29)' },
            { plan: 'Professional', count: planCounts.Professional, color: '#8b5cf6', bg: '#f5f3ff', label: 'Pro (€59)' },
            { plan: 'Agency',       count: planCounts.Agency,       color: '#f59e0b', bg: '#fffbeb', label: 'Agency (auf Anfrage)' },
          ].map(({ plan, count, color, bg, label }) => (
            <div
              key={plan}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: bg, color }}
              >
                {count}
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-700">{plan}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── KI-Nutzungskosten (30 Tage) — Grundlage für Agency-Preisverhandlung ──── */}
      {!loading && aiUsage && aiUsage.tenants.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">KI-Kosten (letzte 30 Tage)</h2>
            <span className="text-sm font-bold text-gray-900">
              ${aiUsage.totalCostLast30Days.toFixed(2)}
            </span>
          </div>
          <div className="space-y-1.5">
            {aiUsage.tenants.slice(0, 8).map((t) => (
              <div key={t.tenantId} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-700 font-medium truncate">{t.tenantName}</span>
                <span className="text-gray-400 flex-shrink-0 ml-2">{t.totalCalls} Anfragen · ${t.totalCost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Abo-Anfragen ───────────────────────────────────────────────── */}
      {!loading && pendingRequests.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                <Bell size={15} className="text-amber-500" />
                {pendingRequests.length} offene {pendingRequests.length === 1 ? 'Abo-Anfrage' : 'Abo-Anfragen'}
              </h2>
            </div>
            <Link href="/superadmin/requests" className="text-xs text-[#6355E4] hover:underline flex items-center gap-1 font-medium">
              Alle verwalten <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingRequests.slice(0, 5).map(r => (
              <Link
                key={r.id}
                href={`/superadmin/requests`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm font-medium transition-colors hover:shadow-sm"
              >
                <Bell size={13} />
                {r.tenantName}
                <span className="text-xs bg-[#6355E4] text-white px-1.5 py-0.5 rounded-md font-semibold">{r.requestedPlan}</span>
              </Link>
            ))}
            {pendingRequests.length > 5 && (
              <Link href="/superadmin/requests" className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
                +{pendingRequests.length - 5} weitere
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      {!loading && overview && (() => {
        const maxBookings  = Math.max(...overview.monthlyData.map(m => m.bookings), 1);
        const maxTenants   = Math.max(...overview.monthlyData.map(m => m.newTenants), 1);
        const emailTotal   = overview.emailStats.sent + overview.emailStats.failed;
        const emailRate    = emailTotal > 0 ? Math.round((overview.emailStats.sent / emailTotal) * 100) : 100;

        return (
          <div className="space-y-4">
            {/* Bar charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Buchungen Chart */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-4">
                  <Calendar size={16} className="text-blue-400" />
                  Buchungen – letzte 6 Monate
                </h2>
                <div className="flex items-end justify-between gap-2 h-24">
                  {overview.monthlyData.map((m, i) => {
                    const h = Math.max(4, Math.round((m.bookings / maxBookings) * 80));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-semibold text-gray-500">{m.bookings || ''}</span>
                        <div
                          className="w-full rounded-t-md bg-blue-500 transition-all"
                          style={{ height: `${h}px` }}
                          title={`${m.bookings} Buchungen`}
                        />
                        <span className="text-[9px] text-gray-400 truncate w-full text-center">{m.label}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Gesamt: <span className="font-semibold text-gray-700">{overview.monthlyData.reduce((s, m) => s + m.bookings, 0)}</span> Buchungen in 6 Monaten
                </p>
              </div>

              {/* Neue Systeme Chart */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-4">
                  <Building2 size={16} className="text-teal-400" />
                  Neue Systeme – letzte 6 Monate
                </h2>
                <div className="flex items-end justify-between gap-2 h-24">
                  {overview.monthlyData.map((m, i) => {
                    const h = Math.max(4, Math.round((m.newTenants / maxTenants) * 80));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-semibold text-gray-500">{m.newTenants || ''}</span>
                        <div
                          className="w-full rounded-t-md bg-teal-500 transition-all"
                          style={{ height: `${h}px` }}
                          title={`${m.newTenants} neue Systeme`}
                        />
                        <span className="text-[9px] text-gray-400 truncate w-full text-center">{m.label}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Gesamt: <span className="font-semibold text-gray-700">{overview.monthlyData.reduce((s, m) => s + m.newTenants, 0)}</span> neue Systeme in 6 Monaten
                </p>
              </div>
            </div>

            {/* Email Health + Top Tenants */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* E-Mail Gesundheit */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-4">
                  <Mail size={16} className="text-purple-400" />
                  E-Mail Gesundheit
                </h2>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-3xl font-bold ${emailRate >= 95 ? 'text-green-600' : emailRate >= 80 ? 'text-amber-500' : 'text-red-500'}`}>
                    {emailRate}%
                  </span>
                  <span className="text-sm text-gray-400">Erfolgsrate</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all ${emailRate >= 95 ? 'bg-green-500' : emailRate >= 80 ? 'bg-amber-400' : 'bg-red-500'}`}
                    style={{ width: `${emailRate}%` }}
                  />
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span><span className="font-semibold text-gray-700">{overview.emailStats.sent.toLocaleString('de-DE')}</span> Gesendet</span>
                  <span><span className="font-semibold text-red-500">{overview.emailStats.failed.toLocaleString('de-DE')}</span> Fehler</span>
                  {overview.emailStats.pending > 0 && (
                    <span><span className="font-semibold text-amber-500">{overview.emailStats.pending}</span> Ausstehend</span>
                  )}
                </div>
              </div>

              {/* Top Systeme */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-amber-400" />
                  Top Systeme nach Buchungen
                </h2>
                {overview.topTenants.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Noch keine Daten</p>
                ) : (
                  <div className="space-y-2">
                    {overview.topTenants.map((t, i) => {
                      const maxCount = overview.topTenants[0]?.bookingCount ?? 1;
                      const pct = Math.round((t.bookingCount / maxCount) * 100);
                      return (
                        <Link
                          key={t.tenantId}
                          href={`/superadmin/tenants/${t.tenantId}`}
                          className="flex items-center gap-3 group hover:bg-gray-50 rounded-lg px-1 py-1 transition-colors"
                        >
                          <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">{t.companyName}</p>
                              <span className="text-xs font-semibold text-gray-500 ml-2 flex-shrink-0">{t.bookingCount}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Main Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Neueste Registrierungen */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Building2 size={16} className="text-gray-400" />
              Neueste Systeme
            </h2>
            <Link href="/superadmin/tenants" className="text-xs text-blue-500 hover:underline">
              Alle →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : recentTenants.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Noch keine Systeme</p>
          ) : (
            <div className="space-y-2">
              {recentTenants.map(t => {
                const isNew = (Date.now() - new Date(t.createdAt).getTime()) < 7 * 86400_000;
                return (
                  <Link
                    key={t.id}
                    href={`/superadmin/tenants/${t.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: t.primaryColor || '#6355E4' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-900 truncate">{t.companyName || t.name}</p>
                        {isNew && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-semibold">NEU</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{timeAgo(t.createdAt)}</p>
                    </div>
                    <ArrowRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Aktivitäts-Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Activity size={16} className="text-gray-400" />
              Aktivitäten
            </h2>
            <Link href="/superadmin/activity" className="text-xs text-blue-500 hover:underline">
              Alle →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Noch keine Aktivitäten</p>
          ) : (
            <div className="space-y-1">
              {activity.slice(0, 10).map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${ACTIVITY_COLORS[item.type] ?? 'bg-gray-100 text-gray-500'}`}>
                    {ACTIVITY_ICONS[item.icon] ?? <Activity size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium leading-tight">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
                  </div>
                  <span className="text-xs text-gray-300 flex-shrink-0 mt-0.5">{timeAgo(item.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Schnellzugriff ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/superadmin/tenants/new', icon: <Plus size={18} />, label: 'Neues System', sub: 'In 2 Minuten anlegen', color: 'text-gray-600' },
          { href: '/superadmin/tenants',     icon: <Building2 size={18} />, label: 'Alle Systeme', sub: 'Verwalten & bearbeiten', color: 'text-blue-500' },
          { href: '/superadmin/pricing',     icon: <Euro size={18} />, label: 'Preise', sub: 'Plan-Preise anpassen', color: 'text-amber-500' },
          { href: '/superadmin/email-logs',  icon: <Mail size={18} />, label: 'E-Mail Logs', sub: 'Versandstatus prüfen', color: 'text-purple-500' },
          { href: '/superadmin/activity',    icon: <Activity size={18} />, label: 'Aktivitäten', sub: 'Plattform-Ereignisse', color: 'text-teal-500' },
        ].map(({ href, icon, label, sub, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group shadow-sm"
          >
            <div className={`w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors ${color}`}>
              {icon}
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

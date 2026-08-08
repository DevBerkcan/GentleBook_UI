"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, BookOpen, Ban, LogOut,
  Users, Scissors, Settings, CreditCard, Link2,
  BarChart3, Menu, X, ChevronRight, ChevronLeft, MessageSquare, Inbox, ClipboardList, Bot, KeyRound, Star, FileText as IntakeIcon, Ticket,
} from "lucide-react";
import { GentleBookMark } from "@/components/admin/GentleBookLogo";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/contexts/AuthContext";
import { legalConfig } from "@/lib/config";
import api from "@/lib/api/client";
import { resolveLogoUrl } from "@/lib/utils/logo";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const COLLAPSE_KEY = "admin-sidebar-collapsed";

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, employee, logout, isAuthenticated, isTenantAdmin, isLocationAdmin, isEmployee } = useAuth();
  const { t, lang, setLang } = useTranslation();
  const [logoUrl, setLogoUrl]         = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [industryType, setIndustryType] = useState<string | null>(null);

  useEffect(() => {
    if (isTenantAdmin) {
      api.get("/tenant/settings").then((res) => {
        const d = res.data?.data ?? res.data;
        if (d?.logoUrl)     setLogoUrl(d.logoUrl);
        if (d?.companyName) setCompanyName(d.companyName);
        if (d?.industryType) setIndustryType(d.industryType);
      }).catch(() => {});
    }
  }, [isTenantAdmin]);

  // Mirrors Configuration/IntakeFormIndustryGate.cs — "Formulare" only makes sense for
  // industries that actually do a consultation before treatment.
  const INTAKE_FORM_INDUSTRIES = ["Beauty", "Hairdresser", "Nail", "Barbershop", "Tattoo", "Massage"];
  const showIntakeForm = industryType == null || INTAKE_FORM_INDUSTRIES.includes(industryType);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "true");
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--admin-sidebar-width", collapsed ? "72px" : "230px");
  }, [collapsed]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  if (!isAuthenticated) return null;

  const EMPLOYEE_NAV = [
    {
      label: t.admin.myArea,
      items: [
        { href: "/admin/employee-dashboard", label: "Mein Bereich",       icon: LayoutDashboard },
        { href: "/admin/calendar",           label: t.admin.myCalendar,   icon: Calendar },
        { href: "/admin/bookings",           label: t.admin.bookings,     icon: BookOpen },
        { href: "/admin/blocked-slots",      label: t.admin.absences,     icon: Ban },
        { href: "/admin/employee-notes",     label: t.admin.noteToAdmin,  icon: MessageSquare },
      ],
    },
  ];

  const NAV_GROUPS = [
    {
      label: t.admin.overview,
      items: [
        { href: "/admin/dashboard",    label: t.admin.dashboard, icon: LayoutDashboard },
        { href: "/admin/calendar",     label: t.admin.calendar,  icon: Calendar },
        { href: "/admin/bookings",     label: t.admin.bookings,  icon: BookOpen },
        { href: "/admin/waitlist",     label: "Warteliste",      icon: ClipboardList },
        { href: "/admin/customers",    label: t.admin.customers, icon: Users },
      ],
    },
    {
      label: t.admin.teamAndServices,
      items: [
        { href: "/admin/services",      label: t.admin.services,   icon: Scissors },
        { href: "/admin/employees",     label: t.admin.employees,  icon: Users },
        { href: "/admin/blocked-slots", label: t.admin.absences,   icon: Ban },
      ],
    },
    {
      label: t.admin.analytics,
      items: [
        { href: "/admin/tracking", label: t.admin.tracking, icon: BarChart3 },
        { href: "/admin/reviews",  label: "Bewertungen",    icon: Star },
      ],
    },
  ];

  const ADMIN_GROUP = {
    label: t.admin.administration,
    items: [
      { href: "/admin/inbox",        label: t.admin.inbox,        icon: Inbox },
        { href: "/admin/ai-service-finder", label: "KI & Service Finder", icon: Bot },
      { href: "/admin/links",        label: t.admin.myLinks,      icon: Link2 },
      ...(showIntakeForm ? [{ href: "/admin/intake-form", label: "Formulare", icon: IntakeIcon }] : []),
      { href: "/admin/settings",     label: t.admin.settings,     icon: Settings },
      { href: "/admin/api-keys",     label: "API-Zugang",         icon: KeyRound },
      { href: "/admin/subscription", label: t.admin.subscription, icon: CreditCard },
      // Gutscheine sind tenant-weites Guthaben, bewusst TenantAdmin/SuperAdmin only — nicht für
      // LocationAdmin (siehe AdminVoucherController). Nur anzeigen wenn nicht LocationAdmin.
      ...(!isLocationAdmin ? [{ href: "/admin/vouchers", label: "Gutscheine", icon: Ticket }] : []),
    ],
  };

  const groups = isEmployee ? EMPLOYEE_NAV : isTenantAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS;

  const displayName = user?.name
    || (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "")
    || employee?.name || "?";
  const ROLE_LABELS: Record<string, string> = {
    TenantAdmin: "Inhaber",
    LocationAdmin: "Standort-Admin",
    Employee: "Mitarbeiter",
    SuperAdmin: "Betreiber",
  };
  const rawRole = user?.role || employee?.role || "";
  const displayRole = ROLE_LABELS[rawRole] || rawRole;
  const initials = displayName === "?"
    ? "?"
    : displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin/dashboard" && pathname?.startsWith(href));

  // ── Sidebar content (shared desktop + mobile) ──────────────────────────
  const SidebarContent = ({ forceExpanded = false }: { forceExpanded?: boolean }) => {
    const isCollapsed = forceExpanded ? false : collapsed;
    return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className={`px-5 py-5 border-b border-white/8 ${isCollapsed ? "px-3" : ""}`}>
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          {isCollapsed ? (
            <GentleBookMark size={28} className="mx-auto" />
          ) : logoUrl
            ? <Image src={resolveLogoUrl(logoUrl)!} alt={companyName ?? "Logo"} width={180} height={40} unoptimized className="w-full max-w-[180px] h-10 object-contain object-left flex-shrink-0" />
            : (
              <>
                <GentleBookMark size={28} />
                {companyName && (
                  <span className="text-white/80 text-sm font-semibold truncate">{companyName}</span>
                )}
              </>
            )
          }
        </Link>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            {!isCollapsed && (
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-2 mb-2">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={isCollapsed ? label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      isCollapsed ? "justify-center" : ""
                    } ${
                      active
                        ? "bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white shadow-lg shadow-[#6355E4]/25"
                        : "text-white/55 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    <Icon size={17} className={active ? "text-white" : "text-white/40 group-hover:text-white/80"} />
                    {!isCollapsed && <span className="flex-1">{label}</span>}
                    {!isCollapsed && active && <ChevronRight size={14} className="opacity-50" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/8">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6355E4] to-[#17A398] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-[#6355E4]/30"
              title={displayName}
            >
              {initials}
            </div>
            <button
              onClick={() => setLang(lang === "de" ? "en" : "de")}
              className="text-[10px] font-bold text-white/40 hover:text-white transition-colors"
              title={lang === "de" ? "Switch to English" : "Zu Deutsch wechseln"}
              aria-label={lang === "de" ? "Switch to English" : "Zu Deutsch wechseln"}
            >
              {lang === "de" ? "EN" : "DE"}
            </button>
            <NotificationBell dark />
            <button
              onClick={logout}
              className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0 p-1.5 rounded-lg hover:bg-red-400/10"
              title={t.admin.logout}
              aria-label={t.admin.logout}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1">
              <button
                onClick={() => setLang(lang === "de" ? "en" : "de")}
                className="text-[10px] font-bold px-2 py-1 rounded-full border border-white/15 text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                {lang === "de" ? "EN" : "DE"}
              </button>
              <NotificationBell dark />
            </div>
            <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/6 transition-colors group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6355E4] to-[#17A398] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-[#6355E4]/30">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{displayName}</p>
                <p className="text-white/40 text-xs truncate">{displayRole}</p>
              </div>
              <button
                onClick={logout}
                className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0 p-1.5 rounded-lg hover:bg-red-400/10"
                title={t.admin.logout}
                aria-label={t.admin.logout}
              >
                <LogOut size={15} />
              </button>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 px-2 pt-1 text-[10px] text-white/35">
              <a href={legalConfig.imprint} target="_blank" rel="noopener noreferrer" className="hover:text-white">Impressum</a>
              <a href={legalConfig.privacy} target="_blank" rel="noopener noreferrer" className="hover:text-white">Datenschutz</a>
              <a href={legalConfig.terms} target="_blank" rel="noopener noreferrer" className="hover:text-white">AGB</a>
            </div>
          </div>
        )}
      </div>
    </div>
    );
  };

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
      <aside className={`hidden md:flex fixed inset-y-0 left-0 flex-col bg-[#1a1a2e] border-r border-white/5 z-40 transition-[width] duration-200 ${
        collapsed ? "w-[72px]" : "w-[230px]"
      }`}>
        <SidebarContent />
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex absolute top-6 -right-3 w-6 h-6 rounded-full bg-[#1a1a2e] border border-white/10 items-center justify-center text-white/50 hover:text-white hover:bg-[#23233a] transition-colors z-50 shadow-md"
          title={collapsed ? "Sidebar einblenden" : "Sidebar ausblenden"}
          aria-label={collapsed ? "Sidebar einblenden" : "Sidebar ausblenden"}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* ── Mobile Top Bar ───────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1a1a2e] border-b border-white/8 z-40 flex items-center justify-between px-4">
        <Link href="/admin/dashboard" className="flex items-center">
          {logoUrl
            ? <Image src={resolveLogoUrl(logoUrl)!} alt={companyName ?? "Logo"} width={150} height={36} unoptimized className="h-9 w-[150px] object-contain object-left" />
            : <GentleBookMark size={24} />
          }
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLang(lang === "de" ? "en" : "de")}
            className="text-[10px] font-bold px-2 py-1 rounded-full border border-white/20 text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            {lang === "de" ? "EN" : "DE"}
          </button>
          <NotificationBell dark />
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/8"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="md:hidden fixed inset-y-0 left-0 w-[260px] bg-[#1a1a2e] border-r border-white/8 z-50"
            >
              <SidebarContent forceExpanded />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

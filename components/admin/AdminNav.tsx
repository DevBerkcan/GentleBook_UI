"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, BookOpen, Ban, LogOut,
  Users, Scissors, Settings, CreditCard, Link2,
  BarChart3, Menu, X, ChevronRight, Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/contexts/AuthContext";
import api from "@/lib/api/client";

const NAV_GROUPS = [
  {
    label: "Übersicht",
    items: [
      { href: "/admin/dashboard",    label: "Dashboard",     icon: LayoutDashboard },
      { href: "/admin/calendar",     label: "Kalender",      icon: Calendar },
      { href: "/admin/bookings",     label: "Buchungen",     icon: BookOpen },
      { href: "/admin/customers",    label: "Kunden",        icon: Users },
    ],
  },
  {
    label: "Team & Services",
    items: [
      { href: "/admin/services",     label: "Services",      icon: Scissors },
      { href: "/admin/employees",    label: "Mitarbeiter",   icon: Users },
      { href: "/admin/blocked-slots",label: "Abwesenheiten", icon: Ban },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/admin/tracking",     label: "Tracking",      icon: BarChart3 },
    ],
  },
];

const ADMIN_GROUP = {
  label: "Administration",
  items: [
    { href: "/admin/links",         label: "Meine Links",   icon: Link2 },
    { href: "/admin/settings",      label: "Einstellungen", icon: Settings },
    { href: "/admin/subscription",  label: "Abonnement",    icon: CreditCard },
  ],
};

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, employee, logout, isAuthenticated, isTenantAdmin } = useAuth();
  const [logoUrl, setLogoUrl]         = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);

  useEffect(() => {
    if (isTenantAdmin) {
      api.get("/tenant/settings").then((res) => {
        const d = res.data?.data ?? res.data;
        if (d?.logoUrl)     setLogoUrl(d.logoUrl);
        if (d?.companyName) setCompanyName(d.companyName);
      }).catch(() => {});
    }
  }, [isTenantAdmin]);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  if (!isAuthenticated) return null;

  const groups = isTenantAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS;

  const displayName = user?.name
    || (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "")
    || employee?.name || "?";
  const displayRole = user?.role || employee?.role || "";
  const initials = displayName === "?"
    ? "?"
    : displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin/dashboard" && pathname?.startsWith(href));

  // ── Sidebar content (shared desktop + mobile) ──────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          {logoUrl
            ? <img src={logoUrl} alt={companyName ?? "Logo"} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
            : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E8C7C3] to-[#D8B0AC] flex items-center justify-center flex-shrink-0">
                <Sparkles size={18} className="text-white" />
              </div>
            )
          }
          <span className="text-white font-bold text-sm leading-tight truncate max-w-[140px]">
            {companyName || "GentleBook"}
          </span>
        </Link>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-2 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      active
                        ? "bg-[#017172] text-white shadow-lg shadow-[#017172]/20"
                        : "text-white/55 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    <Icon size={17} className={active ? "text-white" : "text-white/40 group-hover:text-white/80"} />
                    {label}
                    {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/8">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#017172] to-[#01a0a2] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{displayName}</p>
            <p className="text-white/40 text-xs truncate">{displayRole}</p>
          </div>
          <button
            onClick={logout}
            className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0"
            title="Abmelden"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-[230px] flex-col bg-[#1a1a2e] border-r border-white/5 z-40">
        <SidebarContent />
      </aside>

      {/* ── Mobile Top Bar ───────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1a1a2e] border-b border-white/8 z-40 flex items-center justify-between px-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          {logoUrl
            ? <img src={logoUrl} alt="" className="w-8 h-8 rounded-xl object-cover" />
            : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E8C7C3] to-[#D8B0AC] flex items-center justify-center">
                <Sparkles size={15} className="text-white" />
              </div>
            )
          }
          <span className="text-white font-bold text-sm">{companyName || "GentleBook"}</span>
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/8"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
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
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

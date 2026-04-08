"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, BarChart3, Ban, LogOut,
  Menu, X, Users, ChevronDown, Scissors, Settings, CreditCard
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@nextui-org/dropdown";
import { Avatar } from "@nextui-org/avatar";

export function AdminNav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, employee, logout, isAuthenticated, isTenantAdmin } = useAuth();

  const baseNavItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/calendar", label: "Kalender", icon: Calendar },
    { href: "/admin/bookings", label: "Buchungen", icon: Calendar },
    { href: "/admin/customers", label: "Kunden", icon: Users },
    { href: "/admin/services", label: "Services", icon: Scissors },
    { href: "/admin/employees", label: "Mitarbeiter", icon: Users },
    { href: "/admin/blocked-slots", label: "Abwesenheiten", icon: Ban },
    { href: "/admin/tracking", label: "Tracking", icon: BarChart3 },
  ];

  // TenantAdmin gets extra nav items
  const adminOnlyItems = isTenantAdmin ? [
    { href: "/admin/settings", label: "Einstellungen", icon: Settings },
    { href: "/admin/subscription", label: "Abo", icon: CreditCard },
  ] : [];

  const navItems = [...baseNavItems, ...adminOnlyItems];

  const handleLogout = async () => {
    await logout();
  };

  const displayName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') || employee?.name || '?';
  const displayRole = user?.role || employee?.role || '';
  const displaySub = isTenantAdmin ? (user?.tenantName || user?.tenantSlug || user?.email || '') : (user?.username || employee?.username || user?.email || '');

  const getInitials = () => {
    if (!displayName || displayName === '?') return '?';
    return displayName
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-[#1E1E1E] text-white shadow-lg sticky top-0 z-50">
      <div className="flex items-center h-24 px-4 sm:px-6 lg:px-8">
        {/* Logo - Far left */}
        <Link href="/admin/dashboard" className="flex items-center shrink-0 -ml-4 sm:-ml-6 lg:-ml-8">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
            <Image
              src="/icon.png"
              alt="GentleBook"
              fill
              sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 112px"
              className="rounded-xl object-contain brightness-0 invert"
              priority
            />
          </div>
        </Link>

        {/* Desktop Navigation - Centered */}
        <div className="hidden md:flex items-center justify-center flex-1">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href === "/admin/services" && pathname?.startsWith("/admin/services"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-[#017172] text-white"
                      : "text-[#8A8A8A] hover:bg-[#4C4C4C] hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Menu Dropdown - Far right */}
        <div className="hidden md:block ml-auto">
          <Dropdown placement="bottom-end" classNames={{ content: "bg-[#2C2C2C] border border-[#4C4C4C]" }}>
            <DropdownTrigger>
              <button className="flex items-center gap-3 pl-5 py-1.5 pr-2 rounded-lg hover:bg-[#4C4C4C] transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={getInitials()}
                    className="bg-[#017172] text-white font-semibold"
                    size="sm"
                  />
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-white">{displayName}</p>
                    <p className="text-xs text-[#8A8A8A]">{displayRole}</p>
                  </div>
                </div>
                <ChevronDown size={16} className="text-[#8A8A8A]" />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Benutzermenü" variant="flat">
              <DropdownSection showDivider>
                <DropdownItem key="user-info" className="h-14 gap-2 opacity-100 hover:!bg-transparent cursor-default">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{displayName}</span>
                    <span className="text-[#8A8A8A] text-sm">{displaySub}</span>
                  </div>
                </DropdownItem>
              </DropdownSection>
              <DropdownSection>
                <DropdownItem
                  key="logout"
                  className="text-red-400 hover:text-white hover:bg-red-600"
                  startContent={<LogOut size={16} />}
                  onPress={handleLogout}
                >
                  Abmelden
                </DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Mobile buttons */}
        <div className="flex items-center gap-2 md:hidden ml-auto">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button className="p-1">
                <Avatar
                  name={getInitials()}
                  className="bg-[#017172] text-white font-semibold"
                  size="sm"
                />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Benutzermenü" className="bg-[#2C2C2C]">
              <DropdownSection showDivider>
                <DropdownItem key="user-info-mobile" className="h-14 gap-2 opacity-100 cursor-default">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{displayName}</span>
                    <span className="text-[#8A8A8A] text-xs">{displayRole}</span>
                    <span className="text-[#8A8A8A] text-xs">{displaySub}</span>
                  </div>
                </DropdownItem>
              </DropdownSection>
              <DropdownSection>
                <DropdownItem
                  key="logout-mobile"
                  className="text-red-400"
                  startContent={<LogOut size={16} />}
                  onPress={handleLogout}
                >
                  Abmelden
                </DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 text-[#8A8A8A] hover:bg-[#4C4C4C] rounded-lg transition-colors"
            aria-label="Menü"
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden py-4 border-t border-[#4C4C4C] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#017172] text-white"
                      : "text-[#8A8A8A] hover:bg-[#4C4C4C] hover:text-white"
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-base font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
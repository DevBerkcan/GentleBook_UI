// app/superadmin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Building2, LogOut, Mail, Activity, Bell, FileText, Euro, AlertTriangle, ScrollText, TrendingUp } from 'lucide-react';
import { superAdminApi } from '@/lib/api/superadmin';
import { getSuperAdminToken, getSuperAdminUser, removeSuperAdminToken, removeSuperAdminUser } from '@/lib/auth/storage';
import { GentleBookMark } from '@/components/admin/GentleBookLogo';

function useSuperAdminAuth() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/superadmin/login') return;

    const token = getSuperAdminToken();
    const user = getSuperAdminUser();

    if (!token || !user) {
      router.push('/superadmin/login');
      return;
    }

    try {
      const parsed = JSON.parse(user);
      if (parsed.role !== 'SuperAdmin') {
        router.push('/superadmin/login');
      }
    } catch {
      router.push('/superadmin/login');
    }
  }, [pathname, router]);

  const logout = () => {
    removeSuperAdminToken();
    removeSuperAdminUser();
    router.push('/superadmin/login');
  };

  return { logout };
}

function SuperAdminNav({ logout }: { logout: () => void }) {
  const pathname = usePathname();
  const [pendingRequests, setPendingRequests] = useState(0);
  const [atRiskCount, setAtRiskCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      superAdminApi.getSubscriptionRequests('Pending')
        .then(r => setPendingRequests(r.pendingCount))
        .catch(() => {});
      superAdminApi.getAtRiskSubscriptions()
        .then(r => setAtRiskCount(r.totalAtRisk))
        .catch(() => {});
    };
    refresh();
    // Refresh every 5 minutes
    const id = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const navItems = [
    { href: '/superadmin/dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
    { href: '/superadmin/revenue',    label: 'Umsatz',          icon: TrendingUp },
    { href: '/superadmin/tenants',    label: 'Buchungssysteme', icon: Building2 },
    { href: '/superadmin/requests',   label: 'Abo-Anfragen',    icon: Bell, badge: pendingRequests },
    { href: '/superadmin/invoices',   label: 'Rechnungen',      icon: FileText },
    { href: '/superadmin/pricing',    label: 'Preise',          icon: Euro },
    { href: '/superadmin/at-risk',    label: 'Gefährdete Kunden', icon: AlertTriangle, badge: atRiskCount },
    { href: '/superadmin/email-logs', label: 'E-Mail Logs',     icon: Mail },
    { href: '/superadmin/activity',   label: 'Aktivitäten',     icon: Activity },
    { href: '/superadmin/audit-log',  label: 'Audit-Log',       icon: ScrollText },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#1a1a2e] text-white flex flex-col z-50">
      <div className="p-5 border-b border-white/10 flex items-center gap-2.5">
        <GentleBookMark size={26} />
        <div>
          <p className="font-semibold text-white leading-tight">gentlebook</p>
          <p className="text-[11px] text-gray-400 leading-tight">Super Admin</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-medium shadow-lg shadow-[#6355E4]/25'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {badge != null && badge > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Abmelden
        </button>
      </div>
    </aside>
  );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useSuperAdminAuth();
  const pathname = usePathname();

  if (pathname === '/superadmin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#F6F5FA]">
      <SuperAdminNav logout={logout} />
      <main className="ml-60 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}

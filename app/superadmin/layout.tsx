// app/superadmin/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Building2, LogOut, ChevronRight } from 'lucide-react';

function useSuperAdminAuth() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/superadmin/login') return;

    const token = localStorage.getItem('superadmin_token');
    const user = localStorage.getItem('superadmin_user');

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
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_user');
    router.push('/superadmin/login');
  };

  return { logout };
}

function SuperAdminNav({ logout }: { logout: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/superadmin/tenants', label: 'Buchungssysteme', icon: Building2 },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-gray-900 text-white flex flex-col z-50">
      <div className="p-5 border-b border-gray-700">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">GentleBook</p>
        <p className="font-semibold text-white">Super Admin</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
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
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminNav logout={logout} />
      <main className="ml-60 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}

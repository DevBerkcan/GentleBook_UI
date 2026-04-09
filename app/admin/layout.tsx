// app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext';
import { MessageCircle, Mail, LockKeyhole } from 'lucide-react';
import api from '@/lib/api/client';

function TrialExpiredModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <LockKeyhole size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#1E1E1E] mb-2">Testzeitraum abgelaufen</h2>
        <p className="text-[#8A8A8A] mb-6">
          Ihre kostenlose Testphase ist abgelaufen. Um GentleBook weiter zu nutzen,
          kontaktieren Sie uns — wir helfen Ihnen schnell weiter.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://wa.me/491754701892"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1ebe5a] transition-colors"
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
          <a
            href="mailto:support@gentlegroup.de"
            className="flex items-center justify-center gap-2 bg-[#1E1E1E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#333] transition-colors"
          >
            <Mail size={18} />
            E-Mail
          </a>
        </div>
        <p className="text-xs text-[#8A8A8A] mt-4">
          Sie können weiterhin Ihren{' '}
          <a href="/admin/subscription" className="text-[#017172] underline">Abonnement-Status</a>{' '}
          einsehen.
        </p>
      </div>
    </div>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, isTenantAdmin } = useAuth();
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') return;
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, pathname, router]);

  // Check subscription status for TenantAdmin
  useEffect(() => {
    if (!isAuthenticated || !isTenantAdmin) return;
    if (pathname === '/admin/login' || pathname === '/admin/subscription') return;

    api.get('/tenant/subscription')
      .then((res) => {
        const sub = res.data?.data ?? res.data;
        if (sub && sub.isAccessAllowed === false) {
          setTrialExpired(true);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, isTenantAdmin, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#E8C7C3]" />
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isAuthenticated) {
    return (
      <>
        <AdminNav />
        {children}
        {trialExpired && <TrialExpiredModal />}
      </>
    );
  }

  return null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}

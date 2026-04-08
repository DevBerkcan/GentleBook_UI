// app/superadmin/tenants/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Building2, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { superAdminApi, TenantListItem } from '@/lib/api/superadmin';

function SubscriptionBadge({ sub }: { sub: TenantListItem['subscription'] }) {
  if (!sub) return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">–</span>;

  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    Trial: {
      label: `Trial – ${sub.trialDaysRemaining}d`,
      className: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      icon: <Clock size={11} />,
    },
    Active: {
      label: 'Aktiv',
      className: 'bg-green-50 text-green-700 border border-green-200',
      icon: <CheckCircle size={11} />,
    },
    Expired: {
      label: 'Abgelaufen',
      className: 'bg-red-50 text-red-700 border border-red-200',
      icon: <XCircle size={11} />,
    },
    PastDue: {
      label: 'Überfällig',
      className: 'bg-orange-50 text-orange-700 border border-orange-200',
      icon: <AlertCircle size={11} />,
    },
    Cancelled: {
      label: 'Gekündigt',
      className: 'bg-gray-100 text-gray-500',
      icon: null,
    },
  };

  const c = config[sub.status] ?? config['Trial'];
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

const INDUSTRY_LABELS: Record<string, string> = {
  Hairdresser: 'Friseur',
  Beauty: 'Beauty',
  Massage: 'Massage',
  Nail: 'Nails',
  Barbershop: 'Barbershop',
  Tattoo: 'Tattoo',
  Physio: 'Physio',
  Other: 'Sonstige',
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminApi.getTenants()
      .then((res) => setTenants(res.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buchungssysteme</h1>
          <p className="text-gray-500 mt-1 text-sm">{tenants.length} Systeme angelegt</p>
        </div>
        <Link
          href="/superadmin/tenants/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <Plus size={16} />
          Neues System
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">Noch kein Buchungssystem angelegt</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Leg dein erstes System an — dauert nur 2 Minuten</p>
          <Link
            href="/superadmin/tenants/new"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            <Plus size={16} />
            Jetzt anlegen
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {tenants.map((tenant) => (
            <Link
              key={tenant.id}
              href={`/superadmin/tenants/${tenant.id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
            >
              {tenant.logoUrl ? (
                <img src={tenant.logoUrl} alt={tenant.companyName} className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Building2 size={18} className="text-gray-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{tenant.companyName || tenant.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {INDUSTRY_LABELS[tenant.industryType] ?? tenant.industryType} · /{tenant.slug}
                </p>
              </div>

              <SubscriptionBadge sub={tenant.subscription} />

              <span className={`text-xs px-2 py-0.5 rounded-full ${tenant.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {tenant.isActive ? 'Aktiv' : 'Deaktiviert'}
              </span>

              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

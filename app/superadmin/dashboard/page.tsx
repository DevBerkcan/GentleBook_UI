// app/superadmin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Clock, CheckCircle, AlertCircle, Users, Plus } from 'lucide-react';
import { superAdminApi } from '@/lib/api/superadmin';

interface Stats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  activeSubscriptions: number;
  expiredTenants: number;
  totalBookings: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminApi.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Buchungssysteme gesamt', value: stats.totalTenants, icon: Building2, color: 'bg-blue-50 text-blue-600' },
    { label: 'Im Trial', value: stats.trialTenants, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Aktive Abos', value: stats.activeSubscriptions, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    { label: 'Abgelaufen', value: stats.expiredTenants, icon: AlertCircle, color: 'bg-red-50 text-red-600' },
    { label: 'Buchungen gesamt', value: stats.totalBookings, icon: Users, color: 'bg-purple-50 text-purple-600' },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plattform-Übersicht</h1>
          <p className="text-gray-500 mt-1 text-sm">Alle Buchungssysteme auf einen Blick</p>
        </div>
        <Link
          href="/superadmin/tenants/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <Plus size={16} />
          Neues Buchungssystem
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className={`inline-flex p-2 rounded-lg ${color} mb-3`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Schnellzugriff</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/superadmin/tenants/new"
            className="flex items-center gap-3 p-4 border border-dashed border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <Plus size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900">Neues System</p>
              <p className="text-xs text-gray-500">In 2 Minuten anlegen</p>
            </div>
          </Link>
          <Link
            href="/superadmin/tenants"
            className="flex items-center gap-3 p-4 border border-dashed border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <Building2 size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900">Alle Systeme</p>
              <p className="text-xs text-gray-500">Verwalten & bearbeiten</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

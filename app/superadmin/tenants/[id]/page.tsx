// app/superadmin/tenants/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { superAdminApi, UpdateTenantSettingsPayload } from '@/lib/api/superadmin';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState<UpdateTenantSettingsPayload>({
    companyName: '',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    accentColor: '#cccccc',
    tagline: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    welcomeMessage: '',
    defaultCurrency: 'EUR',
  });

  useEffect(() => {
    superAdminApi.getTenant(id)
      .then((data) => {
        setTenant(data);
        if (data.settings) {
          setSettings({
            companyName: data.settings.companyName ?? data.name,
            primaryColor: data.settings.primaryColor ?? '#000000',
            secondaryColor: data.settings.secondaryColor ?? '#ffffff',
            accentColor: data.settings.accentColor ?? '#cccccc',
            tagline: data.settings.tagline ?? '',
            phone: data.settings.phone ?? '',
            email: data.settings.email ?? '',
            website: data.settings.website ?? '',
            address: data.settings.address ?? '',
            welcomeMessage: data.settings.welcomeMessage ?? '',
            defaultCurrency: data.settings.defaultCurrency ?? 'EUR',
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await superAdminApi.updateSettings(id, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof UpdateTenantSettingsPayload, value: string | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-gray-100 rounded-xl" />;
  }

  if (!tenant) {
    return <p className="text-gray-500">Tenant nicht gefunden.</p>;
  }

  const sub = tenant.subscription;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/superadmin/tenants" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
          <p className="text-gray-400 text-sm">/{tenant.slug}</p>
        </div>
        <a
          href={`/booking/${tenant.slug}`}
          target="_blank"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ExternalLink size={14} />
          Buchungsseite
        </a>
      </div>

      {/* Trial Status */}
      {sub && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          sub.isInTrial ? 'bg-yellow-50 border-yellow-200' : sub.status === 'Active' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <Clock size={18} className={sub.isInTrial ? 'text-yellow-600' : sub.status === 'Active' ? 'text-green-600' : 'text-red-600'} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {sub.isInTrial ? `Trial — ${sub.trialDaysRemaining} Tage verbleibend` : sub.status === 'Active' ? 'Aktives Abonnement' : 'Abgelaufen'}
            </p>
            {sub.isInTrial && (
              <p className="text-xs text-gray-500">Läuft ab: {new Date(sub.trialEndsAt).toLocaleDateString('de-DE')}</p>
            )}
          </div>
          {sub.isInTrial && (
            <button
              onClick={async () => {
                await superAdminApi.extendTrial(id, 14);
                router.refresh();
              }}
              className="text-xs px-3 py-1.5 bg-white border border-yellow-200 rounded-lg text-yellow-700 hover:bg-yellow-50"
            >
              +14 Tage
            </button>
          )}
        </div>
      )}

      {/* Branding */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Branding & Firmeninfo</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Firmenname</label>
          <input type="text" value={settings.companyName} onChange={(e) => update('companyName', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Slogan / Tagline</label>
          <input type="text" value={settings.tagline} onChange={(e) => update('tagline', e.target.value)}
            placeholder="z.B. Ihr Friseur in der Innenstadt"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Primärfarbe</label>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.primaryColor} onChange={(e) => update('primaryColor', e.target.value)}
                className="h-10 w-14 rounded border border-gray-200 cursor-pointer" />
              <span className="text-xs text-gray-400 font-mono">{settings.primaryColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sekundärfarbe</label>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.secondaryColor} onChange={(e) => update('secondaryColor', e.target.value)}
                className="h-10 w-14 rounded border border-gray-200 cursor-pointer" />
              <span className="text-xs text-gray-400 font-mono">{settings.secondaryColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Akzentfarbe</label>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.accentColor} onChange={(e) => update('accentColor', e.target.value)}
                className="h-10 w-14 rounded border border-gray-200 cursor-pointer" />
              <span className="text-xs text-gray-400 font-mono">{settings.accentColor}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
            <input type="text" value={settings.phone} onChange={(e) => update('phone', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-Mail (öffentlich)</label>
            <input type="email" value={settings.email} onChange={(e) => update('email', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
          <input type="text" value={settings.address} onChange={(e) => update('address', e.target.value)}
            placeholder="Musterstraße 1, 10115 Berlin"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Willkommensnachricht (auf Buchungsseite)</label>
          <textarea value={settings.welcomeMessage} onChange={(e) => update('welcomeMessage', e.target.value)}
            rows={3} placeholder="z.B. Willkommen! Buchen Sie Ihren Termin ganz einfach online."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none resize-none" />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <Save size={15} />
          {saving ? 'Speichern...' : saved ? '✓ Gespeichert' : 'Speichern'}
        </button>
      </div>
    </div>
  );
}

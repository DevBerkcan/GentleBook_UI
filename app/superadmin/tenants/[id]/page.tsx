// app/superadmin/tenants/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Clock, ExternalLink, Copy, Check,
  Palette, Users, Link2, CreditCard, Mail, Phone, Globe, MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { superAdminApi, UpdateTenantSettingsPayload } from '@/lib/api/superadmin';

type Tab = 'branding' | 'users' | 'link' | 'subscription';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('link');
  const [copied, setCopied] = useState(false);
  const [extendingTrial, setExtendingTrial] = useState(false);

  // New user form
  const [newUser, setNewUser] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [userCreated, setUserCreated] = useState(false);
  const [userError, setUserError] = useState('');

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
    cancellationPolicy: '',
    defaultCurrency: 'EUR',
    bookingIntervalMinutes: 30,
    maxAdvanceBookingDays: 60,
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
            cancellationPolicy: data.settings.cancellationPolicy ?? '',
            defaultCurrency: data.settings.defaultCurrency ?? 'EUR',
            bookingIntervalMinutes: data.settings.bookingIntervalMinutes ?? 30,
            maxAdvanceBookingDays: data.settings.maxAdvanceBookingDays ?? 60,
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
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof UpdateTenantSettingsPayload, value: string | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const copyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExtendTrial = async (days: number) => {
    setExtendingTrial(true);
    try {
      await superAdminApi.extendTrial(id, days);
      const data = await superAdminApi.getTenant(id);
      setTenant(data);
    } catch (err) {
      console.error(err);
    } finally {
      setExtendingTrial(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) return;
    setCreatingUser(true);
    setUserError('');
    try {
      await superAdminApi.createUser(id, newUser);
      setUserCreated(true);
      setNewUser({ email: '', password: '', firstName: '', lastName: '' });
      // Refresh to show new user
      const data = await superAdminApi.getTenant(id);
      setTenant(data);
      setTimeout(() => setUserCreated(false), 3000);
    } catch (err: any) {
      setUserError(err?.response?.data?.message ?? 'Fehler beim Erstellen');
    } finally {
      setCreatingUser(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-10 w-48 bg-gray-100 rounded-lg" />
        <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!tenant) {
    return <p className="text-gray-500">Tenant nicht gefunden.</p>;
  }

  const sub = tenant.subscription;
  const bookingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/booking/${tenant.slug}`;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'link', label: 'Buchungslink', icon: <Link2 size={15} /> },
    { key: 'branding', label: 'Branding', icon: <Palette size={15} /> },
    { key: 'users', label: 'Admin-User', icon: <Users size={15} /> },
    { key: 'subscription', label: 'Abo', icon: <CreditCard size={15} /> },
  ];

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/superadmin/tenants" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {settings.primaryColor && (
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                style={{ backgroundColor: settings.primaryColor }}
              />
            )}
            <h1 className="text-xl font-bold text-gray-900 truncate">{tenant.name}</h1>
          </div>
          <p className="text-gray-400 text-sm font-mono">/{tenant.slug}</p>
        </div>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 shrink-0"
        >
          <ExternalLink size={14} />
          Öffnen
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: Buchungslink ─────────────────────────────────────────── */}
      {activeTab === 'link' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Buchungslink</h2>
            <p className="text-sm text-gray-400">Dieser Link führt Kunden direkt zum Online-Buchungssystem.</p>
          </div>

          {/* Primary booking link */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: settings.primaryColor ?? '#000' }}
              >
                <Link2 size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Online-Buchungssystem</p>
                <p className="text-xs text-gray-400">Buchungsseite für Kunden</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 font-mono truncate">
                /booking/{tenant.slug}
              </code>
              <button
                onClick={() => copyLink(bookingUrl)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors shrink-0"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Kopiert' : 'Kopieren'}
              </button>
            </div>
          </div>

          {/* Admin login link */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Users size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Admin-Login</p>
                <p className="text-xs text-gray-400">Für den Kunden-Zugang</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 font-mono truncate">
                /admin/login
              </code>
              <button
                onClick={() => {
                  const adminUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/admin/login`;
                  copyLink(adminUrl);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors shrink-0"
              >
                <Copy size={14} />
                Kopieren
              </button>
            </div>
          </div>

          {/* Slug info */}
          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
            <strong>Slug:</strong> <span className="font-mono">{tenant.slug}</span>
            {' · '}
            <strong>Industrie:</strong> {tenant.industryType}
            {' · '}
            <strong>Erstellt:</strong> {new Date(tenant.createdAt).toLocaleDateString('de-DE')}
          </div>
        </div>
      )}

      {/* ── Tab: Branding ─────────────────────────────────────────────── */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Branding & Firmeninfo</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Firmenname</label>
              <input type="text" value={settings.companyName} onChange={(e) => update('companyName', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Slogan / Tagline</label>
              <input type="text" value={settings.tagline} onChange={(e) => update('tagline', e.target.value)}
                placeholder="z.B. Ihr Friseur in der Innenstadt"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { field: 'primaryColor' as const, label: 'Primärfarbe' },
              { field: 'secondaryColor' as const, label: 'Sekundärfarbe' },
              { field: 'accentColor' as const, label: 'Akzentfarbe' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings[field] as string}
                    onChange={(e) => update(field, e.target.value)}
                    className="h-10 w-14 rounded border border-gray-200 cursor-pointer p-0.5" />
                  <span className="text-xs text-gray-400 font-mono">{settings[field] as string}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Phone size={13} className="inline mr-1" />Telefon
              </label>
              <input type="text" value={settings.phone} onChange={(e) => update('phone', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Mail size={13} className="inline mr-1" />E-Mail (öffentlich)
              </label>
              <input type="email" value={settings.email} onChange={(e) => update('email', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Globe size={13} className="inline mr-1" />Website
              </label>
              <input type="text" value={settings.website} onChange={(e) => update('website', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <MapPin size={13} className="inline mr-1" />Adresse
              </label>
              <input type="text" value={settings.address} onChange={(e) => update('address', e.target.value)}
                placeholder="Musterstraße 1, 10115 Berlin"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Willkommensnachricht</label>
            <textarea value={settings.welcomeMessage} onChange={(e) => update('welcomeMessage', e.target.value)}
              rows={2} placeholder="Wird auf der Buchungsseite angezeigt."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Stornierungsrichtlinie</label>
            <textarea value={settings.cancellationPolicy} onChange={(e) => update('cancellationPolicy', e.target.value)}
              rows={2} placeholder="z.B. Kostenloses Stornieren bis 24h vorher."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none resize-none" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Währung</label>
              <select value={settings.defaultCurrency} onChange={(e) => update('defaultCurrency', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none bg-white">
                <option value="EUR">EUR €</option>
                <option value="CHF">CHF Fr.</option>
                <option value="USD">USD $</option>
                <option value="GBP">GBP £</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Buchungsintervall (Min)</label>
              <select value={settings.bookingIntervalMinutes} onChange={(e) => update('bookingIntervalMinutes', Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none bg-white">
                {[15, 30, 45, 60, 90, 120].map((v) => (
                  <option key={v} value={v}>{v} Min</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Max. Vorausbuchung (Tage)</label>
              <input type="number" value={settings.maxAdvanceBookingDays} min={1} max={365}
                onChange={(e) => update('maxAdvanceBookingDays', Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            </div>
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
      )}

      {/* ── Tab: Admin-User ───────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Existing users */}
          {tenant.users && tenant.users.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Bestehende Benutzer</h2>
              <div className="space-y-2">
                {tenant.users.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.role === 'TenantAdmin'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role === 'TenantAdmin' ? 'Admin' : u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New user form */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Neuen Admin-User anlegen</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vorname</label>
                <input type="text" value={newUser.firstName}
                  onChange={(e) => setNewUser((p) => ({ ...p, firstName: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nachname</label>
                <input type="text" value={newUser.lastName}
                  onChange={(e) => setNewUser((p) => ({ ...p, lastName: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-Mail</label>
                <input type="email" value={newUser.email}
                  onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Passwort</label>
                <input type="password" value={newUser.password}
                  onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
              </div>
            </div>
            {userError && <p className="text-sm text-red-600">{userError}</p>}
            <button
              onClick={handleCreateUser}
              disabled={creatingUser || !newUser.email || !newUser.password}
              className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
            >
              <Users size={15} />
              {creatingUser ? 'Anlegen...' : userCreated ? '✓ Angelegt' : 'User anlegen'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Abo ──────────────────────────────────────────────────── */}
      {activeTab === 'subscription' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Abonnement</h2>

          {sub ? (
            <>
              <div className={`flex items-start gap-4 p-4 rounded-xl border ${
                sub.isInTrial
                  ? 'bg-yellow-50 border-yellow-200'
                  : sub.status === 'Active'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <Clock size={20} className={
                  sub.isInTrial ? 'text-yellow-600 mt-0.5' : sub.status === 'Active' ? 'text-green-600 mt-0.5' : 'text-red-600 mt-0.5'
                } />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    {sub.isInTrial
                      ? `Trial — ${sub.trialDaysRemaining} Tage verbleibend`
                      : sub.status === 'Active'
                      ? 'Aktives Abonnement'
                      : 'Abgelaufen / Inaktiv'}
                  </p>
                  {sub.isInTrial && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Läuft ab: {new Date(sub.trialEndsAt).toLocaleDateString('de-DE')}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">Plan: {sub.plan} · Status: {sub.status}</p>
                </div>
              </div>

              {/* Extend trial */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Trial verlängern</p>
                <div className="flex gap-2">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      onClick={() => handleExtendTrial(days)}
                      disabled={extendingTrial}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg font-medium disabled:opacity-50 transition-colors"
                    >
                      +{days} Tage
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Kein Abo gefunden.</p>
          )}
        </div>
      )}
    </div>
  );
}

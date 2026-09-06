// app/superadmin/tenants/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Clock, ExternalLink, Copy, Check,
  Palette, Users, Link2, CreditCard, Mail, Phone, Globe, MapPin, Upload, ImageIcon, LogIn, Trash2,
  RefreshCw, ShieldCheck, ShieldAlert, Download, FileText,
} from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { superAdminApi, UpdateTenantSettingsPayload, TenantStats, TenantBillingStatus, InvoiceItem } from '@/lib/api/superadmin';
import { useConfirm } from '@/components/ConfirmDialog';
import { resolveLogoUrl } from '@/lib/utils/logo';
import { setAccessToken } from '@/lib/auth/storage';
import { TrendingUp, BarChart2, Calendar, Users as UsersIcon2, BookOpen, XCircle as XC } from 'lucide-react';

type Tab = 'branding' | 'users' | 'link' | 'subscription' | 'stats' | 'domain';

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
  const [activatingTrial, setActivatingTrial] = useState(false);
  const [trialActivationError, setTrialActivationError] = useState('');
  const [changingPlan, setChangingPlan] = useState(false);
  const [planChanged, setPlanChanged] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [resendingWelcome, setResendingWelcome] = useState(false);
  const [welcomeResent, setWelcomeResent] = useState(false);
  const [resendError, setResendError] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [tenantStats, setTenantStats] = useState<TenantStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [billing, setBilling] = useState<TenantBillingStatus | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [tenantInvoices, setTenantInvoices] = useState<InvoiceItem[] | null>(null);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [domainInfo, setDomainInfo] = useState<{ domain: string | null; status: string; requestedAt: string | null } | null>(null);
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainUpdating, setDomainUpdating] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { confirm, dialog } = useConfirm();

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
        if (data.subscription?.plan) setSelectedPlan(data.subscription.plan);
        if (data.settings?.logoUrl) setLogoUrl(data.settings.logoUrl);
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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await superAdminApi.updateSettings(id, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* silent fail */ } finally {
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
    } catch { /* silent fail */ } finally {
      setExtendingTrial(false);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedPlan) return;
    // Agency has no fixed price ("Preis auf Anfrage") — ask for the individually negotiated
    // monthly price before switching this tenant onto it.
    let negotiatedMonthlyPrice: number | undefined;
    if (selectedPlan === 'Agency') {
      const raw = window.prompt(`Individuellen Monatspreis für "${tenant?.companyName || tenant?.name}" (Agency) festlegen (€):`);
      if (raw === null) return;
      const parsed = Number(raw.replace(',', '.'));
      if (!raw.trim() || Number.isNaN(parsed) || parsed <= 0) {
        alert('Bitte einen gültigen Preis eingeben.');
        return;
      }
      negotiatedMonthlyPrice = parsed;
    }
    setChangingPlan(true);
    try {
      await superAdminApi.changePlan(id, selectedPlan, { negotiatedMonthlyPrice });
      const data = await superAdminApi.getTenant(id);
      setTenant(data);
      setPlanChanged(true);
      setTimeout(() => setPlanChanged(false), 3000);
    } catch { /* silent fail */ } finally {
      setChangingPlan(false);
    }
  };

  const handleActivatePreparedTrial = async () => {
    const approved = await confirm({
      title: '14-tägigen Test jetzt freigeben?',
      message: 'Mit der Freigabe beginnen die 14 Tage sofort. Der Mandant, die Buchungsseite und der Administrator werden aktiviert und die Zugangsdaten werden per E-Mail versendet.',
      confirmLabel: 'Test verbindlich freigeben',
    });
    if (!approved) return;
    setActivatingTrial(true);
    setTrialActivationError('');
    try {
      await superAdminApi.activatePreparedTrial(id);
      setTenant(await superAdminApi.getTenant(id));
    } catch (err: any) {
      setTrialActivationError(err?.response?.data?.message ?? 'Testfreigabe fehlgeschlagen');
    } finally {
      setActivatingTrial(false);
    }
  };

  const handleResendWelcome = async () => {
    setResendingWelcome(true);
    setResendError('');
    try {
      await superAdminApi.resendWelcomeEmail(id);
      setWelcomeResent(true);
      setTimeout(() => setWelcomeResent(false), 5000);
    } catch (err: any) {
      setResendError(err?.response?.data?.message ?? 'Fehler beim Senden');
    } finally {
      setResendingWelcome(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoError('');
    try {
      const result = await superAdminApi.uploadLogo(id, file);
      setLogoUrl(result.logoUrl);
    } catch (err: any) {
      setLogoError(err?.response?.data?.message ?? 'Fehler beim Hochladen');
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: `"${tenant?.companyName || tenant?.name}" löschen?`,
      message: 'Alle Buchungen, Mitarbeiter, Kunden und Daten werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.',
      variant: 'danger',
      confirmLabel: 'Endgültig löschen',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await superAdminApi.deleteTenant(id);
      router.push('/superadmin/tenants');
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Löschen fehlgeschlagen');
      setDeleting(false);
    }
  };

  const handleImpersonate = async () => {
    setImpersonating(true);
    try {
      const result = await superAdminApi.impersonate(id);
      setAccessToken(result.access_token);
      localStorage.setItem('tenant_slug', result.tenant_slug);
      localStorage.setItem('impersonating', 'true');
      localStorage.setItem('impersonating_from', window.location.href);
      window.open('/admin/dashboard', '_blank');
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Impersonate fehlgeschlagen');
    } finally {
      setImpersonating(false);
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

  // Load stats when stats tab is activated
  async function loadStats() {
    if (tenantStats) return;
    setStatsLoading(true);
    try {
      const data = await superAdminApi.getTenantStats(id);
      setTenantStats(data);
    } catch { /* silent fail */ }
    setStatsLoading(false);
  }

  async function loadBilling(force = false) {
    if (billing && !force) return;
    setBillingLoading(true);
    try {
      const data = await superAdminApi.getTenantBilling(id);
      setBilling(data);
    } catch { /* silent fail */ }
    setBillingLoading(false);
  }

  async function loadInvoices() {
    if (tenantInvoices) return;
    setInvoicesLoading(true);
    try {
      const data = await superAdminApi.getInvoices({ tenantId: id, page: 1, pageSize: 50 });
      setTenantInvoices(data.items);
    } catch { /* silent fail */ }
    setInvoicesLoading(false);
  }

  async function loadDomain() {
    if (domainInfo) return;
    setDomainLoading(true);
    try {
      const data = await superAdminApi.getTenantDomain(id);
      setDomainInfo(data);
    } catch { /* silent fail */ }
    setDomainLoading(false);
  }

  async function handleSetDomainStatus(status: 'PendingVerification' | 'Verified' | 'Failed') {
    setDomainUpdating(true);
    try {
      const data = await superAdminApi.setTenantDomainStatus(id, status);
      setDomainInfo((prev) => prev ? { ...prev, status: data.status } : prev);
    } catch { /* silent fail */ }
    setDomainUpdating(false);
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'link', label: 'Buchungslink', icon: <Link2 size={15} /> },
    { key: 'branding', label: 'Branding', icon: <Palette size={15} /> },
    { key: 'users', label: 'Admin-User', icon: <Users size={15} /> },
    { key: 'subscription', label: 'Abo', icon: <CreditCard size={15} /> },
    { key: 'stats', label: 'Statistiken', icon: <BarChart2 size={15} /> },
    { key: 'domain', label: 'Domain', icon: <Globe size={15} /> },
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
            onClick={() => { setActiveTab(tab.key); if (tab.key === 'stats' || tab.key === 'subscription') loadStats(); if (tab.key === 'subscription') { loadBilling(); loadInvoices(); } if (tab.key === 'domain') loadDomain(); }}
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
                className="flex items-center gap-1.5 px-3 py-2 bg-[#6355E4] text-white text-sm rounded-lg hover:bg-[#5646D6] transition-colors shrink-0"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Kopiert' : 'Kopieren'}
              </button>
            </div>
          </div>

          {/* Admin login link */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#6355E4] flex items-center justify-center">
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

          {/* Impersonate */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-900 mb-1">Als Admin einloggen</p>
            <p className="text-xs text-gray-400 mb-3">
              Öffnet den Admin-Bereich dieses Systems in einem neuen Tab. Du siehst alles so wie der Shop-Owner.
            </p>
            <button
              onClick={handleImpersonate}
              disabled={impersonating}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
            >
              <LogIn size={15} />
              {impersonating ? 'Wird eingeloggt…' : 'Als Admin einloggen'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Branding ─────────────────────────────────────────────── */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Branding & Firmeninfo</h2>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl ? (
                  <Image
                    src={resolveLogoUrl(logoUrl)!}
                    alt="Logo"
                    width={64}
                    height={64}
                    unoptimized
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <ImageIcon size={22} className="text-gray-300" />
                )}
              </div>
              <div className="space-y-1">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <button
                  type="button"
                  disabled={logoUploading}
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Upload size={13} />
                  {logoUploading ? 'Hochladen…' : 'Logo hochladen'}
                </button>
                <p className="text-xs text-gray-400">JPG, PNG, WebP · max. 5 MB</p>
                {logoError && <p className="text-xs text-red-500">{logoError}</p>}
              </div>
            </div>
          </div>

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
            className="flex items-center gap-2 bg-[#6355E4] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#5646D6] transition-colors disabled:opacity-50"
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
              className="flex items-center gap-2 bg-[#6355E4] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#5646D6] disabled:opacity-50"
            >
              <Users size={15} />
              {creatingUser ? 'Anlegen...' : userCreated ? '✓ Angelegt' : 'User anlegen'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Abo ──────────────────────────────────────────────────── */}
      {activeTab === 'subscription' && (
        <div className="space-y-4">

          {/* Current status */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Abonnement</h2>

            {sub ? (
              <>
                <div className={`flex items-start gap-4 p-4 rounded-xl border ${
                  sub.isInTrial
                    ? 'bg-yellow-50 border-yellow-200'
                    : sub.status === 'PendingAcceptance' || sub.status === 'PendingActivation'
                    ? 'bg-violet-50 border-violet-200'
                    : sub.status === 'Active'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <Clock size={20} className={
                    sub.isInTrial ? 'text-yellow-600 mt-0.5' : sub.status === 'PendingAcceptance' || sub.status === 'PendingActivation' ? 'text-violet-600 mt-0.5' : sub.status === 'Active' ? 'text-green-600 mt-0.5' : 'text-red-600 mt-0.5'
                  } />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">
                      {sub.isInTrial
                        ? `Trial — ${sub.trialDaysRemaining} Tage verbleibend`
                        : sub.status === 'PendingAcceptance'
                        ? 'Bestätigung ausstehend — Testphase noch nicht gestartet'
                        : sub.status === 'PendingActivation'
                        ? 'Rechtlich bestätigt — manuelle Freigabe ausstehend'
                        : sub.status === 'Active'
                        ? 'Aktives Abonnement'
                        : 'Abgelaufen / Inaktiv'}
                    </p>
                    {sub.isInTrial && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Läuft ab: {new Date(sub.trialEndsAt).toLocaleDateString('de-DE')}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">Plan: <strong>{sub.plan}</strong> · Status: {sub.status}</p>
                  </div>
                </div>

                {sub.status === 'PendingActivation' && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                    <p className="text-sm font-semibold text-violet-900">Alle erforderlichen Bestätigungen liegen vor.</p>
                    <p className="mt-1 text-xs leading-5 text-violet-700">Prüfen Sie die vorbereiteten Unternehmensangaben, Leistungen, Preise, Mitarbeiter, Arbeitszeiten, Buchungs- und Stornierungsbedingungen. Erst der folgende Schritt startet den Testzeitraum.</p>
                    {trialActivationError && <p className="mt-3 text-xs text-red-600">{trialActivationError}</p>}
                    <button
                      type="button"
                      onClick={handleActivatePreparedTrial}
                      disabled={activatingTrial}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      <Check size={15} />
                      {activatingTrial ? 'Wird freigegeben…' : '14-tägigen Test jetzt freigeben'}
                    </button>
                  </div>
                )}

                {/* Mollie / Zahlungsdetails */}
                {(sub.mollieCustomerId || sub.mollieSubscriptionId) && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">Mollie-Zahlungsdetails</p>
                      <a
                        href="https://my.mollie.com/dashboard/"
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[#6355E4] hover:underline flex items-center gap-1"
                      >
                        Im Mollie-Dashboard öffnen <ExternalLink size={11} />
                      </a>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div>
                        <p className="text-gray-400">Mollie-Kunde</p>
                        <p className="font-mono text-gray-700 truncate">{sub.mollieCustomerId ?? '–'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Mollie-Abo</p>
                        <p className="font-mono text-gray-700 truncate">{sub.mollieSubscriptionId ?? '–'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">SEPA-Mandat</p>
                        <p className="font-mono text-gray-700 truncate">{sub.mollieMandateId ?? '–'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Mandat signiert am</p>
                        <p className="text-gray-700">
                          {sub.mollieMandateSignedAt ? new Date(sub.mollieMandateSignedAt).toLocaleDateString('de-DE') : '–'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Letzte Zahlung (Mollie-ID)</p>
                        <p className="font-mono text-gray-700 truncate">{sub.lastMolliePaymentId ?? '–'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Aktuelle Abrechnungsperiode</p>
                        <p className="text-gray-700">
                          {sub.currentPeriodStart && sub.currentPeriodEnd
                            ? `${new Date(sub.currentPeriodStart).toLocaleDateString('de-DE')} – ${new Date(sub.currentPeriodEnd).toLocaleDateString('de-DE')}`
                            : '–'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live-Status von Mollie */}
                {(sub.mollieCustomerId || sub.mollieSubscriptionId) && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">Live-Status von Mollie</p>
                      <button
                        type="button"
                        onClick={() => loadBilling(true)}
                        disabled={billingLoading}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={billingLoading ? 'animate-spin' : ''} />
                        Aktualisieren
                      </button>
                    </div>

                    {billingLoading && !billing ? (
                      <div className="animate-pulse h-16 bg-gray-100 rounded-lg" />
                    ) : billing && !billing.available ? (
                      <p className="text-xs text-red-600">{billing.error ?? 'Live-Abfrage bei Mollie derzeit nicht möglich.'}</p>
                    ) : billing ? (
                      <>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                          <div>
                            <p className="text-gray-400">SEPA-Mandat (live)</p>
                            <p className={`flex items-center gap-1 font-medium ${
                              billing.mandateStatus === 'valid' ? 'text-green-700' : billing.mandateStatus === 'pending' ? 'text-amber-700' : 'text-red-700'
                            }`}>
                              {billing.mandateStatus === 'valid' ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                              {billing.mandateStatus ?? '–'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Kontoinhaber</p>
                            <p className="text-gray-700">{billing.consumerName ?? '–'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">IBAN</p>
                            <p className="font-mono text-gray-700">{billing.consumerAccountMasked ?? '–'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Nächste Abbuchung (live)</p>
                            <p className="text-gray-700 font-medium">
                              {billing.nextPaymentDate ? new Date(billing.nextPaymentDate).toLocaleDateString('de-DE') : '–'}
                            </p>
                          </div>
                        </div>

                        {billing.recentPayments.length > 0 && (
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-400 mb-1.5">Letzte Mollie-Zahlungen</p>
                            <div className="space-y-1">
                              {billing.recentPayments.map(p => (
                                <div key={p.id} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600 truncate mr-2">{p.description ?? p.id}</span>
                                  <span className="flex items-center gap-2 shrink-0">
                                    <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                                      p.status === 'paid' ? 'bg-green-50 text-green-700' :
                                      p.status === 'failed' || p.status === 'canceled' || p.status === 'expired' ? 'bg-red-50 text-red-700' :
                                      'bg-amber-50 text-amber-700'
                                    }`}>{p.status}</span>
                                    <span className="text-gray-500">{p.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} {p.currency}</span>
                                    <span className="text-gray-400 w-20 text-right">{new Date(p.createdAt).toLocaleDateString('de-DE')}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                )}

                {/* Rechnungen */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Rechnungen</p>
                  {invoicesLoading && !tenantInvoices ? (
                    <div className="animate-pulse h-16 bg-gray-100 rounded-lg" />
                  ) : tenantInvoices && tenantInvoices.length > 0 ? (
                    <div className="space-y-1">
                      {tenantInvoices.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                          <span className="flex items-center gap-1.5 text-gray-700">
                            <FileText size={12} className="text-gray-400" />
                            {inv.invoiceNumber} · {inv.planName}
                          </span>
                          <span className="flex items-center gap-3 text-gray-500">
                            <span>{new Date(inv.issueDate).toLocaleDateString('de-DE')}</span>
                            <span className="font-medium text-gray-700">{inv.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} {inv.currency}</span>
                            <a href={superAdminApi.invoicePdfUrl(inv.id)} target="_blank" rel="noopener noreferrer" className="text-[#6355E4] hover:underline flex items-center gap-0.5">
                              <Download size={11} /> PDF
                            </a>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Noch keine Rechnungen für diesen Kunden.</p>
                  )}
                </div>

                {/* Revenue Overview */}
                {tenantStats && (
                  <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{tenantStats.totalBookings}</p>
                      <p className="text-xs text-gray-400">Buchungen</p>
                    </div>
                    <div className="text-center border-x border-gray-200">
                      <p className="text-lg font-bold text-[#6355E4]">
                        {tenantStats.totalRevenue > 0
                          ? `${(tenantStats.totalRevenue / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })} ${sub.plan}`
                          : '–'}
                      </p>
                      <p className="text-xs text-gray-400">Gesamtumsatz</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{tenantStats.totalCustomers}</p>
                      <p className="text-xs text-gray-400">Kunden</p>
                    </div>
                  </div>
                )}

                {/* Plan change */}
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-3">Plan wechseln</p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      {
                        value: 'Trial',
                        label: 'Trial',
                        price: 'Kostenlos',
                        employees: '–',
                        color: '#6b7280',
                        bg: '#f3f4f6',
                        features: ['14 Tage kostenlos', 'Alle Features', 'Kein Kredit nötig'],
                      },
                      {
                        value: 'Starter',
                        label: 'Starter',
                        price: '€29/Monat',
                        employees: '2 Mitarb.',
                        color: '#3b82f6',
                        bg: '#eff6ff',
                        features: ['2 Mitarbeiter', '15 Services', 'Standard Support'],
                      },
                      {
                        value: 'Professional',
                        label: 'Professional',
                        price: '€59/Monat',
                        employees: '10 Mitarb.',
                        color: '#8b5cf6',
                        bg: '#f5f3ff',
                        features: ['10 Mitarbeiter', '50 Services', 'Analytics & Reports', 'Priority Support'],
                      },
                      {
                        value: 'Agency',
                        label: 'Agency',
                        price: 'Preis auf Anfrage',
                        employees: 'Unbegrenzt',
                        color: '#f59e0b',
                        bg: '#fffbeb',
                        features: ['∞ Mitarbeiter', '∞ Services', 'API-Zugang', 'Dedizierter Manager'],
                      },
                    ].map(({ value, label, price, employees, color, bg, features }) => {
                      const isSelected = selectedPlan === value;
                      const isCurrent = sub.plan === value && !sub.isInTrial && value !== 'Trial';
                      const isCurrentTrial = value === 'Trial' && sub.isInTrial;
                      const active = isCurrent || isCurrentTrial;
                      return (
                        <button
                          key={value}
                          onClick={() => setSelectedPlan(value)}
                          className={`p-4 border-2 rounded-xl text-left transition-all hover:-translate-y-0.5 ${
                            isSelected
                              ? 'border-[#6355E4] shadow-md'
                              : active
                              ? 'border-gray-300 bg-gray-50'
                              : 'border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div
                              className="px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: bg, color }}
                            >
                              {label}
                            </div>
                            {active && (
                              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                Aktiv
                              </span>
                            )}
                            {isSelected && !active && (
                              <Check size={14} className="text-gray-900" />
                            )}
                          </div>
                          <p className="font-bold text-gray-900 text-base">{price}</p>
                          <p className="text-xs text-gray-400 mt-0.5 mb-2">{employees}</p>
                          <ul className="space-y-0.5">
                            {features.map((f) => (
                              <li key={f} className="text-xs text-gray-500 flex items-center gap-1">
                                <span style={{ color }}>✓</span> {f}
                              </li>
                            ))}
                          </ul>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleChangePlan}
                    disabled={changingPlan || !selectedPlan || selectedPlan === (sub.isInTrial ? 'Trial' : sub.plan)}
                    className="flex items-center gap-2 bg-[#6355E4] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#5646D6] disabled:opacity-40 transition-colors shadow-sm"
                  >
                    <CreditCard size={15} />
                    {changingPlan ? 'Wird gespeichert...' : planChanged ? '✓ Gespeichert' : 'Plan speichern'}
                  </button>
                  {planChanged && (
                    <p className="text-xs text-green-600 mt-2">Plan erfolgreich geändert.</p>
                  )}
                </div>

                {/* Extend trial */}
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Trial verlängern</p>
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

          {/* Onboarding email resend */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">📧 Onboarding-Mail</h2>
            <p className="text-sm text-gray-500">
              {sub?.status === 'PendingAcceptance'
                ? 'Sendet einen neuen Link zur Bestätigung von B2B-Eigenschaft, AGB, Datenschutz und AVV.'
                : sub?.status === 'PendingActivation'
                ? 'Die Bestätigungen liegen vor. Geben Sie den Test zuerst über die gesonderte Testfreigabe frei.'
                : 'Sendet die vollständige Willkommens-Mail mit einem frischen Passwort-Link (72h gültig) erneut an den Admin-User.'}
            </p>
            {welcomeResent && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
                ✓ Mail wurde erfolgreich versandt.
              </p>
            )}
            {resendError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{resendError}</p>
            )}
            <button
              onClick={handleResendWelcome}
              disabled={resendingWelcome || welcomeResent || sub?.status === 'PendingActivation'}
              className="flex items-center gap-2 bg-[#6355E4] hover:bg-[#5646D6] text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
            >
              <Mail size={15} />
              {resendingWelcome
                ? 'Senden...'
                : welcomeResent
                ? '✓ Gesendet'
                : sub?.status === 'PendingAcceptance'
                ? 'Bestätigungslink erneut senden'
                : sub?.status === 'PendingActivation'
                ? 'Manuelle Testfreigabe erforderlich'
                : 'Willkommens-Mail erneut senden'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Statistiken ───────────────────────────────────────────── */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {statsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : tenantStats ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Buchungen gesamt', value: tenantStats.totalBookings,  icon: <Calendar size={16} />,   color: '#3b82f6', bg: '#eff6ff' },
                  { label: 'Kunden',           value: tenantStats.totalCustomers, icon: <UsersIcon2 size={16} />, color: '#8b5cf6', bg: '#f5f3ff' },
                  { label: 'Mitarbeiter',      value: tenantStats.totalEmployees, icon: <UsersIcon2 size={16} />, color: '#06b6d4', bg: '#ecfeff' },
                  { label: 'Abgeschlossen',    value: tenantStats.completedCount, icon: <TrendingUp size={16} />, color: '#22c55e', bg: '#f0fdf4' },
                ].map(({ label, value, icon, color, bg }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: bg }}>
                      <span style={{ color }}>{icon}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Booking Status Split */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-4">Buchungsstatus</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Bestätigt',     value: tenantStats.confirmedCount, color: '#22c55e', bg: '#f0fdf4' },
                    { label: 'Abgebrochen',   value: tenantStats.cancelledCount, color: '#ef4444', bg: '#fef2f2' },
                    { label: 'Abgeschlossen', value: tenantStats.completedCount, color: '#3b82f6', bg: '#eff6ff' },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className="rounded-xl p-4 text-center" style={{ background: bg }}>
                      <p className="text-3xl font-black" style={{ color }}>{value}</p>
                      <p className="text-xs mt-1" style={{ color }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Chart (CSS bars, no library needed) */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-4">Buchungen — letzte 6 Monate</h3>
                {tenantStats.monthlyStats.every(m => m.bookings === 0) ? (
                  <p className="text-sm text-gray-400 text-center py-6">Noch keine Buchungen in diesem Zeitraum</p>
                ) : (
                  <div className="flex items-end gap-2 h-32">
                    {(() => {
                      const maxVal = Math.max(...tenantStats.monthlyStats.map(m => m.bookings), 1);
                      return tenantStats.monthlyStats.map((m, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-semibold text-gray-600">{m.bookings > 0 ? m.bookings : ''}</span>
                          <div className="w-full bg-blue-100 rounded-t-lg transition-all" style={{ height: `${Math.max(4, (m.bookings / maxVal) * 96)}px`, background: m.bookings > 0 ? '#3b82f6' : '#e5e7eb' }} />
                          <span className="text-xs text-gray-400 text-center leading-tight">{m.label.split(' ')[0]}</span>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <BarChart2 size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">Fehler beim Laden der Statistiken</p>
              <button onClick={loadStats} className="mt-3 text-xs text-blue-500 hover:underline">Erneut versuchen</button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Domain ────────────────────────────────────────────────── */}
      {activeTab === 'domain' && (
        <div className="space-y-4">
          {domainLoading ? (
            <div className="h-32 bg-white rounded-xl animate-pulse border border-gray-100" />
          ) : !domainInfo?.domain ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <Globe size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">Für diesen Tenant wurde noch keine eigene Domain beantragt.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Beantragte Domain</p>
                <p className="text-lg font-bold text-gray-900 font-mono">{domainInfo.domain}</p>
                {domainInfo.requestedAt && (
                  <p className="text-xs text-gray-400 mt-1">Beantragt am {new Date(domainInfo.requestedAt).toLocaleDateString('de-DE')}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Status:</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  domainInfo.status === 'Verified' ? 'bg-green-50 text-green-700' :
                  domainInfo.status === 'Failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {domainInfo.status === 'Verified' ? 'Aktiv' : domainInfo.status === 'Failed' ? 'Fehlgeschlagen' : 'Wird geprüft'}
                </span>
              </div>

              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3.5 text-xs text-gray-600 leading-relaxed">
                <p className="font-semibold text-gray-700 mb-1">Manueller Einrichtungsschritt (noch keine automatische Vercel-Anbindung):</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Domain im Vercel-Projekt unter „Domains" hinzufügen.</li>
                  <li>DNS-Eintrag beim Kunden gemäß Vercel-Anleitung setzen lassen.</li>
                  <li>Sobald Vercel die Domain als aktiv anzeigt: unten auf „Als aktiv markieren" klicken.</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSetDomainStatus('Verified')}
                  disabled={domainUpdating || domainInfo.status === 'Verified'}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
                >
                  Als aktiv markieren
                </button>
                <button
                  onClick={() => handleSetDomainStatus('Failed')}
                  disabled={domainUpdating || domainInfo.status === 'Failed'}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40"
                >
                  Als fehlgeschlagen markieren
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Danger Zone ─────────────────────────────────────────────── */}
      <div className="mt-8 border border-red-200 rounded-2xl p-6 bg-red-50/30">
        <h3 className="text-sm font-bold text-red-700 mb-1">Gefahrenzone</h3>
        <p className="text-xs text-red-500/80 mb-4">
          Löscht dieses System permanent — alle Buchungen, Mitarbeiter, Kunden und Daten werden unwiderruflich entfernt.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold shadow-sm shadow-red-200 disabled:opacity-50 hover:bg-red-600 transition-colors"
        >
          <Trash2 size={14} />
          {deleting ? 'Wird gelöscht…' : 'System endgültig löschen'}
        </button>
      </div>

      {dialog}
    </div>
  );
}

// app/superadmin/tenants/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Building2, Clock, CheckCircle, XCircle, AlertCircle,
  Settings, Power, Trash2, Search, RefreshCw, ExternalLink,
  Users, Calendar, X, Loader2, TrendingUp, AlertTriangle, Zap,
} from 'lucide-react';
import { superAdminApi, TenantListItem } from '@/lib/api/superadmin';
import { useConfirm } from '@/components/ConfirmDialog';

// ── Constants ────────────────────────────────────────────────────────────────

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

const INDUSTRY_COLORS: Record<string, string> = {
  Hairdresser: 'bg-pink-100 text-pink-700',
  Beauty: 'bg-purple-100 text-purple-700',
  Massage: 'bg-teal-100 text-teal-700',
  Nail: 'bg-rose-100 text-rose-700',
  Barbershop: 'bg-blue-100 text-blue-700',
  Tattoo: 'bg-gray-800 text-white',
  Physio: 'bg-green-100 text-green-700',
  Other: 'bg-gray-100 text-gray-600',
};

const INDUSTRIES = Object.entries(INDUSTRY_LABELS);

const DEFAULT_NEW = {
  name: '',
  slug: '',
  industryType: 'Hairdresser',
  primaryColor: '#6355E4',
  currency: 'CHF',
  timeZone: 'Europe/Zurich',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function trialProgressPct(days: number, total = 14) {
  return Math.max(0, Math.min(100, ((total - days) / total) * 100));
}

function trialBarColor(days: number) {
  if (days <= 2) return '#ef4444';
  if (days <= 5) return '#f59e0b';
  return '#22c55e';
}

function formatTrialEnd(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accent + '20' }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function IndustryPill({ industry }: { industry: string }) {
  const cls = INDUSTRY_COLORS[industry] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {INDUSTRY_LABELS[industry] ?? industry}
    </span>
  );
}

function TrialProgressBar({ days }: { days: number }) {
  const pct = trialProgressPct(days);
  const color = trialBarColor(days);
  return (
    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

const PLAN_STYLES: Record<string, { cls: string; label: string }> = {
  Trial:        { cls: 'bg-gray-100 text-gray-600 border border-gray-200',           label: 'Trial' },
  Starter:      { cls: 'bg-blue-50 text-blue-700 border border-blue-200',            label: 'Starter' },
  Professional: { cls: 'bg-purple-50 text-purple-700 border border-purple-200',      label: 'Pro' },
  Agency:       { cls: 'bg-amber-50 text-amber-700 border border-amber-200',         label: 'Agency' },
};

function PlanQuickChange({
  tenantId, currentPlan, isInTrial, isChanging, onChange,
}: {
  tenantId: string;
  currentPlan?: string;
  isInTrial?: boolean;
  isChanging: boolean;
  onChange: (plan: string) => void;
}) {
  const plan = isInTrial ? 'Trial' : (currentPlan ?? 'Trial');
  const style = PLAN_STYLES[plan] ?? PLAN_STYLES['Trial'];
  return (
    <div className="flex items-center gap-1">
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.cls}`}>
        {style.label}
      </span>
      {isChanging ? (
        <Loader2 size={12} className="animate-spin text-gray-400" />
      ) : (
        <select
          value={isInTrial ? 'Trial' : (currentPlan ?? 'Trial')}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs text-gray-400 bg-transparent border-0 cursor-pointer hover:text-gray-700 outline-none py-0 pl-0 pr-4 appearance-none"
          title="Plan ändern"
        >
          <option value="Trial">Trial</option>
          <option value="Starter">Starter (€29)</option>
          <option value="Professional">Pro (€59)</option>
          <option value="Agency">Agency (auf Anfrage)</option>
        </select>
      )}
    </div>
  );
}

function SubscriptionCell({ sub }: { sub: TenantListItem['subscription'] }) {
  if (!sub) return <span className="text-xs text-gray-300">–</span>;

  if (sub.status === 'Trial') {
    const color = trialBarColor(sub.trialDaysRemaining);
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: color + '20', color }}
          >
            {sub.trialDaysRemaining}d übrig
          </span>
        </div>
        <TrialProgressBar days={sub.trialDaysRemaining} />
        <p className="text-xs text-gray-400">{formatTrialEnd((sub as any).trialEndsAt)}</p>
      </div>
    );
  }

  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    Active: { label: 'Aktiv', cls: 'bg-green-50 text-green-700 border border-green-200', icon: <CheckCircle size={11} /> },
    PendingAcceptance: { label: 'Bestätigung ausstehend', cls: 'bg-blue-50 text-blue-700 border border-blue-200', icon: <Clock size={11} /> },
    PendingActivation: { label: 'Bereit zur Freigabe', cls: 'bg-violet-50 text-violet-700 border border-violet-200', icon: <CheckCircle size={11} /> },
    Expired: { label: 'Abgelaufen', cls: 'bg-red-50 text-red-700 border border-red-200', icon: <XCircle size={11} /> },
    PastDue: { label: 'Überfällig', cls: 'bg-orange-50 text-orange-700 border border-orange-200', icon: <AlertCircle size={11} /> },
    Cancelled: { label: 'Gekündigt', cls: 'bg-gray-100 text-gray-500', icon: null },
  };
  const c = cfg[sub.status] ?? cfg['Active'];
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${c.cls}`}>
      {c.icon}{c.label}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTenant, setNewTenant] = useState(DEFAULT_NEW);
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [extendingTrial, setExtendingTrial] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [error, setError] = useState('');
  const { confirm, dialog } = useConfirm();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await superAdminApi.getTenants();
      setTenants(res.items);
    } catch { setError('Laden fehlgeschlagen'); }
    setLoading(false);
  }

  function handleNameChange(name: string) {
    setNewTenant(p => ({ ...p, name, slug: generateSlug(name) }));
  }

  async function createTenant() {
    if (!newTenant.name || !newTenant.slug || !newTenant.adminEmail) return;
    setCreating(true);
    setError('');
    try {
      await superAdminApi.createTenant({
        name: newTenant.name,
        slug: newTenant.slug.trim(),
        industryType: newTenant.industryType,
        currency: newTenant.currency,
        timeZone: newTenant.timeZone,
        adminEmail: newTenant.adminEmail,
        adminFirstName: newTenant.adminFirstName || newTenant.name,
        adminLastName: newTenant.adminLastName || 'Admin',
      });
      setShowAddForm(false);
      setNewTenant(DEFAULT_NEW);
      await load();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Fehler beim Anlegen');
    }
    setCreating(false);
  }

  async function toggleActive(t: TenantListItem) {
    setToggling(t.id);
    try {
      if (t.isActive) await superAdminApi.deactivateTenant(t.id);
      else await superAdminApi.activateTenant(t.id);
      setTenants(prev => prev.map(x => x.id === t.id ? { ...x, isActive: !x.isActive } : x));
    } catch {}
    setToggling(null);
  }

  async function deleteTenant(t: TenantListItem) {
    const ok = await confirm({
      title: `"${t.companyName || t.name}" löschen?`,
      message: 'Alle Buchungen, Mitarbeiter, Kunden und Daten werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.',
      variant: 'danger',
      confirmLabel: 'Endgültig löschen',
    });
    if (!ok) return;
    setDeleting(t.id);
    try {
      await superAdminApi.deleteTenant(t.id);
      setTenants(prev => prev.filter(x => x.id !== t.id));
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Löschen fehlgeschlagen');
    }
    setDeleting(null);
  }

  async function handleChangePlan(t: TenantListItem, plan: string) {
    // Agency has no fixed price ("Preis auf Anfrage") — ask for the individually negotiated
    // monthly price before switching a tenant onto it.
    let negotiatedMonthlyPrice: number | undefined;
    if (plan === 'Agency') {
      const raw = window.prompt(`Individuellen Monatspreis für ${t.name} (Agency) festlegen (€):`);
      if (raw === null) return;
      const parsed = Number(raw.replace(',', '.'));
      if (!raw.trim() || Number.isNaN(parsed) || parsed <= 0) {
        alert('Bitte einen gültigen Preis eingeben.');
        return;
      }
      negotiatedMonthlyPrice = parsed;
    }
    setChangingPlan(t.id);
    try {
      const result = await superAdminApi.changePlan(t.id, plan, { negotiatedMonthlyPrice });
      setTenants(prev => prev.map(x => x.id === t.id
        ? { ...x, subscription: { ...x.subscription!, plan: result.plan, status: result.status } }
        : x));
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Plan-Änderung fehlgeschlagen');
    }
    setChangingPlan(null);
  }

  async function handleExtendTrial(t: TenantListItem) {
    setExtendingTrial(t.id);
    try {
      const result = await superAdminApi.extendTrial(t.id, 7);
      setTenants(prev => prev.map(x => x.id === t.id
        ? { ...x, subscription: { ...x.subscription!, ...result } }
        : x));
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Fehler beim Verlängern');
    }
    setExtendingTrial(null);
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const filtered = tenants.filter(t => {
    if (statusFilter === 'active' && !t.isActive) return false;
    if (statusFilter === 'inactive' && t.isActive) return false;
    if (search) {
      const s = search.toLowerCase();
      return (t.companyName || t.name).toLowerCase().includes(s) || t.slug.toLowerCase().includes(s);
    }
    return true;
  });

  const activeCnt   = tenants.filter(t => t.isActive).length;
  const trialCnt    = tenants.filter(t => t.subscription?.status === 'Trial').length;
  const expiringSoon = tenants.filter(t => t.subscription?.isInTrial && (t.subscription?.trialDaysRemaining ?? 99) <= 7);
  const expiredCnt  = tenants.filter(t => t.subscription?.status === 'Expired').length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 -m-8 p-8 space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buchungssysteme</h1>
          <p className="text-gray-400 text-sm mt-0.5">Alle Tenants auf einen Blick</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors shadow-sm border border-gray-100"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-2 bg-[#6355E4] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#5646D6] transition-colors shadow-sm"
          >
            {showAddForm ? <X size={15} /> : <Plus size={15} />}
            {showAddForm ? 'Abbrechen' : 'Neues System'}
          </button>
        </div>
      </div>

      {/* ── Stats-Bar ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Gesamt" value={tenants.length} icon={<Building2 size={18} />} accent="#6b7280" />
        <StatCard label="Aktiv" value={activeCnt} icon={<CheckCircle size={18} />} accent="#22c55e" />
        <StatCard label="Im Trial" value={trialCnt} icon={<Clock size={18} />} accent="#eab308" />
        <StatCard label="Läuft ab ≤7d" value={expiringSoon.length} icon={<AlertTriangle size={18} />} accent="#f97316" />
        <StatCard label="Abgelaufen" value={expiredCnt} icon={<XCircle size={18} />} accent="#ef4444" />
      </div>

      {/* ── Trial-Alarm-Sektion ────────────────────────────────────────────── */}
      {expiringSoon.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <h2 className="font-semibold text-gray-800 text-sm">
              Trial läuft bald ab — {expiringSoon.length} {expiringSoon.length === 1 ? 'System' : 'Systeme'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiringSoon.map(t => {
              const days = t.subscription!.trialDaysRemaining;
              const isUrgent = days <= 2;
              const color = trialBarColor(days);
              return (
                <div
                  key={t.id}
                  className={`rounded-xl border p-4 ${isUrgent ? 'border-red-300 bg-red-50' : 'border-amber-200 bg-amber-50'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{t.companyName || t.name}</p>
                      <IndustryPill industry={t.industryType} />
                    </div>
                    <span
                      className="text-lg font-black tabular-nums px-2 py-0.5 rounded-lg"
                      style={{ background: color + '20', color }}
                    >
                      {days}d
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-white/70 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${trialProgressPct(days)}%`, background: color }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Läuft ab: <span className="font-medium">{formatTrialEnd((t.subscription as any)?.trialEndsAt)}</span>
                    </p>
                    <button
                      onClick={() => handleExtendTrial(t)}
                      disabled={extendingTrial === t.id}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {extendingTrial === t.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Zap size={12} className="text-amber-500" />}
                      + 7 Tage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Neues System Formular ─────────────────────────────────────────── */}
      {showAddForm && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-gray-400" />
            Neues Buchungssystem anlegen
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Firmenname *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                placeholder="Barber Wagner GmbH"
                value={newTenant.name}
                onChange={e => handleNameChange(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">URL-Slug *</label>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-gray-400">
                <span className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-r border-gray-200">/booking/</span>
                <input
                  className="flex-1 px-3 py-2 text-sm focus:outline-none"
                  placeholder="barber-wagner"
                  value={newTenant.slug}
                  onChange={e => setNewTenant(p => ({ ...p, slug: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Branche</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                value={newTenant.industryType}
                onChange={e => setNewTenant(p => ({ ...p, industryType: e.target.value }))}
              >
                {INDUSTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hauptfarbe</label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 focus-within:border-gray-400">
                <input
                  type="color"
                  value={newTenant.primaryColor}
                  onChange={e => setNewTenant(p => ({ ...p, primaryColor: e.target.value }))}
                  className="w-7 h-7 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={newTenant.primaryColor}
                  onChange={e => setNewTenant(p => ({ ...p, primaryColor: e.target.value }))}
                  className="flex-1 text-sm font-mono focus:outline-none"
                  maxLength={7}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Währung</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                value={newTenant.currency}
                onChange={e => setNewTenant(p => ({ ...p, currency: e.target.value }))}
              >
                <option value="CHF">CHF</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Zeitzone</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                value={newTenant.timeZone}
                onChange={e => setNewTenant(p => ({ ...p, timeZone: e.target.value }))}
              >
                <option value="Europe/Zurich">Europe/Zurich (CH)</option>
                <option value="Europe/Berlin">Europe/Berlin (DE)</option>
                <option value="Europe/Vienna">Europe/Vienna (AT)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Admin E-Mail *</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                placeholder="admin@salon.ch"
                value={newTenant.adminEmail}
                onChange={e => setNewTenant(p => ({ ...p, adminEmail: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
            <p className="text-sm text-blue-800">
              Der Mandant bleibt zunächst inaktiv. <strong>{newTenant.adminEmail || 'Der Admin'}</strong> bestätigt B2B-Nutzung, AGB, Datenschutz und AVV per E-Mail. Danach geben Sie den Test manuell frei; erst dann beginnen die 14 Tage und die Passwortvergabe.
            </p>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => { setShowAddForm(false); setNewTenant(DEFAULT_NEW); setError(''); }}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={createTenant}
              disabled={creating || !newTenant.name || !newTenant.slug || !newTenant.adminEmail}
              className="flex items-center gap-2 px-5 py-2 bg-[#6355E4] text-white text-sm font-medium rounded-lg hover:bg-[#5646D6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {creating ? 'Wird angelegt…' : 'System anlegen'}
            </button>
          </div>
        </div>
      )}

      {/* ── Such- + Filterleiste ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 shadow-sm"
            placeholder="Suche nach Name oder Slug…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm shadow-sm bg-white">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-2 transition-colors ${statusFilter === f ? 'bg-[#6355E4] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {f === 'all' ? 'Alle' : f === 'active' ? 'Aktiv' : 'Inaktiv'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabelle ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Building2 size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">
            {search || statusFilter !== 'all' ? 'Keine Systeme gefunden' : 'Noch kein Buchungssystem angelegt'}
          </p>
          {!search && statusFilter === 'all' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex items-center gap-2 bg-[#6355E4] text-white px-4 py-2.5 rounded-lg text-sm font-medium"
            >
              <Plus size={15} />
              Erstes System anlegen
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white text-xs font-medium uppercase tracking-wide">
                <th className="px-4 py-3 text-left w-10"></th>
                <th className="px-4 py-3 text-left">Firma</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Slug</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Mitarb.</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Buchungen</th>
                <th className="px-4 py-3 text-left">Subscription</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Nächste Abbuchung</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Plan</th>
                <th className="px-4 py-3 text-center hidden lg:table-cell">Online</th>
                <th className="px-4 py-3 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/70 transition-colors">

                  {/* Color Dot */}
                  <td className="px-4 py-3">
                    <div
                      className="w-8 h-8 rounded-lg border border-gray-200 flex-shrink-0"
                      style={{ backgroundColor: t.primaryColor || '#6355E4' }}
                      title={t.primaryColor}
                    />
                  </td>

                  {/* Name + Branche */}
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{t.companyName || t.name}</p>
                    <div className="mt-1">
                      <IndustryPill industry={t.industryType} />
                    </div>
                  </td>

                  {/* Slug */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">/{t.slug}</code>
                  </td>

                  {/* Mitarbeiter */}
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <div className="flex items-center justify-center gap-1 text-gray-600">
                      <Users size={13} className="text-gray-400" />
                      <span className="font-medium">{t.employeeCount ?? '–'}</span>
                    </div>
                  </td>

                  {/* Buchungen */}
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <div className="flex items-center justify-center gap-1 text-gray-600">
                      <Calendar size={13} className="text-gray-400" />
                      <span className="font-medium">{t.bookingCount ?? '–'}</span>
                    </div>
                  </td>

                  {/* Subscription / Trial */}
                  <td className="px-4 py-3">
                    <SubscriptionCell sub={t.subscription} />
                  </td>

                  {/* Nächste Abbuchung */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {t.subscription?.currentPeriodEnd ? (
                      <span className={`text-xs ${t.subscription.pastDueSince ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>
                        {new Date(t.subscription.currentPeriodEnd).toLocaleDateString('de-DE')}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">–</span>
                    )}
                  </td>

                  {/* Plan Schnell-Wechsel */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <PlanQuickChange
                      tenantId={t.id}
                      currentPlan={t.subscription?.plan}
                      isInTrial={t.subscription?.isInTrial}
                      isChanging={changingPlan === t.id}
                      onChange={(plan) => handleChangePlan(t, plan)}
                    />
                  </td>

                  {/* Online-Status */}
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${t.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {t.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>

                  {/* Aktionen */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* + 7 Tage — nur bei aktiven Trial-Tenants */}
                      {t.subscription?.isInTrial && (
                        <button
                          onClick={() => handleExtendTrial(t)}
                          disabled={extendingTrial === t.id}
                          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                          title="Trial um 7 Tage verlängern"
                        >
                          {extendingTrial === t.id
                            ? <Loader2 size={11} className="animate-spin" />
                            : <Zap size={11} />}
                          +7d
                        </button>
                      )}
                      <Link
                        href={`/superadmin/tenants/${t.id}`}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Einstellungen"
                      >
                        <Settings size={15} />
                      </Link>
                      <a
                        href={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/booking/${t.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Buchungsseite öffnen"
                      >
                        <ExternalLink size={15} />
                      </a>
                      <button
                        onClick={() => toggleActive(t)}
                        disabled={toggling === t.id || t.subscription?.status === 'PendingAcceptance' || t.subscription?.status === 'PendingActivation'}
                        className={`p-1.5 rounded-lg transition-colors ${t.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                        title={t.subscription?.status === 'PendingActivation' ? 'Test in den Mandantendetails freigeben' : t.subscription?.status === 'PendingAcceptance' ? 'Rechtliche Bestätigung ausstehend' : t.isActive ? 'Deaktivieren' : 'Aktivieren'}
                      >
                        {toggling === t.id ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />}
                      </button>
                      <button
                        onClick={() => deleteTenant(t)}
                        disabled={deleting === t.id}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Löschen"
                      >
                        {deleting === t.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {filtered.length} von {tenants.length} Systemen angezeigt
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400" /> Aktiv
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400" /> Trial
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" /> Abgelaufen
              </span>
            </div>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}

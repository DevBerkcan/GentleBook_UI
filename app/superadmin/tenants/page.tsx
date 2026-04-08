// app/superadmin/tenants/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus, Building2, Clock, CheckCircle, XCircle, AlertCircle,
  Settings, Power, Trash2, Search, RefreshCw, ExternalLink,
  Users, Calendar, X, Loader2,
} from 'lucide-react';
import { superAdminApi, TenantListItem } from '@/lib/api/superadmin';

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

const INDUSTRIES = Object.entries(INDUSTRY_LABELS);

function SubscriptionBadge({ sub }: { sub: TenantListItem['subscription'] }) {
  if (!sub) return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-400">–</span>;

  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    Trial: { label: `Trial ${sub.trialDaysRemaining}d`, cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200', icon: <Clock size={11} /> },
    Active: { label: 'Aktiv', cls: 'bg-green-50 text-green-700 border border-green-200', icon: <CheckCircle size={11} /> },
    Expired: { label: 'Abgelaufen', cls: 'bg-red-50 text-red-700 border border-red-200', icon: <XCircle size={11} /> },
    PastDue: { label: 'Überfällig', cls: 'bg-orange-50 text-orange-700 border border-orange-200', icon: <AlertCircle size={11} /> },
    Cancelled: { label: 'Gekündigt', cls: 'bg-gray-100 text-gray-500', icon: null },
  };
  const c = cfg[sub.status] ?? cfg['Trial'];
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>
      {c.icon}{c.label}
    </span>
  );
}

const DEFAULT_NEW = {
  name: '',
  slug: '',
  industryType: 'Hairdresser',
  primaryColor: '#E8C7C3',
  currency: 'CHF',
  timeZone: 'Europe/Zurich',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPassword: '',
};

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

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
  const [error, setError] = useState('');

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
    if (!newTenant.name || !newTenant.slug || !newTenant.adminEmail || !newTenant.adminPassword) return;
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
        adminPassword: newTenant.adminPassword,
        adminFirstName: newTenant.adminFirstName || newTenant.name,
        adminLastName: newTenant.adminLastName || 'Admin',
      });
      // Update branding color
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
    if (!confirm(`"${t.companyName || t.name}" wirklich löschen?\n\nAlle Buchungen, Mitarbeiter und Daten werden unwiderruflich gelöscht!`)) return;
    setDeleting(t.id);
    try {
      await superAdminApi.deleteTenant(t.id);
      setTenants(prev => prev.filter(x => x.id !== t.id));
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Löschen fehlgeschlagen');
    }
    setDeleting(null);
  }

  const filtered = tenants.filter(t => {
    if (statusFilter === 'active' && !t.isActive) return false;
    if (statusFilter === 'inactive' && t.isActive) return false;
    if (search) {
      const s = search.toLowerCase();
      return (t.companyName || t.name).toLowerCase().includes(s) || t.slug.toLowerCase().includes(s);
    }
    return true;
  });

  const activeCnt = tenants.filter(t => t.isActive).length;
  const trialCnt = tenants.filter(t => t.subscription?.status === 'Trial').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buchungssysteme</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {tenants.length} gesamt · {activeCnt} aktiv · {trialCnt} im Trial
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            {showAddForm ? <X size={15} /> : <Plus size={15} />}
            {showAddForm ? 'Abbrechen' : 'Neues System'}
          </button>
        </div>
      </div>

      {/* Inline-Formular */}
      {showAddForm && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-gray-400" />
            Neues Buchungssystem anlegen
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Name + Slug */}
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

            {/* Branche + Farbe */}
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

            {/* Währung + Zeitzone */}
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

            {/* Admin-Daten */}
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
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Admin Passwort *</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                placeholder="Mindestens 8 Zeichen"
                value={newTenant.adminPassword}
                onChange={e => setNewTenant(p => ({ ...p, adminPassword: e.target.value }))}
              />
            </div>
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
              disabled={creating || !newTenant.name || !newTenant.slug || !newTenant.adminEmail || !newTenant.adminPassword}
              className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {creating ? 'Wird angelegt…' : 'System anlegen'}
            </button>
          </div>
        </div>
      )}

      {/* Such- + Filterleiste */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
            placeholder="Suche…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-2 transition-colors ${statusFilter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {f === 'all' ? 'Alle' : f === 'active' ? 'Aktiv' : 'Inaktiv'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabelle */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Building2 size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">
            {search || statusFilter !== 'all' ? 'Keine Systeme gefunden' : 'Noch kein Buchungssystem angelegt'}
          </p>
          {!search && statusFilter === 'all' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
            >
              <Plus size={15} />
              Erstes System anlegen
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-400 font-medium uppercase tracking-wide">
                <th className="px-4 py-3 text-left w-8"></th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Slug</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Mitarb.</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Buchungen</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                  {/* Farb-Dot */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-full border border-gray-200 flex-shrink-0"
                        style={{ backgroundColor: t.primaryColor || '#E8C7C3' }}
                        title={t.primaryColor}
                      />
                    </div>
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{t.companyName || t.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{INDUSTRY_LABELS[t.industryType] ?? t.industryType}</p>
                  </td>

                  {/* Slug */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">/{t.slug}</code>
                  </td>

                  {/* Mitarbeiter */}
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="flex items-center justify-center gap-1 text-gray-500">
                      <Users size={13} />
                      {t.employeeCount ?? '–'}
                    </span>
                  </td>

                  {/* Buchungen */}
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="flex items-center justify-center gap-1 text-gray-500">
                      <Calendar size={13} />
                      {t.bookingCount ?? '–'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <SubscriptionBadge sub={t.subscription} />
                      <span className={`text-xs px-2 py-0.5 rounded-full self-start ${t.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {t.isActive ? 'Aktiv' : 'Deaktiviert'}
                      </span>
                    </div>
                  </td>

                  {/* Aktionen */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/superadmin/tenants/${t.id}`}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                        title="Bearbeiten"
                      >
                        <Settings size={15} />
                      </Link>
                      <a
                        href={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/booking/${t.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                        title="Buchungsseite öffnen"
                      >
                        <ExternalLink size={15} />
                      </a>
                      <button
                        onClick={() => toggleActive(t)}
                        disabled={toggling === t.id}
                        className={`p-1.5 rounded-lg ${t.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                        title={t.isActive ? 'Deaktivieren' : 'Aktivieren'}
                      >
                        {toggling === t.id ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />}
                      </button>
                      <button
                        onClick={() => deleteTenant(t)}
                        disabled={deleting === t.id}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
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
        </div>
      )}
    </div>
  );
}

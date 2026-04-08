// app/superadmin/tenants/new/page.tsx
// Step-by-step wizard to create a new tenant in minutes.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, Building2, Palette, User, Rocket } from 'lucide-react';
import { superAdminApi, CreateTenantPayload } from '@/lib/api/superadmin';

type Step = 'company' | 'industry' | 'admin' | 'confirm';

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: 'company', label: 'Firma', icon: <Building2 size={16} /> },
  { key: 'industry', label: 'Branche', icon: <Palette size={16} /> },
  { key: 'admin', label: 'Zugangsdaten', icon: <User size={16} /> },
  { key: 'confirm', label: 'Fertigstellen', icon: <Rocket size={16} /> },
];

const INDUSTRIES = [
  { value: 'Hairdresser', label: 'Friseur', emoji: '✂️' },
  { value: 'Beauty', label: 'Beauty / Kosmetik', emoji: '💄' },
  { value: 'Barbershop', label: 'Barbershop', emoji: '🪒' },
  { value: 'Massage', label: 'Massage', emoji: '💆' },
  { value: 'Nail', label: 'Nails / Maniküre', emoji: '💅' },
  { value: 'Physio', label: 'Physiotherapie', emoji: '🏋️' },
  { value: 'Tattoo', label: 'Tattoo / Piercing', emoji: '🎨' },
  { value: 'Other', label: 'Andere Dienstleistung', emoji: '📅' },
];

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function NewTenantWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('company');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ id: string; slug: string; trialEndsAt: string } | null>(null);

  const [form, setForm] = useState<CreateTenantPayload>({
    name: '',
    slug: '',
    industryType: '',
    currency: 'EUR',
    timeZone: 'Europe/Berlin',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
  });

  const update = (field: keyof CreateTenantPayload, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name') next.slug = slugify(value);
      return next;
    });
  };

  const currentIndex = STEPS.findIndex((s) => s.key === step);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await superAdminApi.createTenant(form);
      setCreated(result);
      setStep('confirm');
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? 'Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Neues Buchungssystem</h1>
        <p className="text-gray-500 mt-1 text-sm">Alles in 2 Minuten eingerichtet</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map(({ key, label, icon }, i) => {
          const done = STEPS.findIndex((s) => s.key === step) > i;
          const active = key === step;
          return (
            <div key={key} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                done ? 'bg-green-100 text-green-700' : active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? <Check size={12} /> : icon}
                {label}
              </div>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-gray-300" />}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

        {/* Step 1: Company */}
        {step === 'company' && (
          <>
            <h2 className="font-semibold text-gray-900">Firmendaten</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Firmenname *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="z.B. Barber Wagner"
                autoFocus
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                URL-Slug *
                <span className="ml-2 font-normal text-gray-400 text-xs">Buchungs-URL: /booking/<strong>{form.slug || 'firma'}</strong></span>
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="z.B. barber-wagner"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Währung</label>
                <select
                  value={form.currency}
                  onChange={(e) => update('currency', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                >
                  <option value="EUR">EUR €</option>
                  <option value="CHF">CHF Fr.</option>
                  <option value="USD">USD $</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Zeitzone</label>
                <select
                  value={form.timeZone}
                  onChange={(e) => update('timeZone', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                >
                  <option value="Europe/Berlin">Europe/Berlin</option>
                  <option value="Europe/Zurich">Europe/Zurich</option>
                  <option value="Europe/Vienna">Europe/Vienna</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => setStep('industry')}
              disabled={!form.name || !form.slug}
              className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40"
            >
              Weiter
            </button>
          </>
        )}

        {/* Step 2: Industry */}
        {step === 'industry' && (
          <>
            <h2 className="font-semibold text-gray-900">Branche auswählen</h2>
            <div className="grid grid-cols-2 gap-2">
              {INDUSTRIES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => { update('industryType', value); setStep('admin'); }}
                  className={`flex items-center gap-3 p-3 border rounded-xl text-sm text-left transition-colors hover:border-gray-400 ${
                    form.industryType === value ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="font-medium text-gray-900">{label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep('company')} className="text-sm text-gray-400 hover:text-gray-600">
              ← Zurück
            </button>
          </>
        )}

        {/* Step 3: Admin User */}
        {step === 'admin' && (
          <>
            <h2 className="font-semibold text-gray-900">Zugangsdaten für den Kunden</h2>
            <p className="text-xs text-gray-400">Der Kunde logt sich damit in seinen Admin-Bereich ein.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vorname</label>
                <input type="text" value={form.adminFirstName} onChange={(e) => update('adminFirstName', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nachname</label>
                <input type="text" value={form.adminLastName} onChange={(e) => update('adminLastName', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-Mail *</label>
              <input type="email" value={form.adminEmail} onChange={(e) => update('adminEmail', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Passwort *</label>
              <input type="password" value={form.adminPassword} onChange={(e) => update('adminPassword', e.target.value)}
                placeholder="Mindestens 8 Zeichen"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep('industry')} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                Zurück
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !form.adminEmail || !form.adminPassword}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40"
              >
                {loading ? 'Erstellen...' : '🚀 Buchungssystem erstellen'}
              </button>
            </div>
          </>
        )}

        {/* Step 4: Success */}
        {step === 'confirm' && created && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check size={28} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Fertig! 🎉</h2>
              <p className="text-gray-500 text-sm mt-1">
                <strong>{form.name}</strong> wurde erfolgreich angelegt.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Buchungs-URL</span>
                <span className="font-medium text-gray-900">/booking/{created.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Admin-Login</span>
                <span className="font-medium text-gray-900">/admin/login</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trial läuft bis</span>
                <span className="font-medium text-gray-900">
                  {new Date(created.trialEndsAt).toLocaleDateString('de-DE')}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/superadmin/tenants/${created.id}`)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Branding einrichten
              </button>
              <button
                onClick={() => { setStep('company'); setForm({ name: '', slug: '', industryType: '', currency: 'EUR', timeZone: 'Europe/Berlin', adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '' }); setCreated(null); }}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium"
              >
                Weiteres anlegen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

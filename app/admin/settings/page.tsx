// app/admin/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@nextui-org/card';
import { Input, Textarea } from '@nextui-org/input';
import { Button } from '@nextui-org/button';
import { Divider } from '@nextui-org/divider';
import { Settings, Save, Building2, Phone, Globe, Palette } from 'lucide-react';
import api from '@/lib/api/client';

interface TenantSettings {
  companyName: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  welcomeMessage: string;
  cancellationPolicy: string;
  bookingIntervalMinutes: number;
  maxAdvanceBookingDays: number;
  timeZone: string;
  defaultCurrency: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<TenantSettings>({
    companyName: '',
    tagline: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    primaryColor: '#E8C7C3',
    secondaryColor: '#D8B0AC',
    accentColor: '#017172',
    welcomeMessage: '',
    cancellationPolicy: '',
    bookingIntervalMinutes: 30,
    maxAdvanceBookingDays: 60,
    timeZone: 'Europe/Zurich',
    defaultCurrency: 'CHF',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await api.get('/tenant/settings');
      const data = res.data?.data ?? res.data;
      if (data) setSettings(data);
    } catch {
      // No settings yet, use defaults
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.put('/tenant/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  const set = (key: keyof TenantSettings, value: string | number) =>
    setSettings((s) => ({ ...s, [key]: value }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#E8C7C3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E8C7C3] to-[#D8B0AC] rounded-xl flex items-center justify-center">
            <Settings size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E1E1E]">Einstellungen</h1>
            <p className="text-[#8A8A8A] text-sm">Branding & Firmendaten verwalten</p>
          </div>
        </div>

        <form onSubmit={saveSettings} className="space-y-4">
          {/* Company Info */}
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-[#8A8A8A]" />
                <h2 className="font-semibold text-[#1E1E1E]">Firmeninformationen</h2>
              </div>
            </CardHeader>
            <CardBody className="gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Firmenname"
                  value={settings.companyName}
                  onChange={(e) => set('companyName', e.target.value)}
                  isRequired
                />
                <Input
                  label="Slogan"
                  value={settings.tagline}
                  onChange={(e) => set('tagline', e.target.value)}
                  placeholder="Ihr Wohlfühlsalon"
                />
              </div>
              <Textarea
                label="Willkommensnachricht"
                value={settings.welcomeMessage}
                onChange={(e) => set('welcomeMessage', e.target.value)}
                placeholder="Herzlich willkommen! Wir freuen uns auf Ihren Besuch."
                minRows={2}
              />
              <Textarea
                label="Stornierungsrichtlinie"
                value={settings.cancellationPolicy}
                onChange={(e) => set('cancellationPolicy', e.target.value)}
                placeholder="Kostenlose Stornierung bis 24h vor dem Termin."
                minRows={2}
              />
            </CardBody>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-[#8A8A8A]" />
                <h2 className="font-semibold text-[#1E1E1E]">Kontakt</h2>
              </div>
            </CardHeader>
            <CardBody className="gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Telefon"
                  value={settings.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+41 79 123 45 67"
                />
                <Input
                  label="E-Mail"
                  type="email"
                  value={settings.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="info@ihrsalon.ch"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Website"
                  value={settings.website}
                  onChange={(e) => set('website', e.target.value)}
                  placeholder="https://ihrsalon.ch"
                  startContent={<Globe size={16} className="text-[#8A8A8A]" />}
                />
                <Input
                  label="Adresse"
                  value={settings.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="Musterstrasse 1, 4000 Basel"
                />
              </div>
            </CardBody>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <Palette size={18} className="text-[#8A8A8A]" />
                <h2 className="font-semibold text-[#1E1E1E]">Farben</h2>
              </div>
            </CardHeader>
            <CardBody className="gap-4">
              <div className="grid grid-cols-3 gap-4">
                {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map((key) => {
                  const labels: Record<string, string> = {
                    primaryColor: 'Primärfarbe',
                    secondaryColor: 'Sekundärfarbe',
                    accentColor: 'Akzentfarbe',
                  };
                  return (
                    <div key={key} className="flex flex-col gap-2">
                      <label className="text-sm text-[#8A8A8A]">{labels[key]}</label>
                      <div className="flex items-center gap-2 border-2 border-[#E8C7C3]/30 rounded-xl p-2 bg-white">
                        <input
                          type="color"
                          value={settings[key]}
                          onChange={(e) => set(key, e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={settings[key]}
                          onChange={(e) => set(key, e.target.value)}
                          className="flex-1 text-sm text-[#1E1E1E] bg-transparent outline-none font-mono"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Booking Config */}
          <Card>
            <CardHeader className="pb-0">
              <h2 className="font-semibold text-[#1E1E1E]">Buchungseinstellungen</h2>
            </CardHeader>
            <CardBody className="gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Input
                  label="Intervall (Min)"
                  type="number"
                  value={String(settings.bookingIntervalMinutes)}
                  onChange={(e) => set('bookingIntervalMinutes', parseInt(e.target.value) || 30)}
                  min={15}
                  max={120}
                />
                <Input
                  label="Max. Vorlauf (Tage)"
                  type="number"
                  value={String(settings.maxAdvanceBookingDays)}
                  onChange={(e) => set('maxAdvanceBookingDays', parseInt(e.target.value) || 60)}
                  min={7}
                  max={365}
                />
                <Input
                  label="Währung"
                  value={settings.defaultCurrency}
                  onChange={(e) => set('defaultCurrency', e.target.value)}
                  placeholder="CHF"
                  maxLength={3}
                />
                <Input
                  label="Zeitzone"
                  value={settings.timeZone}
                  onChange={(e) => set('timeZone', e.target.value)}
                  placeholder="Europe/Zurich"
                />
              </div>
            </CardBody>
          </Card>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {saved && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-sm text-green-700">
              Einstellungen gespeichert!
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] text-white font-semibold"
            size="lg"
            isLoading={saving}
            startContent={!saving && <Save size={18} />}
          >
            Speichern
          </Button>
        </form>
      </div>
    </div>
  );
}

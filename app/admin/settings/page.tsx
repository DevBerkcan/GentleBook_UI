// app/admin/settings/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardBody, CardHeader } from '@nextui-org/card';
import { Input, Textarea } from '@nextui-org/input';
import { Button } from '@nextui-org/button';
import { Settings, Save, Building2, Phone, Globe, Palette, Lock, ImageIcon, Upload } from 'lucide-react';
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
  logoUrl?: string;
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
    timeZone: 'Europe/Berlin',
    defaultCurrency: 'EUR',
    logoUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Logo upload state
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoError('');
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await api.post('/tenant/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSettings((s) => ({ ...s, logoUrl: res.data.logoUrl }));
    } catch (err: any) {
      setLogoError(err.response?.data?.message || 'Fehler beim Hochladen');
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword !== confirmPassword) {
      setPwError('Die neuen Passwörter stimmen nicht überein.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('Das neue Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setPwSuccess('Passwort erfolgreich geändert.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccess(''), 4000);
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Fehler beim Ändern des Passworts.');
    } finally {
      setPwSaving(false);
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

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

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
          {/* Logo */}
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-[#8A8A8A]" />
                <h2 className="font-semibold text-[#1E1E1E]">Logo</h2>
              </div>
            </CardHeader>
            <CardBody className="gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#E8C7C3]/50 bg-[#F5EDEB] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {settings.logoUrl ? (
                    <img
                      src={`${apiBase}${settings.logoUrl}`}
                      alt="Logo"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <ImageIcon size={28} className="text-[#E8C7C3]" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    type="button"
                    variant="bordered"
                    size="sm"
                    isLoading={logoUploading}
                    startContent={!logoUploading && <Upload size={14} />}
                    onPress={() => fileInputRef.current?.click()}
                    className="border-[#E8C7C3] text-[#E8C7C3]"
                  >
                    {logoUploading ? 'Wird hochgeladen…' : 'Logo hochladen'}
                  </Button>
                  <p className="text-xs text-[#8A8A8A]">JPG, PNG, WebP · max. 5 MB</p>
                  {logoError && <p className="text-xs text-red-600">{logoError}</p>}
                </div>
              </div>
            </CardBody>
          </Card>

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
                  placeholder="+49 171 123 45 67"
                />
                <Input
                  label="E-Mail"
                  type="email"
                  value={settings.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="info@ihrsalon.de"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Website"
                  value={settings.website}
                  onChange={(e) => set('website', e.target.value)}
                  placeholder="https://ihrsalon.de"
                  startContent={<Globe size={16} className="text-[#8A8A8A]" />}
                />
                <Input
                  label="Adresse"
                  value={settings.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="Musterstraße 1, 10115 Berlin"
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
                  placeholder="EUR"
                  maxLength={3}
                />
                <Input
                  label="Zeitzone"
                  value={settings.timeZone}
                  onChange={(e) => set('timeZone', e.target.value)}
                  placeholder="Europe/Berlin"
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

        {/* Password Change */}
        <form onSubmit={handleChangePassword} className="mt-4">
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-[#8A8A8A]" />
                <h2 className="font-semibold text-[#1E1E1E]">Passwort ändern</h2>
              </div>
            </CardHeader>
            <CardBody className="gap-4">
              <Input
                label="Aktuelles Passwort"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Neues Passwort"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <Input
                  label="Neues Passwort wiederholen"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {pwError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                  {pwSuccess}
                </div>
              )}
              <Button
                type="submit"
                variant="bordered"
                className="border-[#E8C7C3] text-[#E8C7C3] font-semibold"
                isLoading={pwSaving}
                startContent={!pwSaving && <Lock size={16} />}
                isDisabled={!currentPassword || !newPassword || !confirmPassword}
              >
                Passwort ändern
              </Button>
            </CardBody>
          </Card>
        </form>
      </div>
    </div>
  );
}

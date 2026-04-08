// app/admin/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@nextui-org/card';
import { Input } from '@nextui-org/input';
import { Button } from '@nextui-org/button';
import { Lock, User, Eye, EyeOff, Mail, Building2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

type LoginMode = 'employee' | 'admin';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, tenantAdminLogin } = useAuth();

  const [mode, setMode] = useState<LoginMode>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Employee login fields
  const [username, setUsername] = useState('');

  // TenantAdmin login fields
  const [tenantSlug, setTenantSlug] = useState('');
  const [email, setEmail] = useState('');

  // Shared
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'admin') {
        if (!tenantSlug.trim()) {
          setError('Bitte Buchungssystem-ID eingeben');
          setLoading(false);
          return;
        }
        const result = await tenantAdminLogin({
          tenantSlug: tenantSlug.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
        });
        if (result.success) {
          router.push('/admin/dashboard');
        } else {
          setError(result.message || 'Ungültige Anmeldedaten');
        }
      } else {
        const result = await login({
          username: username.trim().toLowerCase(),
          password,
        });
        if (result.success) {
          router.push('/admin/dashboard');
        } else {
          setError(result.message || 'Ungültige Anmeldedaten');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ungültige Anmeldedaten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] to-[#2C2C2C] flex items-center justify-center px-4">
      <Card className="max-w-md w-full border-2 border-[#E8C7C3]/20 shadow-2xl">
        <CardBody className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#E8C7C3] to-[#D8B0AC] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Lock className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-[#1E1E1E]">GentleBook</h1>
            <p className="text-[#8A8A8A] text-sm mt-1">Buchungssystem Administration</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex rounded-lg overflow-hidden border border-[#E8C7C3]/30 mb-6">
            <button
              type="button"
              onClick={() => { setMode('admin'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === 'admin'
                  ? 'bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] text-white'
                  : 'bg-white text-[#8A8A8A] hover:text-[#1E1E1E]'
              }`}
            >
              <Building2 size={14} className="inline mr-1" />
              Admin-Login
            </button>
            <button
              type="button"
              onClick={() => { setMode('employee'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === 'employee'
                  ? 'bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] text-white'
                  : 'bg-white text-[#8A8A8A] hover:text-[#1E1E1E]'
              }`}
            >
              <User size={14} className="inline mr-1" />
              Mitarbeiter-Login
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {mode === 'admin' ? (
              <>
                <Input
                  type="text"
                  label="Buchungssystem-ID"
                  placeholder="z.B. barber-wagner"
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  startContent={<Building2 size={18} className="text-[#8A8A8A]" />}
                  autoComplete="off"
                  autoFocus
                  isRequired
                  description="Die ID Ihres Buchungssystems"
                  classNames={{
                    input: "text-[#1E1E1E]",
                    label: "text-[#8A8A8A]",
                    inputWrapper: "bg-white border-2 border-[#E8C7C3]/30 hover:border-[#E8C7C3]",
                  }}
                />
                <Input
                  type="email"
                  label="E-Mail"
                  placeholder="admin@beispiel.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  startContent={<Mail size={18} className="text-[#8A8A8A]" />}
                  autoComplete="email"
                  isRequired
                  classNames={{
                    input: "text-[#1E1E1E]",
                    label: "text-[#8A8A8A]",
                    inputWrapper: "bg-white border-2 border-[#E8C7C3]/30 hover:border-[#E8C7C3]",
                  }}
                />
              </>
            ) : (
              <Input
                type="text"
                label="Benutzername"
                placeholder="benutzername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                startContent={<User size={18} className="text-[#8A8A8A]" />}
                autoComplete="username"
                autoFocus
                isRequired
                classNames={{
                  input: "text-[#1E1E1E]",
                  label: "text-[#8A8A8A]",
                  inputWrapper: "bg-white border-2 border-[#E8C7C3]/30 hover:border-[#E8C7C3]",
                }}
              />
            )}

            <Input
              type={showPassword ? 'text' : 'password'}
              label="Passwort"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              startContent={<Lock size={18} className="text-[#8A8A8A]" />}
              endContent={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-[#8A8A8A] hover:text-[#1E1E1E] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              autoComplete="current-password"
              isRequired
              classNames={{
                input: "text-[#1E1E1E]",
                label: "text-[#8A8A8A]",
                inputWrapper: "bg-white border-2 border-[#E8C7C3]/30 hover:border-[#E8C7C3]",
              }}
            />

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] text-white font-semibold shadow-lg"
              size="lg"
              isLoading={loading}
            >
              Anmelden
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

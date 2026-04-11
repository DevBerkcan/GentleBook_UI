'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Eye, EyeOff, Mail, Building2, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';

type LoginMode = 'employee' | 'admin';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, tenantAdminLogin } = useAuth();

  const [mode, setMode] = useState<LoginMode>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [email, setEmail] = useState('');
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
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-[#0f0f1a]">

      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#E8C7C3]/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#D8B0AC]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-2/3 left-1/2 w-56 h-56 bg-[#E8C7C3]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative w-full max-w-md"
      >
        {/* Glass card */}
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">

          {/* Logo + title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#E8C7C3] to-[#D8B0AC] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#E8C7C3]/20">
              <Sparkles size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">GentleBook</h1>
            <p className="text-white/40 text-sm mt-1">Buchungssystem Administration</p>
          </div>

          {/* Mode tabs */}
          <div className="relative flex rounded-xl overflow-hidden bg-white/5 border border-white/10 mb-6 p-1 gap-1">
            {(['admin', 'employee'] as LoginMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); }}
                className="relative flex-1 py-2 text-sm font-medium rounded-lg z-10 transition-colors"
                style={{ color: mode === m ? '#1E1E1E' : 'rgba(255,255,255,0.45)' }}
              >
                {mode === m && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center justify-center gap-1.5">
                  {m === 'admin' ? <Building2 size={14} /> : <User size={14} />}
                  {m === 'admin' ? 'Admin-Login' : 'Mitarbeiter'}
                </span>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'admin' ? (
                <motion.div
                  key="admin-fields"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <InputField
                    icon={<Building2 size={16} className="text-white/30" />}
                    type="text"
                    placeholder="Buchungssystem-ID (z.B. barber-wagner)"
                    value={tenantSlug}
                    onChange={(v) => setTenantSlug(v)}
                    autoFocus
                  />
                  <InputField
                    icon={<Mail size={16} className="text-white/30" />}
                    type="email"
                    placeholder="E-Mail"
                    value={email}
                    onChange={(v) => setEmail(v)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="employee-fields"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  <InputField
                    icon={<User size={16} className="text-white/30" />}
                    type="text"
                    placeholder="Benutzername"
                    value={username}
                    onChange={(v) => setUsername(v)}
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password */}
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 gap-3 focus-within:border-[#E8C7C3]/50 focus-within:bg-white/8 transition-all">
              <Lock size={16} className="text-white/30 flex-shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="flex-1 bg-transparent text-white placeholder-white/25 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-sm shadow-lg shadow-[#E8C7C3]/15 transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #E8C7C3, #D8B0AC)' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Anmeldung…
                </span>
              ) : (
                <>Anmelden <ArrowRight size={15} /></>
              )}
            </motion.button>

            {mode === 'admin' && (
              <div className="text-center pt-1">
                <Link
                  href="/admin/forgot-password"
                  className="text-sm text-white/35 hover:text-white/60 transition-colors"
                >
                  Passwort vergessen?
                </Link>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function InputField({
  icon,
  type,
  placeholder,
  value,
  onChange,
  autoFocus,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 gap-3 focus-within:border-[#E8C7C3]/50 focus-within:bg-white/8 transition-all">
      <span className="flex-shrink-0">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        required
        className="flex-1 bg-transparent text-white placeholder-white/25 text-sm outline-none"
      />
    </div>
  );
}

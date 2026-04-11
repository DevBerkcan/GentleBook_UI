'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Building2, ArrowLeft, Send, CheckCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ForgotPasswordPage() {
  const [tenantSlug, setTenantSlug] = useState('');
  const [email,      setEmail]      = useState('');
  const [status,     setStatus]     = useState<Status>('idle');
  const [errMsg,     setErrMsg]     = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantSlug.trim() || !email.trim()) return;
    setStatus('loading');
    setErrMsg('');

    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug: tenantSlug.trim().toLowerCase(), email: email.trim().toLowerCase() }),
      });
      // Always show success (server never reveals whether email exists)
      if (res.ok || res.status === 200) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrMsg('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      }
    } catch {
      setStatus('error');
      setErrMsg('Verbindungsfehler. Bitte versuche es erneut.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-[#0f0f1a]">
      {/* Blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#E8C7C3]/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#017172]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#017172] to-[#01a0a2] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#017172]/20">
              <Sparkles size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Passwort vergessen?</h1>
            <p className="text-white/40 text-sm mt-1">Wir senden dir einen Reset-Link per E-Mail</p>
          </div>

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">E-Mail gesendet!</h2>
                <p className="text-white/50 text-sm leading-relaxed mb-6">
                  Falls ein Konto mit dieser Adresse existiert, wurde ein Reset-Link gesendet. Bitte überprüfe deinen Posteingang.
                </p>
                <p className="text-white/30 text-xs mb-6">Der Link ist 1 Stunde gültig.</p>
                <Link href="/admin/login"
                  className="flex items-center justify-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                  <ArrowLeft size={14} /> Zurück zum Login
                </Link>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
                {/* Tenant Slug */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 gap-3 focus-within:border-[#017172]/50 transition-all">
                  <Building2 size={16} className="text-white/30 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Buchungssystem-ID (z.B. barber-wagner)"
                    value={tenantSlug}
                    onChange={(e) => setTenantSlug(e.target.value)}
                    required
                    className="flex-1 bg-transparent text-white placeholder-white/25 text-sm outline-none"
                  />
                </div>
                {/* Email */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 gap-3 focus-within:border-[#017172]/50 transition-all">
                  <Mail size={16} className="text-white/30 flex-shrink-0" />
                  <input
                    type="email"
                    placeholder="Deine E-Mail-Adresse"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-transparent text-white placeholder-white/25 text-sm outline-none"
                  />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {status === 'error' && errMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-sm text-red-300"
                    >
                      {errMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={status === 'loading'}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #017172, #01a0a2)' }}
                >
                  {status === 'loading' ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Wird gesendet…
                    </span>
                  ) : (
                    <><Send size={15} /> Reset-Link senden</>
                  )}
                </motion.button>

                <div className="text-center">
                  <Link href="/admin/login"
                    className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center justify-center gap-1.5">
                    <ArrowLeft size={13} /> Zurück zum Login
                  </Link>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

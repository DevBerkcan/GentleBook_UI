'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

type Status = 'idle' | 'loading' | 'success' | 'error';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status,      setStatus]      = useState<Status>('idle');
  const [errMsg,      setErrMsg]      = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL ?? '';

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrMsg('Kein Token gefunden. Bitte fordere einen neuen Reset-Link an.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    if (password.length < 6) {
      setErrMsg('Das Passwort muss mindestens 6 Zeichen lang sein.');
      setStatus('error');
      return;
    }
    if (password !== confirm) {
      setErrMsg('Die Passwörter stimmen nicht überein.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrMsg('');

    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrMsg(data?.message ?? 'Ein Fehler ist aufgetreten.');
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
            <h1 className="text-2xl font-bold text-white">Neues Passwort</h1>
            <p className="text-white/40 text-sm mt-1">Wähle ein sicheres neues Passwort</p>
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
                <h2 className="text-lg font-bold text-white mb-2">Passwort geändert!</h2>
                <p className="text-white/50 text-sm leading-relaxed mb-6">
                  Dein Passwort wurde erfolgreich zurückgesetzt. Du kannst dich jetzt anmelden.
                </p>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #017172, #01a0a2)' }}
                >
                  Zum Login
                </Link>
              </motion.div>
            ) : (status === 'error' && !token) ? (
              <motion.div
                key="no-token"
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <XCircle size={32} className="text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Ungültiger Link</h2>
                <p className="text-white/50 text-sm leading-relaxed mb-6">
                  Dieser Reset-Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.
                </p>
                <Link
                  href="/admin/forgot-password"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #017172, #01a0a2)' }}
                >
                  Neuen Link anfordern
                </Link>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
                {/* Password */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 gap-3 focus-within:border-[#017172]/50 transition-all">
                  <Lock size={16} className="text-white/30 flex-shrink-0" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Neues Passwort (min. 6 Zeichen)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="flex-1 bg-transparent text-white placeholder-white/25 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Confirm */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 gap-3 focus-within:border-[#017172]/50 transition-all">
                  <Lock size={16} className="text-white/30 flex-shrink-0" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Passwort bestätigen"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="flex-1 bg-transparent text-white placeholder-white/25 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            background: password.length >= i * 3
                              ? i <= 1 ? '#ef4444' : i <= 2 ? '#f59e0b' : i <= 3 ? '#3b82f6' : '#22c55e'
                              : 'rgba(255,255,255,0.1)',
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-white/30">
                      {password.length < 3 ? 'Zu kurz' : password.length < 6 ? 'Schwach' : password.length < 9 ? 'Mittel' : password.length < 12 ? 'Stark' : 'Sehr stark'}
                    </p>
                  </div>
                )}

                {/* Error */}
                <AnimatePresence>
                  {status === 'error' && errMsg && token && (
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
                      Wird gespeichert…
                    </span>
                  ) : (
                    <><Lock size={15} /> Passwort speichern</>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

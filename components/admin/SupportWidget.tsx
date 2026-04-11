"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Check, AlertCircle, ChevronDown, Sparkles } from "lucide-react";
import api from "@/lib/api/client";

type Status = "idle" | "sending" | "success" | "error";

const SUBJECT_PRESETS = [
  "Technisches Problem",
  "Frage zur Abrechnung",
  "Feature-Wunsch",
  "Allgemeine Frage",
  "Sonstiges",
];

export function SupportWidget() {
  const [open,    setOpen]    = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status,  setStatus]  = useState<Status>("idle");
  const [errMsg,  setErrMsg]  = useState("");

  const canSubmit = subject.trim().length > 0 && message.trim().length > 10;

  const handleSend = async () => {
    if (!canSubmit) return;
    setStatus("sending");
    setErrMsg("");
    try {
      await api.post("/tenant/support", { subject: subject.trim(), message: message.trim() });
      setStatus("success");
      // auto-close after 3s
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
        setSubject("");
        setMessage("");
      }, 3000);
    } catch (e: any) {
      setErrMsg(e?.response?.data?.message ?? "Senden fehlgeschlagen. Bitte versuche es erneut.");
      setStatus("error");
    }
  };

  const handleClose = () => {
    if (status === "sending") return;
    setOpen(false);
    if (status !== "success") return;
    setTimeout(() => { setStatus("idle"); setSubject(""); setMessage(""); setErrMsg(""); }, 400);
  };

  return (
    <>
      {/* ── Floating Button ─────────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center text-white"
        style={{ background: "linear-gradient(135deg, #017172, #01a0a2)", boxShadow: "0 8px 32px rgba(1,113,114,0.35)" }}
        aria-label="Support kontaktieren"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.18 }}>
              <MessageCircle size={22} />
            </motion.span>
          )}
        </AnimatePresence>
        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-2xl animate-ping bg-[#017172]/30 pointer-events-none" />
        )}
      </motion.button>

      {/* ── Panel ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="support-panel"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl shadow-2xl overflow-hidden bg-white border border-gray-100"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #017172, #01a0a2)" }}>
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">GentleBook Support</p>
                <p className="text-white/65 text-xs">Wir antworten schnellstmöglich</p>
              </div>
              <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors flex-shrink-0">
                <ChevronDown size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              <AnimatePresence mode="wait">

                {/* ── Success State ── */}
                {status === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-6"
                  >
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Check size={26} className="text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-[#1E1E1E] mb-1">Nachricht gesendet!</h3>
                    <p className="text-sm text-[#8A8A8A]">
                      Unser Team meldet sich so schnell wie möglich bei dir.
                    </p>
                    <p className="text-xs text-[#8A8A8A] mt-3 flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#017172] rounded-full animate-pulse" />
                      support@gentlegroup.de
                    </p>
                  </motion.div>
                )}

                {/* ── Form State ── */}
                {status !== "success" && (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {/* Subject presets */}
                    <div>
                      <label className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide mb-2 block">Betreff</label>
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {SUBJECT_PRESETS.map((p) => (
                          <button
                            key={p}
                            onClick={() => setSubject(p)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${
                              subject === p
                                ? "bg-[#017172] text-white border-[#017172]"
                                : "bg-white text-[#8A8A8A] border-gray-200 hover:border-[#017172]/40 hover:text-[#017172]"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Oder eigenen Betreff eingeben…"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        maxLength={120}
                        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#017172] focus:ring-1 focus:ring-[#017172]/20 transition-all placeholder-gray-300 text-[#1E1E1E]"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide mb-2 block">Nachricht</label>
                      <textarea
                        rows={4}
                        placeholder="Beschreibe dein Anliegen so genau wie möglich…"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={2000}
                        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#017172] focus:ring-1 focus:ring-[#017172]/20 transition-all resize-none placeholder-gray-300 text-[#1E1E1E]"
                      />
                      <p className="text-right text-[10px] text-gray-300 mt-0.5">{message.length}/2000</p>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {status === "error" && errMsg && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-600"
                        >
                          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                          {errMsg}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <motion.button
                      onClick={handleSend}
                      disabled={!canSubmit || status === "sending"}
                      whileHover={canSubmit ? { scale: 1.01 } : {}}
                      whileTap={canSubmit ? { scale: 0.98 } : {}}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #017172, #01a0a2)" }}
                    >
                      {status === "sending" ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Wird gesendet…
                        </>
                      ) : (
                        <><Send size={15} /> Nachricht senden</>
                      )}
                    </motion.button>

                    <p className="text-center text-[11px] text-gray-300">
                      Geht direkt an support@gentlegroup.de
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

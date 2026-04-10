"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2, Plus, Trash2, GripVertical, ExternalLink, Calendar,
  Instagram, MessageCircle, MapPin, Facebook, Youtube, Globe,
  Phone, Mail, Edit2, Check, X, Eye, CheckCircle2, AlertCircle,
  ArrowUp, ArrowDown, Palette, Loader2,
} from "lucide-react";
import api from "@/lib/api/client";
import { useAuth } from "@/lib/contexts/AuthContext";

// ── Theme Picker ─────────────────────────────────────────────────────────────

type Theme = "gradient" | "dark" | "minimal" | "bold" | "glass";

const THEMES: { value: Theme; label: string; desc: string; preview: { bg: string; card: string; text: string } }[] = [
  {
    value: "gradient",
    label: "Gradient",
    desc: "Sanfter Farbverlauf",
    preview: { bg: "linear-gradient(135deg, #fde8e8 0%, #fff 100%)", card: "#ffffff", text: "#1a1a1a" },
  },
  {
    value: "dark",
    label: "Dark",
    desc: "Dunkles Design",
    preview: { bg: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)", card: "rgba(255,255,255,0.08)", text: "#ffffff" },
  },
  {
    value: "minimal",
    label: "Minimal",
    desc: "Klares Weiß",
    preview: { bg: "#ffffff", card: "#f8f8f8", text: "#111111" },
  },
  {
    value: "bold",
    label: "Bold",
    desc: "Vollfarbe",
    preview: { bg: "linear-gradient(135deg, #E8C7C3 0%, #D8B0AC 100%)", card: "rgba(255,255,255,0.9)", text: "#1a1a1a" },
  },
  {
    value: "glass",
    label: "Glass",
    desc: "Milchglas-Effekt",
    preview: { bg: "linear-gradient(135deg, #f5c5c0 0%, #fde8e8 100%)", card: "rgba(255,255,255,0.45)", text: "#1a1a1a" },
  },
];

function ThemePicker({ current, primaryColor, onChange }: { current: Theme; primaryColor: string; onChange: (t: Theme) => void }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {THEMES.map((theme) => {
        // Use primary color for bold/gradient previews
        const bgStyle = theme.value === "bold"
          ? `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}bb 100%)`
          : theme.value === "gradient"
          ? `linear-gradient(135deg, ${primaryColor}33 0%, #fff 100%)`
          : theme.value === "glass"
          ? `linear-gradient(135deg, ${primaryColor}55 0%, ${primaryColor}22 100%)`
          : theme.preview.bg;

        return (
          <button
            key={theme.value}
            onClick={() => onChange(theme.value)}
            className={`relative flex flex-col items-center gap-1.5 p-1 rounded-xl transition-all ${
              current === theme.value ? "ring-2 ring-offset-1 ring-[#E8C7C3]" : "hover:opacity-80"
            }`}
            title={theme.desc}
          >
            {/* Mini preview */}
            <div className="w-full h-14 rounded-lg overflow-hidden relative" style={{ background: bgStyle }}>
              <div className="absolute inset-x-2 top-2 h-2.5 rounded-full"
                style={{ background: theme.preview.card, opacity: 0.9 }} />
              <div className="absolute inset-x-2 top-5.5 h-2 rounded-full mt-1"
                style={{ background: theme.preview.card, opacity: 0.7 }} />
              <div className="absolute inset-x-2 bottom-2 h-2 rounded-full"
                style={{ background: theme.preview.card, opacity: 0.5 }} />
            </div>
            <span className={`text-[10px] font-semibold ${current === theme.value ? "text-[#E8C7C3]" : "text-gray-500"}`}>
              {theme.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const ICON_OPTIONS = [
  { value: "Instagram",  label: "Instagram",   icon: <Instagram size={16} /> },
  { value: "WhatsApp",   label: "WhatsApp",    icon: <MessageCircle size={16} /> },
  { value: "GoogleMaps", label: "Google Maps", icon: <MapPin size={16} /> },
  { value: "Facebook",   label: "Facebook",    icon: <Facebook size={16} /> },
  { value: "TikTok",     label: "TikTok",      icon: <span className="text-xs font-bold">TT</span> },
  { value: "YouTube",    label: "YouTube",     icon: <Youtube size={16} /> },
  { value: "Website",    label: "Website",     icon: <Globe size={16} /> },
  { value: "Phone",      label: "Telefon",     icon: <Phone size={16} /> },
  { value: "Email",      label: "E-Mail",      icon: <Mail size={16} /> },
  { value: "Custom",     label: "Sonstiges",   icon: <ExternalLink size={16} /> },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  Booking:    <Calendar size={18} />,
  Instagram:  <Instagram size={18} />,
  WhatsApp:   <MessageCircle size={18} />,
  GoogleMaps: <MapPin size={18} />,
  Facebook:   <Facebook size={18} />,
  TikTok:     <span className="text-xs font-bold">TT</span>,
  YouTube:    <Youtube size={18} />,
  Website:    <Globe size={18} />,
  Phone:      <Phone size={18} />,
  Email:      <Mail size={18} />,
  Custom:     <ExternalLink size={18} />,
};

interface LinkItem {
  id: string;
  title: string;
  url: string;
  iconType: string;
  displayOrder: number;
  isActive: boolean;
}

type Toast = { id: number; type: "success" | "error"; message: string };

let toastCounter = 0;

export default function AdminLinksPage() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // New link form
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIcon, setNewIcon] = useState("Instagram");

  // Edit form
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const tenantSlug = (user as any)?.tenantSlug;

  // Theme state
  const [theme, setTheme] = useState<Theme>("gradient");
  const [primaryColor, setPrimaryColor] = useState("#E8C7C3");
  const [themeOpen, setThemeOpen] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    loadLinks();
    // Load current theme + primary color from settings
    api.get("/tenant/settings").then((res) => {
      const d = res.data?.data ?? res.data;
      if (d?.linktreeStyle) setTheme(d.linktreeStyle as Theme);
      if (d?.primaryColor) setPrimaryColor(d.primaryColor);
    }).catch(() => {});
  }, []);

  async function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);
    setThemeSaving(true);
    try {
      await api.put("/tenant/settings", { linktreeStyle: newTheme });
      showToast("success", `Theme „${THEMES.find(t => t.value === newTheme)?.label}" gespeichert`);
    } catch {
      showToast("error", "Theme konnte nicht gespeichert werden");
    } finally {
      setThemeSaving(false);
    }
  }

  async function loadLinks() {
    setLoading(true);
    try {
      const res = await api.get("/admin/links");
      setLinks(res.data);
    } catch {
      showToast("error", "Fehler beim Laden der Links");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim() || !newUrl.trim()) return;
    setSaving(true);
    try {
      const res = await api.post("/admin/links", {
        title: newTitle.trim(),
        url: newUrl.trim().startsWith("http") ? newUrl.trim() : `https://${newUrl.trim()}`,
        iconType: newIcon,
      });
      setLinks((prev) => [...prev, res.data]);
      setNewTitle(""); setNewUrl(""); setNewIcon("Instagram");
      setShowAddForm(false);
      showToast("success", `„${newTitle.trim()}" wurde hinzugefügt`);
    } catch {
      showToast("error", "Fehler beim Anlegen des Links");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`„${title}" wirklich löschen?`)) return;
    try {
      await api.delete(`/admin/links/${id}`);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      showToast("success", `„${title}" wurde gelöscht`);
    } catch {
      showToast("error", "Fehler beim Löschen");
    }
  }

  function startEdit(link: LinkItem) {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
    setEditIcon(link.iconType);
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    try {
      const res = await api.put(`/admin/links/${id}`, {
        title: editTitle.trim(),
        url: editUrl.trim(),
        iconType: editIcon,
      });
      setLinks((prev) => prev.map((l) => (l.id === id ? res.data : l)));
      setEditingId(null);
      showToast("success", "Link wurde gespeichert");
    } catch {
      showToast("error", "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(link: LinkItem) {
    try {
      const res = await api.put(`/admin/links/${link.id}`, { isActive: !link.isActive });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? res.data : l)));
      showToast("success", link.isActive ? "Link deaktiviert" : "Link aktiviert");
    } catch {
      showToast("error", "Fehler beim Aktualisieren");
    }
  }

  async function moveLink(index: number, direction: "up" | "down") {
    const newLinks = [...links];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newLinks.length) return;
    [newLinks[index], newLinks[swapIndex]] = [newLinks[swapIndex], newLinks[index]];
    setLinks(newLinks);
    try {
      await api.patch("/admin/links/reorder", newLinks.map((l) => l.id));
    } catch {
      showToast("error", "Fehler beim Sortieren");
    }
  }

  return (
    <div className="min-h-screen bg-[#F5EDEB] p-4 sm:p-6">
      {/* ── Toast Stack ────────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium pointer-events-auto max-w-xs ${
                toast.type === "success"
                  ? "bg-white border border-green-100 text-green-800"
                  : "bg-white border border-red-100 text-red-700"
              }`}
            >
              {toast.type === "success"
                ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                : <AlertCircle size={16} className="text-red-500 shrink-0" />
              }
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-w-2xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1E1E1E]">Meine Links</h1>
            <p className="text-sm text-[#8A8A8A] mt-1">Verwalte dein öffentliches Profil</p>
          </div>
          <div className="flex gap-2">
            {tenantSlug && (
              <a
                href={`/booking/${tenantSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm bg-white text-[#1E1E1E] px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Eye size={15} />
                <span className="hidden sm:inline">Vorschau</span>
              </a>
            )}
            <button
              onClick={() => { setShowAddForm(true); setEditingId(null); }}
              className="flex items-center gap-1.5 text-sm bg-[#E8C7C3] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#D8B0AC] transition-colors"
            >
              <Plus size={16} />
              Link hinzufügen
            </button>
          </div>
        </div>

        {/* ── Theme Picker ────────────────────────────────────────────── */}
        <div className="mb-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setThemeOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-sm hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Palette size={16} className="text-[#E8C7C3]" />
              <span className="font-semibold text-[#1E1E1E]">Seiten-Design</span>
              <span className="text-xs text-[#8A8A8A] bg-[#F5EDEB] px-2 py-0.5 rounded-lg font-medium">
                {THEMES.find(t => t.value === theme)?.label ?? "Gradient"}
              </span>
              {themeSaving && <Loader2 size={12} className="animate-spin text-[#E8C7C3]" />}
            </div>
            <span className={`text-gray-400 transition-transform duration-200 ${themeOpen ? "rotate-180" : ""}`}>▾</span>
          </button>
          <AnimatePresence>
            {themeOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1">
                  <p className="text-xs text-[#8A8A8A] mb-3">Wähle das visuelle Design deiner öffentlichen Profilseite</p>
                  <ThemePicker current={theme} primaryColor={primaryColor} onChange={handleThemeChange} />
                  {tenantSlug && (
                    <a
                      href={`/booking/${tenantSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center gap-1.5 text-xs text-[#E8C7C3] hover:underline"
                    >
                      <Eye size={12} /> Vorschau anzeigen
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Add Link Form ───────────────────────────────────────────── */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="mb-4 bg-white rounded-2xl shadow-sm border border-[#E8C7C3]/40 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-[#1E1E1E]">Neuer Link</p>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <select
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    className="flex-shrink-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50"
                  >
                    {ICON_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Titel (z.B. Instagram)"
                    autoFocus
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50"
                  />
                </div>
                <input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://www.instagram.com/..."
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50"
                />
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={() => { setShowAddForm(false); setNewTitle(""); setNewUrl(""); }}
                    className="px-4 py-2 text-sm rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={saving || !newTitle.trim() || !newUrl.trim()}
                    className="px-5 py-2 text-sm rounded-xl bg-[#E8C7C3] text-white font-semibold hover:bg-[#D8B0AC] disabled:opacity-40 transition-colors flex items-center gap-1.5"
                  >
                    {saving ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Plus size={14} />
                    )}
                    Hinzufügen
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Fixed Booking Button ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-shrink-0 text-gray-200">
              <GripVertical size={16} />
            </div>
            <div className="flex-shrink-0 p-2 rounded-xl bg-[#E8C7C3] text-white">
              <Calendar size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1E1E1E] text-sm">Termin buchen</p>
              <p className="text-xs text-[#8A8A8A]">Immer erster Link · automatisch</p>
            </div>
            <span className="text-xs bg-[#F5EDEB] text-[#D8B0AC] px-2.5 py-1 rounded-lg font-semibold">Fest</span>
          </div>
        </div>

        {/* ── Links list ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="text-center py-16 text-[#8A8A8A]">
            <div className="inline-block w-6 h-6 border-2 border-[#E8C7C3]/40 border-t-[#E8C7C3] rounded-full animate-spin mb-3" />
            <p className="text-sm">Lade Links…</p>
          </div>
        ) : links.length === 0 && !showAddForm ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-14 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200"
          >
            <Link2 size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-[#1E1E1E] font-semibold">Noch keine Links</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Füge Instagram, WhatsApp oder andere Links hinzu</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 text-sm bg-[#E8C7C3] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#D8B0AC] transition-colors"
            >
              <Plus size={14} />
              Ersten Link hinzufügen
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {links.map((link, i) => (
                <motion.div
                  key={link.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: link.isActive ? 1 : 0.55, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {editingId === link.id ? (
                    /* ── Edit form ── */
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex gap-2">
                        <select
                          value={editIcon}
                          onChange={(e) => setEditIcon(e.target.value)}
                          className="flex-shrink-0 border border-gray-200 rounded-xl px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50"
                        >
                          {ICON_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Titel"
                          autoFocus
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50"
                        />
                      </div>
                      <input
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="https://..."
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(link.id)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 text-sm rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium"
                        >
                          Abbrechen
                        </button>
                        <button
                          onClick={() => handleSaveEdit(link.id)}
                          disabled={saving}
                          className="px-4 py-2 text-sm rounded-xl bg-[#E8C7C3] text-white font-semibold hover:bg-[#D8B0AC] disabled:opacity-40 flex items-center gap-1.5"
                        >
                          {saving
                            ? <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : <Check size={14} />
                          }
                          Speichern
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── View row ── */
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      {/* Reorder */}
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => moveLink(i, "up")}
                          disabled={i === 0}
                          className="text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          onClick={() => moveLink(i, "down")}
                          disabled={i === links.length - 1}
                          className="text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                      {/* Icon */}
                      <div className="flex-shrink-0 p-2 rounded-xl bg-[#E8C7C3]/15 text-[#D8B0AC]">
                        {ICON_MAP[link.iconType] ?? <ExternalLink size={18} />}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1E1E1E] text-sm truncate">{link.title}</p>
                        <p className="text-xs text-[#8A8A8A] truncate">{link.url}</p>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleToggleActive(link)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                            link.isActive
                              ? "bg-green-50 text-green-600 hover:bg-green-100"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          {link.isActive ? "Aktiv" : "Aus"}
                        </button>
                        <button
                          onClick={() => startEdit(link)}
                          className="p-1.5 text-gray-400 hover:text-[#E8C7C3] transition-colors rounded-lg hover:bg-[#E8C7C3]/10"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(link.id, link.title)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── Link count ─────────────────────────────────────────────── */}
        {links.length > 0 && (
          <p className="text-xs text-center text-gray-400 mt-4">
            {links.filter((l) => l.isActive).length} von {links.length} Links aktiv
          </p>
        )}
      </div>
    </div>
  );
}

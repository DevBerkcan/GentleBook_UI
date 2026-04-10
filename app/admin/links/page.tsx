"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2, Plus, Trash2, GripVertical, ExternalLink, Calendar,
  Instagram, MessageCircle, MapPin, Facebook, Youtube, Globe,
  Phone, Mail, Edit2, Check, X, Eye, CheckCircle2, AlertCircle,
  ArrowUp, ArrowDown, Palette, Loader2, Sparkles, ChevronDown,
  Circle, Grid3x3, Minus, Type, Pipette, LayoutList, LayoutGrid,
  Zap, Wind, Square, Smile,
} from "lucide-react";
import api from "@/lib/api/client";
import { useAuth } from "@/lib/contexts/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────

type Theme = "gradient" | "dark" | "minimal" | "bold" | "glass";
type BgPattern = "none" | "dots" | "waves" | "grid" | "circles";
type ButtonStyle = "rounded" | "pill" | "square";
type FontFamily = "inter" | "playfair" | "montserrat" | "dm-serif" | "josefin";
type CardStyle = "filled" | "outlined" | "gradient" | "ghost";
type LayoutMode = "list" | "grid";
type AnimSpeed = "none" | "slow" | "normal" | "fast";

interface LinktreeConfig {
  ctaText: string;
  bgPattern: BgPattern;
  buttonStyle: ButtonStyle;
  // Phase 2:
  fontFamily?: FontFamily;
  ctaColor?: string;
  avatarShape?: "circle" | "rounded" | "square";
  cardStyle?: CardStyle;
  layoutMode?: LayoutMode;
  animationSpeed?: AnimSpeed;
  showWelcome?: boolean;
  confetti?: boolean;
}

const DEFAULT_CONFIG: LinktreeConfig = {
  ctaText: "Termin buchen",
  bgPattern: "none",
  buttonStyle: "rounded",
  fontFamily: "inter",
  ctaColor: undefined,
  avatarShape: "circle",
  cardStyle: "filled",
  layoutMode: "list",
  animationSpeed: "normal",
  showWelcome: false,
  confetti: false,
};

// ── Industry Presets ──────────────────────────────────────────────────────────

const INDUSTRY_PRESETS: Record<string, { color: string; style: Theme; emoji: string; label: string; ctaText: string; bgPattern: BgPattern; buttonStyle: ButtonStyle }> = {
  Hairdresser: { color: "#C9A96E", style: "bold",     emoji: "✂️",  label: "Friseur",        ctaText: "Friseurtermin buchen",   bgPattern: "waves",   buttonStyle: "rounded" },
  Beauty:      { color: "#E8C7C3", style: "gradient",  emoji: "💄",  label: "Beauty",         ctaText: "Beauty-Termin buchen",   bgPattern: "dots",    buttonStyle: "pill"    },
  Barbershop:  { color: "#2C3E50", style: "dark",      emoji: "🪒",  label: "Barbershop",     ctaText: "Barber-Termin buchen",   bgPattern: "grid",    buttonStyle: "square"  },
  Massage:     { color: "#6B8E7F", style: "minimal",   emoji: "💆",  label: "Massage",        ctaText: "Massage buchen",         bgPattern: "circles", buttonStyle: "pill"    },
  Nail:        { color: "#D4A5C9", style: "glass",     emoji: "💅",  label: "Nails",          ctaText: "Nail-Termin buchen",     bgPattern: "dots",    buttonStyle: "pill"    },
  Physio:      { color: "#4A90D9", style: "minimal",   emoji: "🏋️", label: "Physiotherapie", ctaText: "Termin vereinbaren",     bgPattern: "none",    buttonStyle: "rounded" },
  Tattoo:      { color: "#1A1A2E", style: "dark",      emoji: "🎨",  label: "Tattoo",         ctaText: "Studio-Termin buchen",   bgPattern: "grid",    buttonStyle: "square"  },
  Other:       { color: "#E8C7C3", style: "gradient",  emoji: "📅",  label: "Andere",         ctaText: "Termin buchen",          bgPattern: "none",    buttonStyle: "rounded" },
};

// ── Themes ────────────────────────────────────────────────────────────────────

const THEMES: { value: Theme; label: string; desc: string }[] = [
  { value: "gradient", label: "Gradient", desc: "Sanfter Verlauf" },
  { value: "dark",     label: "Dark",     desc: "Dunkles Design"  },
  { value: "minimal",  label: "Minimal",  desc: "Klares Weiß"     },
  { value: "bold",     label: "Bold",     desc: "Vollfarbe"       },
  { value: "glass",    label: "Glass",    desc: "Milchglas"       },
];

// ── Icons ─────────────────────────────────────────────────────────────────────

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

// ── Link Item ─────────────────────────────────────────────────────────────────

interface LinkItem {
  id: string;
  title: string;
  url: string;
  iconType: string;
  displayOrder: number;
  isActive: boolean;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

type Toast = { id: number; type: "success" | "error"; message: string };
let toastCounter = 0;

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminLinksPage() {
  const { user } = useAuth();
  const tenantSlug = (user as any)?.tenantSlug;

  // Links state
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIcon, setNewIcon] = useState("Instagram");
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editIcon, setEditIcon] = useState("");

  // Design state
  const [theme, setTheme] = useState<Theme>("gradient");
  const [primaryColor, setPrimaryColor] = useState("#E8C7C3");
  const [config, setConfig] = useState<LinktreeConfig>(DEFAULT_CONFIG);
  const [industryType, setIndustryType] = useState<string>("Other");
  const [designOpen, setDesignOpen] = useState(false);
  const [designSaving, setDesignSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // ── Load data ───────────────────────────────────────────────────────────────

  useEffect(() => {
    loadLinks();
    api.get("/tenant/settings").then((res) => {
      const d = res.data?.data ?? res.data;
      if (d?.linktreeStyle) setTheme(d.linktreeStyle as Theme);
      if (d?.primaryColor) setPrimaryColor(d.primaryColor);
      if (d?.linktreeConfig) {
        try { setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(d.linktreeConfig) }); } catch {}
      }
    }).catch(() => {});

    // Get industry type from auth user or tenant info
    const slug = tenantSlug;
    if (slug) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/booking/${slug}/info`)
        .then(r => r.json()).then(d => { if (d?.industryType) setIndustryType(d.industryType); })
        .catch(() => {});
    }
  }, [tenantSlug]);

  // ── Save design (debounced) ──────────────────────────────────────────────────

  const saveDesign = useCallback(async (
    newTheme: Theme,
    newColor: string,
    newConfig: LinktreeConfig,
    silent = false
  ) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setDesignSaving(true);
      try {
        await api.put("/tenant/settings", {
          primaryColor: newColor,
          linktreeStyle: newTheme,
          linktreeConfig: JSON.stringify(newConfig),
        });
        if (!silent) showToast("success", "Design gespeichert");
      } catch {
        showToast("error", "Design konnte nicht gespeichert werden");
      } finally {
        setDesignSaving(false);
      }
    }, 600);
  }, [showToast]);

  // ── Apply preset ────────────────────────────────────────────────────────────

  async function applyPreset(key: string) {
    const preset = INDUSTRY_PRESETS[key] ?? INDUSTRY_PRESETS.Other;
    const newConfig: LinktreeConfig = {
      ctaText: preset.ctaText,
      bgPattern: preset.bgPattern,
      buttonStyle: preset.buttonStyle,
    };
    setTheme(preset.style);
    setPrimaryColor(preset.color);
    setConfig(newConfig);
    await saveDesign(preset.style, preset.color, newConfig, false);
    showToast("success", `Vorlage „${preset.label}" angewendet ✓`);
  }

  // ── Update config field ──────────────────────────────────────────────────────

  function updateConfig(field: keyof LinktreeConfig, value: string | boolean | undefined) {
    const next = { ...config, [field]: value };
    setConfig(next);
    saveDesign(theme, primaryColor, next, true);
  }

  function updateTheme(t: Theme) {
    setTheme(t);
    saveDesign(t, primaryColor, config, true);
  }

  function updateColor(c: string) {
    setPrimaryColor(c);
    saveDesign(theme, c, config, true);
  }

  // ── Links CRUD ──────────────────────────────────────────────────────────────

  async function loadLinks() {
    setLoading(true);
    try {
      const res = await api.get("/admin/links");
      setLinks(res.data);
    } catch { showToast("error", "Fehler beim Laden der Links"); }
    finally { setLoading(false); }
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
    } catch { showToast("error", "Fehler beim Anlegen des Links"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`„${title}" wirklich löschen?`)) return;
    try {
      await api.delete(`/admin/links/${id}`);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      showToast("success", `„${title}" wurde gelöscht`);
    } catch { showToast("error", "Fehler beim Löschen"); }
  }

  function startEdit(link: LinkItem) {
    setEditingId(link.id); setEditTitle(link.title); setEditUrl(link.url); setEditIcon(link.iconType);
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    try {
      const res = await api.put(`/admin/links/${id}`, { title: editTitle.trim(), url: editUrl.trim(), iconType: editIcon });
      setLinks((prev) => prev.map((l) => (l.id === id ? res.data : l)));
      setEditingId(null);
      showToast("success", "Link wurde gespeichert");
    } catch { showToast("error", "Fehler beim Speichern"); }
    finally { setSaving(false); }
  }

  async function handleToggleActive(link: LinkItem) {
    try {
      const res = await api.put(`/admin/links/${link.id}`, { isActive: !link.isActive });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? res.data : l)));
      showToast("success", link.isActive ? "Link deaktiviert" : "Link aktiviert");
    } catch { showToast("error", "Fehler beim Aktualisieren"); }
  }

  async function moveLink(index: number, direction: "up" | "down") {
    const newLinks = [...links];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newLinks.length) return;
    [newLinks[index], newLinks[swapIndex]] = [newLinks[swapIndex], newLinks[index]];
    setLinks(newLinks);
    try { await api.patch("/admin/links/reorder", newLinks.map((l) => l.id)); }
    catch { showToast("error", "Fehler beim Sortieren"); }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F5EDEB] p-4 sm:p-6">

      {/* ── Toast Stack ── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium pointer-events-auto max-w-xs ${
                toast.type === "success" ? "bg-white border border-green-100 text-green-800" : "bg-white border border-red-100 text-red-700"
              }`}
            >
              {toast.type === "success" ? <CheckCircle2 size={16} className="text-green-500 shrink-0" /> : <AlertCircle size={16} className="text-red-500 shrink-0" />}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-w-2xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1E1E1E]">Meine Links</h1>
            <p className="text-sm text-[#8A8A8A] mt-1">Profil & Design deiner öffentlichen Seite</p>
          </div>
          <div className="flex gap-2">
            {tenantSlug && (
              <a href={`/booking/${tenantSlug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm bg-white text-[#1E1E1E] px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                <Eye size={15} /><span className="hidden sm:inline">Vorschau</span>
              </a>
            )}
            <button onClick={() => { setShowAddForm(true); setEditingId(null); }}
              className="flex items-center gap-1.5 text-sm bg-[#E8C7C3] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#D8B0AC] transition-colors">
              <Plus size={16} />Link hinzufügen
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            DESIGN SECTION
        ══════════════════════════════════════════════════════════════ */}
        <div className="mb-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button onClick={() => setDesignOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-4 text-sm hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2.5">
              <Palette size={16} className="text-[#E8C7C3]" />
              <span className="font-semibold text-[#1E1E1E]">Seiten-Design</span>
              {designSaving && <Loader2 size={12} className="animate-spin text-[#E8C7C3]" />}
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${designOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {designOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-5 space-y-5 border-t border-gray-50">

                  {/* ── Branchenvorlagen ── */}
                  <div className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={14} className="text-[#E8C7C3]" />
                      <span className="text-xs font-semibold text-[#1E1E1E] uppercase tracking-wide">Branchenvorlage</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(INDUSTRY_PRESETS).map(([key, preset]) => {
                        const isActive = key === industryType;
                        return (
                          <button key={key} onClick={() => applyPreset(key)}
                            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all text-center ${
                              isActive
                                ? "border-[#E8C7C3] bg-[#F5EDEB] ring-1 ring-[#E8C7C3]"
                                : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {/* Color dot */}
                            <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-sm"
                              style={{ background: preset.color }}>
                            </div>
                            <span className="text-lg leading-none">{preset.emoji}</span>
                            <span className="text-[10px] font-medium text-gray-600 leading-tight">{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">Klicke auf eine Vorlage um Farbe, Theme und Design automatisch anzupassen</p>
                  </div>

                  {/* ── Theme ── */}
                  <div>
                    <p className="text-xs font-semibold text-[#1E1E1E] uppercase tracking-wide mb-2">Hintergrund-Theme</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {THEMES.map((t) => {
                        const bgPrev = t.value === "dark"
                          ? "linear-gradient(135deg, #0f0f1a, #1a1a2e)"
                          : t.value === "minimal" ? "#ffffff"
                          : t.value === "bold" ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}99)`
                          : t.value === "glass" ? `linear-gradient(135deg, ${primaryColor}44, ${primaryColor}22)`
                          : `linear-gradient(135deg, ${primaryColor}33, #fff)`;
                        return (
                          <button key={t.value} onClick={() => updateTheme(t.value)}
                            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all ${
                              theme === t.value ? "ring-2 ring-[#E8C7C3] ring-offset-1" : "hover:opacity-75"
                            }`}>
                            <div className="w-full h-10 rounded-lg" style={{ background: bgPrev, border: t.value === "minimal" ? "1px solid #eee" : "none" }} />
                            <span className={`text-[10px] font-semibold ${theme === t.value ? "text-[#E8C7C3]" : "text-gray-400"}`}>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Primärfarbe ── */}
                  <div>
                    <p className="text-xs font-semibold text-[#1E1E1E] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Pipette size={12} /> Primärfarbe
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input type="color" value={primaryColor}
                          onChange={(e) => updateColor(e.target.value)}
                          className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white shadow-sm overflow-hidden"
                          style={{ padding: "2px" }}
                        />
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {["#E8C7C3","#C9A96E","#2C3E50","#6B8E7F","#D4A5C9","#4A90D9","#1A1A2E","#E74C3C","#2ECC71","#9B59B6","#F39C12","#1ABC9C"].map((c) => (
                          <button key={c} onClick={() => updateColor(c)}
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${primaryColor === c ? "border-gray-400 scale-110" : "border-white shadow-sm"}`}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Hintergrundmuster ── */}
                  <div>
                    <p className="text-xs font-semibold text-[#1E1E1E] uppercase tracking-wide mb-2">Hintergrundmuster</p>
                    <div className="flex gap-2">
                      {([
                        { v: "none",    icon: <Minus size={14} />,     label: "Keins"   },
                        { v: "dots",    icon: <Circle size={14} />,    label: "Punkte"  },
                        { v: "waves",   icon: <span className="text-xs">〜</span>, label: "Wellen" },
                        { v: "grid",    icon: <Grid3x3 size={14} />,   label: "Raster"  },
                        { v: "circles", icon: <Circle size={16} />,    label: "Kreise"  },
                      ] as const).map(({ v, icon, label }) => (
                        <button key={v}
                          onClick={() => updateConfig("bgPattern", v)}
                          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                            config.bgPattern === v
                              ? "bg-[#F5EDEB] border-[#E8C7C3] text-[#D8B0AC]"
                              : "bg-white border-gray-100 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          {icon}<span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Button-Form ── */}
                  <div>
                    <p className="text-xs font-semibold text-[#1E1E1E] uppercase tracking-wide mb-2">Button-Form</p>
                    <div className="flex gap-2">
                      {([
                        { v: "rounded", label: "Abgerundet", preview: "rounded-xl" },
                        { v: "pill",    label: "Pill",        preview: "rounded-full" },
                        { v: "square",  label: "Eckig",       preview: "rounded-none" },
                      ] as const).map(({ v, label, preview }) => (
                        <button key={v}
                          onClick={() => updateConfig("buttonStyle", v)}
                          className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 border transition-all text-xs font-medium ${
                            preview
                          } ${
                            config.buttonStyle === v
                              ? "bg-[#F5EDEB] border-[#E8C7C3] text-[#D8B0AC]"
                              : "bg-white border-gray-100 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          <div className={`w-14 h-5 ${preview}`} style={{ background: primaryColor, opacity: 0.7 }} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Button-Text ── */}
                  <div>
                    <p className="text-xs font-semibold text-[#1E1E1E] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Type size={12} /> CTA-Text (Buchungsbutton)
                    </p>
                    <input
                      type="text"
                      value={config.ctaText}
                      onChange={(e) => updateConfig("ctaText", e.target.value)}
                      placeholder="Termin buchen"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50"
                    />
                  </div>

                  {/* ── Schriftart ── */}
                  <div>
                    <p className="text-xs font-semibold text-[#1E1E1E] uppercase tracking-wide mb-2">Schriftart</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {([
                        { v: "inter",      label: "Inter",    font: "sans-serif"           },
                        { v: "playfair",   label: "Playfair", font: "'Playfair Display', serif" },
                        { v: "montserrat", label: "Montserrat", font: "'Montserrat', sans-serif" },
                        { v: "dm-serif",   label: "DM Serif", font: "'DM Serif Display', serif" },
                        { v: "josefin",    label: "Josefin",  font: "'Josefin Sans', sans-serif" },
                      ] as const).map(({ v, label, font }) => (
                        <button key={v} onClick={() => updateConfig("fontFamily", v)}
                          className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all ${
                            (config.fontFamily ?? "inter") === v
                              ? "bg-[#F5EDEB] border-[#E8C7C3] ring-1 ring-[#E8C7C3]"
                              : "bg-white border-gray-100 hover:border-gray-300"
                          }`}
                          style={{ fontFamily: font }}
                        >
                          <span className="text-sm font-semibold text-[#1E1E1E]">Aa</span>
                          <span className="text-[9px] text-gray-500 leading-tight">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Button-Farbe ── */}
                  <div>
                    <p className="text-xs font-semibold text-[#1E1E1E] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Pipette size={12} /> Button-Farbe (optional)
                    </p>
                    <div className="flex items-center gap-3">
                      <input type="color"
                        value={config.ctaColor ?? primaryColor}
                        onChange={(e) => updateConfig("ctaColor", e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white shadow-sm overflow-hidden"
                        style={{ padding: "2px" }}
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {["#ffffff","#111111","#C9A96E","#E74C3C","#2ECC71","#4A90D9"].map((c) => (
                          <button key={c} onClick={() => updateConfig("ctaColor", c)}
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${config.ctaColor === c ? "border-gray-400 scale-110" : "border-white shadow-sm"}`}
                            style={{ background: c }} />
                        ))}
                      </div>
                      {config.ctaColor && (
                        <button onClick={() => updateConfig("ctaColor", undefined)}
                          className="text-[10px] text-gray-400 hover:text-gray-600 underline">
                          Zurücksetzen
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Avatar-Form ── */}
                  <div>
                    <p className="text-xs font-semibold text-[#1E1E1E] uppercase tracking-wide mb-2">Avatar-Form</p>
                    <div className="flex gap-2">
                      {([
                        { v: "circle",  label: "Kreis",      radius: "9999px" },
                        { v: "rounded", label: "Abgerundet",  radius: "16px"   },
                        { v: "square",  label: "Quadrat",     radius: "4px"    },
                      ] as const).map(({ v, label, radius }) => (
                        <button key={v} onClick={() => updateConfig("avatarShape", v)}
                          className={`flex-1 flex flex-col items-center gap-2 py-3 border rounded-xl text-xs font-medium transition-all ${
                            (config.avatarShape ?? "circle") === v
                              ? "bg-[#F5EDEB] border-[#E8C7C3] text-[#D8B0AC]"
                              : "bg-white border-gray-100 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          <div className="w-8 h-8 border-2 border-current opacity-60" style={{ borderRadius: radius }} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Karten-Stil ── */}
                  <div>
                    <p className="text-xs font-semibold text-[#1E1E1E] uppercase tracking-wide mb-2">Link-Karten Stil</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {([
                        { v: "filled",   label: "Filled",   bg: "bg-white shadow-sm border" },
                        { v: "outlined", label: "Outlined", bg: "bg-transparent border-2 border-gray-300" },
                        { v: "gradient", label: "Gradient", bg: "bg-gradient-to-r from-pink-50 to-white border" },
                        { v: "ghost",    label: "Ghost",    bg: "bg-transparent" },
                      ] as const).map(({ v, label, bg }) => (
                        <button key={v} onClick={() => updateConfig("cardStyle", v)}
                          className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                            (config.cardStyle ?? "filled") === v
                              ? "border-[#E8C7C3] ring-1 ring-[#E8C7C3] bg-[#F5EDEB] text-[#D8B0AC]"
                              : "border-gray-100 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          <div className={`w-10 h-5 rounded-lg ${bg}`} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Layout ── */}
                  <div>
                    <p className="text-xs font-semibold text-[#1E1E1E] uppercase tracking-wide mb-2">Layout</p>
                    <div className="flex gap-2">
                      <button onClick={() => updateConfig("layoutMode", "list")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                          (config.layoutMode ?? "list") === "list"
                            ? "bg-[#F5EDEB] border-[#E8C7C3] text-[#D8B0AC]"
                            : "bg-white border-gray-100 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        <LayoutList size={14} /> Liste
                      </button>
                      <button onClick={() => updateConfig("layoutMode", "grid")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                          (config.layoutMode ?? "list") === "grid"
                            ? "bg-[#F5EDEB] border-[#E8C7C3] text-[#D8B0AC]"
                            : "bg-white border-gray-100 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        <LayoutGrid size={14} /> Grid (Bento)
                      </button>
                    </div>
                  </div>

                  {/* ── Animations-Geschwindigkeit ── */}
                  <div>
                    <p className="text-xs font-semibold text-[#1E1E1E] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Wind size={12} /> Animationsgeschwindigkeit
                    </p>
                    <div className="flex gap-1.5">
                      {([
                        { v: "none",   label: "Keine"    },
                        { v: "slow",   label: "Langsam"  },
                        { v: "normal", label: "Normal"   },
                        { v: "fast",   label: "Schnell"  },
                      ] as const).map(({ v, label }) => (
                        <button key={v} onClick={() => updateConfig("animationSpeed", v)}
                          className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                            (config.animationSpeed ?? "normal") === v
                              ? "bg-[#F5EDEB] border-[#E8C7C3] text-[#D8B0AC]"
                              : "bg-white border-gray-100 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Toggles ── */}
                  <div className="space-y-3">
                    {/* Willkommensnachricht */}
                    <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Smile size={14} className="text-gray-400" />
                        <div>
                          <p className="text-xs font-semibold text-[#1E1E1E]">Willkommensnachricht</p>
                          <p className="text-[10px] text-gray-400">Aus Einstellungen unterhalb der Tagline</p>
                        </div>
                      </div>
                      <button onClick={() => updateConfig("showWelcome", !config.showWelcome)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${config.showWelcome ? "bg-[#E8C7C3]" : "bg-gray-200"}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.showWelcome ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    {/* Konfetti */}
                    <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-gray-400" />
                        <div>
                          <p className="text-xs font-semibold text-[#1E1E1E]">Konfetti beim Buchen</p>
                          <p className="text-[10px] text-gray-400">Kurze Feier-Animation beim CTA-Klick</p>
                        </div>
                      </div>
                      <button onClick={() => updateConfig("confetti", !config.confetti)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${config.confetti ? "bg-[#E8C7C3]" : "bg-gray-200"}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.confetti ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  </div>

                  {/* Vorschau-Link */}
                  {tenantSlug && (
                    <a href={`/booking/${tenantSlug}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[#E8C7C3] hover:underline font-medium">
                      <Eye size={12} /> Vorschau öffnen
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ADD LINK FORM
        ══════════════════════════════════════════════════════════════ */}
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
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <select value={newIcon} onChange={(e) => setNewIcon(e.target.value)}
                    className="flex-shrink-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50">
                    {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Titel (z.B. Instagram)" autoFocus
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50" />
                </div>
                <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://www.instagram.com/..."
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50" />
                <div className="flex gap-2 justify-end pt-1">
                  <button onClick={() => { setShowAddForm(false); setNewTitle(""); setNewUrl(""); }}
                    className="px-4 py-2 text-sm rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium">Abbrechen</button>
                  <button onClick={handleCreate} disabled={saving || !newTitle.trim() || !newUrl.trim()}
                    className="px-5 py-2 text-sm rounded-xl bg-[#E8C7C3] text-white font-semibold hover:bg-[#D8B0AC] disabled:opacity-40 transition-colors flex items-center gap-1.5">
                    {saving ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus size={14} />}
                    Hinzufügen
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════════
            FIXED BOOKING BUTTON
        ══════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-shrink-0 text-gray-200"><GripVertical size={16} /></div>
            <div className="flex-shrink-0 p-2 rounded-xl bg-[#E8C7C3] text-white"><Calendar size={16} /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1E1E1E] text-sm">{config.ctaText || "Termin buchen"}</p>
              <p className="text-xs text-[#8A8A8A]">Immer erster Link · automatisch</p>
            </div>
            <span className="text-xs bg-[#F5EDEB] text-[#D8B0AC] px-2.5 py-1 rounded-lg font-semibold">Fest</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            LINKS LIST
        ══════════════════════════════════════════════════════════════ */}
        {loading ? (
          <div className="text-center py-16 text-[#8A8A8A]">
            <div className="inline-block w-6 h-6 border-2 border-[#E8C7C3]/40 border-t-[#E8C7C3] rounded-full animate-spin mb-3" />
            <p className="text-sm">Lade Links…</p>
          </div>
        ) : links.length === 0 && !showAddForm ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-14 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
            <Link2 size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-[#1E1E1E] font-semibold">Noch keine Links</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Füge Instagram, WhatsApp oder andere Links hinzu</p>
            <button onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 text-sm bg-[#E8C7C3] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#D8B0AC] transition-colors">
              <Plus size={14} />Ersten Link hinzufügen
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {links.map((link, i) => (
                <motion.div key={link.id} layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: link.isActive ? 1 : 0.55, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {editingId === link.id ? (
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex gap-2">
                        <select value={editIcon} onChange={(e) => setEditIcon(e.target.value)}
                          className="flex-shrink-0 border border-gray-200 rounded-xl px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50">
                          {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Titel" autoFocus
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50" />
                      </div>
                      <input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://..."
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(link.id)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50" />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)}
                          className="px-4 py-2 text-sm rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium">Abbrechen</button>
                        <button onClick={() => handleSaveEdit(link.id)} disabled={saving}
                          className="px-4 py-2 text-sm rounded-xl bg-[#E8C7C3] text-white font-semibold hover:bg-[#D8B0AC] disabled:opacity-40 flex items-center gap-1.5">
                          {saving ? <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check size={14} />}
                          Speichern
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button onClick={() => moveLink(i, "up")} disabled={i === 0}
                          className="text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors"><ArrowUp size={13} /></button>
                        <button onClick={() => moveLink(i, "down")} disabled={i === links.length - 1}
                          className="text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors"><ArrowDown size={13} /></button>
                      </div>
                      <div className="flex-shrink-0 p-2 rounded-xl bg-[#E8C7C3]/15 text-[#D8B0AC]">
                        {ICON_MAP[link.iconType] ?? <ExternalLink size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1E1E1E] text-sm truncate">{link.title}</p>
                        <p className="text-xs text-[#8A8A8A] truncate">{link.url}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleToggleActive(link)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                            link.isActive ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}>
                          {link.isActive ? "Aktiv" : "Aus"}
                        </button>
                        <button onClick={() => startEdit(link)}
                          className="p-1.5 text-gray-400 hover:text-[#E8C7C3] transition-colors rounded-lg hover:bg-[#E8C7C3]/10">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(link.id, link.title)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
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

        {links.length > 0 && (
          <p className="text-xs text-center text-gray-400 mt-4">
            {links.filter((l) => l.isActive).length} von {links.length} Links aktiv
          </p>
        )}
      </div>
    </div>
  );
}

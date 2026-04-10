"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  Calendar, Instagram, MessageCircle, MapPin, Facebook, Youtube,
  Globe, Phone, Mail, ExternalLink, Loader2, ChevronRight, Sparkles,
} from "lucide-react";
import { getTenantInfo, getTenantLinks, type TenantLink } from "@/lib/api/booking";

// ── Icon Map ──────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  Booking:    <Calendar size={20} />,
  Instagram:  <Instagram size={20} />,
  WhatsApp:   <MessageCircle size={20} />,
  GoogleMaps: <MapPin size={20} />,
  Facebook:   <Facebook size={20} />,
  TikTok:     <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>,
  YouTube:    <Youtube size={20} />,
  Website:    <Globe size={20} />,
  Phone:      <Phone size={20} />,
  Email:      <Mail size={20} />,
  Custom:     <ExternalLink size={20} />,
};

// ── Industry Emoji Map ────────────────────────────────────────────────────────
const INDUSTRY_EMOJI: Record<string, string> = {
  Hairdresser: "✂️", Beauty: "💄", Barbershop: "🪒",
  Massage: "💆", Nail: "💅", Physio: "🏋️", Tattoo: "🎨", Other: "📅",
};

// ── Google Fonts map ──────────────────────────────────────────────────────────
const FONT_QUERY: Record<string, string> = {
  playfair:   "Playfair+Display:wght@400;600;700",
  montserrat: "Montserrat:wght@400;600;700",
  "dm-serif": "DM+Serif+Display",
  josefin:    "Josefin+Sans:wght@400;600;700",
};
const FONT_FAMILY: Record<string, string> = {
  inter:      "Inter, sans-serif",
  playfair:   "'Playfair Display', serif",
  montserrat: "'Montserrat', sans-serif",
  "dm-serif": "'DM Serif Display', serif",
  josefin:    "'Josefin Sans', sans-serif",
};

// ── LinktreeConfig ────────────────────────────────────────────────────────────
interface LinktreeConfig {
  ctaText?:        string;
  bgPattern?:      string;
  buttonStyle?:    string;
  fontFamily?:     string;
  ctaColor?:       string;
  avatarShape?:    string;
  cardStyle?:      string;
  layoutMode?:     string;
  animationSpeed?: string;
  showWelcome?:    boolean;
  confetti?:       boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}
function lighten(hex: string, amount = 0.85) {
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
  } catch { return "#F5EDEB"; }
}
function withAlpha(hex: string, alpha: number) {
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch { return hex; }
}
function getContrastColor(hex: string): string {
  try {
    const { r, g, b } = hexToRgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#111111" : "#ffffff";
  } catch { return "#ffffff"; }
}
function getBorderRadius(style?: string) {
  if (style === "pill")   return "9999px";
  if (style === "square") return "4px";
  return "16px";
}
function getAvatarRadius(shape?: string) {
  if (shape === "rounded") return "20px";
  if (shape === "square")  return "4px";
  return "9999px";
}

// ── Background Pattern ────────────────────────────────────────────────────────
function BgPattern({ pattern, color }: { pattern?: string; color?: string }) {
  const c  = color ? withAlpha(color, 0.08) : "rgba(0,0,0,0.06)";
  const c2 = color ? withAlpha(color, 0.05) : "rgba(0,0,0,0.04)";
  if (!pattern || pattern === "none") return null;
  if (pattern === "dots") return (
    <div className="fixed inset-0 pointer-events-none" aria-hidden
      style={{ backgroundImage: `radial-gradient(circle, ${c} 1.5px, transparent 1.5px)`, backgroundSize: "28px 28px" }} />
  );
  if (pattern === "grid") return (
    <div className="fixed inset-0 pointer-events-none" aria-hidden
      style={{ backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`, backgroundSize: "36px 36px" }} />
  );
  if (pattern === "waves") return (
    <svg className="fixed inset-0 w-full h-full pointer-events-none" aria-hidden preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="waves" x="0" y="0" width="120" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 20 Q30 5 60 20 Q90 35 120 20" fill="none" stroke={c} strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#waves)" />
    </svg>
  );
  if (pattern === "circles") return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute top-[10%] right-[5%] w-72 h-72 rounded-full"  style={{ background: c }} />
      <div className="absolute bottom-[15%] left-[8%] w-56 h-56 rounded-full" style={{ background: c2 }} />
      <div className="absolute top-[55%] left-[60%] w-40 h-40 rounded-full"  style={{ background: c }} />
    </div>
  );
  return null;
}

// ── Animation builders ────────────────────────────────────────────────────────
function buildAnimVariants(speed?: string) {
  const s = speed === "none"   ? { stagger: 0,    delay: 0,   stiffness: 500, damping: 40 }
          : speed === "slow"   ? { stagger: 0.15, delay: 0.4, stiffness: 180, damping: 28 }
          : speed === "fast"   ? { stagger: 0.04, delay: 0.1, stiffness: 380, damping: 18 }
          :                      { stagger: 0.07, delay: 0.2, stiffness: 280, damping: 22 };
  const container = { hidden: {}, visible: { transition: { staggerChildren: s.stagger, delayChildren: s.delay } } };
  const item = speed === "none"
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0,
        transition: { type: "spring", stiffness: s.stiffness, damping: s.damping } } };
  return { container, item };
}

// ── Theme Definitions ─────────────────────────────────────────────────────────
type Theme = "gradient" | "dark" | "minimal" | "bold" | "glass";

function getThemeConfig(theme: Theme, primary: string) {
  const light   = lighten(primary, 0.88);
  const mid     = lighten(primary, 0.65);
  const alpha20 = withAlpha(primary, 0.2);
  const alpha50 = withAlpha(primary, 0.5);
  switch (theme) {
    case "dark":
      return {
        bg: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
        cardBg: "rgba(255,255,255,0.06)", cardBorder: "rgba(255,255,255,0.1)", cardHover: "rgba(255,255,255,0.1)",
        textPrimary: "#ffffff", textSecondary: "rgba(255,255,255,0.55)", taglineCl: "rgba(255,255,255,0.5)", footerCl: "rgba(255,255,255,0.25)",
        iconBg: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.7)})`,
        ctaBg: `linear-gradient(135deg, ${primary} 0%, ${withAlpha(primary, 0.8)} 100%)`,
        ctaShadow: withAlpha(primary, 0.4), avatarBorder: "rgba(255,255,255,0.15)", glow: true,
      };
    case "minimal":
      return {
        bg: "#ffffff",
        cardBg: "#ffffff", cardBorder: "#f0f0f0", cardHover: "#fafafa",
        textPrimary: "#111111", textSecondary: "#333333", taglineCl: "#888888", footerCl: "#cccccc",
        iconBg: primary, ctaBg: primary, ctaShadow: alpha20, avatarBorder: "#f0f0f0", glow: false,
      };
    case "bold":
      return {
        bg: `linear-gradient(160deg, ${primary} 0%, ${mid} 100%)`,
        cardBg: "rgba(255,255,255,0.92)", cardBorder: "rgba(255,255,255,0.6)", cardHover: "#ffffff",
        textPrimary: "#1a1a1a", textSecondary: "#333333", taglineCl: "rgba(255,255,255,0.85)", footerCl: "rgba(255,255,255,0.5)",
        iconBg: primary, ctaBg: "#ffffff", ctaShadow: "rgba(0,0,0,0.2)", avatarBorder: "rgba(255,255,255,0.8)",
        ctaTextColor: primary, glow: false,
      };
    case "glass":
      return {
        bg: `linear-gradient(135deg, ${lighten(primary, 0.5)} 0%, ${lighten(primary, 0.7)} 40%, ${lighten(primary, 0.4)} 100%)`,
        cardBg: "rgba(255,255,255,0.45)", cardBorder: "rgba(255,255,255,0.7)", cardHover: "rgba(255,255,255,0.65)",
        textPrimary: "#1a1a1a", textSecondary: "#333333", taglineCl: "#555555", footerCl: "rgba(0,0,0,0.35)",
        iconBg: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.75)})`,
        ctaBg: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.85)})`,
        ctaShadow: alpha50, avatarBorder: "rgba(255,255,255,0.9)", glow: true, blur: true,
      };
    default:
      return {
        bg: `linear-gradient(160deg, ${light} 0%, #ffffff 55%, ${lighten(primary, 0.72)} 100%)`,
        cardBg: "rgba(255,255,255,0.85)", cardBorder: "rgba(255,255,255,0.9)", cardHover: "#ffffff",
        textPrimary: "#1a1a1a", textSecondary: "#333333", taglineCl: "#777777", footerCl: "#cccccc",
        iconBg: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.75)})`,
        ctaBg: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.8)})`,
        ctaShadow: withAlpha(primary, 0.35), avatarBorder: "#ffffff", glow: true,
      };
  }
}

// ── Card style resolver ───────────────────────────────────────────────────────
function resolveCardStyle(style: string | undefined, cardBg: string, cardBorder: string, primary: string) {
  switch (style) {
    case "outlined":
      return { background: "transparent", border: `2px solid ${cardBorder}`, boxShadow: "none" };
    case "gradient":
      return { background: `linear-gradient(135deg, ${withAlpha(primary, 0.09)}, ${withAlpha(primary, 0.03)})`, border: `1px solid ${withAlpha(primary, 0.18)}` };
    case "ghost":
      return { background: "transparent", border: "none", boxShadow: "none" };
    default:
      return { background: cardBg, border: `1px solid ${cardBorder}` };
  }
}

// ── Tilt Card wrapper ─────────────────────────────────────────────────────────
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref  = useRef<HTMLDivElement>(null);
  const x    = useMotionValue(0);
  const y    = useMotionValue(0);
  const rotX = useTransform(y, [-40, 40], [5, -5]);
  const rotY = useTransform(x, [-100, 100], [-5, 5]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  return (
    <motion.div
      ref={ref}
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TenantLinktreePage() {
  const { slug }   = useParams<{ slug: string }>();
  const router     = useRouter();
  const [tenantName, setTenantName]   = useState("");
  const [tagline,    setTagline]       = useState<string | null>(null);
  const [welcomeMsg, setWelcomeMsg]    = useState<string | null>(null);
  const [primaryColor, setPrimary]     = useState("#E8C7C3");
  const [logoUrl,    setLogoUrl]       = useState<string | null>(null);
  const [linktreeStyle, setStyle]      = useState<Theme>("gradient");
  const [industryType, setIndustry]    = useState<string | null>(null);
  const [cfg,        setCfg]           = useState<LinktreeConfig>({});
  const [links,      setLinks]         = useState<TenantLink[]>([]);
  const [loading,    setLoading]       = useState(true);
  const [notFound,   setNotFound]      = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([getTenantInfo(slug), getTenantLinks(slug)])
      .then(([info, tenantLinks]) => {
        if (!info?.name) { setNotFound(true); return; }
        setTenantName(info.companyName ?? info.name ?? slug);
        setTagline(info.tagline ?? null);
        if (info.welcomeMessage) setWelcomeMsg(info.welcomeMessage);
        if (info.primaryColor)   setPrimary(info.primaryColor);
        if (info.logoUrl)        setLogoUrl(info.logoUrl);
        if (info.linktreeStyle)  setStyle(info.linktreeStyle as Theme);
        if (info.industryType)   setIndustry(info.industryType);
        if (info.linktreeConfig) {
          try { setCfg(JSON.parse(info.linktreeConfig)); } catch { /* ignore */ }
        }
        setLinks(tenantLinks);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Confetti handler
  const handleCtaClick = useCallback(async (e: React.MouseEvent) => {
    if (!cfg.confetti) return;
    e.preventDefault();
    const confetti = (await import("canvas-confetti")).default;
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.55 } });
    setTimeout(() => router.push(`/booking/${slug}/book`), 250);
  }, [cfg.confetti, router, slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 className="animate-spin" size={32} style={{ color: primaryColor }} />
        </motion.div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-2xl font-bold text-gray-800 mb-2">Profil nicht gefunden</p>
          <p className="text-gray-500">Der Link <span className="font-mono">/booking/{slug}</span> existiert nicht.</p>
        </div>
      </div>
    );
  }

  const t           = getThemeConfig(linktreeStyle, primaryColor);
  const logoSrc     = logoUrl ? (logoUrl.startsWith("http") ? logoUrl : `${process.env.NEXT_PUBLIC_API_URL}${logoUrl}`) : null;
  const btnRadius   = getBorderRadius(cfg.buttonStyle);
  const avRadius    = getAvatarRadius(cfg.avatarShape);
  const ctaText     = cfg.ctaText?.trim() || "Termin buchen";
  const emoji       = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;
  const fontFamily  = FONT_FAMILY[cfg.fontFamily ?? "inter"] ?? FONT_FAMILY.inter;
  const fontQuery   = cfg.fontFamily && cfg.fontFamily !== "inter" ? FONT_QUERY[cfg.fontFamily] : null;
  const ctaBg       = cfg.ctaColor ?? t.ctaBg;
  const ctaTextClr  = cfg.ctaColor ? getContrastColor(cfg.ctaColor) : ((t as any).ctaTextColor ?? "#ffffff");
  const cardS       = resolveCardStyle(cfg.cardStyle, t.cardBg, t.cardBorder, primaryColor);
  const { container, item: itemVariant } = buildAnimVariants(cfg.animationSpeed);
  const isGrid      = cfg.layoutMode === "grid";

  return (
    <div className="min-h-screen" style={{ background: t.bg, fontFamily }}>

      {/* ── Google Fonts inject ── */}
      {fontQuery && (
        <style>{`@import url('https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap');`}</style>
      )}

      {/* ── CTA Shimmer CSS ── */}
      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(250%)} }
        .cta-shimmer { position: relative; overflow: hidden; }
        .cta-shimmer::after { content:''; position:absolute; top:0; left:0; width:35%; height:100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          animation: shimmer 2.8s infinite; pointer-events:none; }
      `}</style>

      {/* ── Background pattern ── */}
      <BgPattern pattern={cfg.bgPattern} color={primaryColor} />

      {/* ── Decorative glow blobs ── */}
      {t.glow && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-25 blur-3xl" style={{ background: primaryColor }} />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-20 blur-3xl"  style={{ background: primaryColor }} />
          {linktreeStyle === "dark" && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: primaryColor }} />
          )}
        </div>
      )}

      <div className="relative max-w-md mx-auto px-4 py-14 pb-16 flex flex-col items-center gap-5">

        {/* ── Profile ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-3 text-center"
        >
          {/* Avatar */}
          <div className="relative">
            {t.glow && (
              <div className="absolute inset-0 blur-xl opacity-50 scale-125" style={{ background: primaryColor, borderRadius: avRadius }} />
            )}
            {logoSrc ? (
              <img src={logoSrc} alt={tenantName}
                className="relative w-24 h-24 object-cover shadow-2xl border-4"
                style={{ borderRadius: avRadius, borderColor: t.avatarBorder }} />
            ) : (
              <div className="relative w-24 h-24 flex items-center justify-center shadow-2xl border-4"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${withAlpha(primaryColor, 0.7)})`, borderRadius: avRadius, borderColor: t.avatarBorder }}>
                {emoji
                  ? <span className="text-3xl leading-none">{emoji}</span>
                  : <span className="text-white text-3xl font-bold">{tenantName.charAt(0).toUpperCase()}</span>
                }
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <h1 className="text-2xl font-bold mt-1" style={{ color: linktreeStyle === "bold" ? "#fff" : t.textPrimary }}>
              {tenantName}
            </h1>
            {tagline && (
              <p className="text-sm mt-1.5 max-w-xs leading-relaxed" style={{ color: t.taglineCl }}>
                {tagline}
              </p>
            )}
            {cfg.showWelcome && welcomeMsg && (
              <p className="text-sm max-w-xs text-center leading-relaxed mt-2 italic" style={{ color: t.taglineCl }}>
                {welcomeMsg}
              </p>
            )}
          </div>

          {/* Decorative dots */}
          <div className="flex gap-1.5 mt-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div key={i}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: i === 1 ? primaryColor : withAlpha(primaryColor, 0.4) }} />
            ))}
          </div>
        </motion.div>

        {/* ── Links ── */}
        <motion.div
          className={`w-full mt-1 ${isGrid ? "grid grid-cols-1 gap-3" : "flex flex-col gap-3"}`}
          variants={container} initial="hidden" animate="visible"
        >
          {/* Booking CTA — always full width */}
          <motion.div variants={itemVariant} className="col-span-full">
            {cfg.confetti ? (
              <button onClick={handleCtaClick}
                className="cta-shimmer group w-full flex items-center gap-3 px-5 py-4 font-bold text-base shadow-xl transition-transform active:scale-[0.97] text-left"
                style={{ background: ctaBg, boxShadow: `0 8px 30px ${t.ctaShadow}`, color: ctaTextClr, borderRadius: btnRadius }}
              >
                <span className="flex-shrink-0 bg-white/20 p-2 group-hover:bg-white/30 transition-colors" style={{ borderRadius: btnRadius }}>
                  <Calendar size={20} />
                </span>
                <span className="flex-1">{ctaText}</span>
                <motion.span className="opacity-70" animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}>
                  <ChevronRight size={18} />
                </motion.span>
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="cta-shimmer group w-full flex items-center gap-3 px-5 py-4 font-bold text-base shadow-xl transition-transform active:scale-[0.97]"
                style={{ background: ctaBg, boxShadow: `0 8px 30px ${t.ctaShadow}`, color: ctaTextClr, borderRadius: btnRadius, display: "flex" }}
              >
                <span className="flex-shrink-0 bg-white/20 p-2 group-hover:bg-white/30 transition-colors" style={{ borderRadius: btnRadius }}>
                  <Calendar size={20} />
                </span>
                <span className="flex-1">{ctaText}</span>
                <motion.span className="opacity-70" animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}>
                  <ChevronRight size={18} />
                </motion.span>
              </a>
            )}
          </motion.div>

          {/* Custom links — list or grid */}
          {isGrid ? (
            <div className="grid grid-cols-2 gap-3">
              {links.map((link) => (
                <motion.div key={link.id} variants={itemVariant}>
                  <TiltCard>
                    <a href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2.5 px-3 py-5 font-semibold text-sm text-center active:scale-[0.97] transition-all w-full"
                      style={{ ...cardS, borderRadius: btnRadius, backdropFilter: (t as any).blur ? "blur(16px)" : undefined, WebkitBackdropFilter: (t as any).blur ? "blur(16px)" : undefined }}
                    >
                      <span className="p-2.5 rounded-xl text-white" style={{ background: t.iconBg, borderRadius: btnRadius }}>
                        {ICON_MAP[link.iconType] ?? <ExternalLink size={20} />}
                      </span>
                      <span style={{ color: t.textPrimary }}>{link.title}</span>
                    </a>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          ) : (
            links.map((link) => (
              <motion.div key={link.id} variants={itemVariant}>
                <TiltCard>
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    className="group w-full flex items-center gap-3 px-5 py-4 font-semibold text-base active:scale-[0.97] transition-all"
                    style={{ ...cardS, borderRadius: btnRadius, backdropFilter: (t as any).blur ? "blur(16px)" : undefined, WebkitBackdropFilter: (t as any).blur ? "blur(16px)" : undefined, color: t.textSecondary, boxShadow: cfg.cardStyle === "ghost" || cfg.cardStyle === "outlined" ? "none" : "0 2px 16px rgba(0,0,0,0.05)" }}
                  >
                    <span className="flex-shrink-0 p-2 text-white transition-transform group-hover:scale-105" style={{ background: t.iconBg, borderRadius: btnRadius }}>
                      {ICON_MAP[link.iconType] ?? <ExternalLink size={20} />}
                    </span>
                    <span className="flex-1" style={{ color: t.textPrimary }}>{link.title}</span>
                    <ExternalLink size={14} style={{ color: withAlpha("#888888", 0.5) }} className="group-hover:opacity-80 transition-opacity" />
                  </a>
                </TiltCard>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* ── Footer ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-6 flex items-center gap-1.5">
          <Sparkles size={11} style={{ color: withAlpha(primaryColor, 0.5) }} />
          <p className="text-xs" style={{ color: t.footerCl }}>
            Powered by <span className="font-semibold" style={{ color: primaryColor }}>GentleBook</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

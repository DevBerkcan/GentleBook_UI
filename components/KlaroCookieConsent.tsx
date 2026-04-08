"use client";

import { useEffect } from "react";
import Script from "next/script";

/**
 * Klaro Cookie Consent Konfiguration
 * Open Source, kostenlos, DSGVO-konform
 * Keine Registrierung nötig!
 */
const klaroConfig = {
  // Version
  version: 1,

  // Element-ID für Klaro
  elementID: "klaro",

  // Storage-Name
  storageName: "gentlebook-cookie-consent",

  // Cookie-Domain (optional)
  cookieDomain: undefined,

  // Cookie-Ablauf (120 Tage)
  cookieExpiresAfterDays: 120,

  // Standard-Sprache
  lang: "de",

  // Übersetzungen
  translations: {
    de: {
      consentModal: {
        title: "Cookie-Einstellungen",
        description:
          "Wir verwenden Cookies, um deine Erfahrung zu verbessern und zu analysieren, wie unsere Website genutzt wird. Du kannst deine Einstellungen jederzeit ändern.",
      },
      consentNotice: {
        title: "Wir respektieren deine Privatsphäre",
        description:
          "Diese Website verwendet Cookies, um dir das beste Erlebnis zu bieten. Du kannst selbst entscheiden, welche Cookies du zulassen möchtest.",
        learnMore: "Mehr erfahren",
      },
      purposes: {
        analytics: {
          title: "Analytics",
          description:
            "Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.",
        },
        functional: {
          title: "Funktional",
          description:
            "Diese Cookies sind für die Grundfunktionen der Website erforderlich.",
        },
      },
      accept: "Alle akzeptieren",
      acceptSelected: "Auswahl akzeptieren",
      decline: "Alle ablehnen",
      ok: "OK",
      save: "Speichern",
      close: "Schließen",
      privacyPolicy: {
        name: "Datenschutzerklärung",
        text: "Weitere Informationen findest du in unserer {privacyPolicy}.",
      },
    },
  },

  // Services/Apps definieren
  services: [
    {
      name: "analytics",
      title: "Analytics",
      purposes: ["analytics"],
      required: false,
      default: false,
      onlyOnce: true,
      callback: function (consent: boolean, service: any) {
        // Trigger event für Analytics
        if (typeof window !== "undefined") {
          const event = new CustomEvent("klaro-analytics-consent", {
            detail: { consent },
          });
          window.dispatchEvent(event);
        }
      },
    },
  ],

  // Styling
  styling: {
    theme: ["light"],
  },

  // Notice-Typ
  noticeAsModal: false,

  // HTML-Texts erlauben
  htmlTexts: true,

  // Embedded-Mode (für bessere Integration)
  embedded: false,

  // Gruppierung nach Zweck
  groupByPurpose: true,

  // Storage-Methode
  storageMethod: "cookie",

  // Akzeptiere alle beim ersten Besuch?
  mustConsent: false,

  // Accept-All Button anzeigen
  acceptAll: true,

  // Hide decline all button
  hideDeclineAll: false,

  // Hide learn more link
  hideLearnMore: false,
};

export const KlaroCookieConsent = () => {
  useEffect(() => {
    // Klaro Config auf window setzen (vor Klaro-Script lädt)
    if (typeof window !== "undefined") {
      // @ts-ignore
      window.klaroConfig = klaroConfig;
    }
  }, []);

  return (
    <>
      {/* Klaro JavaScript vom CDN */}
      <Script
        src="https://cdn.jsdelivr.net/npm/klaro@0.7.18/dist/klaro.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Klaro lädt automatisch window.klaroConfig
          console.log("Klaro loaded successfully");
        }}
      />
    </>
  );
};

/**
 * Button zum Öffnen der Cookie-Einstellungen
 */
export const KlaroCookieSettingsButton = () => {
  const openSettings = () => {
    if (typeof window !== "undefined" && window.klaro) {
      // @ts-ignore
      window.klaro.show();
    }
  };

  return (
    <button
      onClick={openSettings}
      className="text-sm text-barber-grey-500 hover:text-barber-red transition-colors underline"
      aria-label="Cookie-Einstellungen ändern"
    >
      Cookie-Einstellungen
    </button>
  );
};

/**
 * Hilfsfunktion: Prüft ob User Consent gegeben hat
 */
export const hasKlaroConsent = (serviceName: string): boolean => {
  if (typeof window === "undefined") return false;

  try {
    // Klaro Manager prüfen
    // @ts-ignore
    const manager = window.klaro?.getManager();
    if (!manager) return false;

    const consent = manager.getConsent(serviceName);
    return consent === true;
  } catch (error) {
    console.error("Error checking Klaro consent:", error);
    return false;
  }
};

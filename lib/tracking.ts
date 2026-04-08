// Tracking & Analytics Utilities

export interface TrackingData {
  referrerUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

// UTM-Parameter aus URL lesen
export function getUTMParameters(): TrackingData {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);

  return {
    referrerUrl: document.referrer || undefined,
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
    utmContent: params.get("utm_content") || undefined,
    utmTerm: params.get("utm_term") || undefined,
  };
}

// Tracking-Daten in LocalStorage speichern
const TRACKING_STORAGE_KEY = "gentlebook_tracking";

export function saveTrackingData(data: TrackingData) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save tracking data:", error);
  }
}

export function getTrackingData(): TrackingData {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem(TRACKING_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Failed to get tracking data:", error);
    return {};
  }
}

export function clearTrackingData() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(TRACKING_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear tracking data:", error);
  }
}

// Google Analytics Event Tracking
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window === "undefined") return;

  // Google Analytics 4
  if (window.gtag) {
    window.gtag("event", eventName, eventParams);
  }

  // Vercel Analytics (wenn installiert)
  if ((window as any).va) {
    (window as any).va("track", eventName, eventParams);
  }

  console.log("[Tracking Event]", eventName, eventParams);
}

// Buchungsprozess Events
export const BookingEvents = {
  // Schritt 1: Service ausgewählt
  serviceSelected: (serviceName: string, price: number) => {
    trackEvent("service_selected", {
      service_name: serviceName,
      price: price,
      step: 1,
    });
  },

  // Schritt 2: Datum ausgewählt
  dateSelected: (date: string) => {
    trackEvent("date_selected", {
      selected_date: date,
      step: 2,
    });
  },

  // Schritt 3: Zeitslot ausgewählt
  timeSlotSelected: (time: string) => {
    trackEvent("timeslot_selected", {
      selected_time: time,
      step: 3,
    });
  },

  // Schritt 4: Kundendaten eingegeben
  customerDataEntered: () => {
    trackEvent("customer_data_entered", {
      step: 4,
    });
  },

  // Buchung erfolgreich abgeschlossen
  bookingCompleted: (bookingNumber: string, serviceName: string, price: number, trackingData?: TrackingData) => {
    trackEvent("booking_completed", {
      booking_number: bookingNumber,
      service_name: serviceName,
      price: price,
      currency: "CHF",
      // Tracking-Quelle
      utm_source: trackingData?.utmSource,
      utm_medium: trackingData?.utmMedium,
      utm_campaign: trackingData?.utmCampaign,
    });

    // Auch als Conversion Event tracken
    trackEvent("purchase", {
      transaction_id: bookingNumber,
      value: price,
      currency: "CHF",
      items: [
        {
          item_name: serviceName,
          price: price,
          quantity: 1,
        },
      ],
    });
  },

  // Buchungsprozess abgebrochen
  bookingAbandoned: (step: number, reason?: string) => {
    trackEvent("booking_abandoned", {
      step: step,
      reason: reason,
    });
  },

  // Seite besucht
  pageView: (pagePath: string) => {
    trackEvent("page_view", {
      page_path: pagePath,
    });
  },
};

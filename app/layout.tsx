import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { Suspense } from "react";
import { NextUIProvider } from "@nextui-org/react";
import { Toaster } from "sonner";
import { KlaroCookieConsent } from "@/components/KlaroCookieConsent";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { MicrosoftClarity } from "@/components/analytics/MicrosoftClarity";
import { TrackingProvider } from "@/components/analytics/TrackingProvider";
import { siteConfig } from "@/lib/config";
import { LegalNavigation } from "@/components/LegalNavigation";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "GentleBook – Online Buchungssystem",
  description: "GentleBook – Das smarte Buchungssystem für Salons, Beauty, Barbershops und mehr.",
  keywords: ["GentleBook", "Buchungssystem", "Online Termin", "Salon", "Beauty", "Barbershop"],
  openGraph: {
    title: "GentleBook – Online Buchungssystem",
    description: "GentleBook – Das smarte Buchungssystem für Salons, Beauty, Barbershops und mehr.",
    type: "website",
    locale: "de_DE",
    siteName: "GentleBook",
  },
  twitter: {
    card: "summary_large_image",
    title: "GentleBook – Online Buchungssystem",
    description: "GentleBook – Das smarte Buchungssystem für Salons, Beauty, Barbershops und mehr.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${jakartaSans.variable} ${GeistSans.variable} font-ui`}>
        <GoogleAnalytics />
        <MicrosoftClarity />
        <NextUIProvider>
          <Toaster position="top-right" richColors closeButton />
          <Suspense fallback={null}>
            <TrackingProvider>
              <KlaroCookieConsent />
              {children}
              <LegalNavigation />
            </TrackingProvider>
          </Suspense>
        </NextUIProvider>
      </body>
    </html>
  );
}

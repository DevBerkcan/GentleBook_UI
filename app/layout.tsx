import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { NextUIProvider } from "@nextui-org/react";
import { KlaroCookieConsent } from "@/components/KlaroCookieConsent";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { TrackingProvider } from "@/components/analytics/TrackingProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
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
      <body className={inter.className}>
        <GoogleAnalytics />
        <NextUIProvider>
          <Suspense fallback={null}>
            <TrackingProvider>
              <KlaroCookieConsent />
              {children}
            </TrackingProvider>
          </Suspense>
        </NextUIProvider>
      </body>
    </html>
  );
}

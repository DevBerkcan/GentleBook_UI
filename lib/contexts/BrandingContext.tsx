// lib/contexts/BrandingContext.tsx
// Loads tenant branding from /api/public/{slug}/branding
// and injects CSS custom properties so all components pick up tenant colors.
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export interface TenantBranding {
  companyName: string;
  tagline?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  welcomeMessage?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  defaultCurrency: string;
  timeZone: string;
  cancellationPolicy?: string;
}

const defaultBranding: TenantBranding = {
  companyName: 'GentleBook',
  primaryColor: '#000000',
  secondaryColor: '#ffffff',
  accentColor: '#cccccc',
  defaultCurrency: 'EUR',
  timeZone: 'Europe/Berlin',
};

const BrandingContext = createContext<TenantBranding>(defaultBranding);

export function BrandingProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [branding, setBranding] = useState<TenantBranding>(defaultBranding);

  useEffect(() => {
    if (!slug) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;

    fetch(`${apiUrl}/public/${slug}/branding`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setBranding({ ...defaultBranding, ...data });
      })
      .catch(() => {/* use defaults */});
  }, [slug]);

  // Inject CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', branding.primaryColor);
    root.style.setProperty('--brand-secondary', branding.secondaryColor);
    root.style.setProperty('--brand-accent', branding.accentColor);
  }, [branding]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);

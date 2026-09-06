"use client";

import { usePathname } from "next/navigation";
import { legalConfig } from "@/lib/config";

const links = [
  ["Impressum", legalConfig.imprint],
  ["Datenschutz", legalConfig.privacy],
  ["AGB", legalConfig.terms],
  ["AV-Vertrag", legalConfig.processing],
  ["Unterauftragsverarbeiter", legalConfig.subprocessors],
  ["Nutzungsrichtlinien", legalConfig.acceptableUse],
  ["Löschkonzept", legalConfig.retention],
] as const;

export function LegalNavigation() {
  const pathname = usePathname();
  // Provider contracts belong to account flows, not the studio's end-customer booking contract.
  const isAccountPage = pathname === "/admin" || pathname?.startsWith("/admin/") ||
    pathname === "/superadmin" || pathname?.startsWith("/superadmin/") ||
    pathname === "/trial-activation" || pathname === "/verify-email";
  if (!isAccountPage) return null;

  return (
    <nav aria-label="GentleBook Rechtliches" className="relative z-10 flex flex-wrap justify-center gap-x-5 gap-y-3 border-t border-gray-200 bg-white px-6 py-5 text-xs text-gray-700">
      {links.map(([label, href]) => <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2">{label}</a>)}
    </nav>
  );
}

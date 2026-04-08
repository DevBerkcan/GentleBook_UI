// app/datenschutz/page.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Datenschutzerklärung - GentleBook",
  description: "Datenschutzerklärung von GentleBook",
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8A8A8A] hover:text-[#E8C7C3] transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Zurück zur Startseite
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-[#E8C7C3]/20">
          <h1 className="text-4xl font-bold text-[#1E1E1E] mb-2">Datenschutzerklärung</h1>
          <p className="text-[#8A8A8A] mb-8">GentleBook – Stand: März 2026</p>

          <div className="space-y-10 text-[#8A8A8A]">

            {/* 1 */}
            <section>
              <h2 className="text-2xl font-bold text-[#1E1E1E] mb-4">1. Datenschutz auf einen Blick</h2>

              <h3 className="text-xl font-semibold text-[#1E1E1E] mt-4 mb-2">Allgemeine Hinweise</h3>
              <p className="mb-4">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
                personenbezogenen Daten passiert, wenn Sie diese Website besuchen oder über unser
                Buchungssystem einen Termin vereinbaren. Personenbezogene Daten sind alle Daten, mit denen
                Sie persönlich identifiziert werden können. Grundlage ist die Schweizerische
                Datenschutzgesetzgebung (revDSG, in Kraft seit 1. September 2023) sowie, soweit anwendbar,
                die Europäische Datenschutz-Grundverordnung (DSGVO).
              </p>

              <h3 className="text-xl font-semibold text-[#1E1E1E] mt-4 mb-2">Datenerfassung auf dieser Website</h3>
              <p className="mb-2"><strong>Wer ist verantwortlich?</strong></p>
              <p className="mb-4">
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen
                Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
              </p>

              <p className="mb-2"><strong>Wie erfassen wir Ihre Daten?</strong></p>
              <p className="mb-4">
                Ihre Daten werden erhoben, wenn Sie uns diese aktiv mitteilen – z. B. bei der
                Terminbuchung (Vorname, Nachname, Telefonnummer, E-Mail-Adresse) – oder wenn technische
                Systeme beim Websitebesuch automatisch Daten erfassen (Server-Log-Dateien).
              </p>

              <p className="mb-2"><strong>Wofür nutzen wir Ihre Daten?</strong></p>
              <p className="mb-4">
                Ihre Buchungsdaten verwenden wir ausschliesslich zur Terminverwaltung, zur Bestätigung und
                Erinnerung Ihrer Buchungen sowie zur Kommunikation im Zusammenhang mit Ihrem Termin.
              </p>

              <p className="mb-2"><strong>Welche Rechte haben Sie?</strong></p>
              <p>
                Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck
                Ihrer gespeicherten personenbezogenen Daten zu erhalten sowie das Recht auf Berichtigung,
                Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-2xl font-bold text-[#1E1E1E] mb-4">2. Buchungssystem – Verarbeitung von Kundendaten</h2>

              <h3 className="text-xl font-semibold text-[#1E1E1E] mt-4 mb-2">Welche Daten werden gespeichert?</h3>
              <p className="mb-4">
                Bei der Online-Terminbuchung erheben wir folgende personenbezogene Daten:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Vorname und Nachname</li>
                <li>Telefonnummer</li>
                <li>E-Mail-Adresse</li>
                <li>Gewünschte Behandlung und Terminzeitpunkt</li>
              </ul>

              <h3 className="text-xl font-semibold text-[#1E1E1E] mt-4 mb-2">Zweck und Rechtsgrundlage</h3>
              <p className="mb-4">
                Die Verarbeitung erfolgt zur Erfüllung des Buchungsvertrags (Art. 6 Abs. 1 lit. b DSGVO /
                Art. 31 Abs. 2 lit. a revDSG). Ohne diese Daten ist eine Terminbuchung nicht möglich. Eine
                Weitergabe an Dritte findet nicht statt, ausser es ist zur Vertragserfüllung erforderlich
                (z. B. Terminbestätigung und Erinnerungs-E-Mail über unseren E-Mail-Dienstleister IONOS SE, Elgendorfer Str. 57, 56410 Montabaur, Deutschland).
              </p>

              <h3 className="text-xl font-semibold text-[#1E1E1E] mt-4 mb-2">Speicherdauer</h3>
              <p className="mb-4">
                Ihre Buchungsdaten werden nur so lange gespeichert, wie dies für die Durchführung und
                Dokumentation des Termins notwendig ist. Sofern keine gesetzlichen Aufbewahrungspflichten
                bestehen, werden die Daten nach spätestens <strong>2 Jahren</strong> nach dem Termin
                gelöscht bzw. anonymisiert.
              </p>

              <h3 className="text-xl font-semibold text-[#1E1E1E] mt-4 mb-2">Datensicherheit</h3>
              <p>
                Wir treffen geeignete technische und organisatorische Massnahmen, um Ihre Daten vor
                unberechtigtem Zugriff, Verlust oder Missbrauch zu schützen. Die Datenübertragung erfolgt
                verschlüsselt (SSL/TLS).
              </p>
            </section>

            {/* 2b */}
            <section>
              <h2 className="text-2xl font-bold text-[#1E1E1E] mb-4">3. Hosting</h2>

              <h3 className="text-xl font-semibold text-[#1E1E1E] mt-4 mb-2">Vercel</h3>
              <p className="mb-4">
                Wir hosten unsere Website bei Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.
                Beim Aufruf unserer Website werden automatisch technische Daten (IP-Adresse, Browser,
                Betriebssystem, Uhrzeit) in Server-Log-Dateien gespeichert. Diese Daten sind technisch
                notwendig und werden nicht mit anderen Datenquellen zusammengeführt.
              </p>
              <p>
                Details:{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E8C7C3] hover:underline"
                >
                  https://vercel.com/legal/privacy-policy
                </a>
              </p>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-2xl font-bold text-[#1E1E1E] mb-4">4. Allgemeine Hinweise und Betroffenenrechte</h2>

              <h3 className="text-xl font-semibold text-[#1E1E1E] mt-4 mb-2">Ihre Rechte im Überblick</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Recht auf Auskunft (Art. 15 DSGVO / Art. 25 revDSG)</li>
                <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
                <li>Widerruf einer erteilten Einwilligung (jederzeit, ohne Angabe von Gründen)</li>
              </ul>
              <p>
                Zur Ausübung Ihrer Rechte wenden Sie sich bitte an uns über die unten angegebenen
                Kontaktdaten. Sie haben ausserdem das Recht, sich bei der zuständigen Aufsichtsbehörde
                (Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter, EDÖB) zu beschweren.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-2xl font-bold text-[#1E1E1E] mb-4">5. Server-Log-Dateien</h2>
              <p className="mb-4">
                Der Provider der Seiten erhebt und speichert automatisch Informationen in
                Server-Log-Dateien, die Ihr Browser automatisch übermittelt:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Browsertyp und Browserversion</li>
                <li>Verwendetes Betriebssystem</li>
                <li>Referrer URL</li>
                <li>Hostname des zugreifenden Rechners</li>
                <li>Uhrzeit der Serveranfrage</li>
                <li>IP-Adresse</li>
              </ul>
              <p>
                Eine Zusammenführung dieser Daten mit anderen Datenquellen findet nicht statt.
                Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der
                technisch fehlerfreien Darstellung der Website).
              </p>
            </section>

            {/* Kontakt */}
            <section className="bg-[#F5EDEB] p-6 rounded-xl border border-[#E8C7C3]/30">
              <h2 className="text-2xl font-bold text-[#1E1E1E] mb-4">Kontakt bei Datenschutzfragen</h2>
              <p className="mb-4">
                Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte wenden Sie sich jederzeit an uns:
              </p>
              <p className="mb-2">
                <strong className="text-[#1E1E1E]">E-Mail:</strong>{" "}
                <a href="mailto:info@gentlebook.app" className="text-[#E8C7C3] hover:underline">
                  info@gentlebook.app
                </a>
              </p>
              <p className="mb-2">
                <strong className="text-[#1E1E1E]">Telefon:</strong>{" "}
                <span className="text-[#8A8A8A]">+41 78 241 87 04</span>
              </p>
              <p className="mt-4 text-sm">
                Zuständige Aufsichtsbehörde (Schweiz):{" "}
                <a
                  href="https://www.edoeb.admin.ch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E8C7C3] hover:underline"
                >
                  Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter (EDÖB)
                </a>
              </p>
            </section>

            <p className="text-sm text-[#8A8A8A] italic mt-8">
              Stand: März 2026
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-[#E8C7C3]/20">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#E8C7C3] hover:text-[#D8B0AC] font-semibold transition-colors"
            >
              <ArrowLeft size={20} />
              Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
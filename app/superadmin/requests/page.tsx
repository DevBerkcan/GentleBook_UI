'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, Mail, ExternalLink,
  RefreshCw, Inbox, Send, Euro,
} from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/modal';
import { Button } from '@nextui-org/button';
import { superAdminApi, type SubscriptionRequestItem } from '@/lib/api/superadmin';
import Link from 'next/link';

const PLAN_COLORS: Record<string, string> = {
  Starter: 'bg-blue-50 text-blue-700 border-blue-200',
  Professional: 'bg-teal-50 text-[#6355E4] border-[#6355E4]/30',
  Agency: 'bg-amber-50 text-amber-700 border-amber-200',
};

const PLAN_PRICES: Record<string, string> = {
  Starter: '€29',
  Professional: '€59',
  Agency: 'Preis auf Anfrage',
};

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  Pending:   { label: 'Offen',       color: 'bg-amber-50 text-amber-700',  icon: Clock },
  Offered:   { label: 'Angebot gesendet', color: 'bg-blue-50 text-blue-700', icon: Send },
  Accepted:  { label: 'Zahlung läuft', color: 'bg-violet-50 text-violet-700', icon: Clock },
  Activated: { label: 'Aktiviert',   color: 'bg-green-50 text-green-700',  icon: CheckCircle },
  Declined:  { label: 'Abgelehnt',   color: 'bg-red-50 text-red-600',      icon: XCircle },
};

const TABS = [
  { key: undefined, label: 'Alle' },
  { key: 'Pending',   label: 'Offen' },
  { key: 'Offered',   label: 'Angebote' },
  { key: 'Activated', label: 'Aktiviert' },
  { key: 'Declined',  label: 'Abgelehnt' },
];

export default function SubscriptionRequestsPage() {
  const [requests, setRequests] = useState<SubscriptionRequestItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [offerItem, setOfferItem] = useState<SubscriptionRequestItem | null>(null);
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [annualPrice, setAnnualPrice] = useState('');
  const [offerError, setOfferError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await superAdminApi.getSubscriptionRequests(activeTab);
      setRequests(result.data);
      setPendingCount(result.pendingCount);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const handleActivate = async (item: SubscriptionRequestItem) => {
    if (item.requestedPlan === 'Agency') {
      setOfferItem(item);
      setMonthlyPrice(item.offeredMonthlyPrice?.toString() ?? '');
      setAnnualPrice(item.offeredAnnualPrice?.toString() ?? '');
      setOfferError('');
      return;
    }
    if (!confirm(`Plan "${item.requestedPlan}" für ${item.tenantName} aktivieren?`)) return;
    setActionLoading(item.id);
    try {
      await superAdminApi.activateSubscriptionRequest(item.id);
      await load();
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Fehler beim Aktivieren');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendOffer = async () => {
    if (!offerItem) return;
    const parsePrice = (value: string) => Number(value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value);
    const monthly = parsePrice(monthlyPrice);
    const annual = parsePrice(annualPrice);
    if (!Number.isFinite(monthly) || monthly <= 0 || !Number.isFinite(annual) || annual <= 0) {
      setOfferError('Bitte einen gültigen Monats- und Jahrespreis eingeben.');
      return;
    }
    setActionLoading(offerItem.id);
    setOfferError('');
    try {
      await superAdminApi.sendAgencyOffer(offerItem.id, monthly, annual);
      setOfferItem(null);
      await load();
    } catch (e: any) {
      setOfferError(e.response?.data?.message ?? 'Angebot konnte nicht gesendet werden.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (item: SubscriptionRequestItem) => {
    if (!confirm(`Anfrage von ${item.tenantName} ablehnen?`)) return;
    setActionLoading(item.id);
    try {
      await superAdminApi.declineSubscriptionRequest(item.id);
      await load();
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Fehler beim Ablehnen');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = activeTab ? requests.filter(r => r.status === activeTab) : requests;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Abo-Anfragen</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Agency-Angebote werden erst nach Kundenzustimmung und Mollie-Bestätigung aktiviert
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-3 py-1.5 rounded-full">
              <Clock size={14} />
              {pendingCount} offen
            </div>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.key === 'Pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Inbox size={40} className="mb-3 opacity-50" />
          <p className="font-medium">Keine Anfragen</p>
          <p className="text-sm mt-1">Hier erscheinen Anfragen sobald Kunden einen Plan anfragen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const statusCfg = STATUS_LABELS[item.status] ?? STATUS_LABELS['Pending'];
            const StatusIcon = statusCfg.icon;
            const isLoading = actionLoading === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
              >
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/superadmin/tenants/${item.tenantId}`}
                      className="font-semibold text-gray-900 hover:text-[#6355E4] transition-colors"
                    >
                      {item.tenantName}
                    </Link>
                    <span className="text-gray-400 text-xs">@{item.tenantSlug}</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                      <StatusIcon size={11} />
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${PLAN_COLORS[item.requestedPlan] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {item.requestedPlan} — {PLAN_PRICES[item.requestedPlan] ?? ''}{item.requestedPlan === 'Agency' ? '' : '/Mo'}
                    </span>
                    <a
                      href={`mailto:${item.contactEmail}`}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#6355E4] transition-colors"
                    >
                      <Mail size={12} /> {item.contactEmail}
                    </a>
                  </div>

                  <p className="text-xs text-gray-400 mt-1.5">
                    {new Date(item.createdAt).toLocaleString('de-DE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {item.processedAt && ` · Verarbeitet: ${new Date(item.processedAt).toLocaleString('de-DE', { day: '2-digit', month: 'short' })}`}
                  </p>
                  {item.note && (
                    <p className="text-xs text-gray-500 mt-1 italic">"{item.note}"</p>
                  )}
                  {item.offeredMonthlyPrice && item.offeredAnnualPrice && (
                    <p className="text-xs text-blue-700 mt-2 font-medium">
                      Angebot: {item.offeredMonthlyPrice.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €/Monat oder{' '}
                      {item.offeredAnnualPrice.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €/Jahr
                      {item.offerExpiresAt && ` · gültig bis ${new Date(item.offerExpiresAt).toLocaleDateString('de-DE')}`}
                    </p>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/superadmin/tenants/${item.tenantId}`}
                    className="p-2 text-gray-400 hover:text-[#6355E4] hover:bg-gray-50 rounded-lg transition-colors"
                    title="System öffnen"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  {item.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleDecline(item)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <XCircle size={15} /> Ablehnen
                      </button>
                      <button
                        onClick={() => handleActivate(item)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#6355E4] hover:bg-[#5646D6] text-white rounded-xl transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CheckCircle size={15} />
                        )}
                        {item.requestedPlan === 'Agency' ? 'Angebot erstellen' : 'Aktivieren'}
                      </button>
                    </>
                  )}
                  {item.status === 'Offered' && item.requestedPlan === 'Agency' && (
                    <button
                      onClick={() => handleActivate(item)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-700 border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Send size={15} /> Angebot ändern
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal isOpen={!!offerItem} onClose={() => !actionLoading && setOfferItem(null)} size="lg" placement="center">
        <ModalContent>
          <>
            <ModalHeader className="flex items-center gap-3 border-b border-gray-100">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Euro size={18} /></span>
              <div>
                <h2 className="text-base font-bold text-gray-900">Agency-Angebot erstellen</h2>
                <p className="text-xs font-normal text-gray-500">{offerItem?.tenantName}</p>
              </div>
            </ModalHeader>
            <ModalBody className="py-5 space-y-4">
              <p className="text-sm text-gray-600">Der Kunde erhält beide Preise per E-Mail und wählt anschließend selbst die Abrechnung. Das Angebot ist 14 Tage gültig.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-gray-700">
                  Monatspreis
                  <div className="relative"><input value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} inputMode="decimal" placeholder="z. B. 149,00" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-9 outline-none focus:border-[#6355E4] focus:ring-2 focus:ring-[#6355E4]/10" /><span className="absolute right-3 top-2.5 text-gray-400">€</span></div>
                </label>
                <label className="space-y-1.5 text-sm font-medium text-gray-700">
                  Jahrespreis (Gesamtbetrag)
                  <div className="relative"><input value={annualPrice} onChange={(e) => setAnnualPrice(e.target.value)} inputMode="decimal" placeholder="z. B. 1.430,00" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-9 outline-none focus:border-[#6355E4] focus:ring-2 focus:ring-[#6355E4]/10" /><span className="absolute right-3 top-2.5 text-gray-400">€</span></div>
                </label>
              </div>
              {offerError && <p className="text-sm text-red-600">{offerError}</p>}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">Das Senden aktiviert den Plan nicht. Agency wird erst nach dokumentierter Kundenzustimmung und erfolgreicher Mollie-Verarbeitung aktiv.</div>
            </ModalBody>
            <ModalFooter className="border-t border-gray-100">
              <Button variant="flat" onPress={() => setOfferItem(null)} isDisabled={!!actionLoading}>Abbrechen</Button>
              <Button className="bg-[#6355E4] text-white font-semibold" onPress={handleSendOffer} isLoading={!!actionLoading} startContent={!actionLoading && <Send size={15} />}>Angebot per E-Mail senden</Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </div>
  );
}

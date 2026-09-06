'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  Clock, CheckCircle, XCircle, AlertTriangle,
  Check, MessageCircle, Mail, Zap, Users, Star, Shield,
  BarChart2, Globe, ArrowRight, FileText, Download,
} from 'lucide-react';
import api from '@/lib/api/client';
import { adminApi, TenantInvoiceItem } from '@/lib/api/admin';
import { HelpTip } from '@/components/ui/help-tip';
import { legalConfig, supportConfig } from '@/lib/config';
import { useConfirm } from '@/components/ConfirmDialog';
import { getAccessToken } from '@/lib/auth/storage';

interface Subscription {
  plan: string;
  status: string;
  interval?: string;
  trialStartedAt: string;
  trialEndsAt: string;
  trialDaysRemaining: number;
  isInTrial: boolean;
  isAccessAllowed: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelRequestedAt?: string;
}

interface Usage {
  plan: string;
  planDisplayName: string;
  employees: { current: number; limit: number; isUnlimited: boolean; percentage: number };
  services: { current: number; limit: number; isUnlimited: boolean; percentage: number };
}

interface AgencyOffer {
  id: string;
  requestedPlan: string;
  status: string;
  offeredMonthlyPrice: number;
  offeredAnnualPrice: number;
  offerExpiresAt: string;
  acceptedInterval?: 'Monthly' | 'Yearly';
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  Trial:     { label: 'Testphase',      bg: 'bg-amber-50',  text: 'text-amber-700',  icon: Clock },
  Active:    { label: 'Aktiv',          bg: 'bg-green-50',  text: 'text-green-700',  icon: CheckCircle },
  PastDue:   { label: 'Zahlung offen',  bg: 'bg-red-50',    text: 'text-red-700',    icon: AlertTriangle },
  Cancelled: { label: 'Gekündigt',      bg: 'bg-gray-100',  text: 'text-gray-600',   icon: XCircle },
  Expired:   { label: 'Abgelaufen',     bg: 'bg-red-50',    text: 'text-red-700',    icon: XCircle },
};

const PLANS = [
  {
    name: 'Starter',
    price: 29,
    priceOnRequest: false,
    key: 'Starter',
    color: 'border-gray-200',
    highlight: false,
    employees: 2,
    services: 15,
    hasAnalytics: false,
    features: [
      '2 Mitarbeiter-Konten',
      'Bis zu 15 Services',
      'Automatische Buchungsbestätigungen',
      'Professionelle Buchungsseite',
      'E-Mail-Erinnerungen',
      'Standard Support',
    ],
  },
  {
    name: 'Pro',
    price: 59,
    priceOnRequest: false,
    key: 'Professional',
    color: 'border-[#6355E4]',
    highlight: true,
    employees: 10,
    services: 50,
    hasAnalytics: true,
    features: [
      '10 Mitarbeiter-Konten',
      'Bis zu 50 Services',
      'Automatische Buchungsbestätigungen',
      'Professionelle Buchungsseite',
      'Analytics & Umsatzberichte',
      'E-Mail-Erinnerungen',
      'Priority Support',
      'Alle zukünftigen Updates',
    ],
  },
  {
    name: 'Agency',
    price: 0,
    priceOnRequest: true,
    key: 'Agency',
    color: 'border-gray-200',
    highlight: false,
    employees: null,
    services: null,
    hasAnalytics: true,
    features: [
      'Unbegrenzte Mitarbeiter',
      'Unbegrenzte Services',
      'Alles aus Pro',
      'Dedizierter Account Manager',
      'API-Zugang',
      'White-Label Option',
      'SLA Garantie',
    ],
  },
];

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

function UsageBar({ label, current, limit, isUnlimited, percentage }: { label: string; current: number; limit: number; isUnlimited: boolean; percentage: number }) {
  const color = percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-[#6355E4]';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">
          {current} / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: isUnlimited ? '10%' : `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminSubscriptionPage() {
  const { isEmployee } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => { if (isEmployee) router.replace('/admin/calendar'); }, [isEmployee, router]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requestedPlan, setRequestedPlan] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [agencyOffer, setAgencyOffer] = useState<AgencyOffer | null>(null);
  const [acceptingOffer, setAcceptingOffer] = useState(false);
  const [mollieLoadingPlan, setMollieLoadingPlan] = useState<string | null>(null);
  const [mollieProcessing, setMollieProcessing] = useState(false);
  // null while unknown — deliberately don't show the SEPA button until we know for sure,
  // so a real customer can never see a Mollie test-mode checkout by mistake.
  const [mollieLiveMode, setMollieLiveMode] = useState<boolean | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [businessConfirmed, setBusinessConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [billingConfirmed, setBillingConfirmed] = useState(false);
  const [sepaAuthorized, setSepaAuthorized] = useState(false);
  const { confirm, dialog } = useConfirm();
  // Live prices from the backend (SuperAdmin-editable) — overrides the hardcoded PLANS
  // defaults below so this page never shows a stale price after a SuperAdmin price change.
  const [livePrices, setLivePrices] = useState<Record<string, { monthly: number; annual: number }>>({});
  const [billingInterval, setBillingInterval] = useState<'Monthly' | 'Yearly'>('Monthly');
  // Whether the tenant already has an active Mollie subscription — if so, clicking another
  // plan must go through handleChangePlan (in-place PATCH), not handleMollieStart (which
  // the backend rejects once a subscription already exists).
  const [hasMollieSubscription, setHasMollieSubscription] = useState(false);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [planChangeSuccess, setPlanChangeSuccess] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<TenantInvoiceItem[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getInvoices()
      .then(res => setInvoices(res.items))
      .catch(() => setInvoices([]))
      .finally(() => setInvoicesLoading(false));
  }, []);

  async function downloadInvoicePdf(inv: TenantInvoiceItem) {
    setDownloadingInvoiceId(inv.id);
    try {
      const token = getAccessToken();
      const res = await fetch(adminApi.invoicePdfUrl(inv.id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download fehlgeschlagen');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Rechnung-${inv.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      // silent
    }
    setDownloadingInvoiceId(null);
  }

  useEffect(() => {
    Promise.all([
      api.get('/tenant/subscription').then(r => r.data?.data ?? r.data).catch(() => null),
      api.get('/tenant/usage').then(r => r.data).catch(() => null),
      adminApi.getSubscriptionRequestStatus().catch(() => null),
      adminApi.getMollieStatus().catch(() => null),
      adminApi.getPlanPricing().catch(() => []),
    ]).then(([subData, usageData, requestStatus, mollieStatus, pricing]) => {
      setSub(subData);
      setUsage(usageData);
      if (requestStatus?.request && ['Pending', 'Offered', 'Accepted'].includes(requestStatus.request.status)) {
        setRequestedPlan(requestStatus.request.requestedPlan);
      }
      if (requestStatus?.request?.requestedPlan === 'Agency' &&
          ['Offered', 'Accepted'].includes(requestStatus.request.status) &&
          requestStatus.request.offeredMonthlyPrice && requestStatus.request.offeredAnnualPrice && requestStatus.request.offerExpiresAt) {
        setAgencyOffer(requestStatus.request as AgencyOffer);
        setBillingInterval(requestStatus.request.acceptedInterval ?? 'Monthly');
      }
      setMollieLiveMode(mollieStatus?.isLiveMode ?? false);
      setHasMollieSubscription(mollieStatus?.hasMollieSubscription ?? false);
      setLivePrices(Object.fromEntries((pricing ?? []).map(p => [p.plan, { monthly: p.monthlyPrice, annual: p.annualPrice }])));
    }).finally(() => setLoading(false));
  }, []);

  // After returning from the Mollie-hosted checkout, poll briefly until the webhook has
  // been processed and the subscription is actually Active (redirect and webhook arrival
  // aren't perfectly synchronized).
  useEffect(() => {
    if (searchParams.get('mollieReturn') !== '1') return;
    setMollieProcessing(true);
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const status = await adminApi.getMollieStatus();
        if (status.hasMollieSubscription) {
          clearInterval(interval);
          setMollieProcessing(false);
          const subData = await api.get('/tenant/subscription').then(r => r.data?.data ?? r.data).catch(() => null);
          setSub(subData);
          return;
        }
      } catch { /* keep polling */ }
      if (attempts >= 8) {
        clearInterval(interval);
        setMollieProcessing(false);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [searchParams]);

  const handleMollieStart = async (planKey: string) => {
    if (mollieLoadingPlan || requesting) return;
    setMollieLoadingPlan(planKey);
    setRequestError('');
    try {
      const { checkoutUrl } = await adminApi.startMollieMandateFlow(planKey, billingInterval);
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setRequestError(err.response?.data?.message || 'SEPA-Zahlung konnte nicht gestartet werden.');
      setMollieLoadingPlan(null);
    }
  };

  const handleChangePlan = async (planKey: string, planName: string) => {
    if (changingPlan) return;
    const periodEndText = sub?.currentPeriodEnd
      ? new Date(sub.currentPeriodEnd).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'der nächsten Abbuchung';
    const currentPlanMeta = PLANS.find((p) => p.key === currentPlanKey);
    const targetPlanMeta = PLANS.find((p) => p.key === planKey);
    const losesAnalytics = !!currentPlanMeta?.hasAnalytics && !targetPlanMeta?.hasAnalytics;
    const analyticsWarning = losesAnalytics
      ? ' Achtung: Mit diesem Wechsel verlieren Sie den Zugriff auf Analytics & Umsatzberichte.'
      : '';
    const ok = await confirm({
      title: `Zu ${planName} wechseln?`,
      message: `Sie wechseln zu ${planName} (${billingInterval === 'Yearly' ? 'jährlich' : 'monatlich'}). Der neue Preis gilt ab ${periodEndText}, Ihre neuen Plan-Limits (Mitarbeiter/Services) sind sofort verfügbar.${analyticsWarning}`,
      confirmLabel: 'Ja, Plan wechseln',
    });
    if (!ok) return;
    setChangingPlan(planKey);
    setRequestError('');
    try {
      await adminApi.changeSubscriptionPlan(planKey, billingInterval);
      const subData = await api.get('/tenant/subscription').then(r => r.data?.data ?? r.data).catch(() => null);
      setSub(subData);
      setPlanChangeSuccess(planName);
    } catch (err: any) {
      setRequestError(err.response?.data?.message || 'Plan konnte nicht gewechselt werden. Bitte versuchen Sie es erneut.');
    } finally {
      setChangingPlan(null);
    }
  };

  const handlePlanRequest = async (planKey: string) => {
    if (requesting) return;
    if (requestedPlan) {
      setRequestError(`Du hast bereits eine offene Anfrage für den ${requestedPlan}-Plan. Bitte warte, bis diese bearbeitet wurde, bevor du einen anderen Plan anfragst.`);
      return;
    }
    setRequesting(true);
    setRequestError('');
    try {
      await adminApi.requestPlan(planKey, undefined, undefined, billingInterval);
      setRequestedPlan(planKey);
      setRequestSuccess(true);
    } catch (err: any) {
      setRequestError(err.response?.data?.message || 'Anfrage konnte nicht gesendet werden. Bitte versuche es erneut oder kontaktiere den Support.');
    } finally {
      setRequesting(false);
    }
  };

  const handleAcceptAgencyOffer = async () => {
    if (!agencyOffer || acceptingOffer) return;
    if (!contractConfirmed) {
      setRequestError('Bitte bestätigen Sie Preis, AGB, Unternehmereigenschaft und Abrechnungsbedingungen.');
      return;
    }
    setAcceptingOffer(true);
    setRequestError('');
    try {
      const result = await adminApi.acceptAgencyOffer(agencyOffer.id, billingInterval);
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      if (result.activated) {
        const subData = await api.get('/tenant/subscription').then(r => r.data?.data ?? r.data);
        setSub(subData);
        setHasMollieSubscription(true);
        setAgencyOffer(null);
        setRequestedPlan(null);
        setPlanChangeSuccess('Agency');
      }
    } catch (err: any) {
      setRequestError(err.response?.data?.message || 'Das Agency-Angebot konnte nicht angenommen werden.');
    } finally {
      setAcceptingOffer(false);
    }
  };

  const handleCancel = async () => {
    if (cancelling) return;
    const periodEndText = sub?.currentPeriodEnd
      ? new Date(sub.currentPeriodEnd).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'Ende der aktuellen Abrechnungsperiode';
    const ok = await confirm({
      title: 'Abonnement kündigen?',
      message: `Ihr Zugang bleibt bis zum ${periodEndText} bestehen. Danach werden keine weiteren Zahlungen eingezogen und Ihr Konto wird deaktiviert. Eine anteilige Rückerstattung erfolgt nicht.`,
      confirmLabel: 'Ja, kündigen',
      variant: 'danger',
    });
    if (!ok) return;
    setCancelling(true);
    setRequestError('');
    try {
      const res = await adminApi.cancelSubscription();
      setSub((prev) => (prev ? { ...prev, cancelRequestedAt: res.cancelRequestedAt } : prev));
    } catch (err: any) {
      setRequestError(err.response?.data?.message || 'Kündigung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[sub?.status ?? 'Trial'];
  const StatusIcon = statusCfg?.icon ?? Clock;
  const currentPlanKey = sub?.plan ?? 'Trial';
  const isExpired = sub?.status === 'Expired';

  // Live monthly/annual prices per plan, falling back to the hardcoded PLANS defaults
  // (with the same 20%-off formula the marketing website advertises) until the backend
  // price list has loaded.
  const getPrices = (plan: typeof PLANS[number]) => {
    const live = livePrices[plan.key];
    const monthly = live?.monthly ?? plan.price;
    const annual = live?.annual ?? Math.round(monthly * 0.8) * 12;
    return { monthly, annual };
  };
  const maxSavingsPercent = Math.max(
    0,
    ...PLANS.filter((plan) => !plan.priceOnRequest).map((plan) => {
      const { monthly, annual } = getPrices(plan);
      const monthlyTotal = monthly * 12;
      return monthlyTotal > 0 ? Math.round((1 - annual / monthlyTotal) * 100) : 0;
    })
  );
  const contractConfirmed = businessConfirmed && termsAccepted && billingConfirmed && sepaAuthorized;

  return (
    <motion.div
      className="p-6 max-w-5xl mx-auto space-y-8"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-gray-900">Abonnement & Plan</h1>
        <p className="text-gray-500 mt-1">Verwalten Sie Ihren Plan und sehen Sie Ihre aktuelle Nutzung</p>
      </motion.div>

      {/* Expired Warning */}
      {isExpired && (
        <motion.div variants={fadeUp} className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4">
          <XCircle className="text-red-500 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-red-800">Ihr Testzeitraum ist abgelaufen</p>
            <p className="text-red-600 text-sm mt-1">
              Wählen Sie unten einen Plan, um Ihr Studio wieder zu aktivieren.
            </p>
          </div>
        </motion.div>
      )}

      {/* Status Card */}
      {sub && (
        <motion.div variants={fadeUp} className={`rounded-2xl border p-6 ${statusCfg?.bg ?? 'bg-gray-50'}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-white/60`}>
                <StatusIcon size={20} className={statusCfg?.text} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Aktueller Status</p>
                <p className={`font-bold text-lg ${statusCfg?.text}`}>{statusCfg?.label}</p>
              </div>
            </div>
            {sub.isInTrial && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Testphase endet</p>
                <p className="font-semibold text-gray-800">
                  {new Date(sub.trialEndsAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <p className={`text-sm font-medium ${sub.trialDaysRemaining <= 3 ? 'text-red-600' : sub.trialDaysRemaining <= 7 ? 'text-amber-600' : 'text-gray-600'}`}>
                  noch {sub.trialDaysRemaining} {sub.trialDaysRemaining === 1 ? 'Tag' : 'Tage'}
                </p>
              </div>
            )}
            {sub.status === 'Active' && !sub.cancelRequestedAt && sub.currentPeriodEnd && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Nächste Abbuchung {sub.interval === 'Yearly' ? '(jährlich)' : '(monatlich)'}</p>
                <p className="font-semibold text-gray-800">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {/* Trial Progress Bar */}
          {sub.isInTrial && (() => {
            const total = 14;
            const used = total - sub.trialDaysRemaining;
            const pct = (used / total) * 100;
            const barColor = sub.trialDaysRemaining <= 3 ? 'bg-red-500' : sub.trialDaysRemaining <= 7 ? 'bg-amber-500' : 'bg-[#6355E4]';
            return (
              <div className="mt-4">
                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">{used} von 14 Testtagen verbraucht</p>
              </div>
            );
          })()}

          {/* Cancel subscription */}
          {sub.status === 'Active' && !sub.cancelRequestedAt && (
            <div className="mt-4 pt-4 border-t border-black/5">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-xs font-medium text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Wird gekündigt…' : 'Abonnement kündigen'}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Post-cancel banner */}
      {sub?.cancelRequestedAt && sub.status !== 'Cancelled' && (
        <motion.div variants={fadeUp} className="bg-gray-100 border border-gray-300 rounded-2xl p-5 flex gap-4">
          <XCircle className="text-gray-500 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-gray-800">
              Gekündigt zum {sub.currentPeriodEnd
                ? new Date(sub.currentPeriodEnd).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
                : '–'}
            </p>
            <p className="text-gray-600 text-sm mt-1">Ihr Zugang bleibt bis dahin bestehen. Es werden keine weiteren Zahlungen eingezogen.</p>
          </div>
        </motion.div>
      )}
      {dialog}

      {/* Invoices */}
      {!invoicesLoading && invoices.length > 0 && (
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-[#6355E4]" />
            Rechnungen
          </h2>
          <div className="divide-y divide-gray-100">
            {invoices.map(inv => (
              <div key={inv.id} className="py-3 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{inv.invoiceNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(inv.issueDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {' · '}{inv.planName}
                    {' · '}{inv.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} {inv.currency}
                  </p>
                </div>
                <button
                  onClick={() => downloadInvoicePdf(inv)}
                  disabled={downloadingInvoiceId === inv.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#6355E4] hover:text-[#6355E4] text-xs font-medium disabled:opacity-40 transition-colors shrink-0"
                >
                  {downloadingInvoiceId === inv.id
                    ? <span className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    : <Download size={13} />}
                  PDF
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Usage Meter */}
      {usage && (
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-[#6355E4]" />
            Aktuelle Nutzung ({usage.planDisplayName}-Plan)
          </h2>
          <div className="space-y-4">
            <UsageBar
              label="Mitarbeiter"
              current={usage.employees.current}
              limit={usage.employees.limit}
              isUnlimited={usage.employees.isUnlimited}
              percentage={usage.employees.percentage}
            />
            <UsageBar
              label="Services"
              current={usage.services.current}
              limit={usage.services.limit}
              isUnlimited={usage.services.isUnlimited}
              percentage={usage.services.percentage}
            />
          </div>
          {(usage.employees.percentage >= 80 || usage.services.percentage >= 80) && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl flex items-center gap-2 text-sm text-amber-700">
              <AlertTriangle size={16} />
              Sie nähern sich dem Limit Ihres Plans. Upgraden Sie für mehr Kapazität.
            </div>
          )}
        </motion.div>
      )}

      {/* Plan Change Success Banner */}
      {planChangeSuccess && (
        <motion.div variants={fadeUp} className="bg-green-50 border border-green-200 rounded-2xl p-5 flex gap-4">
          <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-green-800">Plan gewechselt!</p>
            <p className="text-green-700 text-sm mt-1">
              Sie sind jetzt auf dem <strong>{planChangeSuccess}-Plan</strong>. Die neuen Limits gelten sofort, der neue Preis ab der nächsten Abbuchung.
            </p>
          </div>
        </motion.div>
      )}

      {/* Request Success Banner */}
      {requestSuccess && (
        <motion.div variants={fadeUp} className="bg-green-50 border border-green-200 rounded-2xl p-5 flex gap-4">
          <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-green-800">Anfrage erfolgreich gesendet!</p>
            <p className="text-green-700 text-sm mt-1">
              Wir haben Ihre Anfrage für den <strong>{requestedPlan}-Plan</strong> erhalten. Bei Agency senden wir Ihnen zunächst ein Angebot mit Monats- und Jahrespreis. Eine Aktivierung erfolgt erst nach Ihrer Auswahl und Zustimmung.
            </p>
          </div>
        </motion.div>
      )}

      {/* Mollie processing banner (after checkout redirect) */}
      {mollieProcessing && (
        <motion.div variants={fadeUp} className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-4">
          <span className="w-5 h-5 mt-0.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin shrink-0" />
          <div>
            <p className="font-semibold text-blue-800">Zahlung wird verarbeitet…</p>
            <p className="text-blue-700 text-sm mt-1">Dein SEPA-Mandat wird gerade bestätigt. Das dauert normalerweise nur wenige Sekunden.</p>
          </div>
        </motion.div>
      )}

      {/* Pending Request Banner */}
      {requestedPlan && !requestSuccess && !agencyOffer && (
        <motion.div variants={fadeUp} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
          <Clock className="text-amber-500 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-amber-800">Anfrage in Bearbeitung</p>
            <p className="text-amber-700 text-sm mt-1">
              Ihre Anfrage für den <strong>{requestedPlan}-Plan</strong> wird gerade bearbeitet. Aktivierung innerhalb von 24 Stunden.
            </p>
          </div>
        </motion.div>
      )}

      {agencyOffer && (
        <motion.section variants={fadeUp} className="border border-[#6355E4]/30 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-[#6355E4]">Ihr persönliches Angebot</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">GentleBook Agency</h2>
              <p className="mt-1 text-sm text-gray-500">Gültig bis {new Date(agencyOffer.offerExpiresAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <Shield className="text-[#6355E4]" size={24} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(['Monthly', 'Yearly'] as const).map((interval) => {
              const selected = billingInterval === interval;
              const price = interval === 'Monthly' ? agencyOffer.offeredMonthlyPrice : agencyOffer.offeredAnnualPrice;
              return (
                <button key={interval} type="button" onClick={() => setBillingInterval(interval)} className={`border p-4 text-left transition-colors ${selected ? 'border-[#6355E4] bg-[#6355E4]/5 ring-1 ring-[#6355E4]' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="flex items-center justify-between text-sm font-semibold text-gray-700">
                    {interval === 'Monthly' ? 'Monatliche Abrechnung' : 'Jährliche Abrechnung'}
                    <span className={`h-4 w-4 rounded-full border ${selected ? 'border-4 border-[#6355E4]' : 'border-gray-300'}`} />
                  </span>
                  <span className="mt-2 block text-2xl font-bold text-gray-900">{price.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                  <span className="text-xs text-gray-500">Gesamtpreis pro {interval === 'Monthly' ? 'Monat' : 'Jahr'}, im Voraus</span>
                </button>
              );
            })}
          </div>

          <fieldset className="mt-5 space-y-3 border-t border-gray-200 pt-5 text-sm text-gray-700">
            <legend className="sr-only">Verbindliche Bestätigungen</legend>
            <label className="flex items-start gap-3"><input type="checkbox" checked={businessConfirmed} onChange={(e) => setBusinessConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" /><span>Ich schließe das Abonnement als Unternehmer im Sinne des § 14 BGB ab.</span></label>
            <label className="flex items-start gap-3"><input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" /><span>Ich akzeptiere die geltenden <a href={legalConfig.terms} target="_blank" rel="noopener noreferrer" className="text-[#6355E4] underline">GentleBook-AGB</a>.</span></label>
            <label className="flex items-start gap-3"><input type="checkbox" checked={billingConfirmed} onChange={(e) => setBillingConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" /><span>Ich bestelle Agency verbindlich für {billingInterval === 'Monthly' ? `${agencyOffer.offeredMonthlyPrice.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € pro Monat` : `${agencyOffer.offeredAnnualPrice.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € pro Jahr`}. {hasMollieSubscription ? `Der neue Preis gilt ab der nächsten regulären Abbuchung${sub?.currentPeriodEnd ? ` am ${new Date(sub.currentPeriodEnd).toLocaleDateString('de-DE')}` : ''}.` : 'Die erste Zahlung erfolgt unmittelbar; ich stimme der entsprechend verkürzten Vorabankündigung dieser ersten Abbuchung zu.'} Folgezahlungen erfolgen jeweils zu Beginn der nächsten Periode. Das Abonnement verlängert sich bis zur Kündigung jeweils um denselben Zeitraum.</span></label>
            <label className="flex items-start gap-3"><input type="checkbox" checked={sepaAuthorized} onChange={(e) => setSepaAuthorized(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" /><span>Ich ermächtige GentleBook, die fälligen Beträge per SEPA-Lastschrift von dem auf der folgenden Mollie-Zahlungsseite anzugebenden Konto einzuziehen, und weise mein Kreditinstitut an, diese Lastschriften einzulösen. <em className="text-gray-500">(Entwurf – vor Go-Live anwaltlich zu prüfen.)</em></span></label>
          </fieldset>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">Ihre Auswahl, der Preis, der Zeitpunkt und die AGB-Version werden als Vertragsnachweis gespeichert.</p>
            <button type="button" onClick={handleAcceptAgencyOffer} disabled={!contractConfirmed || acceptingOffer || (!hasMollieSubscription && mollieLiveMode !== true)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-[#6355E4] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#5646D6] disabled:cursor-not-allowed disabled:opacity-50">
              {acceptingOffer ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <ArrowRight size={16} />}
              {hasMollieSubscription ? 'Zahlungspflichtig Agency abonnieren' : 'Zahlungspflichtig abonnieren und zu Mollie'}
            </button>
          </div>
          {!hasMollieSubscription && mollieLiveMode === false && <p className="mt-3 text-sm text-amber-700">Die Online-Zahlung ist derzeit nicht verfügbar. Bitte kontaktieren Sie den Support.</p>}
        </motion.section>
      )}

      {/* Request Error Banner */}
      {requestError && (
        <motion.div variants={fadeUp} className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-red-800">Anfrage nicht möglich</p>
            <p className="text-red-700 text-sm mt-1">{requestError}</p>
          </div>
        </motion.div>
      )}

      {/* Pricing Cards */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-bold text-gray-900">Pläne & Preise</h2>
          <HelpTip text="Alle Pläne beinhalten das Online-Buchungssystem. Der Plan bestimmt wie viele Mitarbeiter & Services du anlegen kannst. Upgrade jederzeit per WhatsApp oder E-Mail möglich." />
        </div>
        <p className="text-gray-500 text-sm mb-4">Alle angegebenen Preise sind die {billingInterval === 'Yearly' ? 'jährlich' : 'monatlich'} zu zahlenden Gesamtpreise. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet oder ausgewiesen. {billingInterval === 'Yearly' ? 'Jährlich' : 'Monatlich'} im Voraus · Keine Einrichtungsgebühr · Keine Provision pro Buchung · Jederzeit zum Periodenende kündbar</p>

        {/* Monthly / Yearly toggle */}
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setBillingInterval('Monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                billingInterval === 'Monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monatlich
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval('Yearly')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                billingInterval === 'Yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Jährlich
            </button>
          </div>
          {maxSavingsPercent > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5">
              Bis zu {maxSavingsPercent}% sparen bei jährlicher Zahlung
            </span>
          )}
        </div>

        {!hasMollieSubscription && (
          <fieldset className="mb-6 space-y-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
            <legend className="px-1 font-semibold text-gray-900">Verbindliche Bestätigungen vor dem Abschluss</legend>
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={businessConfirmed} onChange={(event) => setBusinessConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" />
              <span>Ich schließe das Abonnement als Unternehmer im Sinne des § 14 BGB ab.</span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" />
              <span>Ich akzeptiere die geltenden <a href={legalConfig.terms} target="_blank" rel="noopener noreferrer" className="text-[#6355E4] underline">GentleBook-AGB</a>.</span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={billingConfirmed} onChange={(event) => setBillingConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" />
              <span>Mir ist bekannt, dass das Abonnement {billingInterval === 'Yearly' ? 'jährlich' : 'monatlich'} im Voraus abgerechnet wird und sich jeweils um einen gleich langen Zeitraum verlängert, bis es gekündigt wird.</span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={sepaAuthorized} onChange={(event) => setSepaAuthorized(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" />
              <span>Ich ermächtige GentleBook, die fälligen Beträge per SEPA-Lastschrift von dem auf der folgenden Mollie-Zahlungsseite anzugebenden Konto einzuziehen, und weise mein Kreditinstitut an, diese Lastschriften einzulösen. <em className="text-gray-500">(Entwurf – vor Go-Live anwaltlich zu prüfen.)</em></span>
            </label>
          </fieldset>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const isCurrent = currentPlanKey === plan.key;
            const { monthly, annual } = getPrices(plan);
            const monthlyTotal = monthly * 12;
            const savingsAmount = Math.max(0, monthlyTotal - annual);
            const savingsPercent = monthlyTotal > 0 ? Math.round((savingsAmount / monthlyTotal) * 100) : 0;
            const displayPrice = billingInterval === 'Yearly' ? Math.round(annual / 12) : monthly;
            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl border-2 p-6 flex flex-col
                  ${plan.highlight ? 'border-[#6355E4] shadow-lg' : 'border-gray-200'}
                  ${isCurrent ? 'ring-2 ring-[#6355E4]/30' : ''}
                  bg-white`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#6355E4] text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Empfohlen
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Ihr Plan
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                  {plan.priceOnRequest ? (
                    <div className="flex items-end gap-1 mt-2">
                      <span className="text-2xl font-bold text-gray-900">Preis auf Anfrage</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-end gap-1 mt-2">
                        <span className="text-3xl font-bold text-gray-900">€{displayPrice}</span>
                        <span className="text-gray-500 mb-1">/Monat</span>
                      </div>
                      {billingInterval === 'Yearly' && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-gray-500">bei jährlicher Zahlung · €{annual}/Jahr</span>
                          {savingsPercent > 0 && (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5">
                              Spare {savingsPercent}% (€{savingsAmount}/Jahr)
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {plan.employees ? `${plan.employees} Mitarbeiter · ${plan.services} Services` : 'Unbegrenzte Mitarbeiter & Services'}
                  </p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check size={15} className="text-[#6355E4] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  {/* Agency has no fixed price ("Preis auf Anfrage") — self-service checkout
                      and in-place plan changes are blocked server-side, always route through
                      the manual contact/request flow instead. */}
                  {!isCurrent && plan.priceOnRequest && (
                    <button
                      onClick={() => handlePlanRequest(plan.key)}
                      disabled={requesting || !!requestedPlan}
                      title={requestedPlan && requestedPlan !== plan.key ? `Du hast bereits eine offene Anfrage für den ${requestedPlan}-Plan` : undefined}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors bg-gray-900 hover:bg-gray-700 text-white disabled:opacity-50"
                    >
                      {requestedPlan === plan.key ? 'Anfrage gesendet ✓' : <>Angebot anfragen <ArrowRight size={14} /></>}
                    </button>
                  )}
                  {/* Already a Mollie subscriber: switch in place (PATCH), no new checkout. */}
                  {!isCurrent && !plan.priceOnRequest && hasMollieSubscription && sub?.status === 'Active' && (
                    <button
                      onClick={() => handleChangePlan(plan.key, plan.name)}
                      disabled={!!changingPlan}
                      className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors
                        ${plan.highlight
                          ? 'bg-[#6355E4] hover:bg-[#015f5f] text-white'
                          : 'bg-gray-900 hover:bg-gray-700 text-white'}
                        ${changingPlan && changingPlan !== plan.key ? 'opacity-50' : ''}`}
                    >
                      {changingPlan === plan.key ? (
                        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>Zu {plan.name} wechseln <ArrowRight size={14} /></>
                      )}
                    </button>
                  )}
                  {/* Primary: Mollie SEPA checkout — only ever shown once we've confirmed
                      live mode server-side, so no real customer can hit a test-mode checkout. */}
                  {!isCurrent && !plan.priceOnRequest && !hasMollieSubscription && mollieLiveMode === true && (
                    <button
                      onClick={() => handleMollieStart(plan.key)}
                      disabled={!contractConfirmed || !!mollieLoadingPlan || requestedPlan === plan.key}
                      className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors
                        ${plan.highlight
                          ? 'bg-[#6355E4] hover:bg-[#015f5f] text-white'
                          : 'bg-gray-900 hover:bg-gray-700 text-white'}
                        ${mollieLoadingPlan && mollieLoadingPlan !== plan.key ? 'opacity-50' : ''}`}
                    >
                      {mollieLoadingPlan === plan.key ? (
                        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>{plan.name} kostenpflichtig abonnieren <ArrowRight size={14} /></>
                      )}
                    </button>
                  )}
                  {!isCurrent && !plan.priceOnRequest && !hasMollieSubscription && mollieLiveMode === false && (
                    <div
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                      title="SEPA-Zahlung ist bald verfügbar"
                    >
                      SEPA-Zahlung bald verfügbar
                    </div>
                  )}
                  {isCurrent && (
                    <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium bg-green-50 text-green-700">
                      <Check size={15} /> Aktueller Plan
                    </div>
                  )}
                  {/* Fallback: manual request (no SEPA) — only meaningful before any Mollie
                      subscription exists; the manual path is blocked server-side afterward. */}
                  {!isCurrent && !plan.priceOnRequest && !hasMollieSubscription && (
                    <button
                      onClick={() => handlePlanRequest(plan.key)}
                      disabled={!contractConfirmed || requesting || !!requestedPlan}
                      title={requestedPlan && requestedPlan !== plan.key ? `Du hast bereits eine offene Anfrage für den ${requestedPlan}-Plan` : undefined}
                      className="w-full text-center text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors py-1 disabled:opacity-50"
                    >
                      {requestedPlan === plan.key ? 'Manuelle Anfrage gesendet ✓' : 'Andere Zahlungsart? Manuell anfragen'}
                    </button>
                  )}
                  {/* Secondary: WhatsApp / Email */}
                  <div className="flex gap-2">
                    <a
                      href={supportConfig.whatsappUrl(`Hallo, ich möchte den ${plan.name}-Plan buchen.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                    <a
                      href={supportConfig.mailto(`${plan.name}-Plan Anfrage`)}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <Mail size={13} /> E-Mail
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div variants={fadeUp} className="bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">Fragen zu Ihrem Plan?</p>
          <p className="text-sm text-gray-500 mt-0.5">Wir helfen Ihnen gerne persönlich weiter.</p>
        </div>
        <div className="flex gap-3">
          <a
            href={supportConfig.whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
          <a
            href={supportConfig.mailto()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-colors"
          >
            <Mail size={16} /> E-Mail
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

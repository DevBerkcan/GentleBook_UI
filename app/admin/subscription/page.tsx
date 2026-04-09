// app/admin/subscription/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@nextui-org/card';
import { Chip } from '@nextui-org/chip';
import { CreditCard, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import api from '@/lib/api/client';

interface Subscription {
  plan: string;
  status: string;
  trialStartedAt: string;
  trialEndsAt: string;
  trialDaysRemaining: number;
  isInTrial: boolean;
  isAccessAllowed: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: 'success' | 'warning' | 'danger' | 'default'; icon: any }> = {
  Trial: { label: 'Testphase', color: 'warning', icon: Clock },
  Active: { label: 'Aktiv', color: 'success', icon: CheckCircle },
  PastDue: { label: 'Zahlung überfällig', color: 'danger', icon: AlertTriangle },
  Cancelled: { label: 'Gekündigt', color: 'default', icon: XCircle },
  Expired: { label: 'Abgelaufen', color: 'danger', icon: XCircle },
};

const PLAN_LABELS: Record<string, string> = {
  Trial: 'Testversion (14 Tage)',
  Starter: 'Starter',
  Professional: 'Professional',
  Agency: 'Agency',
};

export default function AdminSubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tenant/subscription')
      .then((res) => setSub(res.data?.data ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#E8C7C3]" />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardBody className="text-center p-8">
            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#1E1E1E]">Kein Abonnement gefunden</h2>
            <p className="text-[#8A8A8A] mt-2">Bitte kontaktieren Sie den Support.</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG['Trial'];
  const StatusIcon = statusCfg.icon;

  const trialEnd = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null;
  const trialStart = sub.trialStartedAt ? new Date(sub.trialStartedAt) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E8C7C3] to-[#D8B0AC] rounded-xl flex items-center justify-center">
            <CreditCard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E1E1E]">Abonnement</h1>
            <p className="text-[#8A8A8A] text-sm">Ihr aktueller Plan</p>
          </div>
        </div>

        {/* Main Status Card */}
        <Card className="mb-4 border-2 border-[#E8C7C3]/20">
          <CardBody className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-[#8A8A8A] mb-1">Aktueller Plan</p>
                <h2 className="text-2xl font-bold text-[#1E1E1E]">
                  {PLAN_LABELS[sub.plan] ?? sub.plan}
                </h2>
              </div>
              <Chip
                color={statusCfg.color}
                startContent={<StatusIcon size={14} />}
                variant="flat"
                size="lg"
              >
                {statusCfg.label}
              </Chip>
            </div>

            {sub.isInTrial && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={18} className="text-amber-600" />
                  <span className="font-semibold text-amber-800">
                    Testphase läuft
                  </span>
                </div>
                <p className="text-amber-700 text-sm">
                  Noch <strong>{sub.trialDaysRemaining} Tage</strong> in der kostenlosen Testphase.
                  {trialEnd && (
                    <> Endet am <strong>{trialEnd.toLocaleDateString('de-DE')}</strong>.</>
                  )}
                </p>
              </div>
            )}

            {sub.status === 'Expired' && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle size={18} className="text-red-600" />
                  <span className="font-semibold text-red-800">Testphase abgelaufen</span>
                </div>
                <p className="text-red-700 text-sm">
                  Ihre Testphase ist abgelaufen. Bitte kontaktieren Sie uns für ein Upgrade.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-2">
              {trialStart && (
                <div className="bg-[#F5EDEB] rounded-xl p-3">
                  <p className="text-xs text-[#8A8A8A]">Teststart</p>
                  <p className="font-semibold text-[#1E1E1E] text-sm">
                    {trialStart.toLocaleDateString('de-DE')}
                  </p>
                </div>
              )}
              {trialEnd && (
                <div className="bg-[#F5EDEB] rounded-xl p-3">
                  <p className="text-xs text-[#8A8A8A]">Testende</p>
                  <p className="font-semibold text-[#1E1E1E] text-sm">
                    {trialEnd.toLocaleDateString('de-DE')}
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Contact for Upgrade */}
        <Card className="border-2 border-[#017172]/20">
          <CardBody className="p-6 text-center">
            <CheckCircle size={32} className="text-[#017172] mx-auto mb-3" />
            <h3 className="font-bold text-[#1E1E1E] mb-2">Upgrade & Support</h3>
            <p className="text-[#8A8A8A] text-sm mb-4">
              Möchten Sie upgraden oder haben Sie Fragen zu Ihrem Plan?
            </p>
            <a
              href="mailto:support@gentlegroup.de"
              className="inline-block bg-gradient-to-r from-[#017172] to-[#015f60] text-white px-6 py-2 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Kontakt aufnehmen
            </a>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

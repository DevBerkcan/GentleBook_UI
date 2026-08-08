// components/admin/settings/LoyaltySection.tsx
// "Treuepunkte" + "Stammkunden-Belohnung" section for /admin/settings (Agency-exklusiv). 0 =
// jeweiliges Feature deaktiviert.
"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Loader2, Lock, Award } from "lucide-react";
import { adminApi, type LoyaltySettings } from "@/lib/api/admin";

const inputCls =
  "w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all";

const REWARD_TYPE_LABEL: Record<LoyaltySettings["rewardType"], string> = {
  MonetaryValue: "Geldwert-Gutschein",
  PercentageDiscount: "Prozent-Rabatt",
  SessionPackage: "Freie Sitzung(en)",
};

export function LoyaltySection() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<LoyaltySettings>({ pointsPerBooking: 0, rewardEveryNVisits: 0, rewardType: "MonetaryValue", rewardValue: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [locked, setLocked] = useState<{ message: string; currentPlan?: string; requiredPlan?: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getLoyaltySettings();
      setSettings(data);
    } catch (err: any) {
      if (err?.response?.status === 402 && err.response?.data?.feature === "loyalty_points") {
        setLocked({ message: err.response.data.message, currentPlan: err.response.data.currentPlan, requiredPlan: err.response.data.requiredPlan });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleSave() {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const saved = await adminApi.updateLoyaltySettings(settings);
      setSettings(saved);
      setSuccess("Gespeichert.");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Die Einstellung konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 text-xs text-[#9CA3AF] px-1"><Loader2 size={13} className="animate-spin" /> Lade…</div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-1 pb-3">
          <div className="w-8 h-8 bg-[#E5E7EB] rounded-xl flex items-center justify-center shrink-0">
            <Lock size={14} className="text-[#9CA3AF]" />
          </div>
          <div>
            <p className="font-semibold text-[#111318] text-sm leading-tight">Treuepunkte</p>
            <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">Agency-exklusiv</p>
          </div>
        </div>
        <div className="px-1">
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F7F8] p-3.5 text-xs text-[#565A72]">
            {locked.message}
            {locked.currentPlan && <span className="block mt-1 text-[#9CA3AF]">Aktueller Plan: {locked.currentPlan}</span>}
            <a href="/admin/subscription" className="inline-block mt-2 text-[#6355E4] font-semibold hover:underline">Jetzt upgraden →</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-1 pb-4">
        <div className="w-8 h-8 bg-[#6355E4] rounded-xl flex items-center justify-center shrink-0">
          <Gift size={15} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-[#111318] text-sm leading-tight">Treuepunkte</p>
          <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">Kund:innen sammeln Punkte für jeden abgeschlossenen Termin</p>
        </div>
      </div>

      <div className="px-1 space-y-4">
        <div className="flex flex-col gap-1.5 max-w-xs">
          <label className="text-xs font-semibold text-[#6B7280]">Punkte pro abgeschlossenem Termin</label>
          <input
            type="number"
            min={0}
            value={settings.pointsPerBooking}
            onChange={(e) => setSettings((s) => ({ ...s, pointsPerBooking: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
            className={inputCls}
            disabled={saving}
          />
          <p className="text-[11px] text-[#9CA3AF]">0 = Treuepunkte-Programm deaktiviert</p>
        </div>
      </div>

      <div className="flex items-center gap-3 px-1 pb-4 pt-6 mt-2 border-t border-[#F3F4F6]">
        <div className="w-8 h-8 bg-[#059669] rounded-xl flex items-center justify-center shrink-0">
          <Award size={15} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-[#111318] text-sm leading-tight">Stammkunden-Belohnung</p>
          <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">Automatischer Gutschein, sobald ein Kunde eine bestimmte Besuchsanzahl erreicht</p>
        </div>
      </div>

      <div className="px-1 space-y-4">
        <div className="flex flex-col gap-1.5 max-w-xs">
          <label className="text-xs font-semibold text-[#6B7280]">Belohnung alle X Besuche</label>
          <input
            type="number"
            min={0}
            value={settings.rewardEveryNVisits}
            onChange={(e) => setSettings((s) => ({ ...s, rewardEveryNVisits: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
            className={inputCls}
            disabled={saving}
          />
          <p className="text-[11px] text-[#9CA3AF]">0 = deaktiviert. Z. B. 10 = bei jedem 10., 20., 30. Besuch usw.</p>
        </div>

        {settings.rewardEveryNVisits > 0 && (
          <div className="flex gap-2 max-w-sm">
            <select
              value={settings.rewardType}
              onChange={(e) => setSettings((s) => ({ ...s, rewardType: e.target.value as LoyaltySettings["rewardType"] }))}
              className={inputCls}
              disabled={saving}
            >
              {Object.entries(REWARD_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input
              type="number"
              min={0}
              step={settings.rewardType === "PercentageDiscount" ? 1 : 0.01}
              value={settings.rewardValue ?? ""}
              onChange={(e) => setSettings((s) => ({ ...s, rewardValue: e.target.value ? parseFloat(e.target.value) : null }))}
              placeholder={settings.rewardType === "PercentageDiscount" ? "%" : settings.rewardType === "SessionPackage" ? "Sitzungen" : "Betrag"}
              className={inputCls}
              disabled={saving}
            />
          </div>
        )}

        {error && <p className="text-xs text-[#991B1B] bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2">{error}</p>}
        {success && !error && <p className="text-xs text-[#065F46] bg-[#D1FAE5] border border-[#A7F3D0] rounded-lg px-3 py-2">{success}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-2 text-xs font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Gift size={13} />} Speichern
        </button>
      </div>
    </div>
  );
}

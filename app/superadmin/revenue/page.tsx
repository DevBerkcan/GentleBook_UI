// app/superadmin/revenue/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Euro, UserMinus, UserCheck } from 'lucide-react';
import { superAdminApi, RevenueBucket } from '@/lib/api/superadmin';
import { HelpTip } from '@/components/ui/help-tip';

export default function RevenuePage() {
  const [granularity, setGranularity] = useState<'week' | 'month'>('month');
  const [buckets, setBuckets] = useState<RevenueBucket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = (g: 'week' | 'month' = granularity) => {
    setLoading(true);
    setLoadError('');
    superAdminApi.getRevenue(g, g === 'week' ? 12 : 12)
      .then(data => setBuckets(data.buckets))
      .catch(() => setLoadError('Umsatzdaten konnten nicht geladen werden.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(granularity); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [granularity]);

  const latest = buckets && buckets.length > 0 ? buckets[buckets.length - 1] : null;
  const previous = buckets && buckets.length > 1 ? buckets[buckets.length - 2] : null;
  const totalRevenue = buckets?.reduce((s, b) => s + b.realizedRevenue, 0) ?? 0;
  const maxRevenue = Math.max(...(buckets?.map(b => b.realizedRevenue) ?? [1]), 1);

  const revenueTrend = latest && previous && previous.realizedRevenue > 0
    ? Math.round(((latest.realizedRevenue - previous.realizedRevenue) / previous.realizedRevenue) * 100)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 -m-8 p-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Umsatz</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Tatsächlich von Mollie eingezogenes Geld — nicht zu verwechseln mit der MRR-Kachel im Dashboard, die nur die aktuell laufenden Abo-Preise zeigt.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setGranularity('week')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${granularity === 'week' ? 'bg-[#6355E4] text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Woche
            </button>
            <button
              type="button"
              onClick={() => setGranularity('month')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${granularity === 'month' ? 'bg-[#6355E4] text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Monat
            </button>
          </div>
          <button
            onClick={() => load()}
            aria-label="Umsatzdaten aktualisieren"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors shadow-sm border border-gray-100"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Fehlerzustand */}
      {!loading && loadError && (
        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Daten konnten nicht geladen werden</p>
              <p className="text-xs text-gray-400">{loadError}</p>
            </div>
          </div>
          <button
            onClick={() => load()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#6355E4] text-white text-xs font-semibold hover:bg-[#5646D6] transition-colors"
          >
            <RefreshCw size={13} /> Erneut versuchen
          </button>
        </div>
      )}

      {/* Kennzahlen-Kacheln */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-green-50">
              <Euro size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none">
              {(latest?.realizedRevenue ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
            </p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              Umsatz diese{granularity === 'week' ? ' Woche' : 'n Monat'}
              {revenueTrend != null && (
                <span className={`inline-flex items-center gap-0.5 font-semibold ${revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueTrend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(revenueTrend)}%
                </span>
              )}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-blue-50">
              <Euro size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none">
              {totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
            </p>
            <p className="text-xs text-gray-400 mt-1">Gesamt (letzte {buckets?.length ?? 0} {granularity === 'week' ? 'Wochen' : 'Monate'})</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-red-50">
              <UserMinus size={18} className="text-red-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none">
              {latest?.churnRatePercent != null ? `${latest.churnRatePercent}%` : '–'}
            </p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              Churn-Rate
              <HelpTip text={`${latest?.churnedTenants ?? 0} von ${latest?.activeTenantsAtStart ?? 0} zahlenden Kunden haben in diesem Zeitraum gekündigt.`} />
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-violet-50">
              <UserCheck size={18} className="text-violet-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none">
              {latest?.conversionRatePercent != null ? `${latest.conversionRatePercent}%` : '–'}
            </p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              Trial → Paid
              <HelpTip text={`${latest?.converted ?? 0} von ${latest?.trialsEnded ?? 0} Tenants, deren Testphase in diesem Zeitraum endete, sind zahlende Kunden geworden.`} />
            </p>
          </div>
        </div>
      )}

      {/* Balkendiagramm */}
      {!loading && buckets && buckets.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-green-500" />
            Realisierter Umsatz – {granularity === 'week' ? 'letzte 12 Wochen' : 'letzte 12 Monate'}
          </h2>
          <div className="flex items-end justify-between gap-2 h-32">
            {buckets.map((b, i) => {
              const h = Math.max(4, Math.round((b.realizedRevenue / maxRevenue) * 110));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-gray-500">
                    {b.realizedRevenue > 0 ? `${b.realizedRevenue.toLocaleString('de-DE', { maximumFractionDigits: 0 })}€` : ''}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-green-500 transition-all"
                    style={{ height: `${h}px` }}
                    title={`${b.label}: ${b.realizedRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € (${b.invoiceCount} Rechnungen)`}
                  />
                  <span className="text-[9px] text-gray-400 truncate w-full text-center">{b.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabelle mit exakten Werten */}
      {!loading && buckets && buckets.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white text-xs font-medium uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Zeitraum</th>
                  <th className="px-4 py-3 text-right">Umsatz</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">Rechnungen</th>
                  <th className="px-4 py-3 text-right">Churn</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">Trial→Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...buckets].reverse().map((b, i) => (
                  <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{b.label}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{b.realizedRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{b.invoiceCount}</td>
                    <td className="px-4 py-3 text-right">
                      {b.churnRatePercent != null ? (
                        <span className={b.churnRatePercent > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                          {b.churnRatePercent}% ({b.churnedTenants}/{b.activeTenantsAtStart})
                        </span>
                      ) : <span className="text-gray-300">–</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">
                      {b.trialsEnded > 0 ? `${b.conversionRatePercent}% (${b.converted}/${b.trialsEnded})` : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

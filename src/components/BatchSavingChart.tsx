import React, { useMemo, useState } from 'react';
import { BarChart3, Sparkles, TrendingUp, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { pickLang } from '../utils/i18nHelper';

export interface BatchChartPeriodRow {
  id: string;
  label: string;
  mandiCost: number;
  marketCostWithLoss: number;
  netSaved: number;
}

interface BatchSavingChartProps {
  customRows?: BatchChartPeriodRow[];
  selectedPeriodId?: string;
  onSelectPeriod?: (periodId: string) => void;
  compact?: boolean;
}

const MARKET_SPOILAGE_FACTOR = 0.14;

export const BatchSavingChart: React.FC<BatchSavingChartProps> = ({
  customRows,
  selectedPeriodId,
  onSelectPeriod,
  compact = false,
}) => {
  const { produceList, getCommunityDemandKg, orders, lang } = useApp();
  const [chartView, setChartView] = useState<'horizon' | 'category'>('horizon');
  const [hoveredPeriod, setHoveredPeriod] = useState<string | null>(null);

  // Compute live collective batch pool savings per category
  const categoryBreakdown = useMemo(() => {
    const bucketMap = new Map<
      string,
      { key: string; label: string; kg: number; mandiBill: number; marketBill: number; saved: number }
    >();

    const labels: Record<string, string> = {
      vegetables: pickLang(lang, { en: 'Vegetables', hi: 'सब्ज़ियाँ', mr: 'भाज्या', hinglish: 'Vegetables' }),
      fruits: pickLang(lang, { en: 'Fresh Fruits', hi: 'ताज़े फल', mr: 'ताजी फळे', hinglish: 'Fruits' }),
      leafy: pickLang(lang, { en: 'Leafy & Herbs', hi: 'पत्तेदार व साग', mr: 'पालेभाज्या', hinglish: 'Leafy' }),
      exotic: pickLang(lang, { en: 'Exotic & Roots', hi: 'एक्सोटिक व मसाले', mr: 'विदेशी फळे', hinglish: 'Exotic' }),
    };

    produceList.forEach((item) => {
      const demandKg = getCommunityDemandKg(item.id);
      if (demandKg <= 0) return;
      const effectivePrice = item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.pricePerKg;
      const marketRate = item.localMarketPricePerKg || Math.round(effectivePrice * 1.32);
      const catKey = item.category || 'vegetables';
      const prev = bucketMap.get(catKey) || {
        key: catKey,
        label: labels[catKey] || catKey,
        kg: 0,
        mandiBill: 0,
        marketBill: 0,
        saved: 0,
      };
      const mandiVal = demandKg * effectivePrice;
      const marketVal = demandKg * marketRate * (1 + MARKET_SPOILAGE_FACTOR);
      prev.kg = Math.round((prev.kg + demandKg) * 10) / 10;
      prev.mandiBill += Math.round(mandiVal);
      prev.marketBill += Math.round(marketVal);
      prev.saved += Math.max(0, Math.round(marketVal - mandiVal));
      bucketMap.set(catKey, prev);
    });

    return Array.from(bucketMap.values()).sort((a, b) => b.saved - a.saved);
  }, [produceList, getCommunityDemandKg, lang]);

  // Fallback horizon rows derived from real pooled/average batch or passed props
  const chartRows = useMemo<BatchChartPeriodRow[]>(() => {
    if (customRows && customRows.length > 0) return customRows;

    const totalPoolMandi = categoryBreakdown.reduce((s, c) => s + c.mandiBill, 0);
    const totalPoolMarket = categoryBreakdown.reduce((s, c) => s + c.marketBill, 0);
    const activeOrderDailyBase = Math.max(
      240,
      Math.round(
        orders
          .filter((o) => !o.isSampleOrder && o.status !== 'cancelled')
          .slice(0, 5)
          .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0) /
          Math.max(1, Math.min(5, orders.filter((o) => !o.isSampleOrder && o.status !== 'cancelled').length))
      )
    );

    const baseDailyMandi = totalPoolMandi > 0 ? Math.max(240, Math.round(totalPoolMandi / 10)) : activeOrderDailyBase;
    const ratio = totalPoolMandi > 0 ? totalPoolMarket / totalPoolMandi : 1.5;

    const horizons = [
      { id: 'daily', days: 1, label: pickLang(lang, { en: 'Daily', hi: 'दैनिक', mr: 'दैनिक', hinglish: 'Daily' }) },
      { id: 'weekly', days: 7, label: pickLang(lang, { en: 'Weekly', hi: 'साप्ताहिक', mr: 'साप्ताहिक', hinglish: 'Weekly' }) },
      { id: 'monthly', days: 30, label: pickLang(lang, { en: 'Monthly', hi: 'मासिक', mr: 'मासिक', hinglish: 'Monthly' }) },
      { id: 'yearly', days: 365, label: pickLang(lang, { en: 'Yearly', hi: 'सालाना', mr: 'वार्षिक', hinglish: 'Yearly' }) },
    ];

    return horizons.map((h) => {
      const mandiCost = Math.round(baseDailyMandi * h.days);
      const marketCostWithLoss = Math.round(mandiCost * ratio);
      return {
        id: h.id,
        label: h.label,
        mandiCost,
        marketCostWithLoss,
        netSaved: Math.max(0, marketCostWithLoss - mandiCost),
      };
    });
  }, [customRows, categoryBreakdown, orders, lang]);

  const maxMarketBar = Math.max(1, ...chartRows.map((r) => r.marketCostWithLoss));
  const maxCategorySaved = Math.max(1, ...categoryBreakdown.map((c) => c.saved));
  const totalBatchPoolSaved = categoryBreakdown.reduce((s, c) => s + c.saved, 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                {pickLang(lang, {
                  en: 'Batch Saving Chart (TaazaMandi vs Local Market)',
                  hi: 'बैच सेविंग चार्ट (ताज़ाMandi बनाम बाज़ार खर्च व बचत)',
                  mr: 'बॅच बचत चार्ट (ताज़ाMandi vs स्थानिक बाजार)',
                  hinglish: 'Batch Saving Chart (Mandi vs Local Market)',
                })}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {pickLang(lang, {
                en: 'Visual comparison of direct 4 AM APMC batch cost vs retail market + 14% spoilage loss',
                hi: 'सुबह 4 AM बैच दाम बनाम बाज़ार + 14% सड़े-गले माल नुकसान का लाइव तुलनात्मक ग्राफ',
                hinglish: '4 AM Mandi batch cost vs Local market + 14% kharaab loss ka live visual chart',
              })}
            </p>
          </div>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold self-start">
          <button
            type="button"
            onClick={() => setChartView('horizon')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
              chartView === 'horizon'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{pickLang(lang, { en: 'Period Chart', hi: 'अवधि चार्ट', hinglish: 'Period Chart' })}</span>
          </button>
          <button
            type="button"
            onClick={() => setChartView('category')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
              chartView === 'category'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{pickLang(lang, { en: 'Today Batch Mix', hi: 'आज का बैच चार्ट', hinglish: 'Batch Mix' })}</span>
          </button>
        </div>
      </div>

      {chartView === 'horizon' ? (
        <div className="space-y-3">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
              {pickLang(lang, { en: 'TaazaMandi Batch Bill', hi: 'ताज़ाMandi बिल' })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500/80 inline-block" />
              {pickLang(lang, { en: 'Market + Spoilage', hi: 'बाज़ार + खराब नुकसान' })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" />
              {pickLang(lang, { en: 'Net Batch Saving', hi: 'कुल असली बचत' })}
            </span>
          </div>

          {/* Vertical Grouped Bar Chart Grid */}
          <div
            className={`grid gap-3 pt-2 ${
              chartRows.length >= 5
                ? 'grid-cols-2 sm:grid-cols-5'
                : 'grid-cols-2 sm:grid-cols-4'
            }`}
          >
            {chartRows.map((row) => {
              const mandiH = Math.max(12, Math.round((row.mandiCost / maxMarketBar) * 100));
              const marketH = Math.max(18, Math.round((row.marketCostWithLoss / maxMarketBar) * 100));
              const savedH = Math.max(10, Math.round((row.netSaved / maxMarketBar) * 100));
              const savedPct =
                row.marketCostWithLoss > 0
                  ? Math.round((row.netSaved / row.marketCostWithLoss) * 100)
                  : 0;
              const isSelected = selectedPeriodId === row.id || hoveredPeriod === row.id;

              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => onSelectPeriod?.(row.id)}
                  onMouseEnter={() => setHoveredPeriod(row.id)}
                  onMouseLeave={() => setHoveredPeriod(null)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/35 border-emerald-400 dark:border-emerald-700 shadow-2xs'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                      {row.label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 text-[10px] font-black font-mono-nums shrink-0">
                      -{savedPct}%
                    </span>
                  </div>

                  {/* Bar Columns */}
                  <div
                    className={`w-full flex items-end justify-center gap-2 px-1 pt-2 border-b border-slate-200 dark:border-slate-700 ${
                      compact ? 'h-24' : 'h-32'
                    }`}
                  >
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className="w-full max-w-[22px] rounded-t-md bg-emerald-600 transition-all duration-500"
                        style={{ height: `${mandiH}%` }}
                        title={`TaazaMandi: ₹${row.mandiCost.toLocaleString('en-IN')}`}
                      />
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className="w-full max-w-[22px] rounded-t-md bg-rose-500/85 transition-all duration-500"
                        style={{ height: `${marketH}%` }}
                        title={`Market: ₹${row.marketCostWithLoss.toLocaleString('en-IN')}`}
                      />
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className="w-full max-w-[22px] rounded-t-md bg-amber-400 transition-all duration-500"
                        style={{ height: `${savedH}%` }}
                        title={`Saved: ₹${row.netSaved.toLocaleString('en-IN')}`}
                      />
                    </div>
                  </div>

                  {/* Exact Numeric Summary */}
                  <div className="space-y-0.5 text-[10.5px] font-mono-nums w-full">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Mandi:</span>
                      <span className="font-bold">₹{row.mandiCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-black">
                      <span>{pickLang(lang, { en: 'Saved:', hi: 'बचत:' })}</span>
                      <span>+₹{row.netSaved.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {pickLang(lang, {
                  en: 'Live Batch Savings by Category',
                  hi: 'श्रेणी अनुसार आज के बैच की कुल बचत',
                  hinglish: 'Category-wise Live Batch Saving',
                })}
              </span>
            </span>
            <span className="font-mono-nums font-black text-emerald-700 dark:text-emerald-400">
              ₹{totalBatchPoolSaved.toLocaleString('en-IN')}{' '}
              {pickLang(lang, { en: 'pooled benefit', hi: 'बैच बचत' })}
            </span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              {pickLang(lang, {
                en: 'Add produce items to the active community batch to chart live savings.',
                hi: 'लाइव बैच सेविंग चार्ट देखने के लिए कैटलॉग से सब्ज़ी-फल जोड़ें।',
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {categoryBreakdown.map((cat) => {
                const pct = Math.max(10, Math.round((cat.saved / maxCategorySaved) * 100));
                return (
                  <div
                    key={cat.key}
                    className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {cat.label}{' '}
                        <span className="text-[11px] font-mono text-slate-500">({cat.kg} kg)</span>
                      </span>
                      <span className="font-mono-nums font-black text-emerald-700 dark:text-emerald-400">
                        +₹{cat.saved.toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] font-normal text-slate-500">
                          (vs ₹{cat.marketBill.toLocaleString('en-IN')})
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-emerald-600 to-teal-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchSavingChart;

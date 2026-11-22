import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { pickLang } from '../utils/i18nHelper';
import {
  X,
  TrendingUp,
  Calendar,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Users,
  Wallet,
  Scale,
} from 'lucide-react';
import { GamifiedSavingsBadgeCard } from './GamifiedSavingsBadgeCard';
import { BatchSavingChart } from './BatchSavingChart';

interface BatchSavingsForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToShop?: () => void;
}

type SavingsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'total';

const PERIOD_LABELS: Array<{
  id: SavingsPeriod;
  en: string;
  hi: string;
  mr: string;
  hinglish: string;
}> = [
  { id: 'daily', en: 'Daily', hi: 'दैनिक (आज)', mr: 'दैनिक', hinglish: 'Daily' },
  { id: 'weekly', en: 'Weekly', hi: 'साप्ताहिक', mr: 'साप्ताहिक', hinglish: 'Weekly' },
  { id: 'monthly', en: 'Monthly', hi: 'पूरा महीना', mr: 'मासिक', hinglish: 'Monthly' },
  { id: 'yearly', en: 'Yearly', hi: 'सालाना', mr: 'वार्षिक', hinglish: 'Yearly' },
  { id: 'total', en: 'Total Saved', hi: 'कुल अब तक', mr: 'एकूण बचत', hinglish: 'Total Saved' },
];

// Retail local-market hidden spoilage + moisture shrinkage + short-weight ratio (~14% hidden consumer loss)
const MARKET_SPOILAGE_RATE = 0.14;

export const BatchSavingsForecastModal: React.FC<BatchSavingsForecastModalProps> = ({
  isOpen,
  onClose,
  onGoToShop,
}) => {
  const { lang, orders, produceCart, produceList, featureFlags } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<SavingsPeriod>('monthly');
  const [dailySpendForecast, setDailySpendForecast] = useState<number>(240);
  const [societyBatchPoolOn, setSocietyBatchPoolOn] = useState<boolean>(true);

  const statsByPeriod = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    const produceRateMap = new Map<string, { price: number; market: number }>();
    produceList.forEach((p) => {
      const effective = p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.pricePerKg;
      const market = p.localMarketPricePerKg || Math.round(effective * 1.32);
      produceRateMap.set(p.id, { price: effective, market });
    });

    // Current cart contribution belongs to "daily" & cumulative periods
    let cartMandiSpend = 0;
    let cartMarketCost = 0;
    let cartKg = 0;
    Object.entries(produceCart).forEach(([id, kg]) => {
      if (kg <= 0) return;
      const rates = produceRateMap.get(id);
      if (!rates) return;
      cartKg += kg;
      cartMandiSpend += rates.price * kg;
      cartMarketCost += rates.market * kg;
    });

    const computeForSince = (sinceMs: number, includeCart: boolean) => {
      let mandiSpend = includeCart ? cartMandiSpend : 0;
      let marketCost = includeCart ? cartMarketCost : 0;
      let totalKg = includeCart ? cartKg : 0;
      let orderCount = 0;

      orders.forEach((o) => {
        if (o.status === 'cancelled' || o.isSampleOrder) return;
        const t = new Date(o.orderedAt).getTime();
        if (Number.isNaN(t) || t < sinceMs) return;
        orderCount += 1;
        o.produceItems.forEach((pi) => {
          const catalog = produceRateMap.get(pi.produceId);
          const marketRate = catalog?.market || Math.round(pi.pricePerKg * 1.32);
          mandiSpend += pi.pricePerKg * pi.quantityKg;
          marketCost += marketRate * pi.quantityKg;
          totalKg += pi.quantityKg;
        });
      });

      const directCashSaved = Math.max(0, Math.round(marketCost - mandiSpend));
      // If bought from local retail cart/mandi stall after 2-day cold chain: ~14% wilted, rotten or underweight
      const spoilageLossRupees = Math.round(marketCost * MARKET_SPOILAGE_RATE);
      const spoilageSavedKg = Math.round(totalKg * MARKET_SPOILAGE_RATE * 10) / 10;
      const totalMarketDamageRupees = directCashSaved + spoilageLossRupees;

      return {
        orderCount,
        totalKg: Math.round(totalKg * 10) / 10,
        mandiSpend: Math.round(mandiSpend),
        marketCost: Math.round(marketCost),
        directCashSaved,
        spoilageLossRupees,
        spoilageSavedKg,
        totalNetBenefit: totalMarketDamageRupees,
      };
    };

    return {
      daily: computeForSince(startOfToday, true),
      weekly: computeForSince(weekAgo, true),
      monthly: computeForSince(startOfMonth, true),
      yearly: computeForSince(startOfYear, true),
      total: computeForSince(0, true),
    };
  }, [orders, produceCart, produceList]);

  const activeStats = statsByPeriod[selectedPeriod];

  // Forecast projections using household daily budget & Society 4AM Batch Pool advantage
  const forecastRows = useMemo(() => {
    const retailMarkup = 1.32;
    const batchDiscountPct = societyBatchPoolOn ? 0.06 : 0;
    const periods: Array<{
      id: SavingsPeriod;
      days: number;
      en: string;
      hi: string;
      mr: string;
    }> = [
      { id: 'daily', days: 1, en: 'Daily', hi: 'दैनिक (1 दिन)', mr: 'दैनिक' },
      { id: 'weekly', days: 7, en: 'Weekly', hi: 'साप्ताहिक (7 दिन)', mr: 'साप्ताहिक' },
      { id: 'monthly', days: 30, en: 'Monthly', hi: 'पूरा महीना (30 दिन)', mr: 'मासिक' },
      { id: 'yearly', days: 365, en: 'Yearly', hi: 'सालाना (365 दिन)', mr: 'वार्षिक' },
      { id: 'total', days: 1095, en: '3-Year Total', hi: '3 साल कुल', mr: '३ वर्षे एकूण' },
    ];

    return periods.map((p) => {
      const grossMandi = dailySpendForecast * p.days;
      const mandiNetCost = Math.round(grossMandi * (1 - batchDiscountPct));
      const retailCost = Math.round(grossMandi * retailMarkup);
      const directSaved = Math.max(0, retailCost - mandiNetCost);
      const marketSpoilageNuksaan = Math.round(retailCost * MARKET_SPOILAGE_RATE);
      const totalSavedWithQuality = directSaved + marketSpoilageNuksaan;
      return {
        ...p,
        mandiNetCost,
        retailCost,
        directSaved,
        marketSpoilageNuksaan,
        totalSavedWithQuality,
      };
    });
  }, [dailySpendForecast, societyBatchPoolOn]);

  const selectedForecast = useMemo(
    () => forecastRows.find((r) => r.id === selectedPeriod) || forecastRows[2],
    [forecastRows, selectedPeriod]
  );

  // Breakdown of typical local market spoilage/nuksaan
  const spoilageBreakdown = useMemo(() => {
    const baseLoss =
      activeStats.spoilageLossRupees > 0
        ? activeStats.spoilageLossRupees
        : selectedForecast.marketSpoilageNuksaan;
    return [
      {
        label: pickLang(lang, {
          en: 'Rotten / Wilted Leafy & Soft Produce (~8%)',
          hi: 'सड़ी-गली व मुरझाई सब्ज़ी छँटाई (~8%)',
          mr: 'सडलेला व कोमेजलेला माल (~८%)',
          hinglish: 'Sadi-gali / murjhayi sabzi loss (~8%)',
        }),
        amount: Math.round(baseLoss * (8 / 14)),
      },
      {
        label: pickLang(lang, {
          en: '2-Day Cold Storage Moisture Loss (~4%)',
          hi: 'बासी कोल्ड-स्टोरेज व सूखने का नुकसान (~4%)',
          mr: 'जुना कोल्ड-स्टोरेज नुकसान (~४%)',
          hinglish: 'Baasi cold-storage & sookhna (~4%)',
        }),
        amount: Math.round(baseLoss * (4 / 14)),
      },
      {
        label: pickLang(lang, {
          en: 'Local Cart Scale & Bruise Loss (~2%)',
          hi: 'ठेले पर तौल व दबने से खराब माल (~2%)',
          mr: 'तौल व दबलेला माल (~२%)',
          hinglish: 'Thele par kam taul & dabe hue daane (~2%)',
        }),
        amount: Math.max(0, baseLoss - Math.round(baseLoss * (8 / 14)) - Math.round(baseLoss * (4 / 14))),
      },
    ];
  }, [activeStats.spoilageLossRupees, selectedForecast.marketSpoilageNuksaan, lang]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Emerald Header */}
        <div className="bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white px-4 sm:px-6 py-4 flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {pickLang(lang, {
                  en: 'Batch Savings & Daily Forecast',
                  hi: 'बैच बचत, बाज़ार नुकसान व दैनिक अनुमान',
                  mr: 'बॅच बचत व दैनिक अंदाज',
                  hinglish: 'Batch Savings & Daily Forecast',
                })}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-black tracking-tight mt-0.5">
              {pickLang(lang, {
                en: 'How Much You Saved vs Local Market',
                hi: 'पूरे महीने से सालाना तक आपकी बचत व खराब माल से बचाव',
                mr: 'स्थानिक बाजारापेक्षा तुमची एकूण बचत व नुकसान टळले',
                hinglish: 'TaazaMandi Batch Saving vs Local Market Nuksaan',
              })}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          <GamifiedSavingsBadgeCard
            homeSavingsStats={{
              totalSavedRupees: statsByPeriod.total.totalNetBenefit,
              totalKg: statsByPeriod.total.totalKg,
              wasteAvoidedKg: statsByPeriod.total.spoilageSavedKg,
            }}
          />

          {/* Period Switcher Tabs: Daily · Weekly · Monthly · Yearly · Total */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {PERIOD_LABELS.map((tab) => {
              const active = selectedPeriod === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedPeriod(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                    active
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  {pickLang(lang, {
                    en: tab.en,
                    hi: tab.hi,
                    mr: tab.mr,
                    hinglish: tab.hinglish,
                  })}
                </button>
              );
            })}
          </div>

          {/* Real Tracked Savings Grid (Actual Orders + Live Cart in selected period) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>
                  {pickLang(lang, {
                    en: 'Your Recorded Batch Ledger',
                    hi: 'आपकी असली बचत रिपोर्ट (ऑर्डर्स + लाइव थैली)',
                    mr: 'तुमची नोंदवलेली बचत आकडेवारी',
                    hinglish: 'Aapki Real Batch Savings Report',
                  })}
                </span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono-nums">
                {activeStats.orderCount}{' '}
                {pickLang(lang, { en: 'orders', hi: 'ऑर्डर्स', mr: 'ऑर्डर्स' })} · {activeStats.totalKg} kg
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
                <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                  {pickLang(lang, {
                    en: 'Direct Cash Saved',
                    hi: 'सीधी नकद बचत',
                    mr: 'थेट रोख बचत',
                    hinglish: 'Seedhi Cash Bachat',
                  })}
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono-nums mt-0.5">
                  ₹{activeStats.directCashSaved.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono-nums">
                  {pickLang(lang, {
                    en: `Mandi paid: ₹${activeStats.mandiSpend}`,
                    hi: `मंडी बिल: ₹${activeStats.mandiSpend}`,
                  })}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/35 border border-pink-200 dark:border-pink-800/70">
                <div className="text-[11px] font-medium text-pink-800 dark:text-pink-300">
                  {pickLang(lang, {
                    en: 'Market Kharaab Saved',
                    hi: 'खराब माल नुकसान बचा',
                    mr: 'खराब माल नुकसान टळले',
                    hinglish: 'Kharaab Maal Nuksaan Bacha',
                  })}
                </div>
                <div className="text-xl sm:text-2xl font-black text-pink-700 dark:text-pink-400 font-mono-nums mt-0.5">
                  ₹{activeStats.spoilageLossRupees.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono-nums">
                  {activeStats.spoilageSavedKg} kg{' '}
                  {pickLang(lang, { en: 'waste avoided', hi: 'खराबी से बचा' })}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-800/70">
                <div className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                  {pickLang(lang, {
                    en: 'If Bought Locally',
                    hi: 'बाज़ार से खरीदते तो खर्च',
                    mr: 'बाहेर बाजारात खर्च',
                    hinglish: 'Market se lete toh kharch',
                  })}
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 font-mono-nums mt-0.5">
                  ₹{(activeStats.marketCost + activeStats.spoilageLossRupees).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono-nums">
                  {pickLang(lang, {
                    en: `Rate ₹${activeStats.marketCost} + wastage`,
                    hi: `दाम ₹${activeStats.marketCost} + खराब माल`,
                  })}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 dark:bg-emerald-900 text-white border border-slate-800 dark:border-emerald-700">
                <div className="text-[11px] font-medium text-emerald-300">
                  {pickLang(lang, {
                    en: 'Total Real Benefit',
                    hi: 'कुल असली फ़ायदा',
                    mr: 'एकूण खरा फायदा',
                    hinglish: 'Total Asli Fayda',
                  })}
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono-nums mt-0.5">
                  ₹{activeStats.totalNetBenefit.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-emerald-200 mt-0.5">
                  {pickLang(lang, {
                    en: 'Cash + zero wastage',
                    hi: 'नकद बचत + ताज़ा क्वालिटी',
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Retail Market Spoilage ("Kharaab Ki Detail") Transparency Card */}
          <div className="rounded-2xl border border-pink-200 dark:border-pink-900/60 bg-pink-50/70 dark:bg-pink-950/20 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                    {pickLang(lang, {
                      en: 'Why Local Market Costs More: Hidden Kharaab / Spoilage Breakdown (~14%)',
                      hi: 'अगर आम बाज़ार से खरीदते तो कितना व कैसे नुकसान (खराब माल की पूरी डिटेल)',
                      mr: 'स्थानिक बाजारात होणाऱ्या नुकसानाचा सविस्तर तपशील (~१४%)',
                      hinglish: 'Market se kharidte toh kahan hota nuksaan (Kharaab Maal Detail)',
                    })}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {pickLang(lang, {
                      en: 'Based on 4:00 AM APMC direct auction vs 2–3 day middleman & retail stall exposure.',
                      hi: 'सुबह 4 AM सीधी मंडी बोली बनाम 2-3 दिन पुरानी बाज़ार व ठेले की सब्ज़ी की तुलना:',
                      mr: 'पहाटे ४ AM थेट मंडी बोली व २-३ दिवस जुन्या किरकोळ मालाची तुलना:',
                    })}
                  </p>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-pink-600 text-white font-mono-nums shrink-0">
                ₹
                {(activeStats.spoilageLossRupees > 0
                  ? activeStats.spoilageLossRupees
                  : selectedForecast.marketSpoilageNuksaan
                ).toLocaleString('en-IN')}{' '}
                {pickLang(lang, { en: 'saved', hi: 'बचा' })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {spoilageBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900/90 border border-pink-100 dark:border-pink-900/50 rounded-xl px-3 py-2.5 flex flex-col justify-between gap-1"
                >
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                    {item.label}
                  </span>
                  <span className="text-sm font-black text-pink-700 dark:text-pink-400 font-mono-nums">
                    -₹{item.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Daily Forecast & All-Period Batch Simulator */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-slate-100">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>
                    {pickLang(lang, {
                      en: 'Daily Forecast & Batch Saving Estimator',
                      hi: 'दैनिक अनुमान व बैच सेविंग कैलकुलेटर (रोज़ / सप्ताह / महीना / सालाना)',
                      mr: 'दैनिक अंदाज व बॅच बचत कॅल्क्युलेटर',
                      hinglish: 'Daily Forecast & Batch Saving Calculator',
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {pickLang(lang, {
                    en: 'Slide your average daily household kitchen spend to forecast full savings.',
                    hi: 'अपना रोज़ का सब्ज़ी-फल खर्च चुनें और देखें कि हर अवधि में कितना पैसा व खराब माल बचेगा:',
                  })}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSocietyBatchPoolOn((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border inline-flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 ${
                  societyBatchPoolOn
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>
                  {societyBatchPoolOn
                    ? pickLang(lang, {
                        en: 'Society Batch Pool ON (+6%)',
                        hi: 'सोसायटी बैच पूल चालू (+6% बचत)',
                      })
                    : pickLang(lang, {
                        en: 'Enable Batch Pool (+6%)',
                        hi: 'बैच पूल जोड़ें (+6%)',
                      })}
                </span>
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  {pickLang(lang, {
                    en: 'Daily Kitchen Order:',
                    hi: 'रोज़ाना सब्ज़ी व फल खरीद:',
                    mr: 'दैनिक खरेदी अंदाज:',
                  })}
                </span>
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono-nums">
                  ₹{dailySpendForecast} / {pickLang(lang, { en: 'day', hi: 'दिन', mr: 'दिवस' })}
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={800}
                step={20}
                value={dailySpendForecast}
                onChange={(e) => setDailySpendForecast(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono-nums">
                <span>₹100/day</span>
                <span>₹240/day (Family)</span>
                <span>₹500/day</span>
                <span>₹800/day</span>
              </div>
            </div>

            {featureFlags.batchSavingChart !== false && (
              <BatchSavingChart
                compact
                selectedPeriodId={selectedPeriod}
                onSelectPeriod={(pid) => setSelectedPeriod(pid as SavingsPeriod)}
                customRows={forecastRows.map((row) => ({
                  id: row.id,
                  label: pickLang(lang, { en: row.en, hi: row.hi, mr: row.mr }),
                  mandiCost: row.mandiNetCost,
                  marketCostWithLoss: row.retailCost + row.marketSpoilageNuksaan,
                  netSaved: row.totalSavedWithQuality,
                }))}
              />
            )}

            {/* Clean All-Period Forecast Table: Daily, Weekly, Monthly, Yearly, 3-Year Total */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
                    <th className="py-2.5 px-3 font-bold">
                      {pickLang(lang, { en: 'Period', hi: 'अवधि', mr: 'कालावधी' })}
                    </th>
                    <th className="py-2.5 px-3 font-bold text-right">
                      {pickLang(lang, { en: 'TaazaMandi', hi: 'ताज़ाMandi बिल', mr: 'ताज़ाMandi' })}
                    </th>
                    <th className="py-2.5 px-3 font-bold text-right">
                      {pickLang(lang, { en: 'Market + Loss', hi: 'बाज़ार + नुकसान', mr: 'बाजार खर्च' })}
                    </th>
                    <th className="py-2.5 px-3 font-bold text-right text-emerald-700 dark:text-emerald-400">
                      {pickLang(lang, { en: 'Net Saved', hi: 'कुल बचत', mr: 'एकूण बचत' })}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono-nums">
                  {forecastRows.map((row) => {
                    const isHighlighted = row.id === selectedPeriod;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedPeriod(row.id)}
                        className={`cursor-pointer transition-colors ${
                          isHighlighted
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-800 dark:text-slate-100">
                          <div className="flex items-center gap-1.5">
                            {isHighlighted && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                            <span>{pickLang(lang, { en: row.en, hi: row.hi, mr: row.mr })}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 font-semibold">
                          ₹{row.mandiNetCost.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-pink-700 dark:text-pink-400 font-semibold">
                          ₹{(row.retailCost + row.marketSpoilageNuksaan).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700 dark:text-emerald-400">
                          +₹{row.totalSavedWithQuality.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl bg-emerald-700 text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <Wallet className="w-4 h-4 text-amber-300 shrink-0" />
                <span>
                  {pickLang(lang, {
                    en: `Forecast (${selectedForecast.en}): You avoid ₹${selectedForecast.marketSpoilageNuksaan.toLocaleString('en-IN')} spoiled produce + save ₹${selectedForecast.directSaved.toLocaleString('en-IN')} cash!`,
                    hi: `${selectedForecast.hi} का अनुमान: कुल ₹${selectedForecast.totalSavedWithQuality.toLocaleString('en-IN')} फायदा (₹${selectedForecast.directSaved.toLocaleString('en-IN')} कम दाम + ₹${selectedForecast.marketSpoilageNuksaan.toLocaleString('en-IN')} खराब माल से बचाव)!`,
                    hinglish: `${selectedForecast.en} Forecast: ₹${selectedForecast.totalSavedWithQuality.toLocaleString('en-IN')} kul fayda (₹${selectedForecast.directSaved.toLocaleString('en-IN')} cash + ₹${selectedForecast.marketSpoilageNuksaan.toLocaleString('en-IN')} kharaab maal bacha)!`,
                  })}
                </span>
              </div>
              {onGoToShop && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToShop();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>
                    {pickLang(lang, {
                      en: 'Join 4 AM Batch',
                      hi: '4 AM बैच में ऑर्डर करें',
                    })}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Award,
  Crown,
  Flame,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  Lock,
  CheckCircle2,
  Leaf,
  Zap,
  Gift,
  ShoppingBasket,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { pickLang } from '../utils/i18nHelper';

export interface SavingsBadgeStats {
  totalSavedRupees: number;
  totalKg: number;
  wasteAvoidedKg: number;
}

interface GamifiedSavingsBadgeCardProps {
  compact?: boolean;
  simulatorMode?: boolean;
  homeSavingsStats?: SavingsBadgeStats;
  onOpenFullForecast?: () => void;
  onClaimTierAction?: () => void;
}

interface SaverTier {
  id: 'seed' | 'smart' | 'pro' | 'champion';
  minSaved: number;
  icon: React.ComponentType<{ className?: string }>;
  title: { en: string; hi: string; hinglish: string };
  perk: { en: string; hi: string; hinglish: string };
  cardGradient: string;
  accentText: string;
  progressColor: string;
  crestBg: string;
}

const SAVER_TIERS: SaverTier[] = [
  {
    id: 'seed',
    minSaved: 0,
    icon: Leaf,
    title: {
      en: 'Seed Starter Badge',
      hi: 'सीड स्टार्टर बैज',
      hinglish: 'Seed Starter Badge',
    },
    perk: {
      en: 'Direct 4 AM APMC Vashi prices unlocked',
      hi: 'सुबह 4 AM वाशी मंडी थोक भाव अनलॉक',
      hinglish: 'Direct 4 AM APMC prices unlocked',
    },
    cardGradient: 'from-emerald-800 via-emerald-900 to-teal-950',
    accentText: 'text-emerald-300',
    progressColor: 'bg-emerald-400',
    crestBg: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200',
  },
  {
    id: 'smart',
    minSaved: 500,
    icon: Sparkles,
    title: {
      en: 'Smart Mandi Saver',
      hi: 'स्मार्ट मंडी सेवर बैज',
      hinglish: 'Smart Mandi Saver',
    },
    perk: {
      en: '₹50 Neighbor Cashback + 1 Free Spinach active',
      hi: '₹50 रेफ़रल कैशबैक + 1 मुफ़्त पालक सक्रिय',
      hinglish: '₹50 Cashback + Free Palak active',
    },
    cardGradient: 'from-sky-900 via-indigo-950 to-slate-950',
    accentText: 'text-sky-300',
    progressColor: 'bg-sky-400',
    crestBg: 'bg-sky-400/20 border-sky-300/50 text-sky-200',
  },
  {
    id: 'pro',
    minSaved: 1500,
    icon: Award,
    title: {
      en: 'Wholesale Gold Pro',
      hi: 'होलसेल गोल्ड प्रो बैज',
      hinglish: 'Wholesale Gold Pro',
    },
    perk: {
      en: 'Priority morning dispatch + 1-click recipe savings',
      hi: 'प्रायोरिटी सुबह 10 AM डिलीवरी + डिश पैक बचत',
      hinglish: 'Priority 10 AM slot + recipe deals',
    },
    cardGradient: 'from-amber-600 via-amber-700 to-emerald-900',
    accentText: 'text-amber-200',
    progressColor: 'bg-amber-400',
    crestBg: 'bg-amber-400/20 border-amber-300/60 text-amber-100',
  },
  {
    id: 'champion',
    minSaved: 4000,
    icon: Crown,
    title: {
      en: 'Society Crown Legend',
      hi: 'सोसायटी क्राउन लेजेंड',
      hinglish: 'Society Crown Legend',
    },
    perk: {
      en: 'Top-tier community wholesale shield & VIP batch rate',
      hi: 'सोसायटी में अधिकतम बचत और VIP बैच लाभ',
      hinglish: 'Max society wholesale perks unlocked',
    },
    cardGradient: 'from-emerald-700 via-teal-800 to-emerald-950',
    accentText: 'text-pink-200',
    progressColor: 'bg-pink-400',
    crestBg: 'bg-pink-400/25 border-pink-300/70 text-amber-100',
  },
];

export const GamifiedSavingsBadgeCard: React.FC<GamifiedSavingsBadgeCardProps> = ({
  compact = false,
  simulatorMode = false,
  homeSavingsStats,
  onOpenFullForecast,
  onClaimTierAction,
}) => {
  const { lang, user, orders, produceCart } = useApp();
  const [weeklyBudget, setWeeklyBudget] = useState<number>(1800);
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const [selectedInspectTier, setSelectedInspectTier] = useState<SaverTier['id'] | null>(null);

  const liveCartCount = Object.values(produceCart || {}).reduce((sum, kg) => sum + (kg > 0 ? 1 : 0), 0);
  const activeOrdersCount = (orders || []).filter((o) => !o.isSampleOrder && o.status !== 'cancelled').length;

  // In simulatorMode (pre-login landing), simulate realistic monthly & yearly savings dynamically from slider!
  const activeMetrics = useMemo(() => {
    if (simulatorMode) {
      // ~31% direct wholesale discount + ~14% avoided retail shrinkage/spoilage
      const weeklyDirectSaved = Math.round(weeklyBudget * 0.31);
      const weeklySpoilageAvoided = Math.round(weeklyBudget * 0.14);
      const monthlySaved = Math.round((weeklyDirectSaved + weeklySpoilageAvoided) * 4.33);
      const yearlySaved = monthlySaved * 12;
      const monthlyKg = Math.round((weeklyBudget / 48) * 4.33);
      return {
        primaryMetricRupees: monthlySaved,
        dailySavedRupees: Math.round(monthlySaved / 30),
        monthlySavedRupees: monthlySaved,
        yearlySavedRupees: yearlySaved,
        spoilageSavedRupees: Math.round(weeklySpoilageAvoided * 4.33),
        totalKg: monthlyKg,
        wasteAvoidedKg: Math.round(monthlyKg * 0.32 * 10) / 10,
      };
    }

    const baseSaved = homeSavingsStats?.totalSavedRupees || 0;
    const totalKg = homeSavingsStats?.totalKg || 0;
    const wasteAvoidedKg = homeSavingsStats?.wasteAvoidedKg || 0;
    const spoilageBonus = Math.round(baseSaved * 0.35);
    const cumulativeWithQuality = baseSaved + spoilageBonus;

    return {
      primaryMetricRupees: cumulativeWithQuality,
      dailySavedRupees: Math.max(baseSaved, activeOrdersCount > 0 ? Math.round(cumulativeWithQuality / Math.max(1, activeOrdersCount)) : baseSaved),
      monthlySavedRupees: Math.max(cumulativeWithQuality, Math.round(cumulativeWithQuality * 1.4)),
      yearlySavedRupees: Math.max(cumulativeWithQuality * 12, Math.round(cumulativeWithQuality * 12)),
      spoilageSavedRupees: spoilageBonus,
      totalKg,
      wasteAvoidedKg,
    };
  }, [simulatorMode, weeklyBudget, homeSavingsStats, activeOrdersCount]);

  // Determine earned tier based on activeMetrics.primaryMetricRupees
  const earnedTierIdx = useMemo(() => {
    let idx = 0;
    SAVER_TIERS.forEach((tier, i) => {
      if (activeMetrics.primaryMetricRupees >= tier.minSaved) {
        idx = i;
      }
    });
    return idx;
  }, [activeMetrics.primaryMetricRupees]);

  const currentTier = selectedInspectTier
    ? SAVER_TIERS.find((t) => t.id === selectedInspectTier) || SAVER_TIERS[earnedTierIdx]
    : SAVER_TIERS[earnedTierIdx];

  const nextTier = SAVER_TIERS[earnedTierIdx + 1] || null;
  const CurrentTierIcon = currentTier.icon;

  const progressToNextPct = useMemo(() => {
    if (!nextTier) return 100;
    const prevFloor = SAVER_TIERS[earnedTierIdx].minSaved;
    const span = Math.max(1, nextTier.minSaved - prevFloor);
    const pct = Math.round(((activeMetrics.primaryMetricRupees - prevFloor) / span) * 100);
    return Math.min(100, Math.max(6, pct));
  }, [activeMetrics.primaryMetricRupees, earnedTierIdx, nextTier]);

  const remainingForNext = nextTier
    ? Math.max(0, nextTier.minSaved - activeMetrics.primaryMetricRupees)
    : 0;

  const milestoneBadges = useMemo(() => {
    const scoreRupees = activeMetrics.primaryMetricRupees;
    return [
      {
        id: 'verified',
        icon: ShieldCheck,
        unlocked: simulatorMode ? true : user.isLoggedIn,
        label: pickLang(lang, { en: 'Verified Member', hi: 'सत्यापित सदस्य' }),
        rule: pickLang(lang, { en: 'Registered + Terms OK', hi: 'खाता व शर्तें पूर्ण' }),
      },
      {
        id: 'basket',
        icon: ShoppingBasket,
        unlocked: simulatorMode ? weeklyBudget >= 600 : liveCartCount > 0 || activeOrdersCount > 0,
        label: pickLang(lang, { en: 'First Harvest', hi: 'पहली ताज़ा टोकरी' }),
        rule: pickLang(lang, { en: 'Cart / 1st Order active', hi: 'कार्ट या ऑर्डर चालू' }),
      },
      {
        id: 'saver500',
        icon: Flame,
        unlocked: scoreRupees >= 500,
        label: pickLang(lang, { en: '₹500+ Smart Saver', hi: '₹500+ स्मार्ट बचत' }),
        rule: pickLang(lang, { en: 'Beat market markup', hi: 'बाज़ार मार्कअप की बचत' }),
      },
      {
        id: 'gold1500',
        icon: Award,
        unlocked: scoreRupees >= 1500,
        label: pickLang(lang, { en: '₹1,500 Gold Shield', hi: '₹1,500 गोल्ड शील्ड' }),
        rule: pickLang(lang, { en: 'Family budget guardian', hi: 'पारिवारिक बजट रक्षक' }),
      },
      {
        id: 'zerowaste',
        icon: Zap,
        unlocked: simulatorMode ? weeklyBudget >= 1400 : activeMetrics.wasteAvoidedKg >= 1.5,
        label: pickLang(lang, { en: 'Zero-Waste Hero', hi: 'ज़ीरो-वेस्टेज हीरो' }),
        rule: pickLang(lang, { en: 'Spoilage prevented', hi: 'खराबी व नुकसान रोका' }),
      },
      {
        id: 'neighbor',
        icon: Gift,
        unlocked: simulatorMode ? weeklyBudget >= 2400 : (user.walletBalance || 0) >= 50 || scoreRupees >= 3000,
        label: pickLang(lang, { en: 'Society Connector', hi: 'सोसायटी कनेक्टर' }),
        rule: pickLang(lang, { en: '₹50 Referral Reward', hi: '₹50 रेफ़रल कैशबैक' }),
      },
    ];
  }, [
    activeMetrics.primaryMetricRupees,
    activeMetrics.wasteAvoidedKg,
    activeOrdersCount,
    lang,
    liveCartCount,
    simulatorMode,
    user.isLoggedIn,
    user.walletBalance,
    weeklyBudget,
  ]);

  const unlockedBadgesCount = milestoneBadges.filter((b) => b.unlocked).length;

  return (
    <div className="w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      {/* Top Interactive Gamified Rank + Live Saving Card Header */}
      <div className={`bg-linear-to-br ${currentTier.cardGradient} text-white p-5 sm:p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Rank Emblem & Progress Meter */}
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border ${currentTier.crestBg} flex items-center justify-center shrink-0 shadow-inner`}
            >
              <CurrentTierIcon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span className={currentTier.accentText}>
                  {simulatorMode
                    ? pickLang(lang, {
                        en: 'LIVE BADGE & SAVINGS REWARD CARD',
                        hi: 'लाइव गेमीफाइड बचत व बैज कार्ड',
                      })
                    : pickLang(lang, {
                        en: 'YOUR SAVER BADGE RANK',
                        hi: 'आपका सक्रिय बचत बैज रैंक',
                      })}
                </span>
                <span className="text-white/40" aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-white/90">
                  {unlockedBadgesCount}/6 {pickLang(lang, { en: 'Badges Unlocked', hi: 'बैज अनलॉक' })}
                </span>
              </div>

              <h3 className="font-display font-black text-xl sm:text-2xl tracking-tight text-white leading-snug">
                {pickLang(lang, currentTier.title)}
              </h3>

              <p className="text-xs text-white/80">
                {pickLang(lang, currentTier.perk)}
              </p>

              {/* Live Animated Rank Progress Bar */}
              <div className="pt-1 max-w-md space-y-1">
                <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${currentTier.progressColor} transition-all duration-300`}
                    style={{ width: `${progressToNextPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-white/80">
                  <span>
                    {nextTier
                      ? pickLang(lang, {
                          en: `₹${remainingForNext.toLocaleString('en-IN')} away from ${nextTier.title.en}`,
                          hi: `अगले "${nextTier.title.hi}" के लिए सिर्फ़ ₹${remainingForNext.toLocaleString('en-IN')} शेष`,
                        })
                      : pickLang(lang, {
                          en: 'Maximum Society Crown Tier Reached!',
                          hi: 'शीर्ष सोसायटी क्राउन लेवल पूरा हुआ!',
                        })}
                  </span>
                  <span className="font-bold">{progressToNextPct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Badge Saving Card Ledger Metrics */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
            <div className="rounded-2xl bg-white/10 border border-white/15 px-3.5 py-2.5 text-center backdrop-blur-xs">
              <div className="text-[10px] text-white/75 font-semibold">
                {simulatorMode
                  ? pickLang(lang, { en: 'Monthly Saved', hi: 'मासिक बचत' })
                  : pickLang(lang, { en: 'Total Saved', hi: 'कुल बचत' })}
              </div>
              <div className="font-mono tabular-nums font-black text-base sm:text-lg text-amber-300 mt-0.5">
                ₹{activeMetrics.primaryMetricRupees.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/15 px-3.5 py-2.5 text-center backdrop-blur-xs">
              <div className="text-[10px] text-white/75 font-semibold">
                {pickLang(lang, { en: 'Yearly Est.', hi: 'सालाना बचत' })}
              </div>
              <div className="font-mono tabular-nums font-black text-base sm:text-lg text-emerald-300 mt-0.5">
                ₹{activeMetrics.yearlySavedRupees.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/15 px-3.5 py-2.5 text-center backdrop-blur-xs">
              <div className="text-[10px] text-white/75 font-semibold">
                {pickLang(lang, { en: 'Fresh Weight', hi: 'ताज़ा बचत' })}
              </div>
              <div className="font-mono tabular-nums font-black text-base sm:text-lg text-white mt-0.5">
                {activeMetrics.wasteAvoidedKg} kg
              </div>
            </div>
          </div>
        </div>

        {/* Tier Selector Strip + Expand Control */}
        <div className="mt-4 pt-3.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {SAVER_TIERS.map((tier, idx) => {
              const Icon = tier.icon;
              const isUnlocked = idx <= earnedTierIdx;
              const isActiveView = currentTier.id === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedInspectTier(tier.id === selectedInspectTier ? null : tier.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActiveView
                      ? 'bg-white text-slate-950 shadow-xs'
                      : isUnlocked
                      ? 'bg-white/15 text-white hover:bg-white/25'
                      : 'bg-black/25 text-white/55 hover:bg-black/35'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{pickLang(lang, tier.title).replace(' Badge', '').replace(' बैज', '')}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {onOpenFullForecast && (
              <button
                type="button"
                onClick={onOpenFullForecast}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{pickLang(lang, { en: 'Full Forecast', hi: 'पूरा हिसाब देखें' })}</span>
              </button>
            )}

            {compact && (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>
                  {isExpanded
                    ? pickLang(lang, { en: 'Hide Badges', hi: 'बैज छुपाएं' })
                    : pickLang(lang, { en: 'View 6 Badges', hi: 'सभी 6 बैज देखें' })}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Body: Simulator Slider (on Landing) + 6 Collectible Gamified Badges Grid */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-5 bg-slate-50/70 dark:bg-slate-900/70">
          {simulatorMode && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {pickLang(lang, {
                      en: 'INTERACTIVE BADGE SAVINGS SIMULATOR',
                      hi: 'इंटरैक्टिव बचत व बैज कैलकुलेटर',
                    })}
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {pickLang(lang, {
                      en: 'Slide your weekly family spend on vegetables, fruits & daily items:',
                      hi: 'अपने घर की साप्ताहिक सब्ज़ी व फल खरीद स्लाइड करके तुरंत बचत और बैज अनलॉक देखें:',
                    })}
                  </div>
                </div>
                <div className="font-mono tabular-nums text-lg font-black text-slate-950 dark:text-white shrink-0">
                  ₹{weeklyBudget.toLocaleString('en-IN')} / wk
                </div>
              </div>

              <input
                type="range"
                min={400}
                max={4000}
                step={100}
                value={weeklyBudget}
                onChange={(e) => {
                  setWeeklyBudget(Number(e.target.value));
                  setSelectedInspectTier(null);
                }}
                aria-label="Weekly household produce budget"
                className="w-full accent-emerald-700 cursor-pointer h-2"
              />

              <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                <span>₹400/wk (1-2 Members)</span>
                <span>₹1,800/wk (Family of 4)</span>
                <span>₹4,000/wk (Joint Family)</span>
              </div>
            </div>
          )}

          {/* 6 Collectible Milestone Badges */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {pickLang(lang, {
                  en: 'Collectible Saver Milestone Badges',
                  hi: 'कलेक्टिबल सेवर माइलस्टोन बैज (6 उपलब्धियां)',
                })}
              </span>
              <span className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                {unlockedBadgesCount} / {milestoneBadges.length} Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {milestoneBadges.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.id}
                    className={`rounded-2xl p-3 border text-center transition-all flex flex-col items-center justify-between gap-2 ${
                      b.unlocked
                        ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 shadow-2xs'
                        : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        b.unlocked
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {b.unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[11.5px] font-bold text-slate-900 dark:text-white leading-tight">
                        {b.label}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        {b.rule}
                      </div>
                    </div>

                    <div className="text-[10px] font-bold">
                      {b.unlocked ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{pickLang(lang, { en: 'Unlocked', hi: 'अनलॉक' })}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          {pickLang(lang, { en: 'Locked', hi: 'लॉक है' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {onClaimTierAction && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                {pickLang(lang, {
                  en: `Create your account now to start tracking ₹${activeMetrics.monthlySavedRupees.toLocaleString('en-IN')}/mo estimated savings & unlock all 6 badges.`,
                  hi: `अपना खाता बनाकर हर महीने अनुमानित ₹${activeMetrics.monthlySavedRupees.toLocaleString('en-IN')} की बचत व सभी 6 बैज तुरंत चालू करें।`,
                })}
              </div>
              <button
                type="button"
                onClick={onClaimTierAction}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <span>
                  {pickLang(lang, {
                    en: 'Claim Savings Badge & Sign Up',
                    hi: 'यह बैज व बचत क्लेम करें →',
                  })}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GamifiedSavingsBadgeCard;

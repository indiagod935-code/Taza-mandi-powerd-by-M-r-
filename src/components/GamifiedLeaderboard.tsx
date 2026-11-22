import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { pickLang } from '../utils/i18nHelper';
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Sparkles,
  Users,
  ShoppingBag,
  Share2,
  RefreshCw,
  ArrowRight,
  Scale,
  TrendingUp,
  Leaf,
} from 'lucide-react';

export type LeaderboardSortKey = 'xp' | 'saved' | 'kg';

export interface LeaderboardMemberRow {
  rank: number;
  userId: string;
  displayName: string;
  areaLabel: string;
  ordersCount: number;
  totalKg: number;
  totalSpent: number;
  totalSavedRupees: number;
  referralsCount: number;
  badgesUnlocked: number;
  tierId: 'starter' | 'smart' | 'pro' | 'champion';
  xpPoints: number;
  joinedAt: string;
  isCurrentUser: boolean;
}

interface LeaderboardSummary {
  totalMembers: number;
  totalCommunitySavedRupees: number;
  totalCommunityKg: number;
  totalVerifiedOrders: number;
}

interface GamifiedLeaderboardProps {
  previewMode?: boolean;
  homeSavingsStats?: {
    totalSavedRupees: number;
    totalKg: number;
    wasteAvoidedKg: number;
  };
  onOpenShop?: () => void;
  onOpenAuth?: () => void;
  onOpenReferral?: () => void;
}

const TIER_META: Record<
  LeaderboardMemberRow['tierId'],
  { labelEn: string; labelHi: string; colorClass: string }
> = {
  starter: {
    labelEn: 'Seed Starter',
    labelHi: 'सीड स्टार्टर',
    colorClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  smart: {
    labelEn: 'Smart Mandi Saver',
    labelHi: 'स्मार्ट मंडी सेवर',
    colorClass: 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  pro: {
    labelEn: 'Wholesale Gold Pro',
    labelHi: 'थोक गोल्ड प्रो',
    colorClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  champion: {
    labelEn: 'Society Crown Legend',
    labelHi: 'सोसायटी क्राउन लीजेंड',
    colorClass: 'bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  },
};

function resolveTier(savedRupees: number): LeaderboardMemberRow['tierId'] {
  if (savedRupees >= 5000) return 'champion';
  if (savedRupees >= 2000) return 'pro';
  if (savedRupees >= 500) return 'smart';
  return 'starter';
}

export const GamifiedLeaderboard: React.FC<GamifiedLeaderboardProps> = ({
  previewMode = false,
  homeSavingsStats,
  onOpenShop,
  onOpenAuth,
  onOpenReferral,
}) => {
  const { lang, user, orders } = useApp();
  const [sortBy, setSortBy] = useState<LeaderboardSortKey>('xp');
  const [entries, setEntries] = useState<LeaderboardMemberRow[]>([]);
  const [summary, setSummary] = useState<LeaderboardSummary>({
    totalMembers: 0,
    totalCommunitySavedRupees: 0,
    totalCommunityKg: 0,
    totalVerifiedOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async (activeSort: LeaderboardSortKey) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?sortBy=${activeSort}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.entries)) {
        setEntries(data.entries);
        if (data.summary) setSummary(data.summary);
      }
    } catch {
      // Keep cleanly degraded empty array without fake placeholders
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(sortBy);
  }, [sortBy, orders.length]);

  const currentUserLiveStats = useMemo<LeaderboardMemberRow | null>(() => {
    if (!user.isLoggedIn) return null;
    const savedRupees = Math.round(homeSavingsStats?.totalSavedRupees || 0);
    const totalKg = Math.round((homeSavingsStats?.totalKg || 0) * 10) / 10;
    const realOrders = orders.filter((o) => !o.isSampleOrder && o.status !== 'cancelled').length;
    const xpPoints = Math.round(savedRupees * 0.5 + totalKg * 25 + realOrders * 120);
    const tierId = resolveTier(savedRupees);
    let badges = 0;
    if (realOrders >= 1 || totalKg > 0) badges += 1;
    if (savedRupees >= 500) badges += 1;
    if (totalKg >= 10) badges += 1;
    if (savedRupees >= 2000) badges += 1;
    if (savedRupees >= 5000) badges += 1;

    return {
      rank: 0,
      userId: user.id,
      displayName: `${user.name.split(' ')[0] || 'You'} (${pickLang(lang, { en: 'You', hi: 'आप' })})`,
      areaLabel: user.society || 'Local Society',
      ordersCount: realOrders,
      totalKg,
      totalSpent: 0,
      totalSavedRupees: savedRupees,
      referralsCount: 0,
      badgesUnlocked: badges,
      tierId,
      xpPoints,
      joinedAt: new Date().toISOString(),
      isCurrentUser: true,
    };
  }, [user, homeSavingsStats, orders, lang]);

  // Merge real server leaderboard with active logged-in user's latest live calculation
  const mergedEntries = useMemo(() => {
    const cloned = entries.map((e) => ({
      ...e,
      isCurrentUser: user.isLoggedIn && (e.userId === user.id || e.displayName.startsWith(user.name.split(' ')[0])),
    }));

    if (currentUserLiveStats) {
      const idx = cloned.findIndex((c) => c.userId === user.id);
      if (idx >= 0) {
        const existing = cloned[idx];
        cloned[idx] = {
          ...existing,
          isCurrentUser: true,
          totalSavedRupees: Math.max(existing.totalSavedRupees, currentUserLiveStats.totalSavedRupees),
          totalKg: Math.max(existing.totalKg, currentUserLiveStats.totalKg),
          ordersCount: Math.max(existing.ordersCount, currentUserLiveStats.ordersCount),
          xpPoints: Math.max(existing.xpPoints, currentUserLiveStats.xpPoints),
          badgesUnlocked: Math.max(existing.badgesUnlocked, currentUserLiveStats.badgesUnlocked),
          tierId: resolveTier(Math.max(existing.totalSavedRupees, currentUserLiveStats.totalSavedRupees)),
        };
      } else {
        cloned.push({ ...currentUserLiveStats, rank: cloned.length + 1 });
      }
    }

    cloned.sort((a, b) => {
      if (sortBy === 'saved') return b.totalSavedRupees - a.totalSavedRupees || b.xpPoints - a.xpPoints;
      if (sortBy === 'kg') return b.totalKg - a.totalKg || b.xpPoints - a.xpPoints;
      return b.xpPoints - a.xpPoints || b.totalSavedRupees - a.totalSavedRupees;
    });

    return cloned.map((item, i) => ({ ...item, rank: i + 1 }));
  }, [entries, currentUserLiveStats, user.isLoggedIn, user.id, user.name, sortBy]);

  const topThree = mergedEntries.slice(0, 3);
  const myEntry = mergedEntries.find((m) => m.isCurrentUser) || currentUserLiveStats;
  const nextRankTarget =
    myEntry && myEntry.rank > 1 ? mergedEntries[myEntry.rank - 2] : undefined;
  const xpGapToNextRank =
    nextRankTarget && myEntry ? Math.max(10, nextRankTarget.xpPoints - myEntry.xpPoints) : 0;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>
                {pickLang(lang, {
                  en: 'LIVE SOCIETY SAVER LEADERBOARD',
                  hi: 'लाइव सोसायटी बचत लीडरबोर्ड',
                  mr: 'थेट सोसायटी बचत लीडरबोर्ड',
                })}
              </span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-950 dark:text-white tracking-tight">
              {pickLang(lang, {
                en: 'Community Wholesale Saver Rankings',
                hi: 'सोसायटी के टॉप होलसेल सेवर्स व XP रैंकिंग',
                mr: 'सोसायटीचे टॉप होलसेल सेव्हर्स रँकिंग',
              })}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
              {pickLang(lang, {
                en: 'Real rankings computed strictly from verified APMC wholesale savings, fresh produce kg, completed orders, and referrals. Zero fake profiles.',
                hi: 'सत्यापित मंडी बचत (₹), ताज़ी सब्ज़ी वज़न (kg), ऑर्डर्स और रेफ़रल पॉइंट्स पर आधारित असली रैंकिंग।',
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              {([
                { id: 'xp', label: pickLang(lang, { en: 'Top XP', hi: 'टॉप XP' }) },
                { id: 'saved', label: pickLang(lang, { en: 'Most Saved', hi: 'ज़्यादा बचत' }) },
                { id: 'kg', label: pickLang(lang, { en: 'Most kg', hi: 'वज़न (kg)' }) },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSortBy(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    sortBy === tab.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => fetchLeaderboard(sortBy)}
              aria-label="Refresh Leaderboard"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Community Real Aggregate Strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/35 border border-emerald-200/80 dark:border-emerald-800/60">
            <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
              {pickLang(lang, { en: 'Verified Savers', hi: 'पंजीकृत सदस्य' })}
            </div>
            <div className="text-xl font-black font-mono-nums text-emerald-700 dark:text-emerald-400 mt-0.5">
              {Math.max(summary.totalMembers, mergedEntries.length)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-pink-50/80 dark:bg-pink-950/30 border border-pink-200/80 dark:border-pink-800/60">
            <div className="text-[11px] font-semibold text-pink-800 dark:text-pink-300">
              {pickLang(lang, { en: 'Community Saved', hi: 'सामूहिक कुल बचत' })}
            </div>
            <div className="text-xl font-black font-mono-nums text-pink-700 dark:text-pink-300 mt-0.5">
              ₹{summary.totalCommunitySavedRupees.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
            <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
              {pickLang(lang, { en: 'Fresh Produce Pooled', hi: 'ताज़ा मंडी वज़न' })}
            </div>
            <div className="text-xl font-black font-mono-nums text-amber-700 dark:text-amber-300 mt-0.5">
              {summary.totalCommunityKg} kg
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {pickLang(lang, { en: 'Verified Batch Orders', hi: 'सत्यापित ऑर्डर्स' })}
            </div>
            <div className="text-xl font-black font-mono-nums text-slate-900 dark:text-white mt-0.5">
              {summary.totalVerifiedOrders}
            </div>
          </div>
        </div>
      </div>

      {/* Logged-in User's Live Rank Spotlight OR Welcome Sign-up Callout */}
      {myEntry ? (
        <div className="rounded-3xl bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex flex-col items-center justify-center shrink-0 font-mono-nums">
              <span className="text-[10px] uppercase tracking-wider text-emerald-200">Rank</span>
              <span className="text-2xl font-black leading-none">#{myEntry.rank}</span>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-black text-base">{user.name}</span>
                <span className="text-pink-200 font-bold">· {myEntry.xpPoints.toLocaleString('en-IN')} XP</span>
                <span className="text-emerald-200">· {myEntry.badgesUnlocked}/6 Badges</span>
              </div>
              <p className="text-xs text-emerald-100/90">
                {myEntry.rank === 1
                  ? pickLang(lang, {
                      en: 'You lead the community board! Keep inviting neighbors (+200 XP each) to hold your #1 crown.',
                      hi: 'आप अभी #1 पर हैं! अपनी बढ़त बनाए रखने के लिए पड़ोसियों को शेयर करें (+200 XP प्रति रेफ़रल)।',
                    })
                  : nextRankTarget
                  ? pickLang(lang, {
                      en: `You need just ${xpGapToNextRank} XP (≈ ₹${xpGapToNextRank * 2} batch saving or 1 referral) to pass Rank #${nextRankTarget.rank}.`,
                      hi: `अगली रैंक (#${nextRankTarget.rank}) पर जाने के लिए बस ${xpGapToNextRank} XP की दूरी बाकी है।`,
                    })
                  : pickLang(lang, {
                      en: 'Earn +120 XP per batch order, +25 XP per kg, and +200 XP per verified referral!',
                      hi: 'हर ऑर्डर पर +120 XP, हर किलो पर +25 XP और हर रेफ़रल पर +200 XP जीतें!',
                    })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenShop && (
              <button
                type="button"
                onClick={onOpenShop}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{pickLang(lang, { en: 'Shop & Earn XP', hi: 'ऑर्डर से XP बढ़ाएं' })}</span>
              </button>
            )}
            {onOpenReferral && (
              <button
                type="button"
                onClick={onOpenReferral}
                className="px-4 py-2 rounded-xl bg-pink-500/25 hover:bg-pink-500/35 border border-pink-300/40 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{pickLang(lang, { en: '+200 XP Invite', hi: '+200 XP रेफ़रल' })}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-pink-50 dark:bg-pink-950/25 border border-pink-200 dark:border-pink-800/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-950 dark:text-white">
                {pickLang(lang, {
                  en: 'Claim Your Spot on the Community Leaderboard',
                  hi: 'लीडरबोर्ड पर अपनी रैंक बनाने के लिए खाता बनाएं',
                })}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {pickLang(lang, {
                  en: 'Sign up with Mobile No. or Gmail — your wholesale orders and referrals automatically rank you among neighbors.',
                  hi: 'साइन अप करते ही आपके हर ऑर्डर व रेफ़रल के पॉइंट्स लाइव जुड़ने लगेंगे।',
                })}
              </p>
            </div>
          </div>
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>{pickLang(lang, { en: 'Join Now', hi: 'अभी जुड़ें' })}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Top 3 Podium OR Real Empty Season Invite */}
      {mergedEntries.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-display font-black text-lg text-slate-950 dark:text-white">
              {pickLang(lang, {
                en: 'New Batch Season Is Open — Be #1 Today!',
                hi: 'नया बैच सीज़न शुरू — आज #1 टॉपर बनें!',
              })}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {pickLang(lang, {
                en: 'No dummy entries are shown here. Place the first morning APMC order or refer a society neighbor to claim the Gold Crown #1 slot.',
                hi: 'यहाँ केवल असली पंजीकृत ग्राहकों की रैंकिंग दिखती है। अपना पहला ऑर्डर दर्ज कर गोल्ड क्राउन #1 हासिल करें।',
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {onOpenShop && (
              <button
                type="button"
                onClick={onOpenShop}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Leaf className="w-4 h-4" />
                <span>{pickLang(lang, { en: 'Place First Order', hi: 'पहला ऑर्डर करें' })}</span>
              </button>
            )}
            {previewMode && onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>{pickLang(lang, { en: 'Register & Claim #1', hi: 'रजिस्टर कर #1 बनें' })}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map((member, index) => {
              const tier = TIER_META[member.tierId];
              const podiumStyle =
                index === 0
                  ? 'border-amber-300 dark:border-amber-700 bg-linear-to-b from-amber-50/90 to-white dark:from-amber-950/35 dark:to-slate-900 shadow-sm'
                  : index === 1
                  ? 'border-emerald-300 dark:border-emerald-800 bg-linear-to-b from-emerald-50/80 to-white dark:from-emerald-950/35 dark:to-slate-900'
                  : 'border-pink-200 dark:border-pink-800/70 bg-linear-to-b from-pink-50/80 to-white dark:from-pink-950/25 dark:to-slate-900';

              const RankIcon = index === 0 ? Crown : index === 1 ? Medal : Award;
              const iconTone =
                index === 0
                  ? 'bg-amber-400 text-slate-950'
                  : index === 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-pink-500 text-white';

              return (
                <div
                  key={member.userId + member.displayName}
                  className={`rounded-2xl border p-5 flex flex-col justify-between gap-3 ${podiumStyle} ${
                    member.isCurrentUser ? 'ring-2 ring-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${iconTone}`}>
                        <RankIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Rank #{member.rank}
                        </div>
                        <div className="font-bold text-slate-950 dark:text-white text-sm truncate">
                          {member.displayName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {member.areaLabel}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono-nums shrink-0">
                      <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                        {member.xpPoints.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">XP</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-lg border text-[10.5px] font-bold ${tier.colorClass}`}>
                      {lang === 'hi' ? tier.labelHi : tier.labelEn}
                    </span>
                    <span className="font-mono-nums font-bold text-slate-700 dark:text-slate-300">
                      ₹{member.totalSavedRupees.toLocaleString('en-IN')} saved · {member.totalKg} kg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Real Members Ranking Table */}
          {!previewMode && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>
                    {pickLang(lang, {
                      en: 'Live Community Member Standings',
                      hi: 'सभी सत्यापित सदस्यों की लाइव तालिका',
                    })}
                  </span>
                </span>
                <span className="text-slate-400 font-mono-nums">
                  {mergedEntries.length} {pickLang(lang, { en: 'members', hi: 'सदस्य' })}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-4 font-bold">Rank</th>
                      <th className="py-2.5 px-4 font-bold">Member & Society</th>
                      <th className="py-2.5 px-4 font-bold">Tier & Badges</th>
                      <th className="py-2.5 px-4 font-bold text-right">Orders / kg</th>
                      <th className="py-2.5 px-4 font-bold text-right">Est. Saved</th>
                      <th className="py-2.5 px-4 font-bold text-right">XP Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {mergedEntries.map((row) => {
                      const tier = TIER_META[row.tierId];
                      return (
                        <tr
                          key={row.userId + row.rank}
                          className={`transition-colors ${
                            row.isCurrentUser
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 font-semibold'
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono-nums font-black text-slate-900 dark:text-white">
                            #{row.rank}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{row.displayName}</span>
                              {row.isCurrentUser && (
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                  · Active
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {row.areaLabel}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-md border text-[10.5px] font-bold ${tier.colorClass}`}>
                                {lang === 'hi' ? tier.labelHi : tier.labelEn}
                              </span>
                              <span className="text-[11px] font-mono-nums text-slate-500">
                                {row.badgesUnlocked}/6
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono-nums text-slate-700 dark:text-slate-300">
                            {row.ordersCount} · {row.totalKg} kg
                          </td>
                          <td className="py-3 px-4 text-right font-mono-nums font-bold text-emerald-700 dark:text-emerald-400">
                            ₹{row.totalSavedRupees.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono-nums font-black text-slate-950 dark:text-white">
                            {row.xpPoints.toLocaleString('en-IN')} XP
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* How XP & Saver Tiers Work */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white">+120 XP per Order · 0.5x per ₹ Saved</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Every morning 4 AM mandi batch unlocks bonus XP from price & spoilage savings.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white">+25 XP per kg Zero-Waste Produce</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Heavier shared wholesale crates multiply family eco-impact and XP climb.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white">+200 XP + ₹50 Wallet per Referral</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Verified neighbor orders boost your rank fastest and unlock Society Connector badge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

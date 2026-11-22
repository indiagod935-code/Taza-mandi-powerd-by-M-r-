import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Crown,
  Gift,
  RefreshCw,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  CheckCircle2,
  Ticket,
  Wallet,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyticsApi, rewardsApi } from '../api/endpoints';
import {
  BuyerAnalyticsEntry,
  BuyerAnalyticsPeriod,
  BuyerPeriodMetrics,
  CustomerRewardRecord,
  CustomerRewardType,
} from '../types';
import { pickLang } from '../utils/i18nHelper';

const PERIOD_TABS: { id: BuyerAnalyticsPeriod; en: string; hi: string; mr: string }[] = [
  { id: 'daily', en: 'Daily (24h)', hi: 'दैनिक (आज)', mr: 'दैनिक' },
  { id: 'weekly', en: 'Weekly (7d)', hi: 'साप्ताहिक', mr: 'साप्ताहिक' },
  { id: 'monthly', en: 'Monthly (30d)', hi: 'मासिक', mr: 'मासिक' },
  { id: 'yearly', en: 'Yearly (1y)', hi: 'वार्षिक', mr: 'वार्षिक' },
  { id: 'all', en: 'All Time', hi: 'कुल रिकॉर्ड', mr: 'एकूण' },
];

export const AdminBuyersAnalyticsTab: React.FC = () => {
  const { lang, orders, produceList, accessoriesList } = useApp();

  const [period, setPeriod] = useState<BuyerAnalyticsPeriod>('all');
  const [top10, setTop10] = useState<BuyerAnalyticsEntry[]>([]);
  const [remainingHistory, setRemainingHistory] = useState<BuyerAnalyticsEntry[]>([]);
  const [summary, setSummary] = useState<BuyerPeriodMetrics>({
    totalSpent: 0,
    totalKg: 0,
    orderCount: 0,
    customerSaved: 0,
    adminProfit: 0,
  });
  const [grantedRewards, setGrantedRewards] = useState<CustomerRewardRecord[]>([]);
  const [totalBuyers, setTotalBuyers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showMoreHistory, setShowMoreHistory] = useState(false);

  // Reward Modal & AI Composer State
  const [rewardTargetBuyer, setRewardTargetBuyer] = useState<BuyerAnalyticsEntry | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiDesigning, setIsAiDesigning] = useState(false);
  const [aiReplyToast, setAiReplyToast] = useState('');
  const [rewardType, setRewardType] = useState<CustomerRewardType>('coupon');
  const [couponCode, setCouponCode] = useState('MARCO50');
  const [discountRupees, setDiscountRupees] = useState(50);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [minOrderRupees, setMinOrderRupees] = useState(0);
  const [freeGiftItem, setFreeGiftItem] = useState('');
  const [rewardTitle, setRewardTitle] = useState('MARCO 💯 Special Buyer Discount');
  const [rewardMessage, setRewardMessage] = useState('');
  const [isGranting, setIsGranting] = useState(false);
  const [grantSuccessToast, setGrantSuccessToast] = useState('');

  const catalogCostMaps = useMemo(() => {
    const produceCosts: Record<string, { wholesale?: number; market?: number }> = {};
    produceList.forEach((p) => {
      produceCosts[p.id] = {
        wholesale: p.wholesalePricePerKg,
        market: p.localMarketPricePerKg,
      };
    });
    const accessoryCosts: Record<string, { wholesale?: number; mrp?: number }> = {};
    accessoriesList.forEach((a) => {
      accessoryCosts[a.id] = {
        wholesale: a.wholesaleCost,
        mrp: a.mrp,
      };
    });
    return { produceCosts, accessoryCosts };
  }, [produceList, accessoriesList]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const cleanClientOrders = orders.filter((o) => !o.isSampleOrder && o.status !== 'cancelled');
      const res = await analyticsApi.getAdminBuyerAnalytics({
        period,
        extraOrders: cleanClientOrders,
        catalogProduceCosts: catalogCostMaps.produceCosts,
        catalogAccessoryCosts: catalogCostMaps.accessoryCosts,
      });
      if (res?.success) {
        setTop10(res.top10 || []);
        setRemainingHistory(res.remainingHistory || []);
        setSummary(
          res.summary || {
            totalSpent: 0,
            totalKg: 0,
            orderCount: 0,
            customerSaved: 0,
            adminProfit: 0,
          }
        );
        setTotalBuyers(res.totalBuyers || 0);
        setGrantedRewards(res.grantedRewards || []);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load buyer analytics');
    } finally {
      setIsLoading(false);
    }
  }, [period, orders, catalogCostMaps]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const openRewardModal = (buyer: BuyerAnalyticsEntry) => {
    setRewardTargetBuyer(buyer);
    setAiPrompt('');
    setAiReplyToast('');
    setRewardType('coupon');
    setCouponCode(`VIP${buyer.rank <= 3 ? 100 : 50}`);
    setDiscountRupees(buyer.rank <= 3 ? 100 : 50);
    setDiscountPercent(0);
    setMinOrderRupees(0);
    setFreeGiftItem('');
    setRewardTitle(`Special Reward for ${buyer.firstName}`);
    setRewardMessage(
      `नमस्ते ${buyer.name}! ताज़ाMandi से नियमित खरीदारी के लिए आपकी यह खास छूट व तोहफा अनलॉक हुआ है।`
    );
  };

  const handleDesignWithAi = async () => {
    if (!rewardTargetBuyer || !aiPrompt.trim()) return;
    setIsAiDesigning(true);
    setAiReplyToast('');
    try {
      const metrics = rewardTargetBuyer[period];
      const res = await rewardsApi.designWithAi({
        prompt: aiPrompt.trim(),
        buyerName: rewardTargetBuyer.name,
        totalSpent: metrics.totalSpent,
        orderCount: metrics.orderCount,
        customerSaved: metrics.customerSaved,
        adminProfit: metrics.adminProfit,
      });
      if (res?.success && res.draft) {
        setRewardType(res.draft.rewardType);
        setCouponCode(res.draft.couponCode);
        setDiscountRupees(res.draft.discountRupees);
        setDiscountPercent(res.draft.discountPercent);
        setMinOrderRupees(res.draft.minOrderRupees);
        setFreeGiftItem(res.draft.freeGiftItem || '');
        setRewardTitle(res.draft.title);
        setRewardMessage(res.draft.messageToCustomer);
        setAiReplyToast(res.reply);
      }
    } catch (err: any) {
      setAiReplyToast(err?.message || 'AI draft generation failed. Please edit manually.');
    } finally {
      setIsAiDesigning(false);
    }
  };

  const handleGrantReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardTargetBuyer) return;
    setIsGranting(true);
    try {
      const res = await rewardsApi.grantReward({
        targetUserId: rewardTargetBuyer.userId,
        targetPhone: rewardTargetBuyer.phone,
        targetName: rewardTargetBuyer.name,
        rewardType,
        couponCode,
        discountRupees,
        discountPercent,
        minOrderRupees,
        freeGiftItem: freeGiftItem.trim() || undefined,
        title: rewardTitle.trim() || `VIP Reward for ${rewardTargetBuyer.firstName}`,
        messageToCustomer:
          rewardMessage.trim() || `Thank you for shopping fresh with MARCO 💯!`,
        aiPromptUsed: aiPrompt.trim() || undefined,
      });
      if (res?.success) {
        setGrantSuccessToast(
          pickLang(lang, {
            en: `Reward ${res.reward.couponCode} delivered to ${rewardTargetBuyer.name}!`,
            hi: `✓ ${rewardTargetBuyer.name} को रिवॉर्ड (${res.reward.couponCode}) भेज दिया गया!`,
            mr: `✓ ${rewardTargetBuyer.name} यांना रिवॉर्ड पाठवले!`,
            hinglish: `✓ ${rewardTargetBuyer.name} ko reward (${res.reward.couponCode}) bhej diya gaya!`,
          })
        );
        setTimeout(() => setGrantSuccessToast(''), 5000);
        setRewardTargetBuyer(null);
        await loadAnalytics();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send reward');
    } finally {
      setIsGranting(false);
    }
  };

  const maxChartSpent = Math.max(1, ...top10.map((b) => b[period].totalSpent));

  return (
    <div className="space-y-6">
      {/* Header & Period Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>
                {pickLang(lang, {
                  en: 'Admin Private Buyer Intelligence · Top 10 & Profit',
                  hi: 'एडमिन प्राइवेट खरीदार रिपोर्ट · टॉप 10 व मुनाफा',
                  mr: 'अ‍ॅडमिन खरेदीदार अहवाल · टॉप १० व नफा',
                  hinglish: 'Admin Private Buyers Chart · Top 10 & Profit',
                })}
              </span>
            </div>
            <h2 className="text-xl font-display font-black text-slate-900 dark:text-slate-100 mt-1">
              {pickLang(lang, {
                en: 'Top 10 Buyers, Daily-Yearly Volume, Profit & AI Discounts',
                hi: 'टॉप 10 खरीदार चार्ट, दैनिक–वार्षिक खरीद, प्रॉफिट और AI छूट/गिफ्ट',
                mr: 'टॉप १० खरेदीदार, नफा व AI बक्षिसे',
                hinglish: 'Top 10 Buyers Chart, Daily-Yearly Profit & AI Rewards',
              })}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {pickLang(lang, {
                en: 'Track who orders regularly, how much each customer saved, your net wholesale profit, and send direct coupons or surprise gifts via AI.',
                hi: 'देखें कौन सबसे ज्यादा खरीद रहा है, ग्राहक की कुल बचत और आपका नेट प्रॉफिट कितना हुआ — यहीं से AI या मैन्युअल छूट/सरप्राइज गिफ्ट भेजें।',
                hinglish: 'Dekhein kaun top buyer hai, kitni bachat + profit hua, aur AI se direct discount ya surprise gift bhejein.',
              })}
            </p>
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 self-start cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{pickLang(lang, { en: 'Refresh Data', hi: 'रिफ्रेश करें', hinglish: 'Refresh' })}</span>
          </button>
        </div>

        {/* Time Window Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {PERIOD_TABS.map((tab) => {
            const active = period === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriod(tab.id)}
                className={`flex-1 min-w-[96px] py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-700'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 opacity-80" />
                <span>{pickLang(lang, { en: tab.en, hi: tab.hi, mr: tab.mr, hinglish: tab.en })}</span>
              </button>
            );
          })}
        </div>

        {grantSuccessToast && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{grantSuccessToast}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* Summary KPI Strip for Selected Window */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {pickLang(lang, { en: 'Total Sales Value', hi: 'कुल बिक्री राशि', hinglish: 'Total Sales' })}
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono-nums mt-0.5">
              ₹{summary.totalSpent.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
              {summary.orderCount} orders · {totalBuyers} buyers
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {pickLang(lang, { en: 'Fresh Volume Sold', hi: 'कुल सब्ज़ी-फल वजन', hinglish: 'Total Weight' })}
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono-nums mt-0.5">
              {summary.totalKg} <span className="text-xs font-bold">kg</span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
              Direct APMC Sourcing
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/70">
            <div className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">
              {pickLang(lang, { en: 'Total Customer Saved', hi: 'ग्राहकों की कुल बचत', hinglish: 'Customer Savings' })}
            </div>
            <div className="text-xl font-black text-teal-800 dark:text-teal-200 font-mono-nums mt-0.5">
              ₹{summary.customerSaved.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-teal-700/80 dark:text-teal-300/80 mt-0.5">
              vs retail rates
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70">
            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              {pickLang(lang, { en: 'Admin Net Profit', hi: 'एडमिन नेट प्रॉफिट (मुनाफा)', hinglish: 'Admin Net Profit' })}
            </div>
            <div className="text-xl font-black text-emerald-800 dark:text-emerald-200 font-mono-nums mt-0.5">
              ₹{summary.adminProfit.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>
                {summary.totalSpent > 0
                  ? `${Math.round((summary.adminProfit / summary.totalSpent) * 100)}% net margin`
                  : 'After wholesale cost'}
              </span>
            </div>
          </div>
        </div>

        {/* Period Comparison Visual Bar Chart (Daily / Weekly / Monthly / Yearly) */}
        {(() => {
          const allTracked = [...top10, ...remainingHistory];
          const periodBars = (['daily', 'weekly', 'monthly', 'yearly'] as const).map((pKey) => {
            const meta = PERIOD_TABS.find((t) => t.id === pKey)!;
            const sales = allTracked.reduce((s, b) => s + (b[pKey]?.totalSpent || 0), 0);
            const saved = allTracked.reduce((s, b) => s + (b[pKey]?.customerSaved || 0), 0);
            const profit = allTracked.reduce((s, b) => s + (b[pKey]?.adminProfit || 0), 0);
            return { id: pKey, meta, sales, saved, profit };
          });
          const maxPeriodBar = Math.max(1, ...periodBars.map((p) => p.sales));
          const top3SharePct =
            summary.totalSpent > 0
              ? Math.min(
                  100,
                  Math.round(
                    (top10.slice(0, 3).reduce((s, b) => s + (b[period]?.totalSpent || 0), 0) /
                      summary.totalSpent) *
                      100
                  )
                )
              : 0;

          return (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {pickLang(lang, {
                      en: 'Sales, Customer Savings & Profit Comparison Chart',
                      hi: 'बिक्री, ग्राहक बचत और एडमिन मुनाफा तुलना चार्ट (दैनिक–वार्षिक)',
                      hinglish: 'Sales, Savings & Profit Comparison Chart (Daily–Yearly)',
                    })}
                  </span>
                </span>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                  {pickLang(lang, {
                    en: `Top-3 Buyers Share: ${top3SharePct}%`,
                    hi: `टॉप-3 खरीदार हिस्सेदारी: ${top3SharePct}%`,
                    hinglish: `Top-3 Buyers Share: ${top3SharePct}%`,
                  })}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {periodBars.map((pb) => {
                  const sH = Math.max(12, Math.round((pb.sales / maxPeriodBar) * 100));
                  const svH = Math.max(8, Math.round((pb.saved / maxPeriodBar) * 100));
                  const pH = Math.max(8, Math.round((pb.profit / maxPeriodBar) * 100));
                  const isActive = period === pb.id;
                  return (
                    <button
                      key={pb.id}
                      type="button"
                      onClick={() => setPeriod(pb.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/70 hover:border-emerald-300'
                      }`}
                    >
                      <div className="text-[11px] font-black text-slate-800 dark:text-slate-100">
                        {pickLang(lang, { en: pb.meta.en, hi: pb.meta.hi, mr: pb.meta.mr })}
                      </div>
                      <div className="h-20 flex items-end justify-center gap-2 pt-2 border-b border-slate-200 dark:border-slate-700 my-1.5">
                        <div
                          className="w-3 rounded-t bg-slate-800 dark:bg-slate-200 transition-all"
                          style={{ height: `${sH}%` }}
                          title={`Sales: ₹${pb.sales}`}
                        />
                        <div
                          className="w-3 rounded-t bg-teal-500 transition-all"
                          style={{ height: `${svH}%` }}
                          title={`Saved: ₹${pb.saved}`}
                        />
                        <div
                          className="w-3 rounded-t bg-emerald-600 transition-all"
                          style={{ height: `${pH}%` }}
                          title={`Profit: ₹${pb.profit}`}
                        />
                      </div>
                      <div className="text-[10px] font-mono-nums space-y-0.5">
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                          <span>Sales:</span>
                          <strong>₹{pb.sales.toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                          <span>Profit:</span>
                          <span>₹{pb.profit.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Top 10 Horizontal Demand & Spend Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              {pickLang(lang, {
                en: 'Top 10 Buyers Ranking Chart (#1 to #10)',
                hi: 'टॉप 10 खरीदार रैंकिंग चार्ट (#1 से #10)',
                hinglish: 'Top 10 Buyers Bar Chart (#1 to #10)',
              })}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {top10.length} {pickLang(lang, { en: 'ranked buyers', hi: 'खरीदार', hinglish: 'buyers' })}
          </span>
        </div>

        {top10.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            {pickLang(lang, {
              en: 'No verified customer orders yet in this time window.',
              hi: 'इस अवधि में अभी तक कोई ग्राहक ऑर्डर दर्ज नहीं हुआ है।',
              hinglish: 'Is time period me abhi koi order nahi mila.',
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {top10.map((buyer) => {
              const current = buyer[period];
              const pct = Math.max(8, Math.round((current.totalSpent / maxChartSpent) * 100));
              const rankBadge =
                buyer.rank === 1
                  ? '🥇 #1'
                  : buyer.rank === 2
                  ? '🥈 #2'
                  : buyer.rank === 3
                  ? '🥉 #3'
                  : `#${buyer.rank}`;

              return (
                <div
                  key={buyer.buyerKey}
                  className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70 space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-black shrink-0 ${
                          buyer.rank <= 3
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {rankBadge}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                          {buyer.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {buyer.phone ? `📞 ${buyer.phone}` : 'No Phone'} · {buyer.flat}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <div className="text-right font-mono-nums text-xs">
                        <div className="font-black text-slate-900 dark:text-white">
                          ₹{current.totalSpent.toLocaleString('en-IN')} · {current.totalKg} kg
                        </div>
                        <div className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-bold">
                          {pickLang(lang, { en: 'Profit', hi: 'प्रॉफिट', hinglish: 'Profit' })}: ₹
                          {current.adminProfit.toLocaleString('en-IN')} ·{' '}
                          {pickLang(lang, { en: 'Saved', hi: 'बचत', hinglish: 'Saved' })}: ₹
                          {current.customerSaved.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openRewardModal(buyer)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Gift className="w-3.5 h-3.5 text-amber-300" />
                        <span>
                          {pickLang(lang, {
                            en: 'Give Discount / AI Gift',
                            hi: 'छूट / AI गिफ्ट दें',
                            hinglish: 'Give Discount / AI Gift',
                          })}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Proportional Bar */}
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        buyer.rank === 1
                          ? 'bg-amber-500'
                          : buyer.rank <= 3
                          ? 'bg-emerald-600'
                          : 'bg-teal-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Daily / Weekly / Monthly / Yearly compact breakdown strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono-nums">
                    <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                      <span className="text-slate-400 font-sans">Daily:</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        ₹{buyer.daily.totalSpent}
                      </strong>{' '}
                      <span className="text-slate-500">({buyer.daily.totalKg}kg)</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                      <span className="text-slate-400 font-sans">Weekly:</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        ₹{buyer.weekly.totalSpent}
                      </strong>{' '}
                      <span className="text-slate-500">({buyer.weekly.totalKg}kg)</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                      <span className="text-slate-400 font-sans">Monthly:</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        ₹{buyer.monthly.totalSpent}
                      </strong>{' '}
                      <span className="text-slate-500">({buyer.monthly.totalKg}kg)</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                      <span className="text-slate-400 font-sans">Yearly:</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        ₹{buyer.yearly.totalSpent}
                      </strong>{' '}
                      <span className="text-emerald-600 font-sans font-bold">
                        (+₹{buyer.yearly.adminProfit})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Expandable #11+ Remaining History */}
        {remainingHistory.length > 0 && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowMoreHistory((prev) => !prev)}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              {showMoreHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>
                {showMoreHistory
                  ? pickLang(lang, {
                      en: `Hide Remaining Buyer History (${remainingHistory.length})`,
                      hi: `अन्य खरीदार हिस्ट्री छुपाएँ (${remainingHistory.length})`,
                      hinglish: `Remaining History Hide Karein (${remainingHistory.length})`,
                    })
                  : pickLang(lang, {
                      en: `Show More Buyer History (#11 – #${10 + remainingHistory.length})`,
                      hi: `और खरीदारों की पूरी हिस्ट्री देखें (#11 – #${10 + remainingHistory.length})`,
                      hinglish: `Aur Buyers Ki History Dekhein (#11 – #${10 + remainingHistory.length})`,
                    })}
              </span>
            </button>

            {showMoreHistory && (
              <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {remainingHistory.map((buyer) => {
                  const m = buyer[period];
                  return (
                    <div
                      key={buyer.buyerKey}
                      className="p-3 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-slate-500 mr-2">#{buyer.rank}</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{buyer.name}</span>
                        <span className="text-slate-500 ml-2 font-mono">{buyer.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono-nums shrink-0">
                        <span>
                          ₹{m.totalSpent} · {m.totalKg} kg ({m.orderCount} orders)
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          Profit: ₹{m.adminProfit}
                        </span>
                        <button
                          type="button"
                          onClick={() => openRewardModal(buyer)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-sans font-bold cursor-pointer"
                        >
                          {pickLang(lang, { en: 'Reward', hi: 'इनाम दें', hinglish: 'Reward' })}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Granted Rewards History Strip */}
      {grantedRewards.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              {pickLang(lang, {
                en: `Granted Customer Coupons & Surprise Gifts (${grantedRewards.length})`,
                hi: `भेजे गए कूपन, छूट व सरप्राइज गिफ्ट (${grantedRewards.length})`,
                hinglish: `Granted Coupons & Surprise Gifts (${grantedRewards.length})`,
              })}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {grantedRewards.slice(0, 8).map((rw) => (
              <div
                key={rw.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-slate-900 dark:text-slate-100 truncate">
                    {rw.targetName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      rw.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {rw.status === 'active' ? 'ACTIVE' : 'REDEEMED'}
                  </span>
                </div>
                <div className="text-emerald-700 dark:text-emerald-300 font-bold">
                  {rw.title} · <span className="font-mono">{rw.couponCode}</span>
                </div>
                {rw.freeGiftItem && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                    🎁 {rw.freeGiftItem}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN DIRECT REWARD & AI DESIGNER MODAL */}
      {rewardTargetBuyer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Admin Direct Reward & AI Studio
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {rewardTargetBuyer.name} (Rank #{rewardTargetBuyer.rank})
                </h3>
                <p className="text-xs text-slate-500">
                  Total Bought: ₹{rewardTargetBuyer.all.totalSpent} · Profit: ₹
                  {rewardTargetBuyer.all.adminProfit}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRewardTargetBuyer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Prompt Composer Box */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-200">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>
                  {pickLang(lang, {
                    en: 'Write to AI (Hindi / Hinglish / English) to auto-configure gift or discount',
                    hi: 'AI को लिखें — जैसा चाहें वैसा डिस्काउंट या सरप्राइज गिफ्ट अपने-आप सेट करवाएँ',
                    hinglish: 'AI ko likhein — woh apne aap discount/surprise gift set kar dega',
                  })}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="उदा. ₹50 off aur 1 kg tamatar surprise gift de do..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-xs text-slate-900 dark:text-white focus:outline-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleDesignWithAi}
                  disabled={!aiPrompt.trim() || isAiDesigning}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isAiDesigning ? 'animate-spin' : ''}`} />
                  <span>{isAiDesigning ? 'AI...' : 'AI Set'}</span>
                </button>
              </div>
              {aiReplyToast && (
                <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  ✓ {aiReplyToast}
                </div>
              )}
            </div>

            {/* Editable Reward Form */}
            <form onSubmit={handleGrantReward} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Reward Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'coupon', label: 'Coupon', icon: <Ticket className="w-3.5 h-3.5" /> },
                      { id: 'wallet_credit', label: 'Wallet ₹', icon: <Wallet className="w-3.5 h-3.5" /> },
                      { id: 'surprise_gift', label: 'Surprise Gift', icon: <Gift className="w-3.5 h-3.5" /> },
                      { id: 'combo', label: 'Combo Both', icon: <Sparkles className="w-3.5 h-3.5" /> },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setRewardType(mode.id)}
                      className={`py-2 px-2 rounded-xl border font-bold flex items-center justify-center gap-1 cursor-pointer ${
                        rewardType === mode.id
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {mode.icon}
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Flat Off (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={discountRupees}
                    onChange={(e) => setDiscountRupees(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Percent Off (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.min(80, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={minOrderRupees}
                    onChange={(e) => setMinOrderRupees(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">
                  Surprise Produce / Gift Item (Optional)
                </label>
                <input
                  type="text"
                  value={freeGiftItem}
                  onChange={(e) => setFreeGiftItem(e.target.value)}
                  placeholder="e.g. 1 kg ताज़ा टमाटर (Free Surprise Gift)"
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Title</label>
                <input
                  type="text"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">
                  Personal Note to Customer
                </label>
                <textarea
                  rows={2}
                  value={rewardMessage}
                  onChange={(e) => setRewardMessage(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRewardTargetBuyer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGranting}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isGranting
                      ? 'Sending...'
                      : pickLang(lang, {
                          en: 'Send Reward Now',
                          hi: 'ग्राहक को रिवॉर्ड भेजें',
                          hinglish: 'Reward Bhejein',
                        })}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

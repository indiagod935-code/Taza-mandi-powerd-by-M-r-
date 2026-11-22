import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Scale,
  Sparkles,
  Plus,
  CheckCircle,
  PackageCheck,
  Trophy,
  ShieldCheck,
} from 'lucide-react';
import { SafeProductImg } from './SafeProductImg';
import { analyticsApi } from '../api/endpoints';
import { PublicTopBuyer } from '../types';
import { pickLang } from '../utils/i18nHelper';
import { BatchSavingChart } from './BatchSavingChart';

interface CommunityPoolViewProps {
  onSelectProduce?: (id: string) => void;
}

function toFirstNameOnly(rawName?: string): string {
  const clean = String(rawName || 'Member')
    .replace(/\+91[\s-]?\d+/g, '')
    .replace(/\d{5,}/g, '')
    .trim();
  return (clean.split(/\s+/)[0] || 'Member').slice(0, 20);
}

export const CommunityPoolView: React.FC<CommunityPoolViewProps> = () => {
  const {
    produceList,
    getCommunityDemandKg,
    produceCart,
    addProduceToCart,
    orders,
    brand,
    lang,
    user,
    featureFlags,
    t,
  } = useApp();

  const [serverTopBuyers, setServerTopBuyers] = useState<PublicTopBuyer[]>([]);
  const [totalActiveBuyers, setTotalActiveBuyers] = useState(0);

  useEffect(() => {
    let active = true;
    const loadTopThree = () => {
      analyticsApi
        .getPublicTopThree()
        .then((res) => {
          if (!active || !res?.success) return;
          setServerTopBuyers(Array.isArray(res.buyers) ? res.buyers.slice(0, 3) : []);
          setTotalActiveBuyers(Number(res.totalActiveBuyers) || 0);
        })
        .catch(() => {});
    };
    loadTopThree();
    const timer = setInterval(loadTopThree, 30_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [orders.length]);

  // Fallback blend with real non-sample session orders (strictly first name only — ZERO phone/flat PII)
  const topThreeBuyers = useMemo<PublicTopBuyer[]>(() => {
    if (serverTopBuyers.length > 0) return serverTopBuyers;

    const map = new Map<string, { firstName: string; totalKg: number; orderCount: number; spent: number }>();
    orders.forEach((o) => {
      if (o.status === 'cancelled' || o.isSampleOrder) return;
      const key = (o.customerEmail || o.phone || o.customerName || o.id).toLowerCase();
      const prev = map.get(key) || {
        firstName: toFirstNameOnly(o.customerName),
        totalKg: 0,
        orderCount: 0,
        spent: 0,
      };
      prev.totalKg = Math.round((prev.totalKg + (Number(o.totalProduceWeightKg) || 0)) * 10) / 10;
      prev.spent += Number(o.totalAmount) || 0;
      prev.orderCount += 1;
      map.set(key, prev);
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalKg - a.totalKg || b.spent - a.spent)
      .slice(0, 3)
      .map((item, idx) => ({
        rank: idx + 1,
        firstName: item.firstName,
        societyLabel: 'Society Buyer',
        totalKg: item.totalKg,
        orderCount: item.orderCount,
      }));
  }, [serverTopBuyers, orders]);

  const maxTopBuyerKg = Math.max(
    1,
    ...topThreeBuyers.map((b) => Number(b.totalKg) || 0)
  );

  const totalPooledKg = produceList.reduce((sum, item) => sum + getCommunityDemandKg(item.id), 0);
  const totalUserCartKg = Object.values(produceCart).reduce((sum, val) => sum + val, 0);

  const totalSavedRupees = produceList.reduce((sum, item) => {
    const demand = getCommunityDemandKg(item.id);
    const savingPerKg = item.localMarketPricePerKg - item.pricePerKg;
    return sum + demand * savingPerKg;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Summary */}
      <div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" />
              <span>
                {lang === 'hi'
                  ? brand.societyName
                  : lang === 'mr'
                  ? 'सोसायटी डिलिव्हरी विभाग'
                  : 'Society Delivery Pool'}
              </span>
              <span>·</span>
              <span>MARCO 100 Live Demand Pool</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-slate-100">
              {lang === 'hi'
                ? 'आज का सामूहिक मांग पूल (Live Community Demand)'
                : lang === 'mr'
                ? 'आजचा सामूहिक मागणी पूल (Zero-Waste)'
                : 'Today’s Collective Produce Pool'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
              {lang === 'hi'
                ? 'यहाँ सभी पड़ोसियों का कुल ऑर्डर लाइव जुड़ता है। जितना ऑर्डर होगा, ठीक उतना ही सुबह 4 बजे होलसेल मंडी से खरीदा जाएगा। कोई बासी माल नहीं, 30% तक की बचत!'
                : lang === 'mr'
                ? 'येथे संपूर्ण सोसायटीची मागणी एकत्र होते. जितकी मागणी असेल तेवढाच माल पहाटे ४ वाजता घाऊक बाजारातून उचलला जातो. ०% अपव्यय!'
                : 'Real-time collective order tracking. Mandi crates are sourced strictly against confirmed family demand with zero waste.'}
            </p>
          </div>

          {totalUserCartKg > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3 text-right">
              <div className="text-xs text-slate-500">
                {user.name} {user.flat ? `(${user.flat})` : ''}
              </div>
              <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300 font-mono tabular-nums">
                {lang === 'hi' ? 'आपकी थैली:' : lang === 'mr' ? 'तुमची पिशवी:' : 'Your Basket:'}{' '}
                {Math.round(totalUserCartKg * 10) / 10} kg
              </div>
            </div>
          )}
        </div>

        {/* 4 Quantitative Rigor Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>
                {lang === 'hi' ? 'कुल बुक किया माल' : lang === 'mr' ? 'एकूण नोंदवलेली मागणी' : 'Total Booked'}
              </span>
              <Scale className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {Math.round(totalPooledKg * 10) / 10} <span className="text-sm font-medium">kg</span>
            </div>
            <div className="text-[11px] text-emerald-700 mt-1">Fresh Farm Staples</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>
                {lang === 'hi'
                  ? 'सोसायटी की कुल बचत'
                  : lang === 'mr'
                  ? 'सोसायटीची एकूण बचत'
                  : 'Society Savings'}
              </span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
              ₹{Math.round(totalSavedRupees)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">vs local vendors</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>
                {lang === 'hi' ? 'अपव्यय / कचरा' : lang === 'mr' ? 'अन्न नासाडी' : 'Produce Wastage'}
              </span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              0 <span className="text-sm font-medium">kg</span>
            </div>
            <div className="text-[11px] text-emerald-700 mt-1">100% Zero Dead Stock</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>
                {lang === 'hi'
                  ? 'मंडी थोक बोरियां'
                  : lang === 'mr'
                  ? 'घाऊक गोणी संख्या'
                  : 'Wholesale Sacks'}
              </span>
              <PackageCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {Math.ceil(totalPooledKg / 35)} <span className="text-sm font-medium">lots</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{brand.mandiCity.split(',')[0]}</div>
          </div>
        </div>
      </div>

      {/* PUBLIC #1, #2, #3 BUYERS LIVE BAR CHART (Strict Privacy: First Name Only, ZERO Phone Numbers) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {pickLang(lang, {
                  en: 'Live Group Demand Leaders — Rank #1, #2 & #3',
                  hi: 'लाइव ग्रुप डिमांड लीडर्स — नंबर 1, 2 व 3 खरीदार',
                  mr: 'थेट ग्रुप डिमांड लीडर्स — क्रमांक १, २ व ३',
                  hinglish: 'Live Group Demand Chart — Rank #1, #2 & #3 Buyers',
                })}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {pickLang(lang, {
                  en: 'Top 3 active residents ordering fresh harvest directly from mandi',
                  hi: 'सबसे ज्यादा ताज़ा सामान खरीदने वाले शीर्ष 3 सदस्य (मोबाइल नंबर गोपनीय)',
                  mr: 'सर्वाधिक खरेदी करणारे टॉप ३ सदस्य (मोबाईल नंबर गुप्त)',
                  hinglish: 'Sabse zyada kharidari karne wale Top #1, #2, #3 buyers (Mobile number hidden)',
                })}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>
              {pickLang(lang, {
                en: 'Privacy Protected · No Phone Numbers',
                hi: 'प्राइवेसी सुरक्षित · मोबाइल नंबर गुप्त',
                mr: 'गोपनीयता सुरक्षित',
                hinglish: 'Privacy Safe · Phone No. Hidden',
              })}
              {totalActiveBuyers > 0 ? ` (${totalActiveBuyers})` : ''}
            </span>
          </div>
        </div>

        {topThreeBuyers.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
            {pickLang(lang, {
              en: 'Place an order today to appear as Rank #1 in Live Society Demand!',
              hi: 'आज ऑर्डर करें और लाइव ग्रुप डिमांड चार्ट में नंबर #1 स्थान पाएं!',
              mr: 'थेट मागणी चार्टमध्ये क्रमांक #१ मिळवण्यासाठी आज ऑर्डर करा!',
              hinglish: 'Aaj order karein aur Live Demand Chart me Rank #1 par aayein!',
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {topThreeBuyers.map((buyer) => {
              const barPct = Math.max(
                14,
                Math.round(((Number(buyer.totalKg) || 0.5) / maxTopBuyerKg) * 100)
              );
              const badgeEmoji = buyer.rank === 1 ? '🥇' : buyer.rank === 2 ? '🥈' : '🥉';
              const barColorClass =
                buyer.rank === 1
                  ? 'bg-amber-500'
                  : buyer.rank === 2
                  ? 'bg-emerald-600'
                  : 'bg-teal-600';

              return (
                <div
                  key={`${buyer.rank}-${buyer.firstName}`}
                  className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-sm shrink-0">
                        {badgeEmoji}
                      </span>
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 dark:text-slate-100 truncate">
                          #{buyer.rank} · {buyer.firstName}
                        </div>
                        <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                          {buyer.orderCount}{' '}
                          {pickLang(lang, {
                            en: buyer.orderCount === 1 ? 'verified order' : 'verified orders',
                            hi: 'सत्यापित ऑर्डर',
                            mr: 'ऑर्डर्स',
                            hinglish: 'verified orders',
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums shrink-0">
                      <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                        {buyer.totalKg} kg
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Live Batch Saving Chart */}
      {featureFlags.batchSavingChart !== false && <BatchSavingChart compact />}

      {/* Item-by-item breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {lang === 'hi'
              ? 'प्रत्येक सब्ज़ी और फल की लाइव सामूहिक मांग'
              : lang === 'mr'
              ? 'प्रत्येक भाजी व फळांची थेट मागणी'
              : 'Live Item-by-Item Demand Tracker'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'hi'
              ? 'जैसे ही आप या कोई भी परिवार वजन बढ़ाता है, यहाँ कुल किलोग्राम तुरंत लाइव अपडेट हो जाता है:'
              : 'As any resident adds quantity, the collective demand increments automatically:'}
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {produceList.map((item) => {
            const itemDemand = getCommunityDemandKg(item.id);
            const userQty = produceCart[item.id] || 0;
            const progress = Math.min(100, Math.round((itemDemand / item.mandiTierBagKg) * 100));

            return (
              <div
                key={item.id}
                className="p-4 sm:px-6 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 sm:min-w-[220px]">
                    <SafeProductImg
                      product={item}
                      alt={item.name.en}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {item.name[lang] || item.name.hi || item.name.en}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>₹{item.pricePerKg}/kg</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-medium">
                          {item.origin.split('/')[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 max-w-md">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t('today_demand')}:</span>
                        <strong className="text-emerald-800 dark:text-emerald-300 text-sm font-mono tabular-nums">
                          {itemDemand} kg
                        </strong>
                      </span>
                      <span className="text-slate-500 font-mono text-[11px] tabular-nums">
                        {progress}% of sack ({item.mandiTierBagKg} kg)
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>
                        Wholesale Lot: {Math.ceil(itemDemand / item.mandiTierBagKg)} x{' '}
                        {item.mandiTierBagKg}kg
                      </span>
                      {userQty > 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold font-mono tabular-nums">
                          {lang === 'hi' ? 'आपकी थैली:' : 'In Cart:'} {userQty} kg
                        </span>
                      ) : (
                        <span className="text-slate-400">Not in your cart</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => addProduceToCart(item.id, 1.0)}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+1 kg</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addProduceToCart(item.id, 2.0)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      +2 kg
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

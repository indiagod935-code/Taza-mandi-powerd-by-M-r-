import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProduceItem } from '../types';
import { SafeProductImg } from './SafeProductImg';
import { SeasonalStripSkeleton } from './LoadingSkeletons';
import { pickLang, resolveLocalizedProduceName } from '../utils/i18nHelper';
import { Flame, RotateCcw, Sun, Snowflake, CloudRain, Plus, Check, TrendingUp, Sparkles } from 'lucide-react';

interface IndianSeasonInfo {
  id: 'winter' | 'summer' | 'monsoon';
  icon: React.ReactNode;
  badgeColor: string;
  title: Record<string, string>;
  reason: Record<string, string>;
  recommendedIds: string[];
}

function getCurrentIndianSeason(date: Date): IndianSeasonInfo {
  const month = date.getMonth() + 1; // 1..12

  // Nov, Dec, Jan, Feb -> Winter (Sardi Harvest)
  if (month === 11 || month === 12 || month === 1 || month === 2) {
    return {
      id: 'winter',
      icon: <Snowflake className="w-4 h-4 text-sky-400" />,
      badgeColor: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
      title: {
        en: 'Current Season: Crisp Winter Harvest (Nov–Feb)',
        hi: 'अभी का मौसम: ताज़ा सर्दियों का लॉट (नवंबर–फरवरी)',
        mr: 'सध्याचा हंगाम: हिवाळी ताजा माल (नोव्हें–फेब्रु)',
        hinglish: 'Current Season: Winter Fresh Lot (Nov-Feb)',
        gu: 'વર્તમાન સિઝન: શિયાળુ તાજો પાક',
        bn: 'বর্তমান মৌসুম: শীতের টাটকা ফসল',
        ta: 'தற்போதைய பருவம்: குளிர்கால புதிய அறுவடை',
        te: 'ప్రస్తుత సీజన్: శీతాకాలం తాజా పంట',
        kn: 'ಪ್ರಸ್ತುತ ಋತು: ಚಳಿಗಾಲದ ತಾಜಾ ಬೆಳೆ',
        pa: 'ਮੌਜੂਦਾ ਸੀਜ਼ਨ: ਸਰਦੀਆਂ ਦੀ ਤਾਜ਼ੀ ਫ਼ਸਲ',
      },
      reason: {
        en: 'Sweet green peas, red carrots, methi, bathua, mooli, raw haldi & Nagpur oranges are at peak sweetness and lowest mandi prices right now!',
        hi: 'ताज़ी मीठी मटर, लाल गाजर, मेथी, बथुआ, मूली, कच्ची हल्दी और नागपुरी संतरे अभी सबसे ज़्यादा मीठे और सस्ते मंडी भाव पर हैं!',
        mr: 'ताजा मटार, लाल गाजर, मेथी, मुळा, ओली हळद व नागपुरी संत्री आत्ता सर्वोत्तम चव आणि स्वस्त मंडी दरात उपलब्ध आहेत!',
        hinglish: 'Meethi matar, lal gajar, methi, mooli aur Nagpur santra abhi peak freshness aur best rate par hai!',
        gu: 'લીલા વટાણા, લાલ ગાજર, મેથી, મૂળા અને સંતરા અત્યારે શ્રેષ્ઠ મીઠાશ અને મંડી ભાવે ઉપલબ્ધ છે!',
        bn: 'টাটকা মটরশুঁটি, লাল গাজর, মেথি, মুলো ও কমলালেবু এখন সবচেয়ে মিষ্টি ও কম দামে পাওয়া যাচ্ছে!',
        ta: 'பச்சை பட்டாணி, சிவப்பு கேரட், வெந்தயக்கீரை & ஆரஞ்சு இப்போது சிறந்த விலையில் கிடைக்கின்றன!',
        te: 'పచ్చి బఠానీ, ఎర్ర క్యారెట్, మెంతికూర & నారింజ ఇప్పుడు అత్యంత తాజాగా తక్కువ ధరలో ఉన్నాయి!',
        kn: 'ಹಸಿ ಬಟಾಣಿ, ಕೆಂಪು ಕ್ಯಾರೆಟ್, ಮೆಂತ್ಯ ಸೊಪ್ಪು ಮತ್ತು ಕಿತ್ತಳೆ ಈಗ ಅತ್ಯುತ್ತಮ ದರದಲ್ಲಿ ಲಭ್ಯವಿದೆ!',
        pa: 'ਹਰੇ ਮਟਰ, ਲਾਲ ਗਾਜਰ, ਮੇਥੀ, ਮੂਲੀ ਅਤੇ ਸੰਤਰੇ ਹੁਣ ਸਭ ਤੋਂ ਮਿੱਠੇ ਅਤੇ ਘੱਟ ਮੰਡੀ ਭਾਅ ਤੇ ਹਨ!',
      },
      recommendedIds: [
        'veg_green_peas',
        'root_carrot',
        'leafy_methi',
        'root_radish',
        'leafy_bathua',
        'root_turmeric',
        'sprout_green_chana',
        'fruit_orange',
      ],
    };
  }

  // Mar, Apr, May, Jun -> Summer
  if (month >= 3 && month <= 6) {
    return {
      id: 'summer',
      icon: <Sun className="w-4 h-4 text-amber-400" />,
      badgeColor: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      title: {
        en: 'Current Season: Fresh Summer Cooling Harvest (Mar–Jun)',
        hi: 'अभी का मौसम: गर्मियों के ताज़े ठंडक वाले फल व सब्ज़ियाँ',
        mr: 'सध्याचा हंगाम: उन्हाळी ताजा व थंडावा देणारा माल',
        hinglish: 'Current Season: Summer Cooling Fresh Lot',
      },
      reason: {
        en: 'Hapus mangoes, hydrating watermelons, muskmelons, lauki, kakdi, and kagzi lemons keep your family cool and energized.',
        hi: 'हापुस आम, मीठा तरबूज, खरबूजा, ताज़ी लौकी, खीरा और कागज़ी नींबू इस मौसम में शरीर को ठंडक व ताज़गी देते हैं।',
        mr: 'हापूस आंबा, कलिंगड, खरबूज, दुधी, काकडी आणि लिंबू या उन्हाळ्यात उत्तम थंडावा देतात.',
      },
      recommendedIds: [
        'fruit_mango',
        'fruit_watermelon',
        'fruit_muskmelon',
        'veg_cucumber',
        'veg_bottle_gourd',
        'citrus_lemon',
        'veg_okra',
        'fruit_jamun',
      ],
    };
  }

  // Jul, Aug, Sep, Oct -> Monsoon / Early Festive
  return {
    id: 'monsoon',
    icon: <CloudRain className="w-4 h-4 text-teal-300" />,
    badgeColor: 'bg-teal-500/20 text-teal-200 border-teal-400/40',
    title: {
      en: 'Current Season: Monsoon & Post-Rain Harvest (Jul–Oct)',
      hi: 'अभी का मौसम: मानसून व ताज़ा हरियाली लॉट (जुलाई–अक्टूबर)',
      mr: 'सध्याचा हंगाम: पावसाळी व ताजा हिरवा माल (जुलै–ऑक्टो)',
      hinglish: 'Current Season: Monsoon Special Lot (Jul-Oct)',
    },
    reason: {
      en: 'Sweet golden corn, tinda, parwal, suran yam, raw jackfruit & creamy sitaphal are freshly harvested right now!',
      hi: 'ताज़ा मीठा भुट्टा, टिंडा, परवल, सूरन, कच्चा कटहल और मीठा सीताफल इस मौसम में सबसे स्वादिष्ट मिलता है!',
      mr: 'ताजे मक्याचे कणीस, टिंडा, परवळ, सुरण, फणस आणि सीताफळ आत्ता सर्वोत्तम दर्जात उपलब्ध आहेत!',
    },
    recommendedIds: [
      'veg_sweet_corn',
      'fruit_custard_apple',
      'veg_tinda',
      'veg_parwal',
      'veg_raw_jackfruit',
      'veg_elephant_foot_yam',
      'veg_ridge_gourd',
      'root_taro',
    ],
  };
}

export const SeasonalAndTrendingSection: React.FC = () => {
  const {
    produceList,
    produceCart,
    setProduceCartQty,
    getCommunityDemandKg,
    orders,
    lang,
    isCatalogSyncing,
  } = useApp();

  const [activeSegment, setActiveSegment] = useState<'season' | 'trending' | 'repeat'>('season');

  const currentSeason = useMemo(() => getCurrentIndianSeason(new Date()), []);

  // Tab 1: Season-Recommended Available Produce
  const seasonalPicks = useMemo(() => {
    const picks: ProduceItem[] = [];
    for (const id of currentSeason.recommendedIds) {
      const found = produceList.find((p) => p.id === id && p.isAvailable !== false);
      if (found) picks.push(found);
    }
    if (picks.length < 6) {
      for (const p of produceList) {
        if (p.isSeasonal && p.isAvailable !== false && !picks.some((x) => x.id === p.id)) {
          picks.push(p);
        }
        if (picks.length >= 8) break;
      }
    }
    return picks;
  }, [produceList, currentSeason]);

  // Tab 2: Top Selling Products ranked live by society demand
  const topSellingPicks = useMemo(() => {
    return [...produceList]
      .filter((p) => p.isAvailable !== false)
      .sort((a, b) => getCommunityDemandKg(b.id) - getCommunityDemandKg(a.id))
      .slice(0, 8);
  }, [produceList, getCommunityDemandKg]);

  // Tab 3: Customer Frequently Bought / Repeat Purchases (Real order history + daily kitchen staple fallback)
  const repeatPurchaseStats = useMemo(() => {
    const counts = new Map<string, { times: number; totalKg: number }>();
    orders.forEach((ord) => {
      ord.produceItems.forEach((line) => {
        const prev = counts.get(line.produceId) || { times: 0, totalKg: 0 };
        counts.set(line.produceId, {
          times: prev.times + 1,
          totalKg: prev.totalKg + line.quantityKg,
        });
      });
    });

    const hasHistory = counts.size > 0;
    const rankedIds = hasHistory
      ? Array.from(counts.entries())
          .sort((a, b) => b[1].times - a[1].times || b[1].totalKg - a[1].totalKg)
          .map(([id]) => id)
      : [
          'root_potato',
          'root_onion',
          'veg_tomato',
          'herb_coriander',
          'veg_green_chilli',
          'citrus_lemon',
          'root_ginger',
          'leafy_palak',
        ];

    const items: { item: ProduceItem; badge: string }[] = [];
    for (const id of rankedIds) {
      const found = produceList.find((p) => p.id === id && p.isAvailable !== false);
      if (!found) continue;
      const stat = counts.get(id);
      const badge = stat
        ? pickLang(lang, {
            en: `Bought ${stat.times}× (${Math.round(stat.totalKg * 10) / 10}kg)`,
            hi: `${stat.times} बार खरीदा (${Math.round(stat.totalKg * 10) / 10}kg)`,
            mr: `${stat.times} वेळा घेतले`,
            hinglish: `${stat.times}× Repeat Order`,
          })
        : pickLang(lang, {
            en: 'Daily Repeat Essential',
            hi: 'रोज़ाना बार-बार ज़रूरी',
            mr: 'रोज लागणारा माल',
            hinglish: 'Daily Repeat Staple',
          });
      items.push({ item: found, badge });
      if (items.length >= 8) break;
    }

    return { hasHistory, items };
  }, [orders, produceList, lang]);

  const getUnitShort = (unit?: string) => {
    if (unit === 'gaddi') return lang === 'mr' ? 'जुडी' : lang === 'hi' ? 'गड्डी' : 'Gaddi';
    if (unit === 'piece') return lang === 'mr' ? 'नग' : lang === 'hi' ? 'पीस' : 'Pc';
    return 'kg';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
      {/* Season Intelligence Header Banner */}
      <div className="rounded-xl bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-md border ${currentSeason.badgeColor}`}>
              {currentSeason.icon}
              <span>{pickLang(lang, currentSeason.title as any)}</span>
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-emerald-100/90 leading-snug">
            {pickLang(lang, currentSeason.reason as any)}
          </p>
        </div>

        {/* 3 Switchable Discovery Tabs */}
        <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSegment('season')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
              activeSegment === 'season'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>
              {pickLang(lang, {
                en: 'Season Picks',
                hi: 'मौसमी सुझाव',
                mr: 'हंगामी निवड',
                hinglish: 'Season Picks',
                gu: 'સિઝન પસંદગી',
                bn: 'মৌসুমি সেরা',
                ta: 'சீசன் தேர்வு',
                te: 'సీజన్ పిక్స్',
                kn: 'ಸೀಸನ್ ಆಯ್ಕೆ',
                pa: 'ਸੀਜ਼ਨ ਪਸੰਦ',
              })}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSegment('trending')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
              activeSegment === 'trending'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>
              {pickLang(lang, {
                en: 'Top Selling',
                hi: 'टॉप सेलिंग',
                mr: 'सर्वाधिक खप',
                hinglish: 'Top Selling',
                gu: 'ટોપ સેલિંગ',
                bn: 'বেস্ট সেলার',
                ta: 'அதிக விற்பனை',
                te: 'టాప్ సెల్లింగ్',
                kn: 'ಹೆಚ್ಚು ಮಾರಾಟ',
                pa: 'ਟੌਪ ਸੇਲਿੰਗ',
              })}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSegment('repeat')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
              activeSegment === 'repeat'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>
              {pickLang(lang, {
                en: 'Buy Again',
                hi: 'बार-बार खरीदे गए',
                mr: 'पुन्हा खरेदी',
                hinglish: 'Buy Again',
                gu: 'ફરી ખરીદો',
                bn: 'বারবার কেনা',
                ta: 'மீண்டும் வாங்கு',
                te: 'మళ్ళీ కొనండి',
                kn: 'ಮತ್ತೆ ಖರೀದಿಸಿ',
                pa: 'ਵਾਰ-ਵਾਰ ਖਰੀਦਿਆ',
              })}
            </span>
          </button>
        </div>
      </div>

      {/* Compact Horizontal Product Rail for Active Tab */}
      {isCatalogSyncing ? (
        <SeasonalStripSkeleton count={5} />
      ) : (
      <div className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {activeSegment === 'season' &&
          seasonalPicks.map((item) => {
            const qtyInCart = produceCart[item.id] || 0;
            const rate =
              item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.pricePerKg
                ? item.discountPrice
                : item.pricePerKg;
            const unitTxt = getUnitShort(item.pricingUnit);
            return (
              <div
                key={item.id}
                className="w-40 sm:w-44 shrink-0 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-slate-800/70 p-2 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <SafeProductImg
                    product={item}
                    alt={item.name.en}
                    className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="min-w-0">
                    <span className="inline-block text-[9px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 rounded">
                      ⭐ {pickLang(lang, { en: 'In Season', hi: 'सीज़न बेस्ट', mr: 'हंगामी' })}
                    </span>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                      {resolveLocalizedProduceName(item.name, lang, item.id)}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      ₹{rate}/{unitTxt}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProduceCartQty(item.id, qtyInCart > 0 ? qtyInCart + (item.minIncrementKg || 0.5) : item.defaultKg || 1)}
                  className={`w-full py-1 px-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    qtyInCart > 0
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {qtyInCart > 0 ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  <span>
                    {qtyInCart > 0
                      ? `${qtyInCart} ${unitTxt}`
                      : `+ ${pickLang(lang, { en: 'Add', hi: 'जोड़ें', mr: 'जोडा', gu: 'ઉમેરો', bn: 'যোগ', ta: 'சேர்', te: 'చేర్చు', kn: 'ಸೇರಿಸಿ', pa: 'ਜੋੜੋ' })} (${item.defaultKg}${unitTxt})`}
                  </span>
                </button>
              </div>
            );
          })}

        {activeSegment === 'trending' &&
          topSellingPicks.map((item, idx) => {
            const qtyInCart = produceCart[item.id] || 0;
            const demandKg = getCommunityDemandKg(item.id);
            const rate =
              item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.pricePerKg
                ? item.discountPrice
                : item.pricePerKg;
            const unitTxt = getUnitShort(item.pricingUnit);
            return (
              <div
                key={item.id}
                className="w-40 sm:w-44 shrink-0 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/30 dark:bg-slate-800/70 p-2 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <SafeProductImg
                    product={item}
                    alt={item.name.en}
                    className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-1.5 rounded">
                      <TrendingUp className="w-2.5 h-2.5" /> #{idx + 1} · {demandKg} {unitTxt}
                    </span>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                      {resolveLocalizedProduceName(item.name, lang, item.id)}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      ₹{rate}/{unitTxt}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProduceCartQty(item.id, qtyInCart > 0 ? qtyInCart + (item.minIncrementKg || 0.5) : item.defaultKg || 1)}
                  className={`w-full py-1 px-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    qtyInCart > 0
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {qtyInCart > 0 ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  <span>
                    {qtyInCart > 0
                      ? `${qtyInCart} ${unitTxt}`
                      : `+ ${pickLang(lang, { en: 'Add', hi: 'जोड़ें', mr: 'जोडा' })} (${item.defaultKg}${unitTxt})`}
                  </span>
                </button>
              </div>
            );
          })}

        {activeSegment === 'repeat' &&
          repeatPurchaseStats.items.map(({ item, badge }) => {
            const qtyInCart = produceCart[item.id] || 0;
            const rate =
              item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.pricePerKg
                ? item.discountPrice
                : item.pricePerKg;
            const unitTxt = getUnitShort(item.pricingUnit);
            return (
              <div
                key={item.id}
                className="w-40 sm:w-44 shrink-0 rounded-xl border border-sky-200/80 dark:border-sky-900/60 bg-sky-50/30 dark:bg-slate-800/70 p-2 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <SafeProductImg
                    product={item}
                    alt={item.name.en}
                    className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="min-w-0">
                    <span className="inline-block text-[9px] font-black text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/60 px-1.5 rounded truncate max-w-full">
                      🔄 {badge}
                    </span>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                      {resolveLocalizedProduceName(item.name, lang, item.id)}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      ₹{rate}/{unitTxt}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProduceCartQty(item.id, qtyInCart > 0 ? qtyInCart + (item.minIncrementKg || 0.5) : item.defaultKg || 1)}
                  className={`w-full py-1 px-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    qtyInCart > 0
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {qtyInCart > 0 ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  <span>
                    {qtyInCart > 0
                      ? `${qtyInCart} ${unitTxt}`
                      : `+ ${pickLang(lang, { en: 'Reorder', hi: 'फिर जोड़ें', mr: 'पुन्हा जोडा' })} (${item.defaultKg}${unitTxt})`}
                  </span>
                </button>
              </div>
            );
          })}
      </div>
      )}
    </div>
  );
};

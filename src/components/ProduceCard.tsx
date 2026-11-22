import React, { useState, useEffect, useRef } from 'react';
import { ProduceItem } from '../types';
import { useApp } from '../context/AppContext';
import {
  Plus,
  Minus,
  Check,
  Share2,
  ArrowLeftRight,
  Play,
  Image as ImageIcon,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { resolveProductVisualAsset } from '../utils/productVisualMapper';
import { getProduceHealthBenefits } from '../utils/produceHealthBenefits';
import { resolveProductVideo } from '../data/verifiedRecipeVideos';
import { pickLang, resolveLocalizedProduceName, resolveLocalizedField } from '../utils/i18nHelper';

interface ProduceCardProps {
  item: ProduceItem;
  itemNumber?: number;
  onOpenInsights?: (item: ProduceItem) => void;
}

type CardSlide = 'photo' | 'benefits' | 'video';

// Approximate weight (kg) of 1 unit (1 gaddi / 1 piece) for transparent ₹/kg <-> ₹/unit comparison
const APPROX_UNIT_WEIGHT_KG: Record<string, number> = {
  leafy_palak: 0.25,
  herb_coriander: 0.15,
  leafy_methi: 0.25,
  leafy_green_amaranth: 0.25,
  leafy_red_amaranth: 0.25,
  leafy_mustard_greens: 0.30,
  leafy_bathua: 0.25,
  leafy_dill: 0.15,
  leafy_spring_onion: 0.25,
  leafy_colocasia: 0.25,
  leafy_malabar_spinach: 0.25,
  herb_mint: 0.12,
  herb_curry_leaves: 0.10,
  veg_sweet_corn: 0.35,
  fruit_watermelon: 2.20,
  fruit_pineapple: 1.25,
  veg_cauliflower: 0.55,
  veg_cabbage: 0.65,
  veg_bottle_gourd: 0.60,
  veg_broccoli: 0.35,
  veg_pumpkin: 1.00,
  veg_ash_gourd: 1.00,
  veg_cucumber: 0.20,
  veg_brinjal: 0.20,
  veg_capsicum: 0.15,
  veg_bell_pepper_red: 0.18,
  veg_bell_pepper_yellow: 0.18,
  veg_raw_papaya: 0.80,
  veg_raw_jackfruit: 0.85,
  veg_raw_banana: 0.15,
  veg_kohlrabi: 0.25,
  veg_ridge_gourd: 0.25,
  veg_sponge_gourd: 0.25,
  veg_bitter_gourd: 0.12,
  root_radish: 0.25,
  root_onion: 0.12,
  root_potato: 0.12,
  root_potato_red: 0.12,
  root_beetroot: 0.20,
  root_carrot: 0.12,
  root_turnip: 0.20,
  veg_tomato: 0.10,
  citrus_lemon: 0.05,
  citrus_mosambi: 0.20,
  citrus_pomelo: 0.90,
  fruit_orange: 0.18,
  fruit_apple: 0.18,
  fruit_banana: 0.12,
  fruit_pomegranate: 0.25,
  fruit_mango: 0.28,
  fruit_papaya: 1.10,
  fruit_muskmelon: 0.90,
  fruit_guava: 0.20,
  fruit_chikoo: 0.10,
  fruit_custard_apple: 0.25,
  fruit_dragon_fruit: 0.35,
  fruit_kiwi: 0.10,
  fruit_coconut: 0.45,
  other_fresh_coconut: 0.45,
};

export const ProduceCard: React.FC<ProduceCardProps> = ({ item, itemNumber, onOpenInsights }) => {
  const {
    produceCart,
    setProduceCartQty,
    user,
    lang,
    isBefore11PmCutoff,
    featureFlags,
    activeUiSample,
  } = useApp();

  const userSelectedKg = produceCart[item.id] || 0;
  const [selectedWeight, setSelectedWeight] = useState<number>(userSelectedKg || item.defaultKg);
  const [imageFailed, setImageFailed] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [shareWhatsappHref, setShareWhatsappHref] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState<CardSlide>('photo');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const pricingUnit = item.pricingUnit || 'kg';
  const isGaddi = pricingUnit === 'gaddi';
  const isPiece = pricingUnit === 'piece';

  const approxUnitWeightKg = item.approxUnitWeightKg ?? APPROX_UNIT_WEIGHT_KG[item.id];
  const hasUnitComparison = Boolean(approxUnitWeightKg && approxUnitWeightKg > 0);
  const [priceViewMode, setPriceViewMode] = useState<'kg' | 'unit'>(
    isGaddi || isPiece ? 'unit' : 'kg'
  );

  const visualAsset = resolveProductVisualAsset(item);
  const health = React.useMemo(() => getProduceHealthBenefits(item, lang), [item, lang]);
  const videoResolution = React.useMemo(
    () => resolveProductVideo(item.id, item.category, item.name.en, item.name.hi),
    [item.id, item.category, item.name.en, item.name.hi]
  );

  const unitLabel = React.useMemo(() => {
    if (isGaddi) {
      return pickLang(lang, {
        en: 'Gaddi',
        hi: 'गड्डी',
        mr: 'जुडी',
        hinglish: 'Gaddi',
        gu: 'ઝૂડી',
        bn: 'আঁটি',
        ta: 'கட்டு',
        te: 'కట్ట',
        kn: 'ಕಟ್ಟು',
        pa: 'ਗੁੱਛੀ',
      });
    }
    if (isPiece) {
      return pickLang(lang, {
        en: 'Pc',
        hi: 'पीस',
        mr: 'नग',
        hinglish: 'Pc',
        gu: 'નંગ',
        bn: 'পিস',
        ta: 'எண்',
        te: 'నగ్',
        kn: 'ನಗ್',
        pa: 'ਪੀਸ',
      });
    }
    return 'kg';
  }, [isGaddi, isPiece, lang]);

  const compareUnitName = React.useMemo(() => {
    if (isGaddi) {
      return pickLang(lang, {
        en: 'Bunch',
        hi: 'गड्डी',
        mr: 'जुडी',
        hinglish: 'Gaddi',
      });
    }
    return pickLang(lang, {
      en: 'Pc',
      hi: 'नग',
      mr: 'नग',
      hinglish: 'Pc',
    });
  }, [isGaddi, lang]);

  const presets = React.useMemo(() => {
    if (item.unitPresets && item.unitPresets.length > 0) return item.unitPresets;
    if (isGaddi) return [1, 2, 3, 5];
    if (isPiece) return [1, 2, 3, 4];
    return [0.5, 1.0, 1.5, 2.0, 4.0, 5.0];
  }, [item.unitPresets, isGaddi, isPiece]);

  const stepIncrement = isGaddi || isPiece ? 1 : (item.minIncrementKg || 0.5);

  const formatQtyLabel = (val: number) => {
    if (isGaddi || isPiece) return `${val} ${unitLabel}`;
    return val >= 1 ? `${val}k` : `${Math.round(val * 1000)}g`;
  };

  const handleWeightChange = (newWeight: number) => {
    const minVal = isGaddi || isPiece ? 1 : 0;
    const rounded = Math.max(minVal, Math.round(newWeight * 100) / 100);
    setSelectedWeight(rounded);
    if (userSelectedKg > 0) {
      setProduceCartQty(item.id, rounded);
    }
  };

  const handleAddToCart = () => {
    const fallbackQty = isGaddi || isPiece ? 1 : item.defaultKg;
    const finalWeight = selectedWeight > 0 ? selectedWeight : fallbackQty;
    setProduceCartQty(item.id, finalWeight);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const displayName = React.useMemo(() => {
    return resolveLocalizedProduceName(item.name, lang, item.id);
  }, [item.name, lang, item.id]);

  const cleanDescription = React.useMemo(() => {
    return resolveLocalizedField(item.description, lang);
  }, [item.description, lang]);

  const [imageLoaded, setImageLoaded] = useState(false);
  const heroImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setImageFailed(false);
    const el = heroImgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setImageLoaded(true);
    } else {
      setImageLoaded(false);
    }
  }, [visualAsset]);

  const availableSlides = React.useMemo<CardSlide[]>(() => {
    const slides: CardSlide[] = ['photo'];
    if (featureFlags.healthBenefitsSlide) slides.push('benefits');
    if (featureFlags.youtubeRecipeVideos) slides.push('video');
    return slides;
  }, [featureFlags.healthBenefitsSlide, featureFlags.youtubeRecipeVideos]);

  useEffect(() => {
    if (!availableSlides.includes(activeSlide)) {
      setActiveSlide('photo');
    }
  }, [availableSlides, activeSlide]);

  useEffect(() => {
    if (activeSlide !== 'video' && isVideoPlaying) {
      setIsVideoPlaying(false);
    }
  }, [activeSlide, isVideoPlaying]);

  const cycleSlide = (dir: -1 | 1) => {
    if (availableSlides.length <= 1) return;
    const idx = availableSlides.indexOf(activeSlide);
    const safeIdx = idx >= 0 ? idx : 0;
    const nextIdx = (safeIdx + dir + availableSlides.length) % availableSlides.length;
    setActiveSlide(availableSlides[nextIdx]);
  };

  const effectivePrice =
    item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.pricePerKg
      ? item.discountPrice
      : item.pricePerKg;
  const hasDiscount = effectivePrice < item.pricePerKg;
  const discountPct = hasDiscount
    ? Math.round(((item.pricePerKg - effectivePrice) / item.pricePerKg) * 100)
    : 0;

  const comparisonPricing = React.useMemo(() => {
    if (!hasUnitComparison || !approxUnitWeightKg) {
      return {
        isShowingConverted: false,
        displayPrice: effectivePrice,
        displayBasePrice: item.pricePerKg,
        displayMarketPrice: item.localMarketPricePerKg,
        displayUnitLabel: unitLabel,
        approxWeightText: '',
      };
    }

    const isNativeUnit = isGaddi || isPiece;
    const isShowingConverted =
      (isNativeUnit && priceViewMode === 'kg') ||
      (!isNativeUnit && priceViewMode === 'unit');

    const grams = Math.round(approxUnitWeightKg * 1000);
    const weightBadge =
      grams >= 1000
        ? `~${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)} kg`
        : `~${grams}g`;

    if (!isShowingConverted) {
      return {
        isShowingConverted: false,
        displayPrice: effectivePrice,
        displayBasePrice: item.pricePerKg,
        displayMarketPrice: item.localMarketPricePerKg,
        displayUnitLabel: unitLabel,
        approxWeightText: `1 ${compareUnitName} ≈ ${weightBadge}`,
      };
    }

    if (isNativeUnit && priceViewMode === 'kg') {
      const factor = 1 / approxUnitWeightKg;
      return {
        isShowingConverted: true,
        displayPrice: Math.round(effectivePrice * factor),
        displayBasePrice: Math.round(item.pricePerKg * factor),
        displayMarketPrice: Math.round(item.localMarketPricePerKg * factor),
        displayUnitLabel: 'kg',
        approxWeightText: `1 ${compareUnitName} ≈ ${weightBadge}`,
      };
    } else {
      return {
        isShowingConverted: true,
        displayPrice: Math.max(1, Math.round(effectivePrice * approxUnitWeightKg)),
        displayBasePrice: Math.max(1, Math.round(item.pricePerKg * approxUnitWeightKg)),
        displayMarketPrice: Math.max(1, Math.round(item.localMarketPricePerKg * approxUnitWeightKg)),
        displayUnitLabel: compareUnitName,
        approxWeightText: `1 ${compareUnitName} ≈ ${weightBadge}`,
      };
    }
  }, [
    hasUnitComparison,
    approxUnitWeightKg,
    effectivePrice,
    item.pricePerKg,
    item.localMarketPricePerKg,
    unitLabel,
    compareUnitName,
    isGaddi,
    isPiece,
    priceViewMode,
  ]);

  const handleShareProduct = () => {
    const userRefCode = user.referralCode || `TAZA-${user.flat || '402'}`;
    const productPrice = effectivePrice;
    const shareText =
      lang === 'hi' || lang === 'mr'
        ? `🛒 *ताज़ा APMC वाशी मंडी से सीधा!*\n\n*${displayName}* केवल ₹${productPrice}/${unitLabel} में!\n\n🎁 मेरे रेफ़रल लिंक से कम से कम *₹150* का ऑर्डर करें और पाएँ *₹30 की छूट + 1 मुफ्त ताज़ा उपहार* (ऑर्डर डिलीवरी व पेमेंट कन्फ़र्म होने पर ₹50 कैशबैक नियम लागू):\n${window.location.origin}/?ref=${userRefCode}&p=${item.id}\n\n(ताज़ाMandi - APMC Vashi Wholesale Direct)`
        : `🛒 *Direct from APMC Vashi Mandi!*\n\nGet *${displayName}* at just ₹${productPrice}/${unitLabel}!\n\n🎁 Order min *₹150* via my referral link & unlock *₹30 Instant Discount + 1 Free Fresh Gift* (₹50 referral cashback unlocks on delivery & payment confirmation):\n${window.location.origin}/?ref=${userRefCode}&p=${item.id}\n\n(ताज़ाMandi - APMC Vashi Wholesale Direct)`;

    const waHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    setShareWhatsappHref(waHref);

    if (navigator.share) {
      navigator
        .share({
          title: displayName,
          text: shareText,
          url: `${window.location.origin}/?ref=${userRefCode}&p=${item.id}`,
        })
        .catch(() => {
          try {
            navigator.clipboard?.writeText(shareText);
          } catch {}
        });
    } else {
      try {
        navigator.clipboard?.writeText(shareText);
      } catch {}
    }
    setShareToast(true);
    setTimeout(() => setShareToast(false), 6000);
  };

  const cardThemeClass =
    activeUiSample === 'quick_mart'
      ? 'bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md'
      : activeUiSample === 'fresh_boutique'
      ? 'bg-[#fcfaf5] dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl hover:border-stone-300 hover:shadow-sm'
      : activeUiSample === 'hybrid_superapp'
      ? 'bg-white dark:bg-slate-900 border border-teal-200/80 dark:border-teal-900/60 rounded-2xl shadow-sm hover:shadow-md'
      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm';

  const mediaAspectClass = activeUiSample === 'quick_mart' ? 'aspect-square' : 'aspect-[4/3]';

  return (
    <div className="w-full">
      <div className={`${cardThemeClass} overflow-hidden flex flex-col justify-between transition-all h-full`}>
        {/* Top Media Viewer: Dynamic Slides (Photo · Health Benefits · Recipe Video) */}
        <div className={`relative ${mediaAspectClass} w-full bg-slate-100 dark:bg-slate-800 overflow-hidden group`}>
          {/* SLIDE 1: Real Verified Mandi Photo */}
          {activeSlide === 'photo' && (
            <>
              {!imageLoaded && !imageFailed && Boolean(visualAsset) && (
                <div
                  className="absolute inset-0 skeleton-shimmer opacity-80 pointer-events-none"
                  aria-hidden="true"
                />
              )}

              {!imageFailed && Boolean(visualAsset) ? (
                <img
                  ref={heroImgRef}
                  src={visualAsset}
                  alt={displayName}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageFailed(true)}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  } ${item.isAvailable === false ? 'grayscale opacity-70' : ''}`}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-950/40 text-center">
                  <ImageIcon className="w-8 h-8 text-emerald-600/60 mb-1.5" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {displayName}
                  </span>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none" />

              {/* Clean Typographic Origin Line inside Bottom Scrim */}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-white/95 font-medium pointer-events-none">
                <span className="truncate">
                  {itemNumber ? `#${itemNumber} · ` : ''}
                  {item.origin} · Grade-A
                </span>
              </div>

              {/* Minimal Top-Right Status Marker ONLY when relevant (discount / out-of-stock / seasonal) */}
              {(item.isAvailable === false || hasDiscount || item.isSeasonal) && (
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10">
                  {item.isAvailable === false ? (
                    <span className="bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {pickLang(lang, {
                        en: 'Out of Stock',
                        hi: 'स्टॉक समाप्त',
                        mr: 'साठा संपला',
                      })}
                    </span>
                  ) : hasDiscount ? (
                    <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded tabular-nums">
                      {discountPct}% OFF
                    </span>
                  ) : item.isSeasonal ? (
                    <span className="bg-amber-500/95 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {pickLang(lang, { en: 'Seasonal', hi: 'मौसमी', mr: 'हंगामी' })}
                    </span>
                  ) : null}
                </div>
              )}
            </>
          )}

          {/* SLIDE 2: Per-Product Health Benefits Card */}
          {activeSlide === 'benefits' && featureFlags.healthBenefitsSlide && (
            <div className="w-full h-full p-3.5 sm:p-4 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 text-white flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-1">
                  <span className="flex items-center gap-1 truncate">
                    <HeartPulse className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{health.nutrients}</span>
                  </span>
                </div>
                <h4 className="text-xs sm:text-[13px] font-black text-white leading-snug mb-2">
                  {health.headline}
                </h4>
                <ul className="space-y-1.5 text-[11px] text-emerald-50/95">
                  {health.benefits.slice(0, 3).map((b, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-emerald-700/60 flex items-center justify-between gap-2 text-[10px] text-emerald-200 mt-1">
                <span className="truncate">✓ {health.bestFor}</span>
                {onOpenInsights && featureFlags.productInsightsModal && (
                  <button
                    type="button"
                    onClick={() => onOpenInsights(item)}
                    className="text-amber-300 hover:text-amber-200 font-bold underline shrink-0 cursor-pointer"
                  >
                    {pickLang(lang, { en: 'More', hi: 'पूरा गाइड', mr: 'सविस्तर' })}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SLIDE 3: Recipe & Preparation Video Slide */}
          {activeSlide === 'video' && featureFlags.youtubeRecipeVideos && (
            <div className="w-full h-full bg-slate-950 text-white relative flex flex-col justify-between">
              {isVideoPlaying ? (
                <iframe
                  src={`${videoResolution.primaryVideo.embedUrl}&autoplay=1`}
                  title={videoResolution.primaryVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  <img
                    src={videoResolution.primaryVideo.thumbnailUrl}
                    alt={videoResolution.primaryVideo.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-75"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25 flex flex-col items-center justify-center p-3 text-center">
                    <button
                      type="button"
                      onClick={() => setIsVideoPlaying(true)}
                      className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer mb-2"
                      aria-label="Play Recipe Video"
                    >
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </button>
                    <p className="text-[11px] font-bold text-white line-clamp-2 max-w-[90%]">
                      {videoResolution.isExactMatch
                        ? videoResolution.primaryVideo.title
                        : pickLang(lang, {
                            en: `${displayName}: Watch Recipe & Kitchen Guide`,
                            hi: `${displayName}: आसान भारतीय रेसिपी वीडियो देखें`,
                            mr: `${displayName}: सोपी भारतीय रेसिपी व्हिडिओ पहा`,
                          })}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-200">
                      <span>{videoResolution.primaryVideo.channel}</span>
                      <span>·</span>
                      <a
                        href={videoResolution.youtubeSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-bold underline"
                      >
                        <span>
                          {pickLang(lang, {
                            en: 'All Recipes',
                            hi: 'सभी रेसिपी खोजें',
                            mr: 'सर्व रेसिपी',
                          })}
                        </span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Subtle Left / Right Slide Arrows */}
          {availableSlides.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => cycleSlide(-1)}
                aria-label="Previous slide"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer z-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => cycleSlide(1)}
                aria-label="Next slide"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer z-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Clean Dynamic Slide Bar below Photo */}
        {availableSlides.length > 1 && (
          <div
            className={`grid ${
              availableSlides.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
            } border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold`}
          >
            <button
              type="button"
              onClick={() => setActiveSlide('photo')}
              className={`py-1.5 px-2 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeSlide === 'photo'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>{pickLang(lang, { en: 'Photo', hi: 'फ़ोटो', mr: 'फोटो' })}</span>
            </button>

            {featureFlags.healthBenefitsSlide && (
              <button
                type="button"
                onClick={() => setActiveSlide('benefits')}
                className={`py-1.5 px-2 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  activeSlide === 'benefits'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <HeartPulse className="w-3 h-3" />
                <span>{pickLang(lang, { en: 'Benefits', hi: 'फ़ायदे', mr: 'फायदे' })}</span>
              </button>
            )}

            {featureFlags.youtubeRecipeVideos && (
              <button
                type="button"
                onClick={() => setActiveSlide('video')}
                className={`py-1.5 px-2 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  activeSlide === 'video'
                    ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 font-bold border-b-2 border-pink-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Play className="w-3 h-3" />
                <span>{pickLang(lang, { en: 'Video', hi: 'वीडियो', mr: 'व्हिडिओ' })}</span>
              </button>
            )}
          </div>
        )}

        {/* Simplified Clean Card Content */}
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Name + Variety + Tabular Rate */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0">
                <h3
                  className={`font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-snug ${
                    activeUiSample === 'fresh_boutique' ? 'font-serif' : ''
                  }`}
                >
                  {displayName}
                </h3>
                {item.variety && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.variety}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0 tabular-nums">
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                    {comparisonPricing.isShowingConverted ? '≈ ' : ''}₹{comparisonPricing.displayPrice}
                  </span>
                  {hasDiscount && (
                    <span className="text-[11px] line-through text-slate-400 font-mono">
                      ₹{comparisonPricing.displayBasePrice}
                    </span>
                  )}
                  <span className="text-[11px] font-medium text-slate-500">
                    /{comparisonPricing.displayUnitLabel}
                  </span>
                </div>
                {featureFlags.rateSavingsSuggestions && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    {pickLang(lang, {
                      en: 'Save',
                      hi: 'बचत',
                      mr: 'बचत',
                      hinglish: 'Bachat',
                    })}{' '}
                    ₹{Math.max(0, comparisonPricing.displayMarketPrice - comparisonPricing.displayPrice)}
                  </div>
                )}
              </div>
            </div>

            {/* 1-Line Health Benefit Summary */}
            {featureFlags.healthBenefitsSlide && (
              <div
                onClick={() => setActiveSlide('benefits')}
                className="mt-1.5 mb-2 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5 cursor-pointer hover:underline"
              >
                <HeartPulse className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{health.headline}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mb-2.5">
              {cleanDescription}
            </p>

            {/* Optional Compact kg <-> unit toggle */}
            {hasUnitComparison && featureFlags.unitConversionToggle && (
              <div className="flex items-center justify-between gap-2 mb-2.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 truncate">
                  <ArrowLeftRight className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{comparisonPricing.approxWeightText}</span>
                </span>
                <div className="inline-flex rounded bg-slate-100 dark:bg-slate-800 p-0.5 shrink-0 font-bold">
                  <button
                    type="button"
                    onClick={() => setPriceViewMode('kg')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      priceViewMode === 'kg'
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lang === 'mr' || lang === 'hi' ? '₹/किलो' : '₹/kg'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceViewMode('unit')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      priceViewMode === 'unit'
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ₹/{compareUnitName}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quantity Presets + Stepper + Action Row */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>
                {pickLang(lang, {
                  en: `Quantity (${unitLabel}):`,
                  hi: isGaddi ? 'गड्डी चुनें:' : isPiece ? 'पीस चुनें:' : 'मात्रा चुनें:',
                  mr: isGaddi ? 'जुडी निवडा:' : isPiece ? 'नग निवडा:' : 'प्रमाण निवडा:',
                  hinglish: `Quantity (${unitLabel}):`,
                })}
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                ₹{Math.round((userSelectedKg > 0 ? userSelectedKg : selectedWeight) * effectivePrice)}
              </span>
            </div>

            <div className={`grid gap-1 mb-2 ${presets.length <= 4 ? 'grid-cols-4' : 'grid-cols-6'}`}>
              {presets.map((val) => {
                const isActive = (userSelectedKg > 0 ? userSelectedKg : selectedWeight) === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleWeightChange(val)}
                    className={`py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-emerald-700 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {formatQtyLabel(val)}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/90 rounded-lg p-1 mb-2.5">
              <button
                type="button"
                onClick={() =>
                  handleWeightChange((userSelectedKg > 0 ? userSelectedKg : selectedWeight) - stepIncrement)
                }
                className="w-8 h-7 flex items-center justify-center rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
                aria-label="Decrease weight"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  step={stepIncrement}
                  min={isGaddi || isPiece ? 1 : 0}
                  max={50}
                  value={userSelectedKg > 0 ? userSelectedKg : selectedWeight}
                  onChange={(e) => handleWeightChange(parseFloat(e.target.value) || 0)}
                  className="w-14 text-center font-bold text-sm bg-transparent border-0 text-slate-900 dark:text-slate-100 focus:outline-none font-mono tabular-nums"
                />
                <span className="text-xs font-medium text-slate-500">{unitLabel}</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleWeightChange((userSelectedKg > 0 ? userSelectedKg : selectedWeight) + stepIncrement)
                }
                className="w-8 h-7 flex items-center justify-center rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
                aria-label="Increase weight"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Primary Add to Bag / Cart Stepper */}
            {item.isAvailable === false ? (
              <div className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-bold text-center">
                {pickLang(lang, {
                  en: 'Temporarily Out of Stock',
                  hi: 'अस्थायी रूप से स्टॉक समाप्त',
                  mr: 'सध्या साठा उपलब्ध नाही',
                })}
              </div>
            ) : userSelectedKg > 0 ? (
              <div className="flex items-center justify-between bg-emerald-700 text-white rounded-xl overflow-hidden p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const step = isPiece || isGaddi ? 1 : stepIncrement;
                    setProduceCartQty(item.id, Math.max(0, userSelectedKg - step));
                  }}
                  className="w-9 h-8 flex items-center justify-center hover:bg-emerald-800 rounded-lg cursor-pointer"
                  aria-label="Decrease cart quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center font-black text-xs px-1 tabular-nums">
                  <span>
                    {userSelectedKg} {unitLabel}
                  </span>
                  <span className="text-[10px] text-emerald-200 ml-1.5 font-normal">
                    (₹{Math.round(userSelectedKg * effectivePrice)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const step = isPiece || isGaddi ? 1 : stepIncrement;
                    setProduceCartQty(item.id, userSelectedKg + step);
                  }}
                  className="w-9 h-8 flex items-center justify-center hover:bg-emerald-800 rounded-lg cursor-pointer"
                  aria-label="Increase cart quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-black text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 ${
                  justAdded
                    ? 'bg-emerald-800 scale-98'
                    : 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      {pickLang(lang, {
                        en: 'Added to Cart!',
                        hi: 'थैली में जोड़ा गया!',
                        mr: 'पिशवीत जोडले!',
                      })}
                    </span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>
                      {pickLang(lang, {
                        en: 'Add to Cart',
                        hi: 'थैली में जोड़ें',
                        mr: 'पिशवीत जोडा',
                      })}{' '}
                      ({selectedWeight} {unitLabel})
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Compact Utility Row: Details/Slabs/Tips + Share ₹50 */}
            {(Boolean(onOpenInsights && featureFlags.productInsightsModal) ||
              (featureFlags.productShareButtons && featureFlags.referralProgram)) && (
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                {onOpenInsights && featureFlags.productInsightsModal ? (
                  <button
                    type="button"
                    onClick={() => onOpenInsights(item)}
                    className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {pickLang(lang, {
                        en: 'Slabs, Pool & Tips',
                        hi: 'भाव स्लैब व टिप्स',
                        mr: 'दर स्लॅब व माहिती',
                      })}
                    </span>
                  </button>
                ) : (
                  <span />
                )}

                {featureFlags.productShareButtons && featureFlags.referralProgram && (
                  <button
                    type="button"
                    onClick={handleShareProduct}
                    className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>
                      {pickLang(lang, {
                        en: 'Share · ₹50',
                        hi: 'शेयर ₹50',
                        mr: 'शेअर ₹५०',
                      })}
                    </span>
                  </button>
                )}
              </div>
            )}

            {shareToast && (
              <div className="mt-1.5 p-1.5 text-[10px] font-bold text-center text-emerald-800 bg-emerald-100 dark:bg-emerald-900/60 dark:text-emerald-200 rounded flex flex-col items-center gap-1">
                <span>
                  {pickLang(lang, {
                    en: '✓ Link copied! Earn ₹50 when a neighbor orders',
                    hi: '✓ लिंक कॉपी! पड़ोसी के ऑर्डर पर ₹50 कैशबैक',
                    mr: '✓ लिंक कॉपी! शेजाऱ्याच्या ऑर्डरवर ₹५० कॅशबॅक',
                  })}
                </span>
                {shareWhatsappHref && (
                  <a
                    href={shareWhatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[10px]"
                  >
                    <Share2 className="w-2.5 h-2.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            )}

            <div className="mt-1.5 text-[10px] text-slate-400 text-center">
              {isBefore11PmCutoff
                ? pickLang(lang, {
                    en: 'Tomorrow 10 AM Home Delivery',
                    hi: 'कल सुबह 10 बजे होम डिलीवरी',
                    mr: 'उद्या सकाळी १० वाजता डिलिव्हरी',
                  })
                : pickLang(lang, {
                    en: 'Next-Day Morning Lot (After 11 PM)',
                    hi: 'परसों सुबह का लॉट (11 PM के बाद)',
                    mr: 'परवा सकाळचा लॉट (११ PM नंतर)',
                  })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

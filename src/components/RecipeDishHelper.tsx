import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SafeProductImg } from './SafeProductImg';
import { pickLang, resolveLocalizedProduceName } from '../utils/i18nHelper';
import {
  VERIFIED_DISH_VIDEOS,
  findVerifiedRecipeVideos,
  VerifiedRecipeVideo,
} from '../data/verifiedRecipeVideos';
import {
  ChefHat,
  Plus,
  Check,
  Sparkles,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Youtube,
  ExternalLink,
  Search,
  Play,
  X,
} from 'lucide-react';

interface DishRecipe {
  id: string;
  emoji: string;
  youtubeQuery: string;
  name: {
    en: string;
    hi: string;
    mr: string;
    hinglish: string;
    gu?: string;
    bn?: string;
    ta?: string;
    te?: string;
    kn?: string;
    pa?: string;
  };
  subtitle: { en: string; hi: string; mr: string; hinglish: string };
  ingredientIds: string[];
}

const DISH_RECIPES: DishRecipe[] = [
  {
    id: 'aloo_gobhi',
    emoji: '🥘',
    youtubeQuery: 'Aloo Gobhi Masala dhaba style best recipe hindi',
    name: {
      en: 'Aloo Gobhi',
      hi: 'आलू गोभी की भाजी',
      mr: 'बटाटा फ्लॉवर भाजी',
      hinglish: 'Aloo Gobhi Bhaji',
      gu: 'બટાકા ફ્લાવરનું શાક',
      bn: 'আলু ফুলকপির তরকারি',
      ta: 'ஆலு கோபி மசாலா',
      te: 'ఆలూ గోబీ కూర',
      kn: 'ಆಲೂ ಗೋಬಿ ಪಲ್ಯ',
      pa: 'ਆਲੂ ਗੋਭੀ ਦੀ ਸਬਜ਼ੀ',
    },
    subtitle: {
      en: 'Potato, Cauliflower, Tomato, Chilli & Coriander',
      hi: 'आलू, फूलगोभी, टमाटर, हरी मिर्च व धनिया',
      mr: 'बटाटा, फ्लॉवर, टोमॅटो, मिरची व कोथिंबीर',
      hinglish: 'Aloo, Gobhi, Tomato, Mirchi & Dhaniya',
    },
    ingredientIds: [
      'root_potato',
      'veg_cauliflower',
      'veg_tomato',
      'root_onion',
      'veg_green_chilli',
      'root_ginger',
      'herb_coriander',
    ],
  },
  {
    id: 'bhindi_masala',
    emoji: '🌿',
    youtubeQuery: 'Bhindi Masala crispy restaurant style best recipe hindi',
    name: {
      en: 'Bhindi Masala',
      hi: 'मसाला भिंडी',
      mr: 'मसाला भेंडी',
      hinglish: 'Bhindi Masala',
      gu: 'ભરેલા ભીંડા / મસાલા ભીંડા',
      bn: 'মসালা ঢেঁড়স ভাজা',
      ta: 'வெண்டைக்காய் மசாலா',
      te: 'బెండకాయ మసాలా',
      kn: 'ಬೆಂಡೆಕಾಯಿ ಮಸಾಲ',
      pa: 'ਮਸਾਲਾ ਭਿੰਡੀ',
    },
    subtitle: {
      en: 'Lady Finger, Onion, Tomato, Lemon & Chilli',
      hi: 'ताज़ी भिंडी, प्याज़, टमाटर, नींबू व हरी मिर्च',
      mr: 'ताजी भेंडी, कांदा, टोमॅटो, लिंबू व मिरची',
      hinglish: 'Bhindi, Pyaaz, Tomato, Nimbu & Mirchi',
    },
    ingredientIds: [
      'veg_okra',
      'root_onion',
      'veg_tomato',
      'citrus_lemon',
      'veg_green_chilli',
      'root_garlic',
      'herb_coriander',
    ],
  },
  {
    id: 'pav_bhaji',
    emoji: '🍲',
    youtubeQuery: 'Mumbai Street Style Pav Bhaji best chef recipe hindi',
    name: {
      en: 'Pav Bhaji / Mix Veg',
      hi: 'पाव भाजी / मिक्स वेज',
      mr: 'पाव भाजी / मिक्स व्हेज',
      hinglish: 'Pav Bhaji / Mix Veg',
      gu: 'મુંબઈ પાવ ભાજી / મિક્સ શાક',
      bn: 'মুম্বাই পাও ভাজি',
      ta: 'பாவ் பாஜி மசாலா',
      te: 'పావ్ భాజీ మసాలా',
      kn: 'ಪಾವ್ ಬಾಜಿ ಮಸಾಲ',
      pa: 'ਮੁੰਬਈ ਪਾਵ ਭਾਜੀ',
    },
    subtitle: {
      en: 'Potato, Peas, Cauliflower, Capsicum, Carrot & Lemon',
      hi: 'आलू, हरी मटर, फूलगोभी, शिमला मिर्च, गाजर व नींबू',
      mr: 'बटाटा, मटार, फ्लॉवर, सिमला मिरची, गाजर व लिंबू',
      hinglish: 'Aloo, Matar, Gobhi, Capsicum, Gajar & Nimbu',
    },
    ingredientIds: [
      'root_potato',
      'veg_cauliflower',
      'veg_green_peas',
      'veg_capsicum',
      'veg_tomato',
      'root_onion',
      'root_carrot',
      'citrus_lemon',
      'herb_coriander',
    ],
  },
  {
    id: 'palak_dal',
    emoji: '🥬',
    youtubeQuery: 'Dal Palak Lasooni Palak dhaba style best recipe',
    name: {
      en: 'Dal Palak / Palak Paneer',
      hi: 'दाल पालक / पालक पनीर',
      mr: 'डाळ पालक / पालक पनीर',
      hinglish: 'Dal Palak / Palak Paneer',
      gu: 'દાળ પાલક / પાલક પનીર',
      bn: 'পালং পনির / ডাল পালং',
      ta: 'பாலக் பன்னீர் / கீரை கூட்டு',
      te: 'పాలక్ పనీర్ / పప్పు పాలకూర',
      kn: 'ಪಾಲಕ್ ಪನ್ನೀರ್',
      pa: 'ਦਾਲ ਪਾਲਕ / ਪਾਲਕ ਪਨੀਰ',
    },
    subtitle: {
      en: 'Fresh Spinach, Garlic, Onion, Tomato & Ginger',
      hi: 'ताज़ी पालक गड्डी, लहसुन, प्याज़, टमाटर व अदरक',
      mr: 'ताजी पालक जुडी, लसूण, कांदा, टोमॅटो व आले',
      hinglish: 'Palak, Lahsun, Pyaaz, Tomato & Adrak',
    },
    ingredientIds: [
      'leafy_palak',
      'root_garlic',
      'root_onion',
      'veg_tomato',
      'root_ginger',
      'veg_green_chilli',
      'citrus_lemon',
    ],
  },
  {
    id: 'baingan_bharta',
    emoji: '🍆',
    youtubeQuery: 'Punjabi Baingan Bharta smoky roasted best recipe hindi',
    name: {
      en: 'Baingan Bharta',
      hi: 'बैंगन भर्ता',
      mr: 'वांग्याचं भरीत',
      hinglish: 'Baingan Bharta',
      gu: 'રીંગણનો ઓળો',
      bn: 'বেগুন ভর্তা / পোড়া',
      ta: 'கத்திரிக்காய் சுட்ட மசியல்',
      te: 'వంకాయ కాల్చిన పచ్చడి',
      kn: 'ಬದನೆಕಾಯಿ ಬರ್ತಾ',
      pa: 'ਬੈਂਗਣ ਦਾ ਭੜਥਾ',
    },
    subtitle: {
      en: 'Brinjal, Tomato, Onion, Green Peas & Garlic',
      hi: 'ताज़ा बैंगन, टमाटर, प्याज़, मटर, लहसुन व धनिया',
      mr: 'ताजी वांगी, टोमॅटो, कांदा, मटार व कोथिंबीर',
      hinglish: 'Baingan, Tomato, Pyaaz, Matar & Lahsun',
    },
    ingredientIds: [
      'veg_brinjal',
      'veg_tomato',
      'root_onion',
      'veg_green_peas',
      'root_garlic',
      'veg_green_chilli',
      'herb_coriander',
    ],
  },
  {
    id: 'salad_raita',
    emoji: '🥗',
    youtubeQuery: 'Indian Kachumber Salad & Mint Raita refreshing recipe',
    name: {
      en: 'Tadka & Fresh Salad',
      hi: 'ताज़ा सलाद व रायता',
      mr: 'ताजे कोशिंबीर व रायता',
      hinglish: 'Fresh Salad & Raita',
      gu: 'તાજું કચુંબર અને રાયતું',
      bn: 'টাটকা সালাদ ও রায়তা',
      ta: 'புதிய சாலட் & பச்சடி',
      te: 'ఫ్రెష్ సలాడ్ & రైతా',
      kn: 'ತಾಜಾ ಸಲಾಡ್ ಮತ್ತು ಕೋಸಂಬರಿ',
      pa: 'ਤਾਜ਼ਾ ਸਲਾਦ ਤੇ ਰਾਇਤਾ',
    },
    subtitle: {
      en: 'Cucumber, Carrot, Beetroot, Tomato, Mint & Lemon',
      hi: 'खीरा, गाजर, चुकंदर, टमाटर, पुदीना व नींबू',
      mr: 'काकडी, गाजर, बीट, टोमॅटो, पुदिना व लिंबू',
      hinglish: 'Kheera, Gajar, Beetroot, Tomato & Pudina',
    },
    ingredientIds: [
      'veg_cucumber',
      'root_carrot',
      'root_beetroot',
      'veg_tomato',
      'root_onion',
      'citrus_lemon',
      'herb_mint',
      'herb_coriander',
    ],
  },
  {
    id: 'fruit_chaat',
    emoji: '🍉',
    youtubeQuery: 'Healthy Masala Fresh Fruit Chaat & Bowl recipe',
    name: {
      en: 'Seasonal Fruit Bowl',
      hi: 'ताज़ा मौसमी फ्रूट चाट',
      mr: 'हंगामी फ्रूट बाऊल',
      hinglish: 'Fresh Fruit Bowl',
      gu: 'તાજું ફ્રૂટ ચાટ',
      bn: 'মৌসুমি ফ্রুট চাট',
      ta: 'பழ சாலட்',
      te: 'ఫ్రెష్ ఫ్రూట్ బౌల్',
      kn: 'ಹಣ್ಣಿನ ಚಾಟ್',
      pa: 'ਤਾਜ਼ਾ ਫਰੂਟ ਚਾਟ',
    },
    subtitle: {
      en: 'Apple, Banana, Pomegranate, Papaya, Grapes & Watermelon',
      hi: 'सेब, केला, अनार, पपीता, अंगूर व तरबूज',
      mr: 'सफरचंद, केळी, डाळिंब, पपई, द्राक्षे व कलिंगड',
      hinglish: 'Seb, Kela, Anar, Papaya, Grapes & Watermelon',
    },
    ingredientIds: [
      'fruit_apple',
      'fruit_banana',
      'fruit_pomegranate',
      'fruit_papaya',
      'fruit_grapes_green',
      'fruit_watermelon',
      'citrus_lemon',
    ],
  },
];

export const RecipeDishHelper: React.FC = () => {
  const { produceList, produceCart, setProduceCartQty, lang, featureFlags } = useApp();
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [customRecipeQuery, setCustomRecipeQuery] = useState('');
  const [activeEmbedVideo, setActiveEmbedVideo] = useState<VerifiedRecipeVideo | null>(null);
  const [loadedThumbs, setLoadedThumbs] = useState<Record<string, boolean>>({});
  const [embedLoading, setEmbedLoading] = useState(false);

  useEffect(() => {
    if (activeEmbedVideo) {
      setEmbedLoading(true);
    } else {
      setEmbedLoading(false);
    }
  }, [activeEmbedVideo?.videoId]);

  const selectedDish = useMemo(
    () => DISH_RECIPES.find((d) => d.id === selectedDishId) || null,
    [selectedDishId]
  );

  const selectedDishVideos = useMemo(
    () => (selectedDish ? VERIFIED_DISH_VIDEOS[selectedDish.id] || [] : []),
    [selectedDish]
  );

  const matchedSearchVideos = useMemo(() => {
    if (!customRecipeQuery.trim()) return [];
    return findVerifiedRecipeVideos(customRecipeQuery, 3);
  }, [customRecipeQuery]);

  const resolvedIngredients = useMemo(() => {
    if (!selectedDish) return [];
    return selectedDish.ingredientIds
      .map((id) => produceList.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p && p.isAvailable !== false));
  }, [selectedDish, produceList]);

  const missingIngredients = useMemo(
    () => resolvedIngredients.filter((p) => !(produceCart[p.id] > 0)),
    [resolvedIngredients, produceCart]
  );

  const missingEstimateTotal = useMemo(() => {
    return missingIngredients.reduce((sum, p) => {
      const unitRate =
        p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.pricePerKg
          ? p.discountPrice
          : p.pricePerKg;
      return sum + Math.round((p.defaultKg || 1) * unitRate);
    }, 0);
  }, [missingIngredients]);

  const getUnitShort = (unit?: string) => {
    if (unit === 'gaddi') return lang === 'mr' ? 'जुडी' : lang === 'hi' ? 'गड्डी' : 'Gaddi';
    if (unit === 'piece') return lang === 'mr' ? 'नग' : lang === 'hi' ? 'पीस' : 'Pc';
    return 'kg';
  };

  const handleAddAllMissing = () => {
    if (!selectedDish) return;
    missingIngredients.forEach((p) => {
      setProduceCartQty(p.id, p.defaultKg || 1);
    });
  };

  const primaryCustomOrSearchUrl = useMemo(() => {
    if (matchedSearchVideos.length > 0 && customRecipeQuery.trim()) {
      return matchedSearchVideos[0].url;
    }
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${customRecipeQuery.trim() || 'Indian daily sabzi'} best chef recipe hindi`
    )}`;
  }, [matchedSearchVideos, customRecipeQuery]);

  const renderVideoCard = (vid: VerifiedRecipeVideo) => {
    const isPlayingHere = activeEmbedVideo?.videoId === vid.videoId;
    return (
      <div
        key={vid.id}
        className={`rounded-xl border overflow-hidden bg-slate-50 dark:bg-slate-800/80 transition-all ${
          isPlayingHere
            ? 'border-rose-500 ring-2 ring-rose-500/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-rose-300'
        }`}
      >
        <div className="flex items-start gap-2.5 p-2">
          <button
            type="button"
            onClick={() => setActiveEmbedVideo(isPlayingHere ? null : vid)}
            className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-900 group cursor-pointer"
            title={pickLang(lang, {
              en: 'Play Recipe Video Here',
              hi: 'यहीं वीडियो चलाएं',
              mr: 'येथे व्हिडिओ पहा',
            })}
          >
            {!loadedThumbs[vid.videoId] && (
              <span className="absolute inset-0 skeleton-shimmer" aria-hidden="true" />
            )}
            <img
              src={vid.thumbnailUrl}
              alt={vid.title}
              loading="lazy"
              onLoad={() =>
                setLoadedThumbs((prev) =>
                  prev[vid.videoId] ? prev : { ...prev, [vid.videoId]: true }
                )
              }
              onError={() =>
                setLoadedThumbs((prev) =>
                  prev[vid.videoId] ? prev : { ...prev, [vid.videoId]: true }
                )
              }
              className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${
                loadedThumbs[vid.videoId] ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <span className="absolute inset-0 bg-black/35 flex items-center justify-center">
              <span className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md">
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              </span>
            </span>
          </button>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wide truncate">
              ▶ {vid.channel}
            </div>
            <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
              {vid.title}
            </div>
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveEmbedVideo(isPlayingHere ? null : vid)}
                className="px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-2.5 h-2.5 fill-white" />
                <span>
                  {isPlayingHere
                    ? pickLang(lang, { en: 'Hide Player', hi: 'बंद करें', mr: 'बंद करा' })
                    : pickLang(lang, { en: 'Play Here', hi: 'यहीं देखें', mr: 'येथे पहा' })}
                </span>
              </button>
              <a
                href={vid.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center gap-1"
              >
                <Youtube className="w-3 h-3" />
                <span>YouTube</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!featureFlags.dishRecipeHelper) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/70 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
      {/* Header + Custom Dish YouTube Video Finder */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
              {featureFlags.youtubeRecipeVideos
                ? pickLang(lang, {
                    en: 'What are you cooking today? (1-Tap Basket & Verified Chef Videos)',
                    hi: 'आज कौन सी भाजी बनानी है? (1-क्लिक सामग्री + बेस्ट Chef YouTube वीडियो)',
                    mr: 'आज कोणती भाजी बनवायची आहे? (१-क्लिक साहित्य + बेस्ट Chef YouTube व्हिडिओ)',
                    hinglish: 'Aaj kaun si Bhaji banani hai? (1-Click Basket + Best YouTube Videos)',
                    gu: 'આજે કઈ વાનગી બનાવવી છે? (1-ક્લિક સામગ્રી + શેફ YouTube વિડિઓ)',
                    bn: 'আজ কী রান্না করবেন? (১-ক্লিক বাজার + সেরা শেফ YouTube ভিডিও)',
                    ta: 'இன்று என்ன சமைக்கிறீர்கள்? (1-தட்டு & சிறந்த சமையல் வீடியோ)',
                    te: 'ఈరోజు ఏ వంట చేస్తున్నారు? (1-క్లిక్ & బెస్ట్ YouTube వీడియోలు)',
                    kn: 'ಇಂದು ಏನು ಅಡುಗೆ ಮಾಡುತ್ತಿದ್ದೀರಿ? (ಬೆಸ್ಟ್ YouTube ರೆಸಿಪಿ ವೀಡಿಯೊ)',
                    pa: 'ਅੱਜ ਕੀ ਬਣਾਉਣਾ ਹੈ? (1-ਕਲਿੱਕ ਸਮੱਗਰੀ + ਬੈਸਟ YouTube ਵੀਡੀਓ)',
                  })
                : pickLang(lang, {
                    en: 'What are you cooking today? (1-Tap Ingredient Basket)',
                    hi: 'आज कौन सी भाजी बनानी है? (1-क्लिक ताज़ी सामग्री चुनें)',
                    mr: 'आज कोणती भाजी बनवायची आहे? (१-क्लिक ताजे साहित्य)',
                    hinglish: 'Aaj kaun si Bhaji banani hai? (1-Click Sabzi Basket)',
                  })}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {featureFlags.youtubeRecipeVideos
                ? pickLang(lang, {
                    en: 'Pick a dish for instant fresh ingredients and watch handpicked top chef recipes on YouTube',
                    hi: 'डिश चुनकर सामग्री जोड़ें और Ranveer Brar, Sanjyot Keer व Kabita’s Kitchen के चुनिंदा वीडियो देखें',
                    mr: 'डिश निवडा, साहित्य जोडा आणि नामांकित शेफचे YouTube व्हिडिओ पहा',
                    hinglish: 'Dish chunein, sabzi add karein aur top Indian chefs ke verified YouTube videos dekhein',
                  })
                : pickLang(lang, {
                    en: 'Select any popular dish below to quickly add all required fresh ingredients to your basket.',
                    hi: 'नीचे अपनी पसंद की डिश चुनें और सभी आवश्यक ताज़ी सब्ज़ियाँ 1 क्लिक में थैली में जोड़ें।',
                    mr: 'खालील डिश निवडा आणि सर्व ताजी भाजीपाला एका क्लिकवर बॅगमध्ये जोडा.',
                    hinglish: 'Niche dish chunein aur sabhi fresh sabziyan 1 click me cart me add karein.',
                  })}
            </p>
          </div>
        </div>

        {/* Custom Dish YouTube Video Finder */}
        {featureFlags.youtubeRecipeVideos && (
          <div className="flex items-center gap-1.5 w-full lg:w-auto lg:min-w-[330px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={customRecipeQuery}
                onChange={(e) => setCustomRecipeQuery(e.target.value)}
                placeholder={pickLang(lang, {
                  en: 'Type dish (Gajar Halwa, Methi, Lauki)...',
                  hi: 'रेसिपी लिखें (गाजर हलवा, मेथी, लौकी)...',
                  mr: 'रेसिपी लिहा (गाजर हलवा, मेथी, दुधी)...',
                  hinglish: 'Dish likhein (Gajar Halwa, Methi, Lauki)...',
                })}
                className="w-full pl-8 pr-2.5 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-rose-500"
              />
            </div>
            <a
              href={primaryCustomOrSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black flex items-center gap-1.5 shrink-0 shadow-xs transition-all active:scale-95"
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>
                {matchedSearchVideos.length > 0 && customRecipeQuery.trim()
                  ? pickLang(lang, {
                      en: 'Watch Best Video',
                      hi: 'बेस्ट वीडियो देखें',
                      mr: 'बेस्ट व्हिडिओ पहा',
                      hinglish: 'Watch Best Video',
                    })
                  : pickLang(lang, {
                      en: 'Watch YouTube',
                      hi: 'YouTube देखें',
                      mr: 'YouTube पहा',
                      hinglish: 'Watch YouTube',
                    })}
              </span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Live Matched Verified Recipe Videos for Custom Search Query */}
      {featureFlags.youtubeRecipeVideos && matchedSearchVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
          {matchedSearchVideos.map(renderVideoCard)}
        </div>
      )}

      {/* Dish Selection Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {DISH_RECIPES.map((dish) => {
          const isActive = selectedDishId === dish.id;
          return (
            <button
              key={dish.id}
              type="button"
              onClick={() => {
                setSelectedDishId(isActive ? null : dish.id);
                setActiveEmbedVideo(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50/60 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-emerald-200/80 dark:border-slate-700 hover:border-emerald-400'
              }`}
            >
              <span>{dish.emoji}</span>
              <span>{pickLang(lang, dish.name)}</span>
              {isActive ? (
                <ChevronUp className="w-3 h-3 opacity-80" />
              ) : (
                <ChevronDown className="w-3 h-3 opacity-60" />
              )}
            </button>
          );
        })}
      </div>

      {/* Inline Embedded Recipe Player (when user clicks "Play Here") */}
      {featureFlags.youtubeRecipeVideos && activeEmbedVideo && (
        <div className="rounded-2xl overflow-hidden border border-rose-300 dark:border-rose-800 bg-slate-950 shadow-md">
          <div className="px-3 py-2 bg-slate-900 text-white flex items-center justify-between gap-2 text-xs">
            <div className="truncate font-bold flex items-center gap-2">
              <Youtube className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="truncate">
                {activeEmbedVideo.channel} · {activeEmbedVideo.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveEmbedVideo(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative aspect-video w-full bg-black">
            {embedLoading && (
              <div
                className="absolute inset-0 z-10 skeleton-shimmer flex flex-col items-center justify-center gap-2 p-4"
                aria-label="Loading recipe video"
              >
                <div className="w-14 h-10 rounded-xl bg-rose-600/30 border border-rose-400/40 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white/80 fill-white/60" />
                </div>
                <div className="h-3 w-44 rounded bg-white/30 dark:bg-slate-600/50" />
              </div>
            )}
            <iframe
              src={activeEmbedVideo.embedUrl}
              title={activeEmbedVideo.title}
              onLoad={() => setEmbedLoading(false)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Expanded Ingredient Drawer + Verified Top YouTube Chef Videos */}
      {selectedDish && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {selectedDish.emoji} {pickLang(lang, selectedDish.name)} —{' '}
                  {pickLang(lang, selectedDish.subtitle)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {featureFlags.youtubeRecipeVideos && selectedDishVideos[0] && (
                <a
                  href={selectedDishVideos[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0"
                >
                  <Youtube className="w-3.5 h-3.5" />
                  <span>
                    {pickLang(lang, {
                      en: `Watch Best (${selectedDishVideos[0].channel})`,
                      hi: `बेस्ट वीडियो (${selectedDishVideos[0].channel})`,
                      mr: `बेस्ट व्हिडिओ (${selectedDishVideos[0].channel})`,
                      hinglish: `Watch (${selectedDishVideos[0].channel})`,
                    })}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {missingIngredients.length > 0 ? (
                <button
                  type="button"
                  onClick={handleAddAllMissing}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>
                    {pickLang(lang, {
                      en: `Add All Missing (${missingIngredients.length} · ₹${missingEstimateTotal})`,
                      hi: `सभी बाकी जोड़ें (${missingIngredients.length} आइटम · ₹${missingEstimateTotal})`,
                      mr: `सर्व बाकी जोडा (${missingIngredients.length} · ₹${missingEstimateTotal})`,
                      hinglish: `Add Missing (${missingIngredients.length} · ₹${missingEstimateTotal})`,
                    })}
                  </span>
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {pickLang(lang, {
                      en: 'All ingredients in cart!',
                      hi: 'पूरी सामग्री थैली में जुड़ चुकी है!',
                      mr: 'सर्व साहित्य पिशवीत आहे!',
                    })}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Curated Verified Chef YouTube Video Cards for Selected Dish */}
          {featureFlags.youtubeRecipeVideos && selectedDishVideos.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-rose-600" />
                <span>
                  {pickLang(lang, {
                    en: 'Verified Best YouTube Recipe Videos for this Dish:',
                    hi: 'इस डिश के लिए ऑनलाइन जांचे गए बेस्ट YouTube रेसिपी वीडियो:',
                    mr: 'या डिशसाठी सर्वोत्कृष्ट YouTube रेसिपी व्हिडिओ:',
                    hinglish: 'Is Dish ke Verified Best YouTube Recipe Videos:',
                  })}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {selectedDishVideos.map(renderVideoCard)}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {resolvedIngredients.map((item) => {
              const qtyInCart = produceCart[item.id] || 0;
              const isInCart = qtyInCart > 0;
              const unitRate =
                item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.pricePerKg
                  ? item.discountPrice
                  : item.pricePerKg;
              const unitTxt = getUnitShort(item.pricingUnit);
              const defaultQty = item.defaultKg || 1;

              return (
                <div
                  key={item.id}
                  className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                    isInCart
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <SafeProductImg
                      product={item}
                      alt={item.name.en}
                      className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {resolveLocalizedProduceName(item.name, lang, item.id)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ₹{unitRate}/{unitTxt}
                      </div>
                    </div>
                  </div>

                  {isInCart ? (
                    <span className="px-2 py-1 rounded-lg bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3" />
                      <span>
                        {qtyInCart} {unitTxt}
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setProduceCartQty(item.id, defaultQty)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-emerald-700 hover:text-white text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[10px] font-black flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>
                        {defaultQty} {unitTxt}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

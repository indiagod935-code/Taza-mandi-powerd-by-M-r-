import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { AccessoryCategory } from '../types';
import { SafeProductImg } from './SafeProductImg';
import { pickLang, resolveLocalizedField, MultiLangMap } from '../utils/i18nHelper';
import {
  Smartphone,
  ShieldCheck,
  Zap,
  Plus,
  Minus,
  Check,
  Star,
  Search,
  Camera,
  Sparkles,
  Award,
} from 'lucide-react';

interface MobileAccessoriesViewProps {
  onOpenAccessoryStudio?: () => void;
  isAdminAuthorized?: boolean;
}

export const MobileAccessoriesView: React.FC<MobileAccessoriesViewProps> = ({
  onOpenAccessoryStudio,
  isAdminAuthorized = false,
}) => {
  const {
    accessoriesList,
    accessoryCart,
    addAccessoryToCart,
    setAccessoryCartQty,
    founderPhotoUrl,
    setFounderPhotoUrl,
    featureFlags,
    lang,
    t,
  } = useApp();

  const [selectedCat, setSelectedCat] = useState<AccessoryCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);
  const [photoUpdatedToast, setPhotoUpdatedToast] = useState(false);
  const founderFileRef = useRef<HTMLInputElement | null>(null);

  const categoryDefs: {
    id: AccessoryCategory;
    icon: string;
    labels: MultiLangMap;
  }[] = [
    {
      id: 'all',
      icon: '🛍️',
      labels: {
        en: 'All Gear',
        hi: 'सभी उत्पाद',
        mr: 'सर्व वस्तू',
        hinglish: 'All Items',
        gu: 'બધું ગિયર',
        bn: 'সব আইটেম',
        ta: 'அனைத்து பொருட்கள்',
        te: 'అన్ని వస్తువులు',
        kn: 'ಎಲ್ಲಾ ವಸ್ತುಗಳು',
        pa: 'ਸਾਰਾ ਸਾਮਾਨ',
      },
    },
    {
      id: 'chargers',
      icon: '⚡',
      labels: {
        en: 'Fast Chargers & Cables',
        hi: 'फास्ट चार्जर व केबल',
        mr: 'फास्ट चार्जर व केबल',
        hinglish: 'Fast Chargers & Cables',
        gu: 'ફાસ્ટ ચાર્જર',
        bn: 'ফাস্ট চার্জার',
        ta: 'பாஸ்ட் சார்ஜர்',
        te: 'ఫాస్ట్ ఛార్జర్',
        kn: 'ಫಾಸ್ಟ್ ಚಾರ್ಜರ್',
        pa: 'ਫਾਸਟ ਚਾਰਜਰ',
      },
    },
    {
      id: 'audio',
      icon: '🎧',
      labels: {
        en: 'Earbuds & Audio',
        hi: 'ईयरबड्स व ऑडियो',
        mr: 'इयरबड्स व ऑडिओ',
        hinglish: 'Earbuds & Audio',
        gu: 'ઈયરબડ્સ અને ઓડિયો',
        bn: 'ইয়ারবাডস ও অডিও',
        ta: 'இயர்பட்ஸ் & ஆடியோ',
        te: 'ఇయర్‌బడ్స్ & ఆడియో',
        kn: 'ಇಯರ್‌ಬಡ್ಸ್',
        pa: 'ਈਅਰਬਡਸ ਤੇ ਆਡੀਓ',
      },
    },
    {
      id: 'cases',
      icon: '📱',
      labels: {
        en: 'Phone Covers & Cases',
        hi: 'फोन कवर व केस',
        mr: 'फोन कव्हर व केस',
        hinglish: 'Covers & Cases',
        gu: 'ફોન કવર',
        bn: 'ফোন কভার',
        ta: 'போன் கவர்',
        te: 'ఫోన్ కవర్',
        kn: 'ಫೋನ್ ಕವರ್',
        pa: 'ਫੋਨ ਕਵਰ',
      },
    },
    {
      id: 'mounts',
      icon: '🧲',
      labels: {
        en: 'Car & Desk Mounts',
        hi: 'कार व डेस्क माउंट',
        mr: 'कार आणि डेस्क माउंट',
        hinglish: 'Car & Desk Mounts',
        gu: 'કાર માઉન્ટ',
        bn: 'কার মাউন্ট',
        ta: 'கார் மவுண்ட்',
        te: 'కార్ మౌంట్',
        kn: 'ಕಾರ್ ಮೌಂಟ್',
        pa: 'ਕਾਰ ਮਾਊਂਟ',
      },
    },
    {
      id: 'protection',
      icon: '🛡️',
      labels: {
        en: 'Screen Guards',
        hi: 'स्क्रीन ग्लास व सुरक्षा',
        mr: 'स्क्रीन ग्लास',
        hinglish: 'Screen Guards',
        gu: 'સ્ક્રીન ગાર્ડ',
        bn: 'স্ক্রিন গার্ড',
        ta: 'ஸ்கிரீன் கார்டு',
        te: 'స్క్రీన్ గార్డ్',
        kn: 'ಸ್ಕ್ರೀನ್ ಗಾರ್ಡ್',
        pa: 'ਸਕਰੀਨ ਗਾਰਡ',
      },
    },
    {
      id: 'powerbanks',
      icon: '🔋',
      labels: {
        en: 'Power Banks',
        hi: 'पावर बैंक',
        mr: 'पॉवर बँक',
        hinglish: 'Power Banks',
        gu: 'પાવર બેંક',
        bn: 'পাওয়ার ব্যাংক',
        ta: 'பவர் பேங்க்',
        te: 'పవర్ బ్యాంక్',
        kn: 'ಪವರ್ ಬ್ಯಾಂಕ್',
        pa: 'ਪਾਵਰ ਬੈਂਕ',
      },
    },
  ];

  const categoryCounts = useMemo(() => {
    const counts: Record<AccessoryCategory, number> = {
      all: accessoriesList.length,
      chargers: 0,
      audio: 0,
      cases: 0,
      mounts: 0,
      protection: 0,
      powerbanks: 0,
    };
    accessoriesList.forEach((acc) => {
      if (counts[acc.category] !== undefined) {
        counts[acc.category]++;
      }
    });
    return counts;
  }, [accessoriesList]);

  const filteredAccessories = useMemo(() => {
    return accessoriesList.filter((item) => {
      const matchCat = selectedCat === 'all' || item.category === selectedCat;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        item.name.en.toLowerCase().includes(q) ||
        item.name.hi.toLowerCase().includes(q) ||
        (item.name.hinglish && item.name.hinglish.toLowerCase().includes(q)) ||
        item.specs.some((s) => s.toLowerCase().includes(q)) ||
        item.brand.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [accessoriesList, selectedCat, searchQuery]);

  const handleQuickAdd = (id: string) => {
    addAccessoryToCart(id, 1);
    setAddedId(id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const handleFounderPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 480;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.86);
          setFounderPhotoUrl(compressed);
          setPhotoUpdatedToast(true);
          setTimeout(() => setPhotoUpdatedToast(false), 3000);
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const getCountLabel = (count: number) =>
    pickLang(lang, {
      en: `${count} ${count === 1 ? 'item' : 'items'}`,
      hi: `${count} प्रोडक्ट्स`,
      mr: `${count} वस्तू`,
      hinglish: `${count} items`,
      gu: `${count} વસ્તુઓ`,
      bn: `${count}টি আইটেম`,
      ta: `${count} பொருட்கள்`,
      te: `${count} వస్తువులు`,
      kn: `${count} ವಸ್ತುಗಳು`,
      pa: `${count} ਆਈਟਮਾਂ`,
    });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Category Hero Banner with MARCO 100 Founder Spotlight */}
      <div className="bg-linear-to-r from-slate-950 via-slate-900 to-emerald-950 border border-slate-800 rounded-2xl p-5 sm:p-7 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              <Smartphone className="w-4 h-4" />
              <span>MARCO 💯 Tech Accessories Hub</span>
              <span>·</span>
              <span>{t('warranty_badge')}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-white">
              {t('tech_shop_title')}
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('tech_shop_sub')}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>
                  {pickLang(lang, {
                    en: 'GaN 65W Superfast Charging',
                    hi: 'GaN 65W सुपरफास्ट चार्जिंग',
                    mr: 'GaN 65W सुपरफास्ट चार्जिंग',
                    hinglish: 'GaN 65W Superfast Charging',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  {pickLang(lang, {
                    en: '100% Tested MARCO Guarantee',
                    hi: 'MARCO 💯 असली व जाँची हुई क्वालिटी',
                    mr: 'MARCO 💯 तपासलेली अस्सल गुणवत्ता',
                    hinglish: 'MARCO 100 Tested Original Quality',
                  })}
                </span>
              </div>
            </div>

            {isAdminAuthorized && onOpenAccessoryStudio && (
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenAccessoryStudio}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {pickLang(lang, {
                      en: 'AI Product Photo Studio · Add Item',
                      hi: 'AI प्रोडक्ट फोटो स्टूडियो · नया आइटम जोड़ें',
                      mr: 'AI प्रॉडक्ट फोटो स्टुडिओ · नवीन वस्तू जोडा',
                      hinglish: 'AI Product Studio · Photo se Item Add Karein',
                    })}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* MARCO 100 Founder Spotlight Card */}
          <div className="bg-white/5 border border-white/15 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 backdrop-blur-xs shrink-0 max-w-sm">
            <div className="relative shrink-0">
              <img
                src={founderPhotoUrl}
                alt="MARCO 100 Founder"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/assets/images/marco_founder_portrait.jpg';
                }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-amber-400/80 shadow-lg"
              />
              <span className="absolute -bottom-1.5 -right-1.5 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                MARCO 💯
              </span>
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {pickLang(lang, {
                    en: 'Founder Verified Desk',
                    hi: 'फ़ाउंडर द्वारा प्रमाणित',
                    mr: 'संस्थापक प्रमाणित',
                    hinglish: 'Founder Verified Selection',
                  })}
                </span>
              </div>
              <p className="text-[11px] text-slate-200 leading-snug">
                {pickLang(lang, {
                  en: 'Every MARCO 100 charger, cable & audio gear is personally quality-checked before dispatch.',
                  hi: 'हर चार्जर, केबल व ईयरबड्स सीधे हमारी देखरेख में चेक होकर आपके घर पहुँचते हैं।',
                  mr: 'प्रत्येक चार्जर, केबल व इयरबड्स वैयक्तिकरीत्या तपासून पाठवले जातात.',
                  hinglish: 'Har charger, cable & earbuds hamari nigrani me test hokar aap tak pahunchta hai.',
                })}
              </p>
              {isAdminAuthorized && (
                <>
                  <input
                    ref={founderFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFounderPhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => founderFileRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-[10px] font-bold text-white inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3 h-3 text-amber-300" />
                    <span>
                      {pickLang(lang, {
                        en: 'Change Photo',
                        hi: 'अपनी फोटो बदलें',
                        mr: 'फोटो बदला',
                        hinglish: 'Upload Your Photo',
                      })}
                    </span>
                  </button>
                  {photoUpdatedToast && (
                    <div className="text-[10px] text-emerald-300 font-bold">
                      ✓ {pickLang(lang, { en: 'Photo updated!', hi: 'फोटो अपडेट हो गई!', mr: 'फोटो अपडेट झाला!' })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Rail (Matched to Produce CategoryQuickBar with Emojis + Counts) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="w-full overflow-x-auto no-scrollbar py-1 px-0.5">
          <div className="flex items-center gap-2 min-w-max">
            {categoryDefs.map((cat) => {
              const isSelected = selectedCat === cat.id;
              const count = categoryCounts[cat.id] ?? 0;
              const label = pickLang(lang, cat.labels);

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCat(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl transition-all border shrink-0 text-left cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/30'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800'
                  }`}
                >
                  <span className="text-lg leading-none">{cat.icon}</span>
                  <div>
                    <div
                      className={`text-xs font-bold leading-tight whitespace-nowrap ${
                        isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {label}
                    </div>
                    <div
                      className={`text-[10px] leading-none mt-0.5 tabular-nums ${
                        isSelected ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {getCountLabel(count)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={pickLang(lang, {
              en: 'Search chargers, earbuds, cases...',
              hi: 'चार्जर, ईयरबड्स, केस खोजें...',
              mr: 'चार्जर, इयरबड्स, केस शोधा...',
              hinglish: 'Chargers, earbuds, cases search karein...',
              gu: 'ચાર્જર, ઈયરબડ્સ શોધો...',
              bn: 'চার্জার, ইয়ারবাডস খুঁজুন...',
              ta: 'சார்ஜர், இயர்பட்ஸ் தேடுங்கள்...',
              te: 'ఛార్జర్, ఇయర్‌బడ్స్ శోధించండి...',
              kn: 'ಚಾರ್ಜರ್, ಇಯರ್‌ಬಡ್ಸ್ ಹುಡುಕಿ...',
              pa: 'ਚਾਰਜਰ, ਈਅਰਬਡਸ ਲੱਭੋ...',
            })}
            className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-emerald-600"
          />
        </div>
      </div>

      {/* Product Cards Grid (3-4 columns desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredAccessories.map((item) => {
          const inCartCount = accessoryCart[item.id] || 0;
          const discountPercent = Math.round(((item.mrp - item.price) / Math.max(1, item.mrp)) * 100);
          const itemTitle = resolveLocalizedField(item.name, lang);
          const itemDesc = resolveLocalizedField(item.description, lang);
          const showFounderInsetOnCard =
            featureFlags.founderPickBadge !== false && Boolean(item.founderVerified);

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:shadow-md"
            >
              <div>
                <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <SafeProductImg
                    product={item}
                    alt={itemTitle}
                    isAccessory
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded tabular-nums">
                    {discountPercent}% OFF
                  </div>
                  <div className="absolute top-2.5 right-2.5 bg-white/95 dark:bg-slate-900/95 text-amber-500 text-[11px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs tabular-nums">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-slate-800 dark:text-slate-200">{item.rating}</span>
                  </div>

                  {/* MARCO 100 Founder Photo Integrated cleanly on 1st featured product (and studio-verified items) */}
                  {showFounderInsetOnCard && (
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-none">
                      <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-xs border border-amber-400/60 rounded-xl pl-1 pr-2.5 py-1 shadow-lg">
                        <img
                          src={founderPhotoUrl}
                          alt="MARCO 100 Founder"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/assets/images/marco_founder_portrait.jpg';
                          }}
                          className="w-7 h-7 rounded-lg object-cover border border-amber-400"
                        />
                        <div className="leading-none">
                          <div className="text-[9px] font-black text-amber-300 tracking-wide">
                            MARCO 💯
                          </div>
                          <div className="text-[8.5px] font-semibold text-white/90">
                            {pickLang(lang, {
                              en: 'Founder Pick',
                              hi: 'फ़ाउंडर की पसंद',
                              mr: 'संस्थापक निवड',
                              hinglish: 'Founder Choice',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider mb-1">
                    <span>{item.brand}</span>
                    {item.isNewArrival && (
                      <span className="text-[9.5px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded font-black">
                        NEW STUDIO
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 mb-1.5">
                    {itemTitle}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {itemDesc}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.specs.slice(0, 3).map((sp, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded"
                      >
                        {sp}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-baseline gap-2 mb-1 tabular-nums">
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono-nums">
                      ₹{item.price}
                    </span>
                    <span className="text-xs text-slate-400 line-through font-mono-nums">
                      ₹{item.mrp}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      {pickLang(lang, { en: 'Save', hi: 'बचत', mr: 'बचत', hinglish: 'Save' })} ₹
                      {Math.max(0, item.mrp - item.price)}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{item.warranty}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 pt-0">
                {inCartCount > 0 ? (
                  <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setAccessoryCartQty(item.id, inCartCount - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono-nums">
                      {inCartCount}{' '}
                      {pickLang(lang, { en: 'in cart', hi: 'थैली में', mr: 'पिशवीत', hinglish: 'in cart' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAccessoryCartQty(item.id, inCartCount + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(item.id)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold text-white transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                      addedId === item.id
                        ? 'bg-emerald-800'
                        : 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                    }`}
                  >
                    {addedId === item.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>
                          {pickLang(lang, {
                            en: 'Added!',
                            hi: 'थैली में जुड़ा!',
                            mr: 'पिशवीत जोडले!',
                            hinglish: 'Added!',
                          })}
                        </span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>{t('add_to_cart')}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

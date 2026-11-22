import React, { useMemo, useState } from 'react';
import {
  SlidersHorizontal,
  Search,
  Power,
  RotateCcw,
  Sparkles,
  Youtube,
  LayoutTemplate,
  Navigation,
  Bot,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { pickLang } from '../utils/i18nHelper';
import { PlatformFeatureFlags, StoreUiSampleId } from '../types';
import { UI_SAMPLE_DEFINITIONS, UISamplesGalleryModal } from './UISamplesGalleryModal';
import { BrandLogo } from './BrandLogo';
import { AdminDeploymentLifecyclePanel } from './AdminDeploymentLifecyclePanel';

interface FeatureFlagMeta {
  key: keyof PlatformFeatureFlags;
  label: string;
  hindiLabel: string;
  description: string;
  category: 'cards' | 'banners' | 'navigation' | 'assistants';
}

const FEATURE_FLAG_CATALOG: FeatureFlagMeta[] = [
  // Category 1: YouTube, Recipes, Rates & Card Toggles
  {
    key: 'youtubeRecipeVideos',
    label: 'YouTube Recipe Videos & Toggles',
    hindiLabel: 'YouTube वीडियो टॉगल (कार्ड + रेसिपी)',
    description:
      'Controls Video slide on every produce card, inline YouTube chef search & video buttons in Shop by Dish (Matar Paneer / Bhindi), and YouTube links in Insights modal.',
    category: 'cards',
  },
  {
    key: 'dishRecipeHelper',
    label: 'Shop by Dish / Recipe Selector',
    hindiLabel: 'रेसिपी से सब्ज़ी चुनें (Shop by Dish)',
    description:
      'Shows/hides the "Shop by Dish" helper button & panel for quick Matar Paneer / Bhindi Masala ingredient checklists.',
    category: 'cards',
  },
  {
    key: 'rateSavingsSuggestions',
    label: 'Rate Comparisons & "Save ₹" Suggestions',
    hindiLabel: 'रेट सुझाव व बचत टैग ("Save ₹XX")',
    description:
      'Shows/hides market comparison "Save ₹XX" badges on product cards, Daily Forecast savings pill, wholesale vs retail rate breakdowns, and batch savings.',
    category: 'cards',
  },
  {
    key: 'unitConversionToggle',
    label: 'Unit Toggle (₹/kg ↔ ₹/Pc / Bunch)',
    hindiLabel: 'यूनिट बदलने का टॉगल (₹/kg ↔ ₹/Pc)',
    description:
      'Shows/hides the interactive unit price switcher toggle on dual-unit produce cards.',
    category: 'cards',
  },
  {
    key: 'healthBenefitsSlide',
    label: 'Health Benefits Slide & Headline',
    hindiLabel: 'हेल्थ बेनिफिट स्लाइड व 1-लाइन फायदा',
    description:
      'Shows/hides the "Benefits" tab inside each produce card carousel and the 1-line nutrition summary below the title.',
    category: 'cards',
  },
  {
    key: 'productInsightsModal',
    label: '"Slabs, Pool & Tips" Insights Modal',
    hindiLabel: 'प्रोडक्ट स्लैब, रेट व टिप्स मोडल',
    description:
      'Shows/hides the "Slabs, Pool & Tips" button on produce cards that opens full wholesale slab rates, storage tips & recipes.',
    category: 'cards',
  },
  {
    key: 'productShareButtons',
    label: 'Product "Share · ₹50" Action Button',
    hindiLabel: 'प्रोडक्ट शेयर बटन',
    description:
      'Shows/hides the WhatsApp/native product share trigger at the bottom of produce cards.',
    category: 'cards',
  },
  {
    key: 'founderPickBadge',
    label: 'MARCO 100 Founder Pick Sticker (Accessory Cards)',
    hindiLabel: 'MARCO 100 Founder Pick स्टिकर (प्रोडक्ट फोटो पर)',
    description:
      'Turns the "MARCO 100 Founder Pick" photo sticker on mobile accessory cards ON or OFF globally.',
    category: 'cards',
  },

  // Category 2: Storefront Banners, Upsells & Prompts
  {
    key: 'storePromoBanner',
    label: 'Store Promo Hero Banner',
    hindiLabel: 'स्टोर हीरो बैनर',
    description:
      'Shows/hides the top society delivery hero banner with mandi dispatch timings & highlights.',
    category: 'banners',
  },
  {
    key: 'windowCutoffBanner',
    label: '11 PM Ordering Window Countdown',
    hindiLabel: '11 PM कटऑफ टाइमर बार',
    description:
      'Shows/hides the live ordering window countdown bar below the navigation header.',
    category: 'banners',
  },
  {
    key: 'seasonalTrendingSection',
    label: 'Seasonal & Trending Produce Bar',
    hindiLabel: 'सीज़नल व ट्रेंडिंग सेक्शन',
    description:
      'Shows/hides the "Seasonal" quick-filter button and seasonal highlights strip above the catalog.',
    category: 'banners',
  },
  {
    key: 'cartUpsellSuggestions',
    label: 'Cart Dish & Fruit Upsell Suggestions',
    hindiLabel: 'कार्ट में डिश और फल सुझाव',
    description:
      'Shows/hides missing recipe item suggestions and seasonal fruit quick-adds inside the Cart Drawer.',
    category: 'banners',
  },
  {
    key: 'stickyCartBar',
    label: 'Bottom Floating Sticky Cart Bar',
    hindiLabel: 'नीचे फ्लोटिंग कार्ट बार',
    description:
      'Shows/hides the floating bottom bar displaying total cart items, weight & quick checkout button.',
    category: 'banners',
  },

  // Category 3: Navigation Tabs & Social Modules
  {
    key: 'communityPoolTab',
    label: 'Community Pool Demand Tab',
    hindiLabel: 'सोसायटी पूल डिमांड टैब',
    description:
      'Shows/hides the "Pool" navigation tab where customers view live society batch kg goals.',
    category: 'navigation',
  },
  {
    key: 'mobileAccessoriesTab',
    label: 'Mobile Accessories Tech Mart Tab',
    hindiLabel: 'मोबाइल एक्सेसरीज़ मार्ट टैब',
    description:
      'Shows/hides the "Accessories" tab in top & bottom navigation bars.',
    category: 'navigation',
  },
  {
    key: 'leaderboardAndBadges',
    label: 'Gamified Leaderboard & Saving Badges',
    hindiLabel: 'लीडरबोर्ड व सेविंग बैज कार्ड',
    description:
      'Shows/hides the Leaderboard tab and customer saving rank / badge cards in My Account.',
    category: 'navigation',
  },
  {
    key: 'referralProgram',
    label: 'Referral Rewards & Cashback Wallet',
    hindiLabel: 'रेफरल कैशबैक व रिवॉर्ड प्रोग्राम',
    description:
      'Shows/hides referral banners, referral dashboard card in Account, and cart referral discount prompts.',
    category: 'navigation',
  },
  {
    key: 'liveMapCorridor',
    label: 'Live Mandi Delivery Map Corridor',
    hindiLabel: 'लाइव डिलीवरी रूट मैप',
    description:
      'Shows/hides the APMC Vashi to society live map view link in navigation and account views.',
    category: 'navigation',
  },

  // Category 4: Assistants, Notifications & Tools
  {
    key: 'voiceOrderAssistant',
    label: 'Smart Voice & Chat Order Assistant',
    hindiLabel: 'वॉइस / स्मार्ट ऑर्डर असिस्टेंट',
    description:
      'Shows/hides the Voice Mic / Smart Order Assistant buttons in Navbar and its floating dialog.',
    category: 'assistants',
  },
  {
    key: 'smartNotifications',
    label: 'Smart Notification Bell & Live Toasts',
    hindiLabel: 'स्मार्ट नोटिफिकेशन बेल व टोस्ट',
    description:
      'Shows/hides the notification bell drawer and smart dynamic price/order toast popups.',
    category: 'assistants',
  },
  {
    key: 'pwaInstallPrompt',
    label: 'App / APK Install Buttons & Guide',
    hindiLabel: 'ऐप इंस्टॉल बटन व प्ले-स्टोर गाइड',
    description:
      'Shows/hides the "Install App" button in Navbar and Android/iOS install guide folder in Account.',
    category: 'assistants',
  },
  {
    key: 'languageSelector',
    label: 'Customer Language Switcher',
    hindiLabel: 'भाषा बदलने का विकल्प (EN/HI/HINGLISH)',
    description:
      'Shows/hides the language selector dropdown in Navbar & Account settings.',
    category: 'assistants',
  },
  {
    key: 'adminBuyersAnalytics',
    label: 'Admin Buyers Analytics & Top-10 Profit Studio',
    hindiLabel: 'एडमिन बायर्स एनालिटिक्स (टॉप-10 व मुनाफा चार्ट)',
    description:
      'Enables the Admin Buyers Analytics workspace tracking Top-10 buyers, daily-yearly profit & AI coupon/gift rewards.',
    category: 'assistants',
  },
  {
    key: 'batchSavingChart',
    label: 'Batch Saving Chart (Visual Forecast & Live Pool Graph)',
    hindiLabel: 'बैच सेविंग चार्ट (मंडी बनाम बाज़ार तुलना ग्राफ)',
    description:
      'Shows/hides the interactive Batch Saving Chart comparing TaazaMandi bill vs market cost + avoided spoilage.',
    category: 'cards',
  },
];

const CATEGORY_INFO: Record<
  FeatureFlagMeta['category'],
  { title: string; icon: React.ReactNode }
> = {
  cards: {
    title: 'YouTube, Recipes, Rates & Card Toggles',
    icon: <Youtube className="w-4 h-4 text-emerald-700" />,
  },
  banners: {
    title: 'Storefront Banners, Upsells & Cart Prompts',
    icon: <LayoutTemplate className="w-4 h-4 text-teal-700" />,
  },
  navigation: {
    title: 'Navigation Tabs, Pool & Social Modules',
    icon: <Navigation className="w-4 h-4 text-slate-700" />,
  },
  assistants: {
    title: 'Assistants, Notifications & Platform Tools',
    icon: <Bot className="w-4 h-4 text-indigo-700" />,
  },
};

interface AdminFeatureControlsTabProps {
  onOpenSamplesGallery?: () => void;
}

export const AdminFeatureControlsTab: React.FC<AdminFeatureControlsTabProps> = ({
  onOpenSamplesGallery,
}) => {
  const {
    lang,
    featureFlags,
    activeUiSample,
    festivalTheme,
    updateFeatureFlags,
    resetFeatureFlags,
    setActiveUiSample,
    resetFestivalTheme,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [internalGalleryOpen, setInternalGalleryOpen] = useState(false);

  const openGallery = () => {
    if (onOpenSamplesGallery) {
      onOpenSamplesGallery();
    } else {
      setInternalGalleryOpen(true);
    }
  };

  const totalCount = FEATURE_FLAG_CATALOG.length;
  const activeCount = useMemo(
    () =>
      FEATURE_FLAG_CATALOG.filter((item) => Boolean(featureFlags[item.key])).length,
    [featureFlags]
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FEATURE_FLAG_CATALOG;
    return FEATURE_FLAG_CATALOG.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.hindiLabel.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleEnableAll = () => {
    const allTrue: Partial<PlatformFeatureFlags> = {};
    FEATURE_FLAG_CATALOG.forEach((f) => {
      allTrue[f.key] = true;
    });
    updateFeatureFlags(allTrue);
  };

  const handleMinimalCleanMode = () => {
    updateFeatureFlags({
      youtubeRecipeVideos: false,
      dishRecipeHelper: false,
      rateSavingsSuggestions: false,
      unitConversionToggle: false,
      healthBenefitsSlide: false,
      productInsightsModal: false,
      cartUpsellSuggestions: false,
      seasonalTrendingSection: false,
      smartNotifications: false,
      leaderboardAndBadges: false,
      voiceOrderAssistant: false,
      productShareButtons: false,
      referralProgram: false,
      storePromoBanner: true,
      windowCutoffBanner: true,
      stickyCartBar: true,
      communityPoolTab: true,
      mobileAccessoriesTab: true,
      pwaInstallPrompt: true,
      liveMapCorridor: true,
      languageSelector: true,
    });
  };

  return (
    <div className="space-y-5">
      {/* Header Summary + Presets */}
      <div className="rounded-2xl bg-slate-900 text-white p-4 sm:p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <SlidersHorizontal className="w-4 h-4" />
              Master Admin Feature Switchboard ({activeCount}/{totalCount} Active)
            </div>
            <h3 className="text-base sm:text-lg font-extrabold mt-1">
              Control Every Customer Toggle, YouTube Link, Rate Suggestion &amp; Banner
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {pickLang(lang, {
                en: 'Turn any toggle OFF to remove it instantly from the customer storefront, or switch live UI Samples 1, 2 & 3 below.',
                hi: 'किसी भी टॉगल को यहाँ से OFF करें — वह तुरंत ग्राहक स्टोर से हट जाएगा। नीचे Samples 1, 2 और 3 भी चुन सकते हैं।',
                mr: 'कोणताही टॉगल येथून OFF करा — तो लगेच ग्राहक स्टोअरमधून दिसेनासा होईल. खाली Samples 1, 2 आणि 3 निवडू शकता.',
                hinglish: 'Kisi bhi toggle ko yahan se OFF karein — woh turant customer store se hat jayega. Neeche Samples 1, 2 aur 3 bhi select kar sakte hain.',
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleMinimalCleanMode}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Minimal Clean Store
            </button>
            <button
              type="button"
              onClick={handleEnableAll}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Power className="w-3.5 h-3.5" />
              Enable All ({totalCount})
            </button>
            <button
              type="button"
              onClick={resetFeatureFlags}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Deployment & Build Lifecycle Verification (Cache-Control: no-cache + SHA-256 Build Hash) */}
      <AdminDeploymentLifecyclePanel />

      {/* Storefront Visual UI Samples + Festival & Logo Studio Switcher */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-700" />
              {pickLang(lang, {
                en: 'Admin-Only UI Samples, Festival Themes & AI Logo Studio',
                hi: 'एडमिन UI सैंपल, त्यौहार थीम और AI लोगो स्टूडियो',
                mr: 'अ‍ॅडमिन UI सॅम्पल, सण थीम आणि AI लोगो स्टुडिओ',
                hinglish: 'Admin-Only UI Samples, Festival Themes & AI Logo Studio',
              })}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              {pickLang(lang, {
                en: 'Switch layout Samples 1, 2 & 3 independently, activate Diwali/Holi/Custom festival banners & logos, or chat with AI to design custom themes.',
                hi: 'UI सैंपल 1, 2 व 3 अलग से बदलें, दिवाली/होली/विशेष दिन का बैनर व लोगो लगाएँ, या AI से बात करके नया डिज़ाइन बनवाएँ।',
                hinglish: 'UI Samples 1, 2 & 3 alag se badlein, festival banner & logo set karein, ya AI se chat karke naya design banwayein.',
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={openGallery}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-sm transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>
              {pickLang(lang, {
                en: 'Open UI, Festival & AI Studio',
                hi: 'UI, त्यौहार व AI स्टूडियो खोलें',
                hinglish: 'Open UI, Festival & AI Studio',
              })}
            </span>
          </button>
        </div>

        {/* Active Festival & Dynamic Logo Status Bar */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo size="md" festivalTheme={festivalTheme} />
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {pickLang(lang, {
                  en: 'Active App Logo & Festival Mode',
                  hi: 'सक्रिय ऐप लोगो व त्यौहार मोड',
                  hinglish: 'Active App Logo & Festival Mode',
                })}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                {festivalTheme?.active
                  ? `${festivalTheme.name} (${festivalTheme.badgeText || 'Special Day'})`
                  : pickLang(lang, {
                      en: 'Default Classic Fresh Logo (No Festival Override)',
                      hi: 'डिफ़ॉल्ट फ्रेश लोगो (सामान्य मोड)',
                      hinglish: 'Default Classic Fresh Logo (Normal Mode)',
                    })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {festivalTheme?.active && (
              <button
                type="button"
                onClick={resetFestivalTheme}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
              >
                {pickLang(lang, { en: 'Reset to Normal', hi: 'सामान्य करें', hinglish: 'Reset to Normal' })}
              </button>
            )}
            <button
              type="button"
              onClick={openGallery}
              className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-bold cursor-pointer"
            >
              {pickLang(lang, { en: 'Customize / AI Chat', hi: 'बदलें / AI चैट', hinglish: 'Customize / AI Chat' })}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {UI_SAMPLE_DEFINITIONS.map((sample) => {
            const isActive = activeUiSample === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => setActiveUiSample(sample.id as StoreUiSampleId)}
                className={`text-left rounded-xl border-2 overflow-hidden transition-all flex flex-col ${
                  isActive
                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/15'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {sample.image ? (
                  <div className="aspect-[16/9] w-full bg-slate-100 overflow-hidden border-b border-slate-200 relative">
                    <img
                      src={sample.image}
                      alt={sample.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
                    />
                    {isActive && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold shadow">
                        ACTIVE
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[16/9] w-full bg-slate-100 border-b border-slate-200 flex items-center justify-center relative">
                    <span className="text-xs font-bold text-slate-600">Classic Storefront</span>
                    {isActive && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold shadow">
                        ACTIVE
                      </span>
                    )}
                  </div>
                )}
                <div className="p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {sample.badge}
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 mt-0.5 line-clamp-1">
                    {sample.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search toggle by name: YouTube, rate, Matar Paneer, voice, map, badge, upsell..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Categorized Feature Switch Sections */}
      {(['cards', 'banners', 'navigation', 'assistants'] as FeatureFlagMeta['category'][]).map(
        (catKey) => {
          const items = filteredItems.filter((f) => f.category === catKey);
          if (items.length === 0) return null;

          const enabledInCat = items.filter((f) => featureFlags[f.key]).length;
          const catMeta = CATEGORY_INFO[catKey];

          return (
            <div
              key={catKey}
              className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm"
            >
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {catMeta.icon}
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    {catMeta.title}
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-slate-600">
                  {enabledInCat}/{items.length} ON
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((flag) => {
                  const isOn = Boolean(featureFlags[flag.key]);
                  return (
                    <div
                      key={flag.key}
                      className={`p-3.5 sm:px-4 flex items-center justify-between gap-4 transition-colors ${
                        isOn ? 'bg-white' : 'bg-slate-50/70'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {flag.label}
                          </span>
                          {(lang === 'hi' || lang === 'mr') && (
                            <span className="text-[11px] font-medium text-slate-500">
                              ({flag.hindiLabel})
                            </span>
                          )}
                          {isOn ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" />
                              VISIBLE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              <XCircle className="w-3 h-3" />
                              HIDDEN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed">
                          {flag.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={isOn}
                        aria-label={`Toggle ${flag.label}`}
                        onClick={() => updateFeatureFlags({ [flag.key]: !isOn })}
                        className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${
                          isOn ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                            isOn ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
      )}

      {!onOpenSamplesGallery && (
        <UISamplesGalleryModal
          isOpen={internalGalleryOpen}
          onClose={() => setInternalGalleryOpen(false)}
        />
      )}
    </div>
  );
};

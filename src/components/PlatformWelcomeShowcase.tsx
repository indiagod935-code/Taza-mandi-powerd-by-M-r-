import React, { useState, useRef, useMemo } from 'react';
import {
  ArrowRight,
  Share2,
  Check,
  FileText,
  Mic,
  Truck,
  Smartphone,
  Gift,
  ShoppingBasket,
  ShieldCheck,
  ChevronDown,
  MapPin,
  Wallet,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus,
  Minus,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { pickLang } from '../utils/i18nHelper';
import { AuthModal } from './AuthModal';
import { TermsAndConditionsModal } from './TermsAndConditionsModal';
import { AndroidInstallModal } from './AndroidInstallModal';
import { GamifiedSavingsBadgeCard } from './GamifiedSavingsBadgeCard';
import { GamifiedLeaderboard } from './GamifiedLeaderboard';
import { LanguageSelector } from './LanguageSelector';
import { BrandLogo } from './BrandLogo';
import { logUserActivity } from '../utils/activityLogger';

interface PlatformWelcomeShowcaseProps {
  onRequestGoogleSocial?: () => void;
  socialSetupPending?: boolean;
}

type FeatureKey = 'catalog' | 'voice' | 'batch' | 'accessories' | 'activity';

interface DemoBasketItem {
  id: string;
  img: string;
  name: string;
  unit: string;
  mandiPrice: number;
  marketPrice: number;
}

const DEMO_BASKET_ITEMS: DemoBasketItem[] = [
  {
    id: 'tomato',
    img: '/assets/images/fresh_organic_tomatoes_1793421532111.jpg',
    name: 'Desi Tomatoes',
    unit: 'kg',
    mandiPrice: 32,
    marketPrice: 48,
  },
  {
    id: 'mango',
    img: '/assets/images/fresh_ratnagiri_hapus_mango.jpg',
    name: 'Alphonso Mango',
    unit: 'kg',
    mandiPrice: 220,
    marketPrice: 320,
  },
  {
    id: 'charger',
    img: '/assets/images/mobile_fast_chargers.jpg',
    name: '65W Fast Charger',
    unit: 'pc',
    mandiPrice: 699,
    marketPrice: 1299,
  },
];

export const PlatformWelcomeShowcase: React.FC<PlatformWelcomeShowcaseProps> = ({
  onRequestGoogleSocial,
  socialSetupPending = false,
}) => {
  const { brand, lang, setLang, festivalTheme } = useApp();
  const [preferredAuthMode, setPreferredAuthMode] = useState<'login' | 'register' | 'otp'>('register');
  const [authSwitchKey, setAuthSwitchKey] = useState(0);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy'>('terms');
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [activeFeature, setActiveFeature] = useState<FeatureKey>('catalog');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [demoQty, setDemoQty] = useState<Record<string, number>>({
    tomato: 2,
    mango: 1,
    charger: 0,
  });
  const authPanelRef = useRef<HTMLDivElement>(null);

  const referralCodeFromUrl =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('ref')
      : null;

  const demoTotals = useMemo(() => {
    let mandiTotal = 0;
    let marketTotal = 0;
    let itemCount = 0;
    DEMO_BASKET_ITEMS.forEach((item) => {
      const qty = demoQty[item.id] || 0;
      if (qty <= 0) return;
      itemCount += qty;
      mandiTotal += qty * item.mandiPrice;
      marketTotal += qty * item.marketPrice;
    });
    const instantSaved = Math.max(0, marketTotal - mandiTotal);
    return { mandiTotal, marketTotal, instantSaved, itemCount };
  }, [demoQty]);

  const adjustDemoQty = (id: string, delta: number) => {
    setDemoQty((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const focusAuthMode = (mode: 'login' | 'register' | 'otp') => {
    setPreferredAuthMode(mode);
    setAuthSwitchKey((k) => k + 1);
    authPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    logUserActivity({
      eventType: 'PAGE_VIEW',
      actionTitle: `Selected ${mode.toUpperCase()} from Welcome Showcase`,
      pageTab: 'welcome_gate',
    });
  };

  const handleCopyShareLink = async () => {
    try {
      const origin = window.location.origin;
      const shareUrl = referralCodeFromUrl ? `${origin}/?ref=${referralCodeFromUrl}` : `${origin}/`;
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2600);
      logUserActivity({
        eventType: 'SHARE_LINK',
        actionTitle: 'Copied platform share link from Welcome Showcase',
        details: shareUrl,
        pageTab: 'welcome_gate',
      });
    } catch {
      // Fallback silent
    }
  };

  const controlFeatures: {
    key: FeatureKey;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    subtitle: string;
  }[] = [
    {
      key: 'catalog',
      icon: ShoppingBasket,
      title: pickLang(lang, {
        en: 'Wholesale Produce Catalog & Live Stock',
        hi: 'ताज़ा मंडी कैटलॉग और लाइव स्टॉक',
        hinglish: 'Wholesale Catalog & Live Stock',
      }),
      subtitle: pickLang(lang, {
        en: 'Direct 4 AM APMC Vashi rates with daily savings comparison',
        hi: 'सुबह 4 AM वाशी मंडी के भाव और लोकल बाज़ार से सीधी तुलना',
      }),
    },
    {
      key: 'voice',
      icon: Mic,
      title: pickLang(lang, {
        en: 'Speak-to-Order Voice AI Studio',
        hi: 'बोलकर ऑर्डर करें — हिंदी व इंग्लिश वॉइस AI',
        hinglish: 'Bolkar Order Voice AI Studio',
      }),
      subtitle: pickLang(lang, {
        en: 'Natural human voice replies & adjustable mic sensitivity tuning',
        hi: 'माइक सेंसिटिविटी कंट्रोल और असली मानवीय आवाज़ में जवाब',
      }),
    },
    {
      key: 'batch',
      icon: Clock,
      title: pickLang(lang, {
        en: '11:00 PM Zero-Waste Community Pool',
        hi: 'रात 11 PM ग्रुप बैच — ज़ीरो वेस्टेज',
        hinglish: '11:00 PM Group Demand Pool',
      }),
      subtitle: pickLang(lang, {
        en: 'Society-pooled wholesale crates eliminate spoilage markups',
        hi: 'सोसायटी परिवारों के सामूहिक ऑर्डर से सीधी बचत व ताज़गी',
      }),
    },
    {
      key: 'accessories',
      icon: Smartphone,
      title: pickLang(lang, {
        en: 'Verified Mobile Chargers & Tech Gear',
        hi: 'टेस्टेड मोबाइल चार्जर व एक्सेसरीज़',
        hinglish: 'Tested Fast Chargers & Accessories',
      }),
      subtitle: pickLang(lang, {
        en: 'Delivered in the same 10 AM slot alongside fresh vegetables',
        hi: 'ताज़ा सब्ज़ियों के साथ सुबह 10 AM डिलीवरी स्लॉट में उपलब्ध',
      }),
    },
    {
      key: 'activity',
      icon: ShieldCheck,
      title: pickLang(lang, {
        en: 'Double Password, Social Login & Activity Logger',
        hi: 'डबल पासवर्ड सुरक्षा, Google लॉगिन व एक्टिविटी लॉगर',
        hinglish: 'Strict Auth & User Activity Logger',
      }),
      subtitle: pickLang(lang, {
        en: 'Registered members only, T&C verified, full personal & admin audit trail',
        hi: 'केवल पंजीकृत खाते, Google लॉगिन व हर एक्टिविटी का लाइव रिकॉर्ड',
      }),
    },
  ];

  const faqs = [
    {
      q: pickLang(lang, {
        en: 'Who can sign in to TaazaMandi and why is Sign Up required first?',
        hi: 'ताज़ाMandi में कौन साइन इन कर सकता है और पहले खाता बनाना क्यों आवश्यक है?',
        hinglish: 'Platform mein kaun sign in kar sakta hai aur Sign Up kyun zaroori hai?',
      }),
      a: pickLang(lang, {
        en: 'Only users who complete Sign Up (Mobile No. or verified Google Gmail + delivery flat address + double-verified password + Terms acceptance) can open the platform. Guest numbers or unverified bypass attempts are strictly blocked.',
        hi: 'केवल वही यूज़र प्लेटफॉर्म इस्तेमाल कर सकते हैं जिन्होंने नया खाता बनाएं (Sign Up) के माध्यम से अपना मोबाइल नंबर, Gmail, डिलीवरी पता और दो बार पासवर्ड दर्ज करके Terms स्वीकार किए हों। बिना रजिस्ट्रेशन कोई लॉगिन नहीं खुलता।',
      }),
    },
    {
      q: pickLang(lang, {
        en: 'How do Gamified Saver Badges & the Badge Saving Card work?',
        hi: 'गेमीफाइड सेवर बैज और बैज बचत कार्ड कैसे काम करते हैं?',
      }),
      a: pickLang(lang, {
        en: 'Every rupee you save vs local vendor prices levels up your Saver Rank from Seed Starter to Smart Mandi Saver, Wholesale Gold Pro, and Society Crown Legend — unlocking 6 achievement badges and live Daily/Monthly/Yearly savings reports.',
        hi: 'लोकल बाज़ार के मुकाबले हर बचत के साथ आपका सेवर बैज रैंक Seed Starter से Smart Saver, Gold Pro और Society Crown Legend तक बढ़ता है — और आपके 6 अचीवमेंट बैज अनलॉक होते हैं।',
      }),
    },
    {
      q: pickLang(lang, {
        en: 'How does the ₹50 Neighbor Cashback & Free Spinach reward work?',
        hi: '₹50 रेफ़रल कैशबैक और मुफ़्त पालक गिफ्ट कैसे मिलता है?',
      }),
      a: pickLang(lang, {
        en: 'Share your invite link with neighbors in your society. When they register via your link and complete an order of ₹150 or more with confirmed delivery & payment, ₹50 is credited to your wallet along with a free fresh spinach bundle.',
        hi: 'अपना शेयर लिंक पड़ोसियों को भेजें। जब वे आपके लिंक से जुड़कर ₹150+ का ऑर्डर डिलीवर व पेमेंट कन्फर्म करते हैं, तो आपके वॉलेट में ₹50 कैशबैक और मुफ़्त पालक तुरंत क्रेडिट हो जाते हैं।',
      }),
    },
    {
      q: pickLang(lang, {
        en: 'Can I sign in with Google Social Login as well as Mobile Password or OTP?',
        hi: 'क्या मैं Google Gmail सोशल लॉगिन और मोबाइल OTP दोनों से जुड़ सकता हूँ?',
      }),
      a: pickLang(lang, {
        en: 'Yes. You can connect your verified Google Gmail account via the Google button inside the sign-in panel. First-time Google visitors confirm their Mobile No., flat address, and double password once; registered Gmail accounts sign straight in.',
        hi: 'हाँ! आप Google Gmail बटन से सुरक्षित सोशल लॉगिन कर सकते हैं। पहले से रजिस्टर्ड Gmail सीधे 1-क्लिक में खुलते हैं, और नए यूज़र अपना मोबाइल नंबर, पता व डबल पासवर्ड जोड़कर तुरंत सक्रिय हो सकते हैं।',
      }),
    },
    {
      q: pickLang(lang, {
        en: 'Where can customers and admins view activity logs and consent history?',
        hi: 'यूज़र और एडमिन अपनी एक्टिविटी लॉग व लॉगिन रिकॉर्ड कहाँ देख सकते हैं?',
      }),
      a: pickLang(lang, {
        en: 'Every Sign Up, Sign In, failed password attempt, Terms acceptance, and link share is recorded in real time. Customers can view "My Activity Logger" inside their Account tab, while Admins have full filter/search controls in the Activity Logger tab.',
        hi: 'हर साइन-अप, साइन-इन, गलत लॉगिन प्रयास, टर्म्स सहमति और लिंक शेयर लाइव रिकॉर्ड होता है। ग्राहक Account सेक्शन में और एडमिन Control Center → Activity Logger टैब में पूरा रिकॉर्ड देख सकते हैं।',
      }),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Strict 3-Zone Architectural Top Navigation Bar */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="inline-flex items-center gap-2 font-display font-black text-lg sm:text-xl tracking-tight text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0"
          >
            <BrandLogo size="sm" festivalTheme={festivalTheme} />
            <span>{brand.brandName}</span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a
              href="#badges"
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:underline"
            >
              {pickLang(lang, { en: 'Saver Badges', hi: 'बचत बैज' })}
            </a>
            <a
              href="#advantages"
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:underline"
            >
              {pickLang(lang, { en: 'Advantages', hi: 'बड़े फायदे' })}
            </a>
            <a
              href="#control-hub"
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:underline"
            >
              {pickLang(lang, { en: 'Platform', hi: 'प्लेटफ़ॉर्म टूर' })}
            </a>
            <a
              href="#faq"
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:underline"
            >
              {pickLang(lang, { en: 'FAQ', hi: 'सवाल-जवाब' })}
            </a>
            <button
              type="button"
              onClick={() => setIsTermsOpen(true)}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:underline cursor-pointer"
            >
              {pickLang(lang, { en: 'Terms', hi: 'नियम व शर्तें' })}
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => focusAuthMode('login')}
              className="px-4 py-2 rounded-lg border border-emerald-700 text-emerald-700 dark:text-emerald-300 dark:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {pickLang(lang, { en: 'Sign In', hi: 'लॉगिन करें', hinglish: 'Sign In' })}
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 1: Architectural Hero + Interactive Try-It Basket + Registered Auth Panel */}
      <section id="top" className="mandi-grid-canvas border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left 7 Cols: Bold Headline + Interactive Try-It Basket Trio */}
            <div className="lg:col-span-7 space-y-6">
              {/* Clean Hero Utility Bar: 18-Language Global Picker + Install App + Share Link */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <LanguageSelector />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInstallOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-300" />
                    <span>{pickLang(lang, { en: 'Install App', hi: 'ऐप इंस्टॉल करें' })}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {pickLang(lang, { en: 'Share Link Copied', hi: 'शेयर लिंक कॉपी हो गया' })}
                        </span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>
                          {pickLang(lang, { en: 'Copy Share Link', hi: 'लिंक शेयर करें' })}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {referralCodeFromUrl && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 font-semibold flex flex-wrap items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {pickLang(lang, {
                      en: `Referral Invite Active (${referralCodeFromUrl}) — Complete Sign Up below to unlock ₹50 Cashback & 1 Free Spinach Bundle on your first ₹150+ order.`,
                      hi: `आपको रेफ़रल इनवाइट (${referralCodeFromUrl}) मिला है — नीचे खाता बनाकर पहले ₹150+ ऑर्डर पर ₹50 कैशबैक व 1 मुफ़्त पालक गड्डी पाएं।`,
                    })}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>APMC Vashi Wholesale Cluster</span>
                  <span aria-hidden="true">·</span>
                  <span>Gamified Saver Rewards</span>
                  <span aria-hidden="true">·</span>
                  <span>10:00 AM Doorstep Delivery</span>
                </div>

                <h1
                  className="font-display font-black tracking-tight text-slate-950 dark:text-white leading-[1.06] max-w-2xl"
                  style={{ fontSize: 'clamp(2.15rem, 3.9vw, 3.45rem)', textWrap: 'balance' }}
                >
                  {lang === 'hi' ? (
                    <>
                      ताज़ा मंडी के{' '}
                      <span className="text-pink-600 dark:text-pink-400">थोक भाव</span>, बचत बैज व{' '}
                      <span className="text-emerald-700 dark:text-emerald-400">वॉइस AI ऑर्डर।</span>
                    </>
                  ) : (
                    <>
                      Morning Mandi Rates.{' '}
                      <span className="text-pink-600 dark:text-pink-400">Earn Badges</span> Every Time You{' '}
                      <span className="text-emerald-700 dark:text-emerald-400">Save.</span>
                    </>
                  )}
                </h1>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  {pickLang(lang, {
                    en: 'Try adding fresh vegetables or fast chargers in the interactive basket below — watch your wholesale savings climb before you even sign up.',
                    hi: 'नीचे दी गई लाइव टोकरी में `+` दबाकर खुद देखें कि एक छोटे ऑर्डर पर भी आप कितने रुपये बचाते हैं और कौन सा सेवर बैज जीतते हैं।',
                  })}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => focusAuthMode('register')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>
                      {pickLang(lang, {
                        en: 'Create Account',
                        hi: 'नया खाता बनाएं',
                        hinglish: 'Create Account',
                      })}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* INTERACTIVE LIVE BASKET SIMULATOR TRIO */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-md space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-[11px] font-bold text-pink-600 dark:text-pink-400">
                      {pickLang(lang, {
                        en: 'LIVE MINI-BASKET SAVINGS CALCULATOR',
                        hi: 'लाइव मिनी-बास्केट बचत कैलकुलेटर',
                        mr: 'थेट मिनी-बास्केट बचत कॅल्क्युलेटर',
                        hinglish: 'LIVE MINI-BASKET SAVINGS CALCULATOR',
                      })}
                    </div>
                    <div className="font-bold text-sm text-slate-950 dark:text-white">
                      {pickLang(lang, {
                        en: 'Tap + / - to Check Real APMC Wholesale Savings',
                        hi: '+ या - दबाएं और लाइव थोक बचत देखें',
                        mr: '+ किंवा - दाबून थेट घाऊक बचत पहा',
                        hinglish: '+ ya - dabayein aur live wholesale bachat dekhein',
                      })}
                    </div>
                  </div>
                  <div className="font-mono tabular-nums text-right">
                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400">Instant Saved</div>
                    <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                      +₹{demoTotals.instantSaved.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DEMO_BASKET_ITEMS.map((item) => {
                    const qty = demoQty[item.id] || 0;
                    const saveEach = item.marketPrice - item.mandiPrice;
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/70 dark:bg-slate-800/50 flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5"
                      >
                        <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                          <img
                            src={item.img}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-end justify-between text-white">
                            <div className="font-bold text-xs leading-tight">{item.name}</div>
                            <div className="font-mono tabular-nums text-xs font-black text-amber-300">
                              Save ₹{saveEach}
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 flex items-center justify-between gap-2 text-xs">
                          <div className="font-mono tabular-nums">
                            <span className="font-black text-slate-900 dark:text-white">
                              ₹{item.mandiPrice}
                            </span>
                            <span className="text-[10.5px] text-slate-400 line-through ml-1">
                              ₹{item.marketPrice}
                            </span>
                          </div>

                          <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => adjustDemoQty(item.id, -1)}
                              aria-label={`Decrease ${item.name}`}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => adjustDemoQty(item.id, 1)}
                              aria-label={`Increase ${item.name}`}
                              className="w-6 h-6 rounded-md flex items-center justify-center bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Tryout Summary Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                  <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums">
                    <span className="text-slate-600 dark:text-slate-300 font-sans font-semibold">
                      Mandi Bill:{' '}
                      <strong className="font-mono text-slate-950 dark:text-white">
                        ₹{demoTotals.mandiTotal.toLocaleString('en-IN')}
                      </strong>
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500 font-sans">
                      Local Cost:{' '}
                      <span className="line-through font-mono">
                        ₹{demoTotals.marketTotal.toLocaleString('en-IN')}
                      </span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => focusAuthMode('register')}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline underline-offset-4 cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>
                      {pickLang(lang, {
                        en: 'Lock This Savings Rate & Sign Up',
                        hi: 'इस बचत को लॉक करें (Sign Up)',
                      })}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Registered Sign In / Create Account Card */}
            <div ref={authPanelRef} id="auth-portal" className="lg:col-span-5 flex justify-center w-full">
              <AuthModal
                key={authSwitchKey}
                isRequiredGate
                inlineMode
                initialMode={preferredAuthMode}
                onOpenFullTerms={() => setIsTermsOpen(true)}
                onSocialGoogleClick={onRequestGoogleSocial}
                socialSetupPending={socialSetupPending}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: GAMIFIED BADGES + BADGE SAVING SIMULATOR CARD + COMMUNITY LEADERBOARD */}
      <section id="badges" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-6 space-y-8">
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div className="space-y-1 max-w-2xl">
              <div className="text-xs font-bold text-pink-600 dark:text-pink-400">
                {pickLang(lang, {
                  en: 'GAMIFIED SAVER REWARDS & PROGRESS CARD',
                  hi: 'गेमीफाइड बैज व बचत रिवॉर्ड सिस्टम',
                })}
              </div>
              <h2
                className="font-display font-black text-slate-950 dark:text-white tracking-tight"
                style={{ fontSize: 'clamp(1.65rem, 2.8vw, 2.35rem)' }}
              >
                {pickLang(lang, {
                  en: 'Save More. Level Up Your Family Saver Badge.',
                  hi: 'हर बचत पर रैंक बढ़ाएं — 4 टियर और 6 कलेक्टिबल बैज जीतें।',
                })}
              </h2>
            </div>
          </div>

          <GamifiedSavingsBadgeCard
            simulatorMode
            onClaimTierAction={() => focusAuthMode('register')}
          />
        </div>

        <GamifiedLeaderboard
          previewMode
          onOpenAuth={() => focusAuthMode('register')}
        />
      </section>

      {/* SECTION 3: High-Contrast Food-Fresh Comparison Showcase (Soft Blush Pink + Fresh Mint Amber) */}
      <section id="advantages" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-6">
        <div className="max-w-2xl space-y-1.5">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {pickLang(lang, { en: 'WHY FAMILIES SWITCH TO TAAZAMANDI', hi: 'क्यों परिवार ताज़ाMandi चुनते हैं' })}
          </div>
          <h2
            className="font-display font-black text-slate-950 dark:text-white tracking-tight leading-tight"
            style={{ fontSize: 'clamp(1.65rem, 2.8vw, 2.35rem)', textWrap: 'balance' }}
          >
            {pickLang(lang, {
              en: 'Everything you need, from daily kitchen sabzi to monthly family savings.',
              hi: 'रोज़ की ताज़ा सब्ज़ी से लेकर सालाना बचत तक — सब एक ही प्लेटफ़ॉर्म पर।',
            })}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contrast Card A: Soft Blush Pink Fresh-Produce Friendly Accent Card */}
          <div className="rounded-3xl bg-pink-50/90 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800/70 text-slate-900 dark:text-slate-100 p-7 sm:p-9 flex flex-col justify-between gap-6 shadow-xs">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/60 border border-pink-200 dark:border-pink-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-pink-700 dark:text-pink-300" />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold text-pink-700 dark:text-pink-300">
                  {pickLang(lang, { en: 'END MIDDLEMEN MARKUPS', hi: 'सीधा मंडी सोर्सिंग' })}
                </div>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-slate-950 dark:text-white leading-snug">
                  {pickLang(lang, {
                    en: 'Stop Overpaying Street & Quick-App Markups.',
                    hi: 'बिचौलियों व क्विक ऐप्स के ऊँचे दामों से छुटकारा पाएं।',
                  })}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
                  {pickLang(lang, {
                    en: 'See real APMC Vashi prices side by side with local market rates on every produce card. Zero hidden packing fees or stale cold-storage leftovers.',
                    hi: 'हर सब्ज़ी व फल के कार्ड पर मंडी थोक भाव और लोकल मार्केट भाव की सीधी तुलना देखें। बिना किसी छिपे शुल्क के रोज़ ताज़ा माल पाएं।',
                  })}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-pink-200/80 dark:border-pink-800/60 grid grid-cols-2 gap-4 text-xs font-mono tabular-nums">
              <div>
                <div className="text-lg font-black text-pink-700 dark:text-pink-300">25%–35%</div>
                <div className="text-slate-600 dark:text-slate-400 font-sans">Lower vs Retail</div>
              </div>
              <div>
                <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">04:00 AM</div>
                <div className="text-slate-600 dark:text-slate-400 font-sans">Daily Auction Lot</div>
              </div>
            </div>
          </div>

          {/* Contrast Card B: Soft Mint / Emerald Contrast Card */}
          <div className="rounded-3xl bg-amber-50/90 dark:bg-slate-900 border border-amber-200 dark:border-slate-800 p-7 sm:p-9 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                  {pickLang(lang, { en: 'GROW REPEAT SAVINGS', hi: 'रोज़ाना व मासिक बचत' })}
                </div>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-slate-950 dark:text-white leading-snug">
                  {pickLang(lang, {
                    en: 'Turn Everyday Kitchen Orders Into Badge Rewards.',
                    hi: 'हर ऑर्डर पर गिनती की बचत और ₹50 रेफ़रल कैशबैक।',
                  })}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
                  {pickLang(lang, {
                    en: 'Track your Daily, Monthly & Yearly Forecast inside the dashboard. Invite society neighbors and earn ₹50 Wallet Cashback plus a free spinach bundle.',
                    hi: 'ऐप में अपनी दैनिक, मासिक और सालाना बचत का अनुमान देखें। पड़ोसियों को लिंक भेजकर ₹50 वॉलेट कैशबैक और मुफ़्त पालक गड्डी कमाएँ।',
                  })}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-amber-200/80 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs font-mono tabular-nums">
              <div>
                <div className="text-lg font-black text-slate-950 dark:text-white">₹50 + 🥬</div>
                <div className="text-slate-600 dark:text-slate-400 font-sans">Per Verified Referral</div>
              </div>
              <div>
                <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">6 Badges</div>
                <div className="text-slate-600 dark:text-slate-400 font-sans">Collectible Milestones</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Interactive "One Platform. Total Control." Feature Switcher */}
      <section
        id="control-hub"
        className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 py-12 sm:py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl space-y-1.5">
            <div className="text-xs font-bold text-pink-600 dark:text-pink-400">
              {pickLang(lang, { en: 'UNIFIED HOUSEHOLD & SOCIETY SYSTEM', hi: 'सब कुछ एक ही जगह पर' })}
            </div>
            <h2
              className="font-display font-black text-slate-950 dark:text-white tracking-tight"
              style={{ fontSize: 'clamp(1.65rem, 2.8vw, 2.35rem)' }}
            >
              {pickLang(lang, {
                en: 'One Platform. Total Control.',
                hi: 'एक प्लेटफ़ॉर्म। पूरा नियंत्रण।',
              })}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {pickLang(lang, {
                en: 'Click any module on the left to inspect how TaazaMandi works once you register.',
                hi: 'बाएँ किसी भी फीचर पर क्लिक करके देखें कि अकाउंट बनाने के बाद यह कैसे काम करता है।',
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-5 space-y-2">
              {controlFeatures.map((feat) => {
                const Icon = feat.icon;
                const isSelected = activeFeature === feat.key;
                return (
                  <button
                    key={feat.key}
                    type="button"
                    onClick={() => setActiveFeature(feat.key)}
                    className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-emerald-50/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-white/15 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold leading-snug">{feat.title}</div>
                        <div
                          className={`text-xs mt-0.5 leading-relaxed ${
                            isSelected ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {feat.subtitle}
                        </div>
                      </div>
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-white translate-x-0.5' : 'text-slate-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm min-h-[340px] flex flex-col justify-between gap-5">
              {activeFeature === 'catalog' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Wholesale Rate Sheet
                      </div>
                      <div className="font-bold text-base text-slate-900 dark:text-white">
                        APMC Vashi Morning Stock Preview
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      95+ Varieties
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {[
                      {
                        img: '/assets/images/fresh_organic_tomatoes_1793421532111.jpg',
                        name: 'Desi Tomatoes (देशी टमाटर)',
                        market: '₹48/kg',
                        mandi: '₹32/kg',
                        stock: 'In Stock',
                      },
                      {
                        img: '/assets/images/fresh_red_onions_1793421531438.jpg',
                        name: 'Nashik Red Onion (कांदा)',
                        market: '₹42/kg',
                        mandi: '₹28/kg',
                        stock: 'In Stock',
                      },
                      {
                        img: '/assets/images/fresh_palak_basket_1793423367076.jpg',
                        name: 'Fresh Garden Palak (पालक)',
                        market: '₹30/gaddi',
                        mandi: '₹18/gaddi',
                        stock: 'Dawn Harvest',
                      },
                      {
                        img: '/assets/images/fresh_ratnagiri_hapus_mango.jpg',
                        name: 'Ratnagiri Alphonso Mango',
                        market: '₹320/kg',
                        mandi: '₹220/kg',
                        stock: 'Seasonal Pick',
                      },
                    ].map((row) => (
                      <div key={row.name} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={row.img}
                            alt={row.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                              {row.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {row.stock}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono tabular-nums shrink-0">
                          <div className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                            {row.mandi}
                          </div>
                          <div className="text-[11px] text-slate-400 line-through">{row.market}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeFeature === 'voice' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Gemini Live Speech Engine
                      </div>
                      <div className="font-bold text-base text-slate-900 dark:text-white">
                        Hands-Free Voice Ordering & Mic Tuner
                      </div>
                    </div>
                    <Mic className="w-5 h-5 text-emerald-600" />
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Customer Spoken Command (Hindi / Hinglish)
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        "2 किलो टमाटर, 1 किलो प्याज़ और पापा के लिए पाव भाजी की सारी सब्ज़ी जोड़ दो।"
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <div className="text-[10.5px] font-bold text-emerald-800 dark:text-emerald-400 mb-1">
                        Voice Assistant Action & Natural Audio Reply
                      </div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                        Added Desi Tomatoes (2 kg), Nashik Red Onion (1 kg), Potatoes, Green Peas & Cauliflower to cart. Saving ₹74 vs street market rates!
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 pt-1 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                        <div className="font-bold text-slate-900 dark:text-white">Mic On/Off</div>
                        <div className="text-slate-500 dark:text-slate-400">Instant Control</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                        <div className="font-bold text-slate-900 dark:text-white">3 Sensitivity Modes</div>
                        <div className="text-slate-500 dark:text-slate-400">Quiet to Noisy Kitchen</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                        <div className="font-bold text-slate-900 dark:text-white">Human Audio</div>
                        <div className="text-slate-500 dark:text-slate-400">Hindi & English TTS</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeature === 'batch' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Daily Demand Pooling Engine
                      </div>
                      <div className="font-bold text-base text-slate-900 dark:text-white">
                        11:00 PM Cutoff → Zero Cold-Storage Waste
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {[
                      {
                        step: '01 · By 11:00 PM',
                        title: 'Neighbors Reserve Qty',
                        detail: 'Every flat reserves exact grams/kg needed for tomorrow morning.',
                      },
                      {
                        step: '02 · At 04:00 AM',
                        title: '1 Consolidated Mandi Buy',
                        detail: 'Exact crate total purchased from APMC Vashi auction with no leftover stock.',
                      },
                      {
                        step: '03 · Before 10:00 AM',
                        title: 'Sorted & Delivered',
                        detail: 'Packed by flat number & delivered straight to your doorstep.',
                      },
                    ].map((s) => (
                      <div
                        key={s.step}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5"
                      >
                        <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {s.step}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">{s.title}</div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {s.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeFeature === 'accessories' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Durability-Tested Morning Tech
                      </div>
                      <div className="font-bold text-base text-slate-900 dark:text-white">
                        Mobile Chargers, Earbuds & Mounts
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                    {[
                      {
                        img: '/assets/images/mobile_fast_chargers.jpg',
                        title: '65W GaN Fast Chargers',
                        price: '₹699',
                      },
                      {
                        img: '/assets/images/wireless_earbuds_case.jpg',
                        title: 'ANC True Wireless Earbuds',
                        price: '₹1,199',
                      },
                      {
                        img: '/assets/images/magnetic_car_mount.jpg',
                        title: 'Magnetic Dash Phone Mount',
                        price: '₹349',
                      },
                    ].map((acc) => (
                      <div
                        key={acc.title}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800/70"
                      >
                        <img
                          src={acc.img}
                          alt={acc.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-24 object-cover"
                        />
                        <div className="p-3 space-y-1">
                          <div className="font-bold text-slate-900 dark:text-white">{acc.title}</div>
                          <div className="font-mono font-black text-emerald-700 dark:text-emerald-400">
                            {acc.price}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeFeature === 'activity' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Verified Member Audit Trail
                      </div>
                      <div className="font-bold text-base text-slate-900 dark:text-white">
                        Real-Time User Activity Logger & Registered Control
                      </div>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {[
                      {
                        type: 'AUTH_REGISTER',
                        title: 'New customer account registered (Double Password Verified)',
                        meta: 'Mobile No. + Gmail ID + Address',
                      },
                      {
                        type: 'TERMS_ACCEPTED',
                        title: 'Privacy Policy & Terms accepted prior to login',
                        meta: 'Required consent logged',
                      },
                      {
                        type: 'SOCIAL_LOGIN',
                        title: 'Signed in via Google Social Login',
                        meta: 'Firebase Verified Gmail Session',
                      },
                      {
                        type: 'SHARE_LINK',
                        title: 'Invite link shared across building wing',
                        meta: 'Referral ₹50 tracking enabled',
                      },
                    ].map((log) => (
                      <div key={log.type} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {log.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {log.meta}
                          </div>
                        </div>
                        <span className="font-mono text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                          {log.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {pickLang(lang, {
                    en: 'Ready to unlock all 5 modules & start collecting saver badges?',
                    hi: 'खाता बनाते ही ये सभी फीचर्स व बचत बैज आपके डैशबोर्ड में तुरंत खुल जाएंगे।',
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => focusAuthMode('register')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                >
                  <span>{pickLang(lang, { en: 'Create Account Now', hi: 'अभी खाता बनाएं' })}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Logistics & Community Retention Cards */}
      <section id="logistics" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  LOGISTICS & GPS ROUTE TRACKING
                </div>
                <h3 className="font-display font-black text-2xl text-slate-950 dark:text-white mt-1">
                  {pickLang(lang, { en: 'Deliver Without Limits.', hi: 'सुबह 10 AM से पहले सटीक डिलीवरी।' })}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  {pickLang(lang, {
                    en: 'Watch every morning milestone from APMC Vashi procurement to flat doorstep handover on Google Maps.',
                    hi: 'सुबह 4 AM मंडी खरीद से लेकर आपके घर के दरवाज़े तक डिलीवरी का पूरा सफर लाइव ट्रैक करें।',
                  })}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                'Live APMC Vashi to Society Map Corridor',
                '4:00 AM Auction → 7:30 AM Society Packing',
                '10:00 AM Guaranteed Morning Delivery Window',
              ].map((line) => (
                <div key={line} className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-pink-600 dark:text-pink-400">
                  RETENTION, RECIPES & WALLET REWARDS
                </div>
                <h3 className="font-display font-black text-2xl text-slate-950 dark:text-white mt-1">
                  {pickLang(lang, { en: 'Rewarding Every Order & Referral.', hi: 'हर ऑर्डर व शेयर पर अतिरिक्त फायदा।' })}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  {pickLang(lang, {
                    en: '1-click recipe ingredient shopping, family preferences, and instant ₹50 cashback credits when referred neighbors shop.',
                    hi: 'पाव भाजी व पनीर जैसी डिश चुनते ही 1 क्लिक में सारी सब्ज़ी जोड़ें और पड़ोसी रेफ़रल पर ₹50 कमाएं।',
                  })}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/50 border border-pink-200 dark:border-pink-800 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                '₹50 Wallet Credit + 1 Free Palak Bundle on Verified ₹150+ Referrals',
                'Shop by Dish — Add Complete Recipe Ingredients in 1 Tap',
                'Family Member Taste Profiles & Verified Delivery Checklists',
              ].map((line) => (
                <div key={line} className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: Interactive FAQ Accordion */}
      <section
        id="faq"
        className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 py-12 sm:py-16"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-1.5">
            <h2
              className="font-display font-black text-slate-950 dark:text-white tracking-tight"
              style={{ fontSize: 'clamp(1.65rem, 2.8vw, 2.35rem)' }}
            >
              {pickLang(lang, { en: 'Frequently Asked Questions', hi: 'अक्सर पूछे जाने वाले सवाल' })}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {pickLang(lang, {
                en: 'Everything you want to know about registration, saver badges, voice orders & security.',
                hi: 'खाता बनाने, बचत बैज, वॉइस ऑर्डर और सुरक्षा नियमों के बारे में पूरी जानकारी।',
              })}
            </p>
          </div>

          <div className="space-y-2.5">
            {faqs.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={item.q}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left text-sm font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final High-Energy Conversion Banner (Fresh Deep Botanical Emerald) */}
      <section className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-3xl bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-900 border border-emerald-700 p-7 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white shadow-md">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight">
              {pickLang(lang, {
                en: 'Start Ordering & Earning Saver Badges Today.',
                hi: 'आज ही अपना खाता बनाकर बचत और बैज जीतना शुरू करें।',
              })}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100">
              {pickLang(lang, {
                en: 'Register once with Mobile No. or Gmail + double password, accept Terms & Conditions, and access live rates.',
                hi: 'मोबाइल No. या Gmail व दो बार पासवर्ड से पंजीकरण करें और लाइव मंडी भाव तुरंत खोलें।',
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => focusAuthMode('register')}
              className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-black inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>{pickLang(lang, { en: 'Create Account', hi: 'खाता बनाएं' })}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsTermsOpen(true)}
              className="px-4 py-3 rounded-xl border border-white/25 hover:bg-white/10 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{pickLang(lang, { en: 'Terms & Conditions', hi: 'नियम व शर्तें' })}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">{brand.brandName}</span>
            <span aria-hidden="true">·</span>
            <span>powered by MARCO 💯</span>
            <span aria-hidden="true">·</span>
            <span>APMC Vashi Direct Sourcing</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => {
                setLegalTab('privacy');
                setIsTermsOpen(true);
              }}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 underline-offset-4 hover:underline cursor-pointer"
            >
              {pickLang(lang, { en: 'Privacy Policy', hi: 'गोपनीयता नीति' })}
            </button>
            <button
              type="button"
              onClick={() => {
                setLegalTab('terms');
                setIsTermsOpen(true);
              }}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 underline-offset-4 hover:underline cursor-pointer"
            >
              {pickLang(lang, { en: 'Terms & Conditions', hi: 'नियम व शर्तें' })}
            </button>
            <button
              type="button"
              onClick={() => focusAuthMode('login')}
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline underline-offset-4 cursor-pointer"
            >
              {pickLang(lang, { en: 'Sign In', hi: 'लॉगिन करें', hinglish: 'Sign In' })}
            </button>
          </div>
        </div>
      </footer>

      <TermsAndConditionsModal
        isOpen={isTermsOpen}
        initialTab={legalTab}
        onClose={() => setIsTermsOpen(false)}
      />

      <AndroidInstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
        onOpenLegal={(tab) => {
          setLegalTab(tab);
          setIsTermsOpen(true);
        }}
      />
    </div>
  );
};

export default PlatformWelcomeShowcase;

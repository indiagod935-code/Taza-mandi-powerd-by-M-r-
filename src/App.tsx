import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { WindowBanner } from './components/WindowBanner';
import { ProduceCard } from './components/ProduceCard';
import { CartDrawer } from './components/CartDrawer';
import { AdminLockGate } from './components/AdminLockGate';
import { LiveUpdateNotifier } from './components/LiveUpdateNotifier';
import { RecipeDishHelper } from './components/RecipeDishHelper';
import { ProduceItem, CustomerOrder, AppPageId } from './types';

import { AuthModal } from './components/AuthModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { BrandCustomizerModal } from './components/BrandCustomizerModal';
import { AIInsightsModal } from './components/AIInsightsModal';
import { AIProductStudioModal } from './components/AIProductStudioModal';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { OrderInvoiceModal } from './components/OrderInvoiceModal';
import { AboutConceptModal } from './components/AboutConceptModal';
import { BatchSavingsForecastModal } from './components/BatchSavingsForecastModal';
import { BottomNav } from './components/BottomNav';
import { UserReferralDashboard } from './components/UserReferralDashboard';
import { AccountView } from './components/AccountView';
import { CategoryQuickBar } from './components/CategoryQuickBar';
import { StorePromoBanner } from './components/StorePromoBanner';
import { StickyCartBar } from './components/StickyCartBar';
import { SeasonalAndTrendingSection } from './components/SeasonalAndTrendingSection';
import { VoiceOrderAIDialog } from './components/VoiceOrderAIDialog';
import { OnboardingTour } from './components/OnboardingTour';
import { PlatformWelcomeShowcase } from './components/PlatformWelcomeShowcase';
import { TermsAndConditionsModal } from './components/TermsAndConditionsModal';
import { SmartDynamicToast } from './components/SmartNotificationCenter';
import { UISamplesGalleryModal } from './components/UISamplesGalleryModal';
import { logUserActivity } from './utils/activityLogger';
import { authService } from './services/authService';
import { adminApi } from './api/endpoints';
import { clearAdminToken, getAdminToken, setAdminToken } from './api/client';
import { ENV_CONFIG } from './config/env';
import {
  CatalogGridSkeleton,
  OrdersListSkeleton,
  ViewTabSkeleton,
} from './components/LoadingSkeletons';
import { pickLang, resolveLocalizedProduceName } from './utils/i18nHelper';
import {
  Search,
  Truck,
  Lock,
  MapPin,
  RefreshCw,
  ChefHat,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

const MobileAccessoriesView = lazy(() =>
  import('./components/MobileAccessoriesView').then((m) => ({ default: m.MobileAccessoriesView }))
);
const CommunityPoolView = lazy(() =>
  import('./components/CommunityPoolView').then((m) => ({ default: m.CommunityPoolView }))
);
const MandiProcurementSheet = lazy(() =>
  import('./components/MandiProcurementSheet').then((m) => ({ default: m.MandiProcurementSheet }))
);
const OrdersView = lazy(() =>
  import('./components/OrdersView').then((m) => ({ default: m.OrdersView }))
);
const OrderTrackingDashboard = lazy(() =>
  import('./components/OrderTrackingDashboard').then((m) => ({ default: m.OrderTrackingDashboard }))
);
const LiveMandiDeliveryMap = lazy(() =>
  import('./components/LiveMandiDeliveryMap').then((m) => ({ default: m.LiveMandiDeliveryMap }))
);

function MainAppContent() {
  const {
    produceList,
    produceCart,
    orders,
    brand,
    lang,
    user,
    setIsCartOpen,
    setIsAuthModalOpen,
    setIsProfileModalOpen,
    setProfileActiveTab,
    isCatalogSyncing,
    refreshCatalogFromServer,
    featureFlags,
    activeUiSample,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AppPageId>('catalog');
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [isSamplesGalleryOpen, setIsSamplesGalleryOpen] = useState(false);
  const [isAIStudioModalOpen, setIsAIStudioModalOpen] = useState(false);
  const [aiStudioInitialTab, setAiStudioInitialTab] = useState<
    'single' | 'batch' | 'validate' | 'accessory_studio'
  >('single');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [insightItem, setInsightItem] = useState<ProduceItem | null>(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<CustomerOrder | null>(null);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [isAdminLocked, setIsAdminLocked] = useState<boolean>(false);
  const [isGmpQuotaExceeded, setIsGmpQuotaExceeded] = useState(false);
  const [activeHelper, setActiveHelper] = useState<'none' | 'recipe' | 'seasonal'>('none');
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy'>('terms');

  // Auto-fallback to Store Catalog or clean helper state when Admin turns off a module
  useEffect(() => {
    if (
      (activeTab === 'pool' && !featureFlags.communityPoolTab) ||
      (activeTab === 'accessories' && !featureFlags.mobileAccessoriesTab) ||
      (activeTab === 'leaderboard' && !featureFlags.leaderboardAndBadges) ||
      (activeTab === 'map' && !featureFlags.liveMapCorridor) ||
      (activeTab === 'referral' && !featureFlags.referralProgram)
    ) {
      setActiveTab('catalog');
    }
  }, [activeTab, featureFlags]);

  useEffect(() => {
    if (
      (activeHelper === 'recipe' && !featureFlags.dishRecipeHelper) ||
      (activeHelper === 'seasonal' && !featureFlags.seasonalTrendingSection)
    ) {
      setActiveHelper('none');
    }
  }, [activeHelper, featureFlags.dishRecipeHelper, featureFlags.seasonalTrendingSection]);

  useEffect(() => {
    if (!user.isLoggedIn) return;
    logUserActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      eventType: 'PAGE_VIEW',
      actionTitle: `Opened ${activeTab} section`,
      pageTab: activeTab,
    });
  }, [activeTab, user.isLoggedIn, user.id, user.name, user.email, user.phone]);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('tazamandi_theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  }, []);

  useEffect(() => {
    const handler = () => setIsGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  const isAdminAuthorized =
    !isAdminLocked && (isAdminUnlocked || authService.isOwnerEmail(user.email));

  useEffect(() => {
    const handleVoiceNav = (ev: Event) => {
      const detail = (ev as CustomEvent<{
        tab?: AppPageId;
        category?: string;
        search?: string;
        openCart?: boolean;
        closeCart?: boolean;
        themeMode?: 'dark' | 'light' | 'toggle';
        openModal?:
          | 'auth'
          | 'profile'
          | 'addresses'
          | 'referrals'
          | 'about'
          | 'brand'
          | 'install'
          | 'tour'
          | 'savings';
      }>).detail;
      if (!detail) return;

      if (detail.themeMode) {
        const root = document.documentElement;
        const enableDark =
          detail.themeMode === 'toggle'
            ? !root.classList.contains('dark')
            : detail.themeMode === 'dark';
        root.classList.toggle('dark', enableDark);
        try {
          localStorage.setItem('tazamandi_theme', enableDark ? 'dark' : 'light');
        } catch {}
      }

      if (detail.tab) {
        setActiveTab(detail.tab);
      }
      if (detail.category !== undefined) {
        setActiveTab('catalog');
        setSelectedCategory(detail.category);
      }
      if (detail.search !== undefined) {
        setActiveTab('catalog');
        setSearchQuery(detail.search);
      }
      if (detail.openCart) {
        setIsCartOpen(true);
      }
      if (detail.closeCart) {
        setIsCartOpen(false);
      }
      if (detail.openModal) {
        if (detail.openModal === 'auth') setIsAuthModalOpen(true);
        else if (detail.openModal === 'profile') {
          setProfileActiveTab('profile');
          setIsProfileModalOpen(true);
        } else if (detail.openModal === 'addresses') {
          setProfileActiveTab('addresses');
          setIsProfileModalOpen(true);
        } else if (detail.openModal === 'referrals') {
          setProfileActiveTab('referrals');
          setIsProfileModalOpen(true);
        } else if (detail.openModal === 'about') setIsAboutModalOpen(true);
        else if (detail.openModal === 'brand') {
          if (isAdminAuthorized) setIsBrandModalOpen(true);
        }
        else if (detail.openModal === 'install') setIsInstallModalOpen(true);
        else if (detail.openModal === 'savings') setIsSavingsModalOpen(true);
        else if (detail.openModal === 'tour') {
          window.dispatchEvent(new Event('tazamandi-start-onboarding-tour'));
        }
      }
      if (detail.tab || detail.category !== undefined || detail.search !== undefined) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('tazamandi-voice-nav', handleVoiceNav);
    return () => window.removeEventListener('tazamandi-voice-nav', handleVoiceNav);
  }, [setIsCartOpen, setIsAuthModalOpen, setIsProfileModalOpen, setProfileActiveTab, isAdminAuthorized]);

  useEffect(() => {
    if (!user.isLoggedIn) {
      setIsAdminLocked(false);
      setIsAdminUnlocked(false);
      clearAdminToken();
      return;
    }
    if (isAdminAuthorized && !getAdminToken() && authService.isOwnerEmail(user.email)) {
      adminApi
        .createSession({ email: user.email || ENV_CONFIG.OWNER_EMAIL, actorName: user.name })
        .then((res) => {
          if (res?.success && res.token) {
            setAdminToken(res.token);
          }
        })
        .catch(() => {});
    }
  }, [user.isLoggedIn, user.email, user.name, isAdminAuthorized]);

  // Filter produce items
  const filteredProduce = useMemo(() => {
    return produceList
      .filter((item) => {
        let matchesCategory = true;
        if (selectedCategory === 'seasonal') {
          matchesCategory = Boolean(item.isSeasonal);
        } else if (selectedCategory === 'fruits') {
          matchesCategory = item.category === 'fruits' || item.category === 'citrus';
        } else if (selectedCategory !== 'all') {
          matchesCategory = item.category === selectedCategory;
        }

        const q = searchQuery.toLowerCase().trim();
        const displayName = resolveLocalizedProduceName(item.name, lang, item.id);
        const matchesSearch =
          q === '' ||
          displayName.toLowerCase().includes(q) ||
          item.name.en.toLowerCase().includes(q) ||
          item.name.hi.toLowerCase().includes(q) ||
          item.name.mr.toLowerCase().includes(q) ||
          (item.name.hinglish && item.name.hinglish.toLowerCase().includes(q)) ||
          (item.subcategory && item.subcategory.toLowerCase().includes(q)) ||
          (item.variety && item.variety.toLowerCase().includes(q)) ||
          item.origin.toLowerCase().includes(q);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const aAvail = a.isAvailable !== false;
        const bAvail = b.isAvailable !== false;
        if (aAvail && !bAvail) return -1;
        if (!aAvail && bAvail) return 1;
        return 0;
      });
  }, [produceList, selectedCategory, searchQuery, lang]);

  // Stable sequential numbering across produce master catalogue
  const itemNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    produceList.forEach((p, idx) => {
      map.set(p.id, idx + 1);
    });
    return map;
  }, [produceList]);

  // Dynamic Category Counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: produceList.length,
      vegetables: 0,
      leafy: 0,
      roots: 0,
      citrus: 0,
      fruits: 0,
      herbs: 0,
      sprouts: 0,
      other: 0,
      seasonal: 0,
    };
    produceList.forEach((item) => {
      const cat = item.category;
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts.other++;
      }
      if (item.isSeasonal) {
        counts.seasonal++;
      }
    });
    return counts;
  }, [produceList]);

  // Overall Mandi Stock Overview
  const stockOverview = useMemo(() => {
    const inStock = produceList.filter((p) => p.isAvailable !== false).length;
    const outOfStock = produceList.length - inStock;
    const seasonal = produceList.filter((p) => p.isSeasonal).length;
    const total = produceList.length;
    return { inStock, outOfStock, seasonal, total };
  }, [produceList]);

  // Live Zero-Waste & Direct Mandi Savings for Home Screen Showcase
  const homeSavingsStats = useMemo(() => {
    let cartSaved = 0;
    let cartKg = 0;
    Object.entries(produceCart).forEach(([id, kg]) => {
      if (kg <= 0) return;
      cartKg += kg;
      const item = produceList.find((p) => p.id === id);
      if (item) {
        const effectivePrice =
          item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.pricePerKg;
        const marketPrice = item.localMarketPricePerKg || Math.round(effectivePrice * 1.3);
        cartSaved += Math.max(0, (marketPrice - effectivePrice) * kg);
      }
    });

    let ordersSaved = 0;
    let ordersKg = 0;
    orders.forEach((o) => {
      if (o.status === 'cancelled' || o.isSampleOrder) return;
      o.produceItems.forEach((pi) => {
        ordersKg += pi.quantityKg;
        const catalogItem = produceList.find((p) => p.id === pi.produceId);
        const marketPrice = catalogItem?.localMarketPricePerKg || Math.round(pi.pricePerKg * 1.3);
        ordersSaved += Math.max(0, (marketPrice - pi.pricePerKg) * pi.quantityKg);
      });
    });

    const totalSavedRupees = Math.round(cartSaved + ordersSaved);
    const totalKg = Math.round((cartKg + ordersKg) * 10) / 10;
    const wasteAvoidedKg = Math.round(totalKg * 0.32 * 10) / 10;
    return { totalSavedRupees, totalKg, wasteAvoidedKg };
  }, [produceCart, produceList, orders]);

  if (!user.isLoggedIn) {
    return <PlatformWelcomeShowcase />;
  }

  const rootCanvasClass =
    activeUiSample === 'fresh_boutique'
      ? 'bg-stone-50 dark:bg-slate-950'
      : 'bg-slate-50 dark:bg-slate-950';

  return (
    <div className={`relative min-h-screen w-full max-w-full overflow-x-hidden ${rootCanvasClass} text-slate-900 dark:text-slate-100 flex flex-col font-sans`}>
      {isGmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. Visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            to update your account.
          </span>
        </div>
      )}

      <LiveUpdateNotifier />

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenSavingsForecast={() => setIsSavingsModalOpen(true)}
        isAdminAuthorized={isAdminAuthorized}
      />

      <WindowBanner isAdminAuthorized={isAdminAuthorized} />

      {/* Main View Router */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden min-w-0 pb-24 md:pb-12">
        {/* VIEW 1: Fresh Produce Mandi Catalog */}
        {activeTab === 'catalog' && (
          <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8 py-2 sm:py-3 space-y-2.5">
            {/* 1. Compact Shopping Storefront Banner */}
            <StorePromoBanner
              homeSavingsStats={homeSavingsStats}
              onOpenSavingsForecast={() => setIsSavingsModalOpen(true)}
              onOpenAbout={() => setIsAboutModalOpen(true)}
            />

            {/* 2. Search & Shopping Quick Controls */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div className="relative flex-1 max-w-xl">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={pickLang(lang, {
                    en: 'Search fresh vegetables, fruits, herbs...',
                    hi: 'भिंडी, फूलगोभी, मौसंबी, मेथी खोजें...',
                    mr: 'भेंडी, मेथी, मोसंबी, मटार शोधा...',
                    hinglish: 'Bhindi, aloo, tamatar, mango search karein...',
                    gu: 'શાકભાજી, ફળો શોધો...',
                    bn: 'সবজি, ফল খুঁজুন...',
                    ta: 'காய்கறிகள், பழங்கள் தேடுங்கள்...',
                    te: 'కూరగాయలు, పండ్లు వెతకండి...',
                    kn: 'ತರಕಾರಿ, ಹಣ್ಣು ಹುಡುಕಿ...',
                    pa: 'ਸਬਜ਼ੀਆਂ, ਫਲ ਲੱਭੋ...',
                  })}
                  className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-emerald-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] tabular-nums">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>
                    {pickLang(lang, {
                      en: `${stockOverview.inStock} Fresh`,
                      hi: `${stockOverview.inStock} उपलब्ध`,
                      mr: `${stockOverview.inStock} उपलब्ध`,
                      hinglish: `${stockOverview.inStock} In Stock`,
                    })}
                  </span>
                </span>

                {featureFlags.dishRecipeHelper && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveHelper((prev) => (prev === 'recipe' ? 'none' : 'recipe'))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      activeHelper === 'recipe'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>
                      {pickLang(lang, {
                        en: 'Shop by Dish',
                        hi: 'डिश से चुनें',
                        mr: 'पदार्थानुसार',
                        hinglish: 'Dish Helper',
                      })}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        activeHelper === 'recipe' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                )}

                {featureFlags.seasonalTrendingSection && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveHelper((prev) => (prev === 'seasonal' ? 'none' : 'seasonal'))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      activeHelper === 'seasonal'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {pickLang(lang, {
                        en: 'Seasonal',
                        hi: 'मौसमी',
                        mr: 'हंगामी',
                        hinglish: 'Seasonal',
                      })}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        activeHelper === 'seasonal' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => refreshCatalogFromServer()}
                  disabled={isCatalogSyncing}
                  title={pickLang(lang, { en: 'Sync live stock', hi: 'ताज़ा स्टॉक देखें', mr: 'साठा ताजा करा' })}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3 h-3 ${isCatalogSyncing ? 'animate-spin text-emerald-600' : ''}`} />
                  <span className="hidden sm:inline">
                    {pickLang(lang, {
                      en: isCatalogSyncing ? 'Syncing' : 'Refresh',
                      hi: isCatalogSyncing ? 'अपडेट...' : 'ताज़ा',
                      mr: isCatalogSyncing ? 'अपडेट...' : 'ताजे',
                      hinglish: isCatalogSyncing ? 'Syncing' : 'Refresh',
                    })}
                  </span>
                </button>
              </div>
            </div>

            {activeHelper === 'recipe' && featureFlags.dishRecipeHelper && <RecipeDishHelper />}
            {activeHelper === 'seasonal' && featureFlags.seasonalTrendingSection && <SeasonalAndTrendingSection />}

            {/* 3. Visual Category Rail */}
            <div data-tour="catalog-categories">
              <CategoryQuickBar
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
                categoryCounts={categoryCounts}
              />
            </div>

            {/* 5. Produce Catalog Grid */}
            <div id="produce-catalog-section" className="w-full max-w-full overflow-hidden">
              {isCatalogSyncing || produceList.length === 0 ? (
                <CatalogGridSkeleton count={6} />
              ) : (
                <div
                  className={
                    activeUiSample === 'quick_mart'
                      ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-2 w-full max-w-full min-w-0'
                      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-2 w-full max-w-full min-w-0'
                  }
                >
                  {filteredProduce.map((item) => (
                    <ProduceCard
                      key={item.id}
                      item={item}
                      itemNumber={itemNumberMap.get(item.id)}
                      onOpenInsights={(p) => setInsightItem(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: Mobile Accessories Store */}
        {activeTab === 'accessories' && (
          <Suspense fallback={<ViewTabSkeleton />}>
            <MobileAccessoriesView
              isAdminAuthorized={isAdminAuthorized}
              onOpenAccessoryStudio={
                isAdminAuthorized
                  ? () => {
                      setAiStudioInitialTab('accessory_studio');
                      setIsAIStudioModalOpen(true);
                    }
                  : undefined
              }
            />
          </Suspense>
        )}

        {/* VIEW 3: Live Community Demand Pool */}
        {activeTab === 'pool' && (
          <Suspense fallback={<ViewTabSkeleton />}>
            <CommunityPoolView />
          </Suspense>
        )}

        {/* VIEW 4: Admin Console */}
        {activeTab === 'mandi' &&
          (isAdminAuthorized ? (
            <Suspense fallback={<ViewTabSkeleton />}>
              <MandiProcurementSheet
                onOpenInvoice={(order) => setInvoiceModalOrder(order)}
                onOpenAIStudio={() => {
                  setAiStudioInitialTab('single');
                  setIsAIStudioModalOpen(true);
                }}
                onOpenSamplesGallery={() => setIsSamplesGalleryOpen(true)}
                onLockAdmin={() => {
                  adminApi.logout().catch(() => {});
                  clearAdminToken();
                  setIsAdminUnlocked(false);
                  setIsAdminLocked(true);
                  setActiveTab('catalog');
                }}
              />
            </Suspense>
          ) : (
            <AdminLockGate
              onUnlock={() => {
                setIsAdminLocked(false);
                setIsAdminUnlocked(true);
              }}
              onBackToStore={() => setActiveTab('catalog')}
            />
          ))}

        {/* VIEW 5: Customer Order List */}
        {activeTab === 'orders' && (
          <Suspense fallback={<OrdersListSkeleton />}>
            <OrdersView
              isAdminAuthorized={isAdminAuthorized}
              onGoToMarket={() => setActiveTab('catalog')}
              onTrackOrder={(orderId) => {
                setTrackedOrderId(orderId);
                setActiveTab('tracking');
              }}
              onOpenInvoice={(order) => setInvoiceModalOrder(order)}
            />
          </Suspense>
        )}

        {/* VIEW 6: Real-time Mandi Dispatch & Cutoff Tracking Dashboard */}
        {activeTab === 'tracking' && (
          <Suspense fallback={<ViewTabSkeleton />}>
            <OrderTrackingDashboard
              initialOrderId={trackedOrderId}
              isAdminAuthorized={isAdminAuthorized}
              onGoToMarket={() => setActiveTab('catalog')}
              onOpenInvoice={(order) => setInvoiceModalOrder(order)}
            />
          </Suspense>
        )}

        {/* VIEW 7: Google Maps Platform Live Delivery Corridor */}
        {activeTab === 'map' && (
          <Suspense fallback={<ViewTabSkeleton />}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Google Maps Platform Live Procurement & Route Hub</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-slate-100 mt-1">
                    {pickLang(lang, {
                      en: 'APMC Vashi to Society Live Google Maps Corridor',
                      hi: 'वाशी APMC मंडी से सोसायटी तक Google Maps लाइव कॉरिडोर',
                      mr: 'वाशी एपीएमसी ते सोसायटी थेट Google Maps मार्ग',
                      hinglish: 'APMC Vashi se Society tak Live Google Maps Route',
                      gu: 'વાશી APMC મંડીથી સોસાયટી સુધી લાઈવ રૂટ',
                      bn: 'ভাশি APMC মান্ডি থেকে সোসাইটি লাইভ রুট',
                      ta: 'APMC வாஷி முதல் சொசைட்டி வரை நேரலை வழித்தடம்',
                      te: 'APMC వాషి నుండి సొసైటీ వరకు లైవ్ రూట్',
                      kn: 'APMC ವಾಶಿಯಿಂದ ಸೊಸೈಟಿಗೆ ಲೈವ್ ಮಾರ್ಗ',
                      pa: 'ਵਾਸ਼ੀ APMC ਤੋਂ ਸੁਸਾਇਟੀ ਤੱਕ ਲਾਈਵ ਰੂਟ',
                    })}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                    {pickLang(lang, {
                      en: 'Live GPS navigation track, cold-chain temperature monitoring, and society drop points powered by Google Maps.',
                      hi: 'सुबह 4:00 AM वाशी आढ़त नीलामी से लेकर 10:00 AM सोसायटी गेट डिलीवरी तक वैन का लाइव रास्ता और माइलस्टोन्स।',
                      mr: 'पहाटे ४ वाजता वाशी बाजारातून १० वाजता सोसायटी गेटपर्यंत डिलिव्हरी व्हॅनचा थेट मार्ग.',
                      hinglish: 'Subah 4:00 AM Vashi auction se 10:00 AM society delivery van ka live route.',
                      gu: 'સવારે 4:00 AM વાશી મંડીથી 10:00 AM સોસાયટી ડિલિવરી વાનનો લાઈવ રૂટ.',
                      bn: 'ভোর ৪:০০ ভাশি মান্ডি থেকে সকাল ১০:০০ সোসাইটি ডেলিভারি ভ্যানের লাইভ রুট।',
                      ta: 'அதிகாலை 4:00 AM மண்டியிலிருந்து காலை 10:00 AM டெலிவரி வேன் நேரலை பாதை.',
                      te: 'ఉదయం 4:00 AM మండి నుండి 10:00 AM డెలివరీ వ్యాన్ లైవ్ రూట్.',
                      kn: 'ಬೆಳಿಗ್ಗೆ 4:00 AM ಮಂಡಿಯಿಂದ 10:00 AM ಡೆಲಿವರಿ ವ್ಯಾನ್ ಲೈವ್ ಮಾರ್ಗ.',
                      pa: 'ਸਵੇਰੇ 4:00 AM ਮੰਡੀ ਤੋਂ 10:00 AM ਡਿਲੀਵਰੀ ਵੈਨ ਦਾ ਲਾਈਵ ਰੂਟ।',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('tracking')}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Truck className="w-4 h-4" />
                    <span>
                      {pickLang(lang, {
                        en: 'Open Full Order Tracker',
                        hi: 'विस्तृत आर्डर ट्रैकर खोलें',
                        mr: 'सविस्तर ट्रॅकर उघडा',
                        hinglish: 'Full Order Tracker Kholein',
                        gu: 'પૂરો ઓર્ડર ટ્રેકર ખોલો',
                        bn: 'সম্পূর্ণ অর্ডার ট্র্যাকার খুলুন',
                        ta: 'முழு ஆர்டர் டிராக்கரைத் திற',
                        te: 'పూర్తి ఆర్డర్ ట్రాకర్ తెరవండి',
                        kn: 'ಪೂರ್ಣ ಆರ್ಡರ್ ಟ್ರ್ಯಾಕರ್ ತೆರೆಯಿರಿ',
                        pa: 'ਪੂਰਾ ਆਰਡਰ ਟ੍ਰੈਕਰ ਖੋਲ੍ਹੋ',
                      })}
                    </span>
                  </button>
                </div>
              </div>

              {(() => {
                const activeOrder = orders.find(
                  (o) => o.status !== 'cancelled' && !o.isSampleOrder
                );
                const stageMap: Record<string, number> = {
                  ordered: 20,
                  procured_at_mandi: 45,
                  packed: 65,
                  out_for_delivery: 85,
                  delivered: 100,
                };
                const stage = activeOrder?.status || 'out_for_delivery';
                const pct = stageMap[stage] ?? 75;
                return (
                  <LiveMandiDeliveryMap transitProgressPercent={pct} deliveryStage={stage} />
                );
              })()}
            </div>
          </Suspense>
        )}

        {/* VIEW 8: Leaderboard consolidated cleanly inside Account & Services */}
        {activeTab === 'leaderboard' && (
          <AccountView
            onGoToStore={() => setActiveTab('catalog')}
            onOpenOrders={() => setActiveTab('orders')}
            onOpenTracking={() => setActiveTab('tracking')}
            onOpenMap={() => setActiveTab('map')}
            onOpenInstall={() => setIsInstallModalOpen(true)}
            onOpenSavingsForecast={() => setIsSavingsModalOpen(true)}
            onOpenSamplesGallery={isAdminAuthorized ? () => setIsSamplesGalleryOpen(true) : undefined}
            onOpenBrandModal={isAdminAuthorized ? () => setIsBrandModalOpen(true) : undefined}
            onOpenAdminDesk={() => setActiveTab('mandi')}
            onLockAdmin={() => {
              adminApi.logout().catch(() => {});
              clearAdminToken();
              setIsAdminUnlocked(false);
              setIsAdminLocked(true);
            }}
            isAdminAuthorized={isAdminAuthorized}
            isAdminLocked={isAdminLocked}
            initialSubSection="leaderboard"
            homeSavingsStats={homeSavingsStats}
          />
        )}

        {/* VIEW 9: Referral & ₹50 Cashback Hub */}
        {activeTab === 'referral' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <UserReferralDashboard onGoToShop={() => setActiveTab('catalog')} />
          </div>
        )}

        {/* VIEW 10: Account, Profile, Cashback, Tracking & App Downloads */}
        {activeTab === 'account' && (
          <AccountView
            onGoToStore={() => setActiveTab('catalog')}
            onOpenOrders={() => setActiveTab('orders')}
            onOpenTracking={() => setActiveTab('tracking')}
            onOpenMap={() => setActiveTab('map')}
            onOpenInstall={() => setIsInstallModalOpen(true)}
            onOpenSavingsForecast={() => setIsSavingsModalOpen(true)}
            onOpenSamplesGallery={isAdminAuthorized ? () => setIsSamplesGalleryOpen(true) : undefined}
            onOpenBrandModal={isAdminAuthorized ? () => setIsBrandModalOpen(true) : undefined}
            onOpenAdminDesk={() => setActiveTab('mandi')}
            onLockAdmin={() => {
              adminApi.logout().catch(() => {});
              clearAdminToken();
              setIsAdminUnlocked(false);
              setIsAdminLocked(true);
            }}
            isAdminAuthorized={isAdminAuthorized}
            isAdminLocked={isAdminLocked}
            homeSavingsStats={homeSavingsStats}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">{brand.brandName}</span>
            <span>·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">powered by MARCO 💯</span>
            <span>·</span>
            <span>APMC Vashi 4:00 AM Direct Sourcing</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setLegalModalTab('privacy');
                setIsTermsModalOpen(true);
              }}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors underline-offset-2 hover:underline cursor-pointer"
            >
              {pickLang(lang, {
                en: 'Privacy Policy',
                hi: 'गोपनीयता नीति',
                mr: 'गोपनीयता धोरण',
                hinglish: 'Privacy Policy',
              })}
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                setLegalModalTab('terms');
                setIsTermsModalOpen(true);
              }}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors underline-offset-2 hover:underline cursor-pointer"
            >
              {pickLang(lang, {
                en: 'Terms & Conditions',
                hi: 'नियम व शर्तें',
                mr: 'अटी व शर्ती',
                hinglish: 'Terms & Conditions',
              })}
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setIsAboutModalOpen(true)}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors underline-offset-2 hover:underline cursor-pointer"
            >
              {pickLang(lang, {
                en: 'About Us',
                hi: 'हमारे बारे में',
                mr: 'आमच्याबद्दल',
                hinglish: 'Hamare Baare Me',
                gu: 'અમારા વિશે',
                bn: 'আমাদের সম্পর্কে',
                ta: 'எங்களைப் பற்றி',
                te: 'మా గురించి',
                kn: 'ನಮ್ಮ ಬಗ್ಗೆ',
                pa: 'ਸਾਡੇ ਬਾਰੇ',
              })}
            </button>
            {(isAdminAuthorized || authService.isOwnerEmail(user.email)) && (
              <>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('mandi')}
                  className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition-colors group cursor-pointer"
                  title={pickLang(lang, { en: 'Admin Desk', hi: 'व्यवस्थापक पोर्टल', mr: 'अ‍ॅडमिन पोर्टल' })}
                >
                  <Lock className="w-3 h-3 group-hover:text-amber-500" />
                  <span>
                    {pickLang(lang, {
                      en: isAdminLocked ? 'Unlock Admin' : 'Admin',
                      hi: isAdminLocked ? 'एडमिन खोलें' : 'व्यवस्थापक',
                      mr: isAdminLocked ? 'अ‍ॅडमिन उघडा' : 'व्यवस्थापक',
                      hinglish: isAdminLocked ? 'Unlock Admin' : 'Admin',
                      gu: 'એડમિન',
                      bn: 'অ্যাডমিন',
                      ta: 'நிர்வாகி',
                      te: 'అడ్మిన్',
                      kn: 'ನಿರ್ವಾಹಕ',
                      pa: 'ਐਡਮਿਨ',
                    })}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      <CartDrawer
        onTrackOrder={(orderId) => {
          setTrackedOrderId(orderId);
          setActiveTab('tracking');
        }}
        onOpenInvoice={(order) => setInvoiceModalOrder(order)}
      />

      <Suspense fallback={null}>
        <AuthModal />
        <ProfileEditModal />
        <BrandCustomizerModal
          isOpen={isBrandModalOpen && isAdminAuthorized}
          onClose={() => setIsBrandModalOpen(false)}
        />
        <AIInsightsModal item={insightItem} onClose={() => setInsightItem(null)} />
        <OrderInvoiceModal
          order={invoiceModalOrder}
          brand={brand}
          isOpen={invoiceModalOrder !== null}
          onClose={() => setInvoiceModalOrder(null)}
        />
        <AIProductStudioModal
          isOpen={isAIStudioModalOpen}
          onClose={() => setIsAIStudioModalOpen(false)}
          initialTab={aiStudioInitialTab}
        />
        <AboutConceptModal
          isOpen={isAboutModalOpen}
          onClose={() => setIsAboutModalOpen(false)}
        />
        <BatchSavingsForecastModal
          isOpen={isSavingsModalOpen}
          onClose={() => setIsSavingsModalOpen(false)}
          onGoToShop={() => setActiveTab('catalog')}
        />
        <AndroidInstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          onOpenLegal={(tab) => {
            setLegalModalTab(tab);
            setIsTermsModalOpen(true);
          }}
        />
        <TermsAndConditionsModal
          isOpen={isTermsModalOpen}
          initialTab={legalModalTab}
          onClose={() => setIsTermsModalOpen(false)}
        />
      </Suspense>

      <UISamplesGalleryModal
        isOpen={isSamplesGalleryOpen && isAdminAuthorized}
        onClose={() => setIsSamplesGalleryOpen(false)}
      />

      {featureFlags.stickyCartBar && <StickyCartBar />}
      {featureFlags.smartNotifications && (
        <SmartDynamicToast
          homeSavingsStats={homeSavingsStats}
          onNavigateTab={setActiveTab}
          onOpenSavingsForecast={() => setIsSavingsModalOpen(true)}
        />
      )}
      {featureFlags.voiceOrderAssistant && <VoiceOrderAIDialog />}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <OnboardingTour activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected application error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-center">
            <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              Something went wrong
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </AppErrorBoundary>
  );
}

export default App;

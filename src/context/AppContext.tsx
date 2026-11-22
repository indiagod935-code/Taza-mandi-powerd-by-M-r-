import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  ProduceItem,
  MobileAccessoryItem,
  CustomerOrder,
  UserProfile,
  SavedAddress,
  BrandConfig,
  AppLanguage,
  ReferralProgramConfig,
  ReferralRecord,
  FamilyMemberPref,
  OrderFeedback,
  PlatformFeatureFlags,
  PlatformConfigState,
  StoreUiSampleId,
  FestivalThemeConfig,
} from '../types';
import { DEFAULT_FESTIVAL_THEME } from '../config/festivalThemes';
import { INITIAL_PRODUCE } from '../data/initialProduce';
import { INITIAL_ACCESSORIES } from '../data/initialAccessories';
import { TRANSLATIONS } from '../data/translations';
import { ENV_CONFIG, STORAGE_KEYS, DEFAULT_PLATFORM_FEATURE_FLAGS } from '../config/env';
import {
  buildProduceCatalogCsv,
  loadInitialProduceList,
  loadMergedAccessoriesList,
  sanitizeProduceCatalog,
} from '../services/catalogService';
import { orderService } from '../services/orderService';
import { readStorageString, removeStorageKey, writeStorageJson } from '../state/storage';
import { fluidSoundEngine } from '../utils/fluidSoundEngine';
import { logUserActivity } from '../utils/activityLogger';
import {
  signOutFirebaseUser,
  loadPlatformConfigFromFirestore,
  savePlatformConfigToFirestore,
  subscribeToPlatformConfig,
} from '../firebase';
import { getAdminAuthHeaders, getAdminToken } from '../api/client';
import { authService } from '../services/authService';
import { platformConfigApi } from '../api/endpoints';

interface AppContextType {
  brand: BrandConfig;
  updateBrand: (newConfig: Partial<BrandConfig>) => void;
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  t: (key: string) => string;
  produceList: ProduceItem[];
  updateProduceItem: (id: string, updates: Partial<ProduceItem>) => void;
  toggleProduceAvailability: (id: string) => void;
  toggleProduceSeasonal: (id: string) => void;
  deleteProduceItem: (id: string) => void;
  addProduceItem: (item: ProduceItem) => void;
  resetProduceToMaster: () => void;
  exportProduceMasterCsv: () => void;
  accessoriesList: MobileAccessoryItem[];
  addAccessoryItem: (item: MobileAccessoryItem) => void;
  updateAccessoryItem: (id: string, updates: Partial<MobileAccessoryItem>) => void;
  deleteAccessoryItem: (id: string) => void;
  founderPhotoUrl: string;
  setFounderPhotoUrl: (url: string) => void;
  familyPreferences: FamilyMemberPref[];
  addFamilyPreference: (pref: Omit<FamilyMemberPref, 'id'>) => void;
  updateFamilyPreference: (id: string, updates: Partial<FamilyMemberPref>) => void;
  removeFamilyPreference: (id: string) => void;
  voiceAutoOrderEnabled: boolean;
  setVoiceAutoOrderEnabled: (enabled: boolean) => void;
  voiceWakeWordEnabled: boolean;
  setVoiceWakeWordEnabled: (enabled: boolean) => void;
  customWakeName: string;
  setCustomWakeName: (name: string) => void;
  user: UserProfile;
  loginWithGoogle: (customEmail?: string, customName?: string) => void;
  loginWithCredentials: (data: {
    id?: string;
    name: string;
    phone: string;
    secondaryPhone?: string;
    email: string;
    flat: string;
    wing?: string;
    society: string;
    roadOrStreet?: string;
    fullAddress?: string;
    savedAddresses?: SavedAddress[];
    activeAddressId?: string;
    avatarUrl?: string;
    phoneVerified?: boolean;
    emailVerified?: boolean;
    verifiedGoogleEmail?: string;
  }) => void;
  logout: () => void;
  toggleLoginState: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  profileActiveTab: 'profile' | 'addresses' | 'referrals';
  setProfileActiveTab: (tab: 'profile' | 'addresses' | 'referrals') => void;
  openReferralDashboard: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  addSavedAddress: (address: Omit<SavedAddress, 'id'>) => void;
  updateSavedAddress: (id: string, updates: Partial<SavedAddress>) => void;
  deleteSavedAddress: (id: string) => void;
  setActiveAddress: (id: string) => void;

  // Referral, Cashback & Rewards Program
  referralConfig: ReferralProgramConfig;
  updateReferralConfig: (newConfig: Partial<ReferralProgramConfig>) => void;
  referralRecords: ReferralRecord[];
  addReferralRecord: (record: Omit<ReferralRecord, 'id' | 'createdAt'>) => void;
  updateReferralRecordStatus: (id: string, status: ReferralRecord['status'], giftDisbursed?: boolean) => void;
  deleteReferralRecord: (id: string) => void;
  clearTestReferrals: () => number;
  redeemWalletBalance: (amount: number) => number;
  referredByCode: string;
  setReferredByCode: (code: string) => void;

  // Produce Cart (Kg)
  produceCart: { [produceId: string]: number };
  setProduceCartQty: (produceId: string, kg: number) => void;
  addProduceToCart: (produceId: string, kg: number) => void;
  removeProduceFromCart: (produceId: string) => void;
  // Accessory Cart (Units)
  accessoryCart: { [accessoryId: string]: number };
  setAccessoryCartQty: (accessoryId: string, qty: number) => void;
  addAccessoryToCart: (accessoryId: string, qty: number) => void;
  removeAccessoryFromCart: (accessoryId: string) => void;
  clearAllCarts: () => void;
  // Total cart stats
  totalCartItemCount: number;
  totalProduceWeightKg: number;
  // Community Demand
  getCommunityDemandKg: (produceId: string) => number;
  // Orders & 24x7 Cutoff Batching
  orders: CustomerOrder[];
  isOrdersLoading: boolean;
  refreshOrdersFromServer: () => Promise<void>;
  isCatalogSyncing: boolean;
  refreshCatalogFromServer: () => Promise<void>;
  placeOrder: (
    deliverySlot: string,
    paymentMethod?: 'upi_qr' | 'cod' | 'wallet',
    rewardMeta?: { discountAmount?: number; couponCode?: string; surpriseGift?: string }
  ) => CustomerOrder;
  confirmCurrentOrLastOrder: (paymentMethod?: 'upi_qr' | 'cod') => CustomerOrder | null;
  cancelOrder: (orderId: string, reason?: string) => boolean;
  updateOrderStatus: (orderId: string, status: CustomerOrder['status']) => void;
  confirmOrderDeliveryAndPayment: (orderId: string) => {
    orderUpdated: boolean;
    referralCredited: boolean;
    message: string;
  };
  submitOrderFeedback: (
    orderId: string,
    payload: {
      rating: number;
      freshnessTags?: string[];
      comment?: string;
      stage?: 'checkout' | 'delivered';
    }
  ) => void;
  isBefore11PmCutoff: boolean;
  toggleCutoffOverride: () => void;
  cutoffOverride: boolean | null;
  timeUntil11Pm: string;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Ambient Fluid Atmosphere & Liquid Sound Engine
  ambientFluidColor: string | null;
  setAmbientFluidColor: (color: string | null) => void;
  isFluidSoundActive: boolean;
  toggleFluidSound: () => void;

  // Admin Master Feature Toggles, UI Theme Samples & Festival Themes
  featureFlags: PlatformFeatureFlags;
  activeUiSample: StoreUiSampleId;
  festivalTheme: FestivalThemeConfig;
  updateFeatureFlags: (updates: Partial<PlatformFeatureFlags>) => void;
  resetFeatureFlags: () => void;
  setActiveUiSample: (sample: StoreUiSampleId) => void;
  updateFestivalTheme: (theme: FestivalThemeConfig) => void;
  resetFestivalTheme: () => void;
}

const DEFAULT_BRAND: BrandConfig = {
  brandName: 'ताज़ाMandi',
  tagline: 'होलसेल मंडी से सीधा घर · powered by MARCO 💯',
  societyName: 'सोसायटी व डिलीवरी क्षेत्र',
  mandiCity: 'APMC Vashi Wholesale Mandi, Navi Mumbai',
  whatsappContact: '+91 88288 22808',
};

const DEFAULT_REFERRAL_CONFIG: ReferralProgramConfig = {
  isEnabled: true,
  referrerCashbackAmount: 50,
  refereeDiscountAmount: 30,
  freeProduceGiftEnabled: true,
  freeProduceName: '1 गड्डी ताज़ी पालक / पालक जुडी',
  minOrderValueToQualify: 150,
  promotionalMessage: 'ताज़ा APMC वाशी मंडी से सीधा ताज़ी सब्ज़ियाँ और फल मंगवाएं और पाएँ ₹30 की छूट + मुफ्त उपहार 🎁!',
};

const DEFAULT_USER: UserProfile = {
  id: 'customer-pending',
  name: '',
  email: '',
  phone: '',
  secondaryPhone: '',
  flat: '',
  wing: '',
  society: '',
  fullAddress: '',
  savedAddresses: [],
  activeAddressId: '',
  isLoggedIn: false, // Starts logged out so "👤 Login / Sign In" button is prominently visible
  loginMethod: 'password',
  referralCode: 'TAZA-SHARE',
  walletBalance: 0, // Earns ₹50 per referred customer ONLY after >=₹150 purchase, delivery & payment confirmation
  freeGiftAvailable: '1 गड्डी ताज़ी पालक',
};

// Authentic Order Registry: Starts 100% clean with ZERO mock or dummy orders
const INITIAL_SOCIETY_ORDERS: CustomerOrder[] = [];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // One-time cache purge to eliminate any legacy demo data or fake "Green Valley / 402" profiles on user devices
  try {
    const PURGE_VERSION = 'v5_clean_production_2026';
    if (localStorage.getItem('tazamandi_production_version') !== PURGE_VERSION) {
      localStorage.removeItem('marco100_orders');
      localStorage.removeItem('tazamandi_master_produce_v30');
      localStorage.removeItem('tazamandi_master_produce_v42');
      const savedUser = localStorage.getItem('marco100_user');
      if (savedUser && (savedUser.includes('Green Valley') || savedUser.includes('Ramesh') || savedUser.includes('402'))) {
        localStorage.removeItem('marco100_user');
      }
      const savedBrand = localStorage.getItem('tazamandi_active_brand');
      if (savedBrand && savedBrand.includes('Green Valley')) {
        localStorage.removeItem('tazamandi_active_brand');
      }
      localStorage.setItem('tazamandi_production_version', PURGE_VERSION);
    }
  } catch {}

  // Brand Configuration (Defaulting to ताज़ाMandi powered by MARCO 💯)
  const [brand, setBrand] = useState<BrandConfig>(() => {
    try {
      const saved = localStorage.getItem('tazamandi_active_brand');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.brandName && !parsed.societyName?.includes('Green Valley')) return parsed;
      }
    } catch {}
    return DEFAULT_BRAND;
  });

  // Language defaults to English ('en') unless user explicitly picks another global/Indian language
  const [lang, setLang] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('marco100_lang');
    return (saved as AppLanguage) || 'en';
  });

  // User Profile - starts 100% clean; accepts only genuinely registered accounts
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('marco100_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const blockedDummyNames = new Set([
          'Ramesh Patel',
          'Customer Account',
          'Valued Customer',
          'Admin & Customer',
          'Rahul Sharma (Google User)',
        ]);
        const phoneDigits = String(parsed?.phone || '').replace(/\D/g, '');
        if (
          parsed &&
          parsed.isLoggedIn &&
          parsed.id &&
          String(parsed.id).startsWith('usr-') &&
          parsed.name &&
          !blockedDummyNames.has(parsed.name) &&
          phoneDigits.length >= 10 &&
          !String(parsed.society || '').includes('Green Valley')
        ) {
          return {
            ...parsed,
            savedAddresses: parsed.savedAddresses || [],
            activeAddressId: parsed.activeAddressId || '',
            secondaryPhone: parsed.secondaryPhone || '',
          };
        } else {
          localStorage.removeItem('marco100_user');
        }
      }
    } catch {}
    return DEFAULT_USER;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'profile' | 'addresses' | 'referrals'>('profile');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Ambient Fluid Atmosphere & Liquid Sound Engine
  const [ambientFluidColor, setAmbientFluidColor] = useState<string | null>(null);
  const [isFluidSoundActive, setIsFluidSoundActive] = useState<boolean>(() => !fluidSoundEngine.getIsMuted());

  const toggleFluidSound = () => {
    const active = fluidSoundEngine.toggleMute();
    setIsFluidSoundActive(active);
  };

  const openReferralDashboard = () => {
    setProfileActiveTab('referrals');
    setIsProfileModalOpen(true);
  };


  // Storage Sync Version via catalogService (separates business logic & storage migration)
  const SANITIZED_INITIAL_PRODUCE: ProduceItem[] = sanitizeProduceCatalog(INITIAL_PRODUCE);

  // Produce Master State & Accessories (Instant Fresh Sync)
  const [produceList, setProduceList] = useState<ProduceItem[]>(() => loadInitialProduceList());

  const [accessoriesList, setAccessoriesList] = useState<MobileAccessoryItem[]>(() =>
    loadMergedAccessoriesList()
  );

  const [founderPhotoUrl, setFounderPhotoUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('tazamandi_marco_founder_photo') || '/assets/images/marco_founder_portrait.jpg';
    } catch {
      return '/assets/images/marco_founder_portrait.jpg';
    }
  });

  const [familyPreferences, setFamilyPreferences] = useState<FamilyMemberPref[]>(() => {
    try {
      const saved = localStorage.getItem('tazamandi_family_prefs_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [voiceAutoOrderEnabled, setVoiceAutoOrderEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tazamandi_voice_auto_order');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const [voiceWakeWordEnabled, setVoiceWakeWordEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tazamandi_voice_wake_enabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const [customWakeName, setCustomWakeName] = useState<string>(() => {
    try {
      return localStorage.getItem('tazamandi_custom_wake_name') || 'ताज़ा मंडी';
    } catch {
      return 'ताज़ा मंडी';
    }
  });

  // Carts
  const [produceCart, setProduceCart] = useState<{ [produceId: string]: number }>(() => {
    const saved = localStorage.getItem('marco100_cart_produce');
    return saved ? JSON.parse(saved) : {};
  });

  const [accessoryCart, setAccessoryCart] = useState<{ [accessoryId: string]: number }>(() => {
    const saved = localStorage.getItem('marco100_cart_accessories');
    return saved ? JSON.parse(saved) : {};
  });

  const produceCartRef = useRef(produceCart);
  const accessoryCartRef = useRef(accessoryCart);
  produceCartRef.current = produceCart;
  accessoryCartRef.current = accessoryCart;

  // Authentic Order Chime generator using Web Audio API
  const playOrderSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      // High-clarity double ding
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch {}
  };

  // Orders: 100% Real Customer Orders Only (Zero mock or sample orders)
  const [orders, setOrders] = useState<CustomerOrder[]>(() => {
    try {
      const saved = localStorage.getItem('marco100_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Strictly purge any legacy sample or synthetic smoke/test orders
          return parsed.filter(
            (o: any) =>
              !o.isSampleOrder &&
              !o.id?.startsWith('ORD-108') &&
              !o.id?.startsWith('SMOKE') &&
              o.id !== 'ORD-883916' &&
              !/^(test|smoke)/i.test(String(o.customerName || '').trim())
          );
        }
      }
    } catch {}
    return INITIAL_SOCIETY_ORDERS;
  });

  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isCatalogSyncing, setIsCatalogSyncing] = useState(false);

  // 11 PM Cutoff Simulation Override (null = follow natural clock)
  const [cutoffOverride, setCutoffOverride] = useState<boolean | null>(null);

  // Local storage synchronization
  useEffect(() => {
    localStorage.setItem('tazamandi_active_brand', JSON.stringify(brand));
  }, [brand]);

  useEffect(() => {
    localStorage.setItem('marco100_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('marco100_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('marco100_cart_produce', JSON.stringify(produceCart));
  }, [produceCart]);

  useEffect(() => {
    localStorage.setItem('marco100_cart_accessories', JSON.stringify(accessoryCart));
  }, [accessoryCart]);

  useEffect(() => {
    localStorage.setItem('marco100_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.MASTER_PRODUCE, produceList);
  }, [produceList]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.ACCESSORIES_LIST, accessoriesList);
  }, [accessoriesList]);

  useEffect(() => {
    try {
      localStorage.setItem('tazamandi_marco_founder_photo', founderPhotoUrl);
    } catch {}
  }, [founderPhotoUrl]);

  useEffect(() => {
    try {
      localStorage.setItem('tazamandi_family_prefs_v1', JSON.stringify(familyPreferences));
    } catch {}
  }, [familyPreferences]);

  useEffect(() => {
    try {
      localStorage.setItem('tazamandi_voice_auto_order', String(voiceAutoOrderEnabled));
    } catch {}
  }, [voiceAutoOrderEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('tazamandi_voice_wake_enabled', String(voiceWakeWordEnabled));
    } catch {}
  }, [voiceWakeWordEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('tazamandi_custom_wake_name', customWakeName);
    } catch {}
  }, [customWakeName]);

  // Admin Master Platform Feature Flags, Visual UI Sample & Festival Theme
  const [platformConfig, setPlatformConfig] = useState<PlatformConfigState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLATFORM_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          featureFlags: {
            ...DEFAULT_PLATFORM_FEATURE_FLAGS,
            ...(parsed?.featureFlags && typeof parsed.featureFlags === 'object' ? parsed.featureFlags : {}),
          },
          activeUiSample: (parsed?.activeUiSample as StoreUiSampleId) || 'classic',
          festivalTheme: parsed?.festivalTheme
            ? { ...DEFAULT_FESTIVAL_THEME, ...parsed.festivalTheme }
            : { ...DEFAULT_FESTIVAL_THEME },
          updatedAt: parsed?.updatedAt,
          updatedBy: parsed?.updatedBy,
        };
      }
    } catch {}
    return {
      featureFlags: { ...DEFAULT_PLATFORM_FEATURE_FLAGS },
      activeUiSample: 'classic',
      festivalTheme: { ...DEFAULT_FESTIVAL_THEME },
    };
  });

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.PLATFORM_CONFIG, platformConfig);
  }, [platformConfig]);

  useEffect(() => {
    let cancelled = false;
    const applyRemoteConfig = (remote: any) => {
      if (cancelled || !remote) return;
      setPlatformConfig((prev) => ({
        featureFlags: {
          ...DEFAULT_PLATFORM_FEATURE_FLAGS,
          ...(remote.featureFlags || {}),
        },
        activeUiSample: (remote.activeUiSample as StoreUiSampleId) || prev.activeUiSample || 'classic',
        festivalTheme: remote.festivalTheme
          ? { ...DEFAULT_FESTIVAL_THEME, ...remote.festivalTheme }
          : prev.festivalTheme || { ...DEFAULT_FESTIVAL_THEME },
        brand: remote.brand ? remote.brand : prev.brand,
        updatedAt: remote.updatedAt || prev.updatedAt,
        updatedBy: remote.updatedBy || prev.updatedBy,
      }));
      if (remote.brand && typeof remote.brand === 'object' && remote.brand.brandName) {
        setBrand((prev) => ({ ...prev, ...remote.brand }));
      }
    };

    const syncFromServer = async () => {
      try {
        const res = await platformConfigApi.get();
        if (!cancelled && res?.success && res.config) {
          applyRemoteConfig(res.config);
        }
      } catch {
        // Offline / slow server fallback keeps localStorage state
      }
    };

    syncFromServer();
    const interval = setInterval(syncFromServer, 15000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        syncFromServer();
      }
    };
    const onFocus = () => syncFromServer();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadPlatformConfigFromFirestore()
      .then((fbConfig) => {
        if (!cancelled && fbConfig) {
          setPlatformConfig((prev) => ({
            ...prev,
            featureFlags: {
              ...DEFAULT_PLATFORM_FEATURE_FLAGS,
              ...(prev.featureFlags || {}),
              ...(fbConfig.featureFlags || {}),
            },
            activeUiSample: (fbConfig.activeUiSample as StoreUiSampleId) || prev.activeUiSample || 'classic',
            festivalTheme: fbConfig.festivalTheme
              ? { ...DEFAULT_FESTIVAL_THEME, ...(fbConfig.festivalTheme as FestivalThemeConfig) }
              : prev.festivalTheme || { ...DEFAULT_FESTIVAL_THEME },
          }));
        }
      })
      .catch(() => {});

    const unsubscribe = subscribeToPlatformConfig((fbConfig) => {
      if (cancelled || !fbConfig) return;
      setPlatformConfig((prev) => ({
        ...prev,
        featureFlags: {
          ...DEFAULT_PLATFORM_FEATURE_FLAGS,
          ...(prev.featureFlags || {}),
          ...(fbConfig.featureFlags || {}),
        },
        activeUiSample: (fbConfig.activeUiSample as StoreUiSampleId) || prev.activeUiSample || 'classic',
        festivalTheme: fbConfig.festivalTheme
          ? { ...DEFAULT_FESTIVAL_THEME, ...(fbConfig.festivalTheme as FestivalThemeConfig) }
          : prev.festivalTheme || { ...DEFAULT_FESTIVAL_THEME },
      }));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user.isLoggedIn, user.email]);

  const canMutatePlatformConfig = () =>
    Boolean(getAdminToken()) || authService.isOwnerEmail(user.email);

  const updateFeatureFlags = (updates: Partial<PlatformFeatureFlags>) => {
    if (!canMutatePlatformConfig()) return;
    setPlatformConfig((prev) => {
      const nextFlags: PlatformFeatureFlags = {
        ...DEFAULT_PLATFORM_FEATURE_FLAGS,
        ...prev.featureFlags,
        ...updates,
      };
      const nextConfig: PlatformConfigState = {
        ...prev,
        featureFlags: nextFlags,
        updatedAt: new Date().toISOString(),
      };
      platformConfigApi.update({ featureFlags: nextFlags }).catch(() => {});
      savePlatformConfigToFirestore({
        featureFlags: nextFlags as unknown as Record<string, boolean>,
        activeUiSample: nextConfig.activeUiSample,
        festivalTheme: nextConfig.festivalTheme as unknown as Record<string, any>,
      }).catch(() => {});
      return nextConfig;
    });
  };

  const resetFeatureFlags = () => {
    if (!canMutatePlatformConfig()) return;
    const nextFlags: PlatformFeatureFlags = { ...DEFAULT_PLATFORM_FEATURE_FLAGS };
    setPlatformConfig((prev) => {
      const nextConfig: PlatformConfigState = {
        ...prev,
        featureFlags: nextFlags,
        updatedAt: new Date().toISOString(),
      };
      platformConfigApi.update({ featureFlags: nextFlags }).catch(() => {});
      savePlatformConfigToFirestore({
        featureFlags: nextFlags as unknown as Record<string, boolean>,
        activeUiSample: nextConfig.activeUiSample,
        festivalTheme: nextConfig.festivalTheme as unknown as Record<string, any>,
      }).catch(() => {});
      return nextConfig;
    });
  };

  const setActiveUiSample = (sample: StoreUiSampleId) => {
    if (!canMutatePlatformConfig()) return;
    setPlatformConfig((prev) => {
      const nextConfig: PlatformConfigState = {
        ...prev,
        activeUiSample: sample,
        updatedAt: new Date().toISOString(),
      };
      platformConfigApi.update({ activeUiSample: sample }).catch(() => {});
      savePlatformConfigToFirestore({
        featureFlags: nextConfig.featureFlags as unknown as Record<string, boolean>,
        activeUiSample: sample,
        festivalTheme: nextConfig.festivalTheme as unknown as Record<string, any>,
      }).catch(() => {});
      return nextConfig;
    });
  };

  const updateFestivalTheme = (theme: FestivalThemeConfig) => {
    if (!canMutatePlatformConfig()) return;
    setPlatformConfig((prev) => {
      const nextConfig: PlatformConfigState = {
        ...prev,
        festivalTheme: theme,
        updatedAt: new Date().toISOString(),
      };
      platformConfigApi.update({ festivalTheme: theme }).catch(() => {});
      savePlatformConfigToFirestore({
        featureFlags: nextConfig.featureFlags as unknown as Record<string, boolean>,
        activeUiSample: nextConfig.activeUiSample,
        festivalTheme: theme as unknown as Record<string, any>,
      }).catch(() => {});
      return nextConfig;
    });
  };

  const resetFestivalTheme = () => {
    if (!canMutatePlatformConfig()) return;
    updateFestivalTheme({ ...DEFAULT_FESTIVAL_THEME });
  };

  const addAccessoryItem = (item: MobileAccessoryItem) => {
    setAccessoriesList((prev) => [item, ...prev]);
  };

  const updateAccessoryItem = (id: string, updates: Partial<MobileAccessoryItem>) => {
    setAccessoriesList((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
  };

  const deleteAccessoryItem = (id: string) => {
    setAccessoriesList((prev) => prev.filter((acc) => acc.id !== id));
  };

  const addFamilyPreference = (pref: Omit<FamilyMemberPref, 'id'>) => {
    setFamilyPreferences((prev) => [
      ...prev,
      { ...pref, id: `fam_${Date.now()}_${Math.floor(Math.random() * 1000)}` },
    ]);
  };

  const updateFamilyPreference = (id: string, updates: Partial<FamilyMemberPref>) => {
    setFamilyPreferences((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const removeFamilyPreference = (id: string) => {
    setFamilyPreferences((prev) => prev.filter((p) => p.id !== id));
  };

  // Capture friend's incoming referral code (?ref=TAZA-XXX) cleanly
  const [referredByCode, setReferredByCodeState] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const incoming = (params.get('ref') || '').trim().toUpperCase();
      if (incoming) {
        localStorage.setItem('tazamandi_referred_by_code', incoming);
        return incoming;
      }
      return (localStorage.getItem('tazamandi_referred_by_code') || '').trim().toUpperCase();
    } catch {
      return '';
    }
  });

  const setReferredByCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    setReferredByCodeState(clean);
    try {
      if (clean) localStorage.setItem('tazamandi_referred_by_code', clean);
      else localStorage.removeItem('tazamandi_referred_by_code');
    } catch {}
  };

  // Referral Program & Cashback State
  const [referralConfig, setReferralConfig] = useState<ReferralProgramConfig>(() => {
    try {
      const saved = localStorage.getItem('tazamandi_referral_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_REFERRAL_CONFIG,
          ...parsed,
          minOrderValueToQualify: Math.max(150, Number(parsed.minOrderValueToQualify || 150)),
        };
      }
    } catch {}
    return DEFAULT_REFERRAL_CONFIG;
  });

  const isSyntheticReferralRecord = (r: ReferralRecord) => {
    const code = String(r.referralCode || '').trim().toUpperCase();
    const id = String(r.id || '').trim().toUpperCase();
    const referee = String(r.refereeName || '').trim().toLowerCase();
    return (
      id === 'REF-101' ||
      id === 'REF-102' ||
      id.startsWith('REF-TEST-') ||
      id === 'REF-ORD-070263' ||
      id === 'REF-ORD-070211' ||
      code.startsWith('TESTREF') ||
      /^(test buyer|vikram joshi|smoke)/i.test(referee)
    );
  };

  const [referralRecords, setReferralRecords] = useState<ReferralRecord[]>(() => {
    try {
      const saved = localStorage.getItem('tazamandi_referral_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Strip all legacy seeded demo / synthetic test rows
        if (Array.isArray(parsed)) {
          return parsed.filter((r: ReferralRecord) => !isSyntheticReferralRecord(r));
        }
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tazamandi_referral_config', JSON.stringify(referralConfig));
  }, [referralConfig]);

  useEffect(() => {
    localStorage.setItem('tazamandi_referral_records', JSON.stringify(referralRecords));
  }, [referralRecords]);

  // Sync earned referral cashback balance from backend ledger for current user code
  useEffect(() => {
    const myCode = (user.referralCode || '').trim().toUpperCase();
    if (!myCode) return;
    fetch(`/api/referrals/status?code=${encodeURIComponent(myCode)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data?.success) return;
        if (Array.isArray(data.records) && data.records.length > 0) {
          setReferralRecords((prev) => {
            const byId = new Map<string, ReferralRecord>();
            prev.filter((r) => !isSyntheticReferralRecord(r)).forEach((rec) => byId.set(rec.orderId || rec.id, rec));
            data.records
              .filter((r: ReferralRecord) => !isSyntheticReferralRecord(r))
              .forEach((srv: ReferralRecord) => byId.set(srv.orderId || srv.id, srv));
            return Array.from(byId.values());
          });
        }
        if (typeof data.walletBalance === 'number' && data.walletBalance > (user.walletBalance || 0)) {
          setUser((prev) => ({ ...prev, walletBalance: data.walletBalance }));
        }
      })
      .catch(() => {});
  }, [user.referralCode, user.isLoggedIn]);

  const updateReferralConfig = (newConfig: Partial<ReferralProgramConfig>) => {
    setReferralConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const addReferralRecord = (record: Omit<ReferralRecord, 'id' | 'createdAt'>) => {
    const newRecord: ReferralRecord = {
      ...record,
      id: `ref-${Date.now()}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
    };
    setReferralRecords((prev) => [newRecord, ...prev]);
  };

  const updateReferralRecordStatus = (id: string, status: ReferralRecord['status'], giftDisbursed?: boolean) => {
    let creditedCode = '';
    let creditAmount = 0;
    setReferralRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const wasRewarded = r.status === 'rewarded';
        const minReq = referralConfig.minOrderValueToQualify || 150;
        if (status === 'rewarded' && !wasRewarded && (r.orderAmount === undefined || r.orderAmount >= minReq)) {
          creditedCode = (r.referralCode || '').trim().toUpperCase();
          creditAmount = r.cashbackAmount || referralConfig.referrerCashbackAmount || 50;
        }
        return {
          ...r,
          status,
          ...(status === 'rewarded' ? { paymentConfirmed: true, deliveryStatus: 'delivered' as const, rewardedAt: new Date().toISOString() } : {}),
          ...(giftDisbursed !== undefined ? { giftDisbursed } : {}),
        };
      })
    );
    if (creditedCode && creditAmount > 0 && user.referralCode?.toUpperCase() === creditedCode) {
      setUser((prev) => ({ ...prev, walletBalance: (prev.walletBalance || 0) + creditAmount }));
    }
  };

  const deleteReferralRecord = (id: string) => {
    setReferralRecords((prev) => prev.filter((r) => r.id !== id));
    try {
      fetch(`/api/referrals/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { ...getAdminAuthHeaders() },
      }).catch(() => {});
    } catch {}
  };

  const clearTestReferrals = (): number => {
    const isTestRecord = (r: ReferralRecord) =>
      isSyntheticReferralRecord(r) || (r.sharedType === 'product' && !r.orderId);
    let removed = 0;
    setReferralRecords((prev) => {
      const next = prev.filter((r) => !isTestRecord(r));
      removed = prev.length - next.length;
      return next;
    });
    try {
      fetch('/api/referrals', {
        method: 'DELETE',
        headers: { ...getAdminAuthHeaders() },
      }).catch(() => {});
    } catch {}
    return removed;
  };

  const redeemWalletBalance = (amount: number) => {
    let redeemed = 0;
    setUser((prev) => {
      const current = prev.walletBalance || 0;
      redeemed = Math.min(current, amount);
      return { ...prev, walletBalance: current - redeemed };
    });
    return redeemed;
  };

  // Produce Master Admin Handlers
  const updateProduceItem = (id: string, updates: Partial<ProduceItem>) => {
    setProduceList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : item
      )
    );
  };

  const toggleProduceAvailability = (id: string) => {
    setProduceList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isAvailable: item.isAvailable === false ? true : false,
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : item
      )
    );
  };

  const toggleProduceSeasonal = (id: string) => {
    setProduceList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isSeasonal: !item.isSeasonal,
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : item
      )
    );
  };

  const deleteProduceItem = (id: string) => {
    setProduceList((prev) => prev.filter((item) => item.id !== id));
  };

  const addProduceItem = (item: ProduceItem) => {
    setProduceList((prev) => [item, ...prev]);
  };

  const resetProduceToMaster = () => {
    removeStorageKey(STORAGE_KEYS.MASTER_PRODUCE);
    removeStorageKey(STORAGE_KEYS.APP_VERSION);
    setProduceList(SANITIZED_INITIAL_PRODUCE);
  };

  const exportProduceMasterCsv = () => {
    const csvContent = buildProduceCatalogCsv(produceList);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `TazaMandi_Vegetables_Fruits_Master_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Translation helper
  const t = (key: string): string => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS['hi'];
    return dict[key] || TRANSLATIONS['en'][key] || key;
  };

  const updateBrand = (newConfig: Partial<BrandConfig>) => {
    if (!canMutatePlatformConfig()) return;
    setBrand((prev) => {
      const nextBrand = { ...prev, ...newConfig };
      platformConfigApi.update({ brand: nextBrand }).catch(() => {});
      return nextBrand;
    });
  };

  // 24x7 11:00 PM Cutoff Mechanics via orderService
  const isNaturalBefore11Pm = () => orderService.isNaturalBeforeCutoff();

  const isBefore11PmCutoff = cutoffOverride !== null ? cutoffOverride : isNaturalBefore11Pm();

  const toggleCutoffOverride = () => {
    setCutoffOverride((prev) => (prev === null ? !isNaturalBefore11Pm() : !prev));
  };

  // Countdown timer to 11:00 PM
  const [timeUntil11Pm, setTimeUntil11Pm] = useState(() => orderService.computeTimeUntilCutoff());

  useEffect(() => {
    const updateTime = () => {
      setTimeUntil11Pm(orderService.computeTimeUntilCutoff());
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Authentication Handlers (Strictly registered accounts only — no anonymous bypasses)
  const loginWithGoogle = () => {
    setIsAuthModalOpen(true);
  };

  const loginWithCredentials = async (data: {
    id?: string;
    name: string;
    phone: string;
    secondaryPhone?: string;
    email: string;
    flat: string;
    wing?: string;
    society: string;
    roadOrStreet?: string;
    fullAddress?: string;
    savedAddresses?: SavedAddress[];
    activeAddressId?: string;
    avatarUrl?: string;
    phoneVerified?: boolean;
    emailVerified?: boolean;
    verifiedGoogleEmail?: string;
  }) => {
    const primaryAddrId = data.activeAddressId || `addr-${Date.now()}`;
    const initialFullAddress =
      data.fullAddress ||
      `${data.flat ? data.flat + ', ' : ''}${data.society ? data.society + ', ' : ''}${data.roadOrStreet || ''}`.replace(
        /,\s*$/,
        ''
      );
    const defaultAddr: SavedAddress = {
      id: primaryAddrId,
      label: 'मुख्य पता (Home)',
      flat: data.flat || 'Doorstep',
      wing: data.wing || '',
      society: data.society || '',
      roadOrStreet: data.roadOrStreet || '',
      fullAddress: initialFullAddress,
      isDefault: true,
    };

    const cleanFlatNum = data.flat ? data.flat.replace(/\D/g, '') || '101' : '101';
    const newUserProfile: UserProfile = {
      id: data.id || `usr-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      secondaryPhone: data.secondaryPhone || '',
      flat: data.flat || 'Doorstep',
      wing: data.wing || '',
      society: data.society || '',
      roadOrStreet: data.roadOrStreet || '',
      fullAddress: initialFullAddress,
      savedAddresses:
        data.savedAddresses && data.savedAddresses.length > 0 ? data.savedAddresses : [defaultAddr],
      activeAddressId: primaryAddrId,
      isLoggedIn: true,
      loginMethod: 'password',
      phoneVerified: Boolean(data.phoneVerified),
      emailVerified: Boolean(data.emailVerified),
      verifiedGoogleEmail: data.verifiedGoogleEmail,
      avatarUrl: data.avatarUrl || undefined,
      referralCode: `TAZA-${cleanFlatNum}`,
      walletBalance: 0,
      freeGiftAvailable: '1 गड्डी ताज़ी पालक',
    };

    setUser(newUserProfile);
    setIsAuthModalOpen(false);
    try {
      localStorage.setItem('marco100_user', JSON.stringify(newUserProfile));
    } catch {}
  };

  // Update Profile details (Name, primary phone, secondary phone, email)
  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      try {
        const existing = localStorage.getItem('tazamandi_customers_db');
        if (existing) {
          const db = JSON.parse(existing);
          const idx = db.findIndex((c: any) => c.phone === prev.phone || c.email === prev.email);
          if (idx !== -1) {
            db[idx] = { ...db[idx], ...updates };
            localStorage.setItem('tazamandi_customers_db', JSON.stringify(db));
          }
        }
        // Sync with backend API
        if (prev.id) {
          fetch(`/api/user/profile/${prev.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          }).catch(() => {});
        }
      } catch {}
      return updated;
    });
  };

  // Add new additional delivery address
  const addSavedAddress = (address: Omit<SavedAddress, 'id'>) => {
    setUser((prev) => {
      const newId = `addr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newAddress: SavedAddress = { ...address, id: newId };
      const currentList = prev.savedAddresses || [];
      const updatedList = address.isDefault
        ? [...currentList.map((a) => ({ ...a, isDefault: false })), newAddress]
        : [...currentList, newAddress];

      return {
        ...prev,
        savedAddresses: updatedList,
        activeAddressId: address.isDefault || updatedList.length === 1 ? newId : (prev.activeAddressId || newId),
        flat: address.isDefault ? address.flat : prev.flat,
        wing: address.isDefault ? (address.wing || '') : prev.wing,
        society: address.isDefault ? address.society : prev.society,
        roadOrStreet: address.isDefault ? (address.roadOrStreet || '') : prev.roadOrStreet,
        fullAddress: address.isDefault ? address.fullAddress : prev.fullAddress,
      };
    });
  };

  // Update existing saved address
  const updateSavedAddress = (id: string, updates: Partial<SavedAddress>) => {
    setUser((prev) => {
      const currentList = prev.savedAddresses || [];
      const updatedList = currentList.map((addr) => {
        if (addr.id === id) {
          return { ...addr, ...updates };
        }
        if (updates.isDefault) {
          return { ...addr, isDefault: false };
        }
        return addr;
      });

      const active = updatedList.find((a) => a.id === (prev.activeAddressId || id));
      return {
        ...prev,
        savedAddresses: updatedList,
        ...(active && active.id === id
          ? {
              flat: active.flat,
              wing: active.wing || '',
              society: active.society,
              roadOrStreet: active.roadOrStreet || '',
              fullAddress: active.fullAddress,
            }
          : {}),
      };
    });
  };

  // Delete saved address
  const deleteSavedAddress = (id: string) => {
    setUser((prev) => {
      const currentList = prev.savedAddresses || [];
      const updatedList = currentList.filter((a) => a.id !== id);
      const nextActive = updatedList.length > 0 ? updatedList[0] : null;

      return {
        ...prev,
        savedAddresses: updatedList,
        activeAddressId: nextActive ? nextActive.id : undefined,
        ...(nextActive
          ? {
              flat: nextActive.flat,
              wing: nextActive.wing || '',
              society: nextActive.society,
              roadOrStreet: nextActive.roadOrStreet || '',
              fullAddress: nextActive.fullAddress,
            }
          : {}),
      };
    });
  };

  // Set active delivery address
  const setActiveAddress = (id: string) => {
    setUser((prev) => {
      const target = (prev.savedAddresses || []).find((a) => a.id === id);
      if (!target) return prev;
      return {
        ...prev,
        activeAddressId: id,
        flat: target.flat,
        wing: target.wing || '',
        society: target.society,
        roadOrStreet: target.roadOrStreet || '',
        fullAddress: target.fullAddress,
      };
    });
  };

  const logout = () => {
    if (user.isLoggedIn) {
      void logUserActivity({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
        eventType: 'AUTH_LOGOUT',
        actionTitle: 'Signed out of account',
      });
    }
    void signOutFirebaseUser();
    try {
      localStorage.removeItem('marco100_user');
    } catch {}
    setUser(DEFAULT_USER);
  };

  const toggleLoginState = () => {
    if (user.isLoggedIn) {
      logout();
    } else {
      setIsAuthModalOpen(true);
    }
  };


  // Produce Cart
  const setProduceCartQty = (produceId: string, kg: number) => {
    const prev = produceCartRef.current;
    const current = prev[produceId] || 0;
    if (kg > current) {
      fluidSoundEngine.playAddToCartSplashSound();
    } else if (kg > 0) {
      fluidSoundEngine.playDropletSound(0.9);
    }
    const next = { ...prev };
    if (kg <= 0) {
      delete next[produceId];
    } else {
      next[produceId] = Math.round(kg * 100) / 100;
    }
    produceCartRef.current = next;
    setProduceCart(next);
  };

  const addProduceToCart = (produceId: string, kg: number) => {
    fluidSoundEngine.playAddToCartSplashSound();
    const prev = produceCartRef.current;
    const current = prev[produceId] || 0;
    const next = { ...prev, [produceId]: Math.round((current + kg) * 100) / 100 };
    produceCartRef.current = next;
    setProduceCart(next);
  };

  const removeProduceFromCart = (produceId: string) => {
    const next = { ...produceCartRef.current };
    delete next[produceId];
    produceCartRef.current = next;
    setProduceCart(next);
  };

  // Accessory Cart
  const setAccessoryCartQty = (accessoryId: string, qty: number) => {
    const next = { ...accessoryCartRef.current };
    if (qty <= 0) {
      delete next[accessoryId];
    } else {
      next[accessoryId] = qty;
    }
    accessoryCartRef.current = next;
    setAccessoryCart(next);
  };

  const addAccessoryToCart = (accessoryId: string, qty: number) => {
    const prev = accessoryCartRef.current;
    const current = prev[accessoryId] || 0;
    const next = { ...prev, [accessoryId]: current + qty };
    accessoryCartRef.current = next;
    setAccessoryCart(next);
  };

  const removeAccessoryFromCart = (accessoryId: string) => {
    const next = { ...accessoryCartRef.current };
    delete next[accessoryId];
    accessoryCartRef.current = next;
    setAccessoryCart(next);
  };

  const clearAllCarts = () => {
    produceCartRef.current = {};
    accessoryCartRef.current = {};
    setProduceCart({});
    setAccessoryCart({});
  };

  // Community Demand for produce: 100% Real Demand from active (non-cancelled) orders and active user baskets
  const getCommunityDemandKg = (produceId: string): number => {
    const ordersSum = orders.reduce((sum, order) => {
      if (order.status === 'cancelled') return sum;
      const matched = order.produceItems.find((i) => i.produceId === produceId);
      return sum + (matched ? matched.quantityKg : 0);
    }, 0);

    const cartSum = produceCart[produceId] || 0;
    return Math.round((ordersSum + cartSum) * 10) / 10;
  };

  // Cart statistics
  const totalProduceWeightKg = Math.round(
    Object.values(produceCart).reduce((sum, kg) => sum + kg, 0) * 10
  ) / 10;
  const totalAccessoriesCount = Object.values(accessoryCart).reduce((sum, q) => sum + q, 0);
  const totalCartItemCount = Object.keys(produceCart).length + Object.keys(accessoryCart).length;

  // Order Placement
  const placeOrder = (
    deliverySlot: string,
    paymentMethod: 'upi_qr' | 'cod' | 'wallet' = 'cod',
    rewardMeta?: { discountAmount?: number; couponCode?: string; surpriseGift?: string }
  ): CustomerOrder => {
    const latestProduceCart = produceCartRef.current;
    const latestAccessoryCart = accessoryCartRef.current;

    const orderProduceItems = Object.entries(latestProduceCart)
      .map(([produceId, quantityKg]) => {
        const prod = produceList.find((p) => p.id === produceId);
        if (!prod || quantityKg <= 0) return null;
        return {
          produceId,
          name: prod.name,
          quantityKg,
          pricePerKg: prod.pricePerKg,
          itemTotal: Math.round(quantityKg * prod.pricePerKg),
        };
      })
      .filter(Boolean) as CustomerOrder['produceItems'];

    const orderAccessoryItems = Object.entries(latestAccessoryCart)
      .map(([accessoryId, quantity]) => {
        const acc = accessoriesList.find((a) => a.id === accessoryId);
        if (!acc || quantity <= 0) return null;
        return {
          accessoryId,
          name: acc.name,
          quantity,
          price: acc.price,
          itemTotal: quantity * acc.price,
        };
      })
      .filter(Boolean) as CustomerOrder['accessoryItems'];

    const produceTotal = orderProduceItems.reduce((acc, cur) => acc + cur.itemTotal, 0);
    const accessoryTotal = orderAccessoryItems.reduce((acc, cur) => acc + cur.itemTotal, 0);
    const rawTotal = produceTotal + accessoryTotal;
    const appliedDiscountAmt = Math.max(0, Math.round(rewardMeta?.discountAmount || 0));
    const totalAmount = Math.max(0, rawTotal - appliedDiscountAmt);
    const computedProduceWeightKg =
      Math.round(orderProduceItems.reduce((sum, item) => sum + item.quantityKg, 0) * 10) / 10;
    const computedAccessoriesCount = orderAccessoryItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const cutoffBatch = isBefore11PmCutoff ? 'tomorrow_morning' : 'day_after_morning';
    const targetDeliveryDate = isBefore11PmCutoff
      ? 'Tomorrow Morning (10:00 AM Harvest Delivery)'
      : 'Day-After Morning (Post-11PM Batch)';

    const activeAddress = (user.savedAddresses || []).find((a) => a.id === user.activeAddressId);
    const destinationAddress = activeAddress?.fullAddress || user.fullAddress || [user.flat ? `Flat ${user.flat}` : '', user.society, user.roadOrStreet].filter(Boolean).join(' · ') || 'Doorstep Delivery';
    const contactPhone = user.secondaryPhone ? `${user.phone} / ${user.secondaryPhone}` : user.phone;

    const activeRefCode =
      referredByCode && referredByCode !== (user.referralCode || '').trim().toUpperCase()
        ? referredByCode
        : undefined;

    const newOrder: CustomerOrder = {
      id: `MARCO-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: user.name || 'Customer',
      customerEmail: user.email,
      flatNumber: destinationAddress,
      phone: contactPhone,
      orderedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
      cutoffBatch,
      status: 'ordered',
      targetDeliveryDate,
      deliverySlot: deliverySlot || '10:00 AM - 12:00 PM',
      produceItems: orderProduceItems,
      accessoryItems: orderAccessoryItems,
      totalAmount,
      ...(rewardMeta?.couponCode ? { appliedCouponCode: rewardMeta.couponCode } : {}),
      ...(appliedDiscountAmt > 0 ? { discountAmount: appliedDiscountAmt } : {}),
      ...(rewardMeta?.surpriseGift ? { surpriseGiftItem: rewardMeta.surpriseGift } : {}),
      totalProduceWeightKg: computedProduceWeightKg,
      totalAccessoriesCount: computedAccessoriesCount,
      paymentMethod,
      paymentConfirmed: false,
      referredByCode: activeRefCode,
      referralRewardCredited: false,
      isSampleOrder: false,
      isRealCustomerOrder: true,
    };

    const nextOrders = [newOrder, ...ordersRef.current];
    ordersRef.current = nextOrders;
    setOrders(nextOrders);
    clearAllCarts();
    playOrderSuccessChime();

    // Track referred order locally (NO ₹50 credit until delivered + paymentConfirmed + totalAmount >= ₹150)
    if (activeRefCode) {
      const minOrder = referralConfig.minOrderValueToQualify || 150;
      const meetsMin = totalAmount >= minOrder;
      setReferralRecords((prev) => [
        {
          id: `ref-${newOrder.id}`,
          referrerName: `Referrer (${activeRefCode})`,
          referrerPhone: '',
          refereeName: newOrder.customerName,
          refereePhone: newOrder.phone,
          referralCode: activeRefCode,
          orderId: newOrder.id,
          orderAmount: totalAmount,
          productName: orderProduceItems[0]?.name?.hi || orderProduceItems[0]?.name?.en || 'ताज़ा मंडी ऑर्डर',
          sharedType: 'app',
          status: meetsMin ? 'qualified' : 'below_minimum',
          cashbackAmount: referralConfig.referrerCashbackAmount || 50,
          freeGiftName: referralConfig.freeProduceName || '1 गड्डी ताज़ी पालक',
          giftDisbursed: false,
          paymentConfirmed: false,
          deliveryStatus: 'ordered',
          createdAt: newOrder.orderedAt,
        },
        ...prev,
      ]);
    }

    // Persist order into backend aggregation registry
    try {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      }).catch(() => {});
    } catch {}

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: CustomerOrder['status']) => {
    const nextOrders = ordersRef.current.map((ord) =>
      ord.id === orderId ? { ...ord, status } : ord
    );
    ordersRef.current = nextOrders;
    setOrders(nextOrders);
    setReferralRecords((prev) =>
      prev.map((rec) => (rec.orderId === orderId ? { ...rec, deliveryStatus: status } : rec))
    );

    // Sync with backend API
    try {
      fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    } catch {}
  };

  // Finalize delivery & confirm payment receipt -> ONLY NOW credit ₹50 cashback to referrer if order >= ₹150
  const confirmOrderDeliveryAndPayment = (orderId: string): {
    orderUpdated: boolean;
    referralCredited: boolean;
    message: string;
  } => {
    const target = ordersRef.current.find((o) => o.id === orderId);
    if (!target || target.status === 'cancelled') {
      return { orderUpdated: false, referralCredited: false, message: 'ऑर्डर रद्द है या नहीं मिला।' };
    }

    const minReq = referralConfig.minOrderValueToQualify || 150;
    const rewardAmt = referralConfig.referrerCashbackAmount || 50;
    const hasMinAmount = target.totalAmount >= minReq;
    const refCode = (target.referredByCode || '').trim().toUpperCase();
    const shouldCreditNow = Boolean(refCode && hasMinAmount && !target.referralRewardCredited);

    const confirmedAt = new Date().toISOString();
    const nextOrders = ordersRef.current.map((ord) =>
      ord.id === orderId
        ? {
            ...ord,
            status: 'delivered' as const,
            paymentConfirmed: true,
            paymentConfirmedAt: ord.paymentConfirmedAt || confirmedAt,
            referralRewardCredited: ord.referralRewardCredited || shouldCreditNow,
          }
        : ord
    );
    ordersRef.current = nextOrders;
    setOrders(nextOrders);

    if (refCode) {
      setReferralRecords((prev) =>
        prev.map((rec) =>
          rec.orderId === orderId
            ? {
                ...rec,
                deliveryStatus: 'delivered',
                paymentConfirmed: true,
                status: hasMinAmount ? 'rewarded' : 'below_minimum',
                giftDisbursed: hasMinAmount,
                rewardedAt: hasMinAmount ? confirmedAt : undefined,
              }
            : rec
        )
      );

      if (shouldCreditNow && user.referralCode?.trim().toUpperCase() === refCode) {
        setUser((prev) => ({
          ...prev,
          walletBalance: (prev.walletBalance || 0) + rewardAmt,
        }));
      }
    }

    try {
      fetch(`/api/orders/${orderId}/confirm-delivery-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.referralRewardResult?.credited && typeof data.referralRewardResult.newWalletBalance === 'number') {
            if (user.referralCode?.trim().toUpperCase() === refCode) {
              setUser((prev) => ({ ...prev, walletBalance: data.referralRewardResult.newWalletBalance }));
            }
          }
        })
        .catch(() => {});
    } catch {}

    if (shouldCreditNow) {
      return {
        orderUpdated: true,
        referralCredited: true,
        message: `✅ डिलीवरी व पेमेंट कन्फ़र्म! ${refCode} को ₹${rewardAmt} कैशबैक क्रेडिट हुआ (₹${target.totalAmount} ऑर्डर)।`,
      };
    }
    if (refCode && !hasMinAmount) {
      return {
        orderUpdated: true,
        referralCredited: false,
        message: `✅ डिलीवरी व पेमेंट कन्फ़र्म! लेकिन ऑर्डर ₹${target.totalAmount} का है (₹${minReq} से कम), इसलिए ₹${rewardAmt} कैशबैक लागू नहीं हुआ।`,
      };
    }
    return {
      orderUpdated: true,
      referralCredited: false,
      message: '✅ डिलीवरी व पेमेंट सफलतापूर्वक कन्फ़र्म हो गया!',
    };
  };

  // Instant One-Voice Confirm: places current cart OR repeats last active order if cart is empty
  const confirmCurrentOrLastOrder = (
    paymentMethod: 'upi_qr' | 'cod' = 'upi_qr'
  ): CustomerOrder | null => {
    if (
      Object.keys(produceCartRef.current).length > 0 ||
      Object.keys(accessoryCartRef.current).length > 0
    ) {
      return placeOrder('10:00 AM - 12:00 PM', paymentMethod);
    }

    const lastTemplateOrder =
      ordersRef.current.find(
        (o) =>
          !o.isSampleOrder &&
          o.status !== 'cancelled' &&
          (o.produceItems.length > 0 || o.accessoryItems.length > 0)
      ) ||
      ordersRef.current.find(
        (o) => !o.isSampleOrder && (o.produceItems.length > 0 || o.accessoryItems.length > 0)
      );
    if (!lastTemplateOrder) return null;

    const cutoffBatch = isBefore11PmCutoff ? 'tomorrow_morning' : 'day_after_morning';
    const targetDeliveryDate = isBefore11PmCutoff
      ? 'Tomorrow Morning (10:00 AM Harvest Delivery)'
      : 'Day-After Morning (Post-11PM Batch)';
    const activeAddress = (user.savedAddresses || []).find((a) => a.id === user.activeAddressId);
    const destinationAddress =
      activeAddress?.fullAddress ||
      user.fullAddress ||
      lastTemplateOrder.flatNumber ||
      'Doorstep Delivery';
    const contactPhone = user.secondaryPhone
      ? `${user.phone} / ${user.secondaryPhone}`
      : user.phone || lastTemplateOrder.phone;

    const activeRefCode =
      referredByCode && referredByCode !== (user.referralCode || '').trim().toUpperCase()
        ? referredByCode
        : undefined;

    const clonedOrder: CustomerOrder = {
      id: `MARCO-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: user.name || lastTemplateOrder.customerName || 'Customer',
      customerEmail: user.email || lastTemplateOrder.customerEmail || '',
      flatNumber: destinationAddress,
      phone: contactPhone,
      orderedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
      cutoffBatch,
      status: 'ordered',
      targetDeliveryDate,
      deliverySlot: lastTemplateOrder.deliverySlot || '10:00 AM - 12:00 PM',
      produceItems: lastTemplateOrder.produceItems,
      accessoryItems: lastTemplateOrder.accessoryItems,
      totalAmount: lastTemplateOrder.totalAmount,
      totalProduceWeightKg: lastTemplateOrder.totalProduceWeightKg,
      totalAccessoriesCount: lastTemplateOrder.totalAccessoriesCount,
      paymentMethod,
      paymentConfirmed: false,
      referredByCode: activeRefCode,
      referralRewardCredited: false,
      isSampleOrder: false,
      isRealCustomerOrder: true,
    };

    const nextOrders = [clonedOrder, ...ordersRef.current];
    ordersRef.current = nextOrders;
    setOrders(nextOrders);
    playOrderSuccessChime();

    if (activeRefCode) {
      const minOrder = referralConfig.minOrderValueToQualify || 150;
      const meetsMin = clonedOrder.totalAmount >= minOrder;
      setReferralRecords((prev) => [
        {
          id: `ref-${clonedOrder.id}`,
          referrerName: `Referrer (${activeRefCode})`,
          referrerPhone: '',
          refereeName: clonedOrder.customerName,
          refereePhone: clonedOrder.phone,
          referralCode: activeRefCode,
          orderId: clonedOrder.id,
          orderAmount: clonedOrder.totalAmount,
          productName:
            clonedOrder.produceItems[0]?.name?.hi ||
            clonedOrder.produceItems[0]?.name?.en ||
            'ताज़ा मंडी ऑर्डर',
          sharedType: 'app',
          status: meetsMin ? 'qualified' : 'below_minimum',
          cashbackAmount: referralConfig.referrerCashbackAmount || 50,
          freeGiftName: referralConfig.freeProduceName || '1 गड्डी ताज़ी पालक',
          giftDisbursed: false,
          paymentConfirmed: false,
          deliveryStatus: 'ordered',
          createdAt: clonedOrder.orderedAt,
        },
        ...prev,
      ]);
    }
    try {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clonedOrder),
      }).catch(() => {});
    } catch {}

    return clonedOrder;
  };

  // Cancel Order cleanly on both client & backend
  const cancelOrder = (orderId: string, reason = 'Cancelled by customer'): boolean => {
    const target = ordersRef.current.find((o) => o.id === orderId);
    if (!target || target.status === 'delivered' || target.status === 'cancelled') {
      return false;
    }

    const cancelledAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today';
    const nextOrders = ordersRef.current.map((ord) =>
      ord.id === orderId
        ? {
            ...ord,
            status: 'cancelled' as const,
            cancelledAt,
            cancelReason: reason,
          }
        : ord
    );
    ordersRef.current = nextOrders;
    setOrders(nextOrders);

    try {
      fluidSoundEngine.playDropletSound(0.75);
    } catch {}

    try {
      fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      }).catch(() => {});
    } catch {}

    return true;
  };

  const refreshOrdersFromServer = async () => {
    setIsOrdersLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.orders)) {
          const serverMap = new Map<string, any>();
          data.orders.forEach((so: any) => {
            if (so && so.id) serverMap.set(so.id, so);
          });

          const merged = ordersRef.current.map((localOrd) => {
            const matched = serverMap.get(localOrd.id);
            if (!matched) return localOrd;
            return {
              ...localOrd,
              status: matched.status || localOrd.status,
              cancelledAt: matched.cancelledAt || localOrd.cancelledAt,
              cancelReason: matched.cancelReason || localOrd.cancelReason,
              paymentConfirmed:
                typeof matched.paymentConfirmed === 'boolean'
                  ? matched.paymentConfirmed
                  : localOrd.paymentConfirmed,
              paymentConfirmedAt: matched.paymentConfirmedAt || localOrd.paymentConfirmedAt,
              referredByCode: matched.referredByCode || localOrd.referredByCode,
              referralRewardCredited:
                typeof matched.referralRewardCredited === 'boolean'
                  ? matched.referralRewardCredited
                  : localOrd.referralRewardCredited,
              feedback: matched.feedback || localOrd.feedback,
            };
          });

          ordersRef.current = merged;
          setOrders(merged);
        }
      }
    } catch {
      // Offline / slow network fallback preserves local orders safely
    } finally {
      setIsOrdersLoading(false);
    }
  };

  const submitOrderFeedback = (
    orderId: string,
    payload: {
      rating: number;
      freshnessTags?: string[];
      comment?: string;
      stage?: 'checkout' | 'delivered';
    }
  ) => {
    const cleanRating = Math.max(1, Math.min(5, Math.round(Number(payload.rating) || 5)));
    const nextFeedback: OrderFeedback = {
      rating: cleanRating,
      freshnessTags: payload.freshnessTags || [],
      comment: payload.comment?.trim() || undefined,
      submittedAt: new Date().toISOString(),
      stage: payload.stage || 'delivered',
    };

    const nextOrders = ordersRef.current.map((ord) =>
      ord.id === orderId ? { ...ord, feedback: nextFeedback } : ord
    );
    ordersRef.current = nextOrders;
    setOrders(nextOrders);

    try {
      fluidSoundEngine.playDropletSound(1.25);
    } catch {}

    try {
      fetch(`/api/orders/${orderId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextFeedback),
      }).catch(() => {});
    } catch {}
  };

  const refreshCatalogFromServer = async () => {
    setIsCatalogSyncing(true);
    try {
      await fetch('/api/inventory').catch(() => {});
    } finally {
      setIsCatalogSyncing(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        brand,
        updateBrand,
        lang,
        setLang,
        t,
        produceList,
        updateProduceItem,
        toggleProduceAvailability,
        toggleProduceSeasonal,
        deleteProduceItem,
        addProduceItem,
        resetProduceToMaster,
        exportProduceMasterCsv,
        accessoriesList,
        addAccessoryItem,
        updateAccessoryItem,
        deleteAccessoryItem,
        founderPhotoUrl,
        setFounderPhotoUrl,
        familyPreferences,
        addFamilyPreference,
        updateFamilyPreference,
        removeFamilyPreference,
        voiceAutoOrderEnabled,
        setVoiceAutoOrderEnabled,
        voiceWakeWordEnabled,
        setVoiceWakeWordEnabled,
        customWakeName,
        setCustomWakeName,
        user,
        loginWithGoogle,
        loginWithCredentials,
        logout,
        toggleLoginState,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        profileActiveTab,
        setProfileActiveTab,
        openReferralDashboard,
        updateUserProfile,
        addSavedAddress,
        updateSavedAddress,
        deleteSavedAddress,
        setActiveAddress,

        // Referral, Cashback & Free Gifts
        referralConfig,
        updateReferralConfig,
        referralRecords,
        addReferralRecord,
        updateReferralRecordStatus,
        deleteReferralRecord,
        clearTestReferrals,
        redeemWalletBalance,
        referredByCode,
        setReferredByCode,

        produceCart,
        setProduceCartQty,
        addProduceToCart,
        removeProduceFromCart,
        accessoryCart,
        setAccessoryCartQty,
        addAccessoryToCart,
        removeAccessoryFromCart,
        clearAllCarts,
        totalCartItemCount,
        totalProduceWeightKg,
        getCommunityDemandKg,
        orders,
        isOrdersLoading,
        refreshOrdersFromServer,
        isCatalogSyncing,
        refreshCatalogFromServer,
        placeOrder,
        confirmCurrentOrLastOrder,
        cancelOrder,
        updateOrderStatus,
        confirmOrderDeliveryAndPayment,
        submitOrderFeedback,
        isBefore11PmCutoff,
        toggleCutoffOverride,
        cutoffOverride,
        timeUntil11Pm,
        isCartOpen,
        setIsCartOpen,
        ambientFluidColor,
        setAmbientFluidColor,
        isFluidSoundActive,
        toggleFluidSound,
        featureFlags: platformConfig.featureFlags,
        activeUiSample: platformConfig.activeUiSample,
        festivalTheme: platformConfig.festivalTheme || DEFAULT_FESTIVAL_THEME,
        updateFeatureFlags,
        resetFeatureFlags,
        setActiveUiSample,
        updateFestivalTheme,
        resetFestivalTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

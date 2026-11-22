export type AppLanguage =
  | 'en'
  | 'hi'
  | 'hinglish'
  | 'zh'
  | 'es'
  | 'ar'
  | 'fr'
  | 'pt'
  | 'ru'
  | 'bn'
  | 'ja'
  | 'de'
  | 'mr'
  | 'gu'
  | 'ta'
  | 'te'
  | 'kn'
  | 'pa';

export type AppPageId =
  | 'catalog'
  | 'accessories'
  | 'pool'
  | 'leaderboard'
  | 'mandi'
  | 'orders'
  | 'tracking'
  | 'map'
  | 'referral'
  | 'account';

export type ProduceCategory =
  | 'all'
  | 'vegetables'
  | 'leafy'
  | 'roots'
  | 'citrus'
  | 'fruits'
  | 'herbs'
  | 'sprouts'
  | 'other'
  | 'seasonal'
  | 'staple'
  | 'vegetable'
  | 'fruit'
  | 'greens';

export type AccessoryCategory = 'all' | 'chargers' | 'audio' | 'cases' | 'mounts' | 'protection' | 'powerbanks';

export interface LocalizedString {
  en: string;
  hi: string;
  hinglish: string;
  mr: string;
  gu?: string;
  bn?: string;
  ta?: string;
  te?: string;
  kn?: string;
  pa?: string;
  zh?: string;
  es?: string;
  ar?: string;
  fr?: string;
  pt?: string;
  ru?: string;
  ja?: string;
  de?: string;
}

export interface ProductVariant {
  id: string;
  name: LocalizedString;
  pricePerKg?: number;
  available?: boolean;
}

export interface ProduceItem {
  id: string;
  name: LocalizedString;
  category: ProduceCategory | string;
  subcategory?: string;
  pricePerKg: number; // Selling Price (Customer rate)
  wholesalePricePerKg: number; // Purchase Price (Mandi wholesale rate)
  localMarketPricePerKg: number; // Local market retail comparison
  discountPrice?: number;
  minOrderQty?: number;
  availableStock?: number;
  stockUnit?: 'kg' | 'bunch' | 'piece' | 'packet' | 'box' | string;
  minIncrementKg: number; // e.g. 0.25 (250g)
  defaultKg: number; // e.g. 1.0
  image: string;
  additionalImages?: string[];
  origin: string;
  mandiTierBagKg: number; // e.g. 50kg bag or 25kg crate
  baseCommunityDemandKg: number;
  freshnessGuarantee: LocalizedString;
  description: LocalizedString;
  variety?: string;
  qualityGrade?: 'Premium' | 'Grade-A' | 'Regular';
  availableUnits?: string[];
  packagingOptions?: string[];
  isAvailable?: boolean; // Stock availability flag
  isSeasonal?: boolean; // Seasonal product indicator
  seasonalityNote?: LocalizedString;
  freshnessInfo?: LocalizedString;
  storageInstructions?: LocalizedString;
  adminApprovalStatus?: 'approved' | 'pending' | 'review';
  lastUpdated?: string;
  variants?: ProductVariant[];
  seasonSpecial?: boolean;
  visualEmoji?: string;
  bgGradient?: string;
  pricingUnit?: 'kg' | 'gaddi' | 'piece' | 'pack'; // 'kg' (किलोग्राम), 'gaddi' (गड्डी/जुडी), 'piece' (नग/पीस), 'pack' (पैक)
  approxUnitWeightKg?: number; // Estimated weight of 1 unit/piece/gaddi for value comparison
  unitLabel?: Partial<LocalizedString>;
  unitPresets?: number[]; // e.g. [1, 2, 3, 5] for gaddi/piece or [0.5, 1, 1.5, 2, 4, 5] for kg
}

export interface MobileAccessoryItem {
  id: string;
  name: LocalizedString;
  category: AccessoryCategory;
  price: number;
  mrp: number;
  wholesaleCost: number;
  image: string;
  brand: string;
  specs: string[];
  warranty: string;
  rating: number;
  inStock: boolean;
  description: LocalizedString;
  founderVerified?: boolean;
  isNewArrival?: boolean;
}

export interface FamilyMemberPref {
  id: string;
  relation: string;
  name: string;
  favoriteItemIds: string[];
  notes?: string;
}

export interface CartProduceItem {
  type: 'produce';
  produceId: string;
  quantityKg: number;
}

export interface CartAccessoryItem {
  type: 'accessory';
  accessoryId: string;
  quantity: number;
}

export interface CustomerOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  flatNumber: string;
  phone: string;
  orderedAt: string;
  cutoffBatch: 'tomorrow_morning' | 'day_after_morning';
  status: 'ordered' | 'procured_at_mandi' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  cancelledAt?: string;
  cancelReason?: string;
  targetDeliveryDate: string;
  deliverySlot: string;
  produceItems: {
    produceId: string;
    name: LocalizedString;
    quantityKg: number;
    pricePerKg: number;
    itemTotal: number;
  }[];
  accessoryItems: {
    accessoryId: string;
    name: LocalizedString;
    quantity: number;
    price: number;
    itemTotal: number;
  }[];
  totalAmount: number;
  appliedCouponCode?: string;
  discountAmount?: number;
  surpriseGiftItem?: string;
  totalProduceWeightKg: number;
  totalAccessoriesCount: number;
  paymentMethod?: 'upi_qr' | 'cod' | 'wallet';
  paymentConfirmed?: boolean;
  paymentConfirmedAt?: string;
  referredByCode?: string;
  referralRewardCredited?: boolean;
  isSampleOrder?: boolean;
  isRealCustomerOrder?: boolean;
  feedback?: OrderFeedback;
}

export interface OrderFeedback {
  rating: number; // 1 to 5
  freshnessTags?: string[];
  comment?: string;
  submittedAt: string;
  stage?: 'checkout' | 'delivered';
}

export interface SavedAddress {
  id: string;
  label: string; // 'Home' | 'Office' | 'Parents / Family' | 'Other'
  flat: string;
  wing?: string;
  society: string;
  roadOrStreet?: string;
  fullAddress: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  secondaryPhone?: string; // अतिरिक्त / दूसरा मोबाइल नंबर (Alternate Phone)
  flat: string;
  wing: string;
  society: string;
  roadOrStreet?: string;
  fullAddress?: string;
  savedAddresses?: SavedAddress[]; // अतिरिक्त पते (Multiple delivery addresses)
  activeAddressId?: string;
  isLoggedIn: boolean;
  loginMethod: 'google' | 'password' | 'otp';
  phoneVerified?: boolean;
  emailVerified?: boolean;
  verifiedGoogleEmail?: string;
  avatarUrl?: string;
  referralCode?: string; // Unique customer sharing code (e.g. TAZA402)
  walletBalance?: number; // Current cashback / reward money (₹)
  freeGiftAvailable?: string; // e.g. '1x पालक गड्डी (Free Palak)'
}

export interface ReferralProgramConfig {
  isEnabled: boolean;
  referrerCashbackAmount: number; // ₹ given to person who shared
  refereeDiscountAmount: number; // ₹ discount given to new friend
  freeProduceGiftEnabled: boolean;
  freeProduceName: string; // e.g. "1 गड्डी ताज़ी पालक" or "1 kg आलू"
  minOrderValueToQualify: number;
  promotionalMessage: string;
}

export interface ReferralRecord {
  id: string;
  referrerName: string;
  referrerPhone: string;
  refereeName: string;
  refereePhone: string;
  referralCode: string;
  orderId?: string;
  orderAmount?: number;
  productName?: string;
  sharedType: 'product' | 'app';
  status: 'pending' | 'below_minimum' | 'qualified' | 'rewarded';
  cashbackAmount: number;
  freeGiftName?: string;
  giftDisbursed: boolean;
  paymentConfirmed?: boolean;
  deliveryStatus?: CustomerOrder['status'];
  rewardedAt?: string;
  createdAt: string;
}

export interface BrandConfig {
  brandName: string;
  tagline: string;
  societyName: string;
  mandiCity: string;
  whatsappContact: string;
}

export type StoreUiSampleId = 'classic' | 'quick_mart' | 'fresh_boutique' | 'hybrid_superapp';

export type FestivalLogoPreset =
  | 'default'
  | 'diwali'
  | 'holi'
  | 'ganesh'
  | 'navratri'
  | 'patriotic'
  | 'eid'
  | 'sankranti'
  | 'harvest'
  | 'custom';

export type FestivalSurfaceTone =
  | 'emerald'
  | 'saffron'
  | 'magenta'
  | 'royal'
  | 'gold'
  | 'tricolor';

export interface FestivalThemeConfig {
  id: string;
  name: string;
  active: boolean;
  bannerTitle: string;
  bannerSubtitle: string;
  badgeText: string;
  accentHex: string;
  surfaceTone: FestivalSurfaceTone;
  logoPreset: FestivalLogoPreset;
  customLogoSvg?: string;
}

export interface PlatformFeatureFlags {
  youtubeRecipeVideos: boolean;
  dishRecipeHelper: boolean;
  rateSavingsSuggestions: boolean;
  unitConversionToggle: boolean;
  healthBenefitsSlide: boolean;
  productInsightsModal: boolean;
  cartUpsellSuggestions: boolean;
  seasonalTrendingSection: boolean;
  storePromoBanner: boolean;
  windowCutoffBanner: boolean;
  voiceOrderAssistant: boolean;
  smartNotifications: boolean;
  communityPoolTab: boolean;
  mobileAccessoriesTab: boolean;
  leaderboardAndBadges: boolean;
  referralProgram: boolean;
  stickyCartBar: boolean;
  pwaInstallPrompt: boolean;
  productShareButtons: boolean;
  liveMapCorridor: boolean;
  languageSelector: boolean;
  founderPickBadge: boolean;
  adminBuyersAnalytics: boolean;
  batchSavingChart: boolean;
}

export interface PlatformConfigState {
  featureFlags: PlatformFeatureFlags;
  activeUiSample: StoreUiSampleId;
  festivalTheme?: FestivalThemeConfig;
  brand?: Partial<BrandConfig>;
  updatedAt?: string;
  updatedBy?: string;
}

export type BuyerAnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

export interface BuyerPeriodMetrics {
  totalSpent: number;
  totalKg: number;
  orderCount: number;
  customerSaved: number;
  adminProfit: number;
}

export interface BuyerAnalyticsEntry {
  rank: number;
  buyerKey: string;
  userId?: string;
  name: string;
  firstName: string;
  phone: string;
  email: string;
  flat: string;
  lastOrderAt: string;
  daily: BuyerPeriodMetrics;
  weekly: BuyerPeriodMetrics;
  monthly: BuyerPeriodMetrics;
  yearly: BuyerPeriodMetrics;
  all: BuyerPeriodMetrics;
  activeRewardsCount: number;
}

export interface PublicTopBuyer {
  rank: number;
  firstName: string;
  societyLabel: string;
  totalKg: number;
  orderCount: number;
}

export type CustomerRewardType = 'coupon' | 'wallet_credit' | 'surprise_gift' | 'combo';

export interface CustomerRewardRecord {
  id: string;
  targetUserId?: string;
  targetPhone: string;
  targetName: string;
  rewardType: CustomerRewardType;
  couponCode: string;
  discountRupees: number;
  discountPercent: number;
  minOrderRupees: number;
  freeGiftItem?: string;
  title: string;
  messageToCustomer: string;
  aiPromptUsed?: string;
  grantedBy: string;
  status: 'active' | 'redeemed';
  createdAt: string;
  redeemedAt?: string;
  redeemedOrderId?: string;
}

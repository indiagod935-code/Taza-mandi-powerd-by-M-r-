/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized Client Environment & Platform Configuration
 * Separates environment variables, storage keys, and domain constants from UI components.
 */

export const ENV_CONFIG = {
  APP_NAME: 'ताज़ाMandi',
  POWERED_BY: 'MARCO 💯',
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL as string | undefined) || '',
  REQUEST_TIMEOUT_MS: 12_000,
  OWNER_EMAIL: ((import.meta.env.VITE_OWNER_EMAIL as string | undefined) || 'rp2824173@gmail.com').toLowerCase(),
  ADMIN_PIN: (import.meta.env.VITE_ADMIN_PIN as string | undefined) || '786796123',
  MANDI_CUTOFF_HOUR_24: 23, // 11:00 PM daily APMC Vashi batch cutoff
  DEFAULT_MANDI_COORDS: {
    lat: 19.076,
    lng: 73.0033,
    label: 'APMC Market, Vashi, Navi Mumbai',
  },
  SYNC_VERSION: 'tazamandi_sync_v54_clean_photos_turmeric',
} as const;

export const STORAGE_KEYS = {
  APP_VERSION: 'tazamandi_app_version',
  MASTER_PRODUCE: 'tazamandi_master_produce_v54',
  ACCESSORIES_LIST: 'tazamandi_accessories_v2',
  ACTIVE_BRAND: 'tazamandi_active_brand',
  LANGUAGE: 'marco100_lang',
  USER: 'marco100_user',
  CART_PRODUCE: 'marco100_cart_produce',
  CART_ACCESSORIES: 'marco100_cart_accessories',
  ORDERS: 'marco100_orders',
  FOUNDER_PHOTO: 'tazamandi_marco_founder_photo',
  FAMILY_PREFS: 'tazamandi_family_prefs_v1',
  VOICE_AUTO_ORDER: 'tazamandi_voice_auto_order',
  VOICE_WAKE_ENABLED: 'tazamandi_voice_wake_enabled',
  CUSTOM_WAKE_NAME: 'tazamandi_custom_wake_name',
  REFERRED_BY: 'tazamandi_referred_by_code',
  REFERRAL_CONFIG: 'tazamandi_referral_config',
  REFERRAL_RECORDS: 'tazamandi_referral_records',
  PWA_INSTALLED: 'tazamandi_pwa_installed',
  PLATFORM_CONFIG: 'tazamandi_platform_config_v1',
} as const;

export const DEFAULT_PLATFORM_FEATURE_FLAGS = {
  youtubeRecipeVideos: true,
  dishRecipeHelper: true,
  rateSavingsSuggestions: true,
  unitConversionToggle: true,
  healthBenefitsSlide: true,
  productInsightsModal: true,
  cartUpsellSuggestions: true,
  seasonalTrendingSection: true,
  storePromoBanner: true,
  windowCutoffBanner: true,
  voiceOrderAssistant: true,
  smartNotifications: true,
  communityPoolTab: true,
  mobileAccessoriesTab: true,
  leaderboardAndBadges: true,
  referralProgram: true,
  stickyCartBar: true,
  pwaInstallPrompt: true,
  productShareButtons: true,
  liveMapCorridor: true,
  languageSelector: true,
  founderPickBadge: true,
  adminBuyersAnalytics: true,
  batchSavingChart: true,
} as const;


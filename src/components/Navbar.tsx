import React from 'react';
import { useApp } from '../context/AppContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppPageId } from '../types';
import { pickLang } from '../utils/i18nHelper';
import {
  ShoppingBag,
  User,
  Smartphone,
  ShieldAlert,
  RefreshCw,
  Download,
  Mic,
  MicOff,
  MessageSquare,
} from 'lucide-react';
import { SmartNotificationBell } from './SmartNotificationCenter';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  activeTab: AppPageId;
  setActiveTab: (tab: AppPageId) => void;
  onOpenInstallModal?: () => void;
  onOpenSavingsForecast?: () => void;
  isAdminAuthorized?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenInstallModal,
  onOpenSavingsForecast,
  isAdminAuthorized = false,
}) => {
  const {
    brand,
    user,
    setIsAuthModalOpen,
    totalCartItemCount,
    totalProduceWeightKg,
    setIsCartOpen,
    lang,
    t,
    voiceWakeWordEnabled,
    featureFlags,
    festivalTheme,
  } = useApp();

  const { isRunningStandalone, hasUpdate, triggerUpdate } = usePWAInstall();

  const handleInstallAction = () => {
    onOpenInstallModal?.();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/98 dark:bg-slate-900/98 backdrop-blur shadow-xs border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8">
        {/* ROW 1: Locked Brand Lockup (Left) + Critical Store Actions (Right) */}
        <div className="flex items-center justify-between h-13 sm:h-15 gap-1.5 sm:gap-2 w-full max-w-full">
          {/* Locked Brand Lockup — Edit controls & pen icon are strictly locked inside Admin Account Center */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden pr-1">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className="text-left hover:opacity-90 transition-opacity flex items-center gap-2 min-w-0 max-w-full cursor-pointer"
            >
              <BrandLogo size="sm" festivalTheme={festivalTheme} />
              <div className="flex flex-col min-w-0">
                <span className="font-display font-black text-[15px] sm:text-xl tracking-tight text-emerald-800 dark:text-emerald-400 truncate leading-none">
                  {brand.brandName || 'ताज़ाMandi'}
                </span>
                <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                  <span className="text-[8px] sm:text-[9.5px] font-black tracking-normal bg-slate-900 text-emerald-400 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-slate-700 dark:border-emerald-800 whitespace-nowrap shrink-0 leading-none">
                    powered by MARCO 💯
                  </span>
                  <span className="hidden md:inline text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate leading-none">
                    · {(brand.tagline || 'होलसेल मंडी से सीधा घर').replace(/\s*·?\s*powered by MARCO\s*💯?/i, '').trim() || 'होलसेल मंडी से सीधा घर'}
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Action Zone */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Update Button — ONLY visible when a real update is available */}
            {hasUpdate && (
              <button
                type="button"
                onClick={triggerUpdate}
                title={pickLang(lang, {
                  en: 'New update ready — tap to update now',
                  hi: 'नया अपडेट उपलब्ध है — अभी अपडेट करें',
                  mr: 'नवीन अपडेट उपलब्ध — आत्ता अपडेट करा',
                })}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500 rounded-lg shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {pickLang(lang, {
                    en: 'Update',
                    hi: 'अपडेट करें',
                    mr: 'अपडेट करा',
                    hinglish: 'Update Now',
                  })}
                </span>
              </button>
            )}

            {/* Customer Install App Button — Always available on regular browser tabs, hidden inside installed standalone app */}
            {!isRunningStandalone && featureFlags.pwaInstallPrompt && (
              <button
                type="button"
                onClick={handleInstallAction}
                className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold text-white bg-linear-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 rounded-lg shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer whitespace-nowrap"
                title={pickLang(lang, {
                  en: 'Install ताज़ाMandi App on your phone',
                  hi: 'ताज़ाMandi ऐप मोबाइल पर इंस्टॉल करें',
                  mr: 'ताज़ाMandi अ‍ॅप मोबाईलवर इन्स्टॉल करा',
                })}
              >
                <Download className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="hidden md:inline">
                  {pickLang(lang, {
                    en: 'Install App',
                    hi: 'ऐप इंस्टॉल करें',
                    mr: 'अ‍ॅप इन्स्टॉल करा',
                    hinglish: 'Install App',
                  })}
                </span>
              </button>
            )}

            {/* Smart Dynamic Notifications Center Bell */}
            {featureFlags.smartNotifications && (
              <SmartNotificationBell
                onNavigateTab={setActiveTab}
                onOpenSavingsForecast={() => onOpenSavingsForecast?.()}
                isAdminAuthorized={isAdminAuthorized}
              />
            )}

            {/* Compact Top Voice Speak + Chat + Always-On Mic OFF/ON Triggers */}
            {featureFlags.voiceOrderAssistant && (
              <div className="flex items-center gap-0.5 sm:gap-1 bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-lg p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent('tazamandi-voice-trigger', { detail: { action: 'speak' } }))
                  }
                  title={
                    voiceWakeWordEnabled
                      ? pickLang(lang, {
                          en: 'Tap to Speak with ताज़ाMandi Voice AI',
                          hi: 'ताज़ा मंडी वॉइस असिस्टेंट से बोलकर ऑर्डर करें',
                          mr: 'ताज़ा मंडी व्हॉइसने ऑर्डर बोला',
                        })
                      : pickLang(lang, {
                          en: 'Mic is OFF — tap to turn ON voice mic',
                          hi: 'माइक बंद है — चालू करके बोलने के लिए दबाएँ',
                        })
                  }
                  className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 text-[10.5px] sm:text-xs font-bold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    voiceWakeWordEnabled
                      ? 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                      : 'text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/50 hover:bg-pink-100'
                  }`}
                >
                  {voiceWakeWordEnabled ? (
                    <Mic className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400 shrink-0" />
                  )}
                  <span className="hidden lg:inline">
                    {voiceWakeWordEnabled
                      ? pickLang(lang, { en: 'Speak', hi: 'बोलें', mr: 'बोला', hinglish: 'Speak' })
                      : pickLang(lang, { en: 'Mic Off', hi: 'चालू करें', mr: 'सुरू करा', hinglish: 'Mic On' })}
                  </span>
                </button>
                {voiceWakeWordEnabled && (
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent('tazamandi-voice-trigger', { detail: { action: 'stop_mic' } }))
                    }
                    title={pickLang(lang, {
                      en: 'Turn OFF always-listening mic',
                      hi: 'माइक बंद करें (जब चाहें फिर चालू करें)',
                    })}
                    className="flex items-center justify-center p-1 text-pink-600 hover:bg-pink-100 dark:text-pink-400 dark:hover:bg-pink-950/60 rounded-md transition-colors cursor-pointer"
                    aria-label="Turn OFF Mic"
                  >
                    <MicOff className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent('tazamandi-voice-trigger', { detail: { action: 'chat' } }))
                  }
                  title={pickLang(lang, {
                    en: 'Open Voice & Text Chat Box',
                    hi: 'चैट व लिखकर ऑर्डर बॉक्स खोलें',
                    mr: 'चॅट बॉक्स उघडा',
                  })}
                  className="flex items-center gap-1 px-1.5 sm:px-2 py-1 text-[10.5px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="hidden lg:inline">
                    {pickLang(lang, { en: 'Chat', hi: 'चैट', mr: 'चॅट' })}
                  </span>
                </button>
              </div>
            )}

            {/* Show Login ONLY when signed out (Account & Services handles profile inside Account Center with zero duplicates) */}
            {!user.isLoggedIn && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 rounded-lg shadow-2xs flex items-center gap-1 transition-all border border-emerald-600 shrink-0 cursor-pointer whitespace-nowrap"
                title={t('login_btn')}
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline">
                  {pickLang(lang, { en: 'Login', hi: 'लॉगिन', mr: 'लॉगिन', hinglish: 'Login' })}
                </span>
              </button>
            )}

            {/* Cart Button with Weight/Count Badge */}
            <button
              data-tour="header-cart-button"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-95 rounded-lg transition-all shadow-2xs whitespace-nowrap shrink-0 border border-emerald-700 cursor-pointer"
              title="आपकी थैली / Shopping Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{t('cart_title')}</span>
              {totalCartItemCount > 0 ? (
                <span className="bg-amber-400 text-slate-950 text-[10px] sm:text-[11px] font-black px-1.5 py-0.2 rounded-full font-mono-nums">
                  {totalProduceWeightKg > 0 ? `${totalProduceWeightKg}k` : `${totalCartItemCount}`}
                </span>
              ) : (
                <span className="text-[10px] text-emerald-200">0</span>
              )}
            </button>
          </div>
        </div>

        {/* ROW 2: Uncluttered Primary Store Navigation (UI Studio, Leaderboard, Language & Profile live in Account & Services) */}
        <div className="hidden md:block border-t border-slate-100 dark:border-slate-800/80 py-1.5 w-full max-w-full overflow-hidden">
          <nav className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-0.5 px-0.5 w-full max-w-full min-w-0">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'catalog'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>🥦</span>
              <span>{t('market_tab')}</span>
            </button>

            {featureFlags.communityPoolTab && (
              <button
                onClick={() => setActiveTab('pool')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'pool'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>👥</span>
                <span>{t('pool_tab')}</span>
              </button>
            )}

            {featureFlags.mobileAccessoriesTab && (
              <button
                onClick={() => setActiveTab('accessories')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'accessories'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('accessories_tab')}</span>
              </button>
            )}

            {isAdminAuthorized && (
              <button
                onClick={() => setActiveTab('mandi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'mandi'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/60'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('mandi_admin_tab')}</span>
              </button>
            )}

            <button
              data-tour="desktop-account-tab"
              onClick={() => setActiveTab('account')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'account' || activeTab === 'leaderboard' || activeTab === 'referral'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>👤</span>
              <span>
                {pickLang(lang, {
                  en: 'Account & Services',
                  hi: 'खाता व सेवाएं',
                  mr: 'खाते व सेवा',
                  hinglish: 'Account & Services',
                  gu: 'ખાતું અને સેવાઓ',
                  bn: 'অ্যাকাউন্ট ও পরিষেবা',
                  ta: 'கணக்கு & சேவைகள்',
                  te: 'ఖాతా & సేవలు',
                  kn: 'ಖಾತೆ ಮತ್ತು ಸೇವೆಗಳು',
                  pa: 'ਖਾਤਾ ਤੇ ਸੇਵਾਵਾਂ',
                })}
              </span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

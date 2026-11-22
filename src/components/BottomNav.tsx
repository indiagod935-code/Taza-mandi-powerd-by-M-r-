import React from 'react';
import { useApp } from '../context/AppContext';
import { AppPageId } from '../types';
import { pickLang, MultiLangMap } from '../utils/i18nHelper';

interface BottomNavProps {
  activeTab: AppPageId;
  setActiveTab: (tab: AppPageId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { lang, featureFlags } = useApp();

  const navItems: {
    id: AppPageId;
    labels: MultiLangMap;
    icon: string;
    badge?: string | number;
  }[] = [
    {
      id: 'catalog',
      labels: {
        en: 'Produce',
        hi: 'ताज़ा मंडी',
        mr: 'बाजार',
        hinglish: 'Produce',
        gu: 'તાજી મંડી',
        bn: 'টাটকা মান্ডি',
        ta: 'மண்டி',
        te: 'తాజా మండి',
        kn: 'ತಾಜಾ ಮಂಡಿ',
        pa: 'ਤਾਜ਼ਾ ਮੰਡੀ',
      },
      icon: '🥦',
    },
    {
      id: 'pool',
      labels: {
        en: 'Group Pool',
        hi: 'ग्रुप पूल',
        mr: 'ग्रुप पूल',
        hinglish: 'Group Pool',
        gu: 'ગ્રુપ પૂલ',
        bn: 'গ্রুপ পুল',
        ta: 'குழு பூல்',
        te: 'గ్రూప్ పూల్',
        kn: 'ಗುಂಪು ಪೂಲ್',
        pa: 'ਗਰੁੱਪ ਪੂਲ',
      },
      icon: '👥',
    },
    {
      id: 'accessories',
      labels: {
        en: 'Tech Gear',
        hi: 'एक्सेसरीज़',
        mr: 'अ‍ॅक्सेसरीज',
        hinglish: 'Accessories',
        gu: 'એક્સેસરીઝ',
        bn: 'অ্যাক্সেসরিজ',
        ta: 'டெக் கியர்',
        te: 'యాక్సెసరీస్',
        kn: 'ಟೆಕ್ ಗೇರ್',
        pa: 'ਐਕਸੈਸਰੀਜ਼',
      },
      icon: '📱',
    },
    {
      id: 'account',
      labels: {
        en: 'Account',
        hi: 'खाता',
        mr: 'खाते',
        hinglish: 'Account',
        gu: 'ખાતું',
        bn: 'অ্যাকাউন্ট',
        ta: 'கணக்கு',
        te: 'ఖాతా',
        kn: 'ಖಾತೆ',
        pa: 'ਖਾਤਾ',
      },
      icon: '👤',
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-1 py-1"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems
          .filter((item) => {
            if (item.id === 'pool') return featureFlags.communityPoolTab;
            if (item.id === 'accessories') return featureFlags.mobileAccessoriesTab;
            return true;
          })
          .map((item) => {
          const isActive =
            item.id === 'account'
              ? activeTab === 'account' || activeTab === 'leaderboard' || activeTab === 'referral'
              : activeTab === item.id;
          const label = pickLang(lang, item.labels);

          return (
            <button
              key={item.id}
              data-tour={item.id === 'account' ? 'mobile-account-tab' : undefined}
              onClick={() => {
                setActiveTab(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex-1 py-1 px-1 flex flex-col items-center justify-center relative transition-all rounded-xl ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active Highlight Glow */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-emerald-600 rounded-full" />
              )}

              <div className="relative text-lg leading-none mt-0.5 mb-1">
                <span>{item.icon}</span>
                {item.badge && (
                  <span className="absolute -top-1.5 -right-3 text-[9px] font-black bg-amber-400 text-slate-950 px-1 rounded-full border border-white dark:border-slate-900">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] leading-tight truncate max-w-[62px] ${isActive ? 'font-bold' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

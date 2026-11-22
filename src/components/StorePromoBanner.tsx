import React from 'react';
import { useApp } from '../context/AppContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { pickLang } from '../utils/i18nHelper';
import { RefreshCw, ArrowRight, Sparkles } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { getFestivalSurfaceClasses } from '../config/festivalThemes';

interface StorePromoBannerProps {
  onOpenAbout?: () => void;
  onOpenSavingsForecast?: () => void;
  homeSavingsStats?: {
    totalSavedRupees: number;
    totalKg: number;
    wasteAvoidedKg: number;
  };
}

export const StorePromoBanner: React.FC<StorePromoBannerProps> = ({
  onOpenAbout,
  onOpenSavingsForecast,
  homeSavingsStats,
}) => {
  const { lang, brand, featureFlags, activeUiSample, festivalTheme } = useApp();
  const { hasUpdate, triggerUpdate } = usePWAInstall();

  const savedRupees = homeSavingsStats?.totalSavedRupees || 0;

  if (!featureFlags.storePromoBanner) return null;

  const isFestivalActive = Boolean(festivalTheme?.active);
  const festivalSurface = getFestivalSurfaceClasses(festivalTheme);

  const themeBannerClass = isFestivalActive
    ? festivalSurface.bannerBg
    : activeUiSample === 'fresh_boutique'
    ? 'bg-emerald-900/95 border border-emerald-700/40'
    : activeUiSample === 'quick_mart'
    ? 'bg-emerald-700 border border-emerald-500/40'
    : activeUiSample === 'hybrid_superapp'
    ? 'bg-linear-to-r from-teal-900 via-emerald-900 to-slate-900 border border-teal-500/30'
    : '';

  const headlineText =
    isFestivalActive && festivalTheme?.bannerTitle
      ? festivalTheme.bannerTitle
      : `${brand.brandName || 'ताज़ाMandi'} · ${pickLang(lang, {
          en: 'APMC Vashi Direct',
          hi: 'मंडी से सीधा ताज़ा माल',
          mr: 'थेट वाशी बाजारातून ताजे',
          hinglish: 'Seedha APMC Mandi Lot',
        })}`;

  const subtitleText =
    isFestivalActive && festivalTheme?.bannerSubtitle
      ? festivalTheme.bannerSubtitle
      : savedRupees > 0
      ? pickLang(lang, {
          en: `₹${savedRupees} saved · Zero cold-storage · Before 11:00 PM cutoff`,
          hi: `आपकी सीधी बचत ₹${savedRupees} · ज़ीरो कोल्ड-स्टोरेज · रात 11 PM कटऑफ`,
          mr: `थेट बचत ₹${savedRupees} · शून्य कोल्ड-स्टोरेज · रात्री ११ PM कटऑफ`,
          hinglish: `₹${savedRupees} saved · Zero cold-storage · 11 PM cutoff`,
        })
      : pickLang(lang, {
          en: 'Zero cold-storage · 4:00 AM morning lot · Book before 11:00 PM cutoff',
          hi: 'बिना कोल्ड-स्टोरेज · रोज़ सुबह 4 AM मंडी लॉट · रात 11 PM कटऑफ',
          mr: 'कोल्ड-स्टोरेजशिवाय · पहाटे ४ AM मंडी लॉट · रात्री ११ PM कटऑफ',
          hinglish: 'Zero cold-storage · 4 AM APMC lot · 11 PM cutoff',
        });

  return (
    <div className="w-full py-0.5 pl-1.5 sm:pl-2">
      <div className={`liquid-glass-capsule ${themeBannerClass} rounded-2xl sm:rounded-full px-3 py-2 sm:px-4 sm:py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5`}>
        {/* Left: Protruding Glowing Brand/Festival Logo Orb + Title & Clean Subtitle */}
        <div className="flex items-center gap-2.5 min-w-0 z-10">
          <div className="relative -ml-3 sm:-ml-4 shrink-0">
            <div className="liquid-glass-orb-ring w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px]">
              <div className={`w-full h-full rounded-full bg-linear-to-br ${festivalSurface.orbRing} flex items-center justify-center shadow-inner overflow-hidden`}>
                <BrandLogo size="sm" festivalTheme={festivalTheme} className="rounded-full shadow-none" />
              </div>
            </div>
            <Sparkles className="w-3 h-3 text-white drop-shadow absolute -top-0.5 right-0 pointer-events-none" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isFestivalActive && festivalTheme?.badgeText && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0 leading-tight ${festivalSurface.badgeBg}`}>
                  {festivalTheme.badgeText}
                </span>
              )}
              <h2 className="text-sm sm:text-base font-display font-black tracking-tight text-white leading-tight truncate">
                {headlineText}
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-white/85 leading-snug truncate mt-0.5">
              {subtitleText}
            </p>
          </div>
        </div>

        {/* Right: Interactive Batch Savings & Daily Forecast Capsule + Update/Terms CTA */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-2.5 shrink-0 z-10">
          {featureFlags.rateSavingsSuggestions && (
            onOpenSavingsForecast ? (
              <button
                type="button"
                onClick={onOpenSavingsForecast}
                className="liquid-glass-split rounded-full px-3.5 py-1.5 flex items-center gap-2 text-[11px] font-bold text-slate-900 whitespace-nowrap font-mono-nums hover:bg-white transition-all active:scale-95 cursor-pointer"
              >
                <span>
                  {savedRupees > 0
                    ? pickLang(lang, {
                        en: `₹${savedRupees} Saved`,
                        hi: `₹${savedRupees} बचत`,
                        mr: `₹${savedRupees} बचत`,
                        hinglish: `₹${savedRupees} Saved`,
                      })
                    : pickLang(lang, {
                        en: '~30% Save',
                        hi: '~30% बचत',
                        mr: '~३०% बचत',
                        hinglish: '~30% Save',
                      })}
                </span>
                <span className="h-3.5 w-px bg-slate-300" aria-hidden="true" />
                <span className="text-emerald-800 font-black">
                  {pickLang(lang, {
                    en: 'Daily Forecast ↗',
                    hi: 'बचत व अनुमान ↗',
                    mr: 'दैनिक अंदाज ↗',
                    hinglish: 'Daily Forecast ↗',
                  })}
                </span>
              </button>
            ) : (
              <div className="liquid-glass-split rounded-full px-3 py-1.5 flex items-center gap-2 text-[11px] font-bold text-slate-900 whitespace-nowrap font-mono-nums">
                <span>
                  {pickLang(lang, {
                    en: '~30% Save',
                    hi: '~30% बचत',
                    mr: '~३०% बचत',
                    hinglish: '~30% Save',
                  })}
                </span>
                <span className="h-3.5 w-px bg-slate-300" aria-hidden="true" />
                <span className="text-emerald-800 font-black">
                  {pickLang(lang, {
                    en: '4 AM Lot',
                    hi: '4 AM लॉट',
                    mr: '४ AM लॉट',
                    hinglish: '4 AM Lot',
                  })}
                </span>
              </div>
            )
          )}

          {hasUpdate ? (
            <button
              type="button"
              onClick={triggerUpdate}
              className="px-4 py-1.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
              <span>
                {pickLang(lang, {
                  en: 'Update',
                  hi: 'अपडेट करें',
                  mr: 'अपडेट',
                  hinglish: 'Update',
                })}
              </span>
            </button>
          ) : (
            onOpenAbout && (
              <button
                type="button"
                onClick={onOpenAbout}
                className="px-4 py-1.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold shadow-md transition-all active:scale-95 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>
                  {pickLang(lang, {
                    en: 'Terms',
                    hi: 'नियम व बचत',
                    mr: 'नियम व बचत',
                    hinglish: 'Terms',
                  })}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

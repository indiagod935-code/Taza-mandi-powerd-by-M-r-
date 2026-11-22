import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Joyride,
  STATUS,
  EVENTS,
  ACTIONS,
  Step,
  EventData,
  TooltipRenderProps,
} from 'react-joyride';
import { useApp } from '../context/AppContext';
import { AppPageId } from '../types';
import { pickLang } from '../utils/i18nHelper';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingTourProps {
  activeTab: AppPageId;
  setActiveTab: (tab: AppPageId) => void;
}

const CustomTourTooltip: React.FC<TooltipRenderProps> = ({
  index,
  size,
  isLastStep,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
}) => {
  const { lang } = useApp();

  return (
    <div
      {...tooltipProps}
      className="w-[min(92vw,360px)] rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 border border-white/60 dark:border-slate-700/80 shadow-2xl p-5 font-sans"
    >
      {/* Top Progress + Dismiss Row */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono-nums">
          {pickLang(lang, {
            en: `Step ${index + 1} of ${size}`,
            hi: `चरण ${index + 1} / ${size}`,
            mr: `पायरी ${index + 1} / ${size}`,
            hinglish: `Step ${index + 1} of ${size}`,
          })}
        </span>
        <button
          {...closeProps}
          type="button"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step Title & Body */}
      {step.title && (
        <h3 className="text-base font-bold font-display text-slate-900 dark:text-slate-100 leading-snug mb-1.5">
          {step.title}
        </h3>
      )}
      <div className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
        {step.content}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          {...skipProps}
          type="button"
          className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer py-1.5 px-1"
        >
          {pickLang(lang, {
            en: 'Skip tour',
            hi: 'छोड़ें',
            mr: 'वगळा',
            hinglish: 'Skip',
          })}
        </button>

        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              type="button"
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>
                {pickLang(lang, {
                  en: 'Back',
                  hi: 'पीछे',
                  mr: 'मागे',
                  hinglish: 'Back',
                })}
              </span>
            </button>
          )}

          <button
            {...primaryProps}
            type="button"
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span>
              {isLastStep
                ? pickLang(lang, {
                    en: 'Finish',
                    hi: 'शुरू करें',
                    mr: 'सुरू करा',
                    hinglish: 'Finish',
                  })
                : pickLang(lang, {
                    en: 'Next',
                    hi: 'आगे',
                    mr: 'पुढे',
                    hinglish: 'Next',
                  })}
            </span>
            {!isLastStep && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { user, isAuthModalOpen, lang } = useApp();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accountKey = useMemo(() => {
    const raw = user.email || user.phone || user.id || 'customer';
    return `tazamandi_onboarding_done_${raw.toLowerCase().replace(/[^a-z0-9@._-]/g, '_')}`;
  }, [user.email, user.phone, user.id]);

  // Keep viewport breakpoint synced for responsive Account tab spotlighting
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const markTourCompleted = useCallback(() => {
    try {
      localStorage.setItem(accountKey, 'true');
    } catch {}
  }, [accountKey]);

  // Start tour automatically when user logs in for the very first time
  useEffect(() => {
    if (!user.isLoggedIn || isAuthModalOpen) {
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
      return;
    }

    let alreadyDone = false;
    try {
      alreadyDone = localStorage.getItem(accountKey) === 'true';
    } catch {}

    if (alreadyDone) return;

    startTimerRef.current = setTimeout(() => {
      if (activeTab !== 'catalog') {
        setActiveTab('catalog');
      }
      setStepIndex(0);
      setRun(true);
    }, 550);

    return () => {
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
    };
  }, [user.isLoggedIn, isAuthModalOpen, accountKey, activeTab, setActiveTab]);

  // Support explicit replay anytime from Account Services
  useEffect(() => {
    const handleReplay = () => {
      setActiveTab('catalog');
      setStepIndex(0);
      setTimeout(() => {
        setRun(true);
      }, 280);
    };
    window.addEventListener('tazamandi-start-onboarding-tour', handleReplay);
    return () => window.removeEventListener('tazamandi-start-onboarding-tour', handleReplay);
  }, [setActiveTab]);

  const steps: Step[] = useMemo(
    () => [
      {
        target: '[data-tour="catalog-categories"]',
        placement: 'bottom',
        skipBeacon: true,
        title: pickLang(lang, {
          en: 'Welcome to ताज़ाMandi Catalog',
          hi: 'ताज़ाMandi कैटलॉग में आपका स्वागत है',
          mr: 'ताज़ाMandi कॅटलॉगमध्ये आपले स्वागत आहे',
          hinglish: 'ताज़ाMandi Catalog me Swagat Hai',
        }),
        content: pickLang(lang, {
          en: 'Filter daily veggies, leafy greens, fruits, and seasonal mandi picks right here — sourced fresh at 4:00 AM daily.',
          hi: 'यहाँ से रोज़ाना की सब्ज़ियाँ, पत्तेदार साग, ताज़ा फल और मौसमी मंडी माल एक क्लिक में चुनें।',
          mr: 'येथून दररोजच्या भाज्या, पालेभाज्या, ताजी फळे आणि हंगामी माल एका क्लिकवर निवडा.',
          hinglish: 'Yahan se rozana ki sabziyan, greens aur seasonal fruits ek click me filter karein.',
        }),
      },
      {
        target: '#produce-catalog-section',
        placement: 'top',
        skipBeacon: true,
        title: pickLang(lang, {
          en: 'Pick Quantities & Add to Bag',
          hi: 'वज़न चुनें और थैली में जोड़ें',
          mr: 'वजन निवडा आणि बॅगेत जोडा',
          hinglish: 'Weight Chunein aur Bag me Add Karein',
        }),
        content: pickLang(lang, {
          en: 'Choose exact weights (500g, 1 kg, 2 kg) on any card before the 11:00 PM cutoff for next-morning doorstep delivery.',
          hi: 'हर कार्ड पर 500g, 1 kg या 2 kg चुनकर थैली में जोड़ें — रात 11 बजे से पहले के सभी ऑर्डर अगली सुबह घर पहुँचते हैं।',
          mr: 'प्रत्येक कार्डवर ५००g, १ kg किंवा २ kg निवडून रात्री ११ पूर्वी ऑर्डर बुक करा.',
          hinglish: 'Har card par exact weight choose karke raat 11 PM cutoff se pehle add karein.',
        }),
      },
      {
        target: '[data-tour="voice-order-bubble"]',
        placement: 'top-end',
        isFixed: true,
        skipBeacon: true,
        title: pickLang(lang, {
          en: 'Hands-Free Voice Ordering',
          hi: 'बोलकर फ़टाफ़ट ऑर्डर करें',
          mr: 'बोलून त्वरित ऑर्डर करा',
          hinglish: 'Bolkar Hands-Free Order Karein',
        }),
        content: pickLang(lang, {
          en: 'Tap once to allow the mic, then just say "Taaza Mandi" followed by items like "2 kg potato, confirm order" — zero typing needed.',
          hi: 'बस एक बार माइक चालू करें, फिर "ताज़ा मंडी" कहकर सब्ज़ियों के नाम और "कन्फ़र्म कर दो" बोलें — टाइप करने की ज़रूरत नहीं।',
          mr: 'माइक सुरू करून "ताजा मंडी" म्हणा आणि भाज्यांची नावे बोलून थेट ऑर्डर कन्फर्म करा.',
          hinglish: 'Mic allow karke "Taaza Mandi" bolein aur items + "confirm" bolkar seedha order karein.',
        }),
      },
      {
        target: '[data-tour="header-cart-button"]',
        placement: 'bottom-end',
        isFixed: true,
        skipBeacon: true,
        title: pickLang(lang, {
          en: 'Your Bag & Instant Checkout',
          hi: 'आपकी थैली और तुरंत चेकआउट',
          mr: 'तुमची बॅग आणि त्वरित चेकआउट',
          hinglish: 'Shopping Bag & Fast Checkout',
        }),
        content: pickLang(lang, {
          en: 'Open your bag anytime to adjust items, confirm with Cash on Delivery or Kotak UPI QR, and get your digital bill.',
          hi: 'यहाँ से अपनी थैली देखें, डिलीवरी स्लॉट चुनें और नकद (COD) या Kotak UPI QR से ऑर्डर पक्का करें।',
          mr: 'येथून तुमची बॅग तपासा आणि COD किंवा Kotak UPI QR ने ऑर्डर कन्फर्म करा.',
          hinglish: 'Yahan se apna cart check karein aur COD ya Kotak UPI QR se order book karein.',
        }),
      },
      {
        target: isDesktop
          ? '[data-tour="desktop-account-tab"]'
          : '[data-tour="mobile-account-tab"]',
        placement: isDesktop ? 'bottom' : 'top-end',
        isFixed: !isDesktop,
        skipBeacon: true,
        title: pickLang(lang, {
          en: 'Account, Orders, Tracking & Maps',
          hi: 'खाता, ऑर्डर्स, लाइव ट्रैकिंग व मैप्स',
          mr: 'खाते, ऑर्डर्स, थेट ट्रॅकिंग व नकाशा',
          hinglish: 'Account, Orders & Live Van Track',
        }),
        content: pickLang(lang, {
          en: 'Everything for your profile lives here: My Orders & Invoices, Live Delivery Van Track, Google Maps Route, ₹50 Referral Cashback, and App Language.',
          hi: 'आपके खाते में My Orders व बिल, लाइव वैन ट्रैकिंग, Google Maps रूट, ₹50 रेफरल कैशबैक और भाषा बदलने का विकल्प एक जगह मिलता है।',
          mr: 'येथे My Orders, थेट व्हॅन ट्रॅकिंग, Google Maps मार्ग, ₹५० रेफरल आणि भाषा बदलण्याचे पर्याय मिळतील.',
          hinglish: 'Account ke andar My Orders, Live Van Track, Google Maps, ₹50 Cashback aur Language milti hai.',
        }),
      },
    ],
    [lang, isDesktop]
  );

  const handleJoyrideEvent = (data: EventData) => {
    const { action, index, status, type } = data;

    if (
      status === STATUS.FINISHED ||
      status === STATUS.SKIPPED ||
      action === ACTIONS.CLOSE
    ) {
      markTourCompleted();
      setRun(false);
      setStepIndex(0);
      return;
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextIdx = index + (action === ACTIONS.PREV ? -1 : 1);
      if (nextIdx >= steps.length || nextIdx < 0) {
        markTourCompleted();
        setRun(false);
        setStepIndex(0);
      } else {
        setStepIndex(nextIdx);
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      onEvent={handleJoyrideEvent}
      tooltipComponent={CustomTourTooltip}
      options={{
        zIndex: 10000,
        overlayColor: 'rgba(2, 6, 23, 0.72)',
        primaryColor: '#047857',
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        arrowColor: '#ffffff',
        spotlightRadius: 16,
        spotlightPadding: 8,
        skipBeacon: true,
        showProgress: true,
        scrollOffset: 88,
        buttons: ['back', 'primary', 'skip', 'close'],
      }}
    />
  );
};

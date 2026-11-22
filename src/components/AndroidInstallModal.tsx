import React, { useEffect, useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useApp } from '../context/AppContext';
import { pickLang } from '../utils/i18nHelper';
import { TermsAndConditionsModal } from './TermsAndConditionsModal';
import {
  Smartphone,
  Download,
  Share2,
  Copy,
  Check,
  X,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  ExternalLink,
  MoreVertical,
  Mic,
  Bell,
  MapPin,
  HardDrive,
  Lock,
  CheckCircle2,
  Star,
  AlertCircle,
  Package,
  Camera,
} from 'lucide-react';
import { locationService } from '../services/locationService';
import { BrandLogo } from './BrandLogo';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
}

type PermissionKey = 'mic' | 'camera' | 'notifications' | 'location' | 'storage';
type PermStatus = 'pending' | 'granted' | 'denied' | 'unsupported';

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  onOpenLegal,
}) => {
  const { lang, brand, festivalTheme } = useApp();
  const {
    isInstallable,
    isInstalled,
    isAndroid,
    isIOS,
    isInIframe,
    hasUpdate,
    install,
    triggerUpdate,
  } = usePWAInstall();

  const [step, setStep] = useState<'overview' | 'permissions' | 'installing' | 'done'>('overview');
  const [installProgress, setInstallProgress] = useState(0);
  const [installPhaseText, setInstallPhaseText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showChromeFixDetails, setShowChromeFixDetails] = useState(false);
  const [localLegalTab, setLocalLegalTab] = useState<'terms' | 'privacy' | null>(null);
  const [permState, setPermState] = useState<Record<PermissionKey, PermStatus>>({
    mic: 'pending',
    camera: 'pending',
    notifications: 'pending',
    location: 'pending',
    storage: 'pending',
  });
  const [acceptedInstallPolicy, setAcceptedInstallPolicy] = useState(true);
  const [hostedApkFiles, setHostedApkFiles] = useState<{ name: string; url: string; sizeKb: number }[]>([]);

  const isInAppWebView =
    typeof navigator !== 'undefined' &&
    /(wv|fban|fbav|instagram|whatsapp|line|micromessenger)/i.test(navigator.userAgent || '');

  // Probe current browser permissions cleanly without triggering intrusive prompts on mount
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    setStep('overview');
    setInstallProgress(0);

    fetch('/api/app/apk-status')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.apkFiles)) {
          setHostedApkFiles(data.apkFiles);
        }
      })
      .catch(() => {});

    const probe = async () => {
      const next: Record<PermissionKey, PermStatus> = {
        mic: 'pending',
        camera: 'pending',
        notifications: 'pending',
        location: 'pending',
        storage: 'pending',
      };

      if ('Notification' in window) {
        if (Notification.permission === 'granted') next.notifications = 'granted';
        else if (Notification.permission === 'denied') next.notifications = 'denied';
      } else {
        next.notifications = 'unsupported';
      }

      if (navigator.permissions?.query) {
        try {
          const micRes = await navigator.permissions.query({
            name: 'microphone' as PermissionName,
          });
          if (micRes.state === 'granted') next.mic = 'granted';
          else if (micRes.state === 'denied') next.mic = 'denied';
        } catch {}

        try {
          const camRes = await navigator.permissions.query({
            name: 'camera' as PermissionName,
          });
          if (camRes.state === 'granted') next.camera = 'granted';
          else if (camRes.state === 'denied') next.camera = 'denied';
        } catch {}

        try {
          const geoRes = await navigator.permissions.query({
            name: 'geolocation' as PermissionName,
          });
          if (geoRes.state === 'granted') next.location = 'granted';
          else if (geoRes.state === 'denied') next.location = 'denied';
        } catch {}
      }

      if (navigator.storage?.persisted) {
        try {
          const persisted = await navigator.storage.persisted();
          if (persisted) next.storage = 'granted';
        } catch {}
      }

      setPermState(next);
    };

    probe();
  }, [isOpen]);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : shareUrl;

  const requestPermission = async (key: PermissionKey): Promise<PermStatus> => {
    if (key === 'mic') {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPermState((p) => ({ ...p, mic: 'unsupported' }));
        return 'unsupported';
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setPermState((p) => ({ ...p, mic: 'granted' }));
        return 'granted';
      } catch {
        setPermState((p) => ({ ...p, mic: 'denied' }));
        return 'denied';
      }
    }

    if (key === 'camera') {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPermState((p) => ({ ...p, camera: 'unsupported' }));
        return 'unsupported';
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        setPermState((p) => ({ ...p, camera: 'granted' }));
        return 'granted';
      } catch {
        setPermState((p) => ({ ...p, camera: 'denied' }));
        return 'denied';
      }
    }

    if (key === 'notifications') {
      if (!('Notification' in window)) {
        setPermState((p) => ({ ...p, notifications: 'unsupported' }));
        return 'unsupported';
      }
      try {
        const res = await Notification.requestPermission();
        const status: PermStatus = res === 'granted' ? 'granted' : res === 'denied' ? 'denied' : 'pending';
        setPermState((p) => ({ ...p, notifications: status }));
        return status;
      } catch {
        return 'pending';
      }
    }

    if (key === 'location') {
      try {
        await locationService.detectAndReverseGeocode();
        setPermState((p) => ({ ...p, location: 'granted' }));
        return 'granted';
      } catch (err: any) {
        if (err?.message === 'GPS_UNSUPPORTED') {
          setPermState((p) => ({ ...p, location: 'unsupported' }));
          return 'unsupported';
        }
        setPermState((p) => ({ ...p, location: 'denied' }));
        return 'denied';
      }
    }

    if (key === 'storage') {
      try {
        if (navigator.storage?.persist) {
          const ok = await navigator.storage.persist();
          const st: PermStatus = ok ? 'granted' : 'pending';
          setPermState((p) => ({ ...p, storage: st }));
          return st;
        }
      } catch {}
      setPermState((p) => ({ ...p, storage: 'granted' }));
      return 'granted';
    }

    return 'pending';
  };

  const runPlayStoreInstallSequence = async () => {
    if (!acceptedInstallPolicy) return;
    setStep('installing');
    setInstallProgress(18);
    setInstallPhaseText(
      pickLang(lang, {
        en: 'Verifying app permissions & Play Integrity...',
        hi: 'ऐप अनुमतियाँ और पैकेज सुरक्षा जाँची जा रही है...',
      })
    );

    await new Promise((r) => setTimeout(r, 420));
    setInstallProgress(52);
    setInstallPhaseText(
      pickLang(lang, {
        en: 'Packaging Standalone WebAPK (Browser Bar Hidden)...',
        hi: 'फुल-स्क्रीन स्टैंडअलोन ऐप तैयार हो रहा है (बिना ब्राउज़र बार)...',
      })
    );

    await new Promise((r) => setTimeout(r, 450));
    setInstallProgress(86);
    setInstallPhaseText(
      pickLang(lang, {
        en: 'Installing ताज़ाMandi to Home Screen...',
        hi: 'ताज़ाMandi आपके फ़ोन में इंस्टॉल हो रहा है...',
      })
    );

    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstallProgress(100);
        setStep('done');
        return;
      }
    }

    await new Promise((r) => setTimeout(r, 350));
    setInstallProgress(100);
    setStep('done');
  };

  const handleGrantAllAndInstall = async () => {
    if (permState.notifications === 'pending') {
      await requestPermission('notifications');
    }
    if (permState.mic === 'pending') {
      await requestPermission('mic');
    }
    if (permState.camera === 'pending') {
      await requestPermission('camera');
    }
    if (permState.storage === 'pending') {
      await requestPermission('storage');
    }
    await runPlayStoreInstallSequence();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openLegalTab = (tab: 'terms' | 'privacy') => {
    if (onOpenLegal) {
      onOpenLegal(tab);
    } else {
      setLocalLegalTab(tab);
    }
  };

  const whatsappHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `🌱 ताज़ाMandi · powered by MARCO 💯\nDirect APMC Vashi Mandi App!\n${shareUrl}`
  )}`;

  const permissionItems: {
    key: PermissionKey;
    icon: React.ReactNode;
    title: string;
    desc: string;
    requiredLabel: string;
  }[] = [
    {
      key: 'mic',
      icon: <Mic className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />,
      title: pickLang(lang, { en: 'Microphone & Voice AI', hi: 'माइक्रोफोन (वॉइस ऑर्डर AI)' }),
      desc: pickLang(lang, {
        en: 'For hands-free Hindi, English & regional voice ordering',
        hi: 'बोलकर सब्ज़ी-फल ऑर्डर और संवेदनशीलता सेट करने हेतु',
      }),
      requiredLabel: pickLang(lang, { en: 'Voice Ordering', hi: 'वॉइस ऑर्डर' }),
    },
    {
      key: 'camera',
      icon: <Camera className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      title: pickLang(lang, { en: 'Camera & Photos', hi: 'कैमरा व फोटो गैलरी' }),
      desc: pickLang(lang, {
        en: 'To click and upload your Profile DP photo cleanly',
        hi: 'प्रोफाइल फोटो (DP) खींचने और गैलरी से लगाने हेतु',
      }),
      requiredLabel: pickLang(lang, { en: 'Profile DP', hi: 'प्रोफाइल फोटो' }),
    },
    {
      key: 'notifications',
      icon: <Bell className="w-4 h-4 text-pink-600 dark:text-pink-400" />,
      title: pickLang(lang, { en: 'Notifications & Alerts', hi: 'नोटिफिकेशन व कटऑफ अलर्ट' }),
      desc: pickLang(lang, {
        en: '11 PM batch lock countdown & morning van arrival alerts',
        hi: 'रात 11 PM बैच लॉक व सुबह डिलीवरी वैन अलर्ट हेतु',
      }),
      requiredLabel: pickLang(lang, { en: 'Live Alerts', hi: 'लाइव अलर्ट' }),
    },
    {
      key: 'location',
      icon: <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      title: pickLang(lang, { en: 'Location (Society Routing)', hi: 'लोकेशन (सोसायटी रूटिंग)' }),
      desc: pickLang(lang, {
        en: 'Accurate gate delivery & nearest APMC dispatch routing',
        hi: 'सही गेट डिलीवरी और मंडी दूरी जांच हेतु (वैकल्पिक)',
      }),
      requiredLabel: pickLang(lang, { en: 'Optional', hi: 'वैकल्पिक' }),
    },
    {
      key: 'storage',
      icon: <HardDrive className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
      title: pickLang(lang, { en: 'Offline App Storage', hi: 'ऑफलाइन स्टोरेज कैश' }),
      desc: pickLang(lang, {
        en: 'Keeps app icon standalone with fast startup & cached rates',
        hi: 'ऐप को तेज़ व बिना नेटवर्क के भी खुलने योग्य रखने हेतु',
      }),
      requiredLabel: pickLang(lang, { en: 'Recommended', hi: 'अनुशंसित' }),
    },
  ];

  const grantedCount = Object.values(permState).filter((s) => s === 'granted').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp my-auto">
        {/* Play-Store-Style App Header */}
        <div className="p-5 bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <BrandLogo
                  size="lg"
                  festivalTheme={festivalTheme}
                  className="w-16 h-16 rounded-2xl border-2 border-white/30 shadow-lg"
                />
                {step === 'installing' && (
                  <div className="absolute -inset-1 rounded-2xl border-2 border-amber-300 animate-pulse pointer-events-none" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="truncate">MARCO 💯 · Verified Direct APMC App</span>
                </div>
                <h2 className="text-xl font-black tracking-tight font-display truncate mt-0.5">
                  {brand.brandName || 'ताज़ाMandi'} Mobile App
                </h2>
                <div className="flex items-center gap-2.5 text-[11px] text-emerald-100/90 mt-1 font-mono-nums">
                  <span className="inline-flex items-center gap-0.5 font-bold text-amber-300">
                    4.9 <Star className="w-3 h-3 fill-amber-300" />
                  </span>
                  <span>·</span>
                  <span>1.8 MB</span>
                  <span>·</span>
                  <span>{pickLang(lang, { en: 'No Ads · Standalone', hi: 'बिना विज्ञापन · फुल-स्क्रीन' })}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close app installer"
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Stepper Bar */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] font-bold">
            <button
              type="button"
              onClick={() => step !== 'installing' && setStep('overview')}
              className={`cursor-pointer transition-colors ${
                step === 'overview' ? 'text-amber-300 underline underline-offset-4' : 'text-emerald-200/80'
              }`}
            >
              01. {pickLang(lang, { en: 'App Overview', hi: 'ऐप विवरण' })}
            </button>
            <span className="text-white/30">→</span>
            <button
              type="button"
              onClick={() => step !== 'installing' && setStep('permissions')}
              className={`cursor-pointer transition-colors ${
                step === 'permissions' ? 'text-amber-300 underline underline-offset-4' : 'text-emerald-200/80'
              }`}
            >
              02. {pickLang(lang, { en: `Permissions (${grantedCount}/5)`, hi: `अनुमतियाँ (${grantedCount}/5)` })}
            </button>
            <span className="text-white/30">→</span>
            <span className={step === 'installing' || step === 'done' ? 'text-amber-300' : 'text-emerald-200/80'}>
              03. {pickLang(lang, { en: 'Install App', hi: 'इंस्टॉल' })}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700 dark:text-slate-300 max-h-[68vh] overflow-y-auto">
          {/* Installed Status Banner */}
          {isInstalled && step === 'overview' && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 rounded-2xl space-y-2.5">
              <div className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {pickLang(lang, {
                    en: 'App is installed in Standalone Mode on this device!',
                    hi: 'ताज़ाMandi ऐप आपके फ़ोन पर फुल-स्क्रीन मोड में इंस्टॉल है!',
                  })}
                </span>
              </div>
              {hasUpdate && (
                <button
                  type="button"
                  onClick={triggerUpdate}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  {pickLang(lang, { en: 'Update Now to Latest Build', hi: 'नया अपडेट अभी इंस्टॉल करें' })}
                </button>
              )}
            </div>
          )}

          {/* Browser / In-App Frame Warning (Explains & Fixes Chrome Bar Attribution Issue!) */}
          {(isInIframe || isInAppWebView) && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-2.5">
              <div className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {pickLang(lang, {
                    en: 'Remove Browser Top Bar: Open Directly in Chrome First',
                    hi: 'ऊपर Chrome/ब्राउज़र नाम हटाने के लिए सीधे Chrome में खोलें',
                  })}
                </span>
              </div>
              <p className="text-[11px] text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                {pickLang(lang, {
                  en: 'In-app browsers (WhatsApp, Google Redirect) or preview frames block pure WebAPK install and show a browser toolbar on top. Open cleanly in full Chrome first, then install as a Standalone App.',
                  hi: 'WhatsApp/Google लिंक या प्रिव्यू विंडो से इंस्टॉल करने पर ऊपर ब्राउज़र बार दिखता है। पहले पूरे Chrome में खोलें — फिर Play Store जैसा बिना ब्राउज़र बार वाला ऐप इंस्टॉल होगा।',
                })}
              </p>
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>
                  {pickLang(lang, {
                    en: 'Open Clean in Full Chrome Tab (Hides Browser Bar)',
                    hi: 'सीधे Chrome में खोलें (ब्राउज़र बार हटाएं)',
                  })}
                </span>
              </a>
            </div>
          )}

          {/* STEP 1: PLAY-STORE APP OVERVIEW */}
          {step === 'overview' && (
            <div className="space-y-4">
              {/* Feature Strip */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10.5px]">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <div className="font-bold text-slate-900 dark:text-white">
                    {pickLang(lang, { en: 'Voice AI', hi: 'वॉइस ऑर्डर AI' })}
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    {pickLang(lang, { en: '18 Languages', hi: '18 भाषाएँ' })}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Layers className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="font-bold text-slate-900 dark:text-white">
                    {pickLang(lang, { en: 'No Chrome Bar', hi: 'फुल-स्क्रीन ऐप' })}
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    {pickLang(lang, { en: 'Standalone UI', hi: 'WebAPK मोड' })}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Lock className="w-4 h-4 text-pink-600 mx-auto mb-1" />
                  <div className="font-bold text-slate-900 dark:text-white">
                    {pickLang(lang, { en: 'Data Safety', hi: 'डेटा सुरक्षा' })}
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    {pickLang(lang, { en: 'Encrypted', hi: 'सत्यापित' })}
                  </div>
                </div>
              </div>

              {/* Chrome Bar Fix Explanation Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowChromeFixDetails(!showChromeFixDetails)}
                  className="w-full flex items-center justify-between text-left font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 text-xs">
                    <Smartphone className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>
                      {pickLang(lang, {
                        en: 'Why browser top-bar appears & how our Standalone WebAPK removes it',
                        hi: 'Chrome में ऊपर नाम/पट्टी क्यों दिखती है और इसे कैसे हटाएं?',
                      })}
                    </span>
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 text-[11px] shrink-0">
                    {showChromeFixDetails ? 'Hide' : 'Details'}
                  </span>
                </button>

                {showChromeFixDetails && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700 leading-relaxed">
                    <p>
                      <strong>1. </strong>
                      {pickLang(lang, {
                        en: 'If you previously tapped "Add shortcut", Android places a Chrome icon badge and keeps the Chrome toolbar visible.',
                        hi: 'पहले “Add shortcut” बनने पर आइकॉन के नीचे Chrome लोगो और ऊपर ब्राउज़र बार दिखता था। अब हमने Active Service Worker + Standalone Manifest चालू कर दिया है ताकि असली WebAPK ऐप इंस्टॉल हो।',
                      })}
                    </p>
                    <p>
                      <strong>2. </strong>
                      {pickLang(lang, {
                        en: 'Remove the old Home Screen shortcut first, then use "Install" below (or Chrome ⋮ → "Install app") for an authentic fullscreen Android app experience with zero browser chrome.',
                        hi: 'पुराना शॉर्टकट हटाकर नीचे "Permissions & Install" से इंस्टॉल करें — ऐप बिना किसी ब्राउज़र नाम या URL बार के खुलेगा।',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Data Safety & Privacy Policy Link inside Store Overview */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
                    {pickLang(lang, {
                      en: 'Review Data Safety, Privacy Policy & Terms',
                      hi: 'डेटा सुरक्षा, गोपनीयता नीति और शर्तें पढ़ें',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-bold text-emerald-700 dark:text-emerald-400">
                  <button
                    type="button"
                    onClick={() => openLegalTab('privacy')}
                    className="hover:underline cursor-pointer"
                  >
                    {pickLang(lang, { en: 'Privacy Policy', hi: 'Privacy Policy' })}
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => openLegalTab('terms')}
                    className="hover:underline cursor-pointer"
                  >
                    {pickLang(lang, { en: 'Terms', hi: 'शर्तें' })}
                  </button>
                </div>
              </div>

              {/* Primary CTA -> Step 2 (Permissions) */}
              <button
                type="button"
                onClick={() => setStep('permissions')}
                className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-[0.99]"
              >
                <Download className="w-5 h-5" />
                <span>
                  {pickLang(lang, {
                    en: 'Continue to Permissions & Install App',
                    hi: 'अनुमतियाँ जांचें व ऐप इंस्टॉल करें →',
                  })}
                </span>
              </button>
            </div>
          )}

          {/* STEP 2: PLAY-STORE / APK STYLE PERMISSION APPROVAL */}
          {step === 'permissions' && (
            <div className="space-y-3.5">
              <div className="space-y-0.5">
                <h3 className="font-display font-black text-sm text-slate-900 dark:text-white">
                  {pickLang(lang, {
                    en: 'App Permissions Required for Best Experience',
                    hi: 'इंस्टॉल से पहले ऐप अनुमतियाँ (Permissions) सेट करें',
                  })}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {pickLang(lang, {
                    en: 'Just like Play Store / Android APK setup — allow needed permissions below before installing.',
                    hi: 'Play Store / APK इंस्टॉलेशन की तरह नीचे दी गई अनुमतियाँ चालू करें ताकि वॉइस और अलर्ट तुरंत काम करें।',
                  })}
                </p>
              </div>

              <div className="space-y-2">
                {permissionItems.map((perm) => {
                  const status = permState[perm.key];
                  return (
                    <div
                      key={perm.key}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          {perm.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5 flex-wrap">
                            <span>{perm.title}</span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              · {perm.requiredLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                            {perm.desc}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => requestPermission(perm.key)}
                        disabled={status === 'granted' || status === 'unsupported'}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
                          status === 'granted'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 cursor-default'
                            : status === 'denied'
                            ? 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800'
                            : 'bg-slate-900 dark:bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        {status === 'granted'
                          ? pickLang(lang, { en: '✓ Allowed', hi: '✓ चालू' })
                          : status === 'denied'
                          ? pickLang(lang, { en: 'Retry', hi: 'पुनः प्रयास' })
                          : status === 'unsupported'
                          ? 'N/A'
                          : pickLang(lang, { en: 'Allow', hi: 'अनुमति दें' })}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Mandatory Privacy Policy + Terms Consent for Installation */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedInstallPolicy}
                  onChange={(e) => setAcceptedInstallPolicy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-700 rounded shrink-0 cursor-pointer"
                />
                <span className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  {pickLang(lang, {
                    en: 'I agree to install the ताज़ाMandi Standalone App and accept the ',
                    hi: 'मैं ताज़ाMandi स्टैंडअलोन ऐप इंस्टॉल करने व इसकी ',
                  })}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      openLegalTab('privacy');
                    }}
                    className="font-bold text-emerald-700 dark:text-emerald-400 underline cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  {' & '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      openLegalTab('terms');
                    }}
                    className="font-bold text-emerald-700 dark:text-emerald-400 underline cursor-pointer"
                  >
                    Terms & Conditions
                  </button>
                  .
                </span>
              </label>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('overview')}
                  className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {pickLang(lang, { en: 'Back', hi: 'पीछे' })}
                </button>
                <button
                  type="button"
                  disabled={!acceptedInstallPolicy}
                  onClick={handleGrantAllAndInstall}
                  className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {pickLang(lang, {
                      en: 'Grant Permissions & Install Now',
                      hi: 'अनुमतियाँ देकर अभी इंस्टॉल करें',
                    })}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PLAY-STORE ANIMATED DOWNLOAD & INSTALL PROGRESS */}
          {step === 'installing' && (
            <div className="py-6 px-3 text-center space-y-5">
              <div className="relative w-20 h-20 mx-auto">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-slate-200 dark:text-slate-800"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={220}
                    strokeDashoffset={220 - (220 * installProgress) / 100}
                    className="text-emerald-600 transition-all duration-300"
                  />
                </svg>
                <div className="w-12 h-12 rounded-xl overflow-hidden absolute inset-0 m-auto shadow-md flex items-center justify-center">
                  <BrandLogo size="md" festivalTheme={festivalTheme} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-display font-black text-base text-slate-900 dark:text-white font-mono-nums">
                  {installProgress}% · {pickLang(lang, { en: 'Installing App...', hi: 'ऐप इंस्टॉल हो रहा है...' })}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{installPhaseText}</p>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-emerald-600 to-teal-500 transition-all duration-300"
                  style={{ width: `${installProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* STEP 4: COMPLETED OR BROWSER SYSTEM MENU PROMPT */}
          {step === 'done' && (
            <div className="space-y-3.5">
              {isInstalled ? (
                <div className="p-4 bg-emerald-600 text-white rounded-2xl text-center space-y-2 animate-order-stage">
                  <CheckCircle2 className="w-8 h-8 mx-auto" />
                  <div className="font-display font-black text-base">
                    {pickLang(lang, {
                      en: 'ताज़ाMandi Installed as Standalone App!',
                      hi: 'ताज़ाMandi सफलतापूर्वक इंस्टॉल हो गया!',
                    })}
                  </div>
                  <p className="text-[11px] text-emerald-100">
                    {pickLang(lang, {
                      en: 'Open directly from your Home Screen / App Drawer — it now launches fullscreen with zero Chrome top bar.',
                      hi: 'अब होम स्क्रीन आइकॉन से सीधे खोलें — यह बिना किसी ब्राउज़र बार के असली ऐप की तरह खुलेगा।',
                    })}
                  </p>
                </div>
              ) : isAndroid ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>
                      {pickLang(lang, {
                        en: 'Final 1-Tap Chrome Confirmation:',
                        hi: 'अंतिम 1-टैप Chrome पुष्टि:',
                      })}
                    </span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 pl-1">
                    <li className="flex items-center gap-1">
                      <span>1.</span>
                      <span>
                        {pickLang(lang, {
                          en: 'Tap Chrome top-right menu',
                          hi: 'Chrome में ऊपर दाईं ओर 3-डॉट्स मेनू दबाएं',
                        })}
                      </span>
                      <MoreVertical className="w-3.5 h-3.5 text-slate-500 inline" />
                    </li>
                    <li>
                      {pickLang(lang, {
                        en: 'Select "Install app" (creates fullscreen WebAPK with NO browser bar) — avoid "Create shortcut".',
                        hi: '"Install app" चुनें (इससे बिना ब्राउज़र बार के पूरा Android ऐप बनेगा)।',
                      })}
                    </li>
                  </ol>
                </div>
              ) : isIOS ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {pickLang(lang, {
                      en: 'Final Step on iPhone / iPad (Safari):',
                      hi: 'iPhone / iPad पर अंतिम स्टेप:',
                    })}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {pickLang(lang, {
                      en: '1. Tap Share in Safari bottom bar · 2. Tap "Add to Home Screen" -> Opens fullscreen with zero browser bar.',
                      hi: '1. Safari में नीचे Share दबाएं · 2. "Add to Home Screen" चुनें — बिना ब्राउज़र बार के फुल-स्क्रीन खुलेगा।',
                    })}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      {pickLang(lang, {
                        en: 'Permissions Saved — Click Install (⊕) in Chrome/Edge Address Bar',
                        hi: 'अनुमतियाँ सेव हो गईं — ऊपर ब्राउज़र बार में Install (⊕) दबाएं',
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {pickLang(lang, {
                      en: 'Or copy/open the link in Android Chrome for 1-tap standalone mobile installation.',
                      hi: 'या नीचे का लिंक अपने Android फ़ोन के Chrome में खोलकर 1-टैप में इंस्टॉल करें।',
                    })}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
              >
                {pickLang(lang, { en: 'Done', hi: 'हो गया' })}
              </button>
            </div>
          )}

          {/* Quick Share Link Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {pickLang(lang, {
                    en: 'Open on Phone or Share App Link:',
                    hi: 'फ़ोन पर खोलें या पड़ोसियों को भेजें:',
                  })}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-[11px] font-mono text-slate-700 dark:text-slate-300 outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>
                  {copied
                    ? pickLang(lang, { en: 'Copied!', hi: 'कॉपी!' })
                    : pickLang(lang, { en: 'Copy Link', hi: 'कॉपी लिंक' })}
                </span>
              </button>
            </div>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>
                {pickLang(lang, {
                  en: 'Send Standalone App Link on WhatsApp',
                  hi: 'WhatsApp पर ऐप लिंक भेजें',
                  hinglish: 'WhatsApp par App Link bhejein',
                })}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            {/* Hosted Official Signed Android .APK Download (Shown automatically once hosted) */}
            {hostedApkFiles.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-2">
                <div className="text-[11px] font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>
                    {pickLang(lang, {
                      en: 'Official Android Installer (.apk)',
                      hi: 'ऑफिशियल Android ऐप (.apk डाउनलोड)',
                      hinglish: 'Official Android App (.apk)',
                    })}
                  </span>
                </div>
                {hostedApkFiles.map((apk) => (
                  <a
                    key={apk.name}
                    href={apk.url}
                    download={apk.name}
                    className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs flex items-center justify-between gap-2 shadow-xs"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Download className="w-4 h-4 shrink-0" />
                      <span className="truncate">Download {apk.name}</span>
                    </span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full shrink-0">
                      {(apk.sizeKb / 1024).toFixed(1)} MB
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fallback Local Legal Modal if parent didn't pass callback */}
      {localLegalTab && (
        <TermsAndConditionsModal
          isOpen={true}
          initialTab={localLegalTab}
          onClose={() => setLocalLegalTab(null)}
        />
      )}
    </div>
  );
};

export default AndroidInstallModal;

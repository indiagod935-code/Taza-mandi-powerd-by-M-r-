import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Maximize2,
  Sparkles,
  Zap,
  Leaf,
  Smartphone,
  LayoutGrid,
  ArrowRight,
  ShieldCheck,
  CalendarHeart,
  Bot,
  Send,
  RotateCcw,
  Palette,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FestivalLogoPreset, FestivalSurfaceTone, FestivalThemeConfig, StoreUiSampleId } from '../types';
import { FESTIVAL_THEME_PRESETS, getFestivalSurfaceClasses } from '../config/festivalThemes';
import { BrandLogo } from './BrandLogo';
import { aiThemeApi } from '../api/endpoints';
import { pickLang } from '../utils/i18nHelper';
import quickMartImg from '../assets/images/ui_sample_quick_mart_1795108241419.jpg';
import freshBoutiqueImg from '../assets/images/ui_sample_fresh_boutique_1795108245719.jpg';
import hybridSuperappImg from '../assets/images/ui_sample_hybrid_superapp_1795108245453.jpg';

export interface UiSampleDefinition {
  id: StoreUiSampleId;
  badge: string;
  title: string;
  subtitle: string;
  image?: string;
  highlights: string[];
  accentBg: string;
  accentBorder: string;
  accentText: string;
  icon: 'classic' | 'quick' | 'boutique' | 'hybrid';
}

export const UI_SAMPLE_DEFINITIONS: UiSampleDefinition[] = [
  {
    id: 'quick_mart',
    badge: 'SAMPLE 1 · QUICK-COMMERCE',
    title: 'Instant Quick-Mart Storefront',
    subtitle:
      'Blinkit / Zepto जैसा 2-column & 4-column high-density product grid, instant green +ADD buttons, fast weight pills & clean minimal cards.',
    image: quickMartImg,
    highlights: [
      'Compact square-aspect produce cards (2x mobile / 4x desktop)',
      'Prominent green + ADD / qty stepper right on the card',
      'Clean white surfaces with crisp wholesale savings callout',
      'Ultra-fast browsing for daily sabzi & fruit shoppers',
    ],
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-300',
    accentText: 'text-emerald-800',
    icon: 'quick',
  },
  {
    id: 'fresh_boutique',
    badge: 'SAMPLE 2 · FRESH BOUTIQUE',
    title: 'Organic Harvest Boutique UI',
    subtitle:
      'Warm stone-cream editorial canvas, calm farmer-market feel, soft serif product titles, relaxed whitespace & farm-fresh visual focus.',
    image: freshBoutiqueImg,
    highlights: [
      'Warm stone (#fafaf9) canvas that reduces visual clutter',
      'Editorial serif headers & gentle rounded produce frames',
      'Zero loud flashing badges — natural organic grocery trust',
      'Best for premium families & conscious apartment societies',
    ],
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-300',
    accentText: 'text-amber-900',
    icon: 'boutique',
  },
  {
    id: 'hybrid_superapp',
    badge: 'SAMPLE 3 · HYBRID SUPERAPP',
    title: 'Fresh Produce + Tech Mart SuperApp',
    subtitle:
      'Modern deep teal-emerald split header, crisp unified storefront for Fresh Produce, Mobile Accessories & Society Pool batches.',
    image: hybridSuperappImg,
    highlights: [
      'Dual-accent teal & slate product elevation with crisp shadows',
      'Dedicated visual balance between Subzi Mandi & Tech Mart',
      'Modern super-app cart bar & structured rate tier pills',
      'Optimized for repeat batch buyers & multi-category carts',
    ],
    accentBg: 'bg-teal-50',
    accentBorder: 'border-teal-300',
    accentText: 'text-teal-900',
    icon: 'hybrid',
  },
  {
    id: 'classic',
    badge: 'DEFAULT · CLASSIC MANDI',
    title: 'Classic ताज़ाMandi Storefront',
    subtitle:
      'Original clean storefront layout with balanced 3-column desktop grid, society window cutoff bar, and full feature support.',
    highlights: [
      'Familiar balanced layout with full card controls',
      'Supports every Mandi feature & batch pool indicator cleanly',
      'Lightweight default styling',
    ],
    accentBg: 'bg-slate-50',
    accentBorder: 'border-slate-300',
    accentText: 'text-slate-800',
    icon: 'classic',
  },
];

interface UISamplesGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  recommendedUiSample?: StoreUiSampleId | null;
  festivalTheme?: FestivalThemeConfig | null;
  applied?: boolean;
  error?: boolean;
}

const QUICK_AI_PROMPTS = [
  'Diwali special golden theme banao, Diya wala fresh basket logo lagao aur festive harvest message likho.',
  'Holi rangotsav colorful magenta theme banao + colorful gulal basket logo set karo.',
  '15 August Independence Day ke liye Tiranga theme aur saffron-white-green logo design karo.',
  'Summer Mango Harvest gold theme lagao aur Quick-Mart UI activate karo.',
  'Festival theme hata kar normal classic green freshness aur fresh basket logo wapas lagao.',
];

const SURFACE_TONES: { id: FestivalSurfaceTone; label: string; swatch: string }[] = [
  { id: 'emerald', label: 'Emerald Fresh', swatch: 'bg-emerald-700' },
  { id: 'saffron', label: 'Festive Saffron', swatch: 'bg-orange-600' },
  { id: 'magenta', label: 'Rangotsav Pink', swatch: 'bg-pink-600' },
  { id: 'gold', label: 'Golden Harvest', swatch: 'bg-amber-600' },
  { id: 'royal', label: 'Royal Evening', swatch: 'bg-indigo-700' },
  { id: 'tricolor', label: 'Tiranga Pride', swatch: 'bg-linear-to-r from-orange-500 via-white to-emerald-600' },
];

const LOGO_PRESETS: { id: FestivalLogoPreset; label: string }[] = [
  { id: 'default', label: 'Fresh Leaf' },
  { id: 'diwali', label: 'Diwali Diya' },
  { id: 'holi', label: 'Holi Colors' },
  { id: 'ganesh', label: 'Ganesh Tilak' },
  { id: 'navratri', label: 'Navratri Flame' },
  { id: 'patriotic', label: 'Tiranga Chakra' },
  { id: 'eid', label: 'Eid Crescent' },
  { id: 'sankranti', label: 'Sankranti Kite' },
  { id: 'harvest', label: 'Mango Harvest' },
  { id: 'custom', label: 'AI Custom SVG' },
];

export const UISamplesGalleryModal: React.FC<UISamplesGalleryModalProps> = ({ isOpen, onClose }) => {
  const {
    lang,
    brand,
    activeUiSample,
    setActiveUiSample,
    festivalTheme,
    updateFestivalTheme,
    resetFestivalTheme,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'samples' | 'festivals' | 'ai_designer'>('samples');
  const [zoomedSampleId, setZoomedSampleId] = useState<StoreUiSampleId | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [justAppliedId, setJustAppliedId] = useState<StoreUiSampleId | null>(null);
  const [festivalSavedToast, setFestivalSavedToast] = useState<string | null>(null);

  // Local editable draft synced with current active festivalTheme
  const [draftFestival, setDraftFestival] = useState<FestivalThemeConfig>(festivalTheme);

  // Conversational AI Designer state
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome-ai',
      role: 'assistant',
      text: pickLang(lang, {
        en: 'Namaste Admin! Tell me how you want the storefront UI, festival theme, banner copy, colors, or app logo to look — in Hindi, Hinglish, or English. I will craft a live theme & vector SVG logo for you.',
        hi: 'नमस्ते एडमिन! आप हिंदी, हिंग्लिश या अंग्रेज़ी में बताएं कि स्टोर का UI, त्यौहार थीम, बैनर और ऐप लोगो कैसा चाहिए। मैं आपके लिए तुरंत नया थीम व लोगो तैयार करूँगा।',
        hinglish: 'Namaste Admin! Hindi, Hinglish ya English me batayein ki store ka UI, festival theme, banner aur app logo kaisa chahiye — main turant design bana dunga.',
      }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraftFestival(festivalTheme);
  }, [festivalTheme]);

  useEffect(() => {
    if (activeTab === 'ai_designer') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, activeTab]);

  if (!isOpen) return null;

  const zoomedSample = UI_SAMPLE_DEFINITIONS.find((s) => s.id === zoomedSampleId) || null;
  const draftSurface = getFestivalSurfaceClasses(draftFestival);

  const handleActivateSample = (sampleId: StoreUiSampleId) => {
    setActiveUiSample(sampleId);
    setJustAppliedId(sampleId);
    setTimeout(() => setJustAppliedId(null), 1800);
  };

  const handleApplyFestivalTheme = (themeToApply: FestivalThemeConfig, label?: string) => {
    updateFestivalTheme(themeToApply);
    setDraftFestival(themeToApply);
    setFestivalSavedToast(label || themeToApply.name || 'Theme updated live');
    setTimeout(() => setFestivalSavedToast(null), 2200);
  };

  const handleResetFestival = () => {
    resetFestivalTheme();
    setFestivalSavedToast(
      pickLang(lang, {
        en: 'Restored default classic freshness & logo',
        hi: 'डिफ़ॉल्ट फ्रेश लोगो और सामान्य थीम लागू हो गई',
        hinglish: 'Default fresh logo & normal theme restored',
      })
    );
    setTimeout(() => setFestivalSavedToast(null), 2200);
  };

  const sendAiPrompt = async (promptText?: string) => {
    const query = (promptText ?? aiInput).trim();
    if (!query || aiLoading) return;

    const userMsg: AiChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: query,
    };

    const nextHistory = [...aiMessages, userMsg];
    setAiMessages(nextHistory);
    if (!promptText) setAiInput('');
    setAiLoading(true);

    try {
      const res = await aiThemeApi.design({
        prompt: query,
        currentUiSample: activeUiSample,
        currentFestivalTheme: festivalTheme,
        history: nextHistory.slice(-6).map((m) => ({
          role: m.role,
          text: m.text,
        })),
      });

      const assistantMsg: AiChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: res.reply,
        recommendedUiSample: res.recommendedUiSample || null,
        festivalTheme: res.festivalTheme || null,
        applied: false,
      };
      setAiMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMessage =
        err instanceof Error && err.message
          ? err.message
          : 'AI Theme Studio request failed. Please verify admin sign-in and try again.';
      setAiMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: errMessage,
          error: true,
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiProposal = (msgId: string) => {
    const target = aiMessages.find((m) => m.id === msgId);
    if (!target) return;

    if (target.recommendedUiSample) {
      setActiveUiSample(target.recommendedUiSample);
    }
    if (target.festivalTheme) {
      updateFestivalTheme(target.festivalTheme);
      setDraftFestival(target.festivalTheme);
    }

    setAiMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m))
    );
  };

  const renderIcon = (icon: UiSampleDefinition['icon']) => {
    switch (icon) {
      case 'quick':
        return <Zap className="w-4 h-4 text-emerald-700" />;
      case 'boutique':
        return <Leaf className="w-4 h-4 text-amber-700" />;
      case 'hybrid':
        return <Smartphone className="w-4 h-4 text-teal-700" />;
      default:
        return <LayoutGrid className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[93vh] flex flex-col">
        {/* Studio Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900 flex flex-col gap-3 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <BrandLogo size="md" festivalTheme={festivalTheme} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Master Admin Exclusive Studio</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white truncate">
                  {pickLang(lang, {
                    en: 'Storefront UI Samples, Festival Themes & AI Logo Designer',
                    hi: 'UI सैंपल, त्यौहार थीम और AI लोगो स्टूडियो',
                    hinglish: 'UI Samples, Festival Themes & AI Logo Designer',
                  })}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close UI & Festival Studio"
              className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center shrink-0 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3 Studio Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('samples')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'samples'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>
                {pickLang(lang, {
                  en: 'UI Samples 1 · 2 · 3',
                  hi: 'UI सैंपल 1 · 2 · 3',
                  hinglish: 'UI Samples 1 · 2 · 3',
                })}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('festivals')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'festivals'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <CalendarHeart className="w-3.5 h-3.5" />
              <span>
                {pickLang(lang, {
                  en: 'Festivals, Special Days & App Logo',
                  hi: 'त्यौहार, विशेष दिन व लोगो',
                  hinglish: 'Festivals, Special Days & App Logo',
                })}
              </span>
              {festivalTheme.active && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-white/25 text-[10px] font-black">ON</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ai_designer')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'ai_designer'
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {pickLang(lang, {
                  en: 'AI Chat Theme & Logo Studio',
                  hi: 'AI बातचीत से थीम व लोगो बनाएं',
                  hinglish: 'AI Chat Theme & Logo Studio',
                })}
              </span>
            </button>
          </div>
        </div>

        {/* Toast confirmation inside modal */}
        {festivalSavedToast && (
          <div className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>{festivalSavedToast}</span>
          </div>
        )}

        {/* TAB 1: UI SAMPLES 1 · 2 · 3 · CLASSIC (Separate independent UI layout selection) */}
        {activeTab === 'samples' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/40 dark:bg-slate-950/30">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {UI_SAMPLE_DEFINITIONS.filter((s) => s.id !== 'classic').map((sample) => {
                const isActive = activeUiSample === sample.id;
                const isJustApplied = justAppliedId === sample.id;
                const hasImgErr = imgErrors[sample.id];

                return (
                  <div
                    key={sample.id}
                    className={`rounded-2xl bg-white dark:bg-slate-900 border-2 transition-all flex flex-col overflow-hidden shadow-sm hover:shadow-md ${
                      isActive
                        ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="relative bg-slate-100 aspect-[16/11] overflow-hidden group border-b border-slate-200 dark:border-slate-800">
                      {sample.image && !hasImgErr ? (
                        <img
                          src={sample.image}
                          alt={sample.title}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setImgErrors((prev) => ({ ...prev, [sample.id]: true }))
                          }
                          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-500 bg-slate-100">
                          <LayoutGrid className="w-8 h-8 mb-2 text-slate-400" />
                          <span className="text-xs font-semibold">{sample.title}</span>
                        </div>
                      )}

                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide border backdrop-blur-md shadow-sm ${sample.accentBg} ${sample.accentBorder} ${sample.accentText}`}
                        >
                          {sample.badge}
                        </span>
                        {isActive && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ACTIVE
                          </span>
                        )}
                      </div>

                      {sample.image && !hasImgErr && (
                        <button
                          type="button"
                          onClick={() => setZoomedSampleId(sample.id)}
                          className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-sm transition shadow-sm cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          Zoom Full Preview
                        </button>
                      )}
                    </div>

                    <div className="p-4 sm:p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-lg ${sample.accentBg} flex items-center justify-center shrink-0`}>
                          {renderIcon(sample.icon)}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                          {sample.title}
                        </h3>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                        {sample.subtitle}
                      </p>

                      <ul className="mt-3 space-y-1.5 flex-1">
                        {sample.highlights.map((pt, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 leading-snug"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleActivateSample(sample.id)}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {isJustApplied ? (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Activated Live!
                            </>
                          ) : isActive ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Active on Storefront
                            </>
                          ) : (
                            <>
                              Activate This UI Sample
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {(() => {
              const classic = UI_SAMPLE_DEFINITIONS.find((s) => s.id === 'classic')!;
              const isClassicActive = activeUiSample === 'classic';
              return (
                <div
                  className={`rounded-2xl bg-white dark:bg-slate-900 border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isClassicActive ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      <LayoutGrid className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {classic.badge}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{classic.title}</h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{classic.subtitle}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleActivateSample('classic')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                      isClassicActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {isClassicActive ? '✓ Classic Default Active' : 'Switch to Classic Default'}
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 2: FESTIVALS, SPECIAL DAYS & CUSTOM APP LOGO */}
        {activeTab === 'festivals' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/40 dark:bg-slate-950/30">
            {/* Live Preview Strip */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Live Storefront Capsule &amp; App Logo Preview
                </span>
                <div className="flex items-center gap-2">
                  {festivalTheme.active && (
                    <button
                      type="button"
                      onClick={handleResetFestival}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Normal Store</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Capsule Preview */}
              <div className={`rounded-2xl p-4 text-white flex items-center gap-3.5 ${draftFestival.active ? draftSurface.bannerBg : 'bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-950'}`}>
                <BrandLogo size="lg" festivalTheme={draftFestival} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {draftFestival.active && draftFestival.badgeText && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${draftSurface.badgeBg}`}>
                        {draftFestival.badgeText}
                      </span>
                    )}
                    <h4 className="font-display font-black text-base sm:text-lg truncate">
                      {draftFestival.active && draftFestival.bannerTitle
                        ? draftFestival.bannerTitle
                        : `${brand.brandName || 'ताज़ाMandi'} · APMC Vashi Direct`}
                    </h4>
                  </div>
                  <p className="text-xs text-white/85 truncate mt-0.5">
                    {draftFestival.active && draftFestival.bannerSubtitle
                      ? draftFestival.bannerSubtitle
                      : 'Zero cold-storage · 4:00 AM morning lot · Book before 11:00 PM cutoff'}
                  </p>
                </div>
              </div>
            </div>

            {/* 8 One-Click Festival & Special Day Presets */}
            <div className="space-y-2.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                1-Click Indian Festivals &amp; Special Days (Auto-Updates Banner + App Logo)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {FESTIVAL_THEME_PRESETS.map((preset) => {
                  const isCurrent = festivalTheme.active && festivalTheme.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyFestivalTheme(preset, `Activated ${preset.name}!`)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col gap-2.5 cursor-pointer ${
                        isCurrent
                          ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-2 ring-amber-400/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <BrandLogo size="sm" festivalTheme={preset} />
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                            LIVE
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {preset.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {preset.bannerTitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Editor for Admin Fine-Tuning */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-amber-600" />
                  <span>Custom Special Day Banner, Tone &amp; Logo Selector</span>
                </h4>
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftFestival.active}
                    onChange={(e) =>
                      setDraftFestival((prev) => ({ ...prev, active: e.target.checked }))
                    }
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span>Enable Festival Override</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Festival / Day Name
                  </label>
                  <input
                    type="text"
                    value={draftFestival.name}
                    onChange={(e) => setDraftFestival({ ...draftFestival, name: e.target.value })}
                    placeholder="e.g. Society Foundation Day"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Short Badge Label
                  </label>
                  <input
                    type="text"
                    value={draftFestival.badgeText}
                    onChange={(e) => setDraftFestival({ ...draftFestival, badgeText: e.target.value })}
                    placeholder="e.g. Special Offer"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Headline Title
                  </label>
                  <input
                    type="text"
                    value={draftFestival.bannerTitle}
                    onChange={(e) => setDraftFestival({ ...draftFestival, bannerTitle: e.target.value })}
                    placeholder="e.g. Shubh Deepavali Harvest"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Subtitle / Customer Message
                </label>
                <input
                  type="text"
                  value={draftFestival.bannerSubtitle}
                  onChange={(e) => setDraftFestival({ ...draftFestival, bannerSubtitle: e.target.value })}
                  placeholder="Describe festival greens, puja essentials or morning mandi harvest..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    Color Surface Tone
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SURFACE_TONES.map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => setDraftFestival({ ...draftFestival, surfaceTone: tone.id })}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                          draftFestival.surfaceTone === tone.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full border border-black/15 ${tone.swatch}`} />
                        <span>{tone.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    App Logo Variant
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {LOGO_PRESETS.filter((lp) => lp.id !== 'custom' || Boolean(draftFestival.customLogoSvg)).map((lp) => (
                      <button
                        key={lp.id}
                        type="button"
                        onClick={() => setDraftFestival({ ...draftFestival, logoPreset: lp.id })}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                          draftFestival.logoPreset === lp.id
                            ? 'border-amber-600 bg-amber-50 text-amber-950'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {lp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleApplyFestivalTheme({ ...draftFestival, active: true }, `Saved "${draftFestival.name}" live!`)}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save &amp; Publish Festival Theme Live</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONVERSATIONAL AI THEME & LOGO DESIGNER */}
        {activeTab === 'ai_designer' && (
          <div className="flex flex-col flex-1 min-h-[420px] max-h-[70vh] bg-slate-50/50 dark:bg-slate-950/40">
            {/* Quick Suggestion Prompts */}
            <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[11px] font-bold text-slate-500 shrink-0">Try:</span>
              {QUICK_AI_PROMPTS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={aiLoading}
                  onClick={() => sendAiPrompt(q)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {q.slice(0, 44)}...
                </button>
              ))}
            </div>

            {/* Chat Conversation Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {aiMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 text-xs leading-relaxed shadow-xs space-y-3 ${
                      msg.role === 'user'
                        ? 'bg-emerald-700 text-white'
                        : msg.error
                        ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {msg.error && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {/* Preview AI-generated UI Sample + Festival Theme + Custom Vector Logo */}
                    {(msg.recommendedUiSample || msg.festivalTheme) && (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3 space-y-3">
                        {msg.festivalTheme && (
                          <div className="flex items-center gap-3">
                            <BrandLogo size="md" festivalTheme={msg.festivalTheme} />
                            <div className="min-w-0 flex-1">
                              <div className="font-extrabold text-slate-900 dark:text-white truncate">
                                {msg.festivalTheme.name}{' '}
                                {msg.festivalTheme.badgeText ? `· ${msg.festivalTheme.badgeText}` : ''}
                              </div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                                {msg.festivalTheme.bannerTitle}
                              </div>
                              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                                {msg.festivalTheme.bannerSubtitle}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            {msg.recommendedUiSample ? `Layout: ${msg.recommendedUiSample}` : 'Theme Ready'}
                            {msg.festivalTheme?.logoPreset === 'custom' ? ' · Custom AI SVG Logo' : ''}
                          </div>
                          <button
                            type="button"
                            onClick={() => applyAiProposal(msg.id)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer ${
                              msg.applied
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {msg.applied
                                ? pickLang(lang, { en: 'Applied Live ✓', hi: 'लाइव लागू हो गया ✓', hinglish: 'Applied Live ✓' })
                                : pickLang(lang, { en: 'Apply to Live Storefront', hi: 'लाइव स्टोर पर लागू करें', hinglish: 'Apply to Live Store' })}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>
                      {pickLang(lang, {
                        en: 'Designing your storefront theme & vector logo...',
                        hi: 'आपके लिए नया थीम और लोगो डिज़ाइन तैयार हो रहा है...',
                        hinglish: 'Naya theme aur vector logo design ho raha hai...',
                      })}
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendAiPrompt();
              }}
              className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                disabled={aiLoading}
                placeholder={pickLang(lang, {
                  en: 'Describe festival, special day, colors, or logo change in Hindi, Hinglish, or English...',
                  hi: 'लिखें: जैसे "Ganesh Chaturthi theme aur tilak logo lagao" या "Quick-Mart UI karo"...',
                  hinglish: 'Likhein: jaise "Diwali theme & diya logo banao" ya "Holi special look lagao"...',
                })}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={aiLoading || !aiInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {pickLang(lang, { en: 'Design', hi: 'बनाएँ', hinglish: 'Design' })}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Fullscreen Zoom Modal for UI Samples */}
      {zoomedSample && zoomedSample.image && (
        <div
          className="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setZoomedSampleId(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {zoomedSample.badge}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold">{zoomedSample.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleActivateSample(zoomedSample.id);
                    setZoomedSampleId(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  {activeUiSample === zoomedSample.id ? '✓ Active Live' : 'Activate Sample'}
                </button>
                <button
                  type="button"
                  onClick={() => setZoomedSampleId(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-slate-100 max-h-[78vh] overflow-auto flex items-center justify-center p-2">
              <img
                src={zoomedSample.image}
                alt={zoomedSample.title}
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[74vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

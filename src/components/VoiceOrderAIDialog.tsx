import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { CustomerOrder } from '../types';
import { pickLang, resolveLocalizedProduceName } from '../utils/i18nHelper';
import { generateUpiQrCodeUrl, generateUpiUrl, OFFICIAL_UPI_CONFIG } from '../utils/billingUtils';
import { parseVoiceCommandFast, detectWakeWord, stripWakeWord, isSelfEchoTranscript } from '../utils/fastVoiceParser';
import {
  Mic,
  MicOff,
  Send,
  X,
  Volume2,
  VolumeX,
  Users,
  Sparkles,
  CheckCircle2,
  QrCode,
  Banknote,
  Plus,
  Trash2,
  ShieldCheck,
  ShoppingBag,
  RefreshCw,
  Bell,
  Zap,
  XCircle,
  Maximize2,
  SlidersHorizontal,
  Play,
  Truck,
  ArrowRight,
  Leaf,
} from 'lucide-react';

type MicSensitivityPreset = 'low_noise' | 'balanced' | 'high';
type PausePreset = 'fast' | 'normal' | 'relaxed';
type TtsVoicePersona = 'Aoede' | 'Kore' | 'Puck' | 'Fenrir';

interface VoiceTuningSettings {
  micSensitivity: MicSensitivityPreset;
  micGain: number; // 20 (noisy room / low mic sens) -> 95 (ultra sensitive whisper mode)
  pausePreset: PausePreset;
  pauseCommitMs: number; // 700 | 1300 | 2000
  ttsVoice: TtsVoicePersona;
  ttsRate: 0.9 | 1.0 | 1.15;
}

const DEFAULT_VOICE_TUNING: VoiceTuningSettings = {
  micSensitivity: 'balanced',
  micGain: 62,
  pausePreset: 'normal',
  pauseCommitMs: 1300,
  ttsVoice: 'Aoede',
  ttsRate: 1.0,
};

function computeAcousticGateParams(micGain: number): { minGate: number; floorMult: number; gainSpan: number } {
  const clamped = Math.min(95, Math.max(20, micGain));
  const t = (clamped - 20) / 75; // 0 = noisy/low sensitivity, 1 = ultra-sensitive
  return {
    minGate: Number((0.052 - t * 0.039).toFixed(4)), // 0.052 -> 0.013
    floorMult: Number((2.25 - t * 1.05).toFixed(2)), // 2.25 -> 1.20
    gainSpan: Number((0.18 - t * 0.09).toFixed(3)), // 0.18 -> 0.09
  };
}

// Generate an ultra-lightweight 1-second silent PCM WAV Blob URL so mobile OS (iOS Dynamic Island / Android Media Capsule)
// recognizes an active media session & keeps minimized background listening alive without any audible sound.
function createSilentWavObjectUrl(): string {
  const sampleRate = 8000;
  const numSamples = sampleRate;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

interface DialogMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  proactiveTip?: string;
  addedSummary?: string;
  confirmedOrder?: CustomerOrder;
  paymentMode?: 'upi_qr' | 'cod';
}

const SPEECH_LOCALE_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  hinglish: 'hi-IN',
  zh: 'zh-CN',
  es: 'es-ES',
  ar: 'ar-SA',
  fr: 'fr-FR',
  pt: 'pt-BR',
  ru: 'ru-RU',
  bn: 'bn-IN',
  ja: 'ja-JP',
  de: 'de-DE',
  mr: 'mr-IN',
  gu: 'gu-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  pa: 'pa-IN',
};

function getSeasonLabelForAI(date: Date): string {
  const m = date.getMonth() + 1;
  if (m >= 11 || m <= 2) {
    return 'Winter Harvest (Nov-Feb): Green Peas (Matar), Red Carrot (Gajar), Methi, Bathua, Mooli, Raw Haldi, Nagpur Oranges';
  }
  if (m >= 3 && m <= 6) {
    return 'Summer Cooling Harvest (Mar-Jun): Alphonso Mango, Watermelon, Muskmelon, Lauki, Cucumber, Kagzi Lemon, Bhindi';
  }
  return 'Monsoon Harvest (Jul-Oct): Sweet Corn, Sitaphal, Tinda, Parwal, Raw Jackfruit, Suran Yam';
}

export const VoiceOrderAIDialog: React.FC = () => {
  const {
    lang,
    setLang,
    user,
    produceList,
    accessoriesList,
    produceCart,
    accessoryCart,
    addProduceToCart,
    addAccessoryToCart,
    setProduceCartQty,
    removeProduceFromCart,
    setAccessoryCartQty,
    removeAccessoryFromCart,
    orders,
    placeOrder,
    confirmCurrentOrLastOrder,
    cancelOrder,
    clearAllCarts,
    familyPreferences,
    addFamilyPreference,
    removeFamilyPreference,
    voiceAutoOrderEnabled,
    setVoiceAutoOrderEnabled,
    voiceWakeWordEnabled,
    setVoiceWakeWordEnabled,
    customWakeName,
    setCustomWakeName,
    totalCartItemCount,
    setIsCartOpen,
    isFluidSoundActive,
    toggleFluidSound,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [showFamilyPanel, setShowFamilyPanel] = useState(false);
  const [showSensitivityPanel, setShowSensitivityPanel] = useState(false);
  const [voiceTuning, setVoiceTuning] = useState<VoiceTuningSettings>(() => {
    try {
      const saved = localStorage.getItem('tazamandi_voice_tuning_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_VOICE_TUNING, ...parsed };
      }
    } catch {}
    return DEFAULT_VOICE_TUNING;
  });
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isWakeActive, setIsWakeActive] = useState(false);
  const [isAwakeArmed, setIsAwakeArmed] = useState(false);
  const [wakeLiveCaption, setWakeLiveCaption] = useState('');
  const [lastGeminiFeedback, setLastGeminiFeedback] = useState('');
  const [isEditingWakeName, setIsEditingWakeName] = useState(false);
  const [wakeNameDraft, setWakeNameDraft] = useState(customWakeName);
  const [wakeBannerOrder, setWakeBannerOrder] = useState<CustomerOrder | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVoiceOutputOn, setIsVoiceOutputOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [selectedPayMode, setSelectedPayMode] = useState<'upi_qr' | 'cod'>('upi_qr');
  const [pendingConfirmFlag, setPendingConfirmFlag] = useState(false);
  const [speechUnsupported, setSpeechUnsupported] = useState(false);
  const [wakeNeedsPermission, setWakeNeedsPermission] = useState(false);
  const [geminiQuickInput, setGeminiQuickInput] = useState('');
  const [isPipOpen, setIsPipOpen] = useState(false);
  const [liveBasketDrop, setLiveBasketDrop] = useState<{ label: string; key: number } | null>(null);
  const [dispatchPulseStep, setDispatchPulseStep] = useState<number>(1);

  useEffect(() => {
    if (!liveBasketDrop) return;
    const t = setTimeout(() => setLiveBasketDrop(null), 3200);
    return () => clearTimeout(t);
  }, [liveBasketDrop]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDispatchPulseStep((prev) => (prev >= 4 ? 1 : prev + 1));
    }, 1150);
    return () => clearInterval(timer);
  }, []);

  const triggerBasketDropAnimation = useCallback((summary: string) => {
    if (!summary) return;
    setLiveBasketDrop({ label: summary, key: Date.now() });
  }, []);

  const supportsPip =
    typeof window !== 'undefined' && 'documentPictureInPicture' in window;

  const silentAudioUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    try {
      return createSilentWavObjectUrl();
    } catch {
      return '';
    }
  }, []);

  useEffect(() => {
    return () => {
      if (silentAudioUrl) {
        try {
          URL.revokeObjectURL(silentAudioUrl);
        } catch {}
      }
    };
  }, [silentAudioUrl]);

  const produceById = useMemo(() => {
    const map = new Map<string, (typeof produceList)[number]>();
    for (let i = 0; i < produceList.length; i++) {
      map.set(produceList[i].id, produceList[i]);
    }
    return map;
  }, [produceList]);

  const accessoryById = useMemo(() => {
    const map = new Map<string, (typeof accessoriesList)[number]>();
    for (let i = 0; i < accessoriesList.length; i++) {
      map.set(accessoriesList[i].id, accessoriesList[i]);
    }
    return map;
  }, [accessoriesList]);

  const liveCartTotal = useMemo(() => {
    let total = 0;
    for (const [id, qty] of Object.entries(produceCart)) {
      const p = produceById.get(id);
      if (p) {
        const rate = p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.pricePerKg;
        total += rate * qty;
      }
    }
    for (const [id, qty] of Object.entries(accessoryCart)) {
      const a = accessoryById.get(id);
      if (a) total += a.price * qty;
    }
    return Math.round(total);
  }, [produceCart, accessoryCart, produceById, accessoryById]);

  const aiSavingsSummary = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    let cartSaved = 0;
    let cartMarketCost = 0;
    Object.entries(produceCart).forEach(([id, kg]) => {
      const p = produceById.get(id);
      if (p && kg > 0) {
        const eff = p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.pricePerKg;
        const mkt = p.localMarketPricePerKg || Math.round(eff * 1.32);
        cartMarketCost += mkt * kg;
        cartSaved += Math.max(0, (mkt - eff) * kg);
      }
    });

    let daily = cartSaved;
    let monthly = cartSaved;
    let yearly = cartSaved;
    let totalAll = cartSaved;
    let totalMarketCost = cartMarketCost;

    orders.forEach((o) => {
      if (o.status === 'cancelled' || o.isSampleOrder) return;
      const t = new Date(o.orderedAt).getTime();
      let oSaved = 0;
      let oMkt = 0;
      o.produceItems.forEach((pi) => {
        const mkt = produceById.get(pi.produceId)?.localMarketPricePerKg || Math.round(pi.pricePerKg * 1.32);
        oMkt += mkt * pi.quantityKg;
        oSaved += Math.max(0, (mkt - pi.pricePerKg) * pi.quantityKg);
      });
      totalAll += oSaved;
      totalMarketCost += oMkt;
      if (!Number.isNaN(t)) {
        if (t >= startOfToday) daily += oSaved;
        if (t >= startOfMonth) monthly += oSaved;
        if (t >= startOfYear) yearly += oSaved;
      }
    });

    return {
      dailySavedRs: Math.round(daily),
      monthlySavedRs: Math.round(monthly),
      yearlySavedRs: Math.round(yearly),
      totalSavedTillDateRs: Math.round(totalAll),
      avoidedSpoilageLossRs: Math.round(totalMarketCost * 0.14),
    };
  }, [produceCart, orders, produceById]);

  // Precompute ultra-compact catalog & user context once so every streamed AI request knows EVERY available item
  const aiCatalogSummary = useMemo(
    () => [
      ...produceList
        .filter((p) => p.isAvailable !== false)
        .map(
          (p) =>
            `${p.id}|${p.name.en}|${p.name.hi}|${p.name.hinglish}|₹${
              p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.pricePerKg
            }/${p.pricingUnit || 'kg'}|produce`
        ),
      ...accessoriesList.map(
        (a) => `${a.id}|${a.name.en}|${a.name.hi}|₹${a.price}/pcs|accessory`
      ),
    ],
    [produceList, accessoriesList]
  );

  const aiFamilyContext = useMemo(
    () =>
      familyPreferences.map((fp) => ({
        relation: fp.relation,
        name: fp.name,
        favorites: fp.favoriteItemIds
          .map((id) => produceById.get(id)?.name.en)
          .filter(Boolean),
      })),
    [familyPreferences, produceById]
  );

  const aiRecentOrders = useMemo(
    () =>
      orders.slice(0, 4).map((o) => ({
        orderedAt: o.orderedAt,
        totalAmount: o.totalAmount,
        items: o.produceItems.map((i) => i.name.en),
      })),
    [orders]
  );

  // Family member form state
  const [famRelation, setFamRelation] = useState('Papa');
  const [famName, setFamName] = useState('');
  const [famFavItemIds, setFamFavItemIds] = useState<string[]>(['veg_okra']);

  const [messages, setMessages] = useState<DialogMessage[]>([]);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fallbackStopTimerRef = useRef<any>(null);
  const wakeRecRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);
  const awakeTimeoutRef = useRef<any>(null);
  const wakeInterimTimerRef = useRef<any>(null);
  const wakeErrorCountRef = useRef<number>(0);
  const consumedPrefixByIdxRef = useRef<Record<number, string>>({});
  const isAwakeArmedRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const wakeNeedsPermRef = useRef<boolean>(false);
  const isOpenRef = useRef<boolean>(false);
  const speakSafetyTimerRef = useRef<any>(null);
  const wakeRestartTimerRef = useRef<any>(null);
  const lastSpokenTextRef = useRef<string>('');
  const recentSpokenRef = useRef<Array<{ text: string; at: number }>>([]);
  const ttsCooldownUntilRef = useRef<number>(0);
  const isPausedForTtsRef = useRef<boolean>(false);
  const startWakeListenerRef = useRef<() => void>(() => {});
  const lastHandledQueryRef = useRef<{ text: string; at: number }>({ text: '', at: 0 });
  const keepAliveCtxRef = useRef<AudioContext | null>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const interimCommitTimerRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const dialogAbortRef = useRef<AbortController | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isStreamSpeechActiveRef = useRef<boolean>(false);
  const chimeCtxRef = useRef<AudioContext | null>(null);
  const lastChimeAtRef = useRef<number>(0);
  const voiceVisualRootRef = useRef<HTMLDivElement | null>(null);
  const isUserSpeakingRef = useRef<boolean>(false);
  const speechPulseUntilRef = useRef<number>(0);
  const analyserCtxRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const analyserStreamRef = useRef<MediaStream | null>(null);
  const analyserDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const analyserActiveRef = useRef<boolean>(false);
  const micPermGrantedRef = useRef<boolean>(false);
  const webSpeechProvenRef = useRef<boolean>(false);
  const speechStallCountRef = useRef<number>(0);
  const speechWatchdogRef = useRef<any>(null);
  const vadRafRef = useRef<number>(0);
  const vadCtxRef = useRef<AudioContext | null>(null);
  const ttsAudioCacheRef = useRef<Map<string, { base64: string; mimeType: string }>>(new Map());
  const ttsFetchPromisesRef = useRef<
    Map<string, Promise<{ base64: string; mimeType: string } | null>>
  >(new Map());
  const ttsGenerationIdRef = useRef<number>(0);
  const voiceTuningRef = useRef<VoiceTuningSettings>(voiceTuning);
  voiceTuningRef.current = voiceTuning;
  const [isFallbackRecording, setIsFallbackRecording] = useState(false);

  const updateVoiceTuning = useCallback((patch: Partial<VoiceTuningSettings>) => {
    setVoiceTuning((prev) => {
      const next = { ...prev, ...patch };
      voiceTuningRef.current = next;
      try {
        localStorage.setItem('tazamandi_voice_tuning_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  isAwakeArmedRef.current = isAwakeArmed;
  isSpeakingRef.current = isSpeaking;
  wakeNeedsPermRef.current = wakeNeedsPermission;
  isOpenRef.current = isOpen;

  useEffect(() => {
    return () => {
      dialogAbortRef.current?.abort();
      if (chimeCtxRef.current) {
        try {
          chimeCtxRef.current.close();
        } catch {}
        chimeCtxRef.current = null;
      }
    };
  }, []);
  useEffect(() => {
    setWakeNameDraft(customWakeName);
  }, [customWakeName]);

  // Whisper-soft tactile tap sound (ONLY for explicit manual taps, debounced, never on wake/restart loops)
  const playWakeActivationChime = useCallback(
    (isManualTap = false) => {
      if (!isManualTap || !isVoiceOutputOn || !isFluidSoundActive) return;
      const nowMs = Date.now();
      if (nowMs - lastChimeAtRef.current < 900) return;
      lastChimeAtRef.current = nowMs;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        if (!chimeCtxRef.current || chimeCtxRef.current.state === 'closed') {
          chimeCtxRef.current = new AudioCtx();
        }
        const ctx = chimeCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(470, now + 0.045);
        // Ultra-low subtle volume so it never irritates
        gain.gain.setValueAtTime(0.014, now);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.065);
      } catch {}
    },
    [isVoiceOutputOn, isFluidSoundActive]
  );

  // Real-time Voice Activity + Acoustic Wavelength Engine:
  // Combines hardware mic RMS (when permitted) + speech recognition cadence, suppressed during AI TTS & silent pauses
  useEffect(() => {
    const micEnabled =
      (isListening || (voiceWakeWordEnabled && isWakeActive)) && !wakeNeedsPermission;

    const resetVisuals = () => {
      const root = voiceVisualRootRef.current;
      if (root) {
        root.style.setProperty('--tm-voice-active', '0');
        root.style.setProperty('--tm-voice-lvl', '0');
        root.style.setProperty('--tm-b0', '0');
        root.style.setProperty('--tm-b1', '0');
        root.style.setProperty('--tm-b2', '0');
        root.style.setProperty('--tm-b3', '0');
        root.style.setProperty('--tm-b4', '0');
      }
      if (isUserSpeakingRef.current) {
        isUserSpeakingRef.current = false;
        setIsUserSpeaking(false);
      }
    };

    if (!micEnabled) {
      analyserActiveRef.current = false;
      speechPulseUntilRef.current = 0;
      if (analyserStreamRef.current) {
        try {
          analyserStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        analyserStreamRef.current = null;
      }
      if (analyserCtxRef.current) {
        try {
          analyserCtxRef.current.close();
        } catch {}
        analyserCtxRef.current = null;
        analyserNodeRef.current = null;
        analyserDataRef.current = null;
      }
      resetVisuals();
      return;
    }

    let stopped = false;
    let rafId = 0;
    let noiseFloor = 0.018;
    let smoothed = 0;
    let lastLoudAt = 0;
    let lastPaintAt = 0;

    // Release any stale secondary stream when Web Speech runs so Chrome/Android never hits dual-stream mic lock;
    // when MediaRecorder fallback runs, analyserNodeRef is fed directly from that single stream!
    if (!isFallbackRecording) {
      analyserActiveRef.current = false;
      if (analyserStreamRef.current) {
        try {
          analyserStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        analyserStreamRef.current = null;
      }
      if (analyserCtxRef.current) {
        try {
          analyserCtxRef.current.close();
        } catch {}
        analyserCtxRef.current = null;
        analyserNodeRef.current = null;
        analyserDataRef.current = null;
      }
    }

    const tick = (ts: number) => {
      if (stopped) return;
      rafId = requestAnimationFrame(tick);
      // Throttle DOM CSS var writes cleanly (~24fps) to stay featherlight on mobile CPUs
      if (ts - lastPaintAt < 40) return;
      lastPaintAt = ts;

      const now = Date.now();
      // Never animate user waveform while AI speaker audio or cooldown is active
      if (isSpeakingRef.current || isPausedForTtsRef.current || now < ttsCooldownUntilRef.current) {
        smoothed = 0;
        speechPulseUntilRef.current = 0;
        resetVisuals();
        return;
      }

      let acousticEnergy = 0;
      let rmsPct = 0;
      let gatePct = 22;
      const { minGate, floorMult, gainSpan } = computeAcousticGateParams(voiceTuningRef.current.micGain);
      const analyser = analyserNodeRef.current;
      const dataBuf = analyserDataRef.current;
      if (analyser && dataBuf && analyserActiveRef.current) {
        try {
          analyser.getByteTimeDomainData(dataBuf);
          let sumSq = 0;
          for (let i = 0; i < dataBuf.length; i++) {
            const norm = (dataBuf[i] - 128) / 128;
            sumSq += norm * norm;
          }
          const rms = Math.sqrt(sumSq / dataBuf.length);
          if (rms < noiseFloor * 1.45) {
            noiseFloor = noiseFloor * 0.96 + rms * 0.04;
          }
          const gate = Math.max(minGate, noiseFloor * floorMult);
          acousticEnergy = rms > gate ? Math.min(1, (rms - gate) / gainSpan) : 0;
          rmsPct = Math.min(100, Math.round(rms * 580));
          gatePct = Math.min(92, Math.max(8, Math.round(gate * 580)));
        } catch {}
      } else if (speechPulseUntilRef.current - now > 0) {
        rmsPct = 58;
        gatePct = Math.min(92, Math.max(8, Math.round(minGate * 580)));
      }

      if (voiceVisualRootRef.current) {
        voiceVisualRootRef.current.style.setProperty('--tm-meter-pct', `${rmsPct}%`);
        voiceVisualRootRef.current.style.setProperty('--tm-gate-pct', `${gatePct}%`);
      }

      const speechPulseRemaining = speechPulseUntilRef.current - now;
      const speechEventEnergy =
        speechPulseRemaining > 0
          ? 0.42 + 0.34 * Math.abs(Math.sin(now / 115))
          : 0;

      const rawTarget = analyserActiveRef.current
        ? Math.max(acousticEnergy, speechEventEnergy > 0 && acousticEnergy > 0.03 ? speechEventEnergy : 0)
        : speechEventEnergy;

      // Fast attack when speaking, quick clean release when silent
      smoothed = rawTarget > smoothed ? smoothed * 0.35 + rawTarget * 0.65 : smoothed * 0.55 + rawTarget * 0.45;
      if (smoothed < 0.025) smoothed = 0;

      if (smoothed > 0.12) {
        lastLoudAt = now;
      }

      const speakingNow = smoothed > 0.12 || now - lastLoudAt < 260;
      if (speakingNow !== isUserSpeakingRef.current) {
        isUserSpeakingRef.current = speakingNow;
        setIsUserSpeaking(speakingNow);
      }

      const root = voiceVisualRootRef.current;
      if (root) {
        if (!speakingNow || smoothed <= 0.01) {
          root.style.setProperty('--tm-voice-active', '0');
          root.style.setProperty('--tm-voice-lvl', '0');
          root.style.setProperty('--tm-b0', '0');
          root.style.setProperty('--tm-b1', '0');
          root.style.setProperty('--tm-b2', '0');
          root.style.setProperty('--tm-b3', '0');
          root.style.setProperty('--tm-b4', '0');
        } else {
          const p = now / 95;
          const b0 = Math.min(1, smoothed * (0.65 + 0.35 * Math.abs(Math.sin(p))));
          const b1 = Math.min(1, smoothed * (0.75 + 0.25 * Math.abs(Math.sin(p + 1.1))));
          const b2 = Math.min(1, smoothed * (0.85 + 0.15 * Math.abs(Math.sin(p + 2.2))));
          const b3 = Math.min(1, smoothed * (0.72 + 0.28 * Math.abs(Math.sin(p + 3.3))));
          const b4 = Math.min(1, smoothed * (0.60 + 0.40 * Math.abs(Math.sin(p + 4.4))));
          root.style.setProperty('--tm-voice-active', '1');
          root.style.setProperty('--tm-voice-lvl', smoothed.toFixed(3));
          root.style.setProperty('--tm-b0', b0.toFixed(3));
          root.style.setProperty('--tm-b1', b1.toFixed(3));
          root.style.setProperty('--tm-b2', b2.toFixed(3));
          root.style.setProperty('--tm-b3', b3.toFixed(3));
          root.style.setProperty('--tm-b4', b4.toFixed(3));
        }
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
    };
  }, [isListening, isFallbackRecording, voiceWakeWordEnabled, isWakeActive, wakeNeedsPermission]);

  const armActiveCommandWindow = useCallback(() => {
    setIsAwakeArmed(true);
    isAwakeArmedRef.current = true;
    if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
    awakeTimeoutRef.current = setTimeout(() => {
      setIsAwakeArmed(false);
      isAwakeArmedRef.current = false;
      setWakeLiveCaption('');
      setLastGeminiFeedback('');
    }, 60000);
  }, []);

  const currentSeasonLabel = useMemo(() => getSeasonLabelForAI(new Date()), []);

  // Build dynamic proactive greeting when dialog opens for the first time
  useEffect(() => {
    if (!isOpen || messages.length > 0) return;

    const firstFam = familyPreferences[0];
    const lastOrder = orders[0];
    let greeting = pickLang(lang, {
      en: 'Namaste! Tell me what vegetables, fruits or tech gear you need today — just speak or tap a suggestion.',
      hi: 'नमस्ते! आज क्या सब्ज़ी, फल या मोबाइल सामान मंगवाना है? बस बोलिए या लिखिए — मैं आपकी थैली में जोड़ दूँगा।',
      mr: 'नमस्कार! आज कोणत्या भाज्या, फळे किंवा मोबाईल साहित्य हवे आहे? फक्त बोला किंवा लिहा.',
      hinglish: 'Namaste! Aaj kya sabzi, fruits ya tech item mangwana hai? Bas boliye ya type karein.',
    });

    let tip = '';
    if (firstFam && firstFam.favoriteItemIds.length > 0) {
      const favProd = produceById.get(firstFam.favoriteItemIds[0]);
      if (favProd) {
        const favName = resolveLocalizedProduceName(favProd.name, lang, favProd.id);
        tip = pickLang(lang, {
          en: `${firstFam.relation} loves ${favName} — add 1 kg to today's batch?`,
          hi: `${firstFam.relation} (${firstFam.name || firstFam.relation}) को ${favName} पसंद है — क्या आज के ऑर्डर में जोड़ दूँ?`,
          mr: `${firstFam.relation} यांना ${favName} आवडते — आजच्या ऑर्डरमध्ये जोडू का?`,
          hinglish: `${firstFam.relation} ko ${favName} pasand hai — kya aaj ke batch me add kar doon?`,
        });
      }
    } else if (lastOrder && lastOrder.produceItems.length > 0) {
      const prevName = resolveLocalizedProduceName(lastOrder.produceItems[0].name, lang, lastOrder.produceItems[0].produceId);
      tip = pickLang(lang, {
        en: `Last time you ordered ${prevName}. Want a fresh refill or a new seasonal combo?`,
        hi: `पिछली बार आपने ${prevName} मंगवाया था — ताज़ा रिपीट करें या मौसमी लॉट देखें?`,
        mr: `मागील वेळी तुम्ही ${prevName} मागवले होते — पुन्हा जोडू का?`,
        hinglish: `Pichli baar aapne ${prevName} mangwaya tha — repeat karein?`,
      });
    } else {
      tip = pickLang(lang, {
        en: 'Tip: You can add Papa/Mummy/Kids favorites in "Family" so I remind you automatically!',
        hi: 'सुझाव: ऊपर "परिवार" बटन में मम्मी-पापा की पसंद सेव करें, ताकि मैं समय पर याद दिला सकूँ!',
        mr: 'टिप: कुटुंबातील सदस्यांच्या आवडी सेव्ह करा जेणेकरून मला वेळेवर सुचवता येईल!',
        hinglish: 'Tip: Upar "Family" me Papa/Mummy ki pasand save karein!',
      });
    }

    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: greeting,
        proactiveTip: tip,
      },
    ]);
  }, [isOpen, messages.length, familyPreferences, orders, lang, produceById]);

  useEffect(() => {
    if (!isOpen) return;
    scrollEndRef.current?.scrollIntoView({ behavior: isSending ? 'auto' : 'smooth' });
  }, [isOpen, messages.length, isSending, pendingConfirmFlag]);

  const pauseMicsForSpeech = useCallback(() => {
    if (wakeRestartTimerRef.current) {
      clearTimeout(wakeRestartTimerRef.current);
      wakeRestartTimerRef.current = null;
    }
    if (wakeInterimTimerRef.current) {
      clearTimeout(wakeInterimTimerRef.current);
      wakeInterimTimerRef.current = null;
    }
    if (speechWatchdogRef.current) {
      clearTimeout(speechWatchdogRef.current);
      speechWatchdogRef.current = null;
    }
    if (interimCommitTimerRef.current) {
      clearTimeout(interimCommitTimerRef.current);
      interimCommitTimerRef.current = null;
    }
    if (wakeRecRef.current) {
      try {
        wakeRecRef.current.onend = null;
        wakeRecRef.current.onresult = null;
        wakeRecRef.current.abort();
      } catch {}
      wakeRecRef.current = null;
      setIsWakeActive(false);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  const pickBestNaturalBrowserVoice = useCallback((locale: string): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    try {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return null;
      const targetPrefix = locale.split('-')[0].toLowerCase();
      const scored = voices
        .map((v) => {
          let score = 0;
          const vLang = (v.lang || '').toLowerCase();
          const vName = (v.name || '').toLowerCase();
          if (vLang === locale.toLowerCase()) score += 50;
          else if (vLang.startsWith(targetPrefix)) score += 30;
          else if (vLang.includes('-in')) score += 20;
          if (/natural|neural|google|swara|madhur|heera|lekha|samantha|aria|premium|enhanced/i.test(vName)) {
            score += 40;
          }
          if (!v.localService) score += 10;
          return { v, score };
        })
        .sort((a, b) => b.score - a.score);
      return scored[0]?.score > 0 ? scored[0].v : null;
    } catch {
      return null;
    }
  }, []);

  const pickBestTranscriptAlternative = useCallback((resultObj: any): string => {
    if (!resultObj || !resultObj.length) return '';
    let bestText = (resultObj[0]?.transcript || '').trim();
    let bestScore = typeof resultObj[0]?.confidence === 'number' ? resultObj[0].confidence : 0.8;
    for (let k = 1; k < resultObj.length; k++) {
      const cand = (resultObj[k]?.transcript || '').trim();
      const conf = typeof resultObj[k]?.confidence === 'number' ? resultObj[k].confidence : 0;
      if (cand && conf > bestScore + 0.04) {
        bestScore = conf;
        bestText = cand;
      }
    }
    return bestText;
  }, []);

  const fetchNaturalTtsAudio = useCallback(
    async (
      rawText: string,
      targetLang: string
    ): Promise<{ base64: string; mimeType: string } | null> => {
      const clean = rawText.normalize('NFC').replace(/[*_`#]/g, '').trim();
      if (!clean) return null;
      const activeTuning = voiceTuningRef.current;
      const pace =
        activeTuning.ttsRate <= 0.92
          ? 'slow'
          : activeTuning.ttsRate >= 1.1
          ? 'fast'
          : 'normal';
      const voiceName = activeTuning.ttsVoice || 'Aoede';
      const cacheKey = `${targetLang}:${voiceName}:${pace}:${clean}`;
      const cached = ttsAudioCacheRef.current.get(cacheKey);
      if (cached) return cached;

      const inflight = ttsFetchPromisesRef.current.get(cacheKey);
      if (inflight) return inflight;

      const fetchPromise = (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5500);
          const res = await fetch('/api/ai/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: clean,
              lang: targetLang,
              voiceName,
              pace,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          const data = await res.json();
          if (res.ok && data?.success && data?.audioBase64) {
            const hit = {
              base64: String(data.audioBase64),
              mimeType: String(data.mimeType || 'audio/wav'),
            };
            if (ttsAudioCacheRef.current.size > 40) {
              const firstKey = ttsAudioCacheRef.current.keys().next().value;
              if (firstKey) ttsAudioCacheRef.current.delete(firstKey);
            }
            ttsAudioCacheRef.current.set(cacheKey, hit);
            return hit;
          }
          return null;
        } catch {
          return null;
        } finally {
          ttsFetchPromisesRef.current.delete(cacheKey);
        }
      })();

      ttsFetchPromisesRef.current.set(cacheKey, fetchPromise);
      return fetchPromise;
    },
    []
  );

  const stopSpeakingNow = useCallback(
    (interruptForUser = false) => {
      ttsGenerationIdRef.current += 1;
      speechQueueRef.current = [];
      isStreamSpeechActiveRef.current = false;
      if (interruptForUser) {
        dialogAbortRef.current?.abort();
      }
      if (speakSafetyTimerRef.current) {
        clearTimeout(speakSafetyTimerRef.current);
        speakSafetyTimerRef.current = null;
      }
      if (wakeRestartTimerRef.current) {
        clearTimeout(wakeRestartTimerRef.current);
        wakeRestartTimerRef.current = null;
      }
      if (activeAudioRef.current) {
        try {
          activeAudioRef.current.onended = null;
          activeAudioRef.current.onerror = null;
          activeAudioRef.current.pause();
        } catch {}
        activeAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      isSpeakingRef.current = false;
      setIsSpeaking(false);

      if (interruptForUser) {
        isPausedForTtsRef.current = false;
        ttsCooldownUntilRef.current = 0;
        consumedPrefixByIdxRef.current = {};
      } else {
        // Tightened acoustic reverb cooldown: keeps echo blocked while resuming continuous mic cleanly
        ttsCooldownUntilRef.current = Date.now() + 450;
        wakeRestartTimerRef.current = setTimeout(() => {
          isPausedForTtsRef.current = false;
          consumedPrefixByIdxRef.current = {};
          startWakeListenerRef.current();
        }, 480);
      }
    },
    []
  );

  // Instant streaming sentence queue using Gemini Natural Human TTS (with prefetch + neural browser fallback)
  const speakNextQueuedSentence = useCallback(async () => {
    const nextChunk = speechQueueRef.current.shift();
    if (!nextChunk) {
      isStreamSpeechActiveRef.current = false;
      stopSpeakingNow(false);
      return;
    }

    const now = Date.now();
    const cleanChunk = nextChunk.normalize('NFC').replace(/[*_`#]/g, '').trim();
    if (!cleanChunk) {
      speakNextQueuedSentence();
      return;
    }

    const myGen = ++ttsGenerationIdRef.current;

    lastSpokenTextRef.current = cleanChunk.toLowerCase();
    recentSpokenRef.current = [
      ...recentSpokenRef.current.filter((e) => now - e.at < 25000),
      { text: cleanChunk, at: now },
    ];

    isPausedForTtsRef.current = true;
    isSpeakingRef.current = true;
    isStreamSpeechActiveRef.current = true;
    setIsSpeaking(true);
    ttsCooldownUntilRef.current = now + 20000;

    if (speakSafetyTimerRef.current) clearTimeout(speakSafetyTimerRef.current);
    const safetyMs = Math.min(18000, Math.max(4500, cleanChunk.length * 140));
    speakSafetyTimerRef.current = setTimeout(() => {
      if (ttsGenerationIdRef.current === myGen) {
        speakNextQueuedSentence();
      }
    }, safetyMs);

    // Prefetch next queued sentence immediately while this one fetches/plays
    const upcoming = speechQueueRef.current[0];
    if (upcoming) {
      fetchNaturalTtsAudio(upcoming, lang).catch(() => {});
    }

    const audioHit = await fetchNaturalTtsAudio(cleanChunk, lang);
    if (ttsGenerationIdRef.current !== myGen || !isVoiceOutputOn) {
      return;
    }

    if (audioHit?.base64) {
      try {
        const audio = new Audio(`data:${audioHit.mimeType || 'audio/wav'};base64,${audioHit.base64}`);
        audio.playbackRate = voiceTuningRef.current.ttsRate || 1.0;
        activeAudioRef.current = audio;
        const advanceQueue = () => {
          if (ttsGenerationIdRef.current !== myGen) return;
          activeAudioRef.current = null;
          if (speechQueueRef.current.length > 0) {
            speakNextQueuedSentence();
          } else {
            isStreamSpeechActiveRef.current = false;
            stopSpeakingNow(false);
          }
        };
        audio.onended = advanceQueue;
        audio.onerror = advanceQueue;
        await audio.play();
        return;
      } catch {
        activeAudioRef.current = null;
      }
    }

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const locale = SPEECH_LOCALE_MAP[lang] || 'hi-IN';
        const utter = new SpeechSynthesisUtterance(cleanChunk);
        utter.lang = locale;
        const naturalVoice = pickBestNaturalBrowserVoice(locale);
        if (naturalVoice) utter.voice = naturalVoice;
        utter.rate = voiceTuningRef.current.ttsRate || 0.96;
        utter.pitch = 1.02;
        utter.onend = () => {
          if (ttsGenerationIdRef.current !== myGen) return;
          if (speechQueueRef.current.length > 0) {
            speakNextQueuedSentence();
          } else {
            isStreamSpeechActiveRef.current = false;
            stopSpeakingNow(false);
          }
        };
        utter.onerror = () => {
          if (ttsGenerationIdRef.current !== myGen) return;
          isStreamSpeechActiveRef.current = false;
          stopSpeakingNow(false);
        };
        window.speechSynthesis.speak(utter);
        return;
      }
    } catch {}
    isStreamSpeechActiveRef.current = false;
    stopSpeakingNow(false);
  }, [lang, isVoiceOutputOn, fetchNaturalTtsAudio, pickBestNaturalBrowserVoice, stopSpeakingNow]);

  const enqueueSpeechChunk = useCallback(
    (sentence: string, resetQueue = false) => {
      if (!isVoiceOutputOn) return;
      const trimmed = sentence.normalize('NFC').replace(/[*_`#]/g, '').trim();
      if (!trimmed) return;

      if (resetQueue) {
        ttsGenerationIdRef.current += 1;
        speechQueueRef.current = [];
        isStreamSpeechActiveRef.current = false;
        if (activeAudioRef.current) {
          try {
            activeAudioRef.current.onended = null;
            activeAudioRef.current.onerror = null;
            activeAudioRef.current.pause();
          } catch {}
          activeAudioRef.current = null;
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
          } catch {}
        }
      }

      // Warm TTS cache immediately in background even while previous sentence speaks
      fetchNaturalTtsAudio(trimmed, lang).catch(() => {});
      speechQueueRef.current.push(trimmed);

      if (!isStreamSpeechActiveRef.current) {
        isPausedForTtsRef.current = true;
        pauseMicsForSpeech();
        speakNextQueuedSentence();
      }
    },
    [isVoiceOutputOn, lang, fetchNaturalTtsAudio, pauseMicsForSpeech, speakNextQueuedSentence]
  );

  // Half-duplex Natural Voice Synthesis: aborts active mic buffers while assistant speaks so TTS audio NEVER loops back
  const speakResponse = useCallback(
    async (spokenText: string, instantMode = false) => {
      if (!isVoiceOutputOn || !spokenText.trim()) return;

      const myGen = ++ttsGenerationIdRef.current;
      speechQueueRef.current = [];
      isStreamSpeechActiveRef.current = false;

      // Cancel previous audio immediately without scheduling cooldown restart yet
      if (speakSafetyTimerRef.current) {
        clearTimeout(speakSafetyTimerRef.current);
        speakSafetyTimerRef.current = null;
      }
      if (activeAudioRef.current) {
        try {
          activeAudioRef.current.onended = null;
          activeAudioRef.current.onerror = null;
          activeAudioRef.current.pause();
        } catch {}
        activeAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }

      const now = Date.now();
      const trimmedSpoken = spokenText.normalize('NFC').replace(/[*_`#]/g, '').trim();
      lastSpokenTextRef.current = trimmedSpoken.toLowerCase();
      recentSpokenRef.current = [
        ...recentSpokenRef.current.filter((e) => now - e.at < 25000),
        { text: trimmedSpoken, at: now },
      ];

      // Physically abort active SpeechRecognition instances BEFORE playing TTS sound
      isPausedForTtsRef.current = true;
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      ttsCooldownUntilRef.current = now + 20000;
      pauseMicsForSpeech();

      // Safety failsafe scaled to natural human voice duration
      const safetyMs = Math.min(18000, Math.max(4500, trimmedSpoken.length * 140));
      speakSafetyTimerRef.current = setTimeout(() => {
        if (ttsGenerationIdRef.current === myGen) {
          stopSpeakingNow(false);
        }
      }, safetyMs);

      if (!instantMode) {
        const audioHit = await fetchNaturalTtsAudio(trimmedSpoken, lang);
        if (ttsGenerationIdRef.current !== myGen || !isVoiceOutputOn) {
          return;
        }
        if (audioHit?.base64) {
          try {
            const audio = new Audio(`data:${audioHit.mimeType || 'audio/wav'};base64,${audioHit.base64}`);
            audio.playbackRate = voiceTuningRef.current.ttsRate || 1.0;
            activeAudioRef.current = audio;
            audio.onended = () => {
              if (ttsGenerationIdRef.current === myGen) stopSpeakingNow(false);
            };
            audio.onerror = () => {
              if (ttsGenerationIdRef.current === myGen) stopSpeakingNow(false);
            };
            await audio.play();
            return;
          } catch {
            activeAudioRef.current = null;
          }
        }
      }

      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const locale = SPEECH_LOCALE_MAP[lang] || 'hi-IN';
          const utter = new SpeechSynthesisUtterance(trimmedSpoken);
          utter.lang = locale;
          const naturalVoice = pickBestNaturalBrowserVoice(locale);
          if (naturalVoice) utter.voice = naturalVoice;
          utter.rate = voiceTuningRef.current.ttsRate || 0.96;
          utter.pitch = 1.02;
          utter.onend = () => {
            if (ttsGenerationIdRef.current === myGen) stopSpeakingNow(false);
          };
          utter.onerror = () => {
            if (ttsGenerationIdRef.current === myGen) stopSpeakingNow(false);
          };
          window.speechSynthesis.speak(utter);
          return;
        }
      } catch {}
      stopSpeakingNow(false);
    },
    [
      isVoiceOutputOn,
      lang,
      fetchNaturalTtsAudio,
      pickBestNaturalBrowserVoice,
      pauseMicsForSpeech,
      stopSpeakingNow,
    ]
  );

  // One-Phrase Instant Order Confirm handler (used by dialog, wake word, and notification quick actions)
  const executeInstantConfirm = useCallback(
    (payMode: 'upi_qr' | 'cod', isWakeTriggered = false): CustomerOrder | null => {
      const placed = confirmCurrentOrLastOrder(payMode);
      if (!placed) {
        const emptyMsg = pickLang(lang, {
          en: 'Your cart is empty and there is no previous order to repeat yet. Please add an item first.',
          hi: 'आपकी थैली खाली है और कोई पिछला ऑर्डर नहीं मिला। पहले कोई सब्ज़ी या आइटम जोड़ें।',
          mr: 'तुमची बॅग रिकामी आहे. कृपया आधी वस्तू जोडा.',
          hinglish: 'Aapki thaili khali hai aur pichla order nahi mila. Pehle koi item add karein.',
        });
        setMessages((prev) => [...prev, { id: `emp_${Date.now()}`, role: 'assistant', text: emptyMsg }]);
        speakResponse(emptyMsg, false);
        return null;
      }

      setPendingConfirmFlag(false);
      if (isWakeTriggered) {
        setWakeBannerOrder(placed);
      }

      const confirmText =
        payMode === 'upi_qr'
          ? pickLang(lang, {
              en: `Order #${placed.id} confirmed! Total ₹${placed.totalAmount}. Scan Kotak UPI QR below.`,
              hi: `ताज़ा मंडी ऑर्डर #${placed.id} कन्फ़र्म हो गया! कुल ₹${placed.totalAmount}। नीचे Kotak UPI QR से भुगतान करें।`,
              mr: `ऑर्डर #${placed.id} कन्फर्म झाली! एकूण ₹${placed.totalAmount}.`,
              hinglish: `Order #${placed.id} confirm ho gaya! Total ₹${placed.totalAmount}.`,
            })
          : pickLang(lang, {
              en: `Order #${placed.id} confirmed! Total ₹${placed.totalAmount} (Cash on Delivery).`,
              hi: `ताज़ा मंडी ऑर्डर #${placed.id} कन्फ़र्म हो गया! कुल ₹${placed.totalAmount} (कैश ऑन डिलीवरी)।`,
              mr: `ऑर्डर #${placed.id} कन्फर्म झाली! एकूण ₹${placed.totalAmount} (COD).`,
              hinglish: `Order #${placed.id} confirm ho gaya! Total ₹${placed.totalAmount} COD par.`,
            });

      setMessages((prev) => [
        ...prev,
        {
          id: `ord_${Date.now()}`,
          role: 'assistant',
          text: confirmText,
          confirmedOrder: placed,
          paymentMode: payMode,
        },
      ]);
      speakResponse(
        pickLang(lang, {
          en: `Order ${placed.id} confirmed for rupees ${placed.totalAmount}`,
          hi: `ताज़ा मंडी ऑर्डर कन्फ़र्म हो गया, कुल ${placed.totalAmount} रुपये`,
          mr: `ताजा मंडी ऑर्डर कन्फर्म झाली, एकूण ${placed.totalAmount} रुपये`,
          hinglish: `Taaza Mandi order confirm ho gaya, total ${placed.totalAmount} rupees`,
        }),
        false
      );
      return placed;
    },
    [confirmCurrentOrLastOrder, lang, speakResponse]
  );

  const executeInstantConfirmRef = useRef(executeInstantConfirm);
  executeInstantConfirmRef.current = executeInstantConfirm;
  const selectedPayModeRef = useRef(selectedPayMode);
  selectedPayModeRef.current = selectedPayMode;

  const stopMediaRecorderFallback = useCallback(() => {
    if (fallbackStopTimerRef.current) {
      clearTimeout(fallbackStopTimerRef.current);
      fallbackStopTimerRef.current = null;
    }
    if (vadRafRef.current) {
      cancelAnimationFrame(vadRafRef.current);
      vadRafRef.current = 0;
    }
    if (vadCtxRef.current) {
      try {
        vadCtxRef.current.close();
      } catch {}
      vadCtxRef.current = null;
    }
    analyserActiveRef.current = false;
    analyserNodeRef.current = null;
    analyserDataRef.current = null;
    setIsFallbackRecording(false);
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch {}
    mediaRecorderRef.current = null;
  }, []);

  // Layer-2 Resilient Audio + Live RMS VAD Engine: Works cleanly inside Preview iframes & every browser!
  const startMediaRecorderFallback = useCallback(async () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        setSpeechUnsupported(true);
        setTimeout(() => setSpeechUnsupported(false), 3500);
        return;
      }

      // Ensure Web Speech recognizers are stopped cleanly so mic is 100% free
      if (wakeRecRef.current) {
        try {
          wakeRecRef.current.onend = null;
          wakeRecRef.current.abort();
        } catch {}
        wakeRecRef.current = null;
        setIsWakeActive(false);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      micPermGrantedRef.current = true;
      mediaStreamRef.current = stream;

      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      const chosenMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
      const recorder = chosenMime
        ? new MediaRecorder(stream, { mimeType: chosenMime })
        : new MediaRecorder(stream);

      const chunks: BlobPart[] = [];
      mediaRecorderRef.current = recorder;
      setIsListening(true);
      setIsFallbackRecording(true);
      setSpeechUnsupported(false);

      const fallbackHint = pickLang(lang, {
        en: 'Listening... speak clearly & pause (or tap Send)',
        hi: '🎙️ सुन रहा हूँ — बोलकर रुकें (या "भेजें" दबाएँ)...',
        mr: '🎙️ ऐकत आहे — बोलून थांबा (किंवा पाठवा दाबा)...',
      });
      setWakeLiveCaption(fallbackHint);
      setLastGeminiFeedback('');

      // Attach live AudioContext AnalyserNode directly to THIS single stream for real waveform + silence-end VAD
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.55;
          src.connect(analyser);
          const dataBuf = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
          vadCtxRef.current = ctx;
          analyserNodeRef.current = analyser;
          analyserDataRef.current = dataBuf;
          analyserActiveRef.current = true;

          let noiseFloor = 0.016;
          let heardSpeech = false;
          let lastSpeechAt = Date.now();
          const startedAt = Date.now();

          const monitorVad = () => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
              return;
            }
            analyser.getByteTimeDomainData(dataBuf);
            let sumSq = 0;
            for (let i = 0; i < dataBuf.length; i++) {
              const norm = (dataBuf[i] - 128) / 128;
              sumSq += norm * norm;
            }
            const rms = Math.sqrt(sumSq / dataBuf.length);
            if (!heardSpeech && rms < noiseFloor * 1.4) {
              noiseFloor = noiseFloor * 0.94 + rms * 0.06;
            }
            const { minGate, floorMult } = computeAcousticGateParams(voiceTuningRef.current.micGain);
            const threshold = Math.max(minGate, noiseFloor * floorMult);
            const now = Date.now();
            const dynamicPauseMs = voiceTuningRef.current.pauseCommitMs + 150;
            if (rms > threshold) {
              heardSpeech = true;
              lastSpeechAt = now;
              speechPulseUntilRef.current = now + 260;
            } else if (heardSpeech && now - lastSpeechAt >= dynamicPauseMs && now - startedAt >= 1100) {
              // User finished speaking full sentence cleanly -> transcribe via Gboard-grade Gemini STT!
              stopMediaRecorderFallback();
              return;
            }
            vadRafRef.current = requestAnimationFrame(monitorVad);
          };
          vadRafRef.current = requestAnimationFrame(monitorVad);
        }
      } catch {}

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };

      recorder.onstop = async () => {
        if (fallbackStopTimerRef.current) {
          clearTimeout(fallbackStopTimerRef.current);
          fallbackStopTimerRef.current = null;
        }
        if (vadRafRef.current) {
          cancelAnimationFrame(vadRafRef.current);
          vadRafRef.current = 0;
        }
        if (vadCtxRef.current) {
          try {
            vadCtxRef.current.close();
          } catch {}
          vadCtxRef.current = null;
        }
        analyserActiveRef.current = false;
        analyserNodeRef.current = null;
        analyserDataRef.current = null;
        setIsFallbackRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsListening(false);
        speechPulseUntilRef.current = 0;

        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size < 700) {
          setLastGeminiFeedback(
            pickLang(lang, {
              en: 'Recording too short — tap mic & speak clearly.',
              hi: 'आवाज़ बहुत छोटी थी — माइक दबाकर साफ़ बोलें।',
            })
          );
          return;
        }

        const processingLabel = pickLang(lang, {
          en: 'Writing your words & replying...',
          hi: 'आवाज़ को टेक्स्ट में लिखकर जवाब दे रहा हूँ...',
          mr: 'आवाज शब्दांत लिहित आहे...',
        });
        setWakeLiveCaption(processingLabel);
        setLastGeminiFeedback(processingLabel);

        const base64Data: string = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result || ''));
          reader.readAsDataURL(blob);
        });

        try {
          const res = await fetch('/api/ai/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Data,
              mimeType: blob.type || 'audio/webm',
              lang,
            }),
          });
          const data = await res.json();
          const spoken = (data?.transcript || '').trim();
          if (res.ok && data?.success && spoken) {
            setWakeLiveCaption(spoken);
            setLastGeminiFeedback('');
            if (isOpenRef.current) {
              setInputText(spoken);
            }
            handleSendMessageRef.current(spoken);
          } else {
            const retryMsg = pickLang(lang, {
              en: 'Could not hear words clearly — tap Speak and try again.',
              hi: 'आवाज़ साफ़ नहीं पकड़ पाई — दोबारा "बोलें" दबाकर बोलें या लिखें।',
              mr: 'आवाज स्पष्ट ऐकू आली नाही — पुन्हा प्रयत्न करा.',
            });
            setWakeLiveCaption(retryMsg);
            setLastGeminiFeedback(retryMsg);
          }
        } catch {
          setLastGeminiFeedback(
            pickLang(lang, {
              en: 'Network slow — try again or type below.',
              hi: 'नेटवर्क धीमा है — दोबारा बोलें या नीचे लिखें।',
            })
          );
        }
      };

      recorder.start(250);
      fallbackStopTimerRef.current = setTimeout(() => {
        stopMediaRecorderFallback();
      }, 15000);
    } catch {
      setIsListening(false);
      setIsFallbackRecording(false);
      setWakeNeedsPermission(true);
      wakeNeedsPermRef.current = true;
      setSpeechUnsupported(true);
      setTimeout(() => setSpeechUnsupported(false), 3500);
    }
  }, [lang, stopMediaRecorderFallback]);

  // Instant Streaming Speech Recognition Microphone (with 2.1s stall watchdog + automatic RMS-VAD Gemini fallback!)
  const toggleListening = () => {
    if (isListening) {
      if (interimCommitTimerRef.current) clearTimeout(interimCommitTimerRef.current);
      if (speechWatchdogRef.current) {
        clearTimeout(speechWatchdogRef.current);
        speechWatchdogRef.current = null;
      }
      try {
        recognitionRef.current?.stop();
      } catch {}
      stopMediaRecorderFallback();
      setIsListening(false);
      return;
    }

    stopSpeakingNow(true);
    armActiveCommandWindow();

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const isEmbeddedIframe =
      typeof window !== 'undefined' && (() => {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
      })();

    // Inside sandboxed iframes where Web Speech already stalled once, use rock-solid MediaRecorder + Gemini directly
    if (!SpeechRec || (isEmbeddedIframe && !webSpeechProvenRef.current && speechStallCountRef.current >= 1)) {
      startMediaRecorderFallback();
      return;
    }

    // Pause background wake listener cleanly without onend race while active dialog mic runs
    if (wakeRecRef.current) {
      try {
        wakeRecRef.current.onend = null;
        wakeRecRef.current.abort();
      } catch {}
      wakeRecRef.current = null;
      setIsWakeActive(false);
    }

    try {
      const rec = new SpeechRec();
      recognitionRef.current = rec;
      rec.lang = SPEECH_LOCALE_MAP[lang] || 'hi-IN';
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 3;

      let committed = false;
      let latestTranscript = '';
      let switchedToFallback = false;
      let gotAnyResult = false;

      const clearWatchdog = () => {
        if (speechWatchdogRef.current) {
          clearTimeout(speechWatchdogRef.current);
          speechWatchdogRef.current = null;
        }
      };

      const switchToFallbackNow = () => {
        if (switchedToFallback || committed) return;
        switchedToFallback = true;
        clearWatchdog();
        speechStallCountRef.current += 1;
        try {
          rec.onend = null;
          rec.onerror = null;
          rec.onresult = null;
          rec.abort();
        } catch {}
        recognitionRef.current = null;
        startMediaRecorderFallback();
      };

      const commitTranscript = (finalTxt: string) => {
        if (committed) return;
        const clean = finalTxt.trim();
        if (!clean) return;
        committed = true;
        clearWatchdog();
        if (interimCommitTimerRef.current) clearTimeout(interimCommitTimerRef.current);
        try {
          rec.stop();
        } catch {}
        setIsListening(false);
        setInputText('');
        handleSendMessage(clean);
      };

      rec.onstart = () => {
        micPermGrantedRef.current = true;
        setIsListening(true);
        clearWatchdog();
        // Watchdog: if Chrome WebSpeech sits silent (common in Preview iframes), auto-switch to Gemini Audio mode!
        speechWatchdogRef.current = setTimeout(() => {
          if (!gotAnyResult && !committed && !switchedToFallback) {
            switchToFallbackNow();
          }
        }, isEmbeddedIframe ? 1700 : 2800);
      };
      rec.onsoundstart = () => {
        if (!isPausedForTtsRef.current && !isSpeakingRef.current && Date.now() >= ttsCooldownUntilRef.current) {
          speechPulseUntilRef.current = Date.now() + 700;
        }
      };
      rec.onspeechstart = () => {
        if (!isPausedForTtsRef.current && !isSpeakingRef.current && Date.now() >= ttsCooldownUntilRef.current) {
          speechPulseUntilRef.current = Date.now() + 900;
        }
      };
      rec.onspeechend = () => {
        speechPulseUntilRef.current = 0;
      };
      rec.onsoundend = () => {
        speechPulseUntilRef.current = 0;
      };
      rec.onresult = (event: any) => {
        gotAnyResult = true;
        webSpeechProvenRef.current = true;
        speechStallCountRef.current = 0;
        clearWatchdog();

        if (
          isPausedForTtsRef.current ||
          isSpeakingRef.current ||
          Date.now() < ttsCooldownUntilRef.current
        ) {
          return;
        }
        let interim = '';
        let finalStr = '';
        for (let i = 0; i < event.results.length; i++) {
          const chunk = pickBestTranscriptAlternative(event.results[i]);
          if (event.results[i].isFinal) {
            finalStr += ' ' + chunk;
          } else {
            interim += ' ' + chunk;
          }
        }
        latestTranscript = `${finalStr} ${interim}`.replace(/\s+/g, ' ').normalize('NFC').trim();
        const recentTexts = recentSpokenRef.current
          .filter((e) => Date.now() - e.at < 25000)
          .map((e) => e.text);
        if (latestTranscript && isSelfEchoTranscript(latestTranscript, recentTexts)) {
          latestTranscript = '';
          return;
        }

        if (latestTranscript) {
          speechPulseUntilRef.current = Date.now() + 650;
        }

        // Live real-time typing feedback with 0ms lag
        if (isOpenRef.current) {
          setInputText(latestTranscript);
        }
        if (isAwakeArmedRef.current) {
          setWakeLiveCaption(latestTranscript);
        }

        if (interimCommitTimerRef.current) clearTimeout(interimCommitTimerRef.current);

        if (finalStr.trim() && !interim.trim()) {
          speechPulseUntilRef.current = 0;
          commitTranscript(finalStr.trim());
        } else if (latestTranscript.length >= 2) {
          // Configurable pause tolerance (Fast 700ms / Normal 1300ms / Relaxed 2000ms)
          const delayMs = voiceTuningRef.current.pauseCommitMs || 1300;
          interimCommitTimerRef.current = setTimeout(() => {
            speechPulseUntilRef.current = 0;
            commitTranscript(latestTranscript);
          }, delayMs);
        }
      };
      rec.onerror = (ev: any) => {
        clearWatchdog();
        if (interimCommitTimerRef.current) clearTimeout(interimCommitTimerRef.current);
        speechPulseUntilRef.current = 0;
        if (ev?.error === 'not-allowed') {
          setIsListening(false);
          setWakeNeedsPermission(true);
          wakeNeedsPermRef.current = true;
          return;
        }
        if (
          !committed &&
          !latestTranscript.trim() &&
          (ev?.error === 'network' ||
            ev?.error === 'service-not-allowed' ||
            ev?.error === 'audio-capture' ||
            ev?.error === 'language-not-supported' ||
            ev?.error === 'aborted' ||
            (ev?.error === 'no-speech' && isEmbeddedIframe))
        ) {
          switchToFallbackNow();
          return;
        }
        setIsListening(false);
      };
      rec.onend = () => {
        clearWatchdog();
        if (interimCommitTimerRef.current) clearTimeout(interimCommitTimerRef.current);
        speechPulseUntilRef.current = 0;
        if (switchedToFallback) return;
        if (!committed && latestTranscript.trim()) {
          commitTranscript(latestTranscript.trim());
        } else if (!committed && !gotAnyResult && isEmbeddedIframe) {
          switchToFallbackNow();
        } else {
          setIsListening(false);
        }
      };
      rec.start();
    } catch {
      setIsListening(false);
      startMediaRecorderFallback();
    }
  };

  const toggleListeningRef = useRef(toggleListening);
  toggleListeningRef.current = toggleListening;
  const handleSendMessageRef = useRef<(overrideText?: string) => Promise<void>>(async () => {});

  // Persistent Always-Ready Custom Wake Name Listener (runs even when dialog is closed & holds MediaSession in background)
  useEffect(() => {
    if (!voiceWakeWordEnabled) {
      setIsWakeActive(false);
      setIsAwakeArmed(false);
      setWakeLiveCaption('');
      if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
      if (wakeInterimTimerRef.current) clearTimeout(wakeInterimTimerRef.current);
      if (wakeRecRef.current) {
        try {
          wakeRecRef.current.onend = null;
          wakeRecRef.current.stop();
        } catch {}
        wakeRecRef.current = null;
      }
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch {}
        wakeLockRef.current = null;
      }
      if (keepAliveCtxRef.current) {
        try {
          keepAliveCtxRef.current.close();
        } catch {}
        keepAliveCtxRef.current = null;
      }
      if (silentAudioRef.current) {
        try {
          silentAudioRef.current.pause();
        } catch {}
      }
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'paused';
        } catch {}
      }
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec || isListening) return;

    let cancelled = false;

    // 1. Screen Wake Lock so phone stays awake while hands-free ordering
    if ('wakeLock' in navigator && !wakeLockRef.current) {
      (navigator as any).wakeLock
        .request('screen')
        .then((lock: any) => {
          wakeLockRef.current = lock;
        })
        .catch(() => {});
    }

    // 2. Real Silent WAV <audio> + Web Audio + MediaSession Keep-Alive (triggers OS Dynamic Island / Lockscreen Media Capsule)
    try {
      if (silentAudioRef.current) {
        silentAudioRef.current.volume = 0.001;
        silentAudioRef.current.play().catch(() => {});
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !keepAliveCtxRef.current) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        // Zero-gain keep-alive graph so background session stays active with zero audible hum or click
        gain.gain.value = 0;
        osc.frequency.value = 220;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        keepAliveCtxRef.current = ctx;
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `🎙️ "${customWakeName}" Live · सुन रहा है`,
          artist: 'ताज़ाMandi Voice Bubble',
          album: 'बोलें या Play दबाकर फ़टाफ़ट ऑर्डर करें',
          artwork: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        });
        navigator.mediaSession.playbackState = 'playing';
      }
    } catch {}

    const startWakeListener = () => {
      if (
        cancelled ||
        isListening ||
        wakeNeedsPermRef.current ||
        isPausedForTtsRef.current ||
        isSpeakingRef.current ||
        Date.now() < ttsCooldownUntilRef.current ||
        wakeRecRef.current
      ) {
        return;
      }
      try {
        const rec = new SpeechRec();
        wakeRecRef.current = rec;
        consumedPrefixByIdxRef.current = {};
        rec.lang = SPEECH_LOCALE_MAP[lang] || 'hi-IN';
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 3;

        const commitWakeCommand = (idx: number, rawTranscript: string) => {
          if (
            isPausedForTtsRef.current ||
            isSpeakingRef.current ||
            Date.now() < ttsCooldownUntilRef.current
          ) {
            return;
          }

          const clean = rawTranscript.normalize('NFC').trim();
          if (!clean) return;

          const recentTexts = recentSpokenRef.current
            .filter((e) => Date.now() - e.at < 25000)
            .map((e) => e.text);
          if (isSelfEchoTranscript(clean, recentTexts)) {
            return;
          }

          const hasWake = detectWakeWord(clean, customWakeName);
          const effectiveRaw = hasWake ? stripWakeWord(clean, customWakeName) : clean;
          if (effectiveRaw && isSelfEchoTranscript(effectiveRaw, recentTexts)) {
            return;
          }

          const prevConsumed = consumedPrefixByIdxRef.current[idx] || '';

          let delta = effectiveRaw;
          if (prevConsumed && effectiveRaw.toLowerCase().startsWith(prevConsumed.toLowerCase())) {
            delta = effectiveRaw.slice(prevConsumed.length).trim();
          }

          if (hasWake) {
            armActiveCommandWindow();
          }

          if (!delta || delta.length < 2) {
            if (hasWake && !prevConsumed) {
              const promptMsg = pickLang(lang, {
                en: 'Listening... speak items and say "confirm" to book your order!',
                hi: 'जी बोलिए... ताज़ा मंडी सुन रहा है — सब्ज़ी बोलें और "भेज दो / कन्फ़र्म" बोलें!',
                mr: 'बोला... ताजा मंडी ऐकत आहे — ऑर्डर बोला!',
                hinglish: 'Ji boliye... Taaza Mandi sun raha hai!',
              });
              setWakeLiveCaption(promptMsg);
              setLastGeminiFeedback(promptMsg);
              speakResponse(
                pickLang(lang, {
                  en: 'Ji boliye',
                  hi: 'जी बोलिए',
                  mr: 'बोला',
                }),
                true
              );
            }
            return;
          }

          if (hasWake || isAwakeArmedRef.current || isOpenRef.current) {
            consumedPrefixByIdxRef.current[idx] = effectiveRaw;
            armActiveCommandWindow();
            setWakeLiveCaption(delta);
            if (isOpenRef.current) {
              setInputText('');
            }
            handleSendMessageRef.current(delta);
          }
        };

        rec.onstart = () => {
          micPermGrantedRef.current = true;
          setIsWakeActive(true);
          setWakeNeedsPermission(false);
          wakeNeedsPermRef.current = false;
          wakeErrorCountRef.current = 0;
        };
        rec.onsoundstart = () => {
          if (!isPausedForTtsRef.current && !isSpeakingRef.current && Date.now() >= ttsCooldownUntilRef.current) {
            speechPulseUntilRef.current = Date.now() + 700;
          }
        };
        rec.onspeechstart = () => {
          if (!isPausedForTtsRef.current && !isSpeakingRef.current && Date.now() >= ttsCooldownUntilRef.current) {
            speechPulseUntilRef.current = Date.now() + 900;
          }
        };
        rec.onspeechend = () => {
          speechPulseUntilRef.current = 0;
        };
        rec.onsoundend = () => {
          speechPulseUntilRef.current = 0;
        };
        rec.onresult = (event: any) => {
          webSpeechProvenRef.current = true;
          speechStallCountRef.current = 0;
          wakeErrorCountRef.current = 0;
          if (
            isPausedForTtsRef.current ||
            isSpeakingRef.current ||
            Date.now() < ttsCooldownUntilRef.current
          ) {
            return;
          }
          const lastIdx = event.results.length - 1;
          if (lastIdx < 0) return;
          const resultObj = event.results[lastIdx];
          const raw = pickBestTranscriptAlternative(resultObj).normalize('NFC').trim();
          if (!raw) return;

          const recentTexts = recentSpokenRef.current
            .filter((e) => Date.now() - e.at < 25000)
            .map((e) => e.text);
          if (isSelfEchoTranscript(raw, recentTexts)) {
            return;
          }

          speechPulseUntilRef.current = Date.now() + 550;

          const hasWake = detectWakeWord(raw, customWakeName);
          // On wake word, silently arm compact Top Voice Bubble HUD (zero irritating beep loop)
          if (hasWake) {
            armActiveCommandWindow();
          }

          const effectivePreview = hasWake ? stripWakeWord(raw, customWakeName) : raw;
          if (isAwakeArmedRef.current || hasWake || isOpenRef.current) {
            const prevConsumed = consumedPrefixByIdxRef.current[lastIdx] || '';
            const previewDelta =
              prevConsumed && effectivePreview.toLowerCase().startsWith(prevConsumed.toLowerCase())
                ? effectivePreview.slice(prevConsumed.length).trim()
                : effectivePreview;
            if (previewDelta && !isSelfEchoTranscript(previewDelta, recentTexts)) {
              setWakeLiveCaption(previewDelta);
              if (isOpenRef.current) {
                setInputText(previewDelta);
              }
            }
          }

          if (wakeInterimTimerRef.current) clearTimeout(wakeInterimTimerRef.current);

          if (resultObj.isFinal) {
            speechPulseUntilRef.current = 0;
            commitWakeCommand(lastIdx, raw);
          } else {
            // Wait 1300ms pause before committing interim wake speech so long sentences never clip mid-word
            const prevConsumed = consumedPrefixByIdxRef.current[lastIdx] || '';
            const remaining =
              prevConsumed && effectivePreview.toLowerCase().startsWith(prevConsumed.toLowerCase())
                ? effectivePreview.slice(prevConsumed.length).trim()
                : effectivePreview;
            if (remaining.length >= 2 && (isAwakeArmedRef.current || hasWake || isOpenRef.current)) {
              const delayMs = voiceTuningRef.current.pauseCommitMs || 1300;
              wakeInterimTimerRef.current = setTimeout(() => {
                speechPulseUntilRef.current = 0;
                commitWakeCommand(lastIdx, raw);
              }, delayMs);
            }
          }
        };
        rec.onerror = (ev: any) => {
          speechPulseUntilRef.current = 0;
          setIsWakeActive(false);
          wakeRecRef.current = null;
          if (ev?.error === 'not-allowed' || ev?.error === 'service-not-allowed') {
            setWakeNeedsPermission(true);
            wakeNeedsPermRef.current = true;
          } else if (ev?.error !== 'no-speech' && ev?.error !== 'aborted') {
            wakeErrorCountRef.current = Math.min(wakeErrorCountRef.current + 1, 5);
          }
        };
        rec.onend = () => {
          speechPulseUntilRef.current = 0;
          setIsWakeActive(false);
          wakeRecRef.current = null;
          if (
            !cancelled &&
            !isListening &&
            !wakeNeedsPermRef.current &&
            !isPausedForTtsRef.current &&
            !isSpeakingRef.current &&
            Date.now() >= ttsCooldownUntilRef.current
          ) {
            const backoffDelay =
              wakeErrorCountRef.current > 0
                ? Math.min(6000, 900 * Math.pow(2, wakeErrorCountRef.current - 1))
                : document.visibilityState === 'visible'
                ? 70
                : 600;
            setTimeout(startWakeListener, backoffDelay);
          }
        };
        rec.start();
      } catch {
        setIsWakeActive(false);
        wakeRecRef.current = null;
      }
    };

    startWakeListenerRef.current = startWakeListener;
    startWakeListener();

    // MediaSession hardware/lockscreen trigger: arms compact voice HUD without opening full chat modal
    const handleMediaWake = () => {
      try {
        keepAliveCtxRef.current?.resume?.();
      } catch {}
      stopSpeakingNow(true);
      playWakeActivationChime(true);
      armActiveCommandWindow();
      if (!wakeRecRef.current && !cancelled && !isListening) {
        startWakeListener();
      }
    };
    if ('mediaSession' in navigator) {
      for (const action of ['play', 'pause', 'nexttrack', 'previoustrack'] as const) {
        try {
          navigator.mediaSession.setActionHandler(action, handleMediaWake);
        } catch {}
      }
    }

    const unlockAndResume = () => {
      if (cancelled || isListening) return;
      try {
        if (silentAudioRef.current && silentAudioRef.current.paused) {
          silentAudioRef.current.volume = 0.01;
          silentAudioRef.current.play().catch(() => {});
        }
        if (keepAliveCtxRef.current?.state === 'suspended') {
          keepAliveCtxRef.current.resume().catch(() => {});
        }
      } catch {}
      if (!wakeRecRef.current) {
        startWakeListener();
      }
    };

    const resumeOnReturn = () => {
      if (!cancelled && !isListening && document.visibilityState === 'visible') {
        unlockAndResume();
      }
    };

    document.addEventListener('visibilitychange', resumeOnReturn);
    window.addEventListener('focus', resumeOnReturn);
    window.addEventListener('pointerdown', unlockAndResume, { passive: true });
    window.addEventListener('keydown', unlockAndResume, { passive: true });

    return () => {
      cancelled = true;
      startWakeListenerRef.current = () => {};
      document.removeEventListener('visibilitychange', resumeOnReturn);
      window.removeEventListener('focus', resumeOnReturn);
      window.removeEventListener('pointerdown', unlockAndResume);
      window.removeEventListener('keydown', unlockAndResume);
      if ('mediaSession' in navigator) {
        for (const action of ['play', 'pause', 'nexttrack', 'previoustrack'] as const) {
          try {
            navigator.mediaSession.setActionHandler(action, null);
          } catch {}
        }
      }
      if (wakeInterimTimerRef.current) clearTimeout(wakeInterimTimerRef.current);
      if (wakeRestartTimerRef.current) clearTimeout(wakeRestartTimerRef.current);
      if (wakeRecRef.current) {
        try {
          wakeRecRef.current.onend = null;
          wakeRecRef.current.abort();
        } catch {}
        wakeRecRef.current = null;
      }
    };
  }, [
    voiceWakeWordEnabled,
    isListening,
    lang,
    customWakeName,
    playWakeActivationChime,
    armActiveCommandWindow,
    stopSpeakingNow,
    speakResponse,
  ]);

  // Live sync OS MediaSession island title + cart summary whenever armed/cart updates
  useEffect(() => {
    if (!voiceWakeWordEnabled || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: isAwakeArmed
          ? `🎙️ "${customWakeName}" सुन रहा है — अभी बोलिए!`
          : `🎙️ "${customWakeName}" · Live सुन रहा है`,
        artist: 'ताज़ाMandi Voice Bubble',
        album:
          totalCartItemCount > 0
            ? `थैली: ${totalCartItemCount} आइटम (₹${liveCartTotal})`
            : 'ऐप मिनिमाइज़ हो तब भी Play / Notification से बोलें',
        artwork: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      });
      navigator.mediaSession.playbackState = 'playing';
    } catch {}
  }, [voiceWakeWordEnabled, isAwakeArmed, customWakeName, totalCartItemCount, liveCartTotal]);

  const showPinnedVoiceNotification = useCallback(async () => {
    if (
      !('Notification' in window) ||
      Notification.permission !== 'granted' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const hasCart = totalCartItemCount > 0;
      const hasPrev = orders.some((o) => !o.isSampleOrder);
      if (!voiceWakeWordEnabled && !hasCart && !hasPrev) return;
      await reg.showNotification(`🎙️ ताज़ाMandi · "${customWakeName}" Live सुन रहा है`, {
        body: hasCart
          ? `${totalCartItemCount} आइटम थैली में (₹${liveCartTotal}) — ऊपर से 1-टैप कन्फ़र्म करें या बोलकर जोड़ें।`
          : `सक्रिय: ऐप ऊपर/मिनिमाइज़ रहते हुए "🎙️ बोलें" दबाकर फ़टाफ़ट ऑर्डर दें।`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'tazamandi-quick-confirm',
        silent: true,
        requireInteraction: voiceWakeWordEnabled,
        actions: [
          { action: 'voice_listen', title: `🎙️ "${customWakeName}" बोलें` },
          ...(hasCart || hasPrev ? [{ action: 'confirm_order', title: '✅ तुरंत कन्फ़र्म' }] : []),
        ],
        data: { action: 'voice_listen' },
      } as any);
    } catch {}
  }, [voiceWakeWordEnabled, customWakeName, totalCartItemCount, liveCartTotal, orders]);

  // Pin silent notification when wake listener starts + refresh on minimize
  useEffect(() => {
    if (isWakeActive && 'Notification' in window && Notification.permission === 'granted') {
      showPinnedVoiceNotification();
    }
  }, [isWakeActive, showPinnedVoiceNotification]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && (voiceWakeWordEnabled || totalCartItemCount > 0)) {
        showPinnedVoiceNotification();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [voiceWakeWordEnabled, totalCartItemCount, showPinnedVoiceNotification]);

  // Document Picture-in-Picture Floating Always-On-Top Mini Bubble (for supported Chrome/Android desktop browsers)
  const renderPipContent = useCallback(() => {
    const pipWin = pipWindowRef.current;
    if (!pipWin || pipWin.closed) return;
    const root = pipWin.document.getElementById('tazamandi-pip-root');
    if (!root) return;

    root.replaceChildren();

    const header = pipWin.document.createElement('div');
    header.className = 'flex items-center justify-between gap-2 mb-2';

    const titleWrap = pipWin.document.createElement('div');
    titleWrap.className = 'flex items-center gap-2 min-w-0';
    const dot = pipWin.document.createElement('span');
    dot.className = isUserSpeaking
      ? 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0'
      : isAwakeArmed
      ? 'w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0'
      : 'w-2.5 h-2.5 rounded-full bg-emerald-400/60 shrink-0';
    const title = pipWin.document.createElement('span');
    title.className = 'text-xs font-black text-emerald-300 truncate';
    title.textContent = `🎙️ "${customWakeName}" सुन रहा है`;
    titleWrap.append(dot, title);

    const statusBadge = pipWin.document.createElement('span');
    statusBadge.className =
      'px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[10px] font-black text-emerald-200 shrink-0';
    statusBadge.textContent = isAwakeArmed ? 'ACTIVE' : 'LIVE';
    header.append(titleWrap, statusBadge);

    const captionBox = pipWin.document.createElement('div');
    captionBox.className =
      'rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-2 text-[11px] font-semibold text-white mb-2 truncate';
    captionBox.textContent =
      wakeLiveCaption ||
      lastGeminiFeedback ||
      (totalCartItemCount > 0
        ? `थैली: ${totalCartItemCount} आइटम (₹${liveCartTotal}) — "भेज दो" बोलें`
        : 'बोलें: "2 किलो आलू 1 किलो प्याज भेज दो"');

    const actions = pipWin.document.createElement('div');
    actions.className = 'flex items-center gap-1.5';

    const speakBtn = pipWin.document.createElement('button');
    speakBtn.type = 'button';
    speakBtn.className =
      'flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black cursor-pointer';
    speakBtn.textContent = '🎙️ बोलें';
    speakBtn.onclick = () => {
      playWakeActivationChime(true);
      armActiveCommandWindow();
      toggleListeningRef.current();
    };
    actions.append(speakBtn);

    if (totalCartItemCount > 0) {
      const codBtn = pipWin.document.createElement('button');
      codBtn.type = 'button';
      codBtn.className =
        'py-1.5 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black cursor-pointer';
      codBtn.textContent = `✅ COD ₹${liveCartTotal}`;
      codBtn.onclick = () => {
        executeInstantConfirmRef.current('cod', true);
      };
      actions.append(codBtn);
    }

    const focusBtn = pipWin.document.createElement('button');
    focusBtn.type = 'button';
    focusBtn.className =
      'py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer';
    focusBtn.textContent = '↗ ऐप';
    focusBtn.onclick = () => {
      window.focus();
      setIsOpen(true);
    };
    actions.append(focusBtn);

    root.append(header, captionBox, actions);
  }, [
    isUserSpeaking,
    isAwakeArmed,
    customWakeName,
    wakeLiveCaption,
    lastGeminiFeedback,
    totalCartItemCount,
    liveCartTotal,
    playWakeActivationChime,
    armActiveCommandWindow,
  ]);

  useEffect(() => {
    if (isPipOpen) renderPipContent();
  }, [isPipOpen, renderPipContent]);

  const openFloatingBubble = useCallback(async () => {
    if (!supportsPip) return;
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.focus();
      return;
    }
    try {
      const pipWin: Window = await (window as any).documentPictureInPicture.requestWindow({
        width: 320,
        height: 152,
      });
      pipWindowRef.current = pipWin;
      // Mirror loaded stylesheets from parent document so Tailwind utility classes work inside floating PiP window
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          if (sheet.href) {
            const link = pipWin.document.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href;
            pipWin.document.head.appendChild(link);
          } else {
            const cssRules = Array.from(sheet.cssRules).map((r) => r.cssText).join('\n');
            const styleEl = pipWin.document.createElement('style');
            styleEl.textContent = cssRules;
            pipWin.document.head.appendChild(styleEl);
          }
        } catch {}
      });
      pipWin.document.title = `🎙️ ताज़ाMandi (${customWakeName})`;
      pipWin.document.body.className = 'bg-slate-950 text-white m-0 p-2.5 font-sans antialiased';
      const rootDiv = pipWin.document.createElement('div');
      rootDiv.id = 'tazamandi-pip-root';
      pipWin.document.body.appendChild(rootDiv);

      setIsPipOpen(true);
      pipWin.addEventListener('pagehide', () => {
        pipWindowRef.current = null;
        setIsPipOpen(false);
      });

      if (silentAudioRef.current) {
        silentAudioRef.current.volume = 0.01;
        silentAudioRef.current.play().catch(() => {});
      }
      renderPipContent();
    } catch {}
  }, [supportsPip, customWakeName, renderPipContent]);

  const requestMicPermissionAndWake = useCallback(async () => {
    stopSpeakingNow(true);
    setVoiceWakeWordEnabled(true);
    setVoiceAutoOrderEnabled(true);
    setWakeNeedsPermission(false);
    wakeNeedsPermRef.current = false;
    try {
      if (silentAudioRef.current) {
        silentAudioRef.current.volume = 0.001;
        silentAudioRef.current.play().catch(() => {});
      }
      keepAliveCtxRef.current?.resume?.();
    } catch {}
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micPermGrantedRef.current = true;
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      setWakeNeedsPermission(true);
      wakeNeedsPermRef.current = true;
      return;
    }
    playWakeActivationChime(true);
    armActiveCommandWindow();
    if (!isListening) {
      // Immediately capture speech cleanly (auto-switches to Gemini audio mode if in sandboxed preview iframe)
      toggleListeningRef.current();
    }
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          await showPinnedVoiceNotification();
        }
      } catch {}
    } else if ('Notification' in window && Notification.permission === 'granted') {
      await showPinnedVoiceNotification();
    }
  }, [
    isListening,
    setVoiceWakeWordEnabled,
    setVoiceAutoOrderEnabled,
    playWakeActivationChime,
    armActiveCommandWindow,
    showPinnedVoiceNotification,
    stopSpeakingNow,
  ]);

  const turnMicCompletelyOff = useCallback(() => {
    if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
    if (interimCommitTimerRef.current) clearTimeout(interimCommitTimerRef.current);
    if (wakeInterimTimerRef.current) clearTimeout(wakeInterimTimerRef.current);
    if (wakeRestartTimerRef.current) clearTimeout(wakeRestartTimerRef.current);

    setVoiceWakeWordEnabled(false);
    setWakeNeedsPermission(false);
    wakeNeedsPermRef.current = false;
    setIsWakeActive(false);
    setIsListening(false);
    setIsAwakeArmed(false);
    isAwakeArmedRef.current = false;
    setIsUserSpeaking(false);
    speechPulseUntilRef.current = 0;
    setWakeLiveCaption('');
    stopSpeakingNow(true);
    stopMediaRecorderFallback();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    if (wakeRecRef.current) {
      try {
        wakeRecRef.current.onend = null;
        wakeRecRef.current.abort();
      } catch {}
      wakeRecRef.current = null;
    }
    if (analyserStreamRef.current) {
      try {
        analyserStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      analyserStreamRef.current = null;
    }
    if (keepAliveCtxRef.current) {
      try {
        keepAliveCtxRef.current.close();
      } catch {}
      keepAliveCtxRef.current = null;
    }
    if (silentAudioRef.current) {
      try {
        silentAudioRef.current.pause();
      } catch {}
    }
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch {}
      wakeLockRef.current = null;
    }
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'paused';
      } catch {}
    }
  }, [setVoiceWakeWordEnabled, stopSpeakingNow, stopMediaRecorderFallback]);

  // Handle PWA shortcut / notification deep-link (?quick_action=... & ?voice_query=...) & SW postMessage
  useEffect(() => {
    const runQuickAction = (action: string, voiceQuery?: string) => {
      if (voiceQuery && voiceQuery.trim()) {
        setVoiceAutoOrderEnabled(true);
        setVoiceWakeWordEnabled(true);
        playWakeActivationChime(true);
        armActiveCommandWindow();
        setWakeLiveCaption(voiceQuery.trim());
        setTimeout(() => {
          handleSendMessageRef.current(voiceQuery.trim());
        }, 200);
        return;
      }
      if (action === 'confirm_order') {
        executeInstantConfirmRef.current(selectedPayModeRef.current, true);
      } else if (action === 'voice_listen') {
        stopSpeakingNow(true);
        setVoiceAutoOrderEnabled(true);
        setVoiceWakeWordEnabled(true);
        setWakeNeedsPermission(false);
        wakeNeedsPermRef.current = false;
        playWakeActivationChime(true);
        armActiveCommandWindow();
        setWakeLiveCaption(
          pickLang(lang, {
            en: 'Listening... speak your order now',
            hi: 'सुन रहा हूँ... अब फटाफट अपना ऑर्डर बोलिए',
            mr: 'ऐकत आहे... आत्ता तुमची ऑर्डर बोला',
          })
        );
        setTimeout(() => {
          toggleListeningRef.current();
        }, 250);
      }
    };

    const params = new URLSearchParams(window.location.search);
    const qa = params.get('quick_action');
    const vq = params.get('voice_query');
    if (qa === 'confirm_order' || qa === 'voice_listen' || vq) {
      runQuickAction(qa || 'voice_listen', vq || undefined);
      params.delete('quick_action');
      params.delete('voice_query');
      const cleanUrl =
        window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
      window.history.replaceState({}, '', cleanUrl);
    }

    const onSwMessage = (ev: MessageEvent) => {
      if (ev.data?.type === 'TAZAMANDI_QUICK_ACTION' && ev.data?.action) {
        runQuickAction(ev.data.action);
      }
    };
    const onNavbarVoiceTrigger = (ev: Event) => {
      const detail = (ev as CustomEvent)?.detail;
      if (!detail?.action) return;
      if (detail.action === 'chat') {
        setIsOpen(true);
        isOpenRef.current = true;
      } else if (detail.action === 'stop_mic') {
        turnMicCompletelyOff();
      } else if (detail.action === 'toggle_mic') {
        if (voiceWakeWordEnabled || isListening || isWakeActive) {
          turnMicCompletelyOff();
        } else {
          requestMicPermissionAndWake();
        }
      } else if (detail.action === 'speak') {
        if (isSpeakingRef.current) {
          stopSpeakingNow(true);
          armActiveCommandWindow();
          return;
        }
        stopSpeakingNow(true);
        if (!voiceWakeWordEnabled || wakeNeedsPermRef.current) {
          requestMicPermissionAndWake();
        } else {
          playWakeActivationChime(true);
          armActiveCommandWindow();
          if (!isListening) {
            toggleListeningRef.current();
          }
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', onSwMessage);
    window.addEventListener('tazamandi-voice-trigger', onNavbarVoiceTrigger);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', onSwMessage);
      window.removeEventListener('tazamandi-voice-trigger', onNavbarVoiceTrigger);
    };
  }, [
    lang,
    isListening,
    isWakeActive,
    voiceWakeWordEnabled,
    setVoiceAutoOrderEnabled,
    setVoiceWakeWordEnabled,
    playWakeActivationChime,
    armActiveCommandWindow,
    stopSpeakingNow,
    turnMicCompletelyOff,
    requestMicPermissionAndWake,
  ]);

  // Broadcast mic active/muted state to Navbar so header mic pill stays synced
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('tazamandi-voice-status', {
        detail: {
          micEnabled: voiceWakeWordEnabled,
          isListening: isWakeActive || isListening,
        },
      })
    );
  }, [voiceWakeWordEnabled, isWakeActive, isListening]);

  const handleToggleWakeMode = async () => {
    const next = !voiceWakeWordEnabled;
    if (next) {
      setVoiceWakeWordEnabled(true);
      await requestMicPermissionAndWake();
    } else {
      turnMicCompletelyOff();
    }
  };

  const handleConfirmAndPlaceOrder = (payMode: 'upi_qr' | 'cod', slot = '10:00 AM - 12:00 PM') => {
    const placed = placeOrder(slot, payMode);
    setPendingConfirmFlag(false);

    const confirmText =
      payMode === 'upi_qr'
        ? pickLang(lang, {
            en: `Order #${placed.id} confirmed! Total ₹${placed.totalAmount}. Scan Kotak UPI QR below to complete payment.`,
            hi: `ऑर्डर #${placed.id} कन्फ़र्म हो गया! कुल ₹${placed.totalAmount}। नीचे Kotak UPI QR से तुरंत भुगतान करें।`,
            mr: `ऑर्डर #${placed.id} कन्फर्म झाली! एकूण ₹${placed.totalAmount}. खालील UPI QR स्कॅन करा.`,
            hinglish: `Order #${placed.id} confirm ho gaya! Total ₹${placed.totalAmount}. Neeche UPI QR scan karke pay karein.`,
          })
        : pickLang(lang, {
            en: `Order #${placed.id} confirmed! Total ₹${placed.totalAmount} (Pay at Doorstep / Cash on Delivery).`,
            hi: `ऑर्डर #${placed.id} कन्फ़र्म हो गया! कुल ₹${placed.totalAmount} (डिलीवरी पर नकद / COD)।`,
            mr: `ऑर्डर #${placed.id} कन्फर्म झाली! एकूण ₹${placed.totalAmount} (कॅश ऑन डिलिव्हरी).`,
            hinglish: `Order #${placed.id} confirm ho gaya! Total ₹${placed.totalAmount} Cash on Delivery par.`,
          });

    setMessages((prev) => [
      ...prev,
      {
        id: `ord_${Date.now()}`,
        role: 'assistant',
        text: confirmText,
        confirmedOrder: placed,
        paymentMode: payMode,
      },
    ]);
    speakResponse(confirmText, false);
  };

  const handleSendMessage = async (overrideText?: string) => {
    const query = (overrideText ?? inputText).normalize('NFC').trim();
    if (!query) return;

    // Cancel any previous in-flight AI stream immediately so rapid user turns feel instantaneous
    dialogAbortRef.current?.abort();
    dialogAbortRef.current = null;

    // Anti-echo & anti-repeat guard: never re-process assistant's own TTS speaker output or duplicate rapid echo
    if (overrideText) {
      const now = Date.now();
      const recentTexts = recentSpokenRef.current
        .filter((e) => now - e.at < 25000)
        .map((e) => e.text);
      if (isSelfEchoTranscript(query, recentTexts)) {
        return;
      }
      if (
        lastHandledQueryRef.current.text.toLowerCase() === query.toLowerCase() &&
        now - lastHandledQueryRef.current.at < 2500
      ) {
        return;
      }
      lastHandledQueryRef.current = { text: query, at: now };
    }

    if (!overrideText) setInputText('');
    const userMsg: DialogMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: query,
    };
    setMessages((prev) => [...prev, userMsg]);

    // 1. ULTRA-FAST LOCAL PARSER (< 1ms cached index, zero network wait for items/confirm/cancel/payment/navigation)
    const fast = parseVoiceCommandFast(query, produceList, accessoriesList, customWakeName);
    if (fast.handledLocally) {
      if (fast.actionType === 'SLEEP_WAKE') {
        setIsAwakeArmed(false);
        isAwakeArmedRef.current = false;
        setWakeLiveCaption('');
        setLastGeminiFeedback('');
        const msg = pickLang(lang, {
          en: `Okay, back in standby. Say "${customWakeName}" anytime.`,
          hi: `ठीक है, अब स्टैंडबाय में हूँ। फिर से बोलने के लिए "${customWakeName}" कहें।`,
          mr: `ठीक आहे, पुन्हा बोलण्यासाठी "${customWakeName}" म्हणा.`,
        });
        setMessages((prev) => [...prev, { id: `slp_${Date.now()}`, role: 'assistant', text: msg }]);
        speakResponse(msg, false);
        return;
      }

      if (fast.actionType === 'CLEAR_CART') {
        clearAllCarts();
        const msg = pickLang(lang, {
          en: 'Cleared your shopping bag.',
          hi: 'आपकी थैली खाली कर दी गई है।',
          mr: 'तुमची बॅग रिकामी केली आहे.',
        });
        setLastGeminiFeedback(`🧹 ${msg}`);
        setMessages((prev) => [...prev, { id: `clr_${Date.now()}`, role: 'assistant', text: msg }]);
        speakResponse(msg, false);
        return;
      }

      if (fast.actionType === 'SET_LANGUAGE' && fast.targetLang) {
        const nextLang = fast.targetLang;
        setLang(nextLang);
        const langReply: Record<string, string> = {
          hi: 'भाषा हिंदी में बदल दी गई है! अब आप हिंदी में बोल सकते हैं।',
          en: 'Language switched to English! How can I help you today?',
          mr: 'भाषा मराठीमध्ये बदलली आहे! बोला काय हवे?',
          hinglish: 'Language Hinglish me set ho gayi! Boliye kya chahiye?',
          gu: 'ભાષા ગુજરાતીમાં બદલાઈ ગઈ છે!',
          bn: 'ভাষা বাংলায় পরিবর্তন করা হয়েছে!',
          ta: 'மொழி தமிழுக்கு மாற்றப்பட்டது!',
          te: 'భాష తెలుగులోకి మార్చబడింది!',
          kn: 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ!',
          pa: 'ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਵਿੱਚ ਬਦਲ ਦਿੱਤੀ ਗਈ ਹੈ!',
        };
        const msg = langReply[nextLang] || langReply.en;
        setLastGeminiFeedback(`🌐 ${msg}`);
        setMessages((prev) => [...prev, { id: `lng_${Date.now()}`, role: 'assistant', text: msg }]);
        speakResponse(msg, false);
        return;
      }

      if (fast.actionType === 'SET_THEME' && fast.themeMode) {
        window.dispatchEvent(
          new CustomEvent('tazamandi-voice-nav', {
            detail: { themeMode: fast.themeMode },
          })
        );
        const msg =
          fast.themeMode === 'dark'
            ? pickLang(lang, { en: 'Dark mode enabled.', hi: 'डार्क मोड चालू कर दिया गया है।', mr: 'डार्क मोड सुरू केले आहे.' })
            : pickLang(lang, { en: 'Light mode enabled.', hi: 'लाइट मोड चालू कर दिया गया है।', mr: 'लाईट मोड सुरू केले आहे.' });
        setLastGeminiFeedback(`🌓 ${msg}`);
        setMessages((prev) => [...prev, { id: `thm_${Date.now()}`, role: 'assistant', text: msg }]);
        speakResponse(msg, false);
        return;
      }

      if (fast.actionType === 'TOGGLE_SOUND') {
        const enable = Boolean(fast.soundEnabled);
        setIsVoiceOutputOn(enable);
        if (enable !== isFluidSoundActive) toggleFluidSound();
        if (!enable) stopSpeakingNow(true);
        const msg = enable
          ? pickLang(lang, { en: 'Voice and app sounds are ON.', hi: 'वॉइस और ऐप साउंड चालू कर दिए गए हैं।' })
          : pickLang(lang, { en: 'Muted app voice.', hi: 'वॉइस साउंड बंद कर दिया गया है।' });
        setLastGeminiFeedback(`🔊 ${msg}`);
        setMessages((prev) => [...prev, { id: `snd_${Date.now()}`, role: 'assistant', text: msg }]);
        if (enable) speakResponse(msg, false);
        return;
      }

      if (fast.actionType === 'SET_VOICE_TUNING' && fast.voiceTuning) {
        const vt = fast.voiceTuning;
        const patch: Partial<VoiceTuningSettings> = {};
        if (vt.micSensitivity === 'high') {
          patch.micSensitivity = 'high';
          patch.micGain = 85;
        } else if (vt.micSensitivity === 'low_noise') {
          patch.micSensitivity = 'low_noise';
          patch.micGain = 38;
        } else if (vt.micSensitivity === 'balanced') {
          patch.micSensitivity = 'balanced';
          patch.micGain = 62;
        }
        if (vt.pausePreset) {
          patch.pausePreset = vt.pausePreset;
          patch.pauseCommitMs = vt.pausePreset === 'fast' ? 700 : vt.pausePreset === 'relaxed' ? 2000 : 1300;
        }
        if (vt.ttsVoice) patch.ttsVoice = vt.ttsVoice;
        if (vt.ttsRate) patch.ttsRate = vt.ttsRate;
        if (Object.keys(patch).length > 0) updateVoiceTuning(patch);
        if (vt.openPanel) {
          setIsOpen(true);
          isOpenRef.current = true;
          setShowSensitivityPanel(true);
          setShowFamilyPanel(false);
        }
        const msg = pickLang(lang, {
          en: vt.openPanel
            ? 'Opened Voice Sensitivity & Natural TTS Studio!'
            : 'Voice sensitivity & speaking settings updated!',
          hi: vt.openPanel
            ? 'माइक सेंसिटिविटी और आवाज़ सेटिंग पैनल खोल दिया गया है!'
            : 'माइक सेंसिटिविटी व बोलने की आवाज़ अपडेट कर दी गई है!',
          hinglish: vt.openPanel
            ? 'Voice Sensitivity settings khol di hai!'
            : 'Voice sensitivity aur speed update kar di hai!',
        });
        setLastGeminiFeedback(`🎚️ ${msg}`);
        setMessages((prev) => [...prev, { id: `vt_${Date.now()}`, role: 'assistant', text: msg }]);
        speakResponse(msg, false);
        return;
      }

      if (fast.actionType === 'CHECK_WALLET') {
        const bal = user.walletBalance || 0;
        const code = user.referralCode || 'TAZA-SHARE';
        const msg = pickLang(lang, {
          en: `Your TaazaMandi cashback wallet balance is ₹${bal}. Share referral code ${code} to earn ₹50 per friend!`,
          hi: `आपके ताज़ा मंडी वॉलेट में ₹${bal} कैशबैक बैलेंस है। आपका रेफरल कोड ${code} है — दोस्तों को शेयर करके ₹50 कमाएँ!`,
          mr: `तुमच्या वॉलेटमध्ये ₹${bal} शिल्लक आहे. रेफरल कोड: ${code}.`,
        });
        setLastGeminiFeedback(`💰 ₹${bal} · ${code}`);
        setMessages((prev) => [...prev, { id: `wal_${Date.now()}`, role: 'assistant', text: msg }]);
        speakResponse(msg, false);
        return;
      }

      if (fast.actionType === 'CHECK_ORDER_STATUS') {
        const latestOrder = orders.find((o) => !o.isSampleOrder);
        if (!latestOrder) {
          const msg = pickLang(lang, {
            en: 'You have not placed an active order yet. Say any vegetable or fruit name to start!',
            hi: 'अभी आपका कोई सक्रिय ऑर्डर नहीं है। ऑर्डर शुरू करने के लिए किसी सब्ज़ी या फल का नाम बोलें।',
            mr: 'अद्याप कोणतीही ऑर्डर नाही.',
          });
          setLastGeminiFeedback(msg);
          setMessages((prev) => [...prev, { id: `ordst_${Date.now()}`, role: 'assistant', text: msg }]);
          speakResponse(msg, false);
        } else {
          const statusLabels: Record<string, string> = {
            ordered: pickLang(lang, { en: 'Order Placed (Morning Batch)', hi: 'ऑर्डर बुक हो चुका है (सुबह का बैच)' }),
            procured_at_mandi: pickLang(lang, { en: 'Freshly Bought at APMC Mandi', hi: 'APMC मंडी से ताज़ा खरीद लिया गया है' }),
            packed: pickLang(lang, { en: 'Quality Checked & Packed', hi: 'पैक होकर निकलने को तैयार है' }),
            out_for_delivery: pickLang(lang, { en: 'Out for Delivery to Your Gate', hi: 'डिलीवरी वैन रास्ते में है' }),
            delivered: pickLang(lang, { en: 'Delivered Successfully', hi: 'डिलीवर हो चुका है' }),
            cancelled: pickLang(lang, { en: 'Cancelled', hi: 'कैंसिल हो चुका है' }),
          };
          const stText = statusLabels[latestOrder.status] || latestOrder.status;
          const msg = pickLang(lang, {
            en: `Order #${latestOrder.id} (₹${latestOrder.totalAmount}) status: ${stText}.`,
            hi: `ऑर्डर #${latestOrder.id} (₹${latestOrder.totalAmount}) की स्थिति: ${stText}।`,
            mr: `ऑर्डर #${latestOrder.id} (₹${latestOrder.totalAmount}): ${stText}.`,
          });
          setLastGeminiFeedback(`🚚 #${latestOrder.id}: ${stText}`);
          setMessages((prev) => [...prev, { id: `ordst_${Date.now()}`, role: 'assistant', text: msg }]);
          speakResponse(msg, false);
        }
        return;
      }

      if (fast.actionType === 'CHECK_CART_SUMMARY') {
        if (totalCartItemCount === 0) {
          const msg = pickLang(lang, {
            en: 'Your shopping bag is currently empty.',
            hi: 'आपकी थैली अभी खाली है। कुछ ताज़े आइटम बोलकर जोड़ें!',
          });
          setLastGeminiFeedback(msg);
          setMessages((prev) => [...prev, { id: `crt_${Date.now()}`, role: 'assistant', text: msg }]);
          speakResponse(msg, false);
        } else {
          const msg = pickLang(lang, {
            en: `You have ${totalCartItemCount} items in your bag totaling ₹${liveCartTotal}. Say "confirm order" whenever ready!`,
            hi: `आपकी थैली में कुल ${totalCartItemCount} आइटम हैं और बिल ₹${liveCartTotal} है। ऑर्डर पक्का करने के लिए "कन्फ़र्म कर दो" बोलें।`,
            mr: `तुमच्या बॅगेत ${totalCartItemCount} वस्तू असून एकूण बिल ₹${liveCartTotal} आहे.`,
          });
          setLastGeminiFeedback(`🛒 ${totalCartItemCount} items · ₹${liveCartTotal}`);
          setMessages((prev) => [...prev, { id: `crt_${Date.now()}`, role: 'assistant', text: msg }]);
          speakResponse(msg, false);
        }
        return;
      }

      if (fast.actionType === 'REPEAT_LAST_ORDER') {
        const lastValid = orders.find(
          (o) => !o.isSampleOrder && (o.produceItems.length > 0 || o.accessoryItems.length > 0)
        );
        if (!lastValid) {
          const msg = pickLang(lang, {
            en: 'No previous order found to repeat.',
            hi: 'दोहराने के लिए अभी कोई पिछला ऑर्डर नहीं मिला।',
          });
          setLastGeminiFeedback(msg);
          setMessages((prev) => [...prev, { id: `rep_${Date.now()}`, role: 'assistant', text: msg }]);
          speakResponse(msg, false);
          return;
        }
        lastValid.produceItems.forEach((p) => addProduceToCart(p.produceId, p.quantityKg));
        lastValid.accessoryItems.forEach((a) => addAccessoryToCart(a.accessoryId, a.quantity));
        setPendingConfirmFlag(true);
        const msg = pickLang(lang, {
          en: `Refilled your bag from order #${lastValid.id}. Say "confirm order" to book!`,
          hi: `पिछले ऑर्डर #${lastValid.id} के सभी आइटम थैली में जोड़ दिए! बुक करने के लिए "कन्फ़र्म करो" बोलें।`,
        });
        setLastGeminiFeedback(`🔁 ${msg}`);
        setMessages((prev) => [...prev, { id: `rep_${Date.now()}`, role: 'assistant', text: msg }]);
        speakResponse(msg, false);
        return;
      }

      if (fast.actionType === 'REMOVE_ITEMS' && fast.itemsToAdd.length > 0) {
        const removedNames: string[] = [];
        for (let i = 0; i < fast.itemsToAdd.length; i++) {
          const entry = fast.itemsToAdd[i];
          if (entry.itemType === 'accessory') {
            const acc = accessoryById.get(entry.itemId);
            if (acc && accessoryCart[acc.id]) {
              const curr = accessoryCart[acc.id];
              if (entry.qty >= curr || !/\d/.test(query)) {
                removeAccessoryFromCart(acc.id);
              } else {
                setAccessoryCartQty(acc.id, curr - entry.qty);
              }
              removedNames.push(acc.name.en);
            }
          } else {
            const prod = produceById.get(entry.itemId);
            if (prod && produceCart[prod.id]) {
              const curr = produceCart[prod.id];
              if (entry.qty >= curr || !/\d/.test(query)) {
                removeProduceFromCart(prod.id);
              } else {
                setProduceCartQty(prod.id, Math.max(0, Math.round((curr - entry.qty) * 100) / 100));
              }
              removedNames.push(resolveLocalizedProduceName(prod.name, lang, prod.id));
            }
          }
        }
        const msg =
          removedNames.length > 0
            ? pickLang(lang, {
                en: `Removed from bag: ${removedNames.join(', ')}.`,
                hi: `थैली से हटा दिया: ${removedNames.join(', ')}।`,
                mr: `बॅगेतून काढले: ${removedNames.join(', ')}.`,
              })
            : pickLang(lang, {
                en: 'Those items were not in your bag.',
                hi: 'यह आइटम अभी आपकी थैली में नहीं था।',
              });
        setLastGeminiFeedback(`➖ ${msg}`);
        setMessages((prev) => [...prev, { id: `rem_${Date.now()}`, role: 'assistant', text: msg }]);
        speakResponse(msg, false);
        return;
      }

      if (fast.actionType === 'NAVIGATE' && fast.navTarget) {
        if (fast.navTarget.openModal === 'voice_chat') {
          setIsOpen(true);
          isOpenRef.current = true;
        } else {
          window.dispatchEvent(
            new CustomEvent('tazamandi-voice-nav', {
              detail: {
                tab: fast.navTarget.tab,
                category: fast.navTarget.category,
                search: fast.navTarget.search,
                openCart: fast.navTarget.openCart,
                closeCart: fast.navTarget.closeCart,
                openModal: fast.navTarget.openModal,
              },
            })
          );
        }
        const msg = pickLang(lang, {
          en: fast.navTarget.labelEn,
          hi: fast.navTarget.labelHi,
        });
        setLastGeminiFeedback(`🧭 ${msg}`);
        setMessages((prev) => [...prev, { id: `nav_${Date.now()}`, role: 'assistant', text: msg }]);
        speakResponse(msg, false);
        return;
      }

      const addedNames: string[] = [];
      for (let i = 0; i < fast.itemsToAdd.length; i++) {
        const entry = fast.itemsToAdd[i];
        if (entry.itemType === 'accessory') {
          const acc = accessoryById.get(entry.itemId);
          if (acc) {
            addAccessoryToCart(acc.id, entry.qty);
            addedNames.push(`${acc.name.en} × ${entry.qty}`);
          }
        } else {
          const prod = produceById.get(entry.itemId);
          if (prod) {
            addProduceToCart(prod.id, entry.qty);
            addedNames.push(
              `${resolveLocalizedProduceName(prod.name, lang, prod.id)} (${entry.qty} ${prod.pricingUnit || 'kg'})`
            );
          }
        }
      }

      const resolvedPay: 'upi_qr' | 'cod' =
        fast.paymentMode === 'upi_qr' || fast.paymentMode === 'cod'
          ? fast.paymentMode
          : selectedPayMode;
      if (fast.paymentMode === 'upi_qr' || fast.paymentMode === 'cod') {
        setSelectedPayMode(fast.paymentMode);
      }

      if (fast.actionType === 'CANCEL_ORDER') {
        const cancellable = orders.find(
          (o) => !o.isSampleOrder && o.status !== 'delivered' && o.status !== 'cancelled'
        );
        if (cancellable && cancelOrder(cancellable.id, 'Cancelled via Voice Command')) {
          const msg = pickLang(lang, {
            en: `Order #${cancellable.id} has been cancelled.`,
            hi: `आपका ऑर्डर #${cancellable.id} कैंसिल कर दिया गया है।`,
            mr: `तुमची ऑर्डर #${cancellable.id} रद्द केली आहे.`,
            hinglish: `Order #${cancellable.id} cancel kar diya gaya hai.`,
          });
          setLastGeminiFeedback(`❌ ${msg}`);
          setMessages((prev) => [...prev, { id: `can_${Date.now()}`, role: 'assistant', text: msg }]);
          speakResponse(msg, false);
        } else {
          const msg = pickLang(lang, {
            en: 'No active order found to cancel.',
            hi: 'कैंसिल करने के लिए अभी कोई सक्रिय ऑर्डर नहीं है।',
            mr: 'रद्द करण्यासाठी कोणतीही सक्रिय ऑर्डर नाही.',
          });
          setLastGeminiFeedback(msg);
          setMessages((prev) => [...prev, { id: `ncan_${Date.now()}`, role: 'assistant', text: msg }]);
          speakResponse(msg, false);
        }
        return;
      }

      if (fast.actionType === 'CONFIRM_ORDER') {
        if (voiceAutoOrderEnabled || fast.wakeWordDetected || fast.isRepeatOrSameOrder) {
          const placed = executeInstantConfirm(resolvedPay, fast.wakeWordDetected || isAwakeArmedRef.current);
          if (placed) {
            setIsAwakeArmed(false);
            isAwakeArmedRef.current = false;
            setLastGeminiFeedback(`✅ #${placed.id} कन्फर्म (₹${placed.totalAmount})`);
          }
          return;
        } else {
          setPendingConfirmFlag(true);
          const askText = pickLang(lang, {
            en: 'Added! Tap "Confirm Order" below or turn ON Auto-Order for 1-voice confirmation.',
            hi: 'आइटम जुड़ गए हैं! नीचे "ऑर्डर पक्का करें" दबाएँ या एक आवाज़ कन्फ़र्म के लिए Auto-Order चालू करें।',
            mr: 'तयार! खाली "ऑर्डर पक्की करा" वर क्लिक करा.',
            hinglish: 'Items ready hain! Neeche Confirm button dabayein ya Auto-Order ON karein.',
          });
          setLastGeminiFeedback(addedNames.length > 0 ? `✅ ${addedNames.join(', ')}` : askText);
          setMessages((prev) => [
            ...prev,
            {
              id: `ask_${Date.now()}`,
              role: 'assistant',
              text: askText,
              addedSummary: addedNames.length > 0 ? addedNames.join(', ') : undefined,
            },
          ]);
          speakResponse(askText, false);
          return;
        }
      }

      if (fast.actionType === 'ADD_ITEMS' && addedNames.length > 0) {
        setPendingConfirmFlag(true);
        triggerBasketDropAnimation(addedNames.join(', '));
        setLastGeminiFeedback(`✅ ${addedNames.join(', ')}`);
        const reply = pickLang(lang, {
          en: `Added to bag: ${addedNames.join(', ')}. Say "${customWakeName} confirm order" anytime to book!`,
          hi: `थैली में जोड़ दिया: ${addedNames.join(', ')}। कन्फ़र्म करने के लिए बोलें "${customWakeName} ऑर्डर कन्फर्म कर दो" या "भेज दो"।`,
          mr: `बॅगेत जोडले: ${addedNames.join(', ')}.`,
          hinglish: `Add ho gaya: ${addedNames.join(', ')}. Confirm karne ke liye bolein "${customWakeName} bhej do".`,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `fast_${Date.now()}`,
            role: 'assistant',
            text: reply,
            addedSummary: addedNames.join(', '),
          },
        ]);
        speakResponse(
          pickLang(lang, {
            en: `Added ${addedNames.length} item`,
            hi: `${addedNames.join(', ')} जोड़ दिया`,
            mr: `${addedNames.join(', ')} जोडले`,
            hinglish: `${addedNames.join(', ')} add ho gaya`,
          }),
          false
        );
        return;
      }

      if (fast.actionType === 'SET_PAYMENT' && fast.paymentMode !== 'NONE') {
        setPendingConfirmFlag(true);
        const reply =
          fast.paymentMode === 'upi_qr'
            ? pickLang(lang, {
                en: 'Kotak UPI QR selected. Tap Confirm or say "Confirm order".',
                hi: 'Kotak UPI QR चुना गया। कन्फ़र्म करने के लिए बोलें या बटन दबाएँ।',
              })
            : pickLang(lang, {
                en: 'Cash on Delivery selected. Tap Confirm or say "Confirm order".',
                hi: 'कैश ऑन डिलीवरी (COD) चुना गया। कन्फ़र्म करने के लिए बोलें या बटन दबाएँ।',
              });
        setMessages((prev) => [...prev, { id: `pay_${Date.now()}`, role: 'assistant', text: reply }]);
        speakResponse(reply, false);
        return;
      }
    }

    // 2. STREAMING CONVERSATIONAL GEMINI AI PATH (SSE tokens + early sentence-by-sentence voice)
    const abortCtrl = new AbortController();
    dialogAbortRef.current = abortCtrl;
    setIsSending(true);

    const streamMsgId = `stream_${Date.now()}`;
    let streamBubbleInserted = false;
    let streamedText = '';
    let spokenCursor = 0;
    let firstSentenceSpoken = false;

    const flushSpokenSentences = (isFinalFlush: boolean) => {
      if (!isVoiceOutputOn) return;
      let remaining = streamedText.slice(spokenCursor);
      while (remaining.length > 0) {
        const match = remaining.match(/[।.!?]\s+|\n/);
        if (match && match.index !== undefined) {
          const endIdx = match.index + match[0].length;
          const sentence = remaining.slice(0, endIdx).trim();
          spokenCursor += endIdx;
          remaining = streamedText.slice(spokenCursor);
          if (sentence.length >= 8 || firstSentenceSpoken) {
            enqueueSpeechChunk(sentence, !firstSentenceSpoken);
            firstSentenceSpoken = true;
          }
        } else {
          break;
        }
      }
      if (isFinalFlush) {
        const tail = streamedText.slice(spokenCursor).trim();
        if (tail) {
          enqueueSpeechChunk(tail, !firstSentenceSpoken);
          firstSentenceSpoken = true;
        }
        spokenCursor = streamedText.length;
      }
    };

    try {
      const cartSummary = [
        ...Object.entries(produceCart).map(([id, qty]) => `${id}:${qty}`),
        ...Object.entries(accessoryCart).map(([id, qty]) => `${id}:${qty}`),
      ];

      const res = await fetch('/api/ai/dialog-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortCtrl.signal,
        body: JSON.stringify({
          message: query,
          history: messages.slice(-4).map((m) => ({ role: m.role, text: m.text })),
          lang,
          catalogSummary: aiCatalogSummary,
          cartSummary,
          ordersHistory: aiRecentOrders,
          familyPreferences: aiFamilyContext,
          seasonContext: currentSeasonLabel,
          voiceAutoOrderEnabled,
          userSummary: {
            name: user.name || 'Customer',
            isLoggedIn: user.isLoggedIn,
            walletBalance: user.walletBalance || 0,
            referralCode: user.referralCode || 'TAZA-SHARE',
            cartTotal: liveCartTotal,
            cartCount: totalCartItemCount,
            savingsSummary: aiSavingsSummary,
            latestOrder: orders.find((o) => !o.isSampleOrder)
              ? {
                  id: orders.find((o) => !o.isSampleOrder)!.id,
                  status: orders.find((o) => !o.isSampleOrder)!.status,
                  totalAmount: orders.find((o) => !o.isSampleOrder)!.totalAmount,
                }
              : null,
          },
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('AI Assistant stream unavailable');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let sseBuffer = '';
      let streamDoneAction: any = null;
      let finalReplyFromDone = '';

      const applyStreamChunkToUi = (txt: string) => {
        setLastGeminiFeedback(txt);
        if (!streamBubbleInserted) {
          streamBubbleInserted = true;
          setMessages((prev) => [
            ...prev,
            { id: streamMsgId, role: 'assistant', text: txt },
          ]);
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === streamMsgId ? { ...m, text: txt } : m))
          );
        }
      };

      const processSseBlock = (block: string) => {
        if (!block.trim()) return;
        let eventName = 'message';
        let dataRaw = '';
        const lines = block.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataRaw += (dataRaw ? '\n' : '') + line.slice(5).trim();
          }
        }
        if (!dataRaw) return;
        const payload = JSON.parse(dataRaw);

        if (eventName === 'delta' && typeof payload.text === 'string') {
          streamedText += payload.text;
          applyStreamChunkToUi(streamedText);
          flushSpokenSentences(false);
        } else if (eventName === 'done') {
          if (typeof payload.replyText === 'string' && payload.replyText.trim()) {
            finalReplyFromDone = payload.replyText.trim();
            streamedText = finalReplyFromDone;
          }
          streamDoneAction = payload.action || {};
        } else if (eventName === 'error') {
          throw new Error(payload.error || 'Voice assistant error');
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        let sepIdx = sseBuffer.indexOf('\n\n');
        while (sepIdx !== -1) {
          const block = sseBuffer.slice(0, sepIdx);
          sseBuffer = sseBuffer.slice(sepIdx + 2);
          processSseBlock(block);
          sepIdx = sseBuffer.indexOf('\n\n');
        }
      }
      if (sseBuffer.trim()) {
        processSseBlock(sseBuffer);
      }

      if (abortCtrl.signal.aborted) return;

      const d = streamDoneAction || {
        actionType: 'NONE',
        itemsToAdd: [],
        itemsToRemove: [],
        paymentMode: 'NONE',
        proactiveTip: '',
      };

      const addedNames: string[] = [];
      if (Array.isArray(d.itemsToAdd) && d.itemsToAdd.length > 0) {
        d.itemsToAdd.forEach((entry: { itemId: string; qty: number; itemType: string }) => {
          const qty = Math.max(0.25, Number(entry.qty) || 1);
          if (entry.itemType === 'accessory') {
            const acc = accessoryById.get(entry.itemId);
            if (acc) {
              addAccessoryToCart(acc.id, Math.round(qty));
              addedNames.push(`${acc.name.en} × ${Math.round(qty)}`);
            }
          } else {
            const prod = produceById.get(entry.itemId);
            if (prod) {
              addProduceToCart(prod.id, qty);
              addedNames.push(
                `${resolveLocalizedProduceName(prod.name, lang, prod.id)} (${qty} ${prod.pricingUnit || 'kg'})`
              );
            }
          }
        });
      }

      if (Array.isArray(d.itemsToRemove) && d.itemsToRemove.length > 0) {
        d.itemsToRemove.forEach((entry: { itemId: string; qty?: number; itemType?: string }) => {
          if (entry.itemType === 'accessory') {
            removeAccessoryFromCart(entry.itemId);
          } else {
            removeProduceFromCart(entry.itemId);
          }
        });
      }

      if (d.actionType === 'CLEAR_CART') {
        clearAllCarts();
      } else if (d.actionType === 'REPEAT_LAST_ORDER') {
        const lastValid = orders.find(
          (o) => !o.isSampleOrder && (o.produceItems.length > 0 || o.accessoryItems.length > 0)
        );
        if (lastValid) {
          lastValid.produceItems.forEach((p) => addProduceToCart(p.produceId, p.quantityKg));
          lastValid.accessoryItems.forEach((a) => addAccessoryToCart(a.accessoryId, a.quantity));
        }
      } else if (d.actionType === 'CANCEL_ORDER') {
        const cancellable = orders.find(
          (o) => !o.isSampleOrder && o.status !== 'delivered' && o.status !== 'cancelled'
        );
        if (cancellable) cancelOrder(cancellable.id, 'Cancelled via AI Voice Assistant');
      } else if (d.actionType === 'SAVE_FAMILY_FAV' && d.familyPref?.itemId) {
        addFamilyPreference({
          relation: d.familyPref.relation || 'Family',
          name: d.familyPref.relation || 'Family',
          favoriteItemIds: [d.familyPref.itemId],
        });
      }

      if (d.targetLang) {
        setLang(d.targetLang);
      }

      if (d.voiceTuning && typeof d.voiceTuning === 'object') {
        const vt = d.voiceTuning;
        const patch: Partial<VoiceTuningSettings> = {};
        if (vt.micSensitivity === 'high') {
          patch.micSensitivity = 'high';
          patch.micGain = 85;
        } else if (vt.micSensitivity === 'low_noise') {
          patch.micSensitivity = 'low_noise';
          patch.micGain = 38;
        } else if (vt.micSensitivity === 'balanced') {
          patch.micSensitivity = 'balanced';
          patch.micGain = 62;
        }
        if (vt.pausePreset === 'fast') {
          patch.pausePreset = 'fast';
          patch.pauseCommitMs = 700;
        } else if (vt.pausePreset === 'relaxed') {
          patch.pausePreset = 'relaxed';
          patch.pauseCommitMs = 2000;
        } else if (vt.pausePreset === 'normal') {
          patch.pausePreset = 'normal';
          patch.pauseCommitMs = 1300;
        }
        if (['Aoede', 'Kore', 'Puck', 'Fenrir'].includes(vt.ttsVoice)) {
          patch.ttsVoice = vt.ttsVoice;
        }
        if ([0.9, 1.0, 1.15].includes(Number(vt.ttsRate))) {
          patch.ttsRate = Number(vt.ttsRate) as 0.9 | 1.0 | 1.15;
        }
        if (Object.keys(patch).length > 0) updateVoiceTuning(patch);
      }

      if (d.modalTarget === 'voice_tuning') {
        setIsOpen(true);
        isOpenRef.current = true;
        setShowSensitivityPanel(true);
        setShowFamilyPanel(false);
      }

      if (
        d.navTab ||
        d.category !== undefined ||
        d.searchQuery !== undefined ||
        d.openCart ||
        d.closeCart ||
        d.themeMode ||
        (d.modalTarget && d.modalTarget !== 'voice_tuning')
      ) {
        window.dispatchEvent(
          new CustomEvent('tazamandi-voice-nav', {
            detail: {
              tab: d.navTab || undefined,
              category: d.category || undefined,
              search: d.searchQuery !== undefined && d.searchQuery !== '' ? d.searchQuery : undefined,
              openCart: Boolean(d.openCart),
              closeCart: Boolean(d.closeCart),
              themeMode: d.themeMode || undefined,
              openModal: d.modalTarget && d.modalTarget !== 'voice_tuning' ? d.modalTarget : undefined,
            },
          })
        );
      }

      const resolvedPay: 'upi_qr' | 'cod' =
        d.paymentMode === 'upi_qr' || d.paymentMode === 'cod' ? d.paymentMode : selectedPayMode;
      if (d.paymentMode === 'upi_qr' || d.paymentMode === 'cod') {
        setSelectedPayMode(d.paymentMode);
      }

      const hasItemsNow = totalCartItemCount > 0 || addedNames.length > 0;
      let placedOrder: CustomerOrder | undefined;
      if (d.actionType === 'CONFIRM_ORDER' && voiceAutoOrderEnabled && hasItemsNow) {
        placedOrder = placeOrder(d.deliverySlot || '10:00 AM - 12:00 PM', resolvedPay);
        setPendingConfirmFlag(false);
      } else if (
        d.actionType === 'ASK_CONFIRM' ||
        (d.actionType === 'CONFIRM_ORDER' && !voiceAutoOrderEnabled && hasItemsNow) ||
        addedNames.length > 0
      ) {
        setPendingConfirmFlag(true);
      }

      const finalText = finalReplyFromDone || streamedText.trim() || 'Done!';
      const finalizedMsg: DialogMessage = {
        id: streamMsgId,
        role: 'assistant',
        text: finalText,
        proactiveTip: d.proactiveTip || undefined,
        addedSummary: addedNames.length > 0 ? addedNames.join(', ') : undefined,
        confirmedOrder: placedOrder,
        paymentMode: placedOrder ? resolvedPay : undefined,
      };

      if (!streamBubbleInserted) {
        setMessages((prev) => [...prev, finalizedMsg]);
      } else {
        setMessages((prev) => prev.map((m) => (m.id === streamMsgId ? finalizedMsg : m)));
      }
      if (addedNames.length > 0) {
        triggerBasketDropAnimation(addedNames.join(', '));
      }
      setLastGeminiFeedback(addedNames.length > 0 ? `✅ ${addedNames.join(', ')}` : finalText);

      // Renew active voice window so multi-turn conversation stays warm without re-speaking wake word
      if (isAwakeArmedRef.current) {
        armActiveCommandWindow();
      }

      // Flush remaining trailing sentence into queued speech without cutting off first spoken sentence
      flushSpokenSentences(true);
    } catch (err: any) {
      if (err?.name === 'AbortError' || abortCtrl.signal.aborted) {
        return;
      }

      // Offline / weak-network resilient fallback: search local catalog words before failing!
      const words = query
        .toLowerCase()
        .split(/[\s,]+/)
        .filter((w) => w.length >= 3);
      const localHits = produceList.filter(
        (p) =>
          p.isAvailable !== false &&
          words.some(
            (w) =>
              p.name.en.toLowerCase().includes(w) ||
              p.name.hi.toLowerCase().includes(w) ||
              (p.name.hinglish || '').toLowerCase().includes(w)
          )
      );
      if (localHits.length > 0) {
        const added: string[] = [];
        localHits.slice(0, 4).forEach((prod) => {
          addProduceToCart(prod.id, 1);
          added.push(`${resolveLocalizedProduceName(prod.name, lang, prod.id)} (1 ${prod.pricingUnit || 'kg'})`);
        });
        const msg = pickLang(lang, {
          en: `Offline match added: ${added.join(', ')}`,
          hi: `थैली में जुड़ा: ${added.join(', ')}`,
          mr: `बॅगेत जोडले: ${added.join(', ')}`,
        });
        setPendingConfirmFlag(true);
        setLastGeminiFeedback(`✅ ${added.join(', ')}`);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== streamMsgId),
          { id: `loc_${Date.now()}`, role: 'assistant', text: msg, addedSummary: added.join(', ') },
        ]);
        speakResponse(msg, false);
      } else {
        const fallbackErr =
          err.message ||
          pickLang(lang, {
            en: 'Please say the vegetable/fruit name clearly or tap quick items below.',
            hi: 'कृपया सब्ज़ी/फल का नाम साफ़ बोलें या नीचे 1-टैप आइटम से जोड़ें।',
            mr: 'कृपया भाजी/फळाचे नाव स्पष्ट बोला किंवा खाली टाइप करा.',
          });
        setLastGeminiFeedback(fallbackErr);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== streamMsgId),
          {
            id: `err_${Date.now()}`,
            role: 'assistant',
            text: fallbackErr,
          },
        ]);
      }
    } finally {
      if (dialogAbortRef.current === abortCtrl) {
        dialogAbortRef.current = null;
      }
      setIsSending(false);
    }
  };

  handleSendMessageRef.current = handleSendMessage;

  const handleSaveFamilyMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!famRelation.trim() || famFavItemIds.length === 0) return;
    addFamilyPreference({
      relation: famRelation.trim(),
      name: famName.trim() || famRelation.trim(),
      favoriteItemIds: famFavItemIds,
    });
    setFamName('');
  };

  const quickVoicePrompts = useMemo(() => {
    const firstFam = familyPreferences[0];
    const famChip = firstFam
      ? pickLang(lang, {
          en: `Add ${firstFam.relation}'s favorite items`,
          hi: `${firstFam.relation} की पसंद की सब्ज़ी जोड़ें`,
          mr: `${firstFam.relation} च्या आवडीच्या भाज्या जोडा`,
          hinglish: `${firstFam.relation} ki pasand ki sabzi add karo`,
        })
      : pickLang(lang, {
          en: 'Add 2 kg potato & 1 kg tomato',
          hi: '2 किलो आलू और 1 किलो टमाटर जोड़ें',
          mr: '२ किलो बटाटे आणि १ किलो टोमॅटो जोडा',
          hinglish: '2 kilo aloo aur 1 kilo tamatar add karo',
        });

    return [
      famChip,
      pickLang(lang, {
        en: 'What is fresh this season?',
        hi: 'इस मौसम में क्या ताज़ा है?',
        mr: 'या हंगामात काय ताजे आहे?',
        hinglish: 'Is season me kya fresh hai?',
      }),
      pickLang(lang, {
        en: 'Confirm my order with UPI QR',
        hi: 'UPI QR से ऑर्डर कन्फ़र्म करें',
        mr: 'UPI QR ने ऑर्डर कन्फर्म करा',
        hinglish: 'UPI QR se order confirm karo',
      }),
    ];
  }, [familyPreferences, lang]);

  return (
    <div ref={voiceVisualRootRef}>
      {/* Hidden silent WAV stream element: powers iOS Dynamic Island & Android Media Notification capsule */}
      {silentAudioUrl && (
        <audio
          ref={silentAudioRef}
          src={silentAudioUrl}
          loop
          playsInline
          preload="auto"
          className="hidden"
          aria-hidden="true"
        />
      )}

      {/* Wake-Word Instant Order Confirmation Banner (Dynamic Animated Order Dispatch Card) */}
      {wakeBannerOrder && (
        <div className="fixed top-28 md:top-20 right-3 left-3 sm:left-auto sm:w-96 z-50 bg-linear-to-br from-emerald-950 via-teal-950 to-slate-950 text-white rounded-3xl p-4 shadow-2xl border border-emerald-400/50 space-y-3 animate-order-stage overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" className="animate-check-draw" />
                </svg>
                <Leaf className="w-3 h-3 text-amber-300 absolute -top-1 -right-1 animate-harvest-spark" />
              </div>
              <div>
                <div className="text-xs font-black tracking-tight">
                  {pickLang(lang, {
                    en: `Order #${wakeBannerOrder.id} Dispatched to APMC Queue`,
                    hi: `ऑर्डर #${wakeBannerOrder.id} ताज़ा मंडी बैच में कन्फ़र्म!`,
                    mr: `ऑर्डर #${wakeBannerOrder.id} कन्फर्म!`,
                    hinglish: `Order #${wakeBannerOrder.id} Confirm!`,
                  })}
                </div>
                <div className="text-[11px] text-emerald-200 font-mono-nums">
                  ₹{wakeBannerOrder.totalAmount} · {wakeBannerOrder.totalProduceWeightKg} kg
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWakeBannerOrder(null)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Animated Van Dispatch Progress Track */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 space-y-1.5">
            <div className="relative h-2 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full w-3/4 bg-linear-to-r from-emerald-400 to-amber-300 rounded-full" />
            </div>
            <div className="relative h-4 flex items-center">
              <div className="animate-van-dispatch inline-flex items-center gap-1 text-[10px] font-bold text-amber-300">
                <Truck className="w-3.5 h-3.5" />
                <span>4:00 AM Vashi APMC Lot</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                cancelOrder(wakeBannerOrder.id, 'Cancelled immediately from voice banner');
                setWakeBannerOrder(null);
              }}
              className="flex-1 py-2 px-2.5 rounded-xl bg-pink-600/80 hover:bg-pink-600 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>
                {pickLang(lang, {
                  en: 'Cancel Order',
                  hi: 'रद्द करें',
                  mr: 'रद्द करा',
                })}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setWakeBannerOrder(null);
              }}
              className="flex-1 py-2 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black cursor-pointer"
            >
              {pickLang(lang, {
                en: 'View Bill / QR',
                hi: 'बिल / QR देखें',
                mr: 'बिल / QR पहा',
              })}
            </button>
          </div>
        </div>
      )}

      {/* TOP ACTIVE COMMAND HUD (Only shown when user wakes "ताज़ा मंडी" to speak — zero idle clutter) */}
      {!isOpen && isAwakeArmed && (
        <div className="fixed top-[60px] lg:top-2 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center max-w-[94vw]">
            <div className="w-[92vw] sm:w-[420px] rounded-3xl bg-slate-950/95 text-white border border-emerald-400/65 shadow-2xl shadow-emerald-950/50 p-3.5 sm:p-4 backdrop-blur-xl space-y-2.5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={toggleListening}
                    title="Tap to speak again right now"
                    className="relative w-9 h-9 rounded-2xl bg-linear-to-br from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30 cursor-pointer"
                  >
                    <Sparkles className="w-4.5 h-4.5" />
                    <span className="voice-reactive-ring absolute -inset-1 rounded-2xl border-2 border-emerald-400/80 pointer-events-none" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black tracking-tight text-emerald-300 truncate">
                        {isUserSpeaking
                          ? pickLang(lang, {
                              en: `"${customWakeName}" Hearing you...`,
                              hi: `"${customWakeName}" आपकी आवाज़ ले रहा है...`,
                              mr: `"${customWakeName}" तुमचा आवाज घेत आहे...`,
                              hinglish: `"${customWakeName}" Aapki Aawaz Le Raha Hai...`,
                            })
                          : pickLang(lang, {
                              en: `"${customWakeName}" Ready — Speak`,
                              hi: `"${customWakeName}" तैयार — अब बोलिए`,
                              mr: `"${customWakeName}" तयार — बोला`,
                              hinglish: `"${customWakeName}" Ready — Boliye`,
                            })}
                      </span>
                      {/* Live Speech-Only Wavelength Equalizer (still flat when quiet, dances ONLY on spoken voice) */}
                      <span className="flex items-center gap-0.5 h-4 shrink-0" aria-hidden="true">
                        <span className="voice-wave-bar bg-emerald-400" style={{ '--tm-bar': 'var(--tm-b0, 0)' } as React.CSSProperties} />
                        <span className="voice-wave-bar bg-teal-300" style={{ '--tm-bar': 'var(--tm-b1, 0)' } as React.CSSProperties} />
                        <span className="voice-wave-bar bg-cyan-300" style={{ '--tm-bar': 'var(--tm-b2, 0)' } as React.CSSProperties} />
                        <span className="voice-wave-bar bg-teal-300" style={{ '--tm-bar': 'var(--tm-b3, 0)' } as React.CSSProperties} />
                        <span className="voice-wave-bar bg-emerald-400" style={{ '--tm-bar': 'var(--tm-b4, 0)' } as React.CSSProperties} />
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300 truncate">
                      {pickLang(lang, {
                        en: 'Waves move only when mic picks up your voice',
                        hi: 'वेवलेंथ तभी चलेगी जब माइक आपकी आवाज़ पकड़ेगा',
                        mr: 'आवाज पकडला तरच वेव्हलेन्थ दिसेल',
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isListening && (
                    <button
                      type="button"
                      onClick={toggleListening}
                      className="px-2 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{pickLang(lang, { en: 'Send', hi: 'भेजें' })}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={turnMicCompletelyOff}
                    title={pickLang(lang, {
                      en: 'Turn OFF always-listening mic',
                      hi: 'हमेशा सुनने वाला माइक बंद करें',
                    })}
                    className="px-2 py-1 rounded-xl bg-pink-500/20 hover:bg-pink-600 text-pink-200 hover:text-white border border-pink-400/40 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <MicOff className="w-3 h-3" />
                    <span>{pickLang(lang, { en: 'Mic Off', hi: 'बंद' })}</span>
                  </button>
                  {supportsPip && (
                    <button
                      type="button"
                      onClick={openFloatingBubble}
                      title="Pop-out Floating Bubble"
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/30 text-emerald-200 cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAwakeArmed(false);
                      isAwakeArmedRef.current = false;
                      setWakeLiveCaption('');
                      setLastGeminiFeedback('');
                    }}
                    aria-label="Minimize Dynamic Island Bubble"
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900/95 border border-slate-800 px-3 py-2.5 space-y-2">
                <div className="text-xs font-semibold text-white leading-snug">
                  🗣️{' '}
                  {wakeLiveCaption ||
                    pickLang(lang, {
                      en: 'Try: "2 kg potato 1 kg tomato 250g coriander confirm order"',
                      hi: 'जैसे बोलें: "2 किलो आलू 1 किलो प्याज आधा किलो टमाटर भेज दो"',
                      mr: 'उदा. "२ किलो बटाटे १ किलो कांदे पाठवा"',
                    })}
                </div>
                {lastGeminiFeedback && (
                  <div className="text-[11px] font-bold text-emerald-300 border-t border-slate-800 pt-1.5">
                    {lastGeminiFeedback}
                  </div>
                )}

                {/* Layer-3 Resilient Fallback: 1-Tap Popular Staples + Instant Type Input */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/80">
                  {[
                    { label: '+1kg आलू', cmd: '1 kilo aloo' },
                    { label: '+1kg प्याज', cmd: '1 kilo pyaz' },
                    { label: '+1kg टमाटर', cmd: '1 kilo tamatar' },
                    { label: '+½kg धनिया', cmd: '500 gram dhaniya' },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleSendMessage(chip.cmd)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-emerald-800 text-[10.5px] font-bold text-emerald-200 whitespace-nowrap cursor-pointer border border-slate-700"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!geminiQuickInput.trim()) return;
                    const val = geminiQuickInput.trim();
                    setGeminiQuickInput('');
                    handleSendMessage(val);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={geminiQuickInput}
                    onChange={(e) => setGeminiQuickInput(e.target.value)}
                    placeholder={pickLang(lang, {
                      en: 'Or type fast (e.g. 2kg potato)...',
                      hi: 'या लिखें (जैसे: 2 किलो आलू भेज दो)...',
                    })}
                    className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-800 text-white placeholder:text-slate-400 text-[11px] focus:outline-emerald-400"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>
                    {totalCartItemCount > 0
                      ? `${totalCartItemCount} items · ₹${liveCartTotal}`
                      : pickLang(lang, { en: 'Bag empty', hi: 'थैली खाली' })}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {totalCartItemCount > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const placed = executeInstantConfirm('cod', true);
                          if (placed) {
                            setIsAwakeArmed(false);
                            isAwakeArmedRef.current = false;
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black cursor-pointer"
                      >
                        ✅ COD
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const placed = executeInstantConfirm('upi_qr', true);
                          if (placed) {
                            setIsAwakeArmed(false);
                            isAwakeArmedRef.current = false;
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black cursor-pointer"
                      >
                        ✅ UPI QR
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(true);
                      isOpenRef.current = true;
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold cursor-pointer"
                  >
                    {pickLang(lang, { en: 'Full Chat', hi: 'चैट' })}
                  </button>
                </div>
              </div>
            </div>
        </div>
      )}

      {/* Ultra-Compact Floating Voice Orb with 1-Tap Mic OFF / ON Control */}
      <div
        data-tour="voice-order-bubble"
        className={`fixed ${
          totalCartItemCount > 0 ? 'bottom-[74px] md:bottom-4' : 'bottom-16 md:bottom-4'
        } right-2.5 sm:right-4 z-40 flex items-center gap-1.5`}
      >
        <div className="liquid-glass-capsule rounded-full pl-1.5 pr-1.5 py-1 flex items-center gap-1.5 shadow-lg">
          <button
            type="button"
            onClick={() => {
              if (isSpeaking) {
                stopSpeakingNow(true);
                armActiveCommandWindow();
                return;
              }
              stopSpeakingNow(true);
              armActiveCommandWindow();
              if (!voiceWakeWordEnabled || wakeNeedsPermission) {
                requestMicPermissionAndWake();
              } else if (isListening) {
                toggleListening();
              } else {
                playWakeActivationChime(true);
                toggleListening();
              }
            }}
            aria-label={voiceWakeWordEnabled ? 'Talk with ताज़ाMandi Voice Mic' : 'Turn Mic ON'}
            title={
              voiceWakeWordEnabled
                ? pickLang(lang, {
                    en: 'Mic ON — tap to speak order',
                    hi: 'माइक चालू है — बोलने के लिए दबाएँ',
                  })
                : pickLang(lang, {
                    en: 'Mic is OFF — tap to turn ON voice ordering',
                    hi: 'माइक बंद है — चालू करने के लिए दबाएँ',
                  })
            }
            className="flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform pr-1"
          >
            <div className="relative shrink-0">
              <div
                className={`w-9 h-9 rounded-full p-[1.5px] ${
                  voiceWakeWordEnabled
                    ? 'liquid-glass-orb-ring'
                    : 'bg-slate-600/80'
                }`}
              >
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center shadow-inner ${
                    voiceWakeWordEnabled
                      ? 'bg-slate-950/90 text-amber-300'
                      : 'bg-slate-900 text-pink-300'
                  }`}
                >
                  {voiceWakeWordEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </div>
              </div>
              {/* Expands dynamically ONLY while user is actively speaking; calm & still when silent */}
              {voiceWakeWordEnabled && (
                <span className="voice-reactive-ring absolute -inset-1 rounded-full border-2 border-sky-300/95 pointer-events-none" />
              )}
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`text-[11px] font-display font-bold leading-none whitespace-nowrap ${
                  voiceWakeWordEnabled ? 'text-white' : 'text-pink-200'
                }`}
              >
                {isSpeaking
                  ? pickLang(lang, { en: 'Stop', hi: 'रुकें', mr: 'थांबा' })
                  : !voiceWakeWordEnabled
                  ? pickLang(lang, { en: 'Mic Off', hi: 'माइक बंद', hinglish: 'Mic Off' })
                  : wakeNeedsPermission && !isWakeActive
                  ? pickLang(lang, { en: 'Mic On', hi: 'माइक ऑन', mr: 'माइक ऑन' })
                  : isUserSpeaking
                  ? pickLang(lang, { en: 'Listening', hi: 'सुन रहा', mr: 'ऐकत आहे' })
                  : pickLang(lang, { en: 'TaazaMandi', hi: 'ताज़ा मंडी', mr: 'ताजा मंडी' })}
              </span>
              {voiceWakeWordEnabled && (isWakeActive || isAwakeArmed || isListening) && !isSpeaking && (
                <span className="flex items-center gap-0.5 h-3 shrink-0" aria-hidden="true">
                  <span className="voice-wave-bar bg-sky-300" style={{ '--tm-bar': 'var(--tm-b0, 0)' } as React.CSSProperties} />
                  <span className="voice-wave-bar bg-emerald-300" style={{ '--tm-bar': 'var(--tm-b1, 0)' } as React.CSSProperties} />
                  <span className="voice-wave-bar bg-amber-300" style={{ '--tm-bar': 'var(--tm-b2, 0)' } as React.CSSProperties} />
                </span>
              )}
            </div>
          </button>

          {voiceWakeWordEnabled && (
            <button
              type="button"
              onClick={turnMicCompletelyOff}
              aria-label="Turn Off Always-Listening Mic"
              title={pickLang(lang, {
                en: 'Turn OFF always-listening mic',
                hi: 'माइक बंद करें (जब चाहें फिर चालू करें)',
                hinglish: 'Mic band karein',
              })}
              className="w-7 h-7 rounded-full bg-pink-500/25 hover:bg-pink-600 text-pink-200 hover:text-white border border-pink-400/40 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <MicOff className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversational Voice Dialog Modal (Auto-opens on "ताज़ा मंडी" wake word) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-xl h-[88vh] sm:h-[82vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Dialog Header */}
            <div className="p-4 bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                  <span className="voice-reactive-ring absolute -inset-1 rounded-xl border-2 border-emerald-400 pointer-events-none" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-black font-display truncate">
                    {pickLang(lang, {
                      en: 'ताज़ाMandi Voice Order Hub',
                      hi: 'ताज़ाMandi वॉइस ऑर्डर सेक्शन',
                      mr: 'ताज़ाMandi व्हॉइस ऑर्डर सेक्शन',
                      hinglish: 'ताज़ाMandi Voice Order Section',
                    })}
                  </h2>
                  <p className="text-[11px] text-emerald-200 truncate">
                    {isSpeaking
                      ? pickLang(lang, { en: 'Speaking...', hi: 'बोल रहा है...', mr: 'बोलत आहे...' })
                      : isListening || (isWakeActive && isAwakeArmed)
                      ? pickLang(lang, {
                          en: '🎙️ Listening live — speak items & say "confirm"',
                          hi: '🎙️ सक्रिय: बोलिए — सब्ज़ी व "भेज दो / कन्फ़र्म" बोलते ही ऑर्डर पक्का!',
                          mr: '🎙️ सक्रिय: बोला आणि "कन्फर्म" म्हणताच ऑर्डर बुक!',
                        })
                      : pickLang(lang, {
                          en: 'Voice ordering · Family memory · Seasonal helper',
                          hi: 'बोलकर ऑर्डर · तुरंत कन्फ़र्म · मौसमी सुझाव',
                          mr: 'आवाजातून ऑर्डर · त्वरित कन्फर्म',
                          hinglish: 'Voice order · Instant confirm · Season tips',
                        })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {supportsPip && (
                  <button
                    type="button"
                    onClick={openFloatingBubble}
                    title={pickLang(lang, {
                      en: 'Pop-out Floating Bubble',
                      hi: 'स्क्रीन के ऊपर तैरता हुआ बबल खोलें',
                    })}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isPipOpen
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-white/10 hover:bg-white/20 text-emerald-200'
                    }`}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const next = !showSensitivityPanel;
                    setShowSensitivityPanel(next);
                    if (next) setShowFamilyPanel(false);
                  }}
                  className={`px-2 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
                    showSensitivityPanel
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                  title={pickLang(lang, {
                    en: 'Voice Sensitivity & Natural Voice Studio',
                    hi: 'माइक सेंसिटिविटी और प्राकृतिक आवाज़ सेटिंग',
                  })}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {pickLang(lang, { en: 'Sensitivity', hi: 'सेंसिटिविटी' })}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = !showFamilyPanel;
                    setShowFamilyPanel(next);
                    if (next) setShowSensitivityPanel(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
                    showFamilyPanel
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {pickLang(lang, { en: 'Family', hi: 'परिवार', mr: 'कुटुंब', hinglish: 'Family' })} (
                    {familyPreferences.length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleWakeMode}
                  className={`px-2 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    voiceWakeWordEnabled
                      ? 'bg-emerald-500/20 hover:bg-pink-600 text-emerald-200 hover:text-white border border-emerald-400/40'
                      : 'bg-pink-600 hover:bg-emerald-600 text-white border border-pink-400/50'
                  }`}
                  title={
                    voiceWakeWordEnabled
                      ? pickLang(lang, { en: 'Turn Mic OFF', hi: 'माइक बंद करें' })
                      : pickLang(lang, { en: 'Turn Mic ON', hi: 'माइक चालू करें' })
                  }
                >
                  {voiceWakeWordEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  <span className="hidden xs:inline">
                    {voiceWakeWordEnabled
                      ? pickLang(lang, { en: 'Mic On', hi: 'माइक चालू' })
                      : pickLang(lang, { en: 'Mic Off', hi: 'माइक बंद' })}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = !isVoiceOutputOn;
                    setIsVoiceOutputOn(next);
                    if (!next) {
                      activeAudioRef.current?.pause();
                      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title={isVoiceOutputOn ? 'Mute Voice' : 'Unmute Voice'}
                >
                  {isVoiceOutputOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    isOpenRef.current = false;
                  }}
                  aria-label="Close Voice Order Section"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customer-Controlled Voice Auto-Order & Wake-Word Permission Bar */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <ShieldCheck
                      className={`w-4 h-4 shrink-0 ${
                        voiceAutoOrderEnabled ? 'text-emerald-600' : 'text-amber-500'
                      }`}
                    />
                    <span className="truncate">
                      {pickLang(lang, {
                        en: 'Instant 1-Voice Order Confirm (Fast Mode)',
                        hi: 'सिर्फ 1 आवाज़ में तुरंत ऑर्डर कन्फ़र्म (Fast)',
                        mr: '१ आवाजात त्वरित ऑर्डर कन्फर्म',
                        hinglish: '1-Voice Instant Order Confirm',
                      })}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 truncate">
                    {voiceAutoOrderEnabled
                      ? pickLang(lang, {
                          en: 'ON: Saying "confirm" places your order immediately without tapping.',
                          hi: 'चालू: "कन्फ़र्म कर दो" बोलते ही बिना बटन दबाए तुरंत ऑर्डर पक्का होगा।',
                          mr: 'सुरू: "कन्फर्म" म्हणताच ऑर्डर लगेच बुक होईल.',
                        })
                      : pickLang(lang, {
                          en: 'OFF: AI adds items & shows 1-tap Confirm button.',
                          hi: 'बंद: AI सामान थैली में जोड़कर 1-टैप बटन दिखाएगा।',
                          mr: 'बंद: AI वस्तू बॅगेत जोडून बटण दाखवेल.',
                        })}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={voiceAutoOrderEnabled}
                  onClick={() => setVoiceAutoOrderEnabled(!voiceAutoOrderEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    voiceAutoOrderEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
                      voiceAutoOrderEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Custom Wake Name & Continuous Mic Permission Switch */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/70 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 dark:text-slate-100 flex-wrap">
                      <Zap className={`w-3.5 h-3.5 shrink-0 ${voiceWakeWordEnabled ? 'text-amber-500' : 'text-slate-400'}`} />
                      <span className="truncate">
                        {pickLang(lang, {
                          en: `Wake Name: "${customWakeName}"`,
                          hi: `एक्टिवेशन नाम: "${customWakeName}"`,
                          mr: `वेक नाव: "${customWakeName}"`,
                        })}
                      </span>
                      {isAwakeArmed ? (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-black animate-pulse">
                          ARMED · बोलिए
                        </span>
                      ) : isWakeActive ? (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black">
                          MIC LIVE
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setIsEditingWakeName((prev) => !prev)}
                        className="px-1.5 py-0.5 rounded bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 text-[9.5px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        {isEditingWakeName
                          ? pickLang(lang, { en: 'Done', hi: 'ठीक' })
                          : pickLang(lang, { en: 'Change Name', hi: 'नाम बदलें' })}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      {pickLang(lang, {
                        en: `Open or minimized: say "${customWakeName}" or press lockscreen/headset Play button to order hands-free. When Android completely kills a closed app, tap the pinned Notification or Home-Screen "ताज़ा मंडी बोलें" shortcut to launch straight into listening.`,
                        hi: `ऐप खुला या मिनिमाइज़ हो: "${customWakeName}" बोलते ही (या लॉकस्क्रीन/ब्लूटूथ Play बटन से) बिना हाथ लगाए फ़टाफ़ट कई आइटम ऑर्डर कर सकते हैं। अगर फ़ोन से ऐप पूरी तरह Close (Kill) हो जाए, तो ऊपर नोटिफ़िकेशन या होम-स्क्रीन शॉर्टकट दबाते ही सीधा माइक खुल जाएगा।`,
                        mr: `अ‍ॅप सुरू किंवा मिनिमाइझ असताना "${customWakeName}" म्हणताच माइक सुरू होईल; बंद असल्यास नोटिफिकेशन किंवा शॉर्टकट टॅप करून लगेच ऑर्डर बोला.`,
                      })}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={voiceWakeWordEnabled}
                    onClick={handleToggleWakeMode}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      voiceWakeWordEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
                        voiceWakeWordEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {isEditingWakeName && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={wakeNameDraft}
                        onChange={(e) => setWakeNameDraft(e.target.value)}
                        placeholder={pickLang(lang, {
                          en: 'e.g. Taaza Mandi, Raja, Subah',
                          hi: 'जैसे: ताज़ा मंडी, मंडी भाई, सुबह, मार्को',
                        })}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const clean = wakeNameDraft.trim();
                          if (clean.length >= 2) {
                            setCustomWakeName(clean);
                            setIsEditingWakeName(false);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-black cursor-pointer"
                      >
                        {pickLang(lang, { en: 'Save', hi: 'सेव' })}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['ताज़ा मंडी', 'मंडी भाई', 'मार्को', 'सुबह', 'राजा'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setWakeNameDraft(preset);
                            setCustomWakeName(preset);
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer ${
                            customWakeName === preset
                              ? 'bg-amber-400 text-slate-950 border-amber-500'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Expandable Voice Sensitivity & Natural TTS Studio Panel */}
            {showSensitivityPanel && (
              <div className="p-3.5 bg-emerald-50/70 dark:bg-slate-850 border-b border-emerald-200 dark:border-slate-800 space-y-3 shrink-0 max-h-72 overflow-y-auto text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-slate-100">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>
                      {pickLang(lang, {
                        en: 'Voice Sensitivity & Natural TTS Studio',
                        hi: 'वॉइस सेंसिटिविटी और प्राकृतिक आवाज़ स्टूडियो',
                        hinglish: 'Voice Sensitivity & Natural Voice Studio',
                      })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateVoiceTuning(DEFAULT_VOICE_TUNING);
                    }}
                    className="text-[10.5px] font-bold text-slate-500 hover:text-emerald-700 underline cursor-pointer"
                  >
                    {pickLang(lang, { en: 'Reset Default', hi: 'डिफ़ॉल्ट रीसेट' })}
                  </button>
                </div>

                {/* 1. Live Mic Noise Gate & Sensitivity Calibration */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-800 dark:text-slate-200">
                      {pickLang(lang, {
                        en: '1. Mic Pickup Sensitivity',
                        hi: '1. माइक आवाज़ पकड़ (Mic Sensitivity)',
                        hinglish: '1. Mic Sensitivity Calibration',
                      })}
                    </span>
                    <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                      {voiceTuning.micGain}%
                    </span>
                  </div>

                  {/* Live Hardware Acoustic Meter + Threshold Needle */}
                  <div className="relative h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/80 dark:border-slate-700">
                    <div
                      className="h-full bg-linear-to-r from-emerald-500 via-teal-400 to-amber-400 transition-[width] duration-75"
                      style={{ width: 'var(--tm-meter-pct, 0%)' }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-600 dark:bg-rose-400"
                      style={{ left: 'var(--tm-gate-pct, 22%)' }}
                      title="Active Trigger Threshold"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        {
                          id: 'low_noise' as const,
                          gain: 38,
                          en: 'Noisy Room',
                          hi: 'शोर कम करें',
                        },
                        {
                          id: 'balanced' as const,
                          gain: 62,
                          en: 'Balanced',
                          hi: 'सामान्य (संतुलित)',
                        },
                        {
                          id: 'high' as const,
                          gain: 85,
                          en: 'Ultra-Sensitive',
                          hi: 'हल्की आवाज़ भी पकड़ें',
                        },
                      ] as const
                    ).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          updateVoiceTuning({ micSensitivity: preset.id, micGain: preset.gain })
                        }
                        className={`py-1.5 px-2 rounded-lg text-[10.5px] font-bold border transition-colors cursor-pointer ${
                          voiceTuning.micSensitivity === preset.id
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
                        }`}
                      >
                        {pickLang(lang, { en: preset.en, hi: preset.hi })}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min={20}
                    max={95}
                    step={1}
                    value={voiceTuning.micGain}
                    onChange={(e) => {
                      const g = Number(e.target.value);
                      const micSensitivity: MicSensitivityPreset =
                        g <= 46 ? 'low_noise' : g >= 76 ? 'high' : 'balanced';
                      updateVoiceTuning({ micGain: g, micSensitivity });
                    }}
                    aria-label="Fine Mic Sensitivity"
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                </div>

                {/* 2. Speech Pause Tolerance */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-800 dark:text-slate-200">
                      {pickLang(lang, {
                        en: '2. Speech Pause Tolerance (Cutoff Wait)',
                        hi: '2. बोलने में रुकने का समय (Pause Wait)',
                      })}
                    </span>
                    <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                      {(voiceTuning.pauseCommitMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'fast' as const, ms: 700, en: 'Fast (0.7s)', hi: 'तेज़ (0.7s)' },
                        { id: 'normal' as const, ms: 1300, en: 'Normal (1.3s)', hi: 'सामान्य (1.3s)' },
                        { id: 'relaxed' as const, ms: 2000, en: 'Relaxed (2.0s)', hi: 'आराम से (2.0s)' },
                      ] as const
                    ).map((pOpt) => (
                      <button
                        key={pOpt.id}
                        type="button"
                        onClick={() =>
                          updateVoiceTuning({ pausePreset: pOpt.id, pauseCommitMs: pOpt.ms })
                        }
                        className={`py-1.5 px-2 rounded-lg text-[10.5px] font-bold border transition-colors cursor-pointer ${
                          voiceTuning.pausePreset === pOpt.id
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {pickLang(lang, { en: pOpt.en, hi: pOpt.hi })}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Natural Human AI TTS Persona & Speaking Pace */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-800 dark:text-slate-200">
                      {pickLang(lang, {
                        en: '3. Natural Human AI Voice & Speed',
                        hi: '3. असली मानवीय आवाज़ व बोलने की गति',
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsVoiceOutputOn(true);
                        speakResponse(
                          pickLang(lang, {
                            en: `Namaste! I am speaking in the ${voiceTuning.ttsVoice} natural voice. What fresh vegetables may I pack for you today?`,
                            hi: `नमस्ते! यह ताज़ा मंडी की प्राकृतिक आवाज़ है। बताइए आज आपके लिए कौन सी ताज़ी सब्ज़ी और फल पैक करूँ?`,
                            hinglish: `Namaste! Yeh TaazaMandi ki natural voice hai. Boliye aaj kya order pack karein?`,
                          }),
                          false
                        );
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10.5px] cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{pickLang(lang, { en: 'Test Voice', hi: 'आवाज़ टेस्ट करें' })}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(
                      [
                        { id: 'Aoede' as const, label: 'Aoede', descHi: 'स्नेही महिला', descEn: 'Warm Female' },
                        { id: 'Kore' as const, label: 'Kore', descHi: 'स्पष्ट व मधुर', descEn: 'Clear Soft' },
                        { id: 'Puck' as const, label: 'Puck', descHi: 'फुर्तीला दोस्त', descEn: 'Bright Friendly' },
                        { id: 'Fenrir' as const, label: 'Fenrir', descHi: 'गंभीर पुरुष', descEn: 'Steady Male' },
                      ] as const
                    ).map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => updateVoiceTuning({ ttsVoice: v.id })}
                        className={`p-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                          voiceTuning.ttsVoice === v.id
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="text-[11px] font-black">{v.label}</div>
                        <div
                          className={`text-[9.5px] ${
                            voiceTuning.ttsVoice === v.id
                              ? 'text-emerald-100'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {pickLang(lang, { en: v.descEn, hi: v.descHi })}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    {(
                      [
                        { rate: 0.9 as const, en: '0.9× Calm', hi: '0.9× धीमे' },
                        { rate: 1.0 as const, en: '1.0× Natural', hi: '1.0× सामान्य' },
                        { rate: 1.15 as const, en: '1.15× Brisk', hi: '1.15× तेज़' },
                      ] as const
                    ).map((spd) => (
                      <button
                        key={spd.rate}
                        type="button"
                        onClick={() => updateVoiceTuning({ ttsRate: spd.rate })}
                        className={`py-1 px-2 rounded-lg text-[10.5px] font-bold border tabular-nums cursor-pointer ${
                          voiceTuning.ttsRate === spd.rate
                            ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {pickLang(lang, { en: spd.en, hi: spd.hi })}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Expandable Family Preferences Drawer */}
            {showFamilyPanel && (
              <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 space-y-3 shrink-0 max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                  <span>
                    {pickLang(lang, {
                      en: 'Saved Family Members & Favorites',
                      hi: 'परिवार के सदस्यों की पसंदीदा सब्ज़ियाँ/फल',
                      mr: 'कुटुंबातील सदस्यांच्या आवडी',
                      hinglish: 'Family Members Favorites',
                    })}
                  </span>
                </div>

                {familyPreferences.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {familyPreferences.map((fp) => {
                      const favNames = fp.favoriteItemIds
                        .map((id) => {
                          const p = produceById.get(id);
                          return p ? resolveLocalizedProduceName(p.name, lang, p.id) : '';
                        })
                        .filter(Boolean)
                        .join(', ');
                      return (
                        <div
                          key={fp.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-[11px]"
                        >
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {fp.relation}:
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">{favNames}</span>
                          <button
                            type="button"
                            onClick={() => removeFamilyPreference(fp.id)}
                            className="text-pink-500 hover:text-pink-700 ml-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <form onSubmit={handleSaveFamilyMember} className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <select
                    value={famRelation}
                    onChange={(e) => setFamRelation(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="Papa">Papa / पिताजी</option>
                    <option value="Mummy">Mummy / माँ</option>
                    <option value="Kids">Kids / बच्चे</option>
                    <option value="Self">Self / स्वयं</option>
                    <option value="Dada-Dadi">Grandparents</option>
                  </select>

                  <select
                    value={famFavItemIds[0] || ''}
                    onChange={(e) => setFamFavItemIds([e.target.value])}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    {produceList.slice(0, 35).map((p) => (
                      <option key={p.id} value={p.id}>
                        {resolveLocalizedProduceName(p.name, lang, p.id)}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{pickLang(lang, { en: 'Save', hi: 'सेव करें', mr: 'सेव्ह करा' })}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Live Animated Basket Drop Strip inside Smart Order Assistant */}
            {liveBasketDrop && (
              <div
                key={liveBasketDrop.key}
                className="mx-4 mt-2.5 px-3.5 py-2 rounded-2xl bg-linear-to-r from-emerald-700 to-teal-700 text-white text-xs font-bold flex items-center justify-between gap-2 shadow-md animate-order-stage shrink-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                  </span>
                  <span className="truncate">
                    {pickLang(lang, { en: 'Added to Basket: ', hi: 'थैली में जोड़ा: ' })}
                    {liveBasketDrop.label}
                  </span>
                </div>
                <span className="font-mono-nums text-[11px] bg-white/15 px-2 py-0.5 rounded-lg shrink-0">
                  ₹{liveCartTotal}
                </span>
              </div>
            )}

            {/* Chat / Voice Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-700 text-white rounded-br-sm font-medium'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm border border-slate-200/70 dark:border-slate-700'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {msg.addedSummary && (
                      <div className="mt-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold text-[11px] flex items-center justify-between gap-2 animate-order-stage">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ShoppingBag className="w-3.5 h-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                          <span className="truncate">{msg.addedSummary}</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 shrink-0">
                          ✓ {pickLang(lang, { en: 'In Basket', hi: 'थैली में' })}
                        </span>
                      </div>
                    )}

                    {msg.proactiveTip && (
                      <div className="mt-2 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-[11px]">
                        💡 {msg.proactiveTip}
                      </div>
                    )}

                    {msg.confirmedOrder && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 space-y-3 shadow-sm animate-order-stage overflow-hidden">
                        {/* Dynamic Order Confirmation Hero Strip with SVG Check Draw */}
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div className="relative w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 13l4 4L19 7" className="animate-check-draw" />
                              </svg>
                              <Leaf className="w-3 h-3 text-amber-500 absolute -top-1 -right-1 animate-harvest-spark" />
                            </div>
                            <div>
                              <div className="font-black text-emerald-800 dark:text-emerald-300 text-xs">
                                {pickLang(lang, { en: 'Order Confirmed!', hi: 'ऑर्डर कन्फ़र्म!' })} · #{msg.confirmedOrder.id}
                              </div>
                              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono-nums">
                                {msg.confirmedOrder.totalProduceWeightKg} kg · {msg.confirmedOrder.deliverySlot}
                              </div>
                            </div>
                          </div>
                          <span className="font-mono-nums font-black text-sm text-slate-900 dark:text-slate-100">
                            ₹{msg.confirmedOrder.totalAmount}
                          </span>
                        </div>

                        {/* 4-Stage Dynamic APMC Order Pipeline Animation */}
                        <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/35 border border-emerald-200/80 dark:border-emerald-800/60 p-2.5 space-y-2">
                          <div className="relative h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-linear-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-700"
                              style={{ width: `${Math.min(100, dispatchPulseStep * 25)}%` }}
                            />
                          </div>
                          <div className="relative h-4 flex items-center">
                            <div className="animate-van-dispatch inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                              <Truck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                              <span>{pickLang(lang, { en: 'Syncing 4 AM APMC Vashi Lot...', hi: 'सुबह 4 AM मंडी बैच में जुड़ रहा है...' })}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-[9.5px] font-bold text-center">
                            {[
                              pickLang(lang, { en: '1. Booked', hi: '1. बुक' }),
                              pickLang(lang, { en: '2. Batched', hi: '2. बैच' }),
                              pickLang(lang, { en: '3. APMC 4AM', hi: '3. मंडी' }),
                              pickLang(lang, { en: '4. Van Gate', hi: '4. डिलीवरी' }),
                            ].map((stLabel, idx) => (
                              <span
                                key={stLabel}
                                className={`py-0.5 rounded transition-colors ${
                                  dispatchPulseStep >= idx + 1
                                    ? 'bg-emerald-700 text-white'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {stLabel}
                              </span>
                            ))}
                          </div>
                        </div>

                        {msg.paymentMode === 'upi_qr' ? (
                          <div className="text-center space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <img
                              src={generateUpiQrCodeUrl(
                                msg.confirmedOrder.totalAmount,
                                msg.confirmedOrder.id
                              )}
                              alt="Kotak UPI QR"
                              className="w-36 h-36 mx-auto rounded-xl border border-slate-200 p-1 bg-white"
                            />
                            <div className="text-[10.5px] font-mono text-slate-500">
                              {OFFICIAL_UPI_CONFIG.upiId}
                            </div>
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              <a
                                href={generateUpiUrl(
                                  msg.confirmedOrder.totalAmount,
                                  msg.confirmedOrder.id
                                )}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px]"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>Open UPI App</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsOpen(false);
                                  window.dispatchEvent(
                                    new CustomEvent('tazamandi-voice-nav', {
                                      detail: { tab: 'tracking' },
                                    })
                                  );
                                }}
                                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-black text-[11px] cursor-pointer"
                              >
                                <span>{pickLang(lang, { en: 'Live Track', hi: 'लाइव ट्रैक' })}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                              <Banknote className="w-4 h-4 text-emerald-600" />
                              <span>Cash / Pay at Doorstep Delivery</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                window.dispatchEvent(
                                  new CustomEvent('tazamandi-voice-nav', {
                                    detail: { tab: 'tracking' },
                                  })
                                );
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-black text-[10.5px] cursor-pointer shrink-0"
                            >
                              <span>{pickLang(lang, { en: 'Live Track', hi: 'लाइव ट्रैक' })}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>
                    {pickLang(lang, {
                      en: 'Thinking & checking live mandi stock...',
                      hi: 'ताज़ा मंडी स्टॉक देख रहा हूँ...',
                      mr: 'ताजा साठा तपासत आहे...',
                    })}
                  </span>
                </div>
              )}

              {/* 1-Tap Order Confirmation Card inside Dialog when items are ready */}
              {pendingConfirmFlag && totalCartItemCount > 0 && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-2.5">
                  <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-200">
                    <span>
                      {pickLang(lang, {
                        en: 'Ready to Place Order?',
                        hi: 'क्या यह ऑर्डर कन्फ़र्म कर दें?',
                        mr: 'ऑर्डर कन्फर्म करू का?',
                        hinglish: 'Order Confirm Karein?',
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setIsCartOpen(true);
                      }}
                      className="text-[11px] underline text-emerald-700 dark:text-emerald-300 cursor-pointer"
                    >
                      {pickLang(lang, { en: 'Open Full Cart', hi: 'पूरी थैली देखें', mr: 'पूर्ण बॅग पहा' })}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPayMode('upi_qr')}
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedPayMode === 'upi_qr'
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Kotak UPI QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPayMode('cod')}
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedPayMode === 'cod'
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Cash on Delivery</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleConfirmAndPlaceOrder(selectedPayMode)}
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {pickLang(lang, {
                        en: `Confirm Order (${selectedPayMode === 'upi_qr' ? 'UPI QR' : 'COD'})`,
                        hi: `ऑर्डर पक्का करें (${selectedPayMode === 'upi_qr' ? 'UPI QR' : 'नकद COD'})`,
                        mr: `ऑर्डर पक्की करा (${selectedPayMode === 'upi_qr' ? 'UPI QR' : 'COD'})`,
                      })}
                    </span>
                  </button>
                </div>
              )}

              {/* Live Voice Capture & Status Banner inside opened modal */}
              {(isAwakeArmed || isListening || Boolean(wakeLiveCaption)) && (
                <div className="px-3 py-2 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/50 border border-emerald-400/50 text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5 text-[11px]">
                  <span className="flex items-center gap-0.5 h-4 shrink-0" aria-hidden="true">
                    <span className="voice-wave-bar bg-emerald-500" style={{ '--tm-bar': 'var(--tm-b0, 0)' } as React.CSSProperties} />
                    <span className="voice-wave-bar bg-teal-500" style={{ '--tm-bar': 'var(--tm-b1, 0)' } as React.CSSProperties} />
                    <span className="voice-wave-bar bg-emerald-400" style={{ '--tm-bar': 'var(--tm-b2, 0)' } as React.CSSProperties} />
                    <span className="voice-wave-bar bg-teal-500" style={{ '--tm-bar': 'var(--tm-b3, 0)' } as React.CSSProperties} />
                    <span className="voice-wave-bar bg-emerald-500" style={{ '--tm-bar': 'var(--tm-b4, 0)' } as React.CSSProperties} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-black">
                      {isUserSpeaking
                        ? pickLang(lang, {
                            en: 'Capturing your voice...',
                            hi: '🎙️ आपकी आवाज़ ले रहा है...',
                            mr: '🎙️ तुमचा आवाज घेत आहे...',
                          })
                        : isListening || isAwakeArmed
                        ? pickLang(lang, {
                            en: 'Mic ready — quiet now. Speak anytime!',
                            hi: '🎙️ माइक तैयार है (अभी शांत) — बोलिए!',
                            mr: '🎙️ माइक तयार आहे — बोला!',
                          })
                        : pickLang(lang, { en: 'Voice captured', hi: '🎙️ सुना गया', mr: '🎙️ ऐकले' })}
                    </div>
                    {wakeLiveCaption && (
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                        “{wakeLiveCaption}”
                      </div>
                    )}
                  </div>
                  {isListening && isFallbackRecording && (
                    <button
                      type="button"
                      onClick={() => stopMediaRecorderFallback()}
                      className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] shrink-0 cursor-pointer"
                    >
                      {pickLang(lang, { en: 'Send Audio', hi: '✅ भेजें', mr: '✅ पाठवा' })}
                    </button>
                  )}
                </div>
              )}

              <div ref={scrollEndRef} />
            </div>

            {/* Quick Voice Suggestion Prompts */}
            <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {quickVoicePrompts.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {speechUnsupported && (
              <div className="px-4 py-1.5 bg-amber-50 text-amber-800 text-[11px] text-center font-medium">
                {pickLang(lang, {
                  en: 'Voice mic is not supported in this browser — please type below.',
                  hi: 'इस ब्राउज़र में माइक उपलब्ध नहीं है — कृपया नीचे लिखें।',
                  mr: 'या ब्राउझरमध्ये माइक उपलब्ध नाही — कृपया खाली टाइप करा.',
                })}
              </div>
            )}

            {/* Mic + Text Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
            >
              <button
                type="button"
                onClick={toggleListening}
                className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  isListening
                    ? 'bg-pink-600 text-white shadow-lg ring-2 ring-pink-500/35'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm'
                }`}
                title={isListening ? 'Stop Listening' : 'Speak Order'}
              >
                {isListening && (
                  <span className="voice-reactive-ring absolute -inset-1 rounded-2xl border-2 border-pink-400 pointer-events-none" />
                )}
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isListening
                    ? pickLang(lang, { en: 'Listening...', hi: 'सुन रहा हूँ... बोलिए', mr: 'ऐकत आहे... बोला' })
                    : pickLang(lang, {
                        en: 'Speak or type (e.g. 2kg potato, order confirm)...',
                        hi: 'बोलें या लिखें (जैसे: 2 किलो आलू जोड़ो, कन्फ़र्म करो)...',
                        mr: 'बोला किंवा लिहा (उदा. २ किलो बटाटे जोडा)...',
                        hinglish: 'Bolein ya likhein (e.g. 2kg aloo add karo)...',
                      })
                }
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-emerald-600"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="w-11 h-11 rounded-2xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 disabled:opacity-40 text-white flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

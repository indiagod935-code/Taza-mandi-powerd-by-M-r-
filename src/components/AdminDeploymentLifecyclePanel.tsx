import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Database,
  Trash2,
  Server,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { pickLang } from '../utils/i18nHelper';
import { adminApi, type DeploymentLifecycleResponse } from '../api/endpoints';
import {
  auth,
  fetchDeploymentStatesFromFirestore,
  syncDeploymentStateToFirestore,
  type FirestoreDeploymentRecord,
} from '../firebase';

export const AdminDeploymentLifecyclePanel: React.FC = () => {
  const { lang } = useApp();
  const {
    currentVersion,
    serverVersion,
    clientBuildHash,
    serverBuildHash,
    cacheControlHeader,
    cacheHeadersValid,
    serverEnvironment,
    republishDetected,
    hasUpdate,
    isAutoSyncing,
    lastCheckedAt,
    triggerUpdate,
    checkForUpdates,
  } = usePWAInstall();

  const [serverStatus, setServerStatus] = useState<DeploymentLifecycleResponse | null>(null);
  const [swCacheCount, setSwCacheCount] = useState<number>(0);
  const [firestoreStates, setFirestoreStates] = useState<{
    development: FirestoreDeploymentRecord | null;
    production: FirestoreDeploymentRecord | null;
  }>({ development: null, production: null });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'warn'; text: string } | null>(null);

  const inspectCachesCount = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const names = await caches.keys();
        setSwCacheCount(names.length);
      }
    } catch {
      setSwCacheCount(0);
    }
  }, []);

  const refreshLifecycleData = useCallback(
    async (verifyWrite = false) => {
      setIsVerifying(true);
      try {
        const status = verifyWrite
          ? await adminApi.verifyDeployment()
          : await adminApi.getDeploymentStatus();
        setServerStatus(status);

        // Read Firestore Preview vs Production comparison when verified admin session is signed in
        const fbStates = await fetchDeploymentStatesFromFirestore().catch(() => ({
          development: null,
          production: null,
        }));
        setFirestoreStates(fbStates);

        if (verifyWrite) {
          setFeedback({
            type: status.cacheHeadersValid ? 'ok' : 'warn',
            text: status.cacheHeadersValid
              ? pickLang(lang, {
                  en: `Verified v${status.version} (#${status.buildHashShort}) with Cache-Control: no-cache & no-store active.`,
                  hi: `सत्यापित: v${status.version} (#${status.buildHashShort}) व Cache-Control: no-cache सक्रिय है।`,
                  mr: `पडताळणी पूर्ण: v${status.version} (#${status.buildHashShort}) व Cache-Control: no-cache सक्रिय आहे.`,
                  hinglish: `Verified v${status.version} (#${status.buildHashShort}) + Cache-Control: no-cache OK.`,
                })
              : pickLang(lang, {
                  en: 'Cache-Control header missing no-cache directive — consider purging caches.',
                  hi: 'Cache-Control हेडर में no-cache अधूरा मिला — कृपया कैश साफ़ करें।',
                  hinglish: 'Cache-Control header incomplete — cache purge karein.',
                }),
          });
        }
      } catch (err: any) {
        if (verifyWrite) {
          setFeedback({
            type: 'warn',
            text: err?.message || 'Unable to verify server deployment status right now.',
          });
        }
      } finally {
        await inspectCachesCount();
        setIsVerifying(false);
      }
    },
    [inspectCachesCount, lang]
  );

  useEffect(() => {
    void refreshLifecycleData(false);
  }, [refreshLifecycleData]);

  // Auto-sync confirmed server hash to Firestore when verified Admin is authenticated
  useEffect(() => {
    if (!serverStatus || !auth.currentUser?.emailVerified) return;
    const existingRecord = firestoreStates[serverStatus.environment];
    if (existingRecord && existingRecord.buildHash === serverStatus.buildHash) return;

    syncDeploymentStateToFirestore({
      envId: serverStatus.environment,
      version: serverStatus.version,
      releaseId: serverStatus.releaseId,
      buildHash: serverStatus.buildHash,
      buildHashShort: serverStatus.buildHashShort,
      cacheHeadersValid: serverStatus.cacheHeadersValid,
      observedCacheControl: serverStatus.observedCacheControl,
      workspaceClean: serverStatus.workspaceClean,
      bootedAt: serverStatus.bootedAt,
    })
      .then((saved) => {
        if (saved) {
          return fetchDeploymentStatesFromFirestore().then((res) => setFirestoreStates(res));
        }
      })
      .catch(() => {});
  }, [serverStatus, firestoreStates]);

  const handleManualVerify = async () => {
    checkForUpdates();
    await refreshLifecycleData(true);
  };

  const handlePurgeAndResync = async () => {
    setIsPurging(true);
    try {
      triggerUpdate();
    } finally {
      setTimeout(() => setIsPurging(false), 1200);
    }
  };

  const handleSyncToFirestore = async () => {
    if (!serverStatus) {
      await refreshLifecycleData(false);
      return;
    }
    setIsSyncingFirestore(true);
    try {
      const ok = await syncDeploymentStateToFirestore({
        envId: serverStatus.environment,
        version: serverStatus.version,
        releaseId: serverStatus.releaseId,
        buildHash: serverStatus.buildHash,
        buildHashShort: serverStatus.buildHashShort,
        cacheHeadersValid: serverStatus.cacheHeadersValid,
        observedCacheControl: serverStatus.observedCacheControl,
        workspaceClean: serverStatus.workspaceClean,
        bootedAt: serverStatus.bootedAt,
      });
      if (!ok) {
        setFeedback({
          type: 'warn',
          text: pickLang(lang, {
            en: 'Sign in with Owner Google Account inside Account tab to write Preview/Production hash logs to Firestore.',
            hi: 'Firestore में बिल्ड हैश सहेजने के लिए Account से मालिक (Owner) Gmail लॉगिन आवश्यक है।',
            hinglish: 'Firestore sync ke liye Owner Gmail login zaroori hai.',
          }),
        });
      } else {
        const refreshed = await fetchDeploymentStatesFromFirestore();
        setFirestoreStates(refreshed);
        setFeedback({
          type: 'ok',
          text: pickLang(lang, {
            en: `Recorded ${serverStatus.environment} build #${serverStatus.buildHashShort} to Firestore.`,
            hi: `Firestore में ${serverStatus.environment} बिल्ड #${serverStatus.buildHashShort} सफलतापूर्वक दर्ज किया गया।`,
            hinglish: `Firestore me ${serverStatus.environment} build #${serverStatus.buildHashShort} save ho gaya.`,
          }),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'warn',
        text: err?.message || 'Firestore sync failed.',
      });
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  const effectiveServerHash = serverStatus?.buildHash || serverBuildHash;
  const effectiveShortServer =
    serverStatus?.buildHashShort || (effectiveServerHash ? effectiveServerHash.slice(0, 8) : '--------');
  const effectiveShortClient = clientBuildHash ? clientBuildHash.slice(0, 8) : effectiveShortServer;
  const effectiveCacheValid = serverStatus ? serverStatus.cacheHeadersValid : cacheHeadersValid;
  const effectiveObservedCC =
    serverStatus?.observedCacheControl || cacheControlHeader || 'no-store, no-cache, must-revalidate';
  const effectiveEnv = serverStatus?.environment || serverEnvironment;

  const isSynced =
    !republishDetected &&
    !hasUpdate &&
    Boolean(effectiveServerHash) &&
    (!clientBuildHash || clientBuildHash === effectiveServerHash) &&
    effectiveCacheValid;

  const formatShortTime = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      {/* Header Row */}
      <div className="p-4 sm:px-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Server className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {pickLang(lang, {
                en: 'Deployment & Build Lifecycle',
                hi: 'डिप्लॉयमेंट व बिल्ड लाइफसाइकिल जांच',
                mr: 'डिप्लॉयमेंट आणि बिल्ड लाइफसायकल',
                hinglish: 'Deployment & Build Lifecycle',
              })}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums uppercase text-[11px]">
              {effectiveEnv}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            {pickLang(lang, {
              en: 'Validates live Cache-Control: no-cache headers and SHA-256 bundle hashes so re-published updates auto-clear old caches and hide pending update notices immediately.',
              hi: 'लाइव Cache-Control: no-cache हेडर और असली SHA-256 बिल्ड हैश की जांच करता है ताकि Re-Publish होते ही पुराना कैश साफ होकर नया रूप दिखे और "Republish / नया अपडेट" सूचना तुरंत हट जाए।',
              mr: 'Cache-Control: no-cache हेडर आणि SHA-256 बिल्ड हॅश तपासून री-पब्लिश होताच जुना कॅश साफ करतो.',
              hinglish: 'Cache-Control: no-cache aur SHA-256 build hash check karta hai taki Re-publish par purana cache clear hokar notification turant hide ho jaye.',
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleManualVerify}
            disabled={isVerifying}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>
              {pickLang(lang, {
                en: isVerifying ? 'Verifying...' : 'Verify Headers & Hash',
                hi: isVerifying ? 'जांच जारी...' : 'हेडर व हैश जांचें',
                hinglish: isVerifying ? 'Verifying...' : 'Verify Headers & Hash',
              })}
            </span>
          </button>

          <button
            type="button"
            onClick={handlePurgeAndResync}
            disabled={isPurging}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>
              {pickLang(lang, {
                en: isPurging ? 'Purging...' : 'Purge SW & Resync',
                hi: isPurging ? 'साफ़ हो रहा है...' : 'कैश साफ़ व रीलोड',
                hinglish: isPurging ? 'Purging...' : 'Purge SW & Resync',
              })}
            </span>
          </button>
        </div>
      </div>

      {/* Sync State Banner — Automatically Hides Pending Alert When Hash & Headers Match */}
      {isSynced ? (
        <div className="px-4 sm:px-5 py-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {pickLang(lang, {
                en: 'Live Build Synced — No stale cache or pending re-publish updates in UI.',
                hi: 'लाइव बिल्ड पूरी तरह सिंक है — कोई पुराना कैश या बकाया अपडेट चेतावनी नहीं है।',
                hinglish: 'Live Build Synced — Koi stale cache ya pending republish alert nahi hai.',
              })}
            </span>
          </div>
          <span className="font-mono tabular-nums text-[11px] text-emerald-800 dark:text-emerald-300">
            v{currentVersion} · #{effectiveShortServer}
          </span>
        </div>
      ) : (
        <div className="px-4 sm:px-5 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {isAutoSyncing
                ? pickLang(lang, {
                    en: 'New re-published build detected — purging cache & syncing UI...',
                    hi: 'नया री-पब्लिश बिल्ड मिला — पुराना कैश साफ़ होकर नया UI लोड हो रहा है...',
                    hinglish: 'Naya re-published build mila — cache purge aur auto-sync ho raha hai...',
                  })
                : pickLang(lang, {
                    en: 'Build or header mismatch detected — click Purge SW & Resync to clear notice.',
                    hi: 'बिल्ड हैश या हेडर में अंतर मिला — अपडेट पूरा करने के लिए "कैश साफ़ व रीलोड" दबाएं।',
                    hinglish: 'Build hash ya header mismatch mila — sync complete karne ke liye Purge dabaye.',
                  })}
            </span>
          </div>
          <button
            type="button"
            onClick={handlePurgeAndResync}
            className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{pickLang(lang, { en: 'Apply & Hide', hi: 'सिंक करें', hinglish: 'Apply & Hide' })}</span>
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`px-4 sm:px-5 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-medium ${
            feedback.type === 'ok'
              ? 'text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-900'
              : 'text-amber-800 dark:text-amber-300 bg-amber-50/40 dark:bg-amber-950/20'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Flat Hairline Diagnostic Grid (4 Key Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
        <div className="p-4 space-y-1">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {pickLang(lang, {
              en: 'Cache-Control Header Validation',
              hi: 'Cache-Control हेडर जांच',
              hinglish: 'Cache-Control Header Check',
            })}
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
            {effectiveCacheValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>
              {effectiveCacheValid
                ? pickLang(lang, { en: 'Passed (no-cache)', hi: 'सही (no-cache पास)', hinglish: 'Passed (no-cache)' })
                : pickLang(lang, { en: 'Failed / Cached', hi: 'चेतावनी (कैश्ड)', hinglish: 'Header Missing' })}
            </span>
          </div>
          <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate" title={effectiveObservedCC}>
            {effectiveObservedCC}
          </div>
        </div>

        <div className="p-4 space-y-1">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {pickLang(lang, {
              en: 'Client vs Server Build Hash',
              hi: 'ब्राउज़र बनाम सर्वर SHA-256 हैश',
              hinglish: 'Client vs Server Build Hash',
            })}
          </div>
          <div className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            #{effectiveShortClient} / #{effectiveShortServer}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            v{currentVersion} → Server v{serverStatus?.version || serverVersion}
          </div>
        </div>

        <div className="p-4 space-y-1">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {pickLang(lang, {
              en: 'Workspace & Bundle Status',
              hi: 'प्रोजेक्ट फ़ोल्डर व बंडल स्थिति',
              hinglish: 'Workspace & Bundle Status',
            })}
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {serverStatus?.workspaceClean !== false
              ? pickLang(lang, { en: 'Clean (Zero Runtime Files)', hi: 'साफ़ (कोई .data फ़ाइल नहीं)', hinglish: 'Clean (Zero Runtime Pollution)' })
              : pickLang(lang, { en: 'Local .data Detected', hi: 'लोकल .data मौजूद', hinglish: 'Local .data Present' })}
          </div>
          <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {serverStatus?.distBuilt
              ? `dist ready · ${serverStatus.distAssetCount} assets · ${swCacheCount} SW cache`
              : `dev mode · ${swCacheCount} SW cache`}
          </div>
        </div>

        <div className="p-4 space-y-1">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {pickLang(lang, {
              en: 'Last Live Verification',
              hi: 'अंतिम लाइव जांच समय',
              hinglish: 'Last Verification Check',
            })}
          </div>
          <div className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {formatShortTime(serverStatus?.checkedAt || lastCheckedAt)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            Booted {formatShortTime(serverStatus?.bootedAt)}
          </div>
        </div>
      </div>

      {/* Preview vs Published Firestore Cross-Environment Comparison */}
      <div className="p-4 sm:px-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 text-xs min-w-0">
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {pickLang(lang, {
                en: 'Preview vs Published Build Registry (Firestore)',
                hi: 'Preview बनाम Published बिल्ड तुलना (Firestore)',
                hinglish: 'Preview vs Published Hash Registry (Firestore)',
              })}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400 font-mono tabular-nums">
            <span>
              Preview:{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {firestoreStates.development
                  ? `v${firestoreStates.development.version} #${firestoreStates.development.buildHashShort}`
                  : 'Not synced'}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Published:{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {firestoreStates.production
                  ? `v${firestoreStates.production.version} #${firestoreStates.production.buildHashShort}`
                  : 'Open published URL once as Admin'}
              </strong>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncToFirestore}
          disabled={isSyncingFirestore}
          className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
        >
          <Database className={`w-3.5 h-3.5 ${isSyncingFirestore ? 'animate-spin' : ''}`} />
          <span>
            {pickLang(lang, {
              en: isSyncingFirestore ? 'Syncing...' : 'Sync Hash to Firestore',
              hi: isSyncingFirestore ? 'सेव हो रहा...' : 'Firestore में सेव करें',
              hinglish: isSyncingFirestore ? 'Syncing...' : 'Sync Hash to Firestore',
            })}
          </span>
        </button>
      </div>
    </section>
  );
};

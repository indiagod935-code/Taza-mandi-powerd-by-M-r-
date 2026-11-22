import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Sparkles, CheckCircle2, X, PlusCircle, Wrench } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { pickLang } from '../utils/i18nHelper';
import {
  APP_RELEASES,
  AppReleaseEntry,
  CURRENT_RELEASE_ID,
  CURRENT_RELEASE_VERSION,
} from '../config/releases';

export const CURRENT_CLIENT_VERSION = CURRENT_RELEASE_ID;
const APPLIED_VERSION_KEY = 'marco100_app_version';
const ACTIVE_BUILD_HASH_KEY = 'tazamandi_active_build_hash';
const AUTO_RELOAD_GUARD_KEY = 'tazamandi_reloaded_for_hash';
const DISMISSED_MODAL_KEY = 'tazamandi_dismissed_update_version';

interface VersionApiPayload {
  version?: string;
  releaseId?: string;
  releasedAt?: string;
  buildTimestamp?: string;
  buildHash?: string;
  buildHashShort?: string;
  environment?: 'production' | 'development';
  workspaceClean?: boolean;
  latestRelease?: AppReleaseEntry;
  releases?: AppReleaseEntry[];
  changelog?: string[];
}

export const LiveUpdateNotifier: React.FC = () => {
  const { lang } = useApp();
  const [hasUpdate, setHasUpdate] = useState<boolean>(() =>
    typeof window !== 'undefined' ? Boolean(window.__tazamandiHasSWUpdate) : false
  );
  const [serverVersion, setServerVersion] = useState<string>(CURRENT_RELEASE_VERSION);
  const [serverReleaseId, setServerReleaseId] = useState<string>(CURRENT_RELEASE_ID);
  const [clientBuildHash, setClientBuildHash] = useState<string>(() => {
    try {
      return typeof localStorage !== 'undefined'
        ? localStorage.getItem(ACTIVE_BUILD_HASH_KEY) || ''
        : '';
    } catch {
      return '';
    }
  });
  const [serverBuildHash, setServerBuildHash] = useState<string>('');
  const [cacheControlHeader, setCacheControlHeader] = useState<string>('');
  const [cacheHeadersValid, setCacheHeadersValid] = useState<boolean>(true);
  const [serverEnvironment, setServerEnvironment] = useState<'production' | 'development'>('development');
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);
  const [releases, setReleases] = useState<AppReleaseEntry[]>(APP_RELEASES);
  const [latestRelease, setLatestRelease] = useState<AppReleaseEntry>(APP_RELEASES[0]);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [justUpdatedToast, setJustUpdatedToast] = useState(false);

  const loadedClientHashRef = useRef<string>('');
  const reloadInProgressRef = useRef<boolean>(false);

  const openModalIfNotDismissed = useCallback((targetVersion: string) => {
    try {
      const dismissed = sessionStorage.getItem(DISMISSED_MODAL_KEY);
      if (dismissed === targetVersion) return;
    } catch {}
    setIsModalOpen(true);
  }, []);

  const handleDismissModal = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISSED_MODAL_KEY, serverVersion || serverReleaseId);
    } catch {}
    setIsModalOpen(false);
  }, [serverVersion, serverReleaseId]);

  const purgeBrowserCachesAndReload = useCallback(
    async (targetHash?: string, targetReleaseId?: string) => {
      if (reloadInProgressRef.current) return;
      reloadInProgressRef.current = true;
      setIsUpdating(true);
      setIsAutoSyncing(true);
      try {
        if (targetReleaseId || CURRENT_RELEASE_ID) {
          localStorage.setItem(APPLIED_VERSION_KEY, targetReleaseId || CURRENT_RELEASE_ID);
        }
        if (targetHash) {
          localStorage.setItem(ACTIVE_BUILD_HASH_KEY, targetHash);
          sessionStorage.setItem(AUTO_RELOAD_GUARD_KEY, targetHash);
        }
        sessionStorage.removeItem(DISMISSED_MODAL_KEY);
        window.__tazamandiHasSWUpdate = false;

        if (window.__tazamandiApplySWUpdate) {
          await Promise.resolve(window.__tazamandiApplySWUpdate());
        }
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
        }
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            await registration.update().catch(() => {});
            await registration.unregister().catch(() => {});
          }
        }
      } catch {}
      setHasUpdate(false);
      setIsModalOpen(false);
      window.location.reload();
    },
    []
  );

  const handleApplyUpdate = useCallback(async () => {
    await purgeBrowserCachesAndReload(serverBuildHash || undefined, serverReleaseId || CURRENT_RELEASE_ID);
  }, [purgeBrowserCachesAndReload, serverBuildHash, serverReleaseId]);

  // 1. Initial Cache-Buster & Version Alignment on Startup
  useEffect(() => {
    try {
      const storedVersion = localStorage.getItem(APPLIED_VERSION_KEY);

      // Clean stale demo session if needed
      const storedUser = localStorage.getItem('marco100_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.name === 'Ramesh Patel' || !parsed.email) {
            localStorage.removeItem('marco100_user');
          }
        } catch {}
      }

      if (!storedVersion || storedVersion !== CURRENT_RELEASE_ID) {
        const upgradedFromOlder = Boolean(storedVersion && storedVersion !== CURRENT_RELEASE_ID);
        localStorage.setItem(APPLIED_VERSION_KEY, CURRENT_RELEASE_ID);
        localStorage.removeItem('tazamandi_master_produce_v4');
        localStorage.removeItem('tazamandi_master_produce_v5');
        localStorage.removeItem('tazamandi_master_produce_v6');
        localStorage.removeItem('tazamandi_master_produce_v7');
        localStorage.removeItem('tazamandi_master_produce_v28');
        sessionStorage.removeItem(DISMISSED_MODAL_KEY);
        window.__tazamandiHasSWUpdate = false;
        setHasUpdate(false);

        if (upgradedFromOlder) {
          setJustUpdatedToast(true);
          const timer = window.setTimeout(() => setJustUpdatedToast(false), 5500);
          return () => window.clearTimeout(timer);
        }
      }
    } catch {}
  }, []);

  // 2. Validate Cache-Control headers, SHA-256 build hash & Service Worker state
  const performVersionCheck = useCallback(
    async (options?: { openModalIfAvailable?: boolean; forceOpenOnMatch?: boolean; autoSyncOnHashChange?: boolean }) => {
      setIsCheckingUpdate(true);
      try {
        let swHasWaiting = Boolean(window.__tazamandiHasSWUpdate);
        if (window.__tazamandiCheckSWUpdate) {
          const swFound = await window.__tazamandiCheckSWUpdate().catch(() => false);
          if (swFound) swHasWaiting = true;
        }

        const res = await fetch(`/api/version?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
        });

        const observedCC = res.headers.get('cache-control') || '';
        const ccLower = observedCC.toLowerCase();
        const headersOk = ccLower.includes('no-cache') && ccLower.includes('no-store');
        setCacheControlHeader(observedCC || 'none');
        setCacheHeadersValid(headersOk);

        let apiUpdateReady = false;
        let hashChanged = false;
        let nextVersion = CURRENT_RELEASE_VERSION;
        let nextReleaseId = CURRENT_RELEASE_ID;
        let nextBuildHash = res.headers.get('x-build-hash') || '';

        if (res.ok) {
          const data: VersionApiPayload = await res.json();
          if (data.version) {
            nextVersion = data.version;
            setServerVersion(data.version);
          }
          if (data.releaseId) {
            nextReleaseId = data.releaseId;
            setServerReleaseId(data.releaseId);
            apiUpdateReady = data.releaseId !== CURRENT_RELEASE_ID;
          } else if (data.version) {
            apiUpdateReady = data.version !== CURRENT_RELEASE_VERSION;
          }
          if (data.environment === 'production' || data.environment === 'development') {
            setServerEnvironment(data.environment);
          }
          if (data.buildHash) {
            nextBuildHash = data.buildHash;
          }
          if (data.latestRelease) {
            setLatestRelease(data.latestRelease);
          }
          if (Array.isArray(data.releases) && data.releases.length > 0) {
            setReleases(data.releases);
          }
        }

        if (nextBuildHash) {
          setServerBuildHash(nextBuildHash);
          if (!loadedClientHashRef.current) {
            // Baseline for this page load; check if upgraded from a previous build hash in storage
            loadedClientHashRef.current = nextBuildHash;
            setClientBuildHash(nextBuildHash);
            try {
              const prevHash = localStorage.getItem(ACTIVE_BUILD_HASH_KEY);
              localStorage.setItem(ACTIVE_BUILD_HASH_KEY, nextBuildHash);
              if (prevHash && prevHash !== nextBuildHash) {
                window.__tazamandiHasSWUpdate = false;
                swHasWaiting = false;
                setHasUpdate(false);
                setJustUpdatedToast(true);
                window.setTimeout(() => setJustUpdatedToast(false), 5500);
              }
            } catch {}
          } else if (loadedClientHashRef.current !== nextBuildHash) {
            hashChanged = true;
          }
        }

        // Auto-purge & reload once per detected new re-publish hash so the UI reflects fresh state & hides Republish banner
        const shouldAutoSync = options?.autoSyncOnHashChange !== false;
        if ((hashChanged || apiUpdateReady) && shouldAutoSync && nextBuildHash) {
          let alreadyReloaded = false;
          try {
            alreadyReloaded = sessionStorage.getItem(AUTO_RELOAD_GUARD_KEY) === nextBuildHash;
          } catch {}
          if (!alreadyReloaded) {
            await purgeBrowserCachesAndReload(nextBuildHash, nextReleaseId);
            return;
          }
        }

        // If client hash matches server hash and no API update is pending, clear any stale SW banner cleanly
        const updateAvailable = hashChanged || apiUpdateReady || (swHasWaiting && !nextBuildHash);
        setHasUpdate(updateAvailable);
        if (!updateAvailable) {
          window.__tazamandiHasSWUpdate = false;
          setIsAutoSyncing(false);
        }
        setLastCheckedAt(new Date().toISOString());

        if (updateAvailable && options?.openModalIfAvailable !== false) {
          openModalIfNotDismissed(nextVersion);
        } else if (updateAvailable && options?.forceOpenOnMatch) {
          setIsModalOpen(true);
        }
      } catch {
        // Offline gracefully retains local release history without false alarm
      } finally {
        setIsCheckingUpdate(false);
      }
    },
    [openModalIfNotDismissed, purgeBrowserCachesAndReload]
  );

  // 3. Listen for Service Worker events, manual checks, & external Update button triggers
  useEffect(() => {
    const onSWUpdateReady = () => {
      if (loadedClientHashRef.current && serverBuildHash && loadedClientHashRef.current === serverBuildHash) {
        // Already synchronized on matching server SHA-256 hash — suppress redundant notice
        setHasUpdate(false);
        window.__tazamandiHasSWUpdate = false;
        return;
      }
      setHasUpdate(true);
      openModalIfNotDismissed(serverVersion);
    };
    const onApplyTrigger = () => {
      handleApplyUpdate();
    };
    const onCheckTrigger = (e: Event) => {
      const detail = (e as CustomEvent<{ openModalIfAvailable?: boolean; autoSyncOnHashChange?: boolean }>).detail;
      performVersionCheck({
        openModalIfAvailable: detail?.openModalIfAvailable ?? false,
        forceOpenOnMatch: false,
        autoSyncOnHashChange: detail?.autoSyncOnHashChange ?? true,
      });
    };
    const onOpenModalTrigger = () => {
      setIsModalOpen(true);
    };

    window.addEventListener('tazamandi-sw-update-ready', onSWUpdateReady);
    window.addEventListener('tazamandi-apply-update', onApplyTrigger);
    window.addEventListener('tazamandi-check-update', onCheckTrigger);
    window.addEventListener('tazamandi-open-update-modal', onOpenModalTrigger);
    return () => {
      window.removeEventListener('tazamandi-sw-update-ready', onSWUpdateReady);
      window.removeEventListener('tazamandi-apply-update', onApplyTrigger);
      window.removeEventListener('tazamandi-check-update', onCheckTrigger);
      window.removeEventListener('tazamandi-open-update-modal', onOpenModalTrigger);
    };
  }, [handleApplyUpdate, openModalIfNotDismissed, performVersionCheck, serverBuildHash, serverVersion]);

  // 4. Keyboard Escape closes modal cleanly
  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismissModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen, handleDismissModal]);

  // 5. Broadcast reconciled state to Navbar / Admin Console / AccountView
  useEffect(() => {
    const effectiveClientHash = clientBuildHash || serverBuildHash;
    const republishDetected = Boolean(
      effectiveClientHash && serverBuildHash && effectiveClientHash !== serverBuildHash
    );
    window.dispatchEvent(
      new CustomEvent('tazamandi-update-state', {
        detail: {
          hasUpdate,
          serverVersion,
          clientBuildHash: effectiveClientHash,
          serverBuildHash,
          cacheControlHeader,
          cacheHeadersValid,
          environment: serverEnvironment,
          republishDetected,
          isAutoSyncing,
          latestRelease,
          releases,
          lastCheckedAt,
          isCheckingUpdate,
        },
      })
    );
  }, [
    hasUpdate,
    serverVersion,
    clientBuildHash,
    serverBuildHash,
    cacheControlHeader,
    cacheHeadersValid,
    serverEnvironment,
    isAutoSyncing,
    latestRelease,
    releases,
    lastCheckedAt,
    isCheckingUpdate,
  ]);

  // 6. Poll server /api/version on startup, every 15s, and on tab focus/visibility return
  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      performVersionCheck({ openModalIfAvailable: true, autoSyncOnHashChange: true });
    }, 500);
    const interval = window.setInterval(() => {
      performVersionCheck({ openModalIfAvailable: true, autoSyncOnHashChange: true });
    }, 15000);
    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        performVersionCheck({ openModalIfAvailable: true, autoSyncOnHashChange: true });
      }
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [performVersionCheck]);

  const activeRelease = latestRelease || APP_RELEASES[0];

  return (
    <>
      {hasUpdate && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-800 text-white px-4 py-2 shadow-md border-b border-emerald-700">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="truncate">
                <strong className="tabular-nums">
                  {pickLang(lang, {
                    en: `Update Ready · v${serverVersion}`,
                    hi: `नया अपडेट तैयार · v${serverVersion}`,
                    mr: `नवीन अपडेट तयार · v${serverVersion}`,
                    hinglish: `Update Ready · v${serverVersion}`,
                  })}
                </strong>
                {' · '}
                <span className="font-normal text-emerald-100">
                  {pickLang(lang, activeRelease.headline)}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                {pickLang(lang, {
                  en: "What's New",
                  hi: 'बदलाव देखें',
                  mr: 'बदल पहा',
                  hinglish: "What's New",
                })}
              </button>
              <button
                type="button"
                onClick={handleApplyUpdate}
                disabled={isUpdating}
                className="px-3.5 py-1.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                <span>
                  {isUpdating
                    ? pickLang(lang, { en: 'Updating...', hi: 'अपडेट हो रहा है...', mr: 'अपडेट होत आहे...' })
                    : pickLang(lang, {
                        en: 'Update Now',
                        hi: 'अभी अपडेट करें',
                        mr: 'आत्ता अपडेट करा',
                        hinglish: 'Update Now',
                      })}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {justUpdatedToast && !hasUpdate && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-100 tabular-nums">
              {pickLang(lang, {
                en: `Updated to v${CURRENT_RELEASE_VERSION}`,
                hi: `ऐप v${CURRENT_RELEASE_VERSION} पर अपडेट हो गया है`,
                mr: `v${CURRENT_RELEASE_VERSION} अपडेट सक्रिय झाले`,
                hinglish: `v${CURRENT_RELEASE_VERSION} Update Active`,
              })}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              {pickLang(lang, activeRelease.headline)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setJustUpdatedToast(false)}
            aria-label="Close notification"
            className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="live-update-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="min-w-0">
                <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {hasUpdate
                    ? `v${CURRENT_RELEASE_VERSION} → v${serverVersion}`
                    : `v${CURRENT_RELEASE_VERSION}`}{' '}
                  · {activeRelease.releasedAt}
                </div>
                <h3
                  id="live-update-dialog-title"
                  className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg mt-0.5"
                >
                  {hasUpdate
                    ? pickLang(lang, {
                        en: 'App Update Available — What’s New',
                        hi: 'नया ऐप अपडेट उपलब्ध है — नए बदलाव',
                        mr: 'नवीन अ‍ॅप अपडेट उपलब्ध — नवीन बदल',
                        hinglish: 'App Update Available — What’s New',
                      })
                    : pickLang(lang, {
                        en: 'Current Release Notes',
                        hi: 'वर्तमान अपडेट विवरण',
                        mr: 'सध्याचे अपडेट तपशील',
                        hinglish: 'Current Release Notes',
                      })}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {pickLang(lang, activeRelease.headline)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismissModal}
                aria-label="Close update dialog"
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1 text-xs">
              {activeRelease.features.length > 0 && (
                <div className="space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {pickLang(lang, {
                        en: 'New Features Added',
                        hi: 'नए जोड़े गए फीचर्स',
                        mr: 'नवीन जोडलेल्या सुविधा',
                        hinglish: 'New Features Added',
                      })}
                    </span>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {activeRelease.features.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-slate-700 dark:text-slate-300 leading-relaxed"
                      >
                        <span className="text-emerald-600 font-bold mt-0.5" aria-hidden="true">
                          •
                        </span>
                        <span>{pickLang(lang, item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeRelease.fixes.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                    <span>
                      {pickLang(lang, {
                        en: 'Fixes & Improvements',
                        hi: 'सुधार और बग फिक्स',
                        mr: 'सुधारणा आणि दुरुस्त्या',
                        hinglish: 'Fixes & Improvements',
                      })}
                    </span>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {activeRelease.fixes.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-slate-700 dark:text-slate-300 leading-relaxed"
                      >
                        <span className="text-slate-400 font-bold mt-0.5" aria-hidden="true">
                          •
                        </span>
                        <span>{pickLang(lang, item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
              {hasUpdate ? (
                <>
                  <button
                    type="button"
                    onClick={handleApplyUpdate}
                    disabled={isUpdating}
                    className="flex-1 min-h-[44px] py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                    <span>
                      {isUpdating
                        ? pickLang(lang, { en: 'Updating...', hi: 'लोड हो रहा है...', mr: 'लोड होत आहे...' })
                        : pickLang(lang, {
                            en: 'Update Now',
                            hi: 'अभी अपडेट करें',
                            mr: 'आत्ता अपडेट करा',
                            hinglish: 'Update Now',
                          })}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDismissModal}
                    className="min-h-[44px] py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
                  >
                    {pickLang(lang, { en: 'Later', hi: 'बाद में', mr: 'नंतर', hinglish: 'Later' })}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleDismissModal}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-slate-900 dark:bg-emerald-700 hover:opacity-90 text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
                >
                  {pickLang(lang, {
                    en: 'Got It',
                    hi: 'ठीक है',
                    mr: 'समजले',
                    hinglish: 'Got It',
                  })}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

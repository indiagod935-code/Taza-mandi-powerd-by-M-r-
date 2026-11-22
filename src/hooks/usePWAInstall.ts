import { useEffect, useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../config/env';
import {
  APP_RELEASES,
  AppReleaseEntry,
  CURRENT_RELEASE_VERSION,
} from '../config/releases';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const INSTALLED_STORAGE_KEY = STORAGE_KEYS.PWA_INSTALLED;

// Capture beforeinstallprompt & appinstalled globally as early as possible
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalSessionInstalled = false;
let globalHasUpdate = false;
let globalServerVersion = CURRENT_RELEASE_VERSION;
let globalClientBuildHash = '';
let globalServerBuildHash = '';
let globalCacheControlHeader = '';
let globalCacheHeadersValid = true;
let globalServerEnvironment: 'production' | 'development' = 'development';
let globalRepublishDetected = false;
let globalIsAutoSyncing = false;
let globalReleases: AppReleaseEntry[] = APP_RELEASES;
let globalLatestRelease: AppReleaseEntry = APP_RELEASES[0];
let globalLastCheckedAt: string | null = null;
let globalIsCheckingUpdate = false;

export function checkStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function broadcastPWAState() {
  if (typeof window === 'undefined') return;
  const isRunningStandalone = checkStandaloneMode();
  const isInstalled = isRunningStandalone || globalSessionInstalled;
  window.dispatchEvent(
    new CustomEvent('tazamandi-pwa-state', {
      detail: {
        isInstalled,
        isRunningStandalone,
        isInstallable: Boolean(globalDeferredPrompt) && !isRunningStandalone,
        hasUpdate: globalHasUpdate,
        serverVersion: globalServerVersion,
        clientBuildHash: globalClientBuildHash,
        serverBuildHash: globalServerBuildHash,
        cacheControlHeader: globalCacheControlHeader,
        cacheHeadersValid: globalCacheHeadersValid,
        environment: globalServerEnvironment,
        republishDetected: globalRepublishDetected,
        isAutoSyncing: globalIsAutoSyncing,
        latestRelease: globalLatestRelease,
        releases: globalReleases,
        lastCheckedAt: globalLastCheckedAt,
        isCheckingUpdate: globalIsCheckingUpdate,
      },
    })
  );
}

if (typeof window !== 'undefined') {
  // Never let sticky localStorage block re-installing when the user is running in a regular browser tab
  if (!checkStandaloneMode()) {
    try {
      localStorage.removeItem(INSTALLED_STORAGE_KEY);
    } catch {}
  } else {
    globalSessionInstalled = true;
    try {
      localStorage.setItem(INSTALLED_STORAGE_KEY, '1');
    } catch {}
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    globalSessionInstalled = false;
    try {
      localStorage.removeItem(INSTALLED_STORAGE_KEY);
    } catch {}
    broadcastPWAState();
  });

  window.addEventListener('appinstalled', () => {
    globalSessionInstalled = true;
    globalDeferredPrompt = null;
    try {
      localStorage.setItem(INSTALLED_STORAGE_KEY, '1');
    } catch {}
    broadcastPWAState();
  });

  window.addEventListener('tazamandi-update-state', (e: Event) => {
    const detail = (
      e as CustomEvent<{
        hasUpdate?: boolean;
        serverVersion?: string;
        clientBuildHash?: string;
        serverBuildHash?: string;
        cacheControlHeader?: string;
        cacheHeadersValid?: boolean;
        environment?: 'production' | 'development';
        republishDetected?: boolean;
        isAutoSyncing?: boolean;
        latestRelease?: AppReleaseEntry;
        releases?: AppReleaseEntry[];
        lastCheckedAt?: string | null;
        isCheckingUpdate?: boolean;
      }>
    ).detail;
    globalHasUpdate = Boolean(detail?.hasUpdate);
    if (detail?.serverVersion) globalServerVersion = detail.serverVersion;
    if (detail?.clientBuildHash !== undefined) globalClientBuildHash = detail.clientBuildHash;
    if (detail?.serverBuildHash !== undefined) globalServerBuildHash = detail.serverBuildHash;
    if (detail?.cacheControlHeader !== undefined) globalCacheControlHeader = detail.cacheControlHeader;
    if (detail?.cacheHeadersValid !== undefined) globalCacheHeadersValid = Boolean(detail.cacheHeadersValid);
    if (detail?.environment) globalServerEnvironment = detail.environment;
    if (detail?.republishDetected !== undefined) globalRepublishDetected = Boolean(detail.republishDetected);
    if (detail?.isAutoSyncing !== undefined) globalIsAutoSyncing = Boolean(detail.isAutoSyncing);
    if (detail?.latestRelease) globalLatestRelease = detail.latestRelease;
    if (Array.isArray(detail?.releases) && detail.releases.length > 0) {
      globalReleases = detail.releases;
    }
    if (detail?.lastCheckedAt !== undefined) globalLastCheckedAt = detail.lastCheckedAt;
    if (detail?.isCheckingUpdate !== undefined) {
      globalIsCheckingUpdate = Boolean(detail.isCheckingUpdate);
    }
    broadcastPWAState();
  });

  if ((window as unknown as { __tazamandiHasSWUpdate?: boolean }).__tazamandiHasSWUpdate) {
    globalHasUpdate = true;
  }
}

export function markAppAsInstalled() {
  globalSessionInstalled = true;
  globalDeferredPrompt = null;
  try {
    localStorage.setItem(INSTALLED_STORAGE_KEY, '1');
  } catch {}
  broadcastPWAState();
}

export function resetInstalledFlag() {
  globalSessionInstalled = false;
  try {
    localStorage.removeItem(INSTALLED_STORAGE_KEY);
  } catch {}
  broadcastPWAState();
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => globalDeferredPrompt
  );
  const [isRunningStandalone, setIsRunningStandalone] = useState<boolean>(() =>
    typeof window !== 'undefined' ? checkStandaloneMode() : false
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() =>
    typeof window !== 'undefined' ? checkStandaloneMode() || globalSessionInstalled : false
  );
  const [hasUpdate, setHasUpdate] = useState<boolean>(() => globalHasUpdate);
  const [serverVersion, setServerVersion] = useState<string>(() => globalServerVersion);
  const [clientBuildHash, setClientBuildHash] = useState<string>(() => globalClientBuildHash);
  const [serverBuildHash, setServerBuildHash] = useState<string>(() => globalServerBuildHash);
  const [cacheControlHeader, setCacheControlHeader] = useState<string>(() => globalCacheControlHeader);
  const [cacheHeadersValid, setCacheHeadersValid] = useState<boolean>(() => globalCacheHeadersValid);
  const [serverEnvironment, setServerEnvironment] = useState<'production' | 'development'>(() => globalServerEnvironment);
  const [republishDetected, setRepublishDetected] = useState<boolean>(() => globalRepublishDetected);
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(() => globalIsAutoSyncing);
  const [latestRelease, setLatestRelease] = useState<AppReleaseEntry>(() => globalLatestRelease);
  const [releases, setReleases] = useState<AppReleaseEntry[]>(() => globalReleases);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(() => globalLastCheckedAt);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(() => globalIsCheckingUpdate);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    const syncState = () => {
      const standalone = checkStandaloneMode();
      setIsRunningStandalone(standalone);
      setIsInstalled(standalone || globalSessionInstalled);
      setDeferredPrompt(globalDeferredPrompt);
      setHasUpdate(globalHasUpdate);
      setServerVersion(globalServerVersion);
      setClientBuildHash(globalClientBuildHash);
      setServerBuildHash(globalServerBuildHash);
      setCacheControlHeader(globalCacheControlHeader);
      setCacheHeadersValid(globalCacheHeadersValid);
      setServerEnvironment(globalServerEnvironment);
      setRepublishDetected(globalRepublishDetected);
      setIsAutoSyncing(globalIsAutoSyncing);
      setLatestRelease(globalLatestRelease);
      setReleases(globalReleases);
      setLastCheckedAt(globalLastCheckedAt);
      setIsCheckingUpdate(globalIsCheckingUpdate);
    };

    syncState();

    // Detect embedded iframe (e.g., AI Studio preview)
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    const userAgent = (window.navigator.userAgent || '').toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        markAppAsInstalled();
      }
      syncState();
    };

    window.addEventListener('tazamandi-pwa-state', syncState);
    mediaQuery.addEventListener?.('change', handleMediaChange);

    return () => {
      window.removeEventListener('tazamandi-pwa-state', syncState);
      mediaQuery.removeEventListener?.('change', handleMediaChange);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    const targetPrompt = deferredPrompt || globalDeferredPrompt;
    if (!targetPrompt) {
      return false;
    }
    try {
      await targetPrompt.prompt();
      const choice = await targetPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        markAppAsInstalled();
        return true;
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
    return false;
  }, [deferredPrompt]);

  const triggerUpdate = useCallback(() => {
    window.dispatchEvent(new CustomEvent('tazamandi-apply-update'));
  }, []);

  const checkForUpdates = useCallback(() => {
    window.dispatchEvent(new CustomEvent('tazamandi-check-update', { detail: { openModalIfAvailable: false, autoSyncOnHashChange: true } }));
  }, []);

  const openUpdateModal = useCallback(() => {
    window.dispatchEvent(new CustomEvent('tazamandi-open-update-modal'));
  }, []);

  return {
    isInstallable: Boolean(deferredPrompt || globalDeferredPrompt) && !isRunningStandalone,
    isInstalled,
    isRunningStandalone,
    isIOS,
    isAndroid,
    isInIframe,
    hasUpdate,
    currentVersion: CURRENT_RELEASE_VERSION,
    serverVersion,
    clientBuildHash,
    serverBuildHash,
    cacheControlHeader,
    cacheHeadersValid,
    serverEnvironment,
    republishDetected,
    isAutoSyncing,
    latestRelease,
    releases,
    lastCheckedAt,
    isCheckingUpdate,
    install,
    triggerUpdate,
    checkForUpdates,
    openUpdateModal,
    resetInstalledFlag,
    deferredPrompt: deferredPrompt || globalDeferredPrompt,
  };
}

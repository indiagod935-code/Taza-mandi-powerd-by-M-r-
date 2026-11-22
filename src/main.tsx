import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

declare global {
  interface Window {
    __tazamandiApplySWUpdate?: () => Promise<void> | void;
    __tazamandiCheckSWUpdate?: () => Promise<boolean>;
    __tazamandiHasSWUpdate?: boolean;
  }
}

const notifyWaitingSW = () => {
  window.__tazamandiHasSWUpdate = true;
  window.dispatchEvent(new CustomEvent('tazamandi-sw-update-ready'));
};

// Register Service Worker in both DEV and PROD with immediate update checks and cache cleanups
try {
  if (import.meta.env.DEV) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((registration) => {
          registration.update().catch(() => {});
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            notifyWaitingSW();
          }

          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                installingWorker.postMessage({ type: 'SKIP_WAITING' });
                notifyWaitingSW();
              }
            });
          });

          window.__tazamandiCheckSWUpdate = async () => {
            await registration.update().catch(() => {});
            if (registration.waiting) {
              notifyWaitingSW();
              return true;
            }
            return false;
          };

          window.__tazamandiApplySWUpdate = async () => {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const reg of regs) {
              if (reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
              await reg.update().catch(() => {});
            }
            if ('caches' in window) {
              const names = await caches.keys();
              await Promise.all(names.map((n) => caches.delete(n)));
            }
            window.__tazamandiHasSWUpdate = false;
          };
        })
        .catch((err) => console.warn('Dev SW registration deferred:', err));
    }
  } else {
    let activeRegistration: ServiceWorkerRegistration | undefined;
    const updateSW = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        activeRegistration = registration;
        registration?.update().catch(() => {});
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          notifyWaitingSW();
        }
      },
      onNeedRefresh() {
        notifyWaitingSW();
      },
      onRegisterError(err) {
        console.warn('SW registration skipped/deferred:', err);
      },
    });

    window.__tazamandiCheckSWUpdate = async () => {
      if (activeRegistration) {
        await activeRegistration.update().catch(() => {});
        if (activeRegistration.waiting) {
          notifyWaitingSW();
          return true;
        }
      }
      return Boolean(window.__tazamandiHasSWUpdate);
    };

    window.__tazamandiApplySWUpdate = async () => {
      window.__tazamandiHasSWUpdate = false;
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
      await updateSW(true);
    };
  }
} catch (err) {
  console.warn('SW initialization bypassed:', err);
}

// Google Maps Platform Quota Defense (Demo Key)
(window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const origError = console.error;
console.error = (...args: unknown[]) => {
  origError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Safe browser persistence utilities with structured fallback handling.
 */

export function readStorageJson<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorageJson<T>(key: string, value: T): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readStorageString(key: string, fallback = ''): string {
  try {
    if (typeof window === 'undefined') return fallback;
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStorageString(key: string, value: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorageKey(key: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage removal errors in restricted frames
  }
}

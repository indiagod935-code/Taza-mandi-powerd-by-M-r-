/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Authentication & Role Access Business Service
 */
import { ENV_CONFIG } from '../config/env';

export const authService = {
  isOwnerEmail(email?: string | null): boolean {
    if (!email) return false;
    return email.trim().toLowerCase() === ENV_CONFIG.OWNER_EMAIL;
  },

  verifyAdminPin(enteredPin: string): boolean {
    return enteredPin.trim() === ENV_CONFIG.ADMIN_PIN;
  },

  normalizePhone10(raw: string): string {
    return raw.replace(/\D/g, '').slice(-10);
  },

  isValidGmailOrEmail(raw: string): boolean {
    const v = raw.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  },

  validateDoublePassword(pw1: string, pw2: string): string | null {
    if (!pw1 || pw1.length < 4) {
      return 'Password must be at least 4 characters long.';
    }
    if (pw1 !== pw2) {
      return 'Both passwords do not match. Please enter the exact same password twice.';
    }
    return null;
  },
};

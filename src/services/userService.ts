/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * User Directory & Profile Business Service
 * Merges ephemeral backend user ledger with persistent Firebase Firestore /users safely.
 */
import { usersApi, type ServerUserPayload } from '../api/endpoints';
import { fetchFirestoreUsersForAdmin } from '../firebase';

export interface MergedAdminUser extends ServerUserPayload {
  source: 'backend' | 'firestore' | 'merged';
}

export const userService = {
  normalizePhone10(phone?: string): string {
    return String(phone || '').replace(/\D/g, '').slice(-10);
  },

  async fetchMergedAdminUsers(): Promise<{
    users: MergedAdminUser[];
    backendCount: number;
    firestoreCount: number;
  }> {
    const [backendResult, firestoreUsers] = await Promise.all([
      usersApi.getAdminUsers().catch(() => ({ success: false, users: [] as ServerUserPayload[] })),
      fetchFirestoreUsersForAdmin().catch(() => []),
    ]);

    const backendUsers = Array.isArray(backendResult.users) ? backendResult.users : [];
    const byKey = new Map<string, MergedAdminUser>();

    const makeKey = (u: { id?: string; email?: string; phone?: string }) => {
      const email = String(u.email || '').trim().toLowerCase();
      if (email && !email.endsWith('@tazamandi.in')) return `email:${email}`;
      const p10 = userService.normalizePhone10(u.phone);
      if (p10.length === 10) return `phone:${p10}`;
      return `id:${u.id || Math.random()}`;
    };

    for (const u of backendUsers) {
      byKey.set(makeKey(u), { ...u, source: 'backend' });
    }

    for (const fu of firestoreUsers) {
      const key = makeKey(fu);
      const existing = byKey.get(key);
      if (existing) {
        byKey.set(key, {
          ...existing,
          name: existing.name || fu.name,
          phone: existing.phone || fu.phone,
          flat: existing.flat || fu.flat,
          society: existing.society || fu.society,
          fullAddress: existing.fullAddress || fu.fullAddress,
          source: 'merged',
        });
      } else {
        byKey.set(key, {
          id: fu.id,
          name: fu.name,
          email: fu.email,
          phone: fu.phone,
          flat: fu.flat || 'Doorstep',
          society: fu.society || '',
          fullAddress: fu.fullAddress || '',
          loginMethod: (fu.loginProvider as any) || 'google',
          createdAt: fu.createdAt,
          lastLoginAt: fu.updatedAt,
          source: 'firestore',
        });
      }
    }

    const merged = Array.from(byKey.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return {
      users: merged,
      backendCount: backendUsers.length,
      firestoreCount: firestoreUsers.length,
    };
  },

  buildReferralShareUrl(referralCode?: string): string {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const clean = String(referralCode || '').trim().toUpperCase();
    return clean ? `${base}/?ref=${encodeURIComponent(clean)}` : base;
  },
};

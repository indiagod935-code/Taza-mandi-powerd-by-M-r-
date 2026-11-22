import { auth, mirrorActivityToFirestore } from '../firebase';

export type ActivityEventType =
  | 'PAGE_VIEW'
  | 'AUTH_REGISTER'
  | 'AUTH_LOGIN'
  | 'AUTH_FAILED'
  | 'AUTH_LOGOUT'
  | 'SOCIAL_LOGIN'
  | 'TERMS_ACCEPTED'
  | 'CART_UPDATE'
  | 'ORDER_PLACED'
  | 'ORDER_CANCELLED'
  | 'VOICE_COMMAND'
  | 'SHARE_LINK'
  | 'PROFILE_UPDATE'
  | 'PHONE_VERIFIED'
  | 'GOOGLE_LINKED';

export interface ClientActivityEntry {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  eventType: ActivityEventType;
  actionTitle: string;
  details?: string;
  pageTab?: string;
  deviceSummary?: string;
  timestamp: string;
}

function getDeviceSummary(): string {
  if (typeof navigator === 'undefined') return 'Web';
  const ua = navigator.userAgent || '';
  const mobile = /Android|iPhone|iPad|Mobile/i.test(ua);
  const browser = /Chrome/i.test(ua)
    ? 'Chrome'
    : /Safari/i.test(ua)
    ? 'Safari'
    : /Firefox/i.test(ua)
    ? 'Firefox'
    : 'Browser';
  return `${mobile ? 'Mobile' : 'Desktop'} · ${browser}`;
}

export async function logUserActivity(payload: {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  eventType: ActivityEventType;
  actionTitle: string;
  details?: string;
  pageTab?: string;
}): Promise<void> {
  const deviceSummary = getDeviceSummary();
  let createdId = `act_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  try {
    const res = await fetch('/api/activity-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        deviceSummary,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (data?.entry?.id) {
      createdId = String(data.entry.id);
    }
  } catch {
    // Non-blocking audit log write
  }

  // Mirror cleanly to Firestore when user has an authenticated verified Firebase session
  if (auth.currentUser && auth.currentUser.emailVerified) {
    try {
      await mirrorActivityToFirestore({
        id: createdId,
        eventType: payload.eventType,
        actionTitle: payload.actionTitle,
        details: payload.details,
        pageTab: payload.pageTab,
        deviceSummary,
      });
    } catch {
      // Soft fallback: backend ledger remains authoritative
    }
  }
}

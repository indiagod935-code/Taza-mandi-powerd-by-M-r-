import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { ENV_CONFIG } from './config/env';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export async function signInWithGooglePopup(loginHintEmail?: string): Promise<{
  uid: string;
  name: string;
  email: string;
  emailVerified: boolean;
}> {
  const provider = new GoogleAuthProvider();
  const cleanHint = String(loginHintEmail || '').trim();
  provider.setCustomParameters({
    prompt: 'select_account',
    ...(cleanHint && cleanHint.includes('@') ? { login_hint: cleanHint } : {}),
  });
  const result = await signInWithPopup(auth, provider);
  const fbUser = result.user;
  return {
    uid: fbUser.uid,
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'TaazaMandi Member',
    email: fbUser.email || '',
    emailVerified: Boolean(fbUser.emailVerified),
  };
}

export async function signOutFirebaseUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // Ignore if already signed out
  }
}

export async function syncFirebaseUserProfile(profile: {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  flat?: string;
  society?: string;
  fullAddress?: string;
  loginProvider: 'google' | 'password' | 'otp';
}): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified || auth.currentUser.uid !== profile.uid) {
    return;
  }
  const path = `users/${profile.uid}`;
  const ref = doc(db, 'users', profile.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        name: profile.name.slice(0, 100),
        phone: (profile.phone || '').slice(0, 24),
        flat: (profile.flat || '').slice(0, 60),
        society: (profile.society || '').slice(0, 140),
        fullAddress: (profile.fullAddress || '').slice(0, 280),
        loginProvider: profile.loginProvider,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        uid: profile.uid,
        name: profile.name.slice(0, 100),
        email: profile.email.slice(0, 160),
        phone: (profile.phone || '').slice(0, 24),
        flat: (profile.flat || '').slice(0, 60),
        society: (profile.society || '').slice(0, 140),
        fullAddress: (profile.fullAddress || '').slice(0, 280),
        loginProvider: profile.loginProvider,
        acceptedTerms: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface FirestoreUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  flat: string;
  society: string;
  fullAddress: string;
  loginProvider?: string;
  createdAt: string;
  updatedAt: string;
  source: 'firestore';
}

export async function fetchFirestoreUsersForAdmin(): Promise<FirestoreUserRecord[]> {
  const currentEmail = (auth.currentUser?.email || '').toLowerCase();
  if (!auth.currentUser || currentEmail !== ENV_CONFIG.OWNER_EMAIL) {
    return [];
  }
  try {
    const q = query(collection(db, 'users'), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, any>;
      const toIso = (val: any) =>
        val && typeof val.toDate === 'function'
          ? val.toDate().toISOString()
          : typeof val === 'string'
          ? val
          : new Date().toISOString();
      return {
        id: String(data.uid || d.id),
        name: String(data.name || 'Google Member'),
        email: String(data.email || ''),
        phone: String(data.phone || ''),
        flat: String(data.flat || ''),
        society: String(data.society || ''),
        fullAddress: String(data.fullAddress || ''),
        loginProvider: String(data.loginProvider || 'google'),
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
        source: 'firestore' as const,
      };
    });
  } catch (err) {
    console.warn('Firestore users read skipped:', err);
    return [];
  }
}

export async function mirrorActivityToFirestore(entry: {
  id: string;
  eventType: string;
  actionTitle: string;
  details?: string;
  pageTab?: string;
  deviceSummary?: string;
}): Promise<void> {
  const current = auth.currentUser;
  if (!current || !current.emailVerified) return;
  const safeId = entry.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `activityLogs/${safeId}`;
  try {
    await setDoc(doc(db, 'activityLogs', safeId), {
      id: safeId,
      uid: current.uid,
      userName: (current.displayName || '').slice(0, 100),
      userEmail: (current.email || '').slice(0, 160),
      eventType: entry.eventType.slice(0, 48),
      actionTitle: entry.actionTitle.slice(0, 180),
      details: (entry.details || '').slice(0, 400),
      pageTab: (entry.pageTab || '').slice(0, 60),
      deviceSummary: (entry.deviceSummary || 'Web').slice(0, 80),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function loadPlatformConfigFromFirestore(): Promise<{
  featureFlags?: Record<string, boolean>;
  activeUiSample?: string;
  festivalTheme?: Record<string, any>;
} | null> {
  const current = auth.currentUser;
  if (!current || !current.emailVerified) return null;
  try {
    const snap = await getDoc(doc(db, 'platformConfig', 'global'));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, any>;
    return {
      featureFlags:
        data.featureFlags && typeof data.featureFlags === 'object'
          ? (data.featureFlags as Record<string, boolean>)
          : undefined,
      activeUiSample: typeof data.activeUiSample === 'string' ? data.activeUiSample : undefined,
      festivalTheme:
        data.festivalTheme && typeof data.festivalTheme === 'object'
          ? (data.festivalTheme as Record<string, any>)
          : undefined,
    };
  } catch {
    return null;
  }
}

export function subscribeToPlatformConfig(
  onUpdate: (config: {
    featureFlags?: Record<string, boolean>;
    activeUiSample?: string;
    festivalTheme?: Record<string, any>;
  }) => void
): () => void {
  const current = auth.currentUser;
  if (!current || !current.emailVerified) {
    return () => {};
  }
  try {
    return onSnapshot(
      doc(db, 'platformConfig', 'global'),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as Record<string, any>;
        onUpdate({
          featureFlags:
            data.featureFlags && typeof data.featureFlags === 'object'
              ? (data.featureFlags as Record<string, boolean>)
              : undefined,
          activeUiSample: typeof data.activeUiSample === 'string' ? data.activeUiSample : undefined,
          festivalTheme:
            data.festivalTheme && typeof data.festivalTheme === 'object'
              ? (data.festivalTheme as Record<string, any>)
              : undefined,
        });
      },
      () => {
        // Ignore transient permission or network interruptions; periodic HTTP polling remains active
      }
    );
  } catch {
    return () => {};
  }
}

export async function savePlatformConfigToFirestore(payload: {
  featureFlags: Record<string, boolean>;
  activeUiSample: string;
  festivalTheme?: Record<string, any>;
}): Promise<void> {
  const current = auth.currentUser;
  if (!current || !current.emailVerified) return;
  const currentEmail = (current.email || '').toLowerCase();
  if (currentEmail !== ENV_CONFIG.OWNER_EMAIL) return;
  const path = 'platformConfig/global';
  try {
    const docPayload: Record<string, any> = {
      id: 'global',
      featureFlags: payload.featureFlags,
      activeUiSample: payload.activeUiSample,
      updatedAt: serverTimestamp(),
      updatedBy: currentEmail.slice(0, 160),
    };
    if (payload.festivalTheme && typeof payload.festivalTheme === 'object') {
      docPayload.festivalTheme = payload.festivalTheme;
    }
    await setDoc(doc(db, 'platformConfig', 'global'), docPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface FirestoreDeploymentRecord {
  envId: 'development' | 'production';
  version: string;
  releaseId: string;
  buildHash: string;
  buildHashShort: string;
  cacheHeadersValid: boolean;
  observedCacheControl: string;
  workspaceClean: boolean;
  bootedAt: string;
  updatedAt: string;
  updatedBy: string;
}

export async function syncDeploymentStateToFirestore(payload: {
  envId: 'development' | 'production';
  version: string;
  releaseId: string;
  buildHash: string;
  buildHashShort: string;
  cacheHeadersValid: boolean;
  observedCacheControl: string;
  workspaceClean: boolean;
  bootedAt: string;
}): Promise<boolean> {
  const current = auth.currentUser;
  if (!current || !current.emailVerified) return false;
  const currentEmail = (current.email || '').toLowerCase();
  if (currentEmail !== ENV_CONFIG.OWNER_EMAIL) return false;

  const path = `deploymentState/${payload.envId}`;
  try {
    await setDoc(doc(db, 'deploymentState', payload.envId), {
      envId: payload.envId,
      version: String(payload.version || '').slice(0, 32),
      releaseId: String(payload.releaseId || '').slice(0, 64),
      buildHash: String(payload.buildHash || '').replace(/[^a-fA-F0-9_-]/g, '').slice(0, 128),
      buildHashShort: String(payload.buildHashShort || '').slice(0, 16),
      cacheHeadersValid: Boolean(payload.cacheHeadersValid),
      observedCacheControl: String(payload.observedCacheControl || '').slice(0, 200),
      workspaceClean: Boolean(payload.workspaceClean),
      bootedAt: String(payload.bootedAt || new Date().toISOString()).slice(0, 64),
      updatedAt: serverTimestamp(),
      updatedBy: currentEmail.slice(0, 160),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchDeploymentStatesFromFirestore(): Promise<{
  development: FirestoreDeploymentRecord | null;
  production: FirestoreDeploymentRecord | null;
}> {
  const current = auth.currentUser;
  if (!current || !current.emailVerified) {
    return { development: null, production: null };
  }
  const currentEmail = (current.email || '').toLowerCase();
  if (currentEmail !== ENV_CONFIG.OWNER_EMAIL) {
    return { development: null, production: null };
  }

  const readOne = async (envId: 'development' | 'production'): Promise<FirestoreDeploymentRecord | null> => {
    const path = `deploymentState/${envId}`;
    try {
      const snap = await getDocFromServer(doc(db, 'deploymentState', envId));
      if (!snap.exists()) return null;
      const d = snap.data() as Record<string, any>;
      const toIso = (val: any) =>
        val && typeof val.toDate === 'function'
          ? val.toDate().toISOString()
          : typeof val === 'string'
          ? val
          : new Date().toISOString();
      return {
        envId,
        version: String(d.version || ''),
        releaseId: String(d.releaseId || ''),
        buildHash: String(d.buildHash || ''),
        buildHashShort: String(d.buildHashShort || ''),
        cacheHeadersValid: Boolean(d.cacheHeadersValid),
        observedCacheControl: String(d.observedCacheControl || ''),
        workspaceClean: Boolean(d.workspaceClean),
        bootedAt: String(d.bootedAt || ''),
        updatedAt: toIso(d.updatedAt),
        updatedBy: String(d.updatedBy || ''),
      };
    } catch (error: any) {
      if (String(error?.message || '').includes('Missing or insufficient permissions')) {
        handleFirestoreError(error, OperationType.GET, path);
      }
      return null;
    }
  };

  const [development, production] = await Promise.all([
    readOne('development'),
    readOne('production'),
  ]);
  return { development, production };
}


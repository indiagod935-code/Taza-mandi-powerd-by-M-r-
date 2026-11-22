/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Scalable Domain API Endpoint Wrappers
 */
import { apiClient, ApiError, getAdminAuthHeaders } from './client';
import { ENV_CONFIG } from '../config/env';
import type {
  BrandConfig,
  BuyerAnalyticsEntry,
  BuyerAnalyticsPeriod,
  BuyerPeriodMetrics,
  CustomerOrder,
  CustomerRewardRecord,
  CustomerRewardType,
  FestivalThemeConfig,
  MobileAccessoryItem,
  PlatformConfigState,
  PlatformFeatureFlags,
  ProduceItem,
  PublicTopBuyer,
  SavedAddress,
  StoreUiSampleId,
} from '../types';

export interface ServerUserPayload {
  id: string;
  name: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  flat: string;
  wing?: string;
  society?: string;
  roadOrStreet?: string;
  fullAddress?: string;
  savedAddresses?: SavedAddress[];
  activeAddressId?: string;
  avatarUrl?: string;
  loginMethod?: 'password' | 'otp' | 'google';
  referralCode?: string;
  createdAt?: string;
  lastLoginAt?: string;
  source?: 'backend' | 'firestore' | 'merged';
}

export interface ReverseGeocodeResponse {
  success: boolean;
  provider: string;
  lat: number;
  lng: number;
  society: string;
  roadOrStreet: string;
  area: string;
  city: string;
  pincode: string;
  fullAddress: string;
  error?: string;
}

export const authApi = {
  login: (body: { identifier: string; password: string }) =>
    apiClient.post<{ success: boolean; user: ServerUserPayload }>('/api/auth/login', body),
  register: (body: Record<string, unknown>) =>
    apiClient.post<{ success: boolean; user: ServerUserPayload }>('/api/auth/register', body),
  socialGoogle: (body: {
    email: string;
    name?: string;
    uid?: string;
    emailVerified?: boolean;
    photoUrl?: string;
    phone?: string;
  }) =>
    apiClient.post<{
      success: boolean;
      registered?: boolean;
      profile?: { uid: string; name: string; email: string };
      user?: ServerUserPayload;
      orders?: CustomerOrder[];
    }>('/api/auth/social-google', body),
  sendOtp: (phone: string, purpose: 'login' | 'forgot') =>
    apiClient.post<{ success: boolean; otpPreview?: string; otp?: string }>('/api/auth/send-otp', {
      phone,
      purpose,
    }),
  verifyOtp: (phone: string, otp: string) =>
    apiClient.post<{ success: boolean; user?: ServerUserPayload; needsProfile?: boolean }>(
      '/api/auth/verify-otp',
      { phone, otp }
    ),
  resetPassword: (body: { phone: string; otp: string; newPassword: string }) =>
    apiClient.post<{ success: boolean; user: ServerUserPayload }>('/api/auth/reset-password', body),
};

export const usersApi = {
  getAdminUsers: () =>
    apiClient.get<{ success: boolean; users: ServerUserPayload[] }>('/api/admin/users'),
  updateProfile: (userId: string, updates: Record<string, unknown>) =>
    apiClient.put<{ success: boolean; user: ServerUserPayload }>(
      `/api/user/profile/${encodeURIComponent(userId)}`,
      updates
    ),
  getReferralStats: (userId: string) =>
    apiClient.get<{ success: boolean; referralCode?: string; referrals?: unknown[] }>(
      `/api/referrals/${encodeURIComponent(userId)}`
    ),
};

export const ordersApi = {
  list: () => apiClient.get<{ success: boolean; orders: CustomerOrder[] }>('/api/orders'),
  create: (order: CustomerOrder) =>
    apiClient.post<{ success: boolean; order: CustomerOrder }>('/api/orders', order),
  updateStatus: (orderId: string, status: CustomerOrder['status'], note?: string) =>
    apiClient.put<{ success: boolean; order?: CustomerOrder }>(
      `/api/orders/${encodeURIComponent(orderId)}/status`,
      { status, note }
    ),
};

export const catalogApi = {
  getCatalog: () =>
    apiClient.get<{ success: boolean; produce?: ProduceItem[]; accessories?: MobileAccessoryItem[] }>(
      '/api/catalog'
    ),
  saveProduce: (produce: ProduceItem[]) =>
    apiClient.post<{ success: boolean }>('/api/catalog/produce', { produce }),
};

export const geocodeApi = {
  reverse: (lat: number, lng: number) =>
    apiClient.get<ReverseGeocodeResponse>(
      `/api/geocode/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
      { timeoutMs: 10_000 }
    ),
};

export const appApi = {
  getApkStatus: () =>
    apiClient.get<{
      success: boolean;
      hasApk: boolean;
      hasTwaBundle: boolean;
      version: string;
      bundleDownloadUrl: string;
      apkDownloadUrl?: string | null;
      message?: string;
    }>('/api/app/apk-status'),
};

export const activityApi = {
  list: (limit = 200) =>
    apiClient.get<{ success: boolean; logs: unknown[] }>(`/api/activity-logs?limit=${limit}`),
  create: (payload: Record<string, unknown>) =>
    apiClient.post<{ success: boolean; entry?: { id: string } }>('/api/activity-logs', payload),
};

export interface AdminAuditLogPayload {
  id: string;
  actorEmail: string;
  actorName: string;
  actorRole: 'admin';
  action: string;
  resource: string;
  details?: string;
  status: 'allowed' | 'denied';
  ip?: string;
  timestamp: string;
}

export const adminApi = {
  createSession: (payload: { pin?: string; email?: string; actorName?: string }) =>
    apiClient.post<{
      success: boolean;
      token: string;
      expiresAt: number;
      actor: { role: 'admin'; email: string; name: string };
    }>('/api/admin/session', payload),
  logout: () => apiClient.post<{ success: boolean }>('/api/admin/logout', {}),
  getAuditLogs: (filters?: { action?: string; status?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.action && filters.action !== 'ALL') params.set('action', filters.action);
    if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return apiClient.get<{ success: boolean; count: number; logs: AdminAuditLogPayload[] }>(
      `/api/admin/audit-logs${qs ? `?${qs}` : ''}`
    );
  },
  recordAudit: (payload: { action: string; resource?: string; details?: string }) =>
    apiClient.post<{ success: boolean; entry: AdminAuditLogPayload }>(
      '/api/admin/audit-logs',
      payload
    ),
  clearAuditLogs: () =>
    apiClient.delete<{ success: boolean; removedCount: number }>('/api/admin/audit-logs'),
  getDeploymentStatus: () => fetchDeploymentWithHeaders('GET', '/api/admin/deployment-status'),
  verifyDeployment: () => fetchDeploymentWithHeaders('POST', '/api/admin/deployment/verify'),
};

export interface DeploymentLifecycleResponse {
  success: boolean;
  verified?: boolean;
  version: string;
  releaseId: string;
  releasedAt: string;
  buildHash: string;
  buildHashShort: string;
  environment: 'production' | 'development';
  bootedAt: string;
  uptimeSeconds: number;
  distBuilt: boolean;
  distAssetCount: number;
  workspaceClean: boolean;
  runtimeStorageIsolated: boolean;
  requiredCacheControl: string;
  checkedAt: string;
  observedCacheControl: string;
  observedPragma: string;
  observedBuildHashHeader: string;
  observedEtag: string;
  cacheHeadersValid: boolean;
}

async function fetchDeploymentWithHeaders(
  method: 'GET' | 'POST',
  path: string
): Promise<DeploymentLifecycleResponse> {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${ENV_CONFIG.API_BASE_URL}${path}${sep}t=${Date.now()}`;
  const res = await fetch(url, {
    method,
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      ...getAdminAuthHeaders(),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      data?.error || `Deployment inspection failed (${res.status})`,
      res.status,
      data?.code || `HTTP_${res.status}`,
      data
    );
  }
  const cc = res.headers.get('cache-control') || '';
  const pragma = res.headers.get('pragma') || '';
  const headerHash = res.headers.get('x-build-hash') || '';
  const etag = res.headers.get('etag') || '';
  const ccLower = cc.toLowerCase();
  const cacheHeadersValid = ccLower.includes('no-cache') && ccLower.includes('no-store');
  return {
    ...data,
    observedCacheControl: cc || 'none',
    observedPragma: pragma || 'none',
    observedBuildHashHeader: headerHash,
    observedEtag: etag,
    cacheHeadersValid,
  } as DeploymentLifecycleResponse;
}

export const platformConfigApi = {
  get: () =>
    apiClient.get<{ success: boolean; config: PlatformConfigState }>('/api/platform/config'),
  update: (payload: {
    featureFlags?: Partial<PlatformFeatureFlags>;
    activeUiSample?: StoreUiSampleId;
    festivalTheme?: FestivalThemeConfig;
    brand?: Partial<BrandConfig>;
  }) =>
    apiClient.put<{ success: boolean; config: PlatformConfigState }>(
      '/api/platform/config',
      payload
    ),
};

export interface AiThemeDesignerResponse {
  success: boolean;
  reply: string;
  recommendedUiSample?: StoreUiSampleId | null;
  festivalTheme?: FestivalThemeConfig | null;
  error?: string;
}

export const aiThemeApi = {
  design: (payload: {
    prompt: string;
    currentUiSample: StoreUiSampleId;
    currentFestivalTheme?: FestivalThemeConfig;
    history?: { role: 'user' | 'assistant'; text: string }[];
  }) =>
    apiClient.post<AiThemeDesignerResponse>('/api/admin/ai-theme-designer', payload, {
      timeoutMs: 25_000,
    }),
};

export interface AdminBuyerAnalyticsResponse {
  success: boolean;
  period: BuyerAnalyticsPeriod;
  totalBuyers: number;
  top10: BuyerAnalyticsEntry[];
  remainingHistory: BuyerAnalyticsEntry[];
  summary: BuyerPeriodMetrics;
  grantedRewards: CustomerRewardRecord[];
  updatedAt: string;
}

export interface AiRewardDraft {
  rewardType: CustomerRewardType;
  couponCode: string;
  discountRupees: number;
  discountPercent: number;
  minOrderRupees: number;
  freeGiftItem: string;
  title: string;
  messageToCustomer: string;
}

export const analyticsApi = {
  getPublicTopThree: () =>
    apiClient.get<{
      success: boolean;
      buyers: PublicTopBuyer[];
      totalActiveBuyers: number;
    }>('/api/analytics/public-top-buyers'),
  getAdminBuyerAnalytics: (payload: {
    period: BuyerAnalyticsPeriod;
    extraOrders?: Partial<CustomerOrder>[];
    catalogProduceCosts?: Record<string, { wholesale?: number; market?: number }>;
    catalogAccessoryCosts?: Record<string, { wholesale?: number; mrp?: number }>;
  }) =>
    apiClient.post<AdminBuyerAnalyticsResponse>('/api/admin/buyer-analytics', payload, {
      timeoutMs: 15_000,
    }),
};

export const rewardsApi = {
  designWithAi: (payload: {
    prompt: string;
    buyerName: string;
    totalSpent: number;
    orderCount: number;
    customerSaved: number;
    adminProfit: number;
  }) =>
    apiClient.post<{
      success: boolean;
      reply: string;
      draft: AiRewardDraft;
      error?: string;
    }>('/api/admin/ai-reward-designer', payload, { timeoutMs: 25_000 }),
  grantReward: (payload: {
    targetUserId?: string;
    targetPhone?: string;
    targetName: string;
    rewardType: CustomerRewardType;
    couponCode?: string;
    discountRupees?: number;
    discountPercent?: number;
    minOrderRupees?: number;
    freeGiftItem?: string;
    title: string;
    messageToCustomer: string;
    aiPromptUsed?: string;
  }) =>
    apiClient.post<{ success: boolean; reward: CustomerRewardRecord }>(
      '/api/admin/rewards/grant',
      payload
    ),
  getMyRewards: (params: { userId?: string; phone?: string }) => {
    const qs = new URLSearchParams();
    if (params.userId) qs.set('userId', params.userId);
    if (params.phone) qs.set('phone', params.phone);
    return apiClient.get<{ success: boolean; rewards: CustomerRewardRecord[] }>(
      `/api/rewards/my?${qs.toString()}`
    );
  },
  redeemReward: (rewardId: string, orderId?: string) =>
    apiClient.post<{ success: boolean; reward?: CustomerRewardRecord }>(
      `/api/rewards/${encodeURIComponent(rewardId)}/redeem`,
      { orderId }
    ),
};

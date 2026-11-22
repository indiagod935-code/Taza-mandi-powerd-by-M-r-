import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SERVER_ENV } from './config/env.ts';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || !password) return false;
  if (storedHash.startsWith('hashed_')) {
    return storedHash === `hashed_${password}`;
  }
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function sanitizeUserAccount(user: UserAccount): Omit<UserAccount, 'passwordHash'> {
  const { passwordHash: _removed, ...safe } = user;
  return safe;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  flat: string;
  wing?: string;
  society: string;
  roadOrStreet?: string;
  fullAddress: string;
  savedAddresses: {
    id: string;
    label: string;
    flat: string;
    wing?: string;
    society: string;
    roadOrStreet?: string;
    fullAddress: string;
    isDefault?: boolean;
  }[];
  activeAddressId?: string;
  avatarUrl?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  googleUid?: string;
  verifiedGoogleEmail?: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendCustomerOrder {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  flatNumber: string;
  phone: string;
  secondaryPhone?: string;
  fullAddress: string;
  society: string;
  orderedAt: string;
  cutoffBatch: 'tomorrow_morning' | 'day_after_morning';
  status: 'ordered' | 'procured_at_mandi' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  cancelledAt?: string;
  cancelReason?: string;
  targetDeliveryDate: string;
  deliverySlot: string;
  produceItems: {
    produceId: string;
    name: {
      en: string;
      hi: string;
      mr?: string;
      hinglish?: string;
    };
    category: string;
    quantityKg: number;
    pricePerKg: number;
    wholesalePricePerKg?: number;
    itemTotal: number;
  }[];
  accessoryItems: {
    accessoryId: string;
    name: {
      en: string;
      hi: string;
      mr?: string;
      hinglish?: string;
    };
    quantity: number;
    price: number;
    itemTotal: number;
  }[];
  totalAmount: number;
  totalProduceWeightKg: number;
  totalAccessoriesCount: number;
  paymentMethod?: 'upi_qr' | 'cod' | 'wallet';
  paymentConfirmed?: boolean;
  paymentConfirmedAt?: string;
  referredByCode?: string;
  referralRewardCredited?: boolean;
  feedback?: {
    rating: number;
    freshnessTags?: string[];
    comment?: string;
    submittedAt: string;
    stage?: 'checkout' | 'delivered';
  };
}

export interface ConsolidatedItemProcurement {
  produceId: string;
  name: {
    en: string;
    hi: string;
    mr?: string;
  };
  category: string;
  customerDemandKg: number;
  familyCount: number;
  safetyBufferKg: number;
  totalWholesaleOrderKg: number;
  crateSizeKg: number;
  cratesToBuy: number;
  wholesalePricePerKg: number;
  customerPricePerKg: number;
  estimatedWholesaleCost: number;
  customerRevenue: number;
  expectedMargin: number;
  flatAllocations: {
    orderId: string;
    customerName: string;
    flat: string;
    phone: string;
    quantityKg: number;
  }[];
}

export interface ConsolidatedWholesaleOrder {
  batchId: string;
  cutoffTime: string; // e.g. "21:00" (9:00 PM)
  batchDate: string;
  targetDeliveryDate: string;
  totalOrdersCount: number;
  perishableItemsCount: number;
  totalCustomerDemandKg: number;
  totalSafetyBufferKg: number;
  totalConsolidatedProcurementKg: number;
  totalWholesaleCratesCount: number;
  estimatedTotalWholesaleCost: number;
  totalCustomerRevenue: number;
  projectedGrossMargin: number;
  items: ConsolidatedItemProcurement[];
  generatedAt: string;
}

// Data Store outside project workspace so runtime updates never trigger false "unpublished changes"
const DATA_DIR = SERVER_ENV.DATA_DIR;
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadUsers(): UserAccount[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load users from file:', err);
  }
  return [];
}

function saveUsers(users: UserAccount[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save users to file:', err);
  }
}

function isSyntheticTestOrder(order?: Partial<BackendCustomerOrder> | null): boolean {
  if (!order) return true;
  const id = String(order.id || '').trim().toUpperCase();
  const name = String(order.customerName || '').trim().toLowerCase();
  const digits = String(order.phone || '').replace(/\D/g, '').slice(-10);
  const reason = String(order.cancelReason || '').trim().toLowerCase();
  if (id.startsWith('SMOKE') || id === 'ORD-883916' || id.startsWith('TEST')) return true;
  if (digits === '9999999999' || digits === '9000011111' || digits === '9000022222') return true;
  if (/^(test|smoke|test buyer|vikram joshi)/i.test(name)) return true;
  if (reason.includes('smoke test')) return true;
  return false;
}

function loadOrders(): BackendCustomerOrder[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
      const raw = Array.isArray(data) ? (data as BackendCustomerOrder[]) : [];
      const cleaned = raw.filter((o) => !isSyntheticTestOrder(o));
      if (cleaned.length !== raw.length) {
        saveOrders(cleaned);
      }
      return cleaned;
    }
  } catch (err) {
    console.error('Failed to load orders from file:', err);
  }
  return [];
}

function saveOrders(orders: BackendCustomerOrder[]) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save orders to file:', err);
  }
}

let inMemoryUsers: UserAccount[] = loadUsers();
let inMemoryOrders: BackendCustomerOrder[] = loadOrders();

const otpChallengeStore = new Map<
  string,
  { code: string; expiresAt: number; purpose: 'login' | 'forgot' | 'register' | 'verify_phone' }
>();
const signupVerifiedPhones = new Map<string, number>();

function normalizePhone10(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

// User Management Service
export const UserService = {
  findUserByEmailOrPhone(identifier: string): UserAccount | undefined {
    const cleanId = String(identifier || '').trim().toLowerCase();
    const cleanDigits10 = normalizePhone10(identifier);
    if (!cleanId && !cleanDigits10) return undefined;

    return inMemoryUsers.find((u) => {
      const emailMatch = Boolean(cleanId && u.email && u.email.toLowerCase() === cleanId);
      const userDigits10 = normalizePhone10(u.phone);
      const phoneMatch = Boolean(cleanDigits10.length === 10 && userDigits10 === cleanDigits10);
      return emailMatch || phoneMatch;
    });
  },

  getUserById(id: string): UserAccount | undefined {
    return inMemoryUsers.find((u) => u.id === id);
  },

  registerUser(data: {
    name: string;
    phone: string;
    secondaryPhone?: string;
    email?: string;
    flat?: string;
    wing?: string;
    society?: string;
    roadOrStreet?: string;
    fullAddress?: string;
    password?: string;
    phoneVerified?: boolean;
    emailVerified?: boolean;
    googleUid?: string;
    verifiedGoogleEmail?: string;
  }): {
    success: boolean;
    user?: Omit<UserAccount, 'passwordHash'>;
    error?: string;
    code?: 'INVALID_INPUT' | 'ALREADY_EXISTS';
  } {
    const cleanName = String(data.name || '').trim();
    const cleanPhone = String(data.phone || '').trim();
    const phone10 = normalizePhone10(cleanPhone);
    const cleanPassword = String(data.password || '').trim();
    const cleanEmail = String(data.email || '').trim();

    if (!cleanName) {
      return { success: false, code: 'INVALID_INPUT', error: 'Full name is required.' };
    }
    if (phone10.length !== 10) {
      return { success: false, code: 'INVALID_INPUT', error: 'Valid 10-digit mobile number is required.' };
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      return { success: false, code: 'INVALID_INPUT', error: 'Password of at least 4 characters is required.' };
    }

    const existingByPhone = this.findUserByEmailOrPhone(phone10);
    if (existingByPhone) {
      return {
        success: false,
        code: 'ALREADY_EXISTS',
        error: 'An account is already registered with this mobile number. Please Sign In instead.',
      };
    }

    if (cleanEmail && !cleanEmail.endsWith('@tazamandi.in')) {
      const existingByEmail = this.findUserByEmailOrPhone(cleanEmail);
      if (existingByEmail) {
        return {
          success: false,
          code: 'ALREADY_EXISTS',
          error: 'An account is already registered with this email. Please Sign In instead.',
        };
      }
    }

    const cleanFlat = String(data.flat || '').trim() || 'Doorstep';
    const cleanWing = String(data.wing || '').trim();
    const cleanSociety = String(data.society || '').trim() || 'Local Delivery Area';
    const cleanRoad = String(data.roadOrStreet || '').trim();
    const fullAddr =
      String(data.fullAddress || '').trim() ||
      [cleanFlat ? `Flat ${cleanFlat}` : '', cleanWing, cleanSociety, cleanRoad]
        .filter(Boolean)
        .join(', ');

    if (!fullAddr) {
      return { success: false, code: 'INVALID_INPUT', error: 'Delivery address or building is required.' };
    }

    const userId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const defaultAddress = {
      id: `addr-${Date.now()}`,
      label: 'मुख्य पता (Home)',
      flat: cleanFlat,
      wing: cleanWing,
      society: cleanSociety,
      roadOrStreet: cleanRoad,
      fullAddress: fullAddr,
      isDefault: true,
    };

    const normalizedPhone = cleanPhone.startsWith('+91') ? cleanPhone : `+91 ${phone10}`;
    const verifiedAt = signupVerifiedPhones.get(phone10);
    const isPhoneVerified = Boolean(data.phoneVerified || (verifiedAt && verifiedAt > Date.now()));
    if (verifiedAt) {
      signupVerifiedPhones.delete(phone10);
    }

    const newUser: UserAccount = {
      id: userId,
      name: cleanName,
      email: cleanEmail || `${phone10}@tazamandi.in`,
      phone: normalizedPhone,
      secondaryPhone: String(data.secondaryPhone || '').trim(),
      flat: cleanFlat,
      wing: cleanWing,
      society: cleanSociety,
      roadOrStreet: cleanRoad,
      fullAddress: fullAddr,
      savedAddresses: [defaultAddress],
      activeAddressId: defaultAddress.id,
      phoneVerified: isPhoneVerified,
      emailVerified: Boolean(data.emailVerified),
      ...(data.googleUid ? { googleUid: String(data.googleUid) } : {}),
      ...(data.verifiedGoogleEmail ? { verifiedGoogleEmail: String(data.verifiedGoogleEmail).toLowerCase() } : {}),
      passwordHash: hashPassword(cleanPassword),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryUsers.push(newUser);
    saveUsers(inMemoryUsers);
    return { success: true, user: sanitizeUserAccount(newUser) };
  },

  verifyPasswordLogin(
    identifier: string,
    password: string
  ): {
    success: boolean;
    status?: number;
    user?: Omit<UserAccount, 'passwordHash'>;
    error?: string;
  } {
    const cleanId = String(identifier || '').trim();
    const cleanPass = String(password || '');
    if (!cleanId) {
      return { success: false, status: 400, error: 'Mobile number or email is required.' };
    }
    if (!cleanPass) {
      return { success: false, status: 400, error: 'Password is required.' };
    }

    const user = this.findUserByEmailOrPhone(cleanId);
    if (!user) {
      return {
        success: false,
        status: 404,
        error: 'Account not registered. Please Sign Up / Create Account first.',
      };
    }
    if (!verifyPassword(cleanPass, user.passwordHash)) {
      return {
        success: false,
        status: 401,
        error: 'Incorrect password. Please try again or reset your password.',
      };
    }
    return { success: true, status: 200, user: sanitizeUserAccount(user) };
  },


  issueOtpForRegisteredUser(
    phone: string,
    purpose: 'login' | 'forgot' | 'verify_phone'
  ): {
    success: boolean;
    status?: number;
    otpPreview?: string;
    error?: string;
  } {
    const phone10 = normalizePhone10(phone);
    if (phone10.length !== 10) {
      return { success: false, status: 400, error: 'Valid 10-digit registered mobile number is required.' };
    }
    const existing = this.findUserByEmailOrPhone(phone10);
    if (!existing) {
      return {
        success: false,
        status: 404,
        error: 'This mobile number is not registered. Please Create Account first.',
      };
    }
    let code = '';
    do {
      code = String(Math.floor(1000 + Math.random() * 9000));
    } while (code === '1234' || code === '0000' || code === '1111');

    otpChallengeStore.set(`${purpose}:${phone10}`, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
      purpose,
    });
    return { success: true, status: 200, otpPreview: code };
  },

  verifyOtpAndConsume(
    phone: string,
    enteredOtp: string,
    purpose: 'login' | 'forgot' | 'verify_phone'
  ): {
    success: boolean;
    status?: number;
    user?: UserAccount;
    error?: string;
  } {
    const phone10 = normalizePhone10(phone);
    const cleanOtp = String(enteredOtp || '').trim();
    if (phone10.length !== 10 || !cleanOtp) {
      return { success: false, status: 400, error: 'Mobile number and OTP are required.' };
    }
    const existing = this.findUserByEmailOrPhone(phone10);
    if (!existing) {
      return {
        success: false,
        status: 404,
        error: 'Account not registered. Please Create Account first.',
      };
    }
    const key = `${purpose}:${phone10}`;
    const challenge = otpChallengeStore.get(key);
    if (!challenge || challenge.expiresAt < Date.now()) {
      otpChallengeStore.delete(key);
      return {
        success: false,
        status: 401,
        error: 'OTP expired or not requested. Please request a fresh OTP.',
      };
    }
    if (challenge.code !== cleanOtp) {
      return {
        success: false,
        status: 401,
        error: 'Incorrect OTP code. Please enter the exact OTP.',
      };
    }
    otpChallengeStore.delete(key);
    if (purpose === 'login' || purpose === 'verify_phone') {
      existing.phoneVerified = true;
      existing.updatedAt = new Date().toISOString();
      saveUsers(inMemoryUsers);
    }
    return { success: true, status: 200, user: existing };
  },


  resetPasswordWithOtp(
    phone: string,
    otp: string,
    newPassword: string
  ): {
    success: boolean;
    status?: number;
    user?: Omit<UserAccount, 'passwordHash'>;
    error?: string;
  } {
    if (!newPassword || String(newPassword).length < 4) {
      return { success: false, status: 400, error: 'New password must be at least 4 characters.' };
    }
    const otpCheck = this.verifyOtpAndConsume(phone, otp, 'forgot');
    if (!otpCheck.success || !otpCheck.user) {
      return { success: false, status: otpCheck.status || 401, error: otpCheck.error };
    }
    otpCheck.user.passwordHash = hashPassword(String(newPassword));
    otpCheck.user.updatedAt = new Date().toISOString();
    saveUsers(inMemoryUsers);
    return { success: true, status: 200, user: sanitizeUserAccount(otpCheck.user) };
  },

  updateUserProfile(
    userId: string,
    updates: Partial<Omit<UserAccount, 'id' | 'createdAt'>>
  ): { success: boolean; user?: Omit<UserAccount, 'passwordHash'>; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, error: 'User not found' };

    const safeUpdates = { ...updates };
    delete (safeUpdates as any).passwordHash;
    if (typeof safeUpdates.avatarUrl === 'string') {
      const trimmed = safeUpdates.avatarUrl.trim();
      if (!trimmed) {
        safeUpdates.avatarUrl = '';
      } else if (
        trimmed.startsWith('data:image/') &&
        trimmed.length <= 240_000
      ) {
        safeUpdates.avatarUrl = trimmed;
      } else if (/^https?:\/\//i.test(trimmed) && trimmed.length <= 1024) {
        safeUpdates.avatarUrl = trimmed;
      } else {
        delete safeUpdates.avatarUrl;
      }
    }
    Object.assign(user, safeUpdates, { updatedAt: new Date().toISOString() });
    saveUsers(inMemoryUsers);
    return { success: true, user: sanitizeUserAccount(user) };
  },

  issueSignupOtp(phone: string): {
    success: boolean;
    status?: number;
    otpPreview?: string;
    error?: string;
  } {
    const phone10 = normalizePhone10(phone);
    if (phone10.length !== 10) {
      return { success: false, status: 400, error: 'Valid 10-digit mobile number is required.' };
    }
    const existing = this.findUserByEmailOrPhone(phone10);
    if (existing) {
      return {
        success: false,
        status: 409,
        error: 'This mobile number is already registered. Please Sign In instead.',
      };
    }
    let code = '';
    do {
      code = String(Math.floor(1000 + Math.random() * 9000));
    } while (code === '1234' || code === '0000' || code === '1111');

    otpChallengeStore.set(`register:${phone10}`, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
      purpose: 'register',
    });
    return { success: true, status: 200, otpPreview: code };
  },

  verifySignupOtp(phone: string, enteredOtp: string): {
    success: boolean;
    status?: number;
    error?: string;
  } {
    const phone10 = normalizePhone10(phone);
    const cleanOtp = String(enteredOtp || '').trim();
    if (phone10.length !== 10 || !cleanOtp) {
      return { success: false, status: 400, error: 'Mobile number and 4-digit OTP are required.' };
    }
    const key = `register:${phone10}`;
    const challenge = otpChallengeStore.get(key);
    if (!challenge || challenge.expiresAt < Date.now()) {
      otpChallengeStore.delete(key);
      return { success: false, status: 401, error: 'OTP expired or not sent. Please request a fresh OTP.' };
    }
    if (challenge.code !== cleanOtp) {
      return { success: false, status: 401, error: 'Incorrect OTP code. Please enter the exact 4-digit OTP.' };
    }
    otpChallengeStore.delete(key);
    signupVerifiedPhones.set(phone10, Date.now() + 20 * 60 * 1000);
    return { success: true, status: 200 };
  },

  verifyAccountPhoneWithOtp(
    userId: string,
    phone: string,
    enteredOtp: string
  ): {
    success: boolean;
    status?: number;
    user?: Omit<UserAccount, 'passwordHash'>;
    error?: string;
  } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, status: 404, error: 'User account not found.' };
    const otpCheck = this.verifyOtpAndConsume(phone || user.phone, enteredOtp, 'verify_phone');
    if (!otpCheck.success || !otpCheck.user || otpCheck.user.id !== user.id) {
      return { success: false, status: otpCheck.status || 401, error: otpCheck.error || 'OTP verification failed.' };
    }
    user.phoneVerified = true;
    user.updatedAt = new Date().toISOString();
    saveUsers(inMemoryUsers);
    return { success: true, status: 200, user: sanitizeUserAccount(user) };
  },

  linkGoogleEmail(
    userId: string,
    payload: { uid: string; email: string; emailVerified: boolean; name?: string }
  ): {
    success: boolean;
    status?: number;
    user?: Omit<UserAccount, 'passwordHash'>;
    error?: string;
  } {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, status: 404, error: 'User account not found.' };
    }
    const cleanEmail = String(payload.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !payload.emailVerified) {
      return { success: false, status: 400, error: 'Verified Google Gmail account is required.' };
    }
    const conflict = this.findUserByEmailOrPhone(cleanEmail);
    if (conflict && conflict.id !== user.id) {
      return {
        success: false,
        status: 409,
        error: `Gmail ${cleanEmail} is already linked to another registered account.`,
      };
    }

    user.email = cleanEmail;
    user.emailVerified = true;
    user.googleUid = String(payload.uid || '').trim();
    user.verifiedGoogleEmail = cleanEmail;
    user.updatedAt = new Date().toISOString();
    saveUsers(inMemoryUsers);
    return { success: true, status: 200, user: sanitizeUserAccount(user) };
  },

  getAllUsers(): Array<Omit<UserAccount, 'passwordHash'>> {
    return inMemoryUsers.map(sanitizeUserAccount);
  },
};

// Order Management Service
export const OrderService = {
  createOrder(
    orderData: Omit<BackendCustomerOrder, 'id' | 'orderedAt'> & { id?: string; orderedAt?: string }
  ): BackendCustomerOrder {
    const requestedId = typeof orderData.id === 'string' && orderData.id.trim() ? orderData.id.trim() : '';
    const orderId = requestedId || `ORD-${Date.now().toString().slice(-6)}`;
    const existingIdx = inMemoryOrders.findIndex((o) => o.id === orderId);
    const newOrder: BackendCustomerOrder = {
      ...orderData,
      id: orderId,
      orderedAt: orderData.orderedAt || new Date().toISOString(),
      status: 'ordered',
    };

    if (existingIdx >= 0) {
      inMemoryOrders[existingIdx] = newOrder;
    } else {
      inMemoryOrders.unshift(newOrder);
    }
    saveOrders(inMemoryOrders);
    return newOrder;
  },

  getOrderById(id: string): BackendCustomerOrder | undefined {
    return inMemoryOrders.find((o) => o.id === id);
  },

  getOrdersByUser(identifier: { email?: string; phone?: string; userId?: string }): BackendCustomerOrder[] {
    const cleanPhoneDigits = normalizePhone10(identifier.phone || '');
    const targetEmail = (identifier.email || '').trim().toLowerCase();
    return inMemoryOrders.filter((order) => {
      if (identifier.userId && order.userId === identifier.userId) return true;
      const orderEmail = (order.customerEmail || '').trim().toLowerCase();
      if (targetEmail && orderEmail && orderEmail === targetEmail) return true;
      if (cleanPhoneDigits.length === 10) {
        const orderPhoneDigits = normalizePhone10(order.phone || '');
        if (orderPhoneDigits.length === 10 && orderPhoneDigits === cleanPhoneDigits) return true;
      }
      return false;
    });
  },

  getAllOrders(): BackendCustomerOrder[] {
    return inMemoryOrders;
  },

  updateOrderStatus(
    orderId: string,
    status: BackendCustomerOrder['status'],
    paymentConfirmed?: boolean
  ): BackendCustomerOrder | undefined {
    const order = this.getOrderById(orderId);
    if (!order) return undefined;
    order.status = status;
    if (paymentConfirmed) {
      order.paymentConfirmed = true;
      order.paymentConfirmedAt = order.paymentConfirmedAt || new Date().toISOString();
    }
    saveOrders(inMemoryOrders);
    return order;
  },

  confirmDeliveryAndPayment(orderId: string): BackendCustomerOrder | undefined {
    const order = this.getOrderById(orderId);
    if (!order || order.status === 'cancelled') return undefined;
    order.status = 'delivered';
    order.paymentConfirmed = true;
    order.paymentConfirmedAt = order.paymentConfirmedAt || new Date().toISOString();
    saveOrders(inMemoryOrders);
    return order;
  },

  cancelOrder(orderId: string, reason?: string): { success: boolean; order?: BackendCustomerOrder; error?: string } {
    const order = this.getOrderById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    if (order.status === 'delivered') {
      return { success: false, error: 'Delivered orders cannot be cancelled' };
    }
    if (order.status === 'cancelled') {
      return { success: true, order };
    }
    order.status = 'cancelled';
    order.cancelledAt = new Date().toISOString();
    order.cancelReason = reason?.trim() || 'Cancelled by customer';
    saveOrders(inMemoryOrders);
    return { success: true, order };
  },

  bulkUpdateStatus(batchDate: string, status: BackendCustomerOrder['status']): number {
    let count = 0;
    inMemoryOrders.forEach((o) => {
      if (o.status !== 'delivered' && o.status !== 'cancelled') {
        o.status = status;
        count++;
      }
    });
    saveOrders(inMemoryOrders);
    return count;
  },

  submitOrderFeedback(
    orderId: string,
    payload: {
      rating: number;
      freshnessTags?: string[];
      comment?: string;
      stage?: 'checkout' | 'delivered';
    }
  ): BackendCustomerOrder | undefined {
    const order = this.getOrderById(orderId);
    if (!order || order.status === 'cancelled') return undefined;
    const clampedRating = Math.max(1, Math.min(5, Math.round(Number(payload.rating) || 5)));
    order.feedback = {
      rating: clampedRating,
      freshnessTags: Array.isArray(payload.freshnessTags)
        ? payload.freshnessTags.slice(0, 6).map((t) => String(t).trim()).filter(Boolean)
        : [],
      comment: payload.comment ? String(payload.comment).trim().slice(0, 280) : undefined,
      submittedAt: new Date().toISOString(),
      stage: payload.stage || (order.status === 'delivered' ? 'delivered' : 'checkout'),
    };
    saveOrders(inMemoryOrders);
    return order;
  },
};

export interface BackendReferralRecord {
  id: string;
  referralCode: string;
  referrerName: string;
  referrerPhone: string;
  refereeName: string;
  refereePhone: string;
  orderId: string;
  orderAmount: number;
  status: 'pending' | 'below_minimum' | 'qualified' | 'rewarded';
  cashbackAmount: number;
  freeGiftName: string;
  giftDisbursed: boolean;
  paymentConfirmed: boolean;
  deliveryStatus: BackendCustomerOrder['status'];
  rewardedAt?: string;
  createdAt: string;
}

interface ReferralStoreData {
  records: BackendReferralRecord[];
  wallets: Record<string, number>;
}

const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json');
const MIN_REFERRAL_ORDER_VALUE = 150;
const REFERRER_CASHBACK_RUPEES = 50;

function isSyntheticTestReferral(rec?: Partial<BackendReferralRecord> | null): boolean {
  if (!rec) return true;
  const id = String(rec.id || '').trim().toUpperCase();
  const code = String(rec.referralCode || '').trim().toUpperCase();
  const referee = String(rec.refereeName || '').trim().toLowerCase();
  const digits = String(rec.refereePhone || '').replace(/\D/g, '').slice(-10);
  if (id.startsWith('REF-TEST-') || id.startsWith('REF-ORD-070263') || id.startsWith('REF-ORD-070211')) return true;
  if (code.startsWith('TESTREF')) return true;
  if (/^(test buyer|vikram joshi|smoke)/i.test(referee)) return true;
  if (digits === '9000011111' || digits === '9000022222' || digits === '9999999999') return true;
  return !rec.orderId;
}

function loadReferrals(): ReferralStoreData {
  try {
    if (fs.existsSync(REFERRALS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(REFERRALS_FILE, 'utf-8'));
      const rawRecords = Array.isArray(parsed.records) ? (parsed.records as BackendReferralRecord[]) : [];
      const cleanRecords = rawRecords.filter((r) => !isSyntheticTestReferral(r));
      const cleanWallets: Record<string, number> =
        parsed.wallets && typeof parsed.wallets === 'object' ? { ...parsed.wallets } : {};
      Object.keys(cleanWallets).forEach((k) => {
        if (k.toUpperCase().startsWith('TESTREF')) delete cleanWallets[k];
      });
      if (cleanRecords.length !== rawRecords.length) {
        saveReferrals({ records: cleanRecords, wallets: cleanWallets });
      }
      return {
        records: cleanRecords,
        wallets: cleanWallets,
      };
    }
  } catch (err) {
    console.error('Failed to load referrals:', err);
  }
  return { records: [], wallets: {} };
}

function saveReferrals(data: ReferralStoreData) {
  try {
    fs.writeFileSync(REFERRALS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save referrals:', err);
  }
}

let inMemoryReferrals: ReferralStoreData = loadReferrals();

export const ReferralService = {
  recordReferredOrder(order: BackendCustomerOrder): BackendReferralRecord | null {
    const code = (order.referredByCode || '').trim().toUpperCase();
    if (!code) return null;

    const existing = inMemoryReferrals.records.find((r) => r.orderId === order.id);
    if (existing) return existing;

    const qualified = Number(order.totalAmount || 0) >= MIN_REFERRAL_ORDER_VALUE;
    const record: BackendReferralRecord = {
      id: `ref-${order.id}`,
      referralCode: code,
      referrerName: `Referrer (${code})`,
      referrerPhone: '',
      refereeName: order.customerName || 'Referred Customer',
      refereePhone: order.phone || '',
      orderId: order.id,
      orderAmount: Number(order.totalAmount || 0),
      status: qualified ? 'qualified' : 'below_minimum',
      cashbackAmount: REFERRER_CASHBACK_RUPEES,
      freeGiftName: '1 गड्डी ताज़ी पालक',
      giftDisbursed: false,
      paymentConfirmed: Boolean(order.paymentConfirmed),
      deliveryStatus: order.status,
      createdAt: order.orderedAt || new Date().toISOString(),
    };

    inMemoryReferrals.records.unshift(record);
    saveReferrals(inMemoryReferrals);
    return record;
  },

  creditOnDeliveryAndPayment(order: BackendCustomerOrder): {
    credited: boolean;
    reason?: string;
    record?: BackendReferralRecord;
    newWalletBalance?: number;
  } {
    const code = (order.referredByCode || '').trim().toUpperCase();
    if (!code) {
      return { credited: false, reason: 'No referral code attached to order' };
    }
    if (order.status !== 'delivered' || !order.paymentConfirmed) {
      return { credited: false, reason: 'Both delivery and payment confirmation are required' };
    }
    if (Number(order.totalAmount || 0) < MIN_REFERRAL_ORDER_VALUE) {
      const rec = inMemoryReferrals.records.find((r) => r.orderId === order.id);
      if (rec) {
        rec.status = 'below_minimum';
        rec.deliveryStatus = order.status;
        rec.paymentConfirmed = true;
        saveReferrals(inMemoryReferrals);
      }
      return { credited: false, reason: `Order total ₹${order.totalAmount} is below minimum ₹${MIN_REFERRAL_ORDER_VALUE}` };
    }

    let record = inMemoryReferrals.records.find((r) => r.orderId === order.id);
    if (!record) {
      record = this.recordReferredOrder(order) || undefined;
    }
    if (!record) {
      return { credited: false, reason: 'Referral record not found' };
    }
    if (record.status === 'rewarded' || order.referralRewardCredited) {
      return {
        credited: false,
        reason: 'Already rewarded',
        record,
        newWalletBalance: inMemoryReferrals.wallets[code] || 0,
      };
    }

    record.status = 'rewarded';
    record.giftDisbursed = true;
    record.paymentConfirmed = true;
    record.deliveryStatus = 'delivered';
    record.rewardedAt = new Date().toISOString();
    order.referralRewardCredited = true;
    saveOrders(inMemoryOrders);

    inMemoryReferrals.wallets[code] = (inMemoryReferrals.wallets[code] || 0) + REFERRER_CASHBACK_RUPEES;
    saveReferrals(inMemoryReferrals);

    return {
      credited: true,
      record,
      newWalletBalance: inMemoryReferrals.wallets[code],
    };
  },

  getStateByCode(referralCode?: string): { records: BackendReferralRecord[]; walletBalance: number } {
    const code = (referralCode || '').trim().toUpperCase();
    if (!code) {
      return { records: inMemoryReferrals.records, walletBalance: 0 };
    }
    return {
      records: inMemoryReferrals.records.filter((r) => r.referralCode === code),
      walletBalance: inMemoryReferrals.wallets[code] || 0,
    };
  },

  deleteRecord(id: string): boolean {
    const before = inMemoryReferrals.records.length;
    inMemoryReferrals.records = inMemoryReferrals.records.filter((r) => r.id !== id);
    if (inMemoryReferrals.records.length !== before) {
      saveReferrals(inMemoryReferrals);
      return true;
    }
    return false;
  },

  clearTestRecords(): number {
    const before = inMemoryReferrals.records.length;
    inMemoryReferrals.records = inMemoryReferrals.records.filter((r) => !isSyntheticTestReferral(r));
    Object.keys(inMemoryReferrals.wallets).forEach((k) => {
      if (k.toUpperCase().startsWith('TESTREF')) delete inMemoryReferrals.wallets[k];
    });
    const removed = before - inMemoryReferrals.records.length;
    if (removed > 0) saveReferrals(inMemoryReferrals);
    return removed;
  },
};

// Perishable Goods Wholesale Aggregation Engine with 1-2 kg Buffer & 9:00 PM Cutoff
export const PerishableAggregationEngine = {
  /**
   * Aggregates all customer orders for perishable goods placed before daily cutoff time.
   * Handles slight over-procurement (1-2 kg buffer) to account for minor discrepancies and fulfillment guarantee.
   *
   * @param options.cutoffHour 24-hr format, defaults to 21 (9:00 PM)
   * @param options.cutoffMinute defaults to 0
   * @param options.dateTarget ISO Date string (defaults to today)
   */
  generateConsolidatedWholesaleOrder(options: {
    cutoffHour?: number; // 21 for 9:00 PM
    cutoffMinute?: number;
    dateTarget?: string;
  } = {}): ConsolidatedWholesaleOrder {
    const cutoffHour = options.cutoffHour ?? 21; // 9:00 PM Default
    const cutoffMinute = options.cutoffMinute ?? 0;
    const today = new Date();
    const batchDateStr = options.dateTarget || today.toISOString().split('T')[0];

    // Tomorrow morning delivery date
    const deliveryDate = new Date(today);
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    const targetDeliveryDateStr = deliveryDate.toISOString().split('T')[0];

    // Filter eligible orders:
    const eligibleOrders = inMemoryOrders.filter((order) => {
      if (order.status === 'cancelled') return false;
      const orderDate = new Date(order.orderedAt);
      const orderHours = orderDate.getHours();
      const orderMinutes = orderDate.getMinutes();

      // Check if order was placed before cutoff (e.g. 21:00)
      const isBeforeCutoff =
        orderHours < cutoffHour || (orderHours === cutoffHour && orderMinutes <= cutoffMinute);

      // Orders for tomorrow's batch
      return isBeforeCutoff || order.cutoffBatch === 'tomorrow_morning';
    });

    // Aggregate perishable items item-by-item
    const itemMap = new Map<string, ConsolidatedItemProcurement>();

    for (const order of eligibleOrders) {
      if (!order.produceItems) continue;

      for (const item of order.produceItems) {
        const produceId = item.produceId;
        const requestedKg = Number(item.quantityKg) || 0;
        if (requestedKg <= 0) continue;

        let entry = itemMap.get(produceId);
        if (!entry) {
          entry = {
            produceId,
            name: {
              en: item.name.en || produceId,
              hi: item.name.hi || item.name.en || produceId,
              mr: item.name.mr || '',
            },
            category: item.category || 'vegetables',
            customerDemandKg: 0,
            familyCount: 0,
            safetyBufferKg: 0,
            totalWholesaleOrderKg: 0,
            crateSizeKg: 25, // Standard wholesale crate size (25kg)
            cratesToBuy: 0,
            wholesalePricePerKg: item.wholesalePricePerKg || Math.round(item.pricePerKg * 0.65),
            customerPricePerKg: item.pricePerKg,
            estimatedWholesaleCost: 0,
            customerRevenue: 0,
            expectedMargin: 0,
            flatAllocations: [],
          };
          itemMap.set(produceId, entry);
        }

        entry.customerDemandKg = Math.round((entry.customerDemandKg + requestedKg) * 10) / 10;
        entry.familyCount += 1;
        entry.flatAllocations.push({
          orderId: order.id,
          customerName: order.customerName,
          flat: order.flatNumber,
          phone: order.phone,
          quantityKg: requestedKg,
        });
      }
    }

    // Apply 1-2 kg Buffer Rule & Mandi Sacks Sizing
    let totalCustomerDemandKg = 0;
    let totalSafetyBufferKg = 0;
    let totalConsolidatedProcurementKg = 0;
    let totalWholesaleCratesCount = 0;
    let estimatedTotalWholesaleCost = 0;
    let totalCustomerRevenue = 0;

    const items: ConsolidatedItemProcurement[] = [];

    itemMap.forEach((entry) => {
      // Buffer Calculation:
      // If demand < 10 kg -> 1.0 kg safety buffer
      // If demand >= 10 kg -> 2.0 kg safety buffer (to absorb sorting loss, stems, moisture loss, and guarantee fulfillment)
      let bufferKg = 0;
      if (entry.customerDemandKg > 0) {
        if (entry.customerDemandKg < 10) {
          bufferKg = 1.0;
        } else {
          bufferKg = 2.0;
        }
      }

      entry.safetyBufferKg = bufferKg;
      entry.totalWholesaleOrderKg = Math.round((entry.customerDemandKg + bufferKg) * 10) / 10;
      entry.cratesToBuy = Math.max(1, Math.ceil(entry.totalWholesaleOrderKg / entry.crateSizeKg));

      entry.customerRevenue = Math.round(entry.customerDemandKg * entry.customerPricePerKg);
      entry.estimatedWholesaleCost = Math.round(entry.totalWholesaleOrderKg * entry.wholesalePricePerKg);
      entry.expectedMargin = Math.round(entry.customerRevenue - entry.estimatedWholesaleCost);

      totalCustomerDemandKg += entry.customerDemandKg;
      totalSafetyBufferKg += entry.safetyBufferKg;
      totalConsolidatedProcurementKg += entry.totalWholesaleOrderKg;
      totalWholesaleCratesCount += entry.cratesToBuy;
      estimatedTotalWholesaleCost += entry.estimatedWholesaleCost;
      totalCustomerRevenue += entry.customerRevenue;

      items.push(entry);
    });

    // Sort items by highest customer demand first
    items.sort((a, b) => b.customerDemandKg - a.customerDemandKg);

    const consolidatedOrder: ConsolidatedWholesaleOrder = {
      batchId: `APMC-BATCH-${batchDateStr}-${cutoffHour}H`,
      cutoffTime: `${cutoffHour.toString().padStart(2, '0')}:${cutoffMinute.toString().padStart(2, '0')} PM Cutoff`,
      batchDate: batchDateStr,
      targetDeliveryDate: targetDeliveryDateStr,
      totalOrdersCount: eligibleOrders.length,
      perishableItemsCount: items.length,
      totalCustomerDemandKg: Math.round(totalCustomerDemandKg * 10) / 10,
      totalSafetyBufferKg: Math.round(totalSafetyBufferKg * 10) / 10,
      totalConsolidatedProcurementKg: Math.round(totalConsolidatedProcurementKg * 10) / 10,
      totalWholesaleCratesCount,
      estimatedTotalWholesaleCost,
      totalCustomerRevenue,
      projectedGrossMargin: totalCustomerRevenue - estimatedTotalWholesaleCost,
      items,
      generatedAt: new Date().toISOString(),
    };

    return consolidatedOrder;
  },
};

// ============================================================================
// 4. INVENTORY TRACKING SYSTEM (Reflecting Procured vs Delivered Quantities)
// ============================================================================

export interface InventoryRecord {
  produceId: string;
  name: {
    en: string;
    hi: string;
    mr?: string;
  };
  category: string;
  demandedKg: number;
  safetyBufferKg: number;
  recommendedWholesaleKg: number;
  procuredKg: number;
  deliveredKg: number;
  inStockKg: number;
  shrinkageKg: number;
  fulfillmentRatePercent: number;
  status: 'pending_procurement' | 'procured_at_mandi' | 'partially_delivered' | 'delivered';
  lastUpdated: string;
}

const INVENTORY_FILE = path.join(DATA_DIR, 'inventory.json');

function loadInventory(): Record<string, { procuredKg: number; deliveredKg?: number; status?: string }> {
  try {
    if (fs.existsSync(INVENTORY_FILE)) {
      return JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to load inventory:', err);
  }
  return {};
}

function saveInventory(inv: Record<string, any>) {
  try {
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(inv, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save inventory:', err);
  }
}

let inMemoryInventoryOverrides: Record<string, { procuredKg: number; deliveredKg?: number; status?: string }> = loadInventory();

export const InventoryService = {
  getInventoryRecords(): InventoryRecord[] {
    const wholesale = PerishableAggregationEngine.generateConsolidatedWholesaleOrder();
    const records: InventoryRecord[] = [];

    // Calculate actual delivered kg from completed orders
    const deliveredMap: Record<string, number> = {};
    inMemoryOrders.forEach((order) => {
      if (order.status === 'delivered' && order.produceItems) {
        order.produceItems.forEach((pi) => {
          deliveredMap[pi.produceId] = (deliveredMap[pi.produceId] || 0) + (Number(pi.quantityKg) || 0);
        });
      }
    });

    wholesale.items.forEach((item) => {
      const overrides = inMemoryInventoryOverrides[item.produceId] || {};
      const demandedKg = item.customerDemandKg;
      const safetyBufferKg = item.safetyBufferKg;
      const recommendedWholesaleKg = item.totalWholesaleOrderKg;

      // Default procured is recommended wholesale if marked procured, else override or 0
      const procuredKg =
        typeof overrides.procuredKg === 'number'
          ? overrides.procuredKg
          : recommendedWholesaleKg;

      const autoDelivered = deliveredMap[item.produceId] || 0;
      const deliveredKg =
        typeof overrides.deliveredKg === 'number'
          ? overrides.deliveredKg
          : autoDelivered;

      const inStockKg = Math.max(0, Math.round((procuredKg - deliveredKg) * 10) / 10);
      const shrinkageKg = Math.max(0, Math.round((procuredKg - demandedKg) * 10) / 10);
      const fulfillmentRatePercent =
        demandedKg > 0 ? Math.min(100, Math.round((deliveredKg / demandedKg) * 100)) : 100;

      let status: InventoryRecord['status'] = 'pending_procurement';
      if (overrides.status) {
        status = overrides.status as any;
      } else if (deliveredKg >= demandedKg && demandedKg > 0) {
        status = 'delivered';
      } else if (deliveredKg > 0) {
        status = 'partially_delivered';
      } else if (procuredKg > 0) {
        status = 'procured_at_mandi';
      }

      records.push({
        produceId: item.produceId,
        name: item.name,
        category: item.category,
        demandedKg,
        safetyBufferKg,
        recommendedWholesaleKg,
        procuredKg,
        deliveredKg,
        inStockKg,
        shrinkageKg,
        fulfillmentRatePercent,
        status,
        lastUpdated: new Date().toISOString(),
      });
    });

    return records;
  },

  updateProcured(produceId: string, procuredKg: number, status?: string): InventoryRecord | undefined {
    if (!inMemoryInventoryOverrides[produceId]) {
      inMemoryInventoryOverrides[produceId] = { procuredKg: 0 };
    }
    inMemoryInventoryOverrides[produceId].procuredKg = Math.max(0, Math.round(procuredKg * 10) / 10);
    if (status) {
      inMemoryInventoryOverrides[produceId].status = status;
    }
    saveInventory(inMemoryInventoryOverrides);
    return this.getInventoryRecords().find((r) => r.produceId === produceId);
  },

  updateDelivered(produceId: string, deliveredKg: number): InventoryRecord | undefined {
    if (!inMemoryInventoryOverrides[produceId]) {
      inMemoryInventoryOverrides[produceId] = { procuredKg: 0 };
    }
    inMemoryInventoryOverrides[produceId].deliveredKg = Math.max(0, Math.round(deliveredKg * 10) / 10);
    saveInventory(inMemoryInventoryOverrides);
    return this.getInventoryRecords().find((r) => r.produceId === produceId);
  },

  recordBatchProcurement(batchItems: { produceId: string; procuredKg: number }[]): InventoryRecord[] {
    batchItems.forEach((b) => {
      if (!inMemoryInventoryOverrides[b.produceId]) {
        inMemoryInventoryOverrides[b.produceId] = { procuredKg: 0 };
      }
      inMemoryInventoryOverrides[b.produceId].procuredKg = b.procuredKg;
      inMemoryInventoryOverrides[b.produceId].status = 'procured_at_mandi';
    });
    saveInventory(inMemoryInventoryOverrides);
    return this.getInventoryRecords();
  },
};

export interface UserActivityLog {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  eventType:
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
  actionTitle: string;
  details?: string;
  pageTab?: string;
  deviceSummary?: string;
  timestamp: string;
}

const ACTIVITY_LOGS_FILE = path.join(DATA_DIR, 'activity_logs.json');
const MAX_ACTIVITY_LOGS = 500;

function loadActivityLogs(): UserActivityLog[] {
  try {
    if (fs.existsSync(ACTIVITY_LOGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ACTIVITY_LOGS_FILE, 'utf-8'));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.error('Failed to load activity logs:', err);
  }
  return [];
}

function saveActivityLogs(logs: UserActivityLog[]) {
  try {
    fs.writeFileSync(ACTIVITY_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save activity logs:', err);
  }
}

let inMemoryActivityLogs: UserActivityLog[] = loadActivityLogs();

export const ActivityLogService = {
  record(entry: Omit<UserActivityLog, 'id' | 'timestamp'>): UserActivityLog {
    const newEntry: UserActivityLog = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      userId: entry.userId ? String(entry.userId).slice(0, 80) : undefined,
      userName: entry.userName ? String(entry.userName).slice(0, 80) : undefined,
      userEmail: entry.userEmail ? String(entry.userEmail).slice(0, 120) : undefined,
      userPhone: entry.userPhone ? String(entry.userPhone).slice(0, 30) : undefined,
      eventType: entry.eventType || 'PAGE_VIEW',
      actionTitle: String(entry.actionTitle || 'Activity').slice(0, 160),
      details: entry.details ? String(entry.details).slice(0, 320) : undefined,
      pageTab: entry.pageTab ? String(entry.pageTab).slice(0, 60) : undefined,
      deviceSummary: entry.deviceSummary ? String(entry.deviceSummary).slice(0, 140) : undefined,
      timestamp: new Date().toISOString(),
    };
    inMemoryActivityLogs.unshift(newEntry);
    if (inMemoryActivityLogs.length > MAX_ACTIVITY_LOGS) {
      inMemoryActivityLogs = inMemoryActivityLogs.slice(0, MAX_ACTIVITY_LOGS);
    }
    saveActivityLogs(inMemoryActivityLogs);
    return newEntry;
  },

  list(filters?: { userId?: string; eventType?: string; limit?: number }): UserActivityLog[] {
    let items = inMemoryActivityLogs;
    if (filters?.userId) {
      const target = filters.userId.trim();
      items = items.filter((l) => l.userId === target);
    }
    if (filters?.eventType && filters.eventType !== 'ALL') {
      items = items.filter((l) => l.eventType === filters.eventType);
    }
    const max = Math.min(250, Math.max(1, Number(filters?.limit) || 120));
    return items.slice(0, max);
  },

  clear(): number {
    const removed = inMemoryActivityLogs.length;
    inMemoryActivityLogs = [];
    saveActivityLogs([]);
    return removed;
  },
};

// ============================================================================
// 6. GAMIFIED COMMUNITY SAVER LEADERBOARD (Privacy-Safe Real Aggregations)
// ============================================================================

export type SaverTierId = 'starter' | 'smart' | 'pro' | 'champion';

export interface PublicLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  areaLabel: string;
  ordersCount: number;
  totalKg: number;
  totalSpent: number;
  totalSavedRupees: number;
  referralsCount: number;
  badgesUnlocked: number;
  tierId: SaverTierId;
  xpPoints: number;
  joinedAt: string;
}

function toAnonymizedDisplayName(fullName: string): string {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Verified Member';
  if (parts.length === 1) return parts[0].slice(0, 14);
  return `${parts[0].slice(0, 12)} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

function resolveTierFromSavings(savedRupees: number): SaverTierId {
  if (savedRupees >= 5000) return 'champion';
  if (savedRupees >= 2000) return 'pro';
  if (savedRupees >= 500) return 'smart';
  return 'starter';
}

function countUnlockedBadgesFromStats(params: {
  savedRupees: number;
  totalKg: number;
  ordersCount: number;
  referralsCount: number;
}): number {
  let count = 0;
  if (params.ordersCount >= 1 || params.totalKg > 0) count += 1; // Early Bird / First Batch
  if (params.savedRupees >= 500) count += 1; // Smart Saver
  if (params.totalKg >= 10) count += 1; // Zero-Waste Eco Hero
  if (params.savedRupees >= 2000) count += 1; // Wholesale Gold Pro
  if (params.referralsCount >= 1) count += 1; // Society Connector
  if (params.savedRupees >= 5000) count += 1; // Mandi Crown Champion
  return count;
}

export const LeaderboardService = {
  getLeaderboard(sortBy: 'xp' | 'saved' | 'kg' = 'xp'): {
    entries: PublicLeaderboardEntry[];
    summary: {
      totalMembers: number;
      totalCommunitySavedRupees: number;
      totalCommunityKg: number;
      totalVerifiedOrders: number;
    };
  } {
    const activeOrders = inMemoryOrders.filter(
      (o) => o.status !== 'cancelled' && !isSyntheticTestOrder(o)
    );
    const rewardedRefsByCode = new Map<string, number>();
    inMemoryReferrals.records.forEach((r) => {
      if (r.status === 'rewarded' && !isSyntheticTestReferral(r)) {
        const key = (r.referrerPhone || '').replace(/\D/g, '').slice(-10);
        if (key) rewardedRefsByCode.set(key, (rewardedRefsByCode.get(key) || 0) + 1);
      }
    });

    const statsByMemberKey = new Map<
      string,
      {
        userId: string;
        displayName: string;
        areaLabel: string;
        ordersCount: number;
        totalKg: number;
        totalSpent: number;
        totalSavedRupees: number;
        referralsCount: number;
        joinedAt: string;
      }
    >();

    // Seed map with genuine registered accounts (zero PII exported)
    inMemoryUsers.forEach((u) => {
      const phone10 = (u.phone || '').replace(/\D/g, '').slice(-10);
      const emailKey = (u.email || '').trim().toLowerCase();
      const memberKey = phone10 || emailKey || u.id;
      statsByMemberKey.set(memberKey, {
        userId: u.id,
        displayName: toAnonymizedDisplayName(u.name),
        areaLabel: (u.society || 'Local Delivery Cluster').slice(0, 32),
        ordersCount: 0,
        totalKg: 0,
        totalSpent: 0,
        totalSavedRupees: 0,
        referralsCount: phone10 ? rewardedRefsByCode.get(phone10) || 0 : 0,
        joinedAt: u.createdAt,
      });
    });

    // Fold real non-cancelled orders into matching member rows
    activeOrders.forEach((order) => {
      const phone10 = (order.phone || '').replace(/\D/g, '').slice(-10);
      const emailKey = (order.customerEmail || '').trim().toLowerCase();
      let existing =
        (phone10 && statsByMemberKey.get(phone10)) ||
        (emailKey && statsByMemberKey.get(emailKey));

      if (!existing && order.userId) {
        for (const v of statsByMemberKey.values()) {
          if (v.userId === order.userId) {
            existing = v;
            break;
          }
        }
      }

      if (!existing) {
        const fallbackKey = phone10 || emailKey || order.id;
        existing = {
          userId: order.userId || fallbackKey,
          displayName: toAnonymizedDisplayName(order.customerName),
          areaLabel: (order.society || 'Society Member').slice(0, 32),
          ordersCount: 0,
          totalKg: 0,
          totalSpent: 0,
          totalSavedRupees: 0,
          referralsCount: phone10 ? rewardedRefsByCode.get(phone10) || 0 : 0,
          joinedAt: order.orderedAt,
        };
        statsByMemberKey.set(fallbackKey, existing);
      }

      const orderKg = Number(order.totalProduceWeightKg) || 0;
      const orderSpent = Number(order.totalAmount) || 0;
      // Direct wholesale savings (~32% vs local retail) + spoilage protection (~14%) on produce spend
      const produceSpend = (order.produceItems || []).reduce((s, p) => s + (p.itemTotal || 0), 0);
      const retailComparable = Math.round(produceSpend * 1.32);
      const directSaved = Math.max(0, retailComparable - produceSpend);
      const spoilageSaved = Math.round(retailComparable * 0.14);

      existing.ordersCount += 1;
      existing.totalKg = Math.round((existing.totalKg + orderKg) * 10) / 10;
      existing.totalSpent += Math.round(orderSpent);
      existing.totalSavedRupees += directSaved + spoilageSaved;
    });

    const enriched: PublicLeaderboardEntry[] = Array.from(statsByMemberKey.values()).map((row) => {
      const tierId = resolveTierFromSavings(row.totalSavedRupees);
      const badgesUnlocked = countUnlockedBadgesFromStats({
        savedRupees: row.totalSavedRupees,
        totalKg: row.totalKg,
        ordersCount: row.ordersCount,
        referralsCount: row.referralsCount,
      });
      const xpPoints = Math.round(
        row.totalSavedRupees * 0.5 +
          row.totalKg * 25 +
          row.ordersCount * 120 +
          row.referralsCount * 200
      );
      return {
        rank: 0,
        ...row,
        badgesUnlocked,
        tierId,
        xpPoints,
      };
    });

    enriched.sort((a, b) => {
      if (sortBy === 'saved') return b.totalSavedRupees - a.totalSavedRupees || b.xpPoints - a.xpPoints;
      if (sortBy === 'kg') return b.totalKg - a.totalKg || b.xpPoints - a.xpPoints;
      return b.xpPoints - a.xpPoints || b.totalSavedRupees - a.totalSavedRupees;
    });

    enriched.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    const totalCommunitySavedRupees = enriched.reduce((s, r) => s + r.totalSavedRupees, 0);
    const totalCommunityKg =
      Math.round(enriched.reduce((s, r) => s + r.totalKg, 0) * 10) / 10;
    const totalVerifiedOrders = enriched.reduce((s, r) => s + r.ordersCount, 0);

    return {
      entries: enriched.slice(0, 50),
      summary: {
        totalMembers: enriched.length,
        totalCommunitySavedRupees,
        totalCommunityKg,
        totalVerifiedOrders,
      },
    };
  },
};

// ============================================================================
// 7. SMART DYNAMIC NOTIFICATION STORE
// ============================================================================

export interface DynamicNotificationBroadcast {
  id: string;
  title: string;
  message: string;
  category: 'savings' | 'cutoff' | 'freshness' | 'leaderboard' | 'order';
  priority: 'high' | 'normal';
  ctaTab?: string;
  ctaLabel?: string;
  createdAt: string;
}

const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');
const MAX_NOTIFICATIONS = 40;

function loadDynamicNotifications(): DynamicNotificationBroadcast[] {
  try {
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8'));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.error('Failed to load notifications:', err);
  }
  return [];
}

function saveDynamicNotifications(items: DynamicNotificationBroadcast[]) {
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save notifications:', err);
  }
}

let inMemoryDynamicNotifications: DynamicNotificationBroadcast[] = loadDynamicNotifications();

export const DynamicNotificationService = {
  list(limit = 20): DynamicNotificationBroadcast[] {
    return inMemoryDynamicNotifications.slice(0, Math.min(40, Math.max(1, limit)));
  },

  broadcast(input: {
    title: string;
    message: string;
    category?: DynamicNotificationBroadcast['category'];
    priority?: 'high' | 'normal';
    ctaTab?: string;
    ctaLabel?: string;
  }): DynamicNotificationBroadcast {
    const entry: DynamicNotificationBroadcast = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: String(input.title || '').trim().slice(0, 120),
      message: String(input.message || '').trim().slice(0, 320),
      category: input.category || 'freshness',
      priority: input.priority === 'high' ? 'high' : 'normal',
      ctaTab: input.ctaTab ? String(input.ctaTab).slice(0, 40) : undefined,
      ctaLabel: input.ctaLabel ? String(input.ctaLabel).slice(0, 40) : undefined,
      createdAt: new Date().toISOString(),
    };
    inMemoryDynamicNotifications.unshift(entry);
    if (inMemoryDynamicNotifications.length > MAX_NOTIFICATIONS) {
      inMemoryDynamicNotifications = inMemoryDynamicNotifications.slice(0, MAX_NOTIFICATIONS);
    }
    saveDynamicNotifications(inMemoryDynamicNotifications);
    return entry;
  },

  remove(id: string): boolean {
    const before = inMemoryDynamicNotifications.length;
    inMemoryDynamicNotifications = inMemoryDynamicNotifications.filter((n) => n.id !== id);
    if (inMemoryDynamicNotifications.length !== before) {
      saveDynamicNotifications(inMemoryDynamicNotifications);
      return true;
    }
    return false;
  },
};

// ============================================================================
// 8. ADMIN AUDIT LOG SERVICE (Persistent Security & Operations Trail)
// ============================================================================

export interface AdminAuditLogEntry {
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

const ADMIN_AUDIT_FILE = path.join(DATA_DIR, 'admin_audit_logs.json');
const MAX_ADMIN_AUDIT_LOGS = 500;

function loadAdminAuditLogs(): AdminAuditLogEntry[] {
  try {
    if (fs.existsSync(ADMIN_AUDIT_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ADMIN_AUDIT_FILE, 'utf-8'));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.error('Failed to load admin audit logs:', err);
  }
  return [];
}

function saveAdminAuditLogs(logs: AdminAuditLogEntry[]) {
  try {
    fs.writeFileSync(ADMIN_AUDIT_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save admin audit logs:', err);
  }
}

let inMemoryAdminAuditLogs: AdminAuditLogEntry[] = loadAdminAuditLogs();

export const AdminAuditService = {
  record(entry: {
    actorEmail?: string;
    actorName?: string;
    action: string;
    resource: string;
    details?: string;
    status?: 'allowed' | 'denied';
    ip?: string;
  }): AdminAuditLogEntry {
    const newEntry: AdminAuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      actorEmail: String(entry.actorEmail || 'rp2824173@gmail.com').slice(0, 120),
      actorName: String(entry.actorName || 'Platform Admin').slice(0, 80),
      actorRole: 'admin',
      action: String(entry.action || 'ADMIN_ACTION').slice(0, 60),
      resource: String(entry.resource || '/api/admin').slice(0, 120),
      details: entry.details ? String(entry.details).slice(0, 320) : undefined,
      status: entry.status === 'denied' ? 'denied' : 'allowed',
      ip: entry.ip ? String(entry.ip).slice(0, 64) : undefined,
      timestamp: new Date().toISOString(),
    };
    inMemoryAdminAuditLogs.unshift(newEntry);
    if (inMemoryAdminAuditLogs.length > MAX_ADMIN_AUDIT_LOGS) {
      inMemoryAdminAuditLogs = inMemoryAdminAuditLogs.slice(0, MAX_ADMIN_AUDIT_LOGS);
    }
    saveAdminAuditLogs(inMemoryAdminAuditLogs);
    return newEntry;
  },

  list(filters?: { action?: string; status?: string; limit?: number }): AdminAuditLogEntry[] {
    let items = inMemoryAdminAuditLogs;
    if (filters?.action && filters.action !== 'ALL') {
      items = items.filter((l) => l.action === filters.action);
    }
    if (filters?.status && filters.status !== 'ALL') {
      items = items.filter((l) => l.status === filters.status);
    }
    const max = Math.min(300, Math.max(1, Number(filters?.limit) || 150));
    return items.slice(0, max);
  },

  clear(): number {
    const removed = inMemoryAdminAuditLogs.length;
    inMemoryAdminAuditLogs = [];
    saveAdminAuditLogs([]);
    return removed;
  },
};

// ============================================================================
// 9. PLATFORM FEATURE CONTROLS & UI THEME CONFIG SERVICE
// ============================================================================

export type ServerUiSampleId = 'classic' | 'quick_mart' | 'fresh_boutique' | 'hybrid_superapp';

export interface ServerPlatformFeatureFlags {
  youtubeRecipeVideos: boolean;
  dishRecipeHelper: boolean;
  rateSavingsSuggestions: boolean;
  unitConversionToggle: boolean;
  healthBenefitsSlide: boolean;
  productInsightsModal: boolean;
  cartUpsellSuggestions: boolean;
  seasonalTrendingSection: boolean;
  storePromoBanner: boolean;
  windowCutoffBanner: boolean;
  voiceOrderAssistant: boolean;
  smartNotifications: boolean;
  communityPoolTab: boolean;
  mobileAccessoriesTab: boolean;
  leaderboardAndBadges: boolean;
  referralProgram: boolean;
  stickyCartBar: boolean;
  pwaInstallPrompt: boolean;
  productShareButtons: boolean;
  liveMapCorridor: boolean;
  languageSelector: boolean;
  founderPickBadge: boolean;
  adminBuyersAnalytics: boolean;
  batchSavingChart: boolean;
}

export interface ServerFestivalThemeConfig {
  id: string;
  name: string;
  active: boolean;
  bannerTitle: string;
  bannerSubtitle: string;
  badgeText: string;
  accentHex: string;
  surfaceTone: 'emerald' | 'saffron' | 'magenta' | 'royal' | 'gold' | 'tricolor';
  logoPreset:
    | 'default'
    | 'diwali'
    | 'holi'
    | 'ganesh'
    | 'navratri'
    | 'patriotic'
    | 'eid'
    | 'sankranti'
    | 'harvest'
    | 'custom';
  customLogoSvg?: string;
}

export interface ServerBrandConfig {
  brandName: string;
  tagline: string;
  societyName: string;
  mandiCity: string;
  whatsappContact: string;
}

export interface ServerPlatformConfig {
  featureFlags: ServerPlatformFeatureFlags;
  activeUiSample: ServerUiSampleId;
  festivalTheme?: ServerFestivalThemeConfig;
  brand?: ServerBrandConfig;
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_SERVER_FESTIVAL_THEME: ServerFestivalThemeConfig = {
  id: 'default',
  name: 'Classic Fresh Mandi',
  active: false,
  bannerTitle: '',
  bannerSubtitle: '',
  badgeText: '',
  accentHex: '#059669',
  surfaceTone: 'emerald',
  logoPreset: 'default',
};

const VALID_SURFACE_TONES = new Set([
  'emerald',
  'saffron',
  'magenta',
  'royal',
  'gold',
  'tricolor',
]);

const VALID_LOGO_PRESETS = new Set([
  'default',
  'diwali',
  'holi',
  'ganesh',
  'navratri',
  'patriotic',
  'eid',
  'sankranti',
  'harvest',
  'custom',
]);

export function sanitizeServerSvgMarkup(rawSvg?: string): string {
  if (!rawSvg || typeof rawSvg !== 'string') return '';
  const match = rawSvg.trim().match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) return '';
  const cleaned = match[0]
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<(iframe|object|embed|link|meta|style)[^>]*>([\s\S]*?<\/\1>)?/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"])[\s\S]*?\1/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/(?:xlink:)?href\s*=\s*(['"])\s*(?:javascript:|https?:|data:(?!image\/svg))[\s\S]*?\1/gi, '')
    .replace(/javascript:/gi, '');
  return cleaned.length <= 6000 ? cleaned : '';
}

function sanitizeFestivalTheme(raw: any): ServerFestivalThemeConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SERVER_FESTIVAL_THEME };
  }
  const tone = VALID_SURFACE_TONES.has(raw.surfaceTone) ? raw.surfaceTone : 'emerald';
  const preset = VALID_LOGO_PRESETS.has(raw.logoPreset) ? raw.logoPreset : 'default';
  const hex = typeof raw.accentHex === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.accentHex.trim())
    ? raw.accentHex.trim()
    : '#059669';
  const customLogoSvg = preset === 'custom' ? sanitizeServerSvgMarkup(raw.customLogoSvg) : '';
  return {
    id: String(raw.id || 'default').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48) || 'default',
    name: String(raw.name || 'Classic Fresh Mandi').slice(0, 80),
    active: Boolean(raw.active),
    bannerTitle: String(raw.bannerTitle || '').slice(0, 120),
    bannerSubtitle: String(raw.bannerSubtitle || '').slice(0, 220),
    badgeText: String(raw.badgeText || '').slice(0, 40),
    accentHex: hex,
    surfaceTone: tone,
    logoPreset: customLogoSvg ? 'custom' : preset === 'custom' ? 'default' : preset,
    ...(customLogoSvg ? { customLogoSvg } : {}),
  };
}

export const DEFAULT_SERVER_FEATURE_FLAGS: ServerPlatformFeatureFlags = {
  youtubeRecipeVideos: true,
  dishRecipeHelper: true,
  rateSavingsSuggestions: true,
  unitConversionToggle: true,
  healthBenefitsSlide: true,
  productInsightsModal: true,
  cartUpsellSuggestions: true,
  seasonalTrendingSection: true,
  storePromoBanner: true,
  windowCutoffBanner: true,
  voiceOrderAssistant: true,
  smartNotifications: true,
  communityPoolTab: true,
  mobileAccessoriesTab: true,
  leaderboardAndBadges: true,
  referralProgram: true,
  stickyCartBar: true,
  pwaInstallPrompt: true,
  productShareButtons: true,
  liveMapCorridor: true,
  languageSelector: true,
  founderPickBadge: true,
  adminBuyersAnalytics: true,
  batchSavingChart: true,
};

const PLATFORM_CONFIG_FILE = path.join(DATA_DIR, 'platform_config.json');
const VALID_UI_SAMPLES = new Set<ServerUiSampleId>([
  'classic',
  'quick_mart',
  'fresh_boutique',
  'hybrid_superapp',
]);

function loadPlatformConfig(): ServerPlatformConfig {
  try {
    if (fs.existsSync(PLATFORM_CONFIG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(PLATFORM_CONFIG_FILE, 'utf-8'));
      const rawFlags = parsed?.featureFlags || {};
      const mergedFlags: ServerPlatformFeatureFlags = { ...DEFAULT_SERVER_FEATURE_FLAGS };
      (Object.keys(DEFAULT_SERVER_FEATURE_FLAGS) as (keyof ServerPlatformFeatureFlags)[]).forEach(
        (k) => {
          if (typeof rawFlags[k] === 'boolean') {
            mergedFlags[k] = rawFlags[k];
          }
        }
      );
      const rawTheme = parsed?.activeUiSample as ServerUiSampleId;
      return {
        featureFlags: mergedFlags,
        activeUiSample: VALID_UI_SAMPLES.has(rawTheme) ? rawTheme : 'classic',
        festivalTheme: sanitizeFestivalTheme(parsed?.festivalTheme),
        brand: parsed?.brand && typeof parsed.brand === 'object' ? {
          brandName: String(parsed.brand.brandName || 'ताज़ाMandi').slice(0, 60),
          tagline: String(parsed.brand.tagline || 'होलसेल मंडी से सीधा घर · powered by MARCO 💯').slice(0, 140),
          societyName: String(parsed.brand.societyName || 'सोसायटी व डिलीवरी क्षेत्र').slice(0, 120),
          mandiCity: String(parsed.brand.mandiCity || 'APMC Vashi Wholesale Mandi, Navi Mumbai').slice(0, 120),
          whatsappContact: String(parsed.brand.whatsappContact || '+91 88288 22808').slice(0, 32),
        } : undefined,
        updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
        updatedBy: typeof parsed?.updatedBy === 'string' ? parsed.updatedBy : 'system',
      };
    }
  } catch (err) {
    console.error('Failed to load platform config:', err);
  }
  return {
    featureFlags: { ...DEFAULT_SERVER_FEATURE_FLAGS },
    activeUiSample: 'classic',
    festivalTheme: { ...DEFAULT_SERVER_FESTIVAL_THEME },
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  };
}

function savePlatformConfig(cfg: ServerPlatformConfig) {
  try {
    fs.writeFileSync(PLATFORM_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save platform config:', err);
  }
}

let inMemoryPlatformConfig: ServerPlatformConfig = loadPlatformConfig();

export const PlatformConfigService = {
  get(): ServerPlatformConfig {
    return inMemoryPlatformConfig;
  },

  update(
    partial: {
      featureFlags?: Partial<ServerPlatformFeatureFlags>;
      activeUiSample?: ServerUiSampleId;
      festivalTheme?: Partial<ServerFestivalThemeConfig>;
      brand?: Partial<ServerBrandConfig>;
    },
    actorEmail = 'rp2824173@gmail.com'
  ): { config: ServerPlatformConfig; changedKeys: string[] } {
    const changedKeys: string[] = [];
    const nextFlags: ServerPlatformFeatureFlags = { ...inMemoryPlatformConfig.featureFlags };

    if (partial.featureFlags && typeof partial.featureFlags === 'object') {
      (Object.keys(DEFAULT_SERVER_FEATURE_FLAGS) as (keyof ServerPlatformFeatureFlags)[]).forEach(
        (key) => {
          const val = partial.featureFlags?.[key];
          if (typeof val === 'boolean' && val !== nextFlags[key]) {
            nextFlags[key] = val;
            changedKeys.push(`${key}=${val ? 'ON' : 'OFF'}`);
          }
        }
      );
    }

    let nextTheme = inMemoryPlatformConfig.activeUiSample;
    if (partial.activeUiSample && VALID_UI_SAMPLES.has(partial.activeUiSample)) {
      if (partial.activeUiSample !== nextTheme) {
        nextTheme = partial.activeUiSample;
        changedKeys.push(`uiSample=${nextTheme}`);
      }
    }

    let nextFestivalTheme = inMemoryPlatformConfig.festivalTheme || { ...DEFAULT_SERVER_FESTIVAL_THEME };
    if (partial.festivalTheme && typeof partial.festivalTheme === 'object') {
      nextFestivalTheme = sanitizeFestivalTheme({
        ...nextFestivalTheme,
        ...partial.festivalTheme,
      });
      changedKeys.push(`festival=${nextFestivalTheme.active ? nextFestivalTheme.name : 'OFF'}`);
    }

    let nextBrand = inMemoryPlatformConfig.brand;
    if (partial.brand && typeof partial.brand === 'object') {
      const prevBrand = inMemoryPlatformConfig.brand || {
        brandName: 'ताज़ाMandi',
        tagline: 'होलसेल मंडी से सीधा घर · powered by MARCO 💯',
        societyName: 'सोसायटी व डिलीवरी क्षेत्र',
        mandiCity: 'APMC Vashi Wholesale Mandi, Navi Mumbai',
        whatsappContact: '+91 88288 22808',
      };
      nextBrand = {
        brandName: String(partial.brand.brandName ?? prevBrand.brandName).trim().slice(0, 60) || 'ताज़ाMandi',
        tagline: String(partial.brand.tagline ?? prevBrand.tagline).trim().slice(0, 140),
        societyName: String(partial.brand.societyName ?? prevBrand.societyName).trim().slice(0, 120),
        mandiCity: String(partial.brand.mandiCity ?? prevBrand.mandiCity).trim().slice(0, 120),
        whatsappContact: String(partial.brand.whatsappContact ?? prevBrand.whatsappContact).trim().slice(0, 32),
      };
      changedKeys.push(`brand=${nextBrand.brandName}`);
    }

    inMemoryPlatformConfig = {
      featureFlags: nextFlags,
      activeUiSample: nextTheme,
      festivalTheme: nextFestivalTheme,
      ...(nextBrand ? { brand: nextBrand } : {}),
      updatedAt: new Date().toISOString(),
      updatedBy: String(actorEmail).slice(0, 120),
    };
    savePlatformConfig(inMemoryPlatformConfig);
    return { config: inMemoryPlatformConfig, changedKeys };
  },
};

// ============================================================================
// 10. TOP BUYERS ANALYTICS & DIRECT REWARD / SURPRISE GIFT LEDGER SERVICE
// ============================================================================

export type ServerBuyerAnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

export interface ServerBuyerPeriodMetrics {
  totalSpent: number;
  totalKg: number;
  orderCount: number;
  customerSaved: number;
  adminProfit: number;
}

export interface ServerCustomerRewardRecord {
  id: string;
  targetUserId?: string;
  targetPhone: string;
  targetName: string;
  rewardType: 'coupon' | 'wallet_credit' | 'surprise_gift' | 'combo';
  couponCode: string;
  discountRupees: number;
  discountPercent: number;
  minOrderRupees: number;
  freeGiftItem?: string;
  title: string;
  messageToCustomer: string;
  aiPromptUsed?: string;
  grantedBy: string;
  status: 'active' | 'redeemed';
  createdAt: string;
  redeemedAt?: string;
  redeemedOrderId?: string;
}

const CUSTOMER_REWARDS_FILE = path.join(DATA_DIR, 'customer_rewards.json');

function loadCustomerRewards(): ServerCustomerRewardRecord[] {
  try {
    if (fs.existsSync(CUSTOMER_REWARDS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CUSTOMER_REWARDS_FILE, 'utf-8'));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.error('Failed to load customer rewards:', err);
  }
  return [];
}

function saveCustomerRewards(list: ServerCustomerRewardRecord[]) {
  try {
    fs.writeFileSync(CUSTOMER_REWARDS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save customer rewards:', err);
  }
}

let inMemoryCustomerRewards: ServerCustomerRewardRecord[] = loadCustomerRewards();

export const CustomerRewardsService = {
  listAll(): ServerCustomerRewardRecord[] {
    return inMemoryCustomerRewards;
  },

  listForUser(params: { userId?: string; phone?: string }): ServerCustomerRewardRecord[] {
    const phone10 = normalizePhone10(params.phone || '');
    const uid = String(params.userId || '').trim();
    return inMemoryCustomerRewards.filter((r) => {
      if (uid && r.targetUserId && r.targetUserId === uid) return true;
      if (phone10.length === 10 && normalizePhone10(r.targetPhone) === phone10) return true;
      return false;
    });
  },

  grantReward(
    input: {
      targetUserId?: string;
      targetPhone?: string;
      targetName: string;
      rewardType: 'coupon' | 'wallet_credit' | 'surprise_gift' | 'combo';
      couponCode?: string;
      discountRupees?: number;
      discountPercent?: number;
      minOrderRupees?: number;
      freeGiftItem?: string;
      title: string;
      messageToCustomer: string;
      aiPromptUsed?: string;
    },
    grantedBy = 'Admin'
  ): ServerCustomerRewardRecord {
    const rawCode = String(input.couponCode || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 18);
    const couponCode =
      rawCode ||
      `MARCO${Math.floor(100 + Math.random() * 900)}`;
    const record: ServerCustomerRewardRecord = {
      id: `RWD-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
      targetUserId: input.targetUserId ? String(input.targetUserId).slice(0, 80) : undefined,
      targetPhone: String(input.targetPhone || '').slice(0, 24),
      targetName: String(input.targetName || 'Customer').slice(0, 80),
      rewardType: ['coupon', 'wallet_credit', 'surprise_gift', 'combo'].includes(input.rewardType)
        ? input.rewardType
        : 'coupon',
      couponCode,
      discountRupees: Math.max(0, Math.round(Number(input.discountRupees) || 0)),
      discountPercent: Math.min(80, Math.max(0, Math.round(Number(input.discountPercent) || 0))),
      minOrderRupees: Math.max(0, Math.round(Number(input.minOrderRupees) || 0)),
      freeGiftItem: input.freeGiftItem ? String(input.freeGiftItem).trim().slice(0, 120) : undefined,
      title: String(input.title || 'MARCO 💯 Special Customer Reward').slice(0, 100),
      messageToCustomer: String(input.messageToCustomer || 'Thank you for shopping fresh with us!').slice(0, 320),
      aiPromptUsed: input.aiPromptUsed ? String(input.aiPromptUsed).slice(0, 280) : undefined,
      grantedBy: String(grantedBy).slice(0, 80),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    inMemoryCustomerRewards.unshift(record);
    saveCustomerRewards(inMemoryCustomerRewards);
    return record;
  },

  redeemReward(rewardId: string, orderId?: string): { success: boolean; reward?: ServerCustomerRewardRecord } {
    const target = inMemoryCustomerRewards.find((r) => r.id === rewardId);
    if (!target) return { success: false };
    target.status = 'redeemed';
    target.redeemedAt = new Date().toISOString();
    if (orderId) target.redeemedOrderId = String(orderId).slice(0, 64);
    saveCustomerRewards(inMemoryCustomerRewards);
    return { success: true, reward: target };
  },
};

function parseOrderEpochMs(orderedAt?: string): number {
  const raw = String(orderedAt || '').trim();
  if (!raw) return Date.now();
  if (/today/i.test(raw)) return Date.now();
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function emptyPeriodMetrics(): ServerBuyerPeriodMetrics {
  return { totalSpent: 0, totalKg: 0, orderCount: 0, customerSaved: 0, adminProfit: 0 };
}

function extractFirstName(fullName?: string): string {
  const cleaned = String(fullName || 'Customer')
    .replace(/\+91[\s-]?\d+/g, '')
    .replace(/\d{6,}/g, '')
    .trim();
  const first = cleaned.split(/\s+/)[0] || 'Customer';
  return first.slice(0, 24);
}

export const BuyerAnalyticsService = {
  computeAnalytics(options?: {
    period?: ServerBuyerAnalyticsPeriod;
    extraOrders?: Partial<BackendCustomerOrder>[];
    catalogProduceCosts?: Record<string, { wholesale?: number; market?: number }>;
    catalogAccessoryCosts?: Record<string, { wholesale?: number; mrp?: number }>;
  }) {
    const nowMs = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;
    const yearMs = 365 * dayMs;

    const mergedById = new Map<string, Partial<BackendCustomerOrder>>();
    inMemoryOrders.forEach((o) => {
      if (o && o.id && o.status !== 'cancelled' && !isSyntheticTestOrder(o)) {
        mergedById.set(o.id, o);
      }
    });
    if (Array.isArray(options?.extraOrders)) {
      options!.extraOrders.forEach((o) => {
        if (
          o &&
          o.id &&
          o.status !== 'cancelled' &&
          !(o as any).isSampleOrder &&
          !isSyntheticTestOrder(o)
        ) {
          if (!mergedById.has(o.id)) {
            mergedById.set(o.id, o);
          }
        }
      });
    }

    const activeOrders = Array.from(mergedById.values());
    const buyerMap = new Map<
      string,
      {
        buyerKey: string;
        userId?: string;
        name: string;
        firstName: string;
        phone: string;
        email: string;
        flat: string;
        lastOrderAt: string;
        lastOrderMs: number;
        daily: ServerBuyerPeriodMetrics;
        weekly: ServerBuyerPeriodMetrics;
        monthly: ServerBuyerPeriodMetrics;
        yearly: ServerBuyerPeriodMetrics;
        all: ServerBuyerPeriodMetrics;
      }
    >();

    // Seed with registered non-test users so admin also sees registered buyers
    inMemoryUsers.forEach((u) => {
      const p10 = normalizePhone10(u.phone);
      const key = p10 || (u.email || '').toLowerCase() || u.id;
      if (!key) return;
      buyerMap.set(key, {
        buyerKey: key,
        userId: u.id,
        name: u.name || 'Customer',
        firstName: extractFirstName(u.name),
        phone: u.phone || '',
        email: u.email || '',
        flat: [u.wing, u.flat, u.society].filter(Boolean).join(' · ') || 'Doorstep',
        lastOrderAt: u.updatedAt || u.createdAt,
        lastOrderMs: 0,
        daily: emptyPeriodMetrics(),
        weekly: emptyPeriodMetrics(),
        monthly: emptyPeriodMetrics(),
        yearly: emptyPeriodMetrics(),
        all: emptyPeriodMetrics(),
      });
    });

    activeOrders.forEach((ord) => {
      const p10 = normalizePhone10(ord.phone || '');
      const emailKey = String(ord.customerEmail || '').trim().toLowerCase();
      const buyerKey = p10 || emailKey || String(ord.customerName || ord.id).trim().toLowerCase();
      if (!buyerKey) return;

      let entry = buyerMap.get(buyerKey);
      if (!entry) {
        entry = {
          buyerKey,
          userId: ord.userId,
          name: String(ord.customerName || 'Customer'),
          firstName: extractFirstName(ord.customerName),
          phone: String(ord.phone || ''),
          email: String(ord.customerEmail || ''),
          flat: String(ord.flatNumber || ord.society || 'Doorstep'),
          lastOrderAt: String(ord.orderedAt || new Date().toISOString()),
          lastOrderMs: 0,
          daily: emptyPeriodMetrics(),
          weekly: emptyPeriodMetrics(),
          monthly: emptyPeriodMetrics(),
          yearly: emptyPeriodMetrics(),
          all: emptyPeriodMetrics(),
        };
        buyerMap.set(buyerKey, entry);
      }

      const ordMs = parseOrderEpochMs(ord.orderedAt);
      if (ordMs >= entry.lastOrderMs) {
        entry.lastOrderMs = ordMs;
        entry.lastOrderAt = String(ord.orderedAt || new Date(ordMs).toISOString());
      }

      const spent = Math.max(0, Number(ord.totalAmount) || 0);
      const kg = Math.max(0, Number(ord.totalProduceWeightKg) || 0);

      // Accurate customer savings & admin net profit calculation from order line items
      let wholesaleCost = 0;
      let marketValue = 0;
      (ord.produceItems || []).forEach((pi) => {
        const lineRev = Math.max(0, Number(pi.itemTotal) || (Number(pi.quantityKg) || 0) * (Number(pi.pricePerKg) || 0));
        const cInfo = options?.catalogProduceCosts?.[pi.produceId];
        const wRate = Number(pi.wholesalePricePerKg) || cInfo?.wholesale || Math.round((Number(pi.pricePerKg) || 0) * 0.72);
        const mRate = cInfo?.market || Math.round((Number(pi.pricePerKg) || 0) * 1.32);
        wholesaleCost += wRate * (Number(pi.quantityKg) || 0);
        marketValue += Math.max(lineRev, mRate * (Number(pi.quantityKg) || 0));
      });
      (ord.accessoryItems || []).forEach((ai) => {
        const lineRev = Math.max(0, Number(ai.itemTotal) || (Number(ai.quantity) || 0) * (Number(ai.price) || 0));
        const aInfo = options?.catalogAccessoryCosts?.[ai.accessoryId];
        const wCost = aInfo?.wholesale || Math.round((Number(ai.price) || 0) * 0.68);
        const mrp = aInfo?.mrp || Math.round((Number(ai.price) || 0) * 1.35);
        wholesaleCost += wCost * (Number(ai.quantity) || 0);
        marketValue += Math.max(lineRev, mrp * (Number(ai.quantity) || 0));
      });

      if (wholesaleCost <= 0 && spent > 0) wholesaleCost = Math.round(spent * 0.74);
      if (marketValue <= 0 && spent > 0) marketValue = Math.round(spent * 1.3);

      const saved = Math.max(0, Math.round(marketValue - spent));
      const profit = Math.max(0, Math.round(spent - wholesaleCost));

      const ageMs = Math.max(0, nowMs - ordMs);
      const applyBucket = (m: ServerBuyerPeriodMetrics) => {
        m.totalSpent += Math.round(spent);
        m.totalKg = Math.round((m.totalKg + kg) * 10) / 10;
        m.orderCount += 1;
        m.customerSaved += saved;
        m.adminProfit += profit;
      };

      applyBucket(entry.all);
      if (ageMs <= dayMs) applyBucket(entry.daily);
      if (ageMs <= weekMs) applyBucket(entry.weekly);
      if (ageMs <= monthMs) applyBucket(entry.monthly);
      if (ageMs <= yearMs) applyBucket(entry.yearly);
    });

    const period: ServerBuyerAnalyticsPeriod =
      options?.period && ['daily', 'weekly', 'monthly', 'yearly', 'all'].includes(options.period)
        ? options.period
        : 'all';

    const ranked = Array.from(buyerMap.values())
      .filter((b) => b.all.orderCount > 0 || b.userId)
      .sort((a, b) => {
        const diffSpent = b[period].totalSpent - a[period].totalSpent;
        if (diffSpent !== 0) return diffSpent;
        const diffAll = b.all.totalSpent - a.all.totalSpent;
        if (diffAll !== 0) return diffAll;
        return b.all.orderCount - a.all.orderCount;
      })
      .map((b, idx) => {
        const activeRewardsCount = inMemoryCustomerRewards.filter(
          (r) =>
            r.status === 'active' &&
            ((b.userId && r.targetUserId === b.userId) ||
              (normalizePhone10(b.phone).length === 10 &&
                normalizePhone10(r.targetPhone) === normalizePhone10(b.phone)))
        ).length;
        return {
          rank: idx + 1,
          buyerKey: b.buyerKey,
          userId: b.userId,
          name: b.name,
          firstName: b.firstName,
          phone: b.phone,
          email: b.email,
          flat: b.flat,
          lastOrderAt: b.lastOrderAt,
          daily: b.daily,
          weekly: b.weekly,
          monthly: b.monthly,
          yearly: b.yearly,
          all: b.all,
          activeRewardsCount,
        };
      });

    const summary = ranked.reduce(
      (acc, b) => {
        const m = b[period];
        acc.totalSpent += m.totalSpent;
        acc.totalKg = Math.round((acc.totalKg + m.totalKg) * 10) / 10;
        acc.orderCount += m.orderCount;
        acc.customerSaved += m.customerSaved;
        acc.adminProfit += m.adminProfit;
        return acc;
      },
      emptyPeriodMetrics()
    );

    return {
      period,
      totalBuyers: ranked.length,
      top10: ranked.slice(0, 10),
      remainingHistory: ranked.slice(10),
      summary,
      updatedAt: new Date().toISOString(),
    };
  },

  getPublicTopThree() {
    const activeOrders = inMemoryOrders.filter(
      (o) => o.status !== 'cancelled' && !isSyntheticTestOrder(o)
    );
    const byBuyer = new Map<
      string,
      { firstName: string; societyLabel: string; totalKg: number; totalSpent: number; orderCount: number }
    >();

    activeOrders.forEach((o) => {
      const p10 = normalizePhone10(o.phone || '');
      const key = p10 || (o.customerEmail || '').toLowerCase() || o.id;
      const prev = byBuyer.get(key) || {
        firstName: extractFirstName(o.customerName),
        societyLabel: 'Society Buyer',
        totalKg: 0,
        totalSpent: 0,
        orderCount: 0,
      };
      prev.totalKg = Math.round((prev.totalKg + (Number(o.totalProduceWeightKg) || 0)) * 10) / 10;
      prev.totalSpent += Math.round(Number(o.totalAmount) || 0);
      prev.orderCount += 1;
      byBuyer.set(key, prev);
    });

    const sorted = Array.from(byBuyer.values())
      .sort((a, b) => b.totalKg - a.totalKg || b.totalSpent - a.totalSpent)
      .slice(0, 3)
      .map((item, idx) => ({
        rank: idx + 1,
        firstName: item.firstName,
        societyLabel: item.societyLabel,
        totalKg: item.totalKg,
        orderCount: item.orderCount,
      }));

    return {
      buyers: sorted,
      totalActiveBuyers: byBuyer.size,
    };
  },
};


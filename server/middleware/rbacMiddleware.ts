/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Role-Based Access Control (RBAC) Middleware for TaazaMandi Admin Console.
 * Issues and cryptographically verifies HMAC-SHA256 signed Admin session tokens
 * so sensitive administrative APIs cannot be accessed by regular customer sessions.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { NextFunction, Request, Response } from 'express';
import { SERVER_ENV } from '../config/env.ts';

export interface AdminActor {
  role: 'admin';
  email: string;
  name: string;
  issuedAt: number;
  expiresAt: number;
}

export interface AuthenticatedAdminRequest extends Request {
  adminActor?: AdminActor;
}

const OWNER_EMAIL = (process.env.ADMIN_OWNER_EMAIL || 'rp2824173@gmail.com').trim().toLowerCase();
const MASTER_ADMIN_PIN = (process.env.ADMIN_PIN || '786796123').trim();
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function resolveSigningSecret(): string {
  const envSecret = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET;
  if (envSecret && envSecret.trim().length >= 16) {
    return envSecret.trim();
  }
  const secretFile = path.join(SERVER_ENV.DATA_DIR, '.admin_rbac_secret');
  try {
    if (!fs.existsSync(SERVER_ENV.DATA_DIR)) {
      fs.mkdirSync(SERVER_ENV.DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(secretFile)) {
      const existing = fs.readFileSync(secretFile, 'utf-8').trim();
      if (existing.length >= 32) return existing;
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretFile, generated, { encoding: 'utf-8', mode: 0o600 });
    return generated;
  } catch {
    return crypto.createHash('sha256').update(`${process.pid}-${SERVER_ENV.PORT}-marco100`).digest('hex');
  }
}

const SIGNING_SECRET = resolveSigningSecret();

function signPayload(payloadB64: string): string {
  return crypto.createHmac('sha256', SIGNING_SECRET).update(payloadB64).digest('base64url');
}

export function isAuthorizedOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  return String(email).trim().toLowerCase() === OWNER_EMAIL;
}

export function issueAdminSession(params: {
  email?: string;
  pin?: string;
  actorName?: string;
}):
  | {
      success: true;
      token: string;
      expiresAt: number;
      actor: AdminActor;
    }
  | {
      success: false;
      status: number;
      error: string;
    } {
  const cleanEmail = String(params.email || '').trim().toLowerCase();
  const cleanPin = String(params.pin || '').trim();

  const emailMatched = isAuthorizedOwnerEmail(cleanEmail);
  const pinMatched = Boolean(cleanPin && cleanPin === MASTER_ADMIN_PIN);

  if (!emailMatched && !pinMatched) {
    return {
      success: false,
      status: 403,
      error: 'Access Denied: Valid Admin PIN or verified Platform Owner credentials required.',
    };
  }

  const now = Date.now();
  const actor: AdminActor = {
    role: 'admin',
    email: emailMatched ? cleanEmail : OWNER_EMAIL,
    name: String(params.actorName || '').trim() || 'MARCO 💯 Platform Admin',
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(actor), 'utf-8').toString('base64url');
  const signature = signPayload(payloadB64);
  return {
    success: true,
    token: `${payloadB64}.${signature}`,
    expiresAt: actor.expiresAt,
    actor,
  };
}

export function verifyAdminToken(rawToken?: string | null): AdminActor | null {
  if (!rawToken || typeof rawToken !== 'string') return null;
  const trimmed = rawToken.trim();
  const dotIdx = trimmed.indexOf('.');
  if (dotIdx <= 0) return null;

  const payloadB64 = trimmed.slice(0, dotIdx);
  const providedSig = trimmed.slice(dotIdx + 1);
  if (!payloadB64 || !providedSig) return null;

  try {
    const expectedSig = signPayload(payloadB64);
    const a = Buffer.from(providedSig, 'utf-8');
    const b = Buffer.from(expectedSig, 'utf-8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as AdminActor;
    if (!decoded || decoded.role !== 'admin' || !decoded.expiresAt || decoded.expiresAt < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function extractAdminTokenFromRequest(req: Request): string | null {
  const headerToken = req.headers['x-admin-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim();
  }
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

export function requireAdminAuth(
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractAdminTokenFromRequest(req);
  if (!token) {
    res.status(401).json({
      success: false,
      code: 'ADMIN_AUTH_REQUIRED',
      error: 'Restricted Admin resource. Please unlock Admin Console first.',
    });
    return;
  }

  const actor = verifyAdminToken(token);
  if (!actor) {
    res.status(403).json({
      success: false,
      code: 'FORBIDDEN_ADMIN_ONLY',
      error: 'Invalid or expired Admin RBAC session. Please re-authenticate.',
    });
    return;
  }

  req.adminActor = actor;
  next();
}

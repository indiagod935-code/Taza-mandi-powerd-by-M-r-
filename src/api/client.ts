/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Typed REST API Client with uniform error handling, timeouts, and safe JSON parsing.
 */
import { ENV_CONFIG } from '../config/env';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, status = 500, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface RequestOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

const ADMIN_TOKEN_STORAGE_KEY = 'tazamandi_admin_token';

export function getAdminToken(): string {
  try {
    return typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || ''
      : '';
  } catch {
    return '';
  }
}

export function setAdminToken(token: string): void {
  try {
    if (typeof sessionStorage !== 'undefined' && token) {
      sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // Ignore storage restriction errors
  }
}

export function clearAdminToken(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage restriction errors
  }
}

export function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { 'x-admin-token': token } : {};
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? ENV_CONFIG.REQUEST_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const signal = options.signal || controller.signal;
  const url = `${ENV_CONFIG.API_BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...getAdminAuthHeaders(),
        ...(options.headers || {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => '');

    if (!res.ok) {
      const errorMessage =
        (isJson && (payload as { error?: string; message?: string })?.error) ||
        (isJson && (payload as { message?: string })?.message) ||
        `Request failed with status ${res.status}`;
      const errorCode =
        (isJson && (payload as { code?: string })?.code) || `HTTP_${res.status}`;
      throw new ApiError(errorMessage, res.status, errorCode, payload);
    }

    return payload as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error)?.name === 'AbortError') {
      throw new ApiError('Server request timed out. Please try again.', 408, 'TIMEOUT');
    }
    throw new ApiError(
      (err as Error)?.message || 'Network connection error. Please check your internet.',
      0,
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timer);
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};

export function extractErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err.trim()) return err;
  return fallback;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Standardized Express Error Handling Middleware & Async Wrapper
 */
import type { NextFunction, Request, Response } from 'express';

export class ApiHttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, message: string, code = 'SERVER_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function expressErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (res.headersSent) return;

  if (err instanceof ApiHttpError) {
    return res.status(err.status).json({
      success: false,
      code: err.code,
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  const message =
    err instanceof Error && err.message ? err.message : 'Internal server error';
  console.error('Unhandled API Error:', err);
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    error: message,
  });
}

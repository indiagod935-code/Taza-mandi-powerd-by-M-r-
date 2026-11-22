/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized Server Environment Configuration
 */
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const RUNTIME_DATA_DIR =
  process.env.DATA_DIR && process.env.DATA_DIR.trim()
    ? path.resolve(process.env.DATA_DIR.trim())
    : path.join(os.tmpdir(), 'taazamandi-runtime-data');

export const SERVER_ENV = {
  PORT: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PROD: process.env.NODE_ENV === 'production',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GOOGLE_MAPS_API_KEY:
    process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '',
  APP_URL: process.env.APP_URL || '',
  DATA_DIR: RUNTIME_DATA_DIR,
  PUBLIC_DIR: path.join(process.cwd(), 'public'),
} as const;

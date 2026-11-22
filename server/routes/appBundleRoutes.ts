/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Mobile App, Direct Signed APK Hosting & Android Project Routes
 */
import fs from 'fs';
import path from 'path';
import express, { Router } from 'express';
import { SERVER_ENV } from '../config/env.ts';
import { buildAndroidTwaZipBundle } from '../utils/androidTwaBundle.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';
import { requireAdminAuth, type AuthenticatedAdminRequest } from '../middleware/rbacMiddleware.ts';
import { AdminAuditService } from '../backendSystem.ts';

const router = Router();

function getDownloadsDir(): string {
  const dir = path.join(SERVER_ENV.PUBLIC_DIR, 'downloads');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

router.get(
  '/apk-status',
  asyncHandler((_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const dlDir = path.join(SERVER_ENV.PUBLIC_DIR, 'downloads');
    let apkFiles: { name: string; url: string; sizeKb: number; uploadedAt?: string }[] = [];
    if (fs.existsSync(dlDir)) {
      apkFiles = fs
        .readdirSync(dlDir)
        .filter((f) => f.toLowerCase().endsWith('.apk'))
        .map((f) => {
          const stat = fs.statSync(path.join(dlDir, f));
          return {
            name: f,
            url: `/downloads/${encodeURIComponent(f)}`,
            sizeKb: Math.max(1, Math.round(stat.size / 1024)),
            uploadedAt: stat.mtime.toISOString(),
          };
        });
    }

    res.json({
      success: true,
      hasApk: apkFiles.length > 0,
      hasNativeApk: apkFiles.length > 0,
      hasTwaBundle: true,
      version: '1.0.0',
      apkFiles,
      apkDownloadUrl: apkFiles[0]?.url || null,
      bundleDownloadUrl: '/api/app/download-android-bundle',
      universalWebApk: {
        supportedAndroidVersions: 'Android 7.0 – 15.0+',
        supportedDpi: 'nodpi / mdpi / hdpi / xhdpi / xxhdpi / xxxhdpi (Adaptive SVG + 192px/512px PNG)',
        manifestUrl: '/manifest.json',
      },
    });
  })
);

// Admin endpoint to upload a signed .apk binary directly so all customers can 1-tap download & install it
router.post(
  '/admin/upload-apk',
  requireAdminAuth,
  express.raw({ type: ['application/vnd.android.package-archive', 'application/octet-stream'], limit: '60mb' }),
  asyncHandler((req: AuthenticatedAdminRequest, res) => {
    let buffer: Buffer | null = null;
    let rawFileName = String(req.headers['x-file-name'] || 'TazaMandi_MARCO100.apk');

    if (Buffer.isBuffer(req.body)) {
      buffer = req.body;
    } else if (req.body && typeof req.body === 'object' && typeof req.body.base64Data === 'string') {
      rawFileName = String(req.body.fileName || rawFileName);
      const cleanB64 = String(req.body.base64Data).replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(cleanB64, 'base64');
    }

    if (!buffer || buffer.length < 100) {
      return res.status(400).json({
        success: false,
        error: 'Valid signed .apk binary file is required.',
      });
    }

    // Validate APK (ZIP container magic bytes PK\x03\x04) so broken non-APK files cannot be served
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
      return res.status(400).json({
        success: false,
        error: 'Invalid APK signature: file must be a real Android .apk package.',
      });
    }

    const baseName = path
      .basename(rawFileName)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.apk$/i, '');
    const safeName = `${baseName || 'TazaMandi_MARCO100'}.apk`;
    const dlDir = getDownloadsDir();
    const targetPath = path.join(dlDir, safeName);

    fs.writeFileSync(targetPath, buffer);
    const sizeKb = Math.max(1, Math.round(buffer.length / 1024));

    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'UPLOAD_ANDROID_APK',
      resource: `/downloads/${safeName}`,
      details: `Hosted Android APK ${safeName} (${sizeKb} KB)`,
      ip: req.ip,
    });

    res.json({
      success: true,
      file: {
        name: safeName,
        url: `/downloads/${encodeURIComponent(safeName)}`,
        sizeKb,
      },
    });
  })
);

router.delete(
  '/admin/apk/:name',
  requireAdminAuth,
  asyncHandler((req: AuthenticatedAdminRequest, res) => {
    const safeName = path.basename(String(req.params.name || ''));
    if (!safeName.toLowerCase().endsWith('.apk')) {
      return res.status(400).json({ success: false, error: 'Invalid APK filename' });
    }
    const targetPath = path.join(getDownloadsDir(), safeName);
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ success: false, error: 'APK file not found' });
    }
    fs.unlinkSync(targetPath);
    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'DELETE_ANDROID_APK',
      resource: `/downloads/${safeName}`,
      details: `Removed hosted APK ${safeName}`,
      ip: req.ip,
    });
    res.json({ success: true });
  })
);

router.get(
  '/download-android-bundle',
  asyncHandler((req, res) => {
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3000';
    const origin = SERVER_ENV.APP_URL || `${proto}://${host}`;
    const zipBuffer = buildAndroidTwaZipBundle(origin);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="TazaMandi_MARCO100_Android_TWA_Project.zip"');
    res.setHeader('Content-Length', String(zipBuffer.length));
    res.send(zipBuffer);
  })
);

export default router;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Catalog Business Service
 * Handles master produce & accessories sanitization, version migration, merge logic, and CSV export.
 */
import type { MobileAccessoryItem, ProduceItem } from '../types';
import { INITIAL_PRODUCE } from '../data/initialProduce';
import { INITIAL_ACCESSORIES } from '../data/initialAccessories';
import { DEFAULT_PRODUCE_FALLBACK, PRODUCT_VISUAL_REGISTRY } from '../utils/productVisualMapper';
import { ENV_CONFIG, STORAGE_KEYS } from '../config/env';
import { readStorageJson, readStorageString, removeStorageKey, writeStorageString } from '../state/storage';

export function sanitizeProduceCatalog(items: ProduceItem[] = INITIAL_PRODUCE): ProduceItem[] {
  return items.map((item) => {
    const verifiedAsset = PRODUCT_VISUAL_REGISTRY[item.id];
    const hasValidImage =
      item.image &&
      (item.image.startsWith('/assets/') ||
        item.image.startsWith('https://') ||
        item.image.startsWith('http://') ||
        item.image.startsWith('data:image/'));
    return {
      ...item,
      isAvailable: item.isAvailable !== false,
      image: verifiedAsset || (hasValidImage ? item.image : DEFAULT_PRODUCE_FALLBACK),
    };
  });
}

export function loadInitialProduceList(): ProduceItem[] {
  const sanitizedMaster = sanitizeProduceCatalog(INITIAL_PRODUCE);
  const activeVersion = readStorageString(STORAGE_KEYS.APP_VERSION);
  if (activeVersion === ENV_CONFIG.SYNC_VERSION) {
    const saved = readStorageJson<ProduceItem[] | null>(STORAGE_KEYS.MASTER_PRODUCE, null);
    if (Array.isArray(saved) && saved.length >= sanitizedMaster.length) {
      return saved;
    }
  } else {
    for (let i = 1; i <= 53; i++) {
      removeStorageKey(`tazamandi_master_produce_v${i}`);
    }
    removeStorageKey('tazamandi_master_produce_v52_verified_greens_fruits');
    writeStorageString(STORAGE_KEYS.APP_VERSION, ENV_CONFIG.SYNC_VERSION);
  }
  return sanitizedMaster;
}

export function loadMergedAccessoriesList(): MobileAccessoryItem[] {
  const saved = readStorageJson<MobileAccessoryItem[] | null>(STORAGE_KEYS.ACCESSORIES_LIST, null);
  const legacySaved = !saved
    ? readStorageJson<MobileAccessoryItem[] | null>('tazamandi_accessories_v1', null)
    : null;
  const source = saved || legacySaved;

  if (!Array.isArray(source) || source.length === 0) {
    return INITIAL_ACCESSORIES;
  }

  // Merge fresh master metadata (verified photos, founderVerified) + preserve custom studio items
  const masterById = new Map(INITIAL_ACCESSORIES.map((m) => [m.id, m]));
  const merged: MobileAccessoryItem[] = source.map((item) => {
    const master = masterById.get(item.id);
    return master
      ? {
          ...master,
          ...item,
          image: item.image && !item.image.includes('1793424236647') ? item.image : master.image,
          founderVerified: true,
        }
      : { ...item, founderVerified: item.founderVerified ?? true };
  });

  // Append any new master items not yet in storage
  const existingIds = new Set(merged.map((m) => m.id));
  for (const m of INITIAL_ACCESSORIES) {
    if (!existingIds.has(m.id)) merged.push({ ...m, founderVerified: m.founderVerified ?? true });
  }
  return merged;
}

export function buildProduceCatalogCsv(produceList: ProduceItem[]): string {
  const headers = [
    'Product ID',
    'Name English',
    'Name Hindi',
    'Name Marathi',
    'Main Category',
    'Subcategory',
    'Variety',
    'Quality Grade',
    'Selling Price (INR/kg)',
    'Wholesale Purchase Price (INR/kg)',
    'Local Market Reference Price (INR/kg)',
    'Available Stock',
    'Stock Unit',
    'In Stock Status',
    'Seasonal Status',
    'Available Units',
    'Packaging Options',
    'Origin',
    'Approval Status',
    'Last Updated',
  ];

  const rows = produceList.map((p) => [
    p.id,
    `"${p.name.en.replace(/"/g, '""')}"`,
    `"${p.name.hi.replace(/"/g, '""')}"`,
    `"${p.name.mr.replace(/"/g, '""')}"`,
    p.category,
    p.subcategory || '',
    `"${(p.variety || '').replace(/"/g, '""')}"`,
    p.qualityGrade || 'Grade-A',
    p.pricePerKg,
    p.wholesalePricePerKg,
    p.localMarketPricePerKg,
    p.availableStock ?? 50,
    p.stockUnit || 'kg',
    p.isAvailable !== false ? 'In Stock' : 'Out of Stock',
    p.isSeasonal ? 'Seasonal' : 'Regular',
    `"${(p.availableUnits || []).join('; ')}"`,
    `"${(p.packagingOptions || []).join('; ')}"`,
    `"${(p.origin || '').replace(/"/g, '""')}"`,
    p.adminApprovalStatus || 'approved',
    p.lastUpdated || new Date().toISOString().split('T')[0],
  ]);

  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

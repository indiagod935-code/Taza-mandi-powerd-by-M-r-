import http from 'http';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import dotenv from 'dotenv';
import { SERVER_ENV } from './server/config/env.ts';
import { expressErrorHandler } from './server/middleware/errorHandler.ts';
import {
  requireAdminAuth,
  issueAdminSession,
  extractAdminTokenFromRequest,
  verifyAdminToken,
  type AuthenticatedAdminRequest,
} from './server/middleware/rbacMiddleware.ts';
import geocodeRoutes from './server/routes/geocodeRoutes.ts';
import appBundleRoutes from './server/routes/appBundleRoutes.ts';
import {
  UserService,
  sanitizeUserAccount,
  OrderService,
  PerishableAggregationEngine,
  InventoryService,
  ReferralService,
  ActivityLogService,
  LeaderboardService,
  DynamicNotificationService,
  AdminAuditService,
  PlatformConfigService,
  sanitizeServerSvgMarkup,
  BuyerAnalyticsService,
  CustomerRewardsService,
  type ServerBuyerAnalyticsPeriod,
} from './server/backendSystem.ts';
import {
  APP_RELEASES,
  CURRENT_RELEASE_DATE,
  CURRENT_RELEASE_ID,
  CURRENT_RELEASE_VERSION,
} from './src/config/releases.ts';

dotenv.config();

const app = express();
const PORT = SERVER_ENV.PORT;

app.use(express.json({ limit: '15mb' }));

// Ensure AI Studio embedded preview iframes never get blocked by frame or CORS headers
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-admin-token, Cache-Control, Pragma'
  );
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Cache-Control, Pragma, X-Build-Hash, X-Build-Hash-Short, X-App-Version, X-App-Environment, ETag'
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

const SERVER_BOOT_ISO = new Date().toISOString();

function resolveRuntimeEnvironment(): 'production' | 'development' {
  const rootDir = process.cwd();
  const distIndexPath = path.join(rootDir, 'dist', 'index.html');
  const isProd =
    process.env.NODE_ENV === 'production' ||
    (process.env.NODE_ENV !== 'development' && fs.existsSync(distIndexPath));
  return isProd ? 'production' : 'development';
}

function computeBuildFingerprint() {
  const rootDir = process.cwd();
  const distDir = path.resolve(rootDir, 'dist');
  const distIndexPath = path.join(distDir, 'index.html');
  const distAssetsDir = path.join(distDir, 'assets');
  const environment = resolveRuntimeEnvironment();
  const distBuilt = fs.existsSync(distIndexPath);
  const workspaceClean = !fs.existsSync(path.join(rootDir, '.data'));

  const hash = crypto.createHash('sha256');
  hash.update(`${CURRENT_RELEASE_VERSION}:${CURRENT_RELEASE_ID}:${CURRENT_RELEASE_DATE}:${environment}`);

  let distAssetCount = 0;
  try {
    if (distBuilt) {
      hash.update(fs.readFileSync(distIndexPath));
      const swPath = path.join(distDir, 'sw.js');
      if (fs.existsSync(swPath)) {
        hash.update(fs.readFileSync(swPath));
      }
      if (fs.existsSync(distAssetsDir)) {
        const assets = fs.readdirSync(distAssetsDir).sort();
        distAssetCount = assets.length;
        for (const file of assets) {
          const stat = fs.statSync(path.join(distAssetsDir, file));
          hash.update(`${file}:${stat.size}`);
        }
      }
    }
    if (environment === 'development' || !distBuilt) {
      const watchFiles = [
        'src/config/releases.ts',
        'src/App.tsx',
        'src/components/MandiProcurementSheet.tsx',
        'src/components/AdminDeploymentLifecyclePanel.tsx',
        'src/components/AdminFeatureControlsTab.tsx',
        'src/components/LiveUpdateNotifier.tsx',
        'index.html',
        'package.json',
        'vite.config.ts',
      ];
      for (const rel of watchFiles) {
        const full = path.join(rootDir, rel);
        if (fs.existsSync(full)) {
          const stat = fs.statSync(full);
          hash.update(`${rel}:${Math.round(stat.mtimeMs)}:${stat.size}`);
        }
      }
    }
  } catch {
    // Fallback remains deterministic per release metadata
  }

  const buildHash = hash.digest('hex');
  return {
    buildHash,
    buildHashShort: buildHash.slice(0, 8),
    environment,
    distBuilt,
    distAssetCount,
    workspaceClean,
  };
}

function applyNoCacheHeaders(res: express.Response, fingerprint = computeBuildFingerprint()) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Build-Hash', fingerprint.buildHash);
  res.setHeader('X-Build-Hash-Short', fingerprint.buildHashShort);
  res.setHeader('X-App-Version', CURRENT_RELEASE_VERSION);
  res.setHeader('X-App-Environment', fingerprint.environment);
  res.setHeader('ETag', `"${CURRENT_RELEASE_VERSION}-${fingerprint.buildHashShort}"`);
  return fingerprint;
}

// Enforce Cache-Control: no-cache & X-Build-Hash on all Admin & Platform endpoints
app.use(['/api/admin/*', '/api/platform/*'], (_req, res, next) => {
  applyNoCacheHeaders(res);
  next();
});

// Lazy-initialize Google GenAI client so boot & healthchecks stay fast and warning-free
let _cachedAiClient: GoogleGenAI | null = null;
const ai = {
  get models() {
    if (!_cachedAiClient) {
      _cachedAiClient = new GoogleGenAI({
        apiKey: SERVER_ENV.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return _cachedAiClient.models;
  },
};

// Produce freshness, storage, and recipe advisor route
app.post('/api/ai/freshness-insights', async (req, res) => {
  try {
    const { items, promptType } = req.body;
    const itemList = items && items.length > 0 ? items.join(', ') : 'Batata (Potato), Kanda (Onion), Tomato';

    let prompt = '';
    if (promptType === 'storage') {
      prompt = `Provide 3 concise, highly practical Indian kitchen storage tips for these fresh farm vegetables and fruits: ${itemList}. Explain how to keep them fresh for longer without spoilage or rotting. Respond in friendly, helpful bilingual format (Hindi + English tips). Keep it under 150 words.`;
    } else if (promptType === 'mandi_estimate') {
      prompt = `Act as an expert APMC Azadpur / Vashi Mandi wholesale procurement specialist. For the following aggregated batch: ${itemList}, provide 2-3 tips on how to inspect quality at morning dawn (4 AM - 6 AM), sorting criteria, and why zero-waste group demand ordering benefits both farmers and families. Respond in concise bullet points.`;
    } else {
      prompt = `Suggest 2 authentic Indian home-style quick meal/recipe ideas that make the best use of these freshly ordered vegetables/fruits: ${itemList}. Mention key spices and why using freshly sourced mandi produce makes a huge difference in taste. Keep it under 150 words.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
    });

    res.json({ text: response.text || 'Fresh advice generated successfully.' });
  } catch (error: any) {
    console.error('Gemini error:', error);
    res.status(500).json({
      error: 'Failed to generate produce insights',
      fallback: 'Store potatoes and onions in a cool, dark, dry and airy basket. Never keep onions and potatoes in the same sack as ethylene gas accelerates sprouting.',
    });
  }
});

// Curated database of verified high-definition farm produce photography for instant sourcing
const VERIFIED_PRODUCE_PHOTO_DATABASE: Record<string, { photo: string; alts: string[] }> = {
  broccoli: {
    photo: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=800&q=80',
    alts: [
      'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583663848850-46af132dc08e?auto=format&fit=crop&w=800&q=80',
    ],
  },
  mushroom: {
    photo: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
    alts: [
      'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?auto=format&fit=crop&w=800&q=80',
    ],
  },
  'red bell pepper': {
    photo: 'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?auto=format&fit=crop&w=800&q=80',
    alts: ['https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80'],
  },
  'yellow bell pepper': {
    photo: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80',
    alts: ['https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?auto=format&fit=crop&w=800&q=80'],
  },
  zucchini: {
    photo: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=800&q=80',
    alts: ['https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?auto=format&fit=crop&w=800&q=80'],
  },
  'dragon fruit': {
    photo: 'https://images.unsplash.com/photo-1527325678964-54921661f888?auto=format&fit=crop&w=800&q=80',
    alts: ['https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=800&q=80'],
  },
  avocado: {
    photo: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80',
    alts: ['https://images.unsplash.com/photo-1519162584292-56dfc9eb5db4?auto=format&fit=crop&w=800&q=80'],
  },
  kiwi: {
    photo: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?auto=format&fit=crop&w=800&q=80',
    alts: ['https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=800&q=80'],
  },
  'cherry tomato': {
    photo: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
    alts: ['https://images.unsplash.com/photo-1546470427-e26264be0b11?auto=format&fit=crop&w=800&q=80'],
  },
  'baby corn': {
    photo: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
    alts: ['/assets/images/fresh_baby_corn.jpg'],
  },
  lettuce: {
    photo: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=800&q=80',
    alts: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'],
  },
  celery: {
    photo: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80',
    alts: ['/assets/images/fresh_dhaniya_coriander_1793423367892.jpg'],
  },
  strawberry: {
    photo: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=800&q=80',
    alts: ['https://images.unsplash.com/photo-1543528176-61b239494933?auto=format&fit=crop&w=800&q=80'],
  },
  blueberry: {
    photo: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=800&q=80',
    alts: ['https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=800&q=80'],
  },
  sitaphal: {
    photo: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
    alts: ['https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80'],
  },
  jamun: {
    photo: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=800&q=80',
    alts: ['https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=800&q=80'],
  },
};

function resolveProducePhotos(englishName: string, query: string): { photo: string; alts: string[] } {
  const norm = `${englishName} ${query}`.toLowerCase();
  for (const [key, val] of Object.entries(VERIFIED_PRODUCE_PHOTO_DATABASE)) {
    if (norm.includes(key)) {
      return val;
    }
  }
  return {
    photo: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    alts: [
      'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80',
      '/assets/images/fresh_fruits_basket_1793421532041.jpg',
    ],
  };
}

// AI SMART SOURCING & INVENTORY GENERATOR ROUTE
// Understands any produce name in Hindi, Marathi, English or Hinglish,
// validates multilingual names, estimates APMC Vashi wholesale vs retail prices,
// and produces a complete, verified product object with realistic photography.
app.post('/api/ai/smart-sourcing-lookup', requireAdminAuth, async (req: AuthenticatedAdminRequest, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Product name or query is required' });
    }
    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'AI_PRODUCE_SOURCING',
      resource: '/api/ai/smart-sourcing-lookup',
      details: `Query: ${String(query).slice(0, 80)}`,
      ip: req.ip,
    });

    const prompt = `You are the master APMC Vashi wholesale produce catalog specialist and agricultural botanist in Maharashtra.
A store manager typed this query to source or add a new fruit or vegetable: "${query}".

Analyze the item, determine its authentic agricultural details in Maharashtra APMC markets, and return a single valid JSON object with the following fields:
- "name": object with:
    "en": Clean English name (e.g. "Broccoli", "Red Bell Pepper", "Zucchini", "Dragon Fruit")
    "hi": Pure Hindi name with Devanagari script (e.g. "हरी ब्रोकली", "लाल शिमला मिर्च")
    "mr": Pure Marathi name with Devanagari script (e.g. "हिरवी ब्रोकोली", "लाल ढोबळी मिरची")
    "hinglish": Conversational Hinglish name (e.g. "Fresh Green Broccoli")
- "category": one of ["vegetables", "fruits", "leafy", "roots", "citrus"]
- "subcategory": string (e.g. "Exotic Greens", "Cruciferous", "Melons", "Berries")
- "variety": string (e.g. "Grade-A Polyhouse Fresh", "Desi Organic Hybrid")
- "wholesalePricePerKg": number (realistic APMC Vashi wholesale price in INR)
- "pricePerKg": number (fair retail customer price in INR with ~30% gross margin)
- "localMarketPricePerKg": number (typical local vendor market price ~20-30% higher)
- "minIncrementKg": number (0.25 or 0.5 or 1.0)
- "defaultKg": number (usually 0.5 or 1.0)
- "origin": string (e.g. "Pune Polyhouse Belts", "APMC Vashi Lot", "Nashik Valley")
- "mandiTierBagKg": number (e.g. 15, 20, 25)
- "freshnessGuarantee": object with "en", "hi", "mr"
- "description": object with "en", "hi", "mr", "hinglish"
- "visualEmoji": single emoji representing this item (e.g. "🥦")
- "bgGradient": Tailwind gradient string (e.g. "from-emerald-800 to-teal-950")

Respond ONLY with the JSON object. Do not wrap in markdown or backticks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const cleanId = `ai_prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const { photo, alts } = resolveProducePhotos(parsed.name?.en || '', query);

    const productItem = {
      id: cleanId,
      ...parsed,
      availableStock: 50,
      stockUnit: 'kg',
      isAvailable: true,
      isSeasonal: false,
      adminApprovalStatus: 'approved',
      lastUpdated: new Date().toISOString().split('T')[0],
      image: parsed.image || photo,
    };

    res.json({
      success: true,
      product: productItem,
      photoCandidates: [photo, ...alts],
      message: 'Product sourced, translated, and structured successfully',
    });
  } catch (error: any) {
    console.error('Smart Sourcing error:', error);
    res.status(500).json({
      error: 'Failed to source product with AI',
      message: error.message,
    });
  }
});

// AI INVENTORY BATCH GENERATOR ROUTE
// Generates multiple seasonal or themed products in one click
app.post('/api/ai/generate-inventory-batch', requireAdminAuth, async (req: AuthenticatedAdminRequest, res) => {
  try {
    const { theme, count = 4 } = req.body;
    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'AI_BATCH_SOURCING',
      resource: '/api/ai/generate-inventory-batch',
      details: `Theme: ${String(theme || 'Seasonal').slice(0, 80)} (${count} items)`,
      ip: req.ip,
    });
    const prompt = `Act as an expert APMC Vashi market merchandiser.
Generate a curated batch of ${count} distinct fresh produce items for this theme: "${theme || 'Exotic & Seasonal Fresh Produce'}".

For each item, return a complete object with:
- "name": { "en": string, "hi": string, "mr": string, "hinglish": string }
- "category": "vegetables" | "fruits" | "leafy" | "roots" | "citrus"
- "subcategory": string
- "variety": string
- "wholesalePricePerKg": number
- "pricePerKg": number
- "localMarketPricePerKg": number
- "minIncrementKg": number
- "defaultKg": number
- "origin": string
- "mandiTierBagKg": number
- "freshnessGuarantee": { "en": string, "hi": string, "mr": string }
- "description": { "en": string, "hi": string, "mr": string, "hinglish": string }
- "visualEmoji": string
- "bgGradient": string

Respond ONLY with a JSON array of ${count} items.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const items = JSON.parse(response.text || '[]');
    const finalized = items.map((p: any, idx: number) => {
      const { photo } = resolveProducePhotos(p.name?.en || '', p.subcategory || '');
      return {
        id: `ai_batch_${Date.now()}_${idx}`,
        ...p,
        availableStock: 50,
        stockUnit: 'kg',
        isAvailable: true,
        isSeasonal: false,
        adminApprovalStatus: 'approved',
        lastUpdated: new Date().toISOString().split('T')[0],
        image: p.image || photo,
      };
    });

    res.json({
      success: true,
      theme,
      items: finalized,
    });
  } catch (error: any) {
    console.error('Inventory batch error:', error);
    res.status(500).json({ error: 'Failed to generate inventory batch' });
  }
});

// MULTILINGUAL VALIDATION ROUTE
// Validates user input text for proper Hindi, Marathi, and English produce vocabulary
app.post('/api/ai/validate-multilingual', async (req, res) => {
  try {
    const { text, targetLang = 'hi' } = req.body;
    const prompt = `Validate and refine this produce name/description for Maharashtra grocery buyers: "${text}".
Return JSON with:
- "isValid": boolean
- "correctedName": { "en": string, "hi": string, "mr": string }
- "standardMandiName": string
- "notes": string in Hindi explaining the botanical or local market name.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    res.json({ success: true, validation: JSON.parse(response.text || '{}') });
  } catch (error: any) {
    res.status(500).json({ error: 'Validation failed' });
  }
});

// MARCO 100 AI ACCESSORY PRODUCT STUDIO (Multimodal Vision -> E-Commerce Copy, Specs & Pricing)
app.post('/api/ai/accessory-studio', requireAdminAuth, async (req: AuthenticatedAdminRequest, res) => {
  try {
    const { imageBase64, mimeType, categoryHint, brand = 'MARCO 100', userHint = '' } = req.body;
    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'AI_ACCESSORY_STUDIO',
      resource: '/api/ai/accessory-studio',
      details: `Brand: ${brand}, Category: ${categoryHint || 'auto'}`,
      ip: req.ip,
    });
    const promptText = `You are the senior e-commerce merchandiser for ${brand} Mobile Tech Accessories in India.
Inspect the uploaded product photo (if provided) and the seller notes: "${userHint || 'Premium mobile accessory'}", category hint: "${categoryHint || 'auto'}".
Create a polished, high-converting Indian retail catalog entry in JSON matching the schema. Keep titles crisp, realistic, and enticing. Set fair INR selling price (typically 25%-45% below MRP) and realistic wholesaleCost.`;

    const parts: any[] = [];
    if (imageBase64 && mimeType) {
      const cleanBase64 = String(imageBase64).replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType,
        },
      });
    }
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: 'One of: chargers, audio, cases, mounts, protection, powerbanks',
            },
            nameEn: { type: Type.STRING },
            nameHi: { type: Type.STRING },
            nameMr: { type: Type.STRING },
            nameHinglish: { type: Type.STRING },
            descEn: { type: Type.STRING },
            descHi: { type: Type.STRING },
            descMr: { type: Type.STRING },
            descHinglish: { type: Type.STRING },
            specs: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            warranty: { type: Type.STRING },
            suggestedMrp: { type: Type.NUMBER },
            suggestedPrice: { type: Type.NUMBER },
            suggestedWholesaleCost: { type: Type.NUMBER },
            studioPitch: { type: Type.STRING },
          },
          required: [
            'category',
            'nameEn',
            'nameHi',
            'nameMr',
            'nameHinglish',
            'descEn',
            'descHi',
            'specs',
            'warranty',
            'suggestedMrp',
            'suggestedPrice',
            'suggestedWholesaleCost',
          ],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    const validCategories = ['chargers', 'audio', 'cases', 'mounts', 'protection', 'powerbanks'];
    const safeCategory = validCategories.includes(data.category) ? data.category : (categoryHint || 'chargers');

    res.json({
      success: true,
      accessoryDraft: {
        category: safeCategory,
        brand,
        name: {
          en: data.nameEn || 'MARCO 100 Pro Tech Accessory',
          hi: data.nameHi || 'MARCO 100 प्रीमियम मोबाइल एक्सेसरी',
          mr: data.nameMr || 'MARCO 100 प्रीमियम मोबाईल अ‍ॅक्सेसरी',
          hinglish: data.nameHinglish || 'MARCO 100 Pro Accessory',
        },
        description: {
          en: data.descEn || 'Genuine MARCO 100 tested quality with warranty.',
          hi: data.descHi || 'MARCO 100 द्वारा प्रमाणित असली व टिकाऊ क्वालिटी।',
          mr: data.descMr || 'MARCO 100 प्रमाणित दर्जेदार उत्पादन.',
          hinglish: data.descHinglish || 'Genuine MARCO 100 certified quality.',
        },
        specs: Array.isArray(data.specs) && data.specs.length > 0 ? data.specs.slice(0, 4) : ['Fast Performance', 'BIS Certified'],
        warranty: data.warranty || '6 Months MARCO 100 Replacement Warranty',
        mrp: Math.max(99, Math.round(data.suggestedMrp || 999)),
        price: Math.max(49, Math.round(data.suggestedPrice || 599)),
        wholesaleCost: Math.max(30, Math.round(data.suggestedWholesaleCost || 360)),
        studioPitch: data.studioPitch || 'Clean studio contrast & MARCO 100 authenticity seal applied.',
      },
    });
  } catch (error: any) {
    console.error('Accessory Studio error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI accessory studio metadata' });
  }
});

// CONVERSATIONAL VOICE-FIRST ORDERING AI DIALOG
app.post('/api/ai/dialog', async (req, res) => {
  try {
    const {
      message,
      history = [],
      lang = 'hi',
      catalogSummary = [],
      cartSummary = [],
      ordersHistory = [],
      familyPreferences = [],
      seasonContext = '',
      voiceAutoOrderEnabled = false,
    } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemInstruction = `You are ताज़ाMandi Voice Assistant (powered by MARCO 100), a warm, proactive, smart Indian grocery & mobile accessory shopping helper.
Respond strictly in the user's active language code: "${lang}" (hi = natural Devanagari Hindi, mr = Marathi, hinglish = conversational Hindi+English in Latin script, en = English, or regional language).
You can execute store actions by returning structured JSON:
1. If user asks to buy/add vegetables, fruits, or accessories (e.g., "2 kilo aloo aur 1 kilo tamatar add karo"), match exact itemId from catalogSummary and set actionType = "ADD_ITEMS" with itemsToAdd.
2. If user says "confirm karo" / "order place karo" / "haan mangwa do":
   - If voiceAutoOrderEnabled is true: set actionType = "CONFIRM_ORDER".
   - If voiceAutoOrderEnabled is false: if items are in cart or being added, set actionType = "ASK_CONFIRM" and politely ask them to tap Confirm or turn ON Hands-Free Auto-Order.
3. If user chooses payment mode ("UPI se dunga", "QR dikhao", "cash on delivery", "COD"), set paymentMode to "upi_qr" or "cod" and actionType = "SET_PAYMENT" (or "CONFIRM_ORDER" if confirming).
4. Always leverage familyPreferences, ordersHistory, and seasonContext to craft a warm, realistic proactiveTip (e.g., reminding about Papa/Mummy's favorite item or fresh seasonal arrivals) without inventing fake prices.
5. Keep spokenText concise, warm, and natural for text-to-speech (no emojis, no asterisks, no markdown).`;

    const contextPayload = JSON.stringify({
      userMessage: message,
      recentHistory: history.slice(-6),
      voiceAutoOrderEnabled,
      seasonContext,
      familyPreferences,
      recentOrders: ordersHistory.slice(0, 5),
      currentCart: cartSummary,
      catalogItems: catalogSummary,
    });

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: contextPayload,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyText: { type: Type.STRING },
              spokenText: { type: Type.STRING },
              proactiveTip: { type: Type.STRING },
              actionType: {
                type: Type.STRING,
                description: 'One of: NONE, ADD_ITEMS, ASK_CONFIRM, CONFIRM_ORDER, SET_PAYMENT',
              },
              itemsToAdd: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    itemId: { type: Type.STRING },
                    qty: { type: Type.NUMBER },
                    itemType: { type: Type.STRING, description: 'produce or accessory' },
                  },
                  required: ['itemId', 'qty', 'itemType'],
                },
              },
              paymentMode: {
                type: Type.STRING,
                description: 'One of: NONE, upi_qr, cod',
              },
              deliverySlot: { type: Type.STRING },
            },
            required: ['replyText', 'spokenText', 'actionType', 'itemsToAdd', 'paymentMode'],
          },
        },
      });
    } catch {
      response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: contextPayload,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
        },
      });
    }

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, dialog: parsed });
  } catch (error: any) {
    console.error('AI Dialog error:', error);
    res.status(500).json({ error: error.message || 'Voice dialog assistant unavailable' });
  }
});

// STREAMING CONVERSATIONAL VOICE-FIRST AI DIALOG (SSE — ultra-low Time-To-First-Token & early voice synthesis)
app.post('/api/ai/dialog-stream', async (req, res) => {
  const {
    message,
    history = [],
    lang = 'hi',
    catalogSummary = [],
    cartSummary = [],
    ordersHistory = [],
    familyPreferences = [],
    seasonContext = '',
    voiceAutoOrderEnabled = false,
    userSummary = {},
  } = req.body || {};

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  let clientClosed = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      clientClosed = true;
    }
  });

  const writeSse = (event: string, payload: unknown) => {
    if (clientClosed || res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const systemInstruction = `You are ताज़ाMandi Voice Super-Assistant (powered by MARCO 100) with FULL control over the entire TaazaMandi app.
Respond strictly in language code "${lang}" (hi=Hindi Devanagari, mr=Marathi, hinglish=Hindi+English, en=English, etc).
CRITICAL CONVERSATIONAL ACCURACY:
- Carefully read the user's exact words and answer what they ACTUALLY asked (rates, monthly/daily savings, vegetable health benefits, order tracking, recommendations, OR adding items). Do NOT ignore their question or give an unrelated canned reply.
- Keep spoken answers natural, warm, concise, and clear (1-3 short plain-text sentences, zero markdown/asterisks/bullets) so human voice TTS sounds completely natural.

OUTPUT PROTOCOL:
1. First stream your natural spoken reply in plain text ONLY.
2. Then on a final new line output exact marker __ACTION__: followed by single-line compact JSON:
__ACTION__:{"actionType":"NONE|ADD_ITEMS|REMOVE_ITEMS|CLEAR_CART|REPEAT_LAST_ORDER|ASK_CONFIRM|CONFIRM_ORDER|CANCEL_ORDER|SET_PAYMENT|NAVIGATE|SET_LANGUAGE|SET_THEME|OPEN_MODAL|SAVE_FAMILY_FAV|CHECK_WALLET|CHECK_ORDER_STATUS|CHECK_CART_SUMMARY|SET_VOICE_TUNING","itemsToAdd":[{"itemId":"exact_id","qty":1,"itemType":"produce|accessory"}],"itemsToRemove":[{"itemId":"exact_id","qty":1,"itemType":"produce|accessory"}],"paymentMode":"NONE|upi_qr|cod","deliverySlot":"","proactiveTip":"short tip","navTab":"catalog|accessories|pool|orders|tracking|map|referral|account","category":"all|vegetables|fruits|leafy|roots|herbs|sprouts|seasonal","searchQuery":"","openCart":false,"closeCart":false,"targetLang":"","themeMode":"","modalTarget":"auth|profile|addresses|referrals|about|brand|install|tour|savings|voice_tuning","familyPref":{"relation":"Papa|Mummy|Kids|Self|Dada-Dadi","itemId":"exact_id"},"voiceTuning":{"micSensitivity":"","pausePreset":"","ttsVoice":"","ttsRate":0}}
Capabilities unlocked:
- Add/remove/clear cart items, repeat last order, confirm/cancel order, set UPI/COD payment.
- Navigate to any page (catalog, accessories, pool, tracking, map, orders, account, referral), filter any category, search products, open/close cart.
- Switch app language (targetLang: en|hi|mr|hinglish|gu|bn|ta|te|kn|pa), toggle dark/light mode, open modals including "savings" or "voice_tuning".
- Tune voice assistant hands-free: micSensitivity ("low_noise"|"balanced"|"high"), pausePreset ("fast"|"normal"|"relaxed"), ttsVoice ("Aoede"|"Kore"|"Puck"|"Fenrir"), ttsRate (0.9|1.0|1.15).
- Match exact itemIds from catalogSummary; never invent fake prices.`;

    const contextPayload = JSON.stringify({
      msg: message,
      hist: Array.isArray(history) ? history.slice(-6) : [],
      autoOrder: Boolean(voiceAutoOrderEnabled),
      season: seasonContext,
      user: userSummary,
      family: familyPreferences,
      orders: Array.isArray(ordersHistory) ? ordersHistory.slice(0, 5) : [],
      cart: cartSummary,
      catalog: catalogSummary,
    });

    let stream;
    try {
      stream = await ai.models.generateContentStream({
        model: 'gemini-3.1-flash-lite',
        contents: contextPayload,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        },
      });
    } catch {
      stream = await ai.models.generateContentStream({
        model: 'gemini-4-hydrogen',
        contents: contextPayload,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
    }

    const ACTION_MARKER = '__ACTION__:';
    let fullText = '';
    let sentLength = 0;
    let markerFound = false;

    for await (const chunk of stream) {
      if (clientClosed) break;
      const chunkText = chunk.text || '';
      if (!chunkText) continue;

      fullText += chunkText;

      if (!markerFound) {
        const markerIdx = fullText.indexOf(ACTION_MARKER);
        if (markerIdx !== -1) {
          markerFound = true;
          const remainingProse = fullText.slice(sentLength, markerIdx).replace(/\s+$/, '');
          if (remainingProse) {
            writeSse('delta', { text: remainingProse });
          }
          sentLength = markerIdx;
        } else {
          // Hold back tail up to marker length so partial "__ACTI" never flashes in chat text
          const safeEnd = Math.max(sentLength, fullText.length - ACTION_MARKER.length);
          if (safeEnd > sentLength) {
            const deltaText = fullText.slice(sentLength, safeEnd);
            writeSse('delta', { text: deltaText });
            sentLength = safeEnd;
          }
        }
      }
    }

    if (clientClosed) {
      if (!res.writableEnded) res.end();
      return;
    }

    const markerIdx = fullText.indexOf(ACTION_MARKER);
    const finalReplyText =
      markerIdx !== -1 ? fullText.slice(0, markerIdx).trim() : fullText.trim();

    if (markerIdx === -1 && fullText.length > sentLength) {
      const leftover = fullText.slice(sentLength).trimEnd();
      if (leftover) {
        writeSse('delta', { text: leftover });
      }
    }

    let parsedAction: Record<string, any> = {
      actionType: 'NONE',
      itemsToAdd: [],
      itemsToRemove: [],
      paymentMode: 'NONE',
      proactiveTip: '',
    };

    if (markerIdx !== -1) {
      const rawMeta = fullText.slice(markerIdx + ACTION_MARKER.length).trim();
      const jsonMatch = rawMeta.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          parsedAction = {
            ...parsed,
            actionType: typeof parsed.actionType === 'string' ? parsed.actionType : 'NONE',
            itemsToAdd: Array.isArray(parsed.itemsToAdd) ? parsed.itemsToAdd : [],
            itemsToRemove: Array.isArray(parsed.itemsToRemove) ? parsed.itemsToRemove : [],
            paymentMode: typeof parsed.paymentMode === 'string' ? parsed.paymentMode : 'NONE',
            deliverySlot: typeof parsed.deliverySlot === 'string' ? parsed.deliverySlot : '',
            proactiveTip: typeof parsed.proactiveTip === 'string' ? parsed.proactiveTip : '',
          };
        } catch {
          // Keep safe default action on malformed trailing JSON
        }
      }
    }

    writeSse('done', {
      replyText: finalReplyText,
      action: parsedAction,
    });
    if (!res.writableEnded) res.end();
  } catch (error: any) {
    console.error('AI Stream Dialog error:', error);
    writeSse('error', { error: error?.message || 'Streaming assistant unavailable' });
    if (!res.writableEnded) res.end();
  }
});

// ADMIN VOICE COMMAND PARSER (returns preview action ONLY — client enforces explicit confirmation before mutating)
app.post('/api/ai/admin-command', requireAdminAuth, async (req: AuthenticatedAdminRequest, res) => {
  try {
    const {
      command,
      lang = 'hi',
      produceCatalog = [],
      accessoryCatalog = [],
      ordersSummary = [],
    } = req.body || {};
    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'AI_ADMIN_VOICE_PARSE',
      resource: '/api/ai/admin-command',
      details: `Command: ${String(command || '').slice(0, 100)}`,
      ip: req.ip,
    });

    if (!command || !String(command).trim()) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const systemInstruction = `You parse Admin voice commands for ताज़ाMandi Operations Console into a structured JSON action that the admin MUST confirm before applying.
Respond ONLY with single valid JSON (no markdown, no explanation):
{
  "actionType": "UPDATE_PRODUCE|ADD_PRODUCE|UPDATE_ACCESSORY|ADD_ACCESSORY|SET_LANGUAGE|SWITCH_TAB|UPDATE_ORDER_STATUS|DELETE_TEST_REFERRALS|ADD_TEST_REFERRAL|UPDATE_REFERRAL_CONFIG|UNKNOWN",
  "summaryHi": "Short clear Hindi confirmation question asking admin to confirm exact change",
  "summaryEn": "Short clear English confirmation question",
  "targetId": "exact matched id from produceCatalog or accessoryCatalog if updating",
  "updates": {
    "pricePerKg": null,
    "wholesalePricePerKg": null,
    "discountPrice": null,
    "availableStock": null,
    "isAvailable": null,
    "isSeasonal": null,
    "price": null,
    "mrp": null,
    "wholesaleCost": null,
    "inStock": null,
    "referrerCashbackAmount": null,
    "refereeDiscountAmount": null,
    "minOrderValueToQualify": null
  },
  "newProduct": {
    "nameEn": "",
    "nameHi": "",
    "category": "vegetables|fruits|leafy|roots|herbs|chargers|audio|cases|mounts|protection|powerbanks",
    "price": 0,
    "wholesalePrice": 0,
    "mrp": 0,
    "stock": 50,
    "unit": "kg|piece|gaddi",
    "brand": "MARCO Tech",
    "warranty": "6 Months"
  },
  "targetLang": "hi|en|hinglish",
  "targetTab": "produce|master|accessories|dispatch|referrals|batches|users",
  "orderId": "",
  "orderStatus": "ordered|packed|out_for_delivery|delivered"
}
Always match exact existing ids from produceCatalog/accessoryCatalog when updating items.`;

    const payload = JSON.stringify({
      command: String(command).trim(),
      lang,
      produceCatalog: Array.isArray(produceCatalog) ? produceCatalog.slice(0, 80) : [],
      accessoryCatalog: Array.isArray(accessoryCatalog) ? accessoryCatalog.slice(0, 40) : [],
      ordersSummary: Array.isArray(ordersSummary) ? ordersSummary.slice(0, 15) : [],
    });

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: payload,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        },
      });
    } catch {
      response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: payload,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
    }

    const raw = (response.text || '{}').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { actionType: 'UNKNOWN' };
    return res.json({ success: true, parsed });
  } catch (error: any) {
    console.error('Admin command parse error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Parse failed' });
  }
});

// GEMINI NATURAL HUMAN TEXT-TO-SPEECH (WAV audio for Voice AI Dialog with customizable persona & pace)
app.post('/api/ai/tts', async (req, res) => {
  try {
    const {
      text,
      lang = 'hi',
      voiceName = 'Aoede',
      pace = 'normal',
    } = req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const ALLOWED_VOICES = new Set(['Aoede', 'Kore', 'Puck', 'Fenrir', 'Charon', 'Leda']);
    const safeVoice = ALLOWED_VOICES.has(String(voiceName)) ? String(voiceName) : 'Aoede';
    const safePace = pace === 'slow' || pace === 'fast' ? pace : 'normal';

    const cleanText = String(text)
      .replace(/[*_`#₹]/g, (m) => (m === '₹' ? ' रुपये ' : ''))
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);

    const ttsAiV1Beta = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: 'v1beta',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const extractAudioPart = (resp: any) => {
      const parts = resp?.candidates?.[0]?.content?.parts || [];
      for (const p of parts) {
        if (p?.inlineData?.data) {
          return {
            data: p.inlineData.data as string,
            mimeType: (p.inlineData.mimeType as string) || 'audio/wav',
          };
        }
      }
      return null;
    };

    const paceStyle =
      safePace === 'slow'
        ? 'slowly, calmly, and with extra clarity'
        : safePace === 'fast'
        ? 'briskly, energetically, yet clearly'
        : 'warmly and naturally like a helpful friend';

    const stylePrompt =
      lang === 'en'
        ? `Speak ${paceStyle}: ${cleanText}`
        : `Speak ${paceStyle} in a natural human Indian voice tone: ${cleanText}`;

    const attempts: Array<() => Promise<any>> = [
      () =>
        ttsAiV1Beta.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [{ role: 'user', parts: [{ text: stylePrompt }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: safeVoice },
              },
            },
          },
        }),
      () =>
        ttsAiV1Beta.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [{ role: 'user', parts: [{ text: cleanText }] }],
          config: {
            responseModalities: ['AUDIO'],
          },
        }),
      () =>
        ttsAiV1Beta.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [{ role: 'user', parts: [{ text: stylePrompt }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: safeVoice === 'Aoede' ? 'Kore' : safeVoice },
              },
            },
          },
        }),
    ];

    let audioHit: { data: string; mimeType: string } | null = null;
    let lastErr: any = null;
    for (const runAttempt of attempts) {
      try {
        const resp = await runAttempt();
        audioHit = extractAudioPart(resp);
        if (audioHit?.data) break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!audioHit?.data) {
      return res.status(502).json({
        error: lastErr?.message || 'Natural voice generation unavailable',
      });
    }

    res.json({
      success: true,
      audioBase64: audioHit.data,
      mimeType: audioHit.mimeType || 'audio/wav',
      voiceName: safeVoice,
      pace: safePace,
    });
  } catch (error: any) {
    console.error('Gemini TTS error:', error);
    res.status(500).json({ error: error.message || 'TTS generation failed' });
  }
});

// GEMINI AUDIO TRANSCRIPTION FALLBACK (Works even when browser Web Speech API fails or is unsupported)
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', lang = 'hi' } = req.body || {};
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const cleanBase64 = audioBase64.includes(',')
      ? audioBase64.slice(audioBase64.indexOf(',') + 1)
      : audioBase64;

    if (!cleanBase64.trim()) {
      return res.status(400).json({ error: 'Empty audio payload' });
    }

    const audioPart = {
      inlineData: {
        mimeType: String(mimeType).split(';')[0] || 'audio/webm',
        data: cleanBase64,
      },
    };

    const langHint =
      lang === 'mr'
        ? 'Marathi, Hindi, or English'
        : lang === 'en'
        ? 'English or Hindi'
        : 'Hindi, Hinglish, Marathi, or English';

    const transcribeContents = {
      parts: [
        audioPart,
        {
          text: `Act like Gboard/Siri multilingual Indian speech-to-text (${langHint}). Transcribe EVERY clearly audible spoken word verbatim, including mixed Hindi, Hinglish, Marathi, English words, numbers, quantities, questions, and vegetable/fruit/mobile accessory names. Do NOT summarize, alter, or skip words. If the audio is silent or has only background noise with no clear intelligible speech, reply strictly with: EMPTY_SILENCE — never guess or invent words. Otherwise output ONLY the exact transcribed words.`,
        },
      ],
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: transcribeContents,
      });
    } catch (primaryErr) {
      console.warn('gemini-3.5-transcribe fallback to gemini-4-hydrogen:', primaryErr);
      response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: transcribeContents,
      });
    }

    const rawTranscript = (response.text || '').replace(/^["'`]+|["'`]+$/g, '').trim();
    const transcript = /EMPTY_SILENCE|no clear intelligible|no speech/i.test(rawTranscript)
      ? ''
      : rawTranscript;
    res.json({ success: true, transcript });
  } catch (error: any) {
    console.error('Gemini Transcribe error:', error);
    res.status(500).json({ error: error.message || 'Audio transcription failed' });
  }
});

// Fast Cloud Run / Load Balancer Readiness & Liveness Health Probes
app.get('/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, status: 'healthy', version: CURRENT_RELEASE_VERSION });
});

app.get('/api/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, status: 'healthy', version: CURRENT_RELEASE_VERSION });
});

// App Version & Live Update Checker Route (Canonical Release Catalog + SHA-256 Build Fingerprint)
const BUILD_TIMESTAMP = SERVER_BOOT_ISO;

app.get('/api/version', (_req, res) => {
  const fp = applyNoCacheHeaders(res);

  const latestRelease = APP_RELEASES[0];
  const changelog = [
    ...latestRelease.features.map((item) => item.en),
    ...latestRelease.fixes.map((item) => item.en),
  ];

  res.json({
    version: CURRENT_RELEASE_VERSION,
    releaseId: CURRENT_RELEASE_ID,
    releasedAt: CURRENT_RELEASE_DATE,
    buildTimestamp: BUILD_TIMESTAMP,
    buildHash: fp.buildHash,
    buildHashShort: fp.buildHashShort,
    environment: fp.environment,
    distBuilt: fp.distBuilt,
    distAssetCount: fp.distAssetCount,
    workspaceClean: fp.workspaceClean,
    appName: 'ताज़ाMandi · powered by MARCO 💯',
    latestRelease,
    releases: APP_RELEASES,
    changelog,
  });
});

// ============================================================================
// 1. USER PROFILES & STRICT REGISTERED-ONLY AUTHENTICATION ENDPOINTS
// ============================================================================

// Register new customer user profile (Strict: rejects duplicates, hashes password)
app.post('/api/auth/register', (req, res) => {
  try {
    const result = UserService.registerUser(req.body || {});
    if (!result.success || !result.user) {
      const status = result.code === 'ALREADY_EXISTS' ? 409 : 400;
      return res.status(status).json({
        success: false,
        code: result.code,
        error: result.error || 'Registration failed',
      });
    }
    ActivityLogService.record({
      userId: result.user.id,
      userName: result.user.name,
      userEmail: result.user.email,
      userPhone: result.user.phone,
      eventType: 'AUTH_REGISTER',
      actionTitle: 'New customer account registered',
      details: `Address: ${result.user.fullAddress}`,
    });
    res.status(201).json({
      success: true,
      user: result.user,
      message: 'User profile created successfully',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create user profile' });
  }
});

// Social Google Auth: Checks verified Google Gmail against registered members
app.post('/api/auth/social-google', (req, res) => {
  try {
    const { uid, name, email, emailVerified } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Verified Google Gmail account is required.',
      });
    }

    const existingUser = UserService.findUserByEmailOrPhone(cleanEmail);
    if (existingUser) {
      const safeUser = sanitizeUserAccount(existingUser);
      ActivityLogService.record({
        userId: safeUser.id,
        userName: safeUser.name,
        userEmail: safeUser.email,
        userPhone: safeUser.phone,
        eventType: 'SOCIAL_LOGIN',
        actionTitle: 'Signed in with Google Social Login',
        details: `Verified Google UID: ${String(uid || '').slice(0, 24)}`,
      });
      const userOrders = OrderService.getOrdersByUser({
        userId: safeUser.id,
        phone: safeUser.phone,
        email: safeUser.email,
      });
      return res.json({
        success: true,
        registered: true,
        user: safeUser,
        orders: userOrders,
      });
    }

    ActivityLogService.record({
      userName: String(name || '').trim() || undefined,
      userEmail: cleanEmail,
      eventType: 'SOCIAL_LOGIN',
      actionTitle: 'Google Gmail verified — completing Sign Up profile',
      details: `Awaiting mobile number, delivery address & double password`,
    });

    return res.json({
      success: true,
      registered: false,
      profile: {
        uid: String(uid || ''),
        name: String(name || cleanEmail.split('@')[0] || ''),
        email: cleanEmail,
      },
    });
  } catch (err: any) {
    console.error('Social Google auth error:', err);
    res.status(500).json({ success: false, error: 'Google login verification failed' });
  }
});

// Issue server-verified OTP (for registered login/forgot OR new customer signup verification)
app.post('/api/auth/send-otp', (req, res) => {
  try {
    const { phone, identifier, purpose = 'login' } = req.body || {};
    if (purpose === 'register') {
      const regResult = UserService.issueSignupOtp(String(phone || identifier || ''));
      if (!regResult.success) {
        return res.status(regResult.status || 400).json({
          success: false,
          error: regResult.error,
        });
      }
      return res.json({
        success: true,
        otpPreview: regResult.otpPreview,
        message: 'Signup verification OTP sent',
      });
    }

    const safePurpose = purpose === 'forgot' ? 'forgot' : purpose === 'verify_phone' ? 'verify_phone' : 'login';
    const result = UserService.issueOtpForRegisteredUser(String(phone || identifier || ''), safePurpose);
    if (!result.success) {
      return res.status(result.status || 404).json({
        success: false,
        error: result.error,
      });
    }
    return res.json({
      success: true,
      otpPreview: result.otpPreview,
      message: 'Verification OTP sent to registered number',
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ error: 'Failed to issue OTP' });
  }
});

// Verify mobile OTP during Sign Up (before creating customer profile)
app.post('/api/auth/verify-signup-otp', (req, res) => {
  try {
    const { phone, otp } = req.body || {};
    const result = UserService.verifySignupOtp(String(phone || ''), String(otp || ''));
    if (!result.success) {
      return res.status(result.status || 401).json({
        success: false,
        error: result.error || 'OTP verification failed',
      });
    }
    return res.json({ success: true, phoneVerified: true });
  } catch (err: any) {
    console.error('Verify signup OTP error:', err);
    return res.status(500).json({ success: false, error: 'Failed to verify signup OTP' });
  }
});

// Verify existing customer account mobile number via OTP
app.post('/api/auth/verify-phone-otp', (req, res) => {
  try {
    const { userId, phone, otp } = req.body || {};
    const result = UserService.verifyAccountPhoneWithOtp(
      String(userId || ''),
      String(phone || ''),
      String(otp || '')
    );
    if (!result.success || !result.user) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error || 'Phone verification failed',
      });
    }
    ActivityLogService.record({
      userId: result.user.id,
      userName: result.user.name,
      userPhone: result.user.phone,
      eventType: 'PHONE_VERIFIED',
      actionTitle: 'Customer mobile number verified via OTP',
      details: result.user.phone,
    });
    return res.json({ success: true, user: result.user });
  } catch (err: any) {
    console.error('Verify phone OTP error:', err);
    return res.status(500).json({ success: false, error: 'Failed to verify phone number' });
  }
});

// Connect & verify Google Gmail account onto an existing or newly created profile
app.post('/api/auth/link-google', (req, res) => {
  try {
    const { userId, uid, email, emailVerified, name } = req.body || {};
    const result = UserService.linkGoogleEmail(String(userId || ''), {
      uid: String(uid || ''),
      email: String(email || ''),
      emailVerified: Boolean(emailVerified),
      name: name ? String(name) : undefined,
    });
    if (!result.success || !result.user) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error || 'Failed to connect Google Gmail account',
      });
    }
    ActivityLogService.record({
      userId: result.user.id,
      userName: result.user.name,
      userEmail: result.user.email,
      userPhone: result.user.phone,
      eventType: 'GOOGLE_LINKED',
      actionTitle: 'Google Gmail connected & verified on customer profile',
      details: `Verified Gmail: ${result.user.email}`,
    });
    return res.json({ success: true, user: result.user });
  } catch (err: any) {
    console.error('Link Google Gmail error:', err);
    return res.status(500).json({ success: false, error: 'Failed to link Google Gmail' });
  }
});

// Strict Login: ONLY registered users with verified password OR verified server OTP
app.post('/api/auth/login', (req, res) => {
  try {
    const { mode = 'password', identifier, phone, email, password, otp } = req.body || {};
    const loginTarget = String(identifier || phone || email || '').trim();
    if (!loginTarget) {
      return res.status(400).json({ error: 'Mobile number or email is required.' });
    }

    let safeUser: ReturnType<typeof sanitizeUserAccount> | undefined;

    if (mode === 'otp') {
      const otpCheck = UserService.verifyOtpAndConsume(loginTarget, String(otp || ''), 'login');
      if (!otpCheck.success || !otpCheck.user) {
        ActivityLogService.record({
          userPhone: loginTarget,
          eventType: 'AUTH_FAILED',
          actionTitle: 'OTP sign-in rejected',
          details: otpCheck.error || 'Unregistered or invalid OTP',
        });
        return res.status(otpCheck.status || 401).json({
          success: false,
          error: otpCheck.error || 'Invalid OTP or unregistered account.',
        });
      }
      safeUser = sanitizeUserAccount(otpCheck.user);
    } else {
      const pwCheck = UserService.verifyPasswordLogin(loginTarget, String(password || ''));
      if (!pwCheck.success || !pwCheck.user) {
        ActivityLogService.record({
          userEmail: loginTarget.includes('@') ? loginTarget : undefined,
          userPhone: !loginTarget.includes('@') ? loginTarget : undefined,
          eventType: 'AUTH_FAILED',
          actionTitle: 'Password sign-in rejected',
          details: pwCheck.error || 'Authentication failed',
        });
        return res.status(pwCheck.status || 401).json({
          success: false,
          error: pwCheck.error || 'Authentication failed.',
        });
      }
      safeUser = pwCheck.user;
    }

    ActivityLogService.record({
      userId: safeUser.id,
      userName: safeUser.name,
      userEmail: safeUser.email,
      userPhone: safeUser.phone,
      eventType: 'AUTH_LOGIN',
      actionTitle: `Signed in via ${mode === 'otp' ? 'OTP' : 'Password'}`,
      details: `Account verified (${safeUser.email || safeUser.phone})`,
    });

    const userOrders = OrderService.getOrdersByUser({
      userId: safeUser.id,
      phone: safeUser.phone,
      email: safeUser.email,
    });

    res.json({
      success: true,
      user: safeUser,
      orders: userOrders,
      message: 'Login successful',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Reset password strictly for registered accounts with valid OTP
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { phone, identifier, otp, newPassword } = req.body || {};
    const result = UserService.resetPasswordWithOtp(
      String(phone || identifier || ''),
      String(otp || ''),
      String(newPassword || '')
    );
    if (!result.success || !result.user) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error || 'Password reset failed',
      });
    }
    const userOrders = OrderService.getOrdersByUser({
      userId: result.user.id,
      phone: result.user.phone,
      email: result.user.email,
    });
    res.json({
      success: true,
      user: result.user,
      orders: userOrders,
      message: 'Password updated successfully',
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Admin RBAC Session Issuer (Verifies Platform Owner Email OR Master Admin PIN)
app.post('/api/admin/session', (req, res) => {
  const { email, pin, actorName } = req.body || {};
  const result = issueAdminSession({ email, pin, actorName });
  if (!result.success) {
    AdminAuditService.record({
      actorEmail: String(email || 'unknown'),
      actorName: String(actorName || 'Unauthorized Attempt'),
      action: 'ADMIN_UNLOCK_DENIED',
      resource: '/api/admin/session',
      details: 'Rejected invalid Admin PIN / non-owner account attempt',
      status: 'denied',
      ip: req.ip,
    });
    return res.status(result.status).json({
      success: false,
      code: 'FORBIDDEN_ADMIN_ONLY',
      error: result.error,
    });
  }

  AdminAuditService.record({
    actorEmail: result.actor.email,
    actorName: result.actor.name,
    action: 'ADMIN_UNLOCK',
    resource: '/api/admin/session',
    details: email ? 'Unlocked via Verified Platform Owner Email' : 'Unlocked via Master Admin PIN',
    status: 'allowed',
    ip: req.ip,
  });

  return res.json({
    success: true,
    token: result.token,
    expiresAt: result.expiresAt,
    actor: result.actor,
  });
});

app.post('/api/admin/logout', (req, res) => {
  const actor = verifyAdminToken(extractAdminTokenFromRequest(req));
  if (actor) {
    AdminAuditService.record({
      actorEmail: actor.email,
      actorName: actor.name,
      action: 'ADMIN_LOCK',
      resource: '/api/admin/logout',
      details: 'Admin console locked & RBAC session cleared',
      ip: req.ip,
    });
  }
  res.json({ success: true });
});

// Admin Audit Log Endpoints (Strictly RBAC Protected)
app.get('/api/admin/audit-logs', requireAdminAuth, (req, res) => {
  const action = typeof req.query.action === 'string' ? req.query.action : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 150;
  const logs = AdminAuditService.list({ action, status, limit });
  res.json({ success: true, count: logs.length, logs });
});

app.post('/api/admin/audit-logs', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  const { action, resource, details } = req.body || {};
  if (!action) {
    return res.status(400).json({ success: false, error: 'action is required' });
  }
  const entry = AdminAuditService.record({
    actorEmail: req.adminActor?.email,
    actorName: req.adminActor?.name,
    action: String(action),
    resource: String(resource || 'admin-console'),
    details: details ? String(details) : undefined,
    ip: req.ip,
  });
  res.status(201).json({ success: true, entry });
});

app.delete('/api/admin/audit-logs', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  const removedCount = AdminAuditService.clear();
  AdminAuditService.record({
    actorEmail: req.adminActor?.email,
    actorName: req.adminActor?.name,
    action: 'AUDIT_LOGS_CLEARED',
    resource: '/api/admin/audit-logs',
    details: `Cleared ${removedCount} historical audit entries`,
    ip: req.ip,
  });
  res.json({ success: true, removedCount });
});

// Admin Directory: List all registered users safely (RBAC Protected, NEVER exposes passwordHash)
app.get('/api/admin/users', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  try {
    const users = UserService.getAllUsers()
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        secondaryPhone: u.secondaryPhone || '',
        flat: u.flat,
        wing: u.wing || '',
        society: u.society,
        fullAddress: u.fullAddress,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'VIEW_REGISTERED_USERS',
      resource: '/api/admin/users',
      details: `Accessed ${users.length} backend user records`,
      ip: req.ip,
    });

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err: any) {
    console.error('Admin users fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve registered users' });
  }
});

// User Activity Logger Endpoints (Real persistent activity trail, zero secrets)
app.post('/api/activity-logs', (req, res) => {
  try {
    const body = req.body || {};
    if (!body.actionTitle) {
      return res.status(400).json({ success: false, error: 'actionTitle is required' });
    }
    const created = ActivityLogService.record({
      userId: body.userId,
      userName: body.userName,
      userEmail: body.userEmail,
      userPhone: body.userPhone,
      eventType: body.eventType || 'PAGE_VIEW',
      actionTitle: body.actionTitle,
      details: body.details,
      pageTab: body.pageTab,
      deviceSummary: body.deviceSummary,
    });
    res.status(201).json({ success: true, entry: created });
  } catch (err: any) {
    console.error('Activity log write error:', err);
    res.status(500).json({ success: false, error: 'Failed to record activity' });
  }
});

app.get('/api/activity-logs', (req, res, next) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
  // Viewing full platform-wide activity feed requires Admin RBAC; individual users may view only their own userId feed
  if (!userId) {
    return requireAdminAuth(req as AuthenticatedAdminRequest, res, next);
  }
  return next();
}, (req, res) => {
  try {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const eventType = typeof req.query.eventType === 'string' ? req.query.eventType : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 120;
    const logs = ActivityLogService.list({ userId, eventType, limit });
    res.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    console.error('Activity log read error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch activity logs' });
  }
});

app.delete('/api/activity-logs', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  try {
    const removedCount = ActivityLogService.clear();
    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'CLEAR_ACTIVITY_LOGS',
      resource: '/api/activity-logs',
      details: `Cleared ${removedCount} customer activity logs`,
      ip: req.ip,
    });
    res.json({ success: true, removedCount });
  } catch (err: any) {
    console.error('Activity log clear error:', err);
    res.status(500).json({ success: false, error: 'Failed to clear logs' });
  }
});

// Get user profile by ID
app.get('/api/user/profile/:id', (req, res) => {
  const user = UserService.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ success: true, user: sanitizeUserAccount(user) });
});

// Update user profile (secondary phone, addresses, etc.)
app.put('/api/user/profile/:id', (req, res) => {
  try {
    const result = UserService.updateUserProfile(req.params.id, req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, user: result.user });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user order history with live status of current orders
app.get('/api/user/:userId/orders', (req, res) => {
  try {
    const user = UserService.getUserById(req.params.userId);
    const userOrders = OrderService.getOrdersByUser({
      userId: req.params.userId,
      phone: user?.phone,
      email: user?.email,
    });

    res.json({
      success: true,
      orders: userOrders,
      totalOrders: userOrders.length,
      activeOrders: userOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled'),
    });
  } catch (err: any) {
    console.error('User orders fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve order history' });
  }
});

// ============================================================================
// 2. ORDERS & PERISHABLE GOODS WHOLESALE AGGREGATION SYSTEM
// ============================================================================

// Place customer order (persisted in backend registry & referral tracker)
app.post('/api/orders', (req, res) => {
  try {
    const newOrder = OrderService.createOrder(req.body);
    const referralRecord = ReferralService.recordReferredOrder(newOrder);
    res.status(201).json({
      success: true,
      order: newOrder,
      referralRecord,
      message: 'Order confirmed and pooled into daily mandi procurement batch',
    });
  } catch (err: any) {
    console.error('Order placement error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Retrieve all customer orders (admin / aggregator console)
app.get('/api/orders', (_req, res) => {
  res.json({
    success: true,
    orders: OrderService.getAllOrders(),
  });
});

// Update single order status (Admin RBAC Protected)
app.put('/api/orders/:id/status', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  const { status, paymentConfirmed } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const updatedOrder = OrderService.updateOrderStatus(req.params.id, status, Boolean(paymentConfirmed));
  if (!updatedOrder) {
    return res.status(404).json({ error: 'Order not found' });
  }

  let referralRewardResult = null;
  if (updatedOrder.status === 'delivered' && updatedOrder.paymentConfirmed) {
    referralRewardResult = ReferralService.creditOnDeliveryAndPayment(updatedOrder);
  }

  AdminAuditService.record({
    actorEmail: req.adminActor?.email,
    actorName: req.adminActor?.name,
    action: 'UPDATE_ORDER_STATUS',
    resource: `/api/orders/${req.params.id}/status`,
    details: `Order ${req.params.id} -> ${status}${paymentConfirmed ? ' (Payment Confirmed)' : ''}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    order: updatedOrder,
    referralRewardResult,
    message: `Order status updated to ${status}`,
  });
});

// Confirm both doorstep delivery and final payment receipt (Admin RBAC Protected)
app.post('/api/orders/:id/confirm-delivery-payment', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  const updatedOrder = OrderService.confirmDeliveryAndPayment(req.params.id);
  if (!updatedOrder) {
    return res.status(404).json({ success: false, error: 'Order not found or cancelled' });
  }
  const referralRewardResult = ReferralService.creditOnDeliveryAndPayment(updatedOrder);
  AdminAuditService.record({
    actorEmail: req.adminActor?.email,
    actorName: req.adminActor?.name,
    action: 'CONFIRM_DELIVERY_PAYMENT',
    resource: `/api/orders/${req.params.id}/confirm-delivery-payment`,
    details: `Order ${req.params.id} marked Delivered & Paid (₹${updatedOrder.totalAmount})`,
    ip: req.ip,
  });
  res.json({
    success: true,
    order: updatedOrder,
    referralRewardResult,
    message: 'Delivery and payment confirmed',
  });
});

// Query referral wallet balance & invite ledger by customer referral code
app.get('/api/referrals/status', (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : undefined;
  const state = ReferralService.getStateByCode(code);
  res.json({
    success: true,
    records: state.records,
    walletBalance: state.walletBalance,
  });
});

// Delete a single referral record (Admin RBAC Protected)
app.delete('/api/referrals/:id', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  const deleted = ReferralService.deleteRecord(req.params.id);
  AdminAuditService.record({
    actorEmail: req.adminActor?.email,
    actorName: req.adminActor?.name,
    action: 'DELETE_REFERRAL',
    resource: `/api/referrals/${req.params.id}`,
    details: `Deleted=${deleted}`,
    ip: req.ip,
  });
  res.json({ success: true, deleted });
});

// Clear test/sample referral records (Admin RBAC Protected)
app.delete('/api/referrals', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  const removedCount = ReferralService.clearTestRecords();
  AdminAuditService.record({
    actorEmail: req.adminActor?.email,
    actorName: req.adminActor?.name,
    action: 'CLEAR_TEST_REFERRALS',
    resource: '/api/referrals',
    details: `Removed ${removedCount} test records`,
    ip: req.ip,
  });
  res.json({ success: true, removedCount });
});

// Cancel customer order (customer or admin) — marks status cancelled, never deletes history
app.post('/api/orders/:id/cancel', (req, res) => {
  const { reason } = req.body || {};
  const result = OrderService.cancelOrder(req.params.id, reason);
  if (!result.success) {
    return res.status(result.error === 'Order not found' ? 404 : 400).json({
      success: false,
      error: result.error,
    });
  }
  res.json({
    success: true,
    order: result.order,
    message: 'Order cancelled successfully',
  });
});

// Explicitly forbid deleting customer order history
app.delete('/api/orders', (_req, res) => {
  res.status(403).json({
    success: false,
    error: 'Order history is permanent and cannot be deleted by customers.',
  });
});

app.delete('/api/orders/:id', (_req, res) => {
  res.status(403).json({
    success: false,
    error: 'Order history is permanent and cannot be deleted by customers.',
  });
});

// Submit customer rating & freshness feedback for a completed or placed order
app.post('/api/orders/:id/feedback', (req, res) => {
  try {
    const { rating, freshnessTags, comment, stage } = req.body || {};
    const numRating = Number(rating);
    if (!Number.isFinite(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, error: 'Rating between 1 and 5 is required' });
    }
    const updatedOrder = OrderService.submitOrderFeedback(req.params.id, {
      rating: numRating,
      freshnessTags,
      comment,
      stage,
    });
    if (!updatedOrder) {
      return res.status(404).json({ success: false, error: 'Order not found or cancelled' });
    }
    res.json({
      success: true,
      order: updatedOrder,
      feedback: updatedOrder.feedback,
      message: 'Feedback saved successfully',
    });
  } catch (err: any) {
    console.error('Order feedback error:', err);
    res.status(500).json({ success: false, error: 'Failed to save feedback' });
  }
});

// PERISHABLE GOODS AGGREGATION ENGINE:
// Aggregates all customer orders for perishable goods placed before daily cutoff time (e.g., 9:00 PM).
// Generates consolidated wholesale order with 1-2 kg safety buffer to ensure fulfillment.
app.get('/api/procurement/aggregate', (req, res) => {
  try {
    const cutoffHour = req.query.cutoffHour ? parseInt(req.query.cutoffHour as string, 10) : 21; // 9:00 PM default
    const cutoffMinute = req.query.cutoffMinute ? parseInt(req.query.cutoffMinute as string, 10) : 0;
    const dateTarget = req.query.dateTarget as string | undefined;

    const consolidatedOrder = PerishableAggregationEngine.generateConsolidatedWholesaleOrder({
      cutoffHour,
      cutoffMinute,
      dateTarget,
    });

    res.json({
      success: true,
      consolidatedOrder,
    });
  } catch (err: any) {
    console.error('Aggregation error:', err);
    res.status(500).json({ error: 'Failed to aggregate perishable goods orders' });
  }
});

// Bulk update order status for batch fulfillment (Admin RBAC Protected)
app.post('/api/procurement/bulk-status', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  try {
    const { status, batchDate } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const updatedCount = OrderService.bulkUpdateStatus(batchDate || '', status);
    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'BULK_ORDER_STATUS',
      resource: '/api/procurement/bulk-status',
      details: `Updated ${updatedCount} orders -> ${status}`,
      ip: req.ip,
    });
    res.json({
      success: true,
      updatedCount,
      message: `Updated ${updatedCount} orders to status '${status}'`,
    });
  } catch (err: any) {
    console.error('Bulk status update error:', err);
    res.status(500).json({ error: 'Failed to update batch status' });
  }
});

// ============================================================================
// 3. INVENTORY TRACKING API (Procured vs Delivered Quantities)
// ============================================================================

// Get current inventory status reflecting demand, procured, and delivered quantities
app.get('/api/inventory', (_req, res) => {
  try {
    const inventory = InventoryService.getInventoryRecords();
    res.json({
      success: true,
      inventory,
      totalItems: inventory.length,
      totalDemandedKg: Math.round(inventory.reduce((sum, i) => sum + i.demandedKg, 0) * 10) / 10,
      totalProcuredKg: Math.round(inventory.reduce((sum, i) => sum + i.procuredKg, 0) * 10) / 10,
      totalDeliveredKg: Math.round(inventory.reduce((sum, i) => sum + i.deliveredKg, 0) * 10) / 10,
    });
  } catch (err: any) {
    console.error('Inventory fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve inventory tracking' });
  }
});

// Update actual procured quantity for a produce item (Admin RBAC Protected)
app.post('/api/inventory/procured', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  try {
    const { produceId, procuredKg, status } = req.body;
    if (!produceId || typeof procuredKg !== 'number') {
      return res.status(400).json({ error: 'produceId and procuredKg number are required' });
    }
    const updated = InventoryService.updateProcured(produceId, procuredKg, status);
    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'INVENTORY_PROCURED_UPDATE',
      resource: '/api/inventory/procured',
      details: `${produceId}: ${procuredKg} kg${status ? ` (${status})` : ''}`,
      ip: req.ip,
    });
    res.json({ success: true, item: updated });
  } catch (err: any) {
    console.error('Inventory procure error:', err);
    res.status(500).json({ error: 'Failed to update procured quantity' });
  }
});

// Update actual delivered quantity for a produce item (Admin RBAC Protected)
app.post('/api/inventory/delivered', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  try {
    const { produceId, deliveredKg } = req.body;
    if (!produceId || typeof deliveredKg !== 'number') {
      return res.status(400).json({ error: 'produceId and deliveredKg number are required' });
    }
    const updated = InventoryService.updateDelivered(produceId, deliveredKg);
    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'INVENTORY_DELIVERED_UPDATE',
      resource: '/api/inventory/delivered',
      details: `${produceId}: ${deliveredKg} kg delivered`,
      ip: req.ip,
    });
    res.json({ success: true, item: updated });
  } catch (err: any) {
    console.error('Inventory deliver error:', err);
    res.status(500).json({ error: 'Failed to update delivered quantity' });
  }
});

// Bulk record procurement for entire wholesale batch (Admin RBAC Protected)
app.post('/api/inventory/batch-procure', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items array is required' });
    }
    const updatedRecords = InventoryService.recordBatchProcurement(items);
    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'INVENTORY_BATCH_PROCURE',
      resource: '/api/inventory/batch-procure',
      details: `Batch procured ${items.length} SKUs at APMC Vashi`,
      ip: req.ip,
    });
    res.json({ success: true, inventory: updatedRecords });
  } catch (err: any) {
    console.error('Batch procurement error:', err);
    res.status(500).json({ error: 'Failed to record batch procurement' });
  }
});

// ============================================================================
// 4. GAMIFIED LEADERBOARD & SMART DYNAMIC NOTIFICATIONS API
// ============================================================================

app.get('/api/leaderboard', (req, res) => {
  try {
    const rawSort = String(req.query.sortBy || 'xp');
    const sortBy = rawSort === 'saved' || rawSort === 'kg' ? rawSort : 'xp';
    const data = LeaderboardService.getLeaderboard(sortBy);
    res.json({ success: true, ...data });
  } catch (err: any) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ success: false, error: 'Failed to load leaderboard' });
  }
});

app.get('/api/notifications/dynamic', (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const notifications = DynamicNotificationService.list(limit);
    res.json({ success: true, notifications });
  } catch (err: any) {
    console.error('Notifications fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications/broadcast', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  try {
    const { title, message, category, priority, ctaTab, ctaLabel } = req.body || {};
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required' });
    }
    const created = DynamicNotificationService.broadcast({
      title,
      message,
      category,
      priority,
      ctaTab,
      ctaLabel,
    });
    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'BROADCAST_NOTIFICATION',
      resource: '/api/notifications/broadcast',
      details: `Title: ${String(title).slice(0, 80)} (${priority || 'normal'})`,
      ip: req.ip,
    });
    res.json({ success: true, notification: created });
  } catch (err: any) {
    console.error('Notification broadcast error:', err);
    res.status(500).json({ success: false, error: 'Failed to broadcast notification' });
  }
});

app.delete('/api/notifications/dynamic/:id', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  try {
    const removed = DynamicNotificationService.remove(req.params.id);
    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'DELETE_NOTIFICATION',
      resource: `/api/notifications/dynamic/${req.params.id}`,
      details: `Removed=${removed}`,
      ip: req.ip,
    });
    res.json({ success: true, removed });
  } catch (err: any) {
    console.error('Notification delete error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

// Platform Feature Controls & UI Theme Config Routes
app.get('/api/platform/config', (_req, res) => {
  try {
    res.json({ success: true, config: PlatformConfigService.get() });
  } catch (err: any) {
    console.error('Platform config read error:', err);
    res.status(500).json({ success: false, error: 'Failed to load platform config' });
  }
});

app.put('/api/platform/config', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  try {
    const body = req.body || {};
    const { config, changedKeys } = PlatformConfigService.update(
      {
        featureFlags: body.featureFlags,
        activeUiSample: body.activeUiSample,
        festivalTheme: body.festivalTheme,
        brand: body.brand,
      },
      req.adminActor?.email || 'rp2824173@gmail.com'
    );
    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'UPDATE_PLATFORM_CONFIG',
      resource: '/api/platform/config',
      details: changedKeys.length > 0 ? changedKeys.join(', ') : 'No flag changes',
      ip: req.ip,
    });
    res.json({ success: true, config });
  } catch (err: any) {
    console.error('Platform config update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update platform config' });
  }
});

// Admin-only Conversational AI Storefront Theme, Festival & Logo Designer (Gemini 4 Hydrogen)
app.post('/api/admin/ai-theme-designer', requireAdminAuth, async (req: AuthenticatedAdminRequest, res) => {
  try {
    const { prompt, currentUiSample, currentFestivalTheme, history } = req.body || {};
    const cleanPrompt = String(prompt || '').trim();
    if (!cleanPrompt) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a design instruction for your storefront theme or logo.',
      });
    }

    const historyText = Array.isArray(history)
      ? history
          .slice(-6)
          .map((h: any) => `${h?.role === 'user' ? 'Admin' : 'AI'}: ${String(h?.text || '').slice(0, 220)}`)
          .join('\n')
      : '';

    const systemInstruction = [
      'You are the Storefront Theme, Festival Campaign & Brand Logo Designer exclusively for the Admin of "ताज़ाMandi" (direct APMC Vashi fresh produce & society delivery app powered by MARCO 100).',
      'Respond conversationally in the SAME language/style as the Admin (Hindi Devanagari, Hinglish, or English). Keep your reply practical, warm, and concise (under 65 words).',
      'You can configure:',
      '1) recommendedUiSample: one of ["classic", "quick_mart", "fresh_boutique", "hybrid_superapp"] ONLY if the admin asks to change storefront card layout, otherwise keep current.',
      '2) festivalTheme: configure festival/special-day campaign OR set active=false to restore classic fresh look.',
      '   - surfaceTone must be one of ["emerald", "saffron", "magenta", "royal", "gold", "tricolor"].',
      '   - logoPreset must be one of ["default", "diwali", "holi", "ganesh", "navratri", "patriotic", "eid", "sankranti", "harvest", "custom"].',
      '   - If generating a brand-new custom festival/special-day SVG emblem, set logoPreset="custom" and provide a clean valid <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">...</svg> icon under 2500 chars with NO scripts/links.',
      '   - Otherwise pick the closest built-in logoPreset and keep customLogoSvg="".',
      '   - accentHex must be a 7-char hex code like "#d97706".',
    ].join('\n');

    const userContent = [
      `Current UI Sample: ${String(currentUiSample || 'classic')}`,
      `Current Festival Theme: ${JSON.stringify(currentFestivalTheme || { id: 'default', active: false })}`,
      historyText ? `Recent Conversation:\n${historyText}` : '',
      `Admin Request: ${cleanPrompt}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: userContent,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Conversational response explaining what was designed in the admin language.',
            },
            recommendedUiSample: {
              type: Type.STRING,
              enum: ['classic', 'quick_mart', 'fresh_boutique', 'hybrid_superapp'],
              nullable: true,
            },
            festivalTheme: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                active: { type: Type.BOOLEAN },
                bannerTitle: { type: Type.STRING },
                bannerSubtitle: { type: Type.STRING },
                badgeText: { type: Type.STRING },
                accentHex: { type: Type.STRING },
                surfaceTone: {
                  type: Type.STRING,
                  enum: ['emerald', 'saffron', 'magenta', 'royal', 'gold', 'tricolor'],
                },
                logoPreset: {
                  type: Type.STRING,
                  enum: [
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
                  ],
                },
                customLogoSvg: { type: Type.STRING },
              },
              required: [
                'id',
                'name',
                'active',
                'bannerTitle',
                'bannerSubtitle',
                'badgeText',
                'accentHex',
                'surfaceTone',
                'logoPreset',
              ],
            },
          },
          required: ['reply'],
        },
      },
    });

    const parsed = JSON.parse(aiResponse.text || '{}') as {
      reply?: string;
      recommendedUiSample?: string | null;
      festivalTheme?: Record<string, any> | null;
    };

    let cleanFestival = parsed.festivalTheme || null;
    if (cleanFestival) {
      const safeSvg =
        cleanFestival.logoPreset === 'custom' && cleanFestival.customLogoSvg
          ? sanitizeServerSvgMarkup(cleanFestival.customLogoSvg)
          : '';
      cleanFestival = {
        id: String(cleanFestival.id || 'custom').slice(0, 48),
        name: String(cleanFestival.name || 'Custom Festive Theme').slice(0, 80),
        active: Boolean(cleanFestival.active),
        bannerTitle: String(cleanFestival.bannerTitle || '').slice(0, 120),
        bannerSubtitle: String(cleanFestival.bannerSubtitle || '').slice(0, 220),
        badgeText: String(cleanFestival.badgeText || '').slice(0, 40),
        accentHex: /^#[0-9a-fA-F]{6}$/.test(String(cleanFestival.accentHex || ''))
          ? String(cleanFestival.accentHex)
          : '#059669',
        surfaceTone: cleanFestival.surfaceTone || 'emerald',
        logoPreset: safeSvg
          ? 'custom'
          : cleanFestival.logoPreset === 'custom'
          ? 'default'
          : cleanFestival.logoPreset || 'default',
        ...(safeSvg ? { customLogoSvg: safeSvg } : {}),
      };
    }

    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'AI_THEME_DESIGNER',
      resource: '/api/admin/ai-theme-designer',
      details: `Prompt="${cleanPrompt.slice(0, 80)}" -> festival=${cleanFestival?.name || 'none'}`,
      ip: req.ip,
    });

    res.json({
      success: true,
      reply: parsed.reply || 'Theme updated according to your instructions.',
      recommendedUiSample: parsed.recommendedUiSample || null,
      festivalTheme: cleanFestival,
    });
  } catch (err: any) {
    console.error('AI theme designer error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'AI Theme Designer request failed. Please try again.',
    });
  }
});

// ============================================================================
// 11. PUBLIC TOP-3 GROUP BUYERS + ADMIN TOP-10 PROFIT ANALYTICS + AI REWARDS
// ============================================================================

app.get('/api/analytics/public-top-buyers', (_req, res) => {
  try {
    const result = BuyerAnalyticsService.getPublicTopThree();
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Public top buyers error:', err);
    res.status(500).json({ success: false, error: 'Failed to load public buyers chart' });
  }
});

app.get('/api/admin/buyer-analytics', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  try {
    const period = (typeof req.query.period === 'string' ? req.query.period : 'all') as ServerBuyerAnalyticsPeriod;
    const analytics = BuyerAnalyticsService.computeAnalytics({ period });
    res.json({
      success: true,
      ...analytics,
      grantedRewards: CustomerRewardsService.listAll(),
    });
  } catch (err: any) {
    console.error('Admin buyer analytics GET error:', err);
    res.status(500).json({ success: false, error: 'Failed to compute buyer analytics' });
  }
});

app.post('/api/admin/buyer-analytics', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  try {
    const { period = 'all', extraOrders, catalogProduceCosts, catalogAccessoryCosts } = req.body || {};
    const analytics = BuyerAnalyticsService.computeAnalytics({
      period: period as ServerBuyerAnalyticsPeriod,
      extraOrders: Array.isArray(extraOrders) ? extraOrders : undefined,
      catalogProduceCosts: catalogProduceCosts && typeof catalogProduceCosts === 'object' ? catalogProduceCosts : undefined,
      catalogAccessoryCosts: catalogAccessoryCosts && typeof catalogAccessoryCosts === 'object' ? catalogAccessoryCosts : undefined,
    });
    res.json({
      success: true,
      ...analytics,
      grantedRewards: CustomerRewardsService.listAll(),
    });
  } catch (err: any) {
    console.error('Admin buyer analytics POST error:', err);
    res.status(500).json({ success: false, error: 'Failed to compute buyer analytics' });
  }
});

app.post('/api/admin/ai-reward-designer', requireAdminAuth, async (req: AuthenticatedAdminRequest, res) => {
  try {
    const { prompt, buyerName, totalSpent, orderCount, customerSaved, adminProfit } = req.body || {};
    const cleanPrompt = String(prompt || '').trim();
    if (!cleanPrompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required.' });
    }

    const safeBuyerName = String(buyerName || 'Valued Customer').slice(0, 60);
    const systemInstruction = [
      'You are MARCO 100 AI Loyalty & Reward Architect for TaazaMandi.',
      'The Store Admin writes a short instruction in Hindi, Hinglish, or English specifying what discount, wallet cashback, or surprise gift to grant a specific top customer.',
      'Convert the instruction into structured JSON:',
      '- rewardType: "coupon" (flat/percent discount code), "wallet_credit" (cashback/credit rupees), "surprise_gift" (free produce/surprise gift item), or "combo" (discount + surprise gift)',
      '- couponCode: catchy uppercase alphanumeric code like VIP50, MARCO100, TAHFA20 (max 14 chars)',
      '- discountRupees: flat discount or credit in INR integer (0 if none)',
      '- discountPercent: percentage discount 0..50 (0 if flat rupees or gift only)',
      '- minOrderRupees: sensible minimum order value (0 if no minimum requested)',
      '- freeGiftItem: concrete surprise produce/gift item name in Hindi+English if requested (e.g. "1 kg Taaza Tamatar (Surprise Gift)"), else empty string',
      '- title: concise reward headline (max 70 chars)',
      '- messageToCustomer: warm personalized message to the customer mentioning their gift/discount',
      '- reply: crisp summary to the Admin confirming the exact reward created',
    ].join('\n');

    const userContent = [
      `Customer Name: ${safeBuyerName}`,
      `Total Purchases: ₹${Number(totalSpent) || 0} across ${Number(orderCount) || 0} orders`,
      `Customer Saved: ₹${Number(customerSaved) || 0} · Admin Net Profit: ₹${Number(adminProfit) || 0}`,
      `Admin Reward Instruction: ${cleanPrompt}`,
    ].join('\n');

    let draft: Record<string, any> | null = null;
    if (SERVER_ENV.GEMINI_API_KEY) {
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: userContent,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              rewardType: {
                type: Type.STRING,
                enum: ['coupon', 'wallet_credit', 'surprise_gift', 'combo'],
              },
              couponCode: { type: Type.STRING },
              discountRupees: { type: Type.NUMBER },
              discountPercent: { type: Type.NUMBER },
              minOrderRupees: { type: Type.NUMBER },
              freeGiftItem: { type: Type.STRING },
              title: { type: Type.STRING },
              messageToCustomer: { type: Type.STRING },
            },
            required: [
              'reply',
              'rewardType',
              'couponCode',
              'discountRupees',
              'discountPercent',
              'minOrderRupees',
              'title',
              'messageToCustomer',
            ],
          },
        },
      });
      draft = JSON.parse(aiResponse.text || '{}');
    } else {
      // Deterministic smart parser fallback if API key is not configured
      const rupeesMatch = cleanPrompt.match(/(\d+)\s*(?:₹|rs|rupee|rupaye|rupaiye|off|discount|credit)/i);
      const pctMatch = cleanPrompt.match(/(\d+)\s*%/);
      const rupees = rupeesMatch ? Number(rupeesMatch[1]) : 50;
      const pct = pctMatch ? Number(pctMatch[1]) : 0;
      const hasGift = /gift|tamatar|aloo|pyaz|palak|aam|fruit|sabzi|surprise|मुफ़्त|तोहफा|गिफ्ट/i.test(cleanPrompt);
      draft = {
        reply: `${safeBuyerName} के लिए ₹${rupees}${hasGift ? ' + सरप्राइज गिफ्ट' : ''} का रिवॉर्ड तैयार है।`,
        rewardType: hasGift && rupees > 0 ? 'combo' : hasGift ? 'surprise_gift' : 'coupon',
        couponCode: `MARCO${rupees || 50}`,
        discountRupees: pct > 0 ? 0 : rupees,
        discountPercent: pct,
        minOrderRupees: 0,
        freeGiftItem: hasGift ? '1 kg ताज़ा मंडी सरप्राइज गिफ्ट' : '',
        title: `VIP Reward for ${safeBuyerName}`,
        messageToCustomer: `नमस्ते ${safeBuyerName}! आपके नियमित ऑर्डर्स के लिए खास MARCO 💯 रिवॉर्ड: ${cleanPrompt}`,
      };
    }

    res.json({
      success: true,
      reply: draft?.reply || 'Reward draft generated successfully.',
      draft: {
        rewardType: draft?.rewardType || 'coupon',
        couponCode: String(draft?.couponCode || 'MARCO50').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 18),
        discountRupees: Math.max(0, Math.round(Number(draft?.discountRupees) || 0)),
        discountPercent: Math.min(80, Math.max(0, Math.round(Number(draft?.discountPercent) || 0))),
        minOrderRupees: Math.max(0, Math.round(Number(draft?.minOrderRupees) || 0)),
        freeGiftItem: String(draft?.freeGiftItem || '').slice(0, 120),
        title: String(draft?.title || `Special Reward for ${safeBuyerName}`).slice(0, 100),
        messageToCustomer: String(draft?.messageToCustomer || '').slice(0, 320),
      },
    });
  } catch (err: any) {
    console.error('AI reward designer error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'AI reward designer failed.',
    });
  }
});

app.post('/api/admin/rewards/grant', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  try {
    const body = req.body || {};
    if (!body.targetName && !body.targetPhone && !body.targetUserId) {
      return res.status(400).json({ success: false, error: 'Target customer is required.' });
    }
    const reward = CustomerRewardsService.grantReward(
      {
        targetUserId: body.targetUserId,
        targetPhone: body.targetPhone,
        targetName: body.targetName || 'Customer',
        rewardType: body.rewardType || 'coupon',
        couponCode: body.couponCode,
        discountRupees: body.discountRupees,
        discountPercent: body.discountPercent,
        minOrderRupees: body.minOrderRupees,
        freeGiftItem: body.freeGiftItem,
        title: body.title || 'MARCO 💯 VIP Reward',
        messageToCustomer: body.messageToCustomer || 'Special discount & reward unlocked by Admin!',
        aiPromptUsed: body.aiPromptUsed,
      },
      req.adminActor?.name || req.adminActor?.email || 'Admin'
    );
    AdminAuditService.record({
      actorEmail: req.adminActor?.email,
      actorName: req.adminActor?.name,
      action: 'GRANT_CUSTOMER_REWARD',
      resource: '/api/admin/rewards/grant',
      details: `Granted ${reward.rewardType} (${reward.couponCode}) to ${reward.targetName}`,
      ip: req.ip,
    });
    res.status(201).json({ success: true, reward });
  } catch (err: any) {
    console.error('Grant reward error:', err);
    res.status(500).json({ success: false, error: 'Failed to grant reward' });
  }
});

app.get('/api/rewards/my', (req, res) => {
  try {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : '';
    const phone = typeof req.query.phone === 'string' ? req.query.phone : '';
    if (!userId && !phone) {
      return res.json({ success: true, rewards: [] });
    }
    const rewards = CustomerRewardsService.listForUser({ userId, phone });
    res.json({ success: true, rewards });
  } catch (err: any) {
    console.error('Fetch my rewards error:', err);
    res.status(500).json({ success: false, error: 'Failed to load rewards' });
  }
});

app.post('/api/rewards/:rewardId/redeem', (req, res) => {
  try {
    const { orderId } = req.body || {};
    const result = CustomerRewardsService.redeemReward(req.params.rewardId, orderId);
    if (!result.success) {
      return res.status(404).json({ success: false, error: 'Reward not found' });
    }
    res.json({ success: true, reward: result.reward });
  } catch (err: any) {
    console.error('Redeem reward error:', err);
    res.status(500).json({ success: false, error: 'Failed to redeem reward' });
  }
});

// Admin Deployment & Build Lifecycle Diagnostics (Cache-Control: no-cache + SHA-256 Build Hash)
app.get('/api/admin/deployment-status', requireAdminAuth, (_req: AuthenticatedAdminRequest, res) => {
  const fp = applyNoCacheHeaders(res);
  res.json({
    success: true,
    version: CURRENT_RELEASE_VERSION,
    releaseId: CURRENT_RELEASE_ID,
    releasedAt: CURRENT_RELEASE_DATE,
    buildHash: fp.buildHash,
    buildHashShort: fp.buildHashShort,
    environment: fp.environment,
    bootedAt: BUILD_TIMESTAMP,
    uptimeSeconds: Math.round(process.uptime()),
    distBuilt: fp.distBuilt,
    distAssetCount: fp.distAssetCount,
    workspaceClean: fp.workspaceClean,
    runtimeStorageIsolated: true,
    requiredCacheControl: 'no-store, no-cache, must-revalidate, proxy-revalidate',
    checkedAt: new Date().toISOString(),
  });
});

app.post('/api/admin/deployment/verify', requireAdminAuth, (req: AuthenticatedAdminRequest, res) => {
  const fp = applyNoCacheHeaders(res);
  AdminAuditService.record({
    actorEmail: req.adminActor?.email,
    actorName: req.adminActor?.name,
    action: 'VERIFY_DEPLOYMENT_LIFECYCLE',
    resource: '/api/admin/deployment/verify',
    details: `Verified v${CURRENT_RELEASE_VERSION} #${fp.buildHashShort} (${fp.environment}) workspaceClean=${fp.workspaceClean}`,
    ip: req.ip,
  });
  res.json({
    success: true,
    verified: true,
    version: CURRENT_RELEASE_VERSION,
    releaseId: CURRENT_RELEASE_ID,
    releasedAt: CURRENT_RELEASE_DATE,
    buildHash: fp.buildHash,
    buildHashShort: fp.buildHashShort,
    environment: fp.environment,
    bootedAt: BUILD_TIMESTAMP,
    uptimeSeconds: Math.round(process.uptime()),
    distBuilt: fp.distBuilt,
    distAssetCount: fp.distAssetCount,
    workspaceClean: fp.workspaceClean,
    runtimeStorageIsolated: true,
    requiredCacheControl: 'no-store, no-cache, must-revalidate, proxy-revalidate',
    checkedAt: new Date().toISOString(),
  });
});

// Modular App Bundle (Android TWA ZIP & APK status) + Server Reverse Geocoding Routers
app.use('/api/app', appBundleRoutes);
app.use('/api/geocode', geocodeRoutes);

// Standardized API 404 & Error Handling Middleware
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});
app.use(expressErrorHandler);

async function startServer() {
  const httpServer = http.createServer(app);
  const rootDir = process.cwd();
  const distDir = path.resolve(rootDir, 'dist');
  const distIndexPath = path.join(distDir, 'index.html');

  // Always mount public/assets and public/downloads statically
  app.use('/assets', express.static(path.resolve(rootDir, 'public/assets')));
  app.use('/downloads', express.static(path.resolve(rootDir, 'public/downloads')));

  // Android Trusted Web Activity (TWA) / WebAPK Digital Asset Links & Manifest Content-Type
  app.get('/.well-known/assetlinks.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.marco.tazamandi.twa',
          sha256_cert_fingerprints: [
            '00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00',
          ],
        },
      },
    ]);
  });

  app.get('/manifest.json', (_req, res, next) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    next();
  });

  // Production detection: active when NODE_ENV=production OR prebuilt dist exists without explicit development mode
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    (process.env.NODE_ENV !== 'development' && fs.existsSync(distIndexPath));

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: false,
        ws: false,
        watch: null,
      },
      appType: 'spa',
    });

    // Serve a clean WebSocket-free Vite client shim since HMR is disabled in preview
    app.get('/@vite/client', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(`
const sheetsMap = new Map();
const linkSheetsMap = new Map();
if ("document" in globalThis) {
  document.querySelectorAll("style[data-vite-dev-id]").forEach((el) => {
    sheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
}
let lastInsertedStyle;
export function updateStyle(id, content) {
  if (linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => { lastInsertedStyle = undefined; }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement("afterend", style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll(\`link[rel="stylesheet"][data-vite-dev-id="\${CSS.escape(id)}"]\`).forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== "." && url[0] !== "/") return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://vite.dev");
  return \`\${pathname}?\${queryToInject}\${search ? "&" + search.slice(1) : ""}\${hash || ""}\`;
}
export class ErrorOverlay extends HTMLElement {}
`);
    });

    app.use((req, res, next) => {
      const p = req.path.toLowerCase();
      if (p === '/' || p === '/index.html' || p === '/sw.js' || p === '/manifest.json') {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    // Serve hashed JS/CSS assets with immutable caching, but strictly NO-CACHE for HTML, Service Worker & manifest
    app.use(express.static(distDir, {
      setHeaders: (res, filePath) => {
        const normalized = filePath.toLowerCase();
        if (
          normalized.endsWith('.html') ||
          normalized.endsWith('sw.js') ||
          normalized.endsWith('registersw.js') ||
          normalized.includes('workbox-') ||
          normalized.endsWith('manifest.json')
        ) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));

    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      if (!fs.existsSync(distIndexPath)) {
        return res.status(503).json({
          success: false,
          error: 'Application build not found. Run npm run build before starting in production.',
        });
      }
      res.sendFile(distIndexPath);
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(` ताज़ाMandi Server v${CURRENT_RELEASE_VERSION} (${isProduction ? 'production' : 'development'}) running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

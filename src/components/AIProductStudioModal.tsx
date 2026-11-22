import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ProduceItem, MobileAccessoryItem, AccessoryCategory } from '../types';
import { pickLang } from '../utils/i18nHelper';
import { getAdminAuthHeaders } from '../api/client';
import {
  Sparkles,
  X,
  Search,
  Plus,
  CheckCircle2,
  Globe,
  Layers,
  RefreshCw,
  AlertCircle,
  Camera,
  Smartphone,
  Wand2,
} from 'lucide-react';

interface AIProductStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'single' | 'batch' | 'validate' | 'accessory_studio';
}

export const AIProductStudioModal: React.FC<AIProductStudioModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'single',
}) => {
  const { addProduceItem, addAccessoryItem, lang } = useApp();

  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'validate' | 'accessory_studio'>(
    initialTab
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Single Produce Lookup States
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sourcedProduct, setSourcedProduct] = useState<ProduceItem | null>(null);
  const [searchError, setSearchError] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Batch Generation States
  const [selectedTheme, setSelectedTheme] = useState('Exotic & Polyhouse Vegetables');
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [batchItems, setBatchItems] = useState<ProduceItem[]>([]);
  const [batchAddedCount, setBatchAddedCount] = useState(0);

  // Validation States
  const [validateInput, setValidateInput] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  // MARCO 100 AI Accessory Photo Studio States
  const studioFileRef = useRef<HTMLInputElement | null>(null);
  const [rawUploadDataUrl, setRawUploadDataUrl] = useState<string>('');
  const [studioPolishedDataUrl, setStudioPolishedDataUrl] = useState<string>('');
  const [studioCategoryHint, setStudioCategoryHint] = useState<AccessoryCategory>('chargers');
  const [studioUserHint, setStudioUserHint] = useState('');
  const [studioFrameMode, setStudioFrameMode] = useState<'studio' | 'clean'>('studio');
  const [isGeneratingStudio, setIsGeneratingStudio] = useState(false);
  const [studioError, setStudioError] = useState('');
  const [studioDraft, setStudioDraft] = useState<{
    category: AccessoryCategory;
    nameEn: string;
    nameHi: string;
    nameMr: string;
    nameHinglish: string;
    descEn: string;
    descHi: string;
    descMr: string;
    descHinglish: string;
    specsText: string;
    warranty: string;
    mrp: number;
    price: number;
    wholesaleCost: number;
    studioPitch: string;
  } | null>(null);
  const [publishedAccessorySuccess, setPublishedAccessorySuccess] = useState(false);

  if (!isOpen) return null;

  // Client-side Canvas E-Commerce Studio Renderer (No external key needed, instant clean lighting + stage)
  const renderStudioPhotoCanvas = (srcDataUrl: string, mode: 'studio' | 'clean'): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const W = 800;
        const H = 600;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(srcDataUrl);
          return;
        }

        if (mode === 'clean') {
          const scale = Math.max(W / img.width, H / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          ctx.filter = 'contrast(1.06) saturate(1.06) brightness(1.03)';
          ctx.drawImage(img, (W - drawW) / 2, (H - drawH) / 2, drawW, drawH);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
          return;
        }

        // Commercial light studio radial backdrop
        const bgGrad = ctx.createRadialGradient(W / 2, H * 0.44, 60, W / 2, H / 2, W * 0.72);
        bgGrad.addColorStop(0, '#ffffff');
        bgGrad.addColorStop(0.55, '#f1f5f9');
        bgGrad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Soft studio pedestal shadow
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
        ctx.beginPath();
        ctx.ellipse(W / 2, H * 0.83, W * 0.28, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw product nicely framed inside 76% bounds with crisp elevation
        const maxW = W * 0.76;
        const maxH = H * 0.72;
        const scale = Math.min(maxW / img.width, maxH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const dx = (W - drawW) / 2;
        const dy = (H - drawH) / 2 - 14;

        ctx.save();
        ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 12;
        ctx.filter = 'contrast(1.07) saturate(1.08) brightness(1.03)';
        ctx.beginPath();
        const radius = 22;
        ctx.roundRect(dx, dy, drawW, drawH, radius);
        ctx.clip();
        ctx.drawImage(img, dx, dy, drawW, drawH);
        ctx.restore();

        // MARCO 100 studio quality seal at bottom-right
        ctx.save();
        ctx.fillStyle = 'rgba(2, 44, 34, 0.9)';
        ctx.beginPath();
        ctx.roundRect(W - 188, H - 52, 166, 34, 10);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('MARCO 100 · TESTED', W - 174, H - 30);
        ctx.restore();

        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = srcDataUrl;
    });
  };

  const handleStudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      setRawUploadDataUrl(dataUrl);
      const polished = await renderStudioPhotoCanvas(dataUrl, studioFrameMode);
      setStudioPolishedDataUrl(polished);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleStudioFrame = async (mode: 'studio' | 'clean') => {
    setStudioFrameMode(mode);
    if (rawUploadDataUrl) {
      const polished = await renderStudioPhotoCanvas(rawUploadDataUrl, mode);
      setStudioPolishedDataUrl(polished);
    }
  };

  const handleGenerateAccessoryWithAI = async () => {
    if (!rawUploadDataUrl && !studioUserHint.trim()) return;
    setIsGeneratingStudio(true);
    setStudioError('');
    setPublishedAccessorySuccess(false);

    try {
      const targetImage = studioPolishedDataUrl || rawUploadDataUrl;
      const mimeMatch = targetImage ? targetImage.match(/^data:([^;]+);base64,/) : null;
      const res = await fetch('/api/ai/accessory-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
        body: JSON.stringify({
          imageBase64: targetImage || undefined,
          mimeType: mimeMatch?.[1] || 'image/jpeg',
          categoryHint: studioCategoryHint,
          brand: 'MARCO 100',
          userHint: studioUserHint.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI Studio generation failed');
      }
      const draft = data.accessoryDraft;
      setStudioDraft({
        category: draft.category,
        nameEn: draft.name.en,
        nameHi: draft.name.hi,
        nameMr: draft.name.mr,
        nameHinglish: draft.name.hinglish,
        descEn: draft.description.en,
        descHi: draft.description.hi,
        descMr: draft.description.mr,
        descHinglish: draft.description.hinglish,
        specsText: (draft.specs || []).join(', '),
        warranty: draft.warranty,
        mrp: draft.mrp,
        price: draft.price,
        wholesaleCost: draft.wholesaleCost,
        studioPitch: draft.studioPitch || '',
      });
    } catch (err: any) {
      setStudioError(err.message || 'AI स्टूडियो विवरण तैयार नहीं कर सका।');
    } finally {
      setIsGeneratingStudio(false);
    }
  };

  const handlePublishStudioAccessory = () => {
    if (!studioDraft) return;
    const finalImage =
      studioPolishedDataUrl || rawUploadDataUrl || '/assets/images/mobile_fast_chargers.jpg';

    const newItem: MobileAccessoryItem = {
      id: `acc_studio_${Date.now()}`,
      category: studioDraft.category,
      brand: 'MARCO 100',
      price: Number(studioDraft.price) || 499,
      mrp: Number(studioDraft.mrp) || 899,
      wholesaleCost: Number(studioDraft.wholesaleCost) || 300,
      image: finalImage,
      specs: studioDraft.specsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      warranty: studioDraft.warranty,
      rating: 4.9,
      inStock: true,
      founderVerified: true,
      isNewArrival: true,
      name: {
        en: studioDraft.nameEn,
        hi: studioDraft.nameHi,
        mr: studioDraft.nameMr,
        hinglish: studioDraft.nameHinglish,
      },
      description: {
        en: studioDraft.descEn,
        hi: studioDraft.descHi,
        mr: studioDraft.descMr,
        hinglish: studioDraft.descHinglish,
      },
    };

    addAccessoryItem(newItem);
    setPublishedAccessorySuccess(true);
    setTimeout(() => {
      setPublishedAccessorySuccess(false);
      setStudioDraft(null);
      setRawUploadDataUrl('');
      setStudioPolishedDataUrl('');
      setStudioUserHint('');
    }, 2200);
  };

  // Single Sourcing Handler
  const handleSingleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setSourcedProduct(null);
    setAddedSuccess(false);

    try {
      const res = await fetch('/api/ai/smart-sourcing-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Product sourcing failed');
      }

      setSourcedProduct(data.product);
    } catch (err: any) {
      setSearchError(err.message || 'AI उत्पाद विवरण खोजने में विफल रहा। कृपया नाम दोबारा जांचें।');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSourcedToStore = () => {
    if (!sourcedProduct) return;
    addProduceItem(sourcedProduct);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      setSourcedProduct(null);
      setQuery('');
    }, 2000);
  };

  const handleGenerateBatch = async (themeName: string) => {
    setSelectedTheme(themeName);
    setIsGeneratingBatch(true);
    setBatchItems([]);
    setBatchAddedCount(0);

    try {
      const res = await fetch('/api/ai/generate-inventory-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
        body: JSON.stringify({ theme: themeName, count: 4 }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setBatchItems(data.items);
      }
    } catch (err) {
      console.error('Batch generation error:', err);
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleImportAllBatch = () => {
    batchItems.forEach((item) => addProduceItem(item));
    setBatchAddedCount(batchItems.length);
    setTimeout(() => {
      setBatchItems([]);
      setBatchAddedCount(0);
    }, 2500);
  };

  const handleValidateName = async () => {
    if (!validateInput.trim()) return;
    setIsValidating(true);
    try {
      const res = await fetch('/api/ai/validate-multilingual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: validateInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setValidationResult(data.validation);
      }
    } catch {} finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-linear-to-r from-emerald-800 to-teal-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight font-display">
                {pickLang(lang, {
                  en: 'AI Product Studio & Catalog Generator',
                  hi: 'AI स्मार्ट प्रोडक्ट फोटो व इन्वेंट्री स्टूडियो',
                  mr: 'AI स्मार्ट प्रॉडक्ट फोटो व इन्व्हेंटरी स्टुडिओ',
                  hinglish: 'AI Smart Product Photo & Catalog Studio',
                })}
              </h2>
              <p className="text-xs text-emerald-200 font-medium">
                {pickLang(lang, {
                  en: 'Photo polish, Gemini specs/titles & 1-click live publishing',
                  hi: 'कच्ची फोटो से साफ ई-कॉमर्स कार्ड, नाम, स्पेक्स व लाइव पब्लिशिंग',
                  mr: 'फोटो पॉलिश, नावे, वैशिष्ट्ये व थेट कॅटलॉग पब्लिशिंग',
                  hinglish: 'Photo se studio e-commerce card, specs aur 1-click live publish',
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs font-bold bg-slate-50 dark:bg-slate-850 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('accessory_studio')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'accessory_studio'
                ? 'border-amber-500 text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>MARCO 💯 Photo Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'single'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>{pickLang(lang, { en: 'Produce Sourcing', hi: 'सब्ज़ी-फल खोजें', mr: 'भाजी-फळे शोधा' })}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'batch'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{pickLang(lang, { en: 'Batch Generator', hi: 'बैच जनरेटर', mr: 'बॅच जनरेटर' })}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('validate')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'validate'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{pickLang(lang, { en: 'Name Validator', hi: 'नाम वैलिडेटर', mr: 'नाव तपासणी' })}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* TAB 4: MARCO 100 AI Product Photo & Specs Studio */}
          {activeTab === 'accessory_studio' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* Upload & Canvas Studio Preview */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {pickLang(lang, {
                        en: '1. Upload Product Photo',
                        hi: '1. प्रोडक्ट की फोटो अपलोड करें',
                        mr: '१. प्रॉडक्टचा फोटो अपलोड करा',
                        hinglish: '1. Product Photo Upload Karein',
                      })}
                    </span>
                    {rawUploadDataUrl && (
                      <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => handleToggleStudioFrame('studio')}
                          className={`px-2 py-0.5 rounded-md cursor-pointer ${
                            studioFrameMode === 'studio'
                              ? 'bg-emerald-700 text-white'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Studio Card
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStudioFrame('clean')}
                          className={`px-2 py-0.5 rounded-md cursor-pointer ${
                            studioFrameMode === 'clean'
                              ? 'bg-emerald-700 text-white'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Full Bleed
                        </button>
                      </div>
                    )}
                  </div>

                  <input
                    ref={studioFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleStudioFileChange}
                    className="hidden"
                  />

                  <div
                    onClick={() => studioFileRef.current?.click()}
                    className="aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors"
                  >
                    {studioPolishedDataUrl ? (
                      <img
                        src={studioPolishedDataUrl}
                        alt="Studio Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 space-y-2">
                        <Camera className="w-8 h-8 text-emerald-600 mx-auto" />
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {pickLang(lang, {
                            en: 'Tap to Upload Charger / Earbuds / Case Photo',
                            hi: 'फोटो चुनने के लिए टैप करें (चार्जर, केबल, ईयरबड्स, कवर)',
                            mr: 'फोटो निवडण्यासाठी टॅप करा',
                            hinglish: 'Photo select karne ke liye tap karein',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Auto-enhances studio lighting, drop-shadow & MARCO 100 seal
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details + AI Vision Analyze */}
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {pickLang(lang, {
                        en: 'Category',
                        hi: 'कैटेगरी चुनें',
                        mr: 'प्रकार निवडा',
                        hinglish: 'Category',
                      })}
                    </label>
                    <select
                      value={studioCategoryHint}
                      onChange={(e) => setStudioCategoryHint(e.target.value as AccessoryCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                    >
                      <option value="chargers">⚡ Fast Chargers & Cables</option>
                      <option value="audio">🎧 Earbuds & Audio</option>
                      <option value="cases">📱 Phone Covers & Cases</option>
                      <option value="mounts">🧲 Car & Desk Mounts</option>
                      <option value="protection">🛡️ Screen Guards</option>
                      <option value="powerbanks">🔋 Power Banks</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {pickLang(lang, {
                        en: 'Quick Notes / Model (optional if photo uploaded)',
                        hi: 'प्रोडक्ट विवरण / मॉडल नोट्स (जैसे: 65W Type-C, Braided Cable)',
                        mr: 'प्रॉडक्ट माहिती / मॉडेल नोट्स',
                        hinglish: 'Product specs ya notes (e.g. 65W GaN, MagSafe Cover)',
                      })}
                    </label>
                    <textarea
                      rows={3}
                      value={studioUserHint}
                      onChange={(e) => setStudioUserHint(e.target.value)}
                      placeholder="उदा: MARCO 100 65W Type-C सुपरफास्ट चार्जर, 1.5m केबल के साथ..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAccessoryWithAI}
                    disabled={isGeneratingStudio || (!rawUploadDataUrl && !studioUserHint.trim())}
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    {isGeneratingStudio ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 text-amber-300" />
                    )}
                    <span>
                      {isGeneratingStudio
                        ? pickLang(lang, {
                            en: 'AI Generating Titles, Specs & Pricing...',
                            hi: 'AI नाम, स्पेक्स व कीमत तैयार कर रहा है...',
                            mr: 'AI माहिती तयार करत आहे...',
                          })
                        : pickLang(lang, {
                            en: 'Auto-Generate Title, Specs & Price with AI',
                            hi: 'AI से ई-कॉमर्स टाइटल, स्पेक्स व रेट बनाएं',
                            mr: 'AI ने टायटल, स्पेक्स व दर तयार करा',
                            hinglish: 'AI se Title, Specs & Rate Banayein',
                          })}
                    </span>
                  </button>

                  {studioError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{studioError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Editable Draft Card + Publish */}
              {studioDraft && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-emerald-300 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-800 dark:text-emerald-300 text-xs">
                      ✓ MARCO 💯 Studio Draft Ready (Editable)
                    </span>
                    <span className="text-[10px] text-slate-500">{studioDraft.studioPitch}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Title (English)</label>
                      <input
                        type="text"
                        value={studioDraft.nameEn}
                        onChange={(e) => setStudioDraft({ ...studioDraft, nameEn: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">शीर्षक (हिंदी)</label>
                      <input
                        type="text"
                        value={studioDraft.nameHi}
                        onChange={(e) => setStudioDraft({ ...studioDraft, nameHi: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500">
                      Key Specs (comma separated)
                    </label>
                    <input
                      type="text"
                      value={studioDraft.specsText}
                      onChange={(e) => setStudioDraft({ ...studioDraft, specsText: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Selling ₹</label>
                      <input
                        type="number"
                        value={studioDraft.price}
                        onChange={(e) =>
                          setStudioDraft({ ...studioDraft, price: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">MRP ₹</label>
                      <input
                        type="number"
                        value={studioDraft.mrp}
                        onChange={(e) =>
                          setStudioDraft({ ...studioDraft, mrp: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Warranty</label>
                      <input
                        type="text"
                        value={studioDraft.warranty}
                        onChange={(e) =>
                          setStudioDraft({ ...studioDraft, warranty: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePublishStudioAccessory}
                    disabled={publishedAccessorySuccess}
                    className={`w-full py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      publishedAccessorySuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm'
                    }`}
                  >
                    {publishedAccessorySuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {pickLang(lang, {
                            en: 'Published Live to MARCO 100 Accessories!',
                            hi: 'MARCO 100 स्टोर में लाइव जुड़ गया!',
                            mr: 'MARCO 100 स्टोअरमध्ये लाइव्ह झाले!',
                          })}
                        </span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>
                          {pickLang(lang, {
                            en: 'Publish Live to MARCO 100 Store',
                            hi: 'MARCO 100 स्टोर में लाइव पब्लिश करें',
                            mr: 'MARCO 100 स्टोअरवर पब्लिश करा',
                          })}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: Single Produce Sourcing Lookup */}
          {activeTab === 'single' && (
            <div className="space-y-4">
              <form onSubmit={handleSingleLookup} className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  सब्ज़ी या फल का नाम लिखें (हिंदी, मराठी या English):
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="उदा: ब्रोकली, Zucchini, ड्रैगन फ्रूट, मशरूम, लाल शिमला मिर्च..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium text-xs focus:outline-emerald-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || !query.trim()}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0"
                  >
                    {isSearching ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isSearching ? 'खोज रहा है...' : 'AI से खोजें'}</span>
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                <span>त्वरित सुझाव:</span>
                {[
                  'हरी ब्रोकली',
                  'बटन मशरूम',
                  'पीली शिमला मिर्च',
                  'ज़ुकिनी (Zucchini)',
                  'ड्रैगन फ्रूट',
                  'अवाकाडो (Avocado)',
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setQuery(sug)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>

              {searchError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}

              {sourcedProduct && (
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-emerald-300 dark:border-emerald-800/60 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center text-3xl shadow-sm shrink-0">
                        {sourcedProduct.visualEmoji || '🥬'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                            {sourcedProduct.name?.hi} · {sourcedProduct.name?.mr}
                          </h3>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            {sourcedProduct.category}
                          </span>
                        </div>
                        <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                          English: <strong>{sourcedProduct.name?.en}</strong> (
                          {sourcedProduct.variety || 'Grade-A'})
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                          📍 मूल स्रोत: {sourcedProduct.origin}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                        ₹{sourcedProduct.pricePerKg}/kg
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        थोक भाव: ₹{sourcedProduct.wholesalePricePerKg}/kg
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold">
                        मार्जिन: +₹{sourcedProduct.pricePerKg - sourcedProduct.wholesalePricePerKg}/kg
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-2.5">
                    {sourcedProduct.description?.hi || sourcedProduct.description?.en}
                  </p>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      मंडी क्रेट लक्ष्य: {sourcedProduct.mandiTierBagKg} kg · न्यूनतम:{' '}
                      {sourcedProduct.minIncrementKg} kg
                    </span>

                    <button
                      type="button"
                      onClick={handleAddSourcedToStore}
                      disabled={addedSuccess}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        addedSuccess
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                      }`}
                    >
                      {addedSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>✓ स्टोर में जुड़ गया!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>✨ स्टोर इन्वेंट्री में जोड़ें</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Batch Inventory Generator */}
          {activeTab === 'batch' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  थीम आधारित संपूर्ण इन्वेंट्री बैच बनाएं (1-Click Generator):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      label: '🥦 एग्जॉटिक पॉलीहाउस सब्जियां',
                      theme:
                        'Exotic & Polyhouse Vegetables (Broccoli, Zucchini, Mushrooms, Bell Peppers)',
                    },
                    {
                      label: '🍎 इम्युनिटी व विदेशी फल',
                      theme:
                        'Immunity & Exotic Fruits (Kiwi, Dragon Fruit, Avocado, Blueberries)',
                    },
                    {
                      label: '🥗 सलाद व डिटॉक्स कॉम्बो',
                      theme:
                        'Fresh Salad & Detox Diet Produce (Lettuce, Cherry Tomatoes, Celery, Baby Corn)',
                    },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => handleGenerateBatch(btn.theme)}
                      disabled={isGeneratingBatch}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedTheme === btn.theme
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs">{btn.label}</div>
                      <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{btn.theme}</div>
                    </button>
                  ))}
                </div>
              </div>

              {isGeneratingBatch && (
                <div className="p-8 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                  <div className="font-bold text-xs text-slate-700 dark:text-slate-300">
                    AI महाराष्ट्र मंडी मानकों के अनुसार 4 नए उत्पाद तैयार कर रहा है...
                  </div>
                </div>
              )}

              {batchItems.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      जनरेट किए गए {batchItems.length} उत्पाद:
                    </span>
                    <button
                      type="button"
                      onClick={handleImportAllBatch}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>सभी {batchItems.length} उत्पाद स्टोर में इंपोर्ट करें</span>
                    </button>
                  </div>

                  {batchAddedCount > 0 && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>✓ {batchAddedCount} नए उत्पाद लाइव स्टोर कैटलॉग में सफलतापूर्वक जुड़ गए!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {batchItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-750 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{item.visualEmoji || '🌱'}</span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {item.name?.hi || item.name?.en}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              ₹{item.pricePerKg}/kg · थोक: ₹{item.wholesalePricePerKg}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            addProduceItem(item);
                            setBatchItems((prev) => prev.filter((i) => i.id !== item.id));
                          }}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold"
                        >
                          + जोड़ें
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Multilingual Validation */}
          {activeTab === 'validate' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  सब्ज़ी या फल का स्थानीय नाम जांचें व प्रमाणित करें:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={validateInput}
                    onChange={(e) => setValidateInput(e.target.value)}
                    placeholder="उदा: काकड़ी, Batata, Shevga, भेंडी..."
                    className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleValidateName}
                    disabled={isValidating || !validateInput.trim()}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1"
                  >
                    {isValidating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Globe className="w-3.5 h-3.5" />
                    )}
                    <span>सत्यापित करें</span>
                  </button>
                </div>
              </div>

              {validationResult && (
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      मानकीकृत APMC मंडी नाम: {validationResult.standardMandiName}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold">हिंदी</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {validationResult.correctedName?.hi}
                      </div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold">मराठी</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {validationResult.correctedName?.mr}
                      </div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold">English</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {validationResult.correctedName?.en}
                      </div>
                    </div>
                  </div>

                  {validationResult.notes && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                      ℹ️ {validationResult.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

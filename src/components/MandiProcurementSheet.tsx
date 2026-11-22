import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { resolveProductVisualAsset } from '../utils/productVisualMapper';
import { SafeProductImg } from './SafeProductImg';
import { CustomerOrder, ProduceItem, MobileAccessoryItem, AccessoryCategory } from '../types';
import {
  FileText,
  Share2,
  CheckSquare,
  Square,
  Truck,
  Building,
  Package,
  Printer,
  Copy,
  Check,
  Smartphone,
  Clock,
  Layers,
  QrCode,
  Download,
  Search,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  X,
  Sparkles,
  Camera,
  Gift,
  Lock,
  Mic,
  MicOff,
  Globe,
  CheckCircle2,
  XCircle,
  Users,
  Mail,
  Phone,
  MapPin,
  Activity,
  Shield,
  SlidersHorizontal,
  BarChart3,
} from 'lucide-react';
import {
  generateOrderWhatsAppBillText,
  getWhatsAppBillUrl,
} from '../utils/billingUtils';
import { hasVerifiedProductPhoto } from '../utils/productVisualMapper';
import { ReferralRewardsManager } from './ReferralRewardsManager';
import { ProductImageUploaderModal } from './ProductImageUploaderModal';
import { QuickPriceSetter } from './QuickPriceSetter';
import { LanguageSelector } from './LanguageSelector';
import { AdminFeatureControlsTab } from './AdminFeatureControlsTab';
import { AdminBuyersAnalyticsTab } from './AdminBuyersAnalyticsTab';
import { pickLang } from '../utils/i18nHelper';
import { adminApi, type AdminAuditLogPayload } from '../api/endpoints';
import { getAdminAuthHeaders } from '../api/client';
import { userService, type MergedAdminUser } from '../services/userService';
import { usePWAInstall } from '../hooks/usePWAInstall';

const RECOMMENDED_MISSING_PRODUCE: Partial<ProduceItem>[] = [
  {
    id: 'fruit_custard_apple_sitaphal',
    name: {
      en: 'Fresh Custard Apple (Sitaphal / Sharifa)',
      hi: 'मीठा ताज़ा सीताफल / शरीफा',
      hinglish: 'Sweet Desi Sitaphal',
      mr: 'गोड ताजे सीताफळ (Sitaphal)',
    },
    category: 'fruits',
    subcategory: 'Seasonal Tropical',
    variety: 'Balanagar Sweet GI',
    qualityGrade: 'Premium',
    pricePerKg: 120,
    wholesalePricePerKg: 80,
    localMarketPricePerKg: 160,
    stockUnit: 'kg',
    pricingUnit: 'kg',
    minIncrementKg: 0.5,
    defaultKg: 1.0,
    availableStock: 40,
    image: '/assets/images/fresh_sitaphal_1794541513407.jpg',
    origin: 'Saswad & Daulatabad Farms',
    mandiTierBagKg: 20,
    baseCommunityDemandKg: 15,
    isAvailable: true,
    isSeasonal: true,
    freshnessGuarantee: { en: 'Soft creamy pulp, high brix sweetness', hi: 'मखमली मीठा गूदा', mr: 'गोड मलईदार गर', hinglish: 'Soft sweet creamy pulp' },
    description: { en: 'Natural sweet custard apple full of rich antioxidants.', hi: 'प्राकृतिक मिठास से भरपूर ताज़ा सीताफल।', mr: 'अतिशय गोड आणि पौष्टिक सीताफळ.', hinglish: 'Rich seasonal treat.' },
  },
  {
    id: 'veg_raw_cooking_banana',
    name: {
      en: 'Raw Green Cooking Banana (Kaccha Kela)',
      hi: 'कच्चा हरा केला (सब्ज़ी/चिप्स)',
      hinglish: 'Fresh Kaccha Kela',
      mr: 'कच्ची केळी (Kacchi Keli)',
    },
    category: 'vegetables',
    subcategory: 'Cooking Plantains',
    variety: 'Nendran Desi Cooking',
    qualityGrade: 'Grade-A',
    pricePerKg: 40,
    wholesalePricePerKg: 25,
    localMarketPricePerKg: 60,
    stockUnit: 'piece',
    pricingUnit: 'piece',
    unitLabel: { en: 'Piece', hi: 'नग / केला', mr: 'नग', hinglish: 'Piece' },
    unitPresets: [2, 4, 6],
    minIncrementKg: 1.0,
    defaultKg: 2.0,
    availableStock: 50,
    image: '/assets/images/fresh_bananas_bunch_1793423349892.jpg',
    origin: 'Jalgaon & Basmath Banana Belt',
    mandiTierBagKg: 30,
    baseCommunityDemandKg: 18,
    isAvailable: true,
    isSeasonal: false,
    freshnessGuarantee: { en: 'Firm unblemished green skin, firm white flesh inside', hi: 'कसा हुआ हरा केला, चिप्स व कोफ्ता के लिए उपयुक्त', mr: 'टणक हिरवी कच्ची केळी', hinglish: 'Firm cooking plantain' },
    description: { en: 'Raw plantains for savory curries, koftas, and crisp homemade banana chips.', hi: 'सब्ज़ी, कोफ्ता और कुरकुरे चिप्स के लिए उत्तम कच्चा केला।', mr: 'भाजी, काप व उपवासासाठी कच्ची केळी.', hinglish: 'Versatile cooking banana.' },
  },
  {
    id: 'fruit_desi_amla',
    name: {
      en: 'Fresh Desi Gooseberry (Amla)',
      hi: 'देसी ताज़ा आंवला',
      hinglish: 'Fresh Desi Amla',
      mr: 'गावरान आवळा (Desi Amla)',
    },
    category: 'fruits',
    subcategory: 'Nutritional Fruits',
    variety: 'Chakaiya Large Vitamin C',
    qualityGrade: 'Premium',
    pricePerKg: 60,
    wholesalePricePerKg: 35,
    localMarketPricePerKg: 90,
    stockUnit: 'kg',
    pricingUnit: 'kg',
    minIncrementKg: 0.25,
    defaultKg: 0.5,
    availableStock: 35,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
    origin: 'Pratapgarh & Satara Agro Orchards',
    mandiTierBagKg: 25,
    baseCommunityDemandKg: 12,
    isAvailable: true,
    isSeasonal: true,
    freshnessGuarantee: { en: 'Juicy, astringent and tart, highest natural Vitamin C concentration', hi: 'विटामिन सी से भरपूर ताज़ा रसीला आंवला', mr: 'रसाळ आणि पौष्टिक गावरान आवळा', hinglish: 'Juicy Vitamin C rich amla' },
    description: { en: 'Immunity booster gooseberry for fresh morning juice, murabba, and digestion pickles.', hi: 'रोग प्रतिरोधक क्षमता बढ़ाने और जूस, मुरब्बे के लिए ताज़ा आंवला।', mr: 'आरोग्यवर्धक आवळा रस व लोणच्यासाठी.', hinglish: 'Immunity powerhouse.' },
  },
  {
    id: 'fruit_dragon_fruit',
    name: {
      en: 'Exotic Red Dragon Fruit (Pitaya)',
      hi: 'ताज़ा ड्रैगन फ्रूट (कमलम)',
      hinglish: 'Exotic Pink Dragon Fruit',
      mr: 'ड्रॅगन फ्रूट / कमलम (Dragon Fruit)',
    },
    category: 'fruits',
    subcategory: 'Exotic Fruits',
    variety: 'Pink Pearl Red Flesh',
    qualityGrade: 'Premium',
    pricePerKg: 160,
    wholesalePricePerKg: 105,
    localMarketPricePerKg: 240,
    stockUnit: 'piece',
    pricingUnit: 'piece',
    unitLabel: { en: 'Piece', hi: 'नग', mr: 'नग', hinglish: 'Piece' },
    unitPresets: [1, 2, 3],
    minIncrementKg: 1.0,
    defaultKg: 1.0,
    availableStock: 30,
    image: 'https://images.unsplash.com/photo-1527325678964-54921661f888?auto=format&fit=crop&w=800&q=80',
    origin: 'Baramati & Kutch Exotic Orchards',
    mandiTierBagKg: 15,
    baseCommunityDemandKg: 10,
    isAvailable: true,
    isSeasonal: false,
    freshnessGuarantee: { en: 'Vibrant pink scales, sweet red flesh speckled with edible seeds', hi: 'ताज़ी गुलाबी पत्तियाँ और मीठा रसदार गूदा', mr: 'गुलाबी गर असलेले रसाळ ड्रॅगन फ्रूट', hinglish: 'Exotic sweet red pitaya' },
    description: { en: 'Superfruit packed with antioxidants, fiber, and vibrant magenta color.', hi: 'एंटीऑक्सीडेंट और फाइबर से भरपूर विदेशी फल।', mr: 'ऊर्जेने परिपूर्ण आणि देखणे फळ.', hinglish: 'Antioxidant rich exotic fruit.' },
  },
];

interface MandiProcurementSheetProps {
  onOpenInvoice?: (order: CustomerOrder) => void;
  onLockAdmin?: () => void;
  onOpenAIStudio?: () => void;
  onOpenSamplesGallery?: () => void;
}

export const MandiProcurementSheet: React.FC<MandiProcurementSheetProps> = ({
  onOpenInvoice,
  onLockAdmin,
  onOpenAIStudio,
  onOpenSamplesGallery,
}) => {
  const {
    produceList,
    updateProduceItem,
    toggleProduceAvailability,
    toggleProduceSeasonal,
    deleteProduceItem,
    addProduceItem,
    resetProduceToMaster,
    exportProduceMasterCsv,
    accessoriesList,
    addAccessoryItem,
    updateAccessoryItem,
    deleteAccessoryItem,
    getCommunityDemandKg,
    orders,
    updateOrderStatus,
    referralConfig,
    updateReferralConfig,
    brand,
    lang,
    setLang,
    t,
    isBefore11PmCutoff,
    featureFlags,
  } = useApp();

  const {
    currentVersion,
    clientBuildHash,
    serverBuildHash,
    cacheHeadersValid,
    republishDetected,
    hasUpdate,
    isAutoSyncing,
    triggerUpdate,
    checkForUpdates,
  } = usePWAInstall();

  const [activeAdminTab, setActiveAdminTab] = useState<'produce' | 'wholesale_aggregation' | 'inventory' | 'master' | 'referrals' | 'accessories' | 'dispatch' | 'batches' | 'users' | 'activity' | 'audit' | 'features' | 'buyers_analytics'>('produce');
  const [copied, setCopied] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [backendWholesaleOrder, setBackendWholesaleOrder] = useState<any>(null);
  const [isLoadingWholesale, setIsLoadingWholesale] = useState(false);
  const [bulkStatusSuccess, setBulkStatusSuccess] = useState('');
  const [confirmResetCatalog, setConfirmResetCatalog] = useState(false);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);

  // Mobile Accessories Admin Master States
  const [accSearch, setAccSearch] = useState('');
  const [accCategoryFilter, setAccCategoryFilter] = useState<string>('all');
  const [editingAccessory, setEditingAccessory] = useState<MobileAccessoryItem | null>(null);
  const [isAddAccessoryModalOpen, setIsAddAccessoryModalOpen] = useState(false);
  const [confirmDeleteAccId, setConfirmDeleteAccId] = useState<string | null>(null);
  const [newAccessoryForm, setNewAccessoryForm] = useState<Partial<MobileAccessoryItem>>({
    id: '',
    name: { en: '', hi: '', mr: '', hinglish: '' },
    category: 'chargers',
    brand: 'MARCO Tech',
    price: 299,
    mrp: 599,
    wholesaleCost: 165,
    warranty: '6 Months Replacement',
    specs: ['Fast Charging', 'Quality Tested'],
    inStock: true,
    founderVerified: true,
    isNewArrival: true,
    image: '/assets/images/mobile_fast_chargers.jpg',
    description: {
      en: 'Genuine high-durability mobile accessory verified for society residents.',
      hi: 'सोसायटी ग्राहकों के लिए जाँची हुई टिकाऊ मोबाइल एक्सेसरी।',
      mr: 'उच्च दर्जाची तपासलेली मोबाईल ॲक्सेसरी.',
      hinglish: 'Genuine durable tested mobile accessory.',
    },
  });

  // Admin Voice Control & Mandatory Pre-Apply Confirmation State
  type PendingAdminAction = {
    actionType:
      | 'UPDATE_PRODUCE'
      | 'ADD_PRODUCE'
      | 'UPDATE_ACCESSORY'
      | 'ADD_ACCESSORY'
      | 'SET_LANGUAGE'
      | 'SWITCH_TAB'
      | 'UPDATE_ORDER_STATUS'
      | 'UPDATE_REFERRAL_CONFIG';
    summaryHi: string;
    summaryEn: string;
    targetId?: string;
    targetName?: string;
    updates?: Record<string, any>;
    newProduct?: {
      nameEn: string;
      nameHi?: string;
      category?: string;
      price: number;
      wholesalePrice?: number;
      mrp?: number;
      stock?: number;
      unit?: string;
      brand?: string;
      warranty?: string;
    };
    targetLang?: 'hi' | 'en' | 'hinglish';
    targetTab?: typeof activeAdminTab;
    orderId?: string;
    orderStatus?: CustomerOrder['status'];
  };

  const [adminVoiceInput, setAdminVoiceInput] = useState('');
  const [isAdminListening, setIsAdminListening] = useState(false);
  const [isAdminParsing, setIsAdminParsing] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<PendingAdminAction | null>(null);
  const [adminVoiceToast, setAdminVoiceToast] = useState('');
  const adminRecRef = useRef<any>(null);

  const speakAdminShort = (txt: string) => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(txt);
        u.lang = lang === 'en' || lang === 'hinglish' ? 'en-IN' : 'hi-IN';
        u.rate = 1.08;
        window.speechSynthesis.speak(u);
      }
    } catch {}
  };

  const applyConfirmedAdminAction = (act: PendingAdminAction) => {
    let doneMsg = '';
    if (act.actionType === 'UPDATE_PRODUCE' && act.targetId && act.updates) {
      updateProduceItem(act.targetId, act.updates);
      doneMsg = pickLang(lang, {
        en: `Updated ${act.targetName || act.targetId}`,
        hi: `✅ ${act.targetName || act.targetId} अपडेट हो गया!`,
        mr: `✅ ${act.targetName || act.targetId} अपडेट झाले!`,
        hinglish: `✅ ${act.targetName || act.targetId} update ho gaya!`,
      });
    } else if (act.actionType === 'ADD_PRODUCE' && act.newProduct?.nameEn) {
      const slug = act.newProduct.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const item: ProduceItem = {
        id: `veg_${slug || Date.now()}`,
        name: {
          en: act.newProduct.nameEn,
          hi: act.newProduct.nameHi || act.newProduct.nameEn,
          mr: act.newProduct.nameHi || act.newProduct.nameEn,
          hinglish: act.newProduct.nameEn,
        },
        category: (act.newProduct.category as any) || 'vegetables',
        subcategory: 'Voice Added',
        variety: 'Fresh Mandi Lot',
        pricePerKg: Math.max(1, Number(act.newProduct.price) || 40),
        wholesalePricePerKg: Math.max(1, Number(act.newProduct.wholesalePrice) || Math.round((Number(act.newProduct.price) || 40) * 0.7)),
        localMarketPricePerKg: Math.round((Number(act.newProduct.price) || 40) * 1.3),
        availableStock: Number(act.newProduct.stock) || 40,
        stockUnit: (act.newProduct.unit as any) || 'kg',
        pricingUnit: (act.newProduct.unit as any) || 'kg',
        minIncrementKg: act.newProduct.unit === 'piece' || act.newProduct.unit === 'gaddi' ? 1 : 0.25,
        defaultKg: 1,
        origin: 'APMC Vashi Wholesale Mandi',
        isAvailable: true,
        isSeasonal: false,
        mandiTierBagKg: 25,
        baseCommunityDemandKg: 10,
        image: '/assets/images/fresh_fruits_basket_1793421532041.jpg',
        freshnessGuarantee: { en: 'Morning mandi batch', hi: 'सुबह का ताज़ा मंडी बैच', mr: 'सकाळचा ताजा लॉट', hinglish: 'Morning mandi batch' },
        description: { en: 'Added via Admin Voice Control.', hi: 'एडमिन वॉइस से जोड़ा गया नया उत्पाद।', mr: 'अ‍ॅडमिन व्हॉइसद्वारे जोडलेले उत्पादन.', hinglish: 'Added by Admin.' },
        adminApprovalStatus: 'approved',
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      addProduceItem(item);
      setActiveAdminTab('master');
      doneMsg = pickLang(lang, {
        en: `Added new product: ${item.name.en}`,
        hi: `✅ नया उत्पाद "${item.name.hi}" जुड़ गया!`,
        mr: `✅ नवीन उत्पादन "${item.name.mr}" जोडले!`,
        hinglish: `✅ Naya product "${item.name.en}" add ho gaya!`,
      });
    } else if (act.actionType === 'UPDATE_ACCESSORY' && act.targetId && act.updates) {
      updateAccessoryItem(act.targetId, act.updates);
      setActiveAdminTab('accessories');
      doneMsg = pickLang(lang, {
        en: `Updated accessory ${act.targetName || act.targetId}`,
        hi: `✅ एक्सेसरी "${act.targetName || act.targetId}" अपडेट हो गई!`,
        mr: `✅ ॲक्सेसरी "${act.targetName || act.targetId}" अपडेट झाली!`,
        hinglish: `✅ Accessory "${act.targetName || act.targetId}" update ho gayi!`,
      });
    } else if (act.actionType === 'ADD_ACCESSORY' && act.newProduct?.nameEn) {
      const slug = act.newProduct.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const price = Math.max(10, Number(act.newProduct.price) || 299);
      const acc: MobileAccessoryItem = {
        id: `acc_${slug || Date.now()}`,
        name: {
          en: act.newProduct.nameEn,
          hi: act.newProduct.nameHi || act.newProduct.nameEn,
          mr: act.newProduct.nameHi || act.newProduct.nameEn,
          hinglish: act.newProduct.nameEn,
        },
        category: (['chargers', 'audio', 'cases', 'mounts', 'protection', 'powerbanks'].includes(act.newProduct.category || '')
          ? act.newProduct.category
          : 'chargers') as AccessoryCategory,
        brand: act.newProduct.brand || 'MARCO Tech',
        price,
        mrp: Number(act.newProduct.mrp) || Math.round(price * 1.6),
        wholesaleCost: Number(act.newProduct.wholesalePrice) || Math.round(price * 0.58),
        warranty: act.newProduct.warranty || '6 Months Replacement',
        specs: ['Verified Quality', 'Admin Added'],
        rating: 4.8,
        inStock: true,
        founderVerified: true,
        isNewArrival: true,
        image: '/assets/images/mobile_fast_chargers.jpg',
        description: {
          en: 'Verified mobile tech accessory available for morning delivery.',
          hi: 'सुबह की डिलीवरी के लिए उपलब्ध सत्यापित मोबाइल एक्सेसरी।',
          mr: 'सकाळच्या डिलिव्हरीसाठी उपलब्ध मोबाईल ॲक्सेसरी.',
          hinglish: 'Verified mobile accessory.',
        },
      };
      addAccessoryItem(acc);
      setActiveAdminTab('accessories');
      doneMsg = pickLang(lang, {
        en: `Added accessory: ${acc.name.en}`,
        hi: `✅ नई एक्सेसरी "${acc.name.hi}" जुड़ गई!`,
        mr: `✅ नवीन ॲक्सेसरी "${acc.name.mr}" जोडली!`,
        hinglish: `✅ Nayi accessory "${acc.name.en}" add ho gayi!`,
      });
    } else if (act.actionType === 'SET_LANGUAGE' && act.targetLang) {
      setLang(act.targetLang);
      doneMsg = act.targetLang === 'en' ? '✅ Admin language set to English!' : act.targetLang === 'hinglish' ? '✅ Bhasha Hinglish set ho gayi!' : '✅ भाषा हिंदी में बदल दी गई!';
    } else if (act.actionType === 'SWITCH_TAB' && act.targetTab) {
      setActiveAdminTab(act.targetTab);
      doneMsg = pickLang(lang, {
        en: `Switched to ${act.targetTab}`,
        hi: '✅ टैब खोल दिया गया।',
        mr: '✅ टॅब उघडला.',
        hinglish: `Switched to ${act.targetTab}`,
      });
    } else if (act.actionType === 'UPDATE_ORDER_STATUS' && act.orderId && act.orderStatus) {
      updateOrderStatus(act.orderId, act.orderStatus);
      doneMsg = `✅ Order #${act.orderId} -> ${act.orderStatus}`;
    } else if (act.actionType === 'UPDATE_REFERRAL_CONFIG' && act.updates) {
      updateReferralConfig(act.updates);
      setActiveAdminTab('referrals');
      doneMsg = pickLang(lang, {
        en: '✅ Referral reward rules updated!',
        hi: '✅ रेफ़रल नियम अपडेट हो गए!',
        mr: '✅ रेफरल नियम अपडेट झाले!',
        hinglish: '✅ Referral reward rules update ho gaye!',
      });
    }

    setPendingAdminAction(null);
    if (doneMsg) {
      setAdminVoiceToast(doneMsg);
      speakAdminShort(doneMsg.replace(/[✅✖]/g, ''));
      setTimeout(() => setAdminVoiceToast(''), 4500);
    }
  };

  const handleAdminVoiceSubmit = async (rawCmd?: string) => {
    const cmd = (rawCmd ?? adminVoiceInput).trim();
    if (!cmd) return;
    if (!rawCmd) setAdminVoiceInput('');
    const lower = cmd.toLowerCase();

    // Fast voice confirm / cancel when a pending confirmation preview is already active
    if (pendingAdminAction) {
      if (
        lower === 'confirm' ||
        lower === 'yes' ||
        lower.includes('कन्फर्म') ||
        lower.includes('कन्फ़र्म') ||
        lower.includes('हाँ') ||
        lower.includes('हां') ||
        lower.includes('कर दो') ||
        lower.includes('सेव') ||
        lower === 'ok'
      ) {
        applyConfirmedAdminAction(pendingAdminAction);
        return;
      }
      if (lower.includes('रद्द') || lower.includes('cancel') || lower.includes('नहीं') || lower === 'no') {
        setPendingAdminAction(null);
        setAdminVoiceToast(
          pickLang(lang, {
            en: 'Action cancelled.',
            hi: '✖ बदलाव रद्द कर दिया गया।',
            mr: '✖ बदल रद्द केला.',
            hinglish: 'Action cancel ho gaya.',
          })
        );
        setTimeout(() => setAdminVoiceToast(''), 3000);
        return;
      }
    }

    // 1. Fast local language switch preview (still requires confirmation as requested)
    if (lower.includes('english') || lower.includes('इंग्लिश') || lower.includes('अंग्रेजी')) {
      const act: PendingAdminAction = {
        actionType: 'SET_LANGUAGE',
        targetLang: 'en',
        summaryHi: 'क्या आप एडमिन भाषा को "English" में बदलना चाहते हैं?',
        summaryEn: 'Confirm switching Admin language to English?',
      };
      setPendingAdminAction(act);
      speakAdminShort(lang === 'en' || lang === 'hinglish' ? act.summaryEn : act.summaryHi);
      return;
    }
    if (lower.includes('hinglish') || lower.includes('हिंग्लिश')) {
      const act: PendingAdminAction = {
        actionType: 'SET_LANGUAGE',
        targetLang: 'hinglish',
        summaryHi: 'क्या आप एडमिन भाषा को "Hinglish" में बदलना चाहते हैं?',
        summaryEn: 'Confirm switching Admin language to Hinglish?',
      };
      setPendingAdminAction(act);
      speakAdminShort(lang === 'en' || lang === 'hinglish' ? act.summaryEn : act.summaryHi);
      return;
    }
    if (lower.includes('hindi') || lower.includes('हिंदी') || lower.includes('हिन्दी')) {
      const act: PendingAdminAction = {
        actionType: 'SET_LANGUAGE',
        targetLang: 'hi',
        summaryHi: 'क्या आप एडमिन भाषा को "हिंदी" में बदलना चाहते हैं?',
        summaryEn: 'Confirm switching Admin language to Hindi?',
      };
      setPendingAdminAction(act);
      speakAdminShort(lang === 'en' || lang === 'hinglish' ? act.summaryEn : act.summaryHi);
      return;
    }

    // 2. Ask Gemini 3.1 Flash-Lite admin command parser for full natural-language control
    setIsAdminParsing(true);
    try {
      const res = await fetch('/api/ai/admin-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
        body: JSON.stringify({
          command: cmd,
          lang,
          produceCatalog: produceList.slice(0, 80).map((p) => ({
            id: p.id,
            en: p.name.en,
            hi: p.name.hi,
            price: p.pricePerKg,
            wholesale: p.wholesalePricePerKg,
            stock: p.availableStock ?? 50,
            available: p.isAvailable !== false,
          })),
          accessoryCatalog: accessoriesList.map((a) => ({
            id: a.id,
            en: a.name.en,
            hi: a.name.hi,
            brand: a.brand,
            price: a.price,
            mrp: a.mrp,
            wholesale: a.wholesaleCost,
            inStock: a.inStock,
          })),
          ordersSummary: orders.slice(0, 12).map((o) => ({
            id: o.id,
            customer: o.customerName,
            status: o.status,
            total: o.totalAmount,
          })),
        }),
      });
      const data = await res.json();
      const p = data?.parsed;
      if (!data?.success || !p || p.actionType === 'UNKNOWN') {
        const errTxt = pickLang(lang, {
          en: `Could not understand "${cmd}". Try: "Set Tomato price 45" or "Add Charger 399".`,
          hi: `यह कमांड समझ नहीं आया: "${cmd}"। बोलें जैसे: "टमाटर रेट 45 करो" या "चार्जर प्राइस 399 करो"।`,
          mr: `कमांड समजला नाही: "${cmd}".`,
          hinglish: `Yeh command samajh nahi aaya: "${cmd}". Try: "Tamatar 45 karo" ya "Charger 399 karo".`,
        });
        setAdminVoiceToast(errTxt);
        setTimeout(() => setAdminVoiceToast(''), 4000);
        return;
      }

      // Clean nulls out of updates object so only modified fields apply
      const cleanUpdates: Record<string, any> = {};
      if (p.updates && typeof p.updates === 'object') {
        Object.entries(p.updates).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== '') cleanUpdates[k] = v;
        });
      }

      const matchedProd = p.targetId ? produceList.find((x) => x.id === p.targetId) : undefined;
      const matchedAcc = p.targetId ? accessoriesList.find((x) => x.id === p.targetId) : undefined;

      const staged: PendingAdminAction = {
        actionType: p.actionType,
        summaryHi: p.summaryHi || `क्या "${cmd}" लागू कर दें?`,
        summaryEn: p.summaryEn || `Confirm applying "${cmd}"?`,
        targetId: p.targetId,
        targetName: matchedProd?.name.en || matchedAcc?.name.en || p.newProduct?.nameEn,
        updates: cleanUpdates,
        newProduct: p.newProduct,
        targetLang: p.targetLang,
        targetTab: p.targetTab,
        orderId: p.orderId,
        orderStatus: p.orderStatus,
      };
      setPendingAdminAction(staged);
      speakAdminShort(lang === 'en' || lang === 'hinglish' ? staged.summaryEn : staged.summaryHi);
    } catch {
      setAdminVoiceToast(
        pickLang(lang, {
          en: 'Network error parsing voice command',
          hi: 'कमांड प्रोसेस करने में समस्या आई।',
          mr: 'कमांड प्रोसेस करण्यात अडचण आली.',
          hinglish: 'Network error parsing voice command',
        })
      );
    } finally {
      setIsAdminParsing(false);
    }
  };

  const toggleAdminMic = () => {
    if (isAdminListening) {
      try {
        adminRecRef.current?.stop();
      } catch {}
      setIsAdminListening(false);
      return;
    }
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setAdminVoiceToast(
        pickLang(lang, {
          en: 'Voice mic unavailable — please type command.',
          hi: 'माइक उपलब्ध नहीं — कृपया लिखकर कमांड दें।',
          mr: 'माइक उपलब्ध नाही — कृपया टाइप करा.',
          hinglish: 'Voice mic unavailable — please type command.',
        })
      );
      return;
    }
    try {
      const rec = new SpeechRec();
      adminRecRef.current = rec;
      rec.lang = lang === 'en' || lang === 'hinglish' ? 'en-IN' : 'hi-IN';
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      let latest = '';
      rec.onstart = () => setIsAdminListening(true);
      rec.onresult = (ev: any) => {
        let finalStr = '';
        let interimStr = '';
        for (let i = 0; i < ev.results.length; i++) {
          const chunk = ev.results[i][0]?.transcript || '';
          if (ev.results[i].isFinal) finalStr += ' ' + chunk;
          else interimStr += ' ' + chunk;
        }
        latest = (finalStr || interimStr).trim();
        setAdminVoiceInput(latest);
        if (finalStr.trim()) {
          try {
            rec.stop();
          } catch {}
          setIsAdminListening(false);
          handleAdminVoiceSubmit(finalStr.trim());
        }
      };
      rec.onerror = () => setIsAdminListening(false);
      rec.onend = () => {
        setIsAdminListening(false);
      };
      rec.start();
    } catch {
      setIsAdminListening(false);
    }
  };

  useEffect(() => {
    return () => {
      try {
        adminRecRef.current?.abort();
      } catch {}
    };
  }, []);

  // Photo Uploader & Manager State for Produce & Accessories
  const [photoModalProduct, setPhotoModalProduct] = useState<{
    id: string;
    name: string;
    image: string;
    type: 'produce' | 'accessory';
    category?: string;
  } | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [missingPhotoFilter, setMissingPhotoFilter] = useState(false);
  const [localAccessoryImages, setLocalAccessoryImages] = useState<Record<string, string>>(() => {
    try {
      const s = localStorage.getItem('tazamandi_accessory_images');
      if (s) return JSON.parse(s);
    } catch {}
    return {};
  });

  const handleSaveProductImage = (productId: string, newImageUrl: string, productType: 'produce' | 'accessory') => {
    if (productType === 'produce') {
      updateProduceItem(productId, { image: newImageUrl });
    } else {
      updateAccessoryItem(productId, { image: newImageUrl });
      setLocalAccessoryImages((prev) => {
        const next = { ...prev, [productId]: newImageUrl };
        localStorage.setItem('tazamandi_accessory_images', JSON.stringify(next));
        return next;
      });
    }
  };

  // Inventory Tracking State
  const [inventoryRecords, setInventoryRecords] = useState<any[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [inventoryActionMessage, setInventoryActionMessage] = useState('');

  // Fetch backend consolidated wholesale order with 9:00 PM cutoff and 1-2kg safety buffer
  const fetchBackendWholesaleOrder = async () => {
    setIsLoadingWholesale(true);
    try {
      const res = await fetch('/api/procurement/aggregate?cutoffHour=21', {
        headers: { ...getAdminAuthHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.consolidatedOrder) {
          setBackendWholesaleOrder(data.consolidatedOrder);
        }
      }
    } catch (err) {
      console.error('Failed to fetch consolidated wholesale order:', err);
    } finally {
      setIsLoadingWholesale(false);
    }
  };

  // Fetch live inventory tracking (Procured vs Delivered)
  const fetchInventory = async () => {
    setIsLoadingInventory(true);
    try {
      const res = await fetch('/api/inventory', {
        headers: { ...getAdminAuthHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.inventory) {
          setInventoryRecords(data.inventory);
        }
      }
    } catch (err) {
      console.error('Failed to fetch inventory tracking:', err);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // Registered Customer Directory State (Merged Firestore + Backend — NO passwords)
  const [registeredUsers, setRegisteredUsers] = useState<MergedAdminUser[]>([]);
  const [userSyncStats, setUserSyncStats] = useState<{ backendCount: number; firestoreCount: number }>({
    backendCount: 0,
    firestoreCount: 0,
  });
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const fetchRegisteredUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await userService.fetchMergedAdminUsers();
      setRegisteredUsers(res.users);
      setUserSyncStats({
        backendCount: res.backendCount,
        firestoreCount: res.firestoreCount,
      });
    } catch (err) {
      console.error('Failed to fetch registered users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Admin RBAC Audit Log State
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogPayload[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditFilterStatus, setAuditFilterStatus] = useState<'ALL' | 'allowed' | 'denied'>('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [confirmClearAudit, setConfirmClearAudit] = useState(false);

  const fetchAuditLogs = async (statusOverride?: 'ALL' | 'allowed' | 'denied') => {
    setIsLoadingAudit(true);
    try {
      const targetStatus = statusOverride ?? auditFilterStatus;
      const res = await adminApi.getAuditLogs({
        status: targetStatus,
        limit: 250,
      });
      if (res?.success && Array.isArray(res.logs)) {
        setAuditLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to fetch admin audit logs:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleClearAuditLogs = async () => {
    try {
      const res = await adminApi.clearAuditLogs();
      if (res?.success) {
        setAuditLogs([]);
        setConfirmClearAudit(false);
      }
    } catch (err) {
      console.error('Failed to clear audit logs:', err);
    }
  };

  // User Activity Logger Admin State
  const [activityLogs, setActivityLogs] = useState<
    Array<{
      id: string;
      userId?: string;
      userName?: string;
      userEmail?: string;
      userPhone?: string;
      eventType: string;
      actionTitle: string;
      details?: string;
      pageTab?: string;
      deviceSummary?: string;
      timestamp: string;
    }>
  >([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [activityFilterType, setActivityFilterType] = useState<string>('ALL');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [confirmClearLogs, setConfirmClearLogs] = useState(false);

  const fetchActivityLogs = async () => {
    setIsLoadingActivity(true);
    try {
      const res = await fetch('/api/activity-logs?limit=200', {
        headers: { ...getAdminAuthHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          setActivityLogs(data.logs);
        }
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const handleClearActivityLogs = async () => {
    try {
      const res = await fetch('/api/activity-logs', {
        method: 'DELETE',
        headers: { ...getAdminAuthHeaders() },
      });
      if (res.ok) {
        setActivityLogs([]);
        setConfirmClearLogs(false);
      }
    } catch (err) {
      console.error('Failed to clear activity logs:', err);
    }
  };

  React.useEffect(() => {
    fetchBackendWholesaleOrder();
    fetchInventory();
    fetchRegisteredUsers();
    fetchActivityLogs();
    fetchAuditLogs();
  }, [orders]);


  // Product Master Search & Filters
  const [masterSearch, setMasterSearch] = useState('');
  const [masterCategoryFilter, setMasterCategoryFilter] = useState('all');
  const [masterStockFilter, setMasterStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'seasonal'>('all');
  const [editingProduct, setEditingProduct] = useState<ProduceItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState<Partial<ProduceItem>>({
    name: { en: '', hi: '', mr: '', hinglish: '' },
    category: 'vegetables',
    subcategory: '',
    variety: '',
    pricePerKg: 40,
    wholesalePricePerKg: 25,
    localMarketPricePerKg: 55,
    availableStock: 50,
    stockUnit: 'kg',
    minIncrementKg: 0.25,
    defaultKg: 0.5,
    origin: 'APMC Vashi Wholesale Mandi',
    isAvailable: true,
    isSeasonal: false,
    image: '/assets/images/fresh_fruits_basket_1793421532041.jpg',
    description: { en: 'Farm fresh produce direct from morning mandi lot.', hi: 'सुबह की मंडी से ताज़ा खेत का माल।', mr: 'सकाळी थेट बाजारातून आलेला ताजा शेतमाल.', hinglish: 'Farm fresh direct lot.' },
    freshnessGuarantee: { en: 'Hand-graded morning auction lot', hi: 'सुबह की नीलामी का छांटा हुआ माल', mr: 'सकाळच्या लिलावातील निवडक माल', hinglish: 'Morning auction graded lot' },
  });

  // Filtered Master Product List
  const filteredMasterList = useMemo(() => {
    return produceList.filter((item) => {
      if (masterCategoryFilter !== 'all' && item.category !== masterCategoryFilter) {
        return false;
      }
      if (masterStockFilter === 'in_stock' && item.isAvailable === false) {
        return false;
      }
      if (masterStockFilter === 'out_of_stock' && item.isAvailable !== false) {
        return false;
      }
      if (masterStockFilter === 'seasonal' && !item.isSeasonal) {
        return false;
      }
      if (missingPhotoFilter && hasVerifiedProductPhoto(item.id)) {
        return false;
      }
      const q = masterSearch.toLowerCase().trim();
      if (!q) return true;
      const nameEn = (item.name?.en || '').toLowerCase();
      const nameHi = (item.name?.hi || '').toLowerCase();
      const nameMr = (item.name?.mr || '').toLowerCase();
      const id = (item.id || '').toLowerCase();
      const sub = (item.subcategory || '').toLowerCase();
      const varName = (item.variety || '').toLowerCase();
      return (
        nameEn.includes(q) ||
        nameHi.includes(q) ||
        nameMr.includes(q) ||
        id.includes(q) ||
        sub.includes(q) ||
        varName.includes(q)
      );
    });
  }, [produceList, masterCategoryFilter, masterStockFilter, masterSearch, missingPhotoFilter]);

  // Compute Produce Wholesale Sourcing (+1-2kg buffer as requested)
  const procurementTable = produceList.map((item) => {
    const demandKg = getCommunityDemandKg(item.id);
    const suggestedBufferKg = demandKg > 0 ? (demandKg < 10 ? 1.0 : demandKg < 30 ? 1.5 : 2.0) : 0;
    const totalProcureKg = demandKg > 0 ? Math.ceil((demandKg + suggestedBufferKg) * 2) / 2 : 0;

    const wholesaleCost = totalProcureKg * item.wholesalePricePerKg;
    const customerRevenue = demandKg * item.pricePerKg;
    const grossMargin = customerRevenue - wholesaleCost;

    return {
      item,
      demandKg,
      bufferKg: suggestedBufferKg,
      totalProcureKg,
      wholesaleRate: item.wholesalePricePerKg,
      customerRate: item.pricePerKg,
      wholesaleCost: Math.round(wholesaleCost),
      customerRevenue: Math.round(customerRevenue),
      grossMargin: Math.round(grossMargin),
    };
  }).filter((row) => row.demandKg > 0);

  const grandTotalProcureKg = procurementTable.reduce((sum, r) => sum + r.totalProcureKg, 0);
  const grandTotalWholesaleCost = procurementTable.reduce((sum, r) => sum + r.wholesaleCost, 0);
  const grandTotalRevenue = procurementTable.reduce((sum, r) => sum + r.customerRevenue, 0);
  const grandTotalMargin = grandTotalRevenue - grandTotalWholesaleCost;

  // Compute Accessories Fulfillment Demand across orders
  const accessorySummary = accessoriesList.map((acc) => {
    const totalUnits = orders.reduce((sum, ord) => {
      const match = ord.accessoryItems.find((i) => i.accessoryId === acc.id);
      return sum + (match ? match.quantity : 0);
    }, 0);

    const wholesaleTotal = totalUnits * acc.wholesaleCost;
    const revenueTotal = totalUnits * acc.price;
    const margin = revenueTotal - wholesaleTotal;

    return {
      accessory: acc,
      totalUnits,
      wholesaleTotal,
      revenueTotal,
      margin,
    };
  }).filter((r) => r.totalUnits > 0);

  const grandAccessoriesRevenue = accessorySummary.reduce((s, r) => s + r.revenueTotal, 0);
  const grandAccessoriesWholesale = accessorySummary.reduce((s, r) => s + r.wholesaleTotal, 0);
  const grandAccessoriesMargin = grandAccessoriesRevenue - grandAccessoriesWholesale;

  // Generate shareable text for Mandi Arhtiya / Wholesaler
  const generateShareableText = () => {
    const lines = [
      `*${brand.brandName} - APMC मंडी थोक आढ़त आर्डर*`,
      `सोसायटी: ${brand.societyName}`,
      `तारीख: ${new Date().toLocaleDateString('hi-IN')}`,
      `-----------------------------`,
      ...procurementTable.map(
        (r) =>
          `• ${r.item.name[lang] || r.item.name.hi}: *${r.totalProcureKg} kg* (ग्राहक मांग: ${r.demandKg} kg + बफर: ${r.bufferKg} kg)`
      ),
      `-----------------------------`,
      `*कुल वजन:* ${grandTotalProcureKg} kg`,
      `*थोक भुगतान राशि:* ₹${grandTotalWholesaleCost}`,
      `*आढ़ती सूचना:* सुबह 4:00 AM पर प्रथम श्रेणी (Grade-A) फ्रेश माल अलग रखें।`,
    ];
    return lines.join('\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateShareableText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(generateShareableText())}`;

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.isSampleOrder) return false;
      if (filterStatus === 'all') return true;
      return o.status === filterStatus;
    });
  }, [orders, filterStatus]);


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Building className="w-4 h-4" />
            <span>{brand.brandName} Operations Console</span>
            <span>·</span>
            <span>{brand.societyName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-slate-100">
            {t('admin_title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            {pickLang(lang, {
              en: 'Complete operational control of aggregated daily mandi sourcing, accessories picking, and flat doorstep packing.',
              hi: 'यहाँ लाइव दिखेगा कि आज कितना बटाटा, कांदा, फल और मोबाइल एक्सेसरीज का कुल आर्डर आया है, और सुबह मंडी व स्टॉक से कितना माल उठाना है।',
              mr: 'येथे आज किती बटाटे, कांदा, फळे व मोबाईल ॲक्सेसरीजची मागणी आली आहे आणि सकाळी किती माल उचलायचा आहे ते थेट दिसेल.',
              hinglish: 'Yahan live dikhega ki aaj kitna sabzi, fruits aur accessories ka order aaya hai aur subah mandi se kya uthana hai.',
            })}
          </p>
        </div>

        {/* Action Buttons + Build Sync Indicator + 18-Language Compact Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {(() => {
            const activeShortHash = (serverBuildHash || clientBuildHash || '').slice(0, 8);
            const isOutOfSync = republishDetected || hasUpdate || !cacheHeadersValid;
            return (
              <button
                type="button"
                onClick={() => {
                  if (isOutOfSync) {
                    triggerUpdate();
                  } else {
                    checkForUpdates();
                    setActiveAdminTab('features');
                  }
                }}
                title={
                  isOutOfSync
                    ? 'New re-published build or cache mismatch detected — click to purge caches and sync'
                    : 'Verified Cache-Control: no-cache + SHA-256 build hash synced — click to inspect'
                }
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono tabular-nums ${
                  isOutOfSync
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400'
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isOutOfSync ? (
                  <>
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isAutoSyncing ? 'animate-spin' : ''}`} />
                    <span>
                      {isAutoSyncing
                        ? 'Syncing Build...'
                        : `Re-Publish Sync · #${activeShortHash || 'update'}`}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      v{currentVersion}
                      {activeShortHash ? ` · #${activeShortHash}` : ''} · Synced
                    </span>
                  </>
                )}
              </button>
            );
          })()}
          <LanguageSelector compact align="right" />
          {onLockAdmin && (
            <button
              onClick={onLockAdmin}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 rounded-lg transition-colors shadow-xs"
              title={pickLang(lang, { en: 'Lock Admin Console', hi: 'एडमिन पैनल लॉक करें', mr: 'अ‍ॅडमिन पॅनेल लॉक करा', hinglish: 'Lock Admin Console' })}
            >
              <Lock className="w-4 h-4 text-rose-600" />
              <span>
                {pickLang(lang, {
                  en: '🔒 Lock Admin',
                  hi: '🔒 एडमिन लॉक करें',
                  mr: '🔒 अ‍ॅडमिन लॉक करा',
                  hinglish: '🔒 Lock Admin',
                })}
              </span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : t('copy_sheet')}</span>
          </button>
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>{t('whatsapp_mandi')}</span>
          </a>
          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Admin Voice Command Assistant Bar (Confirmation Required Before Every Change) */}
      <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white border border-emerald-500/40 shadow-lg space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={toggleAdminMic}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
                isAdminListening
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {isAdminListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>
                {isAdminListening
                  ? lang === 'en'
                    ? 'Stop Mic'
                    : lang === 'hinglish'
                    ? 'Mic Band Karein'
                    : 'माइक बंद'
                  : lang === 'en'
                  ? 'Admin Voice Mic'
                  : lang === 'hinglish'
                  ? '🎙️ Admin Mic (Bolein)'
                  : '🎙️ एडमिन माइक (बोलें)'}
              </span>
            </button>
            <div className="min-w-0">
              <div className="text-xs font-bold text-emerald-300 truncate">
                {lang === 'en'
                  ? 'Voice-Controlled Admin (Always asks confirmation first)'
                  : lang === 'hinglish'
                  ? 'Admin Voice Control — Har badlav se pehle confirmation poochega'
                  : 'बोलकर एडमिन कंट्रोल — हर बदलाव पहले आपसे कन्फ़र्म करेगा'}
              </div>
              <div className="text-[10.5px] text-slate-300 truncate">
                {pickLang(lang, {
                  en: 'Try: "Set tomato price 45", "Charger 399", "Open inventory"',
                  hi: 'जैसे बोलें: "टमाटर रेट 45 करो", "फास्ट चार्जर 399 करो", "इन्वेंटरी खोलो"',
                  mr: 'बोला: "टोमॅटो भाव ४५ करा", "चार्जर ३९९ करा"',
                  hinglish: 'Bolein: "Tamatar 45 karo", "Charger 399 karo", "Inventory kholo"',
                })}
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAdminVoiceSubmit();
            }}
            className="flex items-center gap-1.5 flex-1 sm:max-w-sm"
          >
            <input
              type="text"
              value={adminVoiceInput}
              onChange={(e) => setAdminVoiceInput(e.target.value)}
              placeholder={pickLang(lang, {
                en: 'Speak or type admin command...',
                hi: 'बोलें या कमांड लिखें (जैसे: टमाटर 45 करो)...',
                mr: 'बोला किंवा कमांड लिहा...',
                hinglish: 'Bolein ya command likhein...',
              })}
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-400 focus:outline-emerald-400"
            />
            <button
              type="submit"
              disabled={!adminVoiceInput.trim() || isAdminParsing}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-xs font-black cursor-pointer shrink-0"
            >
              {isAdminParsing
                ? '...'
                : pickLang(lang, { en: 'Preview', hi: 'चलाएँ', mr: 'पहा', hinglish: 'Preview' })}
            </button>
          </form>
        </div>

        {/* Mandatory Pre-Apply Confirmation Card */}
        {pendingAdminAction && (
          <div className="p-3 rounded-xl bg-amber-400/15 border border-amber-400/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-black text-amber-200">
                  {pickLang(lang, {
                    en: 'Confirmation Required Before Saving:',
                    hi: 'सेव करने से पहले कन्फ़र्मेशन ज़रूरी:',
                    mr: 'जतन करण्यापूर्वी खात्री करणे आवश्यक:',
                    hinglish: 'Save karne se pehle confirmation zaroori hai:',
                  })}
                </div>
                <div className="text-white font-semibold mt-0.5">
                  {lang === 'en' || lang === 'hinglish'
                    ? pendingAdminAction.summaryEn
                    : pendingAdminAction.summaryHi}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => applyConfirmedAdminAction(pendingAdminAction)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {pickLang(lang, {
                    en: 'Confirm & Save',
                    hi: '✅ कन्फ़र्म करें',
                    mr: '✅ कन्फर्म करा',
                    hinglish: 'Confirm & Save',
                  })}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPendingAdminAction(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>
                  {pickLang(lang, { en: 'Cancel', hi: 'रद्द करें', mr: 'रद्द करा', hinglish: 'Cancel' })}
                </span>
              </button>
            </div>
          </div>
        )}

        {adminVoiceToast && (
          <div className="text-xs font-bold text-emerald-300">{adminVoiceToast}</div>
        )}
      </div>

      {/* 4 Financial & Load Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-500 mb-1">{t('total_mandi_load')}</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono-nums">
            {grandTotalProcureKg} <span className="text-sm font-medium">kg</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">
            {pickLang(lang, {
              en: `${procurementTable.length} produce varieties`,
              hi: `${procurementTable.length} उपज प्रकार`,
              mr: `${procurementTable.length} शेतमाल प्रकार`,
              hinglish: `${procurementTable.length} produce varieties`,
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-500 mb-1">
            {pickLang(lang, {
              en: 'Total Wholesale Mandi Cost',
              hi: 'कुल मंडी थोक लागत',
              mr: 'एकूण मंडी घाऊक खर्च',
              hinglish: 'Total Wholesale Mandi Cost',
            })}
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono-nums">
            ₹{grandTotalWholesaleCost}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {pickLang(lang, {
              en: 'Payable at APMC 5 AM',
              hi: 'APMC सुबह 5 AM भुगतान',
              mr: 'APMC सकाळी ५ वा. देय',
              hinglish: 'Payable at APMC 5 AM',
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-500 mb-1">
            {pickLang(lang, {
              en: 'Customer Revenue (Combined)',
              hi: 'कुल ग्राहक वसूली (Combined)',
              mr: 'एकूण ग्राहक महसूल',
              hinglish: 'Customer Revenue (Combined)',
            })}
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono-nums">
            ₹{grandTotalRevenue + grandAccessoriesRevenue}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {pickLang(lang, {
              en: `${orders.length} family orders`,
              hi: `${orders.length} परिवार आर्डर`,
              mr: `${orders.length} कुटुंब ऑर्डर्स`,
              hinglish: `${orders.length} family orders`,
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-500 mb-1">
            {pickLang(lang, {
              en: 'Net Operating Margin',
              hi: 'शुद्ध संचालन मार्जिन',
              mr: 'निव्वळ नफा मार्जिन',
              hinglish: 'Net Operating Margin',
            })}
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono-nums">
            ₹{grandTotalMargin + grandAccessoriesMargin}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            {pickLang(lang, {
              en: 'Zero dead inventory risk',
              hi: 'शून्य डेड-स्टॉक जोखिम',
              mr: 'शून्य डेड-स्टॉक धोका',
              hinglish: 'Zero dead inventory risk',
            })}
          </div>
        </div>
      </div>

      {/* Admin View Switcher Tabs (100% Localized) */}
      <div className="flex gap-2 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl mb-6 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveAdminTab('produce')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeAdminTab === 'produce'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>{t('mandi_sourcing_tab')}</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('master')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeAdminTab === 'master'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>
            {pickLang(lang, {
              en: `Product Master (${produceList.length})`,
              hi: `उत्पाद मास्टर व स्टॉक (${produceList.length})`,
              mr: `उत्पादन मास्टर (${produceList.length})`,
              hinglish: `Product Master & Stock (${produceList.length})`,
            })}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('referrals')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeAdminTab === 'referrals'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Gift className="w-4 h-4 text-purple-300" />
          <span>
            {pickLang(lang, {
              en: 'Referrals & Cashback',
              hi: '🎁 रेफ़रल व कैशबैक रिवॉर्ड्स',
              mr: '🎁 रेफरल व कॅशबॅक',
              hinglish: '🎁 Referrals & Cashback',
            })}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('accessories')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeAdminTab === 'accessories'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span>
            {pickLang(lang, {
              en: `Mobile Accessories (${accessoriesList.length})`,
              hi: `मोबाइल एक्सेसरीज (${accessoriesList.length})`,
              mr: `मोबाईल ॲक्सेसरीज (${accessoriesList.length})`,
              hinglish: `Mobile Accessories (${accessoriesList.length})`,
            })}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('dispatch')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeAdminTab === 'dispatch'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Package className="w-4 h-4 text-emerald-600" />
          <span>{t('dispatch_checklist_tab')} ({orders.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveAdminTab('wholesale_aggregation');
            fetchBackendWholesaleOrder();
          }}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeAdminTab === 'wholesale_aggregation'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Package className="w-4 h-4 text-emerald-500" />
          <span>
            {pickLang(lang, {
              en: `9:00 PM Wholesale Buffer (${backendWholesaleOrder?.items?.length || 0})`,
              hi: `📦 9:00 PM थोक बफर आर्डर (${backendWholesaleOrder?.items?.length || 0})`,
              mr: `📦 ९:०० PM घाऊक बफर (${backendWholesaleOrder?.items?.length || 0})`,
              hinglish: `📦 9:00 PM Wholesale Buffer (${backendWholesaleOrder?.items?.length || 0})`,
            })}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveAdminTab('inventory');
            fetchInventory();
          }}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeAdminTab === 'inventory'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-500" />
          <span>
            {pickLang(lang, {
              en: `Inventory (${inventoryRecords.length})`,
              hi: `📊 इन्वेंटरी ट्रैकिंग (${inventoryRecords.length})`,
              mr: `📊 इन्व्हेंटरी ट्रॅकिंग (${inventoryRecords.length})`,
              hinglish: `📊 Inventory Tracking (${inventoryRecords.length})`,
            })}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('batches')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeAdminTab === 'batches'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>{t('cutoff_batch_tab')}</span>
        </button>

        <button
          onClick={() => {
            setActiveAdminTab('users');
            fetchRegisteredUsers();
          }}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeAdminTab === 'users'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-500" />
          <span>
            {pickLang(lang, {
              en: `Registered Users (${registeredUsers.length})`,
              hi: `रजिस्टर्ड यूज़र्स (${registeredUsers.length})`,
              mr: `नोंदणीकृत ग्राहक (${registeredUsers.length})`,
              hinglish: `Registered Users (${registeredUsers.length})`,
            })}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveAdminTab('activity');
            fetchActivityLogs();
          }}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeAdminTab === 'activity'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>
            {pickLang(lang, {
              en: `Activity Logger (${activityLogs.length})`,
              hi: `एक्टिविटी लॉगर (${activityLogs.length})`,
              mr: `अ‍ॅक्टिव्हिटी लॉग (${activityLogs.length})`,
              hinglish: `Activity Logger (${activityLogs.length})`,
            })}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveAdminTab('audit');
            fetchAuditLogs();
          }}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeAdminTab === 'audit'
              ? 'bg-slate-900 dark:bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span>
            {pickLang(lang, {
              en: `Admin Audit Log (${auditLogs.length})`,
              hi: `एडमिन ऑडिट लॉग (${auditLogs.length})`,
              mr: `अ‍ॅडमिन ऑडिट लॉग (${auditLogs.length})`,
              hinglish: `Admin Audit Log (${auditLogs.length})`,
            })}
          </span>
        </button>

        {featureFlags.adminBuyersAnalytics !== false && (
          <button
            onClick={() => setActiveAdminTab('buyers_analytics')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeAdminTab === 'buyers_analytics'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 hover:bg-emerald-100 dark:hover:bg-slate-700 border border-emerald-200 dark:border-emerald-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>
              {pickLang(lang, {
                en: 'Admin Buyers Analytics',
                hi: 'एडमिन बायर्स एनालिटिक्स (Top 10)',
                mr: 'अ‍ॅडमिन खरेदीदार अ‍ॅनालिटिक्स',
                hinglish: 'Admin Buyers Analytics (Top 10)',
              })}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveAdminTab('features')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeAdminTab === 'features'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 hover:bg-emerald-100 dark:hover:bg-slate-700 border border-emerald-200 dark:border-emerald-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>
            {pickLang(lang, {
              en: 'Feature Controls & UI Samples',
              hi: 'फीचर कंट्रोल व UI सैंपल',
              mr: 'फीचर नियंत्रण व UI सॅम्पल',
              hinglish: 'Feature Toggles & UI Samples',
            })}
          </span>
        </button>
      </div>

      {/* TAB 0: Perishable Goods Backend Wholesale Aggregation (9:00 PM Cutoff + 1-2kg Buffer) */}
      {activeAdminTab === 'wholesale_aggregation' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                    {pickLang(lang, {
                      en: '🟢 Backend Aggregation Engine',
                      hi: '🟢 बैकएंड एग्रीगेशन इंजन',
                      mr: '🟢 बॅकएंड अ‍ॅग्रिगेशन इंजिन',
                      hinglish: '🟢 Backend Aggregation Engine',
                    })}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Batch: {backendWholesaleOrder?.batchId || 'APMC-BATCH-TODAY'}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {pickLang(lang, {
                    en: 'Daily Perishable Wholesale Order',
                    hi: 'दैनिक नाशवान सामग्री थोक आर्डर',
                    mr: 'दैनिक नाशवंत शेतमाल घाऊक ऑर्डर',
                    hinglish: 'Daily Perishable Wholesale Order',
                  })}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pickLang(lang, {
                    en: 'Consolidated customer orders before 9:00 PM cutoff + 1-2 kg fulfillment safety buffer.',
                    hi: 'रात 9:00 PM कटऑफ से पहले दर्ज सभी आर्डर्स का सामूहिक समेकन + 1-2 kg पूर्ति गारंटी बफर',
                    mr: 'रात्री ९:०० PM कटऑफपूर्वीच्या सर्व ऑर्डर्सचे एकत्रीकरण + १-२ किलो सुरक्षा बफर.',
                    hinglish: '9:00 PM cutoff se pehle ke sabhi orders ka consolidation + 1-2 kg safety buffer.',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchBackendWholesaleOrder}
                  disabled={isLoadingWholesale}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWholesale ? 'animate-spin' : ''}`} />
                  <span>{pickLang(lang, { en: 'Refresh', hi: 'रिफ्रेश', mr: 'रिफ्रेश', hinglish: 'Refresh' })}</span>
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    [
                      `*ताज़ाMandi - APMC Wholesale Order (9:00 PM Cutoff)*`,
                      `Batch: ${backendWholesaleOrder?.batchId || 'APMC-BATCH-2100'}`,
                      `Orders: ${backendWholesaleOrder?.totalOrdersCount || 0}`,
                      `------------------------------`,
                      ...(backendWholesaleOrder?.items || []).map(
                        (i: any) =>
                          `• ${i.name?.[lang] || i.name?.en || i.name?.hi}: *${i.totalWholesaleOrderKg} kg* (${i.cratesToBuy} crates) [Demand: ${i.customerDemandKg}kg + Buffer: ${i.safetyBufferKg}kg]`
                      ),
                      `------------------------------`,
                      `*Total Weight:* ${backendWholesaleOrder?.totalConsolidatedProcurementKg || 0} kg`,
                      `*Wholesale Cost:* ₹${backendWholesaleOrder?.estimatedTotalWholesaleCost || 0}`,
                    ].join('\n')
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>
                    {pickLang(lang, {
                      en: 'Send WhatsApp Mandi Order',
                      hi: 'व्हाट्सएप मंडी आर्डर भेजें',
                      mr: 'व्हॉट्सअ‍ॅप मंडी ऑर्डर पाठवा',
                      hinglish: 'Send WhatsApp Mandi Order',
                    })}
                  </span>
                </a>
              </div>
            </div>

            {bulkStatusSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{bulkStatusSuccess}</span>
              </div>
            )}

            {/* Aggregation Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-5">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 font-medium">
                  {pickLang(lang, { en: 'Customer Net Demand', hi: 'ग्राहक शुद्ध मांग', mr: 'ग्राहक निव्वळ मागणी', hinglish: 'Customer Net Demand' })}
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                  {backendWholesaleOrder?.totalCustomerDemandKg || 0} kg
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">
                  {pickLang(lang, {
                    en: `${backendWholesaleOrder?.totalOrdersCount || 0} family orders`,
                    hi: `${backendWholesaleOrder?.totalOrdersCount || 0} परिवार आर्डर्स`,
                    mr: `${backendWholesaleOrder?.totalOrdersCount || 0} कुटुंब ऑर्डर्स`,
                    hinglish: `${backendWholesaleOrder?.totalOrdersCount || 0} family orders`,
                  })}
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  {pickLang(lang, { en: '1-2 kg Safety Buffer', hi: 'सुरक्षा बफर (1-2 kg)', mr: 'सुरक्षा बफर (१-२ किलो)', hinglish: '1-2 kg Safety Buffer' })}
                </div>
                <div className="text-xl font-black text-amber-900 dark:text-amber-200 font-mono mt-0.5">
                  +{backendWholesaleOrder?.totalSafetyBufferKg || 0} kg
                </div>
                <div className="text-[10px] text-amber-700 mt-0.5">
                  {pickLang(lang, {
                    en: 'Shortage & sorting protection',
                    hi: 'शार्टेज व छंटाई पूर्ति गारंटी',
                    mr: 'तुटवडा व निवडणी संरक्षण',
                    hinglish: 'Shortage & sorting guarantee',
                  })}
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60">
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                  {pickLang(lang, { en: 'Wholesale Target (To Procure)', hi: 'थोक खरीद लक्ष्य', mr: 'घाऊक खरेदी लक्ष्य', hinglish: 'Wholesale Target (To Procure)' })}
                </div>
                <div className="text-xl font-black text-emerald-900 dark:text-emerald-100 font-mono mt-0.5">
                  {backendWholesaleOrder?.totalConsolidatedProcurementKg || 0} kg
                </div>
                <div className="text-[10px] text-emerald-700 mt-0.5 font-bold">
                  {pickLang(lang, {
                    en: `${backendWholesaleOrder?.totalWholesaleCratesCount || 0} Mandi Crates (25kg)`,
                    hi: `${backendWholesaleOrder?.totalWholesaleCratesCount || 0} मंडी क्रेट्स (25kg)`,
                    mr: `${backendWholesaleOrder?.totalWholesaleCratesCount || 0} मंडी क्रेट (२५ किलो)`,
                    hinglish: `${backendWholesaleOrder?.totalWholesaleCratesCount || 0} Mandi Crates (25kg)`,
                  })}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 font-medium">
                  {pickLang(lang, { en: 'Projected Net Margin', hi: 'अनुमानित शुद्ध मार्जिन', mr: 'अंदाजित निव्वळ मार्जिन', hinglish: 'Projected Net Margin' })}
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  +₹{backendWholesaleOrder?.projectedGrossMargin || 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {pickLang(lang, {
                    en: `Cost ₹${backendWholesaleOrder?.estimatedTotalWholesaleCost || 0} vs ₹${backendWholesaleOrder?.totalCustomerRevenue || 0}`,
                    hi: `लागत ₹${backendWholesaleOrder?.estimatedTotalWholesaleCost || 0} vs ₹${backendWholesaleOrder?.totalCustomerRevenue || 0}`,
                    mr: `खर्च ₹${backendWholesaleOrder?.estimatedTotalWholesaleCost || 0} विरुद्ध ₹${backendWholesaleOrder?.totalCustomerRevenue || 0}`,
                    hinglish: `Cost ₹${backendWholesaleOrder?.estimatedTotalWholesaleCost || 0} vs ₹${backendWholesaleOrder?.totalCustomerRevenue || 0}`,
                  })}
                </div>
              </div>
            </div>

            {/* Wholesale Item List */}
            {(!backendWholesaleOrder?.items || backendWholesaleOrder.items.length === 0) ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto text-2xl mb-2">
                  🥬
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {pickLang(lang, {
                    en: 'No active orders in today’s cutoff batch yet',
                    hi: 'आज के कटऑफ बैच में कोई सक्रिय आर्डर नहीं है',
                    mr: 'आजच्या कटऑफ बॅचमध्ये अद्याप कोणतीही ऑर्डर नाही',
                    hinglish: 'Aaj ke cutoff batch mein abhi koi active order nahi hai',
                  })}
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  {pickLang(lang, {
                    en: 'Once customers book vegetables and fruits, this engine automatically aggregates wholesale crates plus 1-2 kg buffer per item.',
                    hi: 'जैसे ही ग्राहक सब्ज़ियां व फल आर्डर करेंगे, बैकएंड इंजन 9:00 PM कटऑफ नियम के अनुसार यहाँ स्वचालित थोक आर्डर व 1-2 kg बफर तैयार कर देगा।',
                    mr: 'ग्राहकांनी ऑर्डर देताच ९:०० PM कटऑफनुसार येथे घाऊक क्रेट व १-२ किलो बफर तयार होईल.',
                    hinglish: 'Jaise hi customers sabzi aur fruits order karenge, yeh engine automatically 9:00 PM cutoff ke hisaab se wholesale crates + 1-2 kg buffer ready karega.',
                  })}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">{pickLang(lang, { en: 'Perishable Item', hi: 'नाशवान उपज', mr: 'नाशवंत शेतमाल', hinglish: 'Perishable Item' })}</th>
                      <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Customer Demand', hi: 'ग्राहक मांग', mr: 'ग्राहक मागणी', hinglish: 'Customer Demand' })}</th>
                      <th className="py-3 px-4 font-semibold text-right text-amber-700 dark:text-amber-400">{pickLang(lang, { en: 'Buffer (1-2kg)', hi: 'सुरक्षा बफर', mr: 'सुरक्षा बफर', hinglish: 'Buffer (1-2kg)' })}</th>
                      <th className="py-3 px-4 font-semibold text-right bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold">
                        {pickLang(lang, { en: 'Wholesale Target', hi: 'मंडी थोक आर्डर', mr: 'मंडी घाऊक ऑर्डर', hinglish: 'Wholesale Target' })}
                      </th>
                      <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Crates (25kg)', hi: 'क्रेट संख्या (25kg)', mr: 'क्रेट (२५ किलो)', hinglish: 'Crates (25kg)' })}</th>
                      <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Wholesale Cost', hi: 'थोक लागत', mr: 'घाऊक खर्च', hinglish: 'Wholesale Cost' })}</th>
                      <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Revenue', hi: 'ग्राहक वसूली', mr: 'महसूल', hinglish: 'Revenue' })}</th>
                      <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Margin', hi: 'मार्जिन', mr: 'नफा', hinglish: 'Margin' })}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {backendWholesaleOrder.items.map((row: any) => (
                      <tr key={row.produceId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {row.name?.[lang] || row.name?.en || row.name?.hi}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                          {row.customerDemandKg} kg
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-700 dark:text-amber-400 font-bold">
                          +{row.safetyBufferKg} kg
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 text-sm">
                          {row.totalWholesaleOrderKg} kg
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300 font-semibold">
                          {row.cratesToBuy} {pickLang(lang, { en: 'crates', hi: 'क्रेट', mr: 'क्रेट', hinglish: 'crates' })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                          ₹{row.estimatedWholesaleCost}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-slate-100 font-bold">
                          ₹{row.customerRevenue}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                          +₹{row.expectedMargin}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bulk Procured Status Button */}
            {backendWholesaleOrder?.items?.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {pickLang(lang, {
                    en: 'Once APMC morning purchase is finished, mark all active orders as Procured at Mandi:',
                    hi: 'मंडी में खरीदारी संपन्न होने पर सभी ग्राहकों के आर्डर स्टेटस को "मंडी से उठाया गया" करें:',
                    mr: 'मंडी खरेदी पूर्ण झाल्यावर सर्व ऑर्डर्सना "मंडी खरेदी पूर्ण" चिन्हांकित करा:',
                    hinglish: 'Mandi khareedari poori hone par sabhi active orders ko Procured at Mandi mark karein:',
                  })}
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/procurement/bulk-status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
                        body: JSON.stringify({ status: 'procured_at_mandi' }),
                      });
                      if (res.ok) {
                        setBulkStatusSuccess(
                          pickLang(lang, {
                            en: '✓ All active orders marked as "Procured at APMC Vashi"!',
                            hi: '✓ सभी आर्डर्स का स्टेटस "APMC वाशी से माल उठा लिया" में अपडेट हो गया!',
                            mr: '✓ सर्व ऑर्डर्स "APMC वाशी मधून खरेदी झाली" अपडेट झाले!',
                            hinglish: '✓ Sabhi orders ka status "Procured at APMC Vashi" update ho gaya!',
                          })
                        );
                        setTimeout(() => setBulkStatusSuccess(''), 4000);
                      }
                    } catch {}
                  }}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  {pickLang(lang, {
                    en: '✓ Mark Batch as Procured at Mandi',
                    hi: '✓ बैच को "मंडी से उठाया गया" मार्क करें',
                    mr: '✓ बॅच "मंडी खरेदी पूर्ण" मार्क करा',
                    hinglish: '✓ Batch ko Procured at Mandi mark karein',
                  })}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Inventory Tracking Feature (Reflecting Quantities Procured and Delivered) */}
      {activeAdminTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Backend Inventory Tracking System</span>
                  <span>·</span>
                  <span>Procured vs Delivered</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 font-display">
                  {pickLang(lang, {
                    en: 'Daily Inventory & Stock Ledger (Procured vs Delivered)',
                    hi: 'दैनिक इन्वेंटरी व स्टॉक ट्रैकिंग (Procured vs Delivered Ledger)',
                    mr: 'दैनिक इन्व्हेंटरी व स्टॉक ट्रॅकिंग (Procured vs Delivered)',
                    hinglish: 'Daily Inventory & Stock Tracking (Procured vs Delivered)',
                  })}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {pickLang(lang, {
                    en: 'Real-time comparison of APMC Vashi bulk quantities procured vs actual weights delivered to resident flats.',
                    hi: 'ग्राहक आर्डर्स की कुल मांग के आधार पर APMC मंडी से खरीदे गए माल व फ्लैट्स पर डिलीवर किए गए वास्तविक वजन का रीयल-टाइम ब्योरा।',
                    mr: 'APMC मधून खरेदी केलेला माल आणि फ्लॅट्सवर वितरित केलेले प्रत्यक्ष वजन यांचा थेट तपशील.',
                    hinglish: 'Customer orders ke hisaab se APMC mandi se khareede gaye maal aur flat delivery weight ka live record.',
                  })}
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const itemsToProcure = inventoryRecords.map((r) => ({
                        produceId: r.produceId,
                        procuredKg: r.recommendedWholesaleKg,
                      }));
                      const res = await fetch('/api/inventory/batch-procure', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
                        body: JSON.stringify({ items: itemsToProcure }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setInventoryRecords(data.inventory);
                        setInventoryActionMessage(
                          pickLang(lang, {
                            en: '✓ Recommended wholesale quantities recorded for the full batch!',
                            hi: '✓ पूरी बैच के लिए अनुशंसित थोक खरीद मात्रा दर्ज कर दी गई!',
                            mr: '✓ संपूर्ण बॅचसाठी घाऊक खरेदी नोंदवली!',
                            hinglish: '✓ Poore batch ki recommended wholesale procurement darj ho gayi!',
                          })
                        );
                        setTimeout(() => setInventoryActionMessage(''), 4000);
                      }
                    } catch (e) {
                      console.error('Batch procure error:', e);
                    }
                  }}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {pickLang(lang, {
                      en: 'Record Full Batch Procurement',
                      hi: 'एक-क्लिक में मंडी खरीद दर्ज करें',
                      mr: 'एका क्लिकमध्ये मंडी खरेदी नोंदवा',
                      hinglish: 'One-Click Batch Procurement Record Karein',
                    })}
                  </span>
                </button>

                <button
                  onClick={() => fetchInventory()}
                  className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  title={pickLang(lang, { en: 'Refresh inventory', hi: 'इन्वेंटरी रीफ्रेश करें', mr: 'इन्व्हेंटरी रिफ्रेश करा', hinglish: 'Refresh inventory' })}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingInventory ? 'animate-spin' : ''}`} />
                </button>

                {/* CSV Download */}
                <button
                  onClick={() => {
                    const headers = ['Produce ID', 'Item Name (EN)', 'Item Name (HI)', 'Category', 'Demanded (Kg)', 'Safety Buffer (Kg)', 'Wholesale Goal (Kg)', 'Procured (Kg)', 'Delivered (Kg)', 'In-Stock (Kg)', 'Fulfillment %', 'Status'];
                    const rows = inventoryRecords.map((r) => [
                      r.produceId,
                      `"${r.name.en}"`,
                      `"${r.name.hi || ''}"`,
                      r.category,
                      r.demandedKg,
                      r.safetyBufferKg,
                      r.recommendedWholesaleKg,
                      r.procuredKg,
                      r.deliveredKg,
                      r.inStockKg,
                      `${r.fulfillmentRatePercent}%`,
                      r.status,
                    ]);
                    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `tazamandi_inventory_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{pickLang(lang, { en: 'CSV Ledger', hi: 'CSV लेजर', mr: 'CSV लेजर', hinglish: 'CSV Ledger' })}</span>
                </button>
              </div>
            </div>

            {/* Notification message */}
            {inventoryActionMessage && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold animate-in fade-in">
                {inventoryActionMessage}
              </div>
            )}

            {/* 4 Inventory Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 font-medium">
                  {pickLang(lang, { en: 'Total Demanded', hi: 'कुल ग्राहक मांग (Demanded)', mr: 'एकूण ग्राहक मागणी', hinglish: 'Total Demanded' })}
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono-nums mt-0.5">
                  {Math.round(inventoryRecords.reduce((s, r) => s + (r.demandedKg || 0), 0) * 10) / 10} <span className="text-xs font-semibold">kg</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {pickLang(lang, { en: 'Society resident orders', hi: 'सोसायटी परिवारों के आर्डर', mr: 'सोसायटी कुटुंबांच्या ऑर्डर्स', hinglish: 'Society family orders' })}
                </div>
              </div>

              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/40">
                <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium">
                  {pickLang(lang, { en: 'Mandi Procured', hi: 'मंडी थोक खरीद (Procured)', mr: 'मंडी घाऊक खरेदी', hinglish: 'Mandi Procured' })}
                </div>
                <div className="text-2xl font-black text-indigo-900 dark:text-indigo-200 font-mono-nums mt-0.5">
                  {Math.round(inventoryRecords.reduce((s, r) => s + (r.procuredKg || 0), 0) * 10) / 10} <span className="text-xs font-semibold">kg</span>
                </div>
                <div className="text-[10px] text-indigo-600 mt-1">
                  {pickLang(lang, { en: 'APMC lot with 1-2 kg buffer', hi: '1-2 kg बफर सहित वाशी लॉट', mr: '१-२ किलो बफरसह वाशी लॉट', hinglish: 'Vashi lot with 1-2 kg buffer' })}
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  {pickLang(lang, { en: 'Delivered to Flats', hi: 'ग्राहकों को डिलीवर (Delivered)', mr: 'ग्राहकांना वितरित (Delivered)', hinglish: 'Delivered to Flats' })}
                </div>
                <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono-nums mt-0.5">
                  {Math.round(inventoryRecords.reduce((s, r) => s + (r.deliveredKg || 0), 0) * 10) / 10} <span className="text-xs font-semibold">kg</span>
                </div>
                <div className="text-[10px] text-emerald-600 mt-1">
                  {pickLang(lang, { en: 'Delivered cleanly to doorsteps', hi: 'सफलतापूर्वक फ्लैट तक पहुंचाया', mr: 'फ्लॅटपर्यंत यशस्वी वितरण', hinglish: 'Delivered to doorsteps' })}
                </div>
              </div>

              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40">
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  {pickLang(lang, { en: 'Remaining Buffer (In-Stock)', hi: 'शेष स्टॉक / बफर (In-Stock)', mr: 'उर्वरित स्टॉक / बफर', hinglish: 'Remaining Buffer (In-Stock)' })}
                </div>
                <div className="text-2xl font-black text-amber-900 dark:text-amber-200 font-mono-nums mt-0.5">
                  {Math.round(inventoryRecords.reduce((s, r) => s + (r.inStockKg || 0), 0) * 10) / 10} <span className="text-xs font-semibold">kg</span>
                </div>
                <div className="text-[10px] text-amber-600 mt-1">
                  {pickLang(lang, { en: 'Sorting & weight variance buffer', hi: 'सॉर्टिंग व वजन अंतर सुरक्षित', mr: 'निवडणी व वजन फरक सुरक्षित', hinglish: 'Sorting & weight buffer' })}
                </div>
              </div>
            </div>

            {/* Table */}
            {isLoadingInventory && inventoryRecords.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {pickLang(lang, { en: 'Loading inventory data...', hi: 'इन्वेंटरी डेटा लोड हो रहा है...', mr: 'इन्व्हेंटरी डेटा लोड होत आहे...', hinglish: 'Inventory data load ho raha hai...' })}
              </div>
            ) : inventoryRecords.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                {pickLang(lang, {
                  en: 'No active inventory records yet. Inventory updates automatically as customer orders arrive.',
                  hi: 'अभी कोई सक्रिय इन्वेंटरी रिकॉर्ड नहीं है। ग्राहक आर्डर आने पर यहाँ इन्वेंटरी ब्योरा स्वतः अपडेट होगा।',
                  mr: 'अद्याप कोणताही सक्रिय इन्व्हेंटरी रेकॉर्ड नाही. ऑर्डर येताच येथे आपोआप अपडेट होईल.',
                  hinglish: 'Abhi koi active inventory record nahi hai. Customer order aate hi yahan auto-update hoga.',
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5 font-bold">{pickLang(lang, { en: 'Produce Item', hi: 'आइटम नाम (Produce)', mr: 'शेतमाल नाव', hinglish: 'Produce Item' })}</th>
                      <th className="py-3 px-3 font-semibold text-right">{pickLang(lang, { en: 'Demand', hi: 'ग्राहक मांग', mr: 'मागणी', hinglish: 'Demand' })}</th>
                      <th className="py-3 px-3 font-semibold text-right">{pickLang(lang, { en: 'Buffer', hi: 'सुरक्षा बफर', mr: 'बफर', hinglish: 'Buffer' })}</th>
                      <th className="py-3 px-3 font-bold text-right text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30">
                        {pickLang(lang, { en: 'Procured', hi: 'खरीदी गई मात्रा', mr: 'खरेदी प्रमाण', hinglish: 'Procured' })}
                      </th>
                      <th className="py-3 px-3 font-bold text-right text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30">
                        {pickLang(lang, { en: 'Delivered', hi: 'डिलीवर मात्रा', mr: 'वितरित प्रमाण', hinglish: 'Delivered' })}
                      </th>
                      <th className="py-3 px-3 font-semibold text-right">{pickLang(lang, { en: 'Balance', hi: 'शेष / बफर अंतर', mr: 'शिल्लक', hinglish: 'Balance' })}</th>
                      <th className="py-3 px-3 font-semibold text-center">{pickLang(lang, { en: 'Fulfillment', hi: 'पूर्ति दर', mr: 'पूर्तता दर', hinglish: 'Fulfillment' })}</th>
                      <th className="py-3 px-3 font-semibold text-center">{pickLang(lang, { en: 'Status', hi: 'स्थिति', mr: 'स्थिती', hinglish: 'Status' })}</th>
                      <th className="py-3 px-3 font-semibold text-center">{pickLang(lang, { en: 'Quick Action', hi: 'क्विक एक्शन', mr: 'जलद कृती', hinglish: 'Quick Action' })}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {inventoryRecords.map((item) => (
                      <tr key={item.produceId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {item.name?.[lang] || item.name?.en || item.name?.hi}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {item.name.en} · <span className="uppercase text-[10px]">{item.category}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono-nums font-bold text-slate-800 dark:text-slate-200">
                          {item.demandedKg} kg
                        </td>

                        <td className="py-3 px-3 text-right font-mono-nums text-slate-500">
                          +{item.safetyBufferKg} kg
                        </td>

                        {/* Procured Kg with +/- buttons */}
                        <td className="py-3 px-3 text-right bg-indigo-50/30 dark:bg-indigo-950/20">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={async () => {
                                const newQty = Math.max(0, Math.round((item.procuredKg - 1) * 10) / 10);
                                try {
                                  await fetch('/api/inventory/procured', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
                                    body: JSON.stringify({ produceId: item.produceId, procuredKg: newQty }),
                                  });
                                  fetchInventory();
                                } catch {}
                              }}
                              className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs hover:bg-slate-300"
                            >
                              -
                            </button>
                            <span className="font-mono-nums font-black text-indigo-700 dark:text-indigo-400 text-sm min-w-[45px] text-center">
                              {item.procuredKg} kg
                            </span>
                            <button
                              onClick={async () => {
                                const newQty = Math.round((item.procuredKg + 1) * 10) / 10;
                                try {
                                  await fetch('/api/inventory/procured', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
                                    body: JSON.stringify({ produceId: item.produceId, procuredKg: newQty, status: 'procured_at_mandi' }),
                                  });
                                  fetchInventory();
                                } catch {}
                              }}
                              className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs hover:bg-slate-300"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {pickLang(lang, { en: `Target: ${item.recommendedWholesaleKg}k`, hi: `लक्ष्य: ${item.recommendedWholesaleKg}k`, mr: `लक्ष्य: ${item.recommendedWholesaleKg}k`, hinglish: `Target: ${item.recommendedWholesaleKg}k` })}
                          </div>
                        </td>

                        {/* Delivered Kg with +/- buttons */}
                        <td className="py-3 px-3 text-right bg-emerald-50/30 dark:bg-emerald-950/20">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={async () => {
                                const newQty = Math.max(0, Math.round((item.deliveredKg - 1) * 10) / 10);
                                try {
                                  await fetch('/api/inventory/delivered', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
                                    body: JSON.stringify({ produceId: item.produceId, deliveredKg: newQty }),
                                  });
                                  fetchInventory();
                                } catch {}
                              }}
                              className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs hover:bg-slate-300"
                            >
                              -
                            </button>
                            <span className="font-mono-nums font-black text-emerald-700 dark:text-emerald-400 text-sm min-w-[45px] text-center">
                              {item.deliveredKg} kg
                            </span>
                            <button
                              onClick={async () => {
                                const newQty = Math.round((item.deliveredKg + 1) * 10) / 10;
                                try {
                                  await fetch('/api/inventory/delivered', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
                                    body: JSON.stringify({ produceId: item.produceId, deliveredKg: newQty }),
                                  });
                                  fetchInventory();
                                } catch {}
                              }}
                              className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs hover:bg-slate-300"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono-nums text-slate-700 dark:text-slate-300 font-bold">
                          {item.inStockKg} kg
                        </td>

                        {/* Fulfillment % */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  item.fulfillmentRatePercent >= 100
                                    ? 'bg-emerald-600'
                                    : item.fulfillmentRatePercent > 0
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                }`}
                                style={{ width: `${item.fulfillmentRatePercent}%` }}
                              />
                            </div>
                            <span className="font-mono-nums font-bold text-[11px] text-slate-700 dark:text-slate-300">
                              {item.fulfillmentRatePercent}%
                            </span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3 text-center">
                          {item.status === 'delivered' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              {pickLang(lang, { en: '✓ 100% Delivered', hi: '✓ 100% डिलीवर', mr: '✓ १००% वितरित', hinglish: '✓ 100% Delivered' })}
                            </span>
                          ) : item.status === 'partially_delivered' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                              {pickLang(lang, { en: 'Partial Delivery', hi: 'आंशिक डिलीवर', mr: 'अंशतः वितरित', hinglish: 'Partial Delivery' })}
                            </span>
                          ) : item.status === 'procured_at_mandi' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                              {pickLang(lang, { en: 'Procured at Mandi', hi: 'मंडी से उठाया गया', mr: 'मंडी खरेदी पूर्ण', hinglish: 'Procured at Mandi' })}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                              {pickLang(lang, { en: 'Pending Purchase', hi: 'खरीद शेष', mr: 'खरेदी बाकी', hinglish: 'Pending Purchase' })}
                            </span>
                          )}
                        </td>

                        {/* Quick Action */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={async () => {
                              try {
                                await fetch('/api/inventory/delivered', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
                                  body: JSON.stringify({ produceId: item.produceId, deliveredKg: item.demandedKg }),
                                });
                                fetchInventory();
                              } catch {}
                            }}
                            className="px-2 py-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 rounded transition-colors"
                          >
                            {pickLang(lang, { en: 'Mark Delivered', hi: 'पूर्ण डिलीवर', mr: 'पूर्ण वितरण', hinglish: 'Mark Delivered' })}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeAdminTab === 'produce' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {pickLang(lang, {
                  en: 'Mandi Wholesale Purchase Slip (Exact Demand + 1-2 kg Buffer)',
                  hi: 'मंडी थोक खरीदारी पर्ची (Exact Demand + 1-2 kg Buffer)',
                  mr: 'मंडी घाऊक खरेदी पावती (मागणी + १-२ किलो बफर)',
                  hinglish: 'Mandi Wholesale Purchase Slip (Exact Demand + 1-2 kg Buffer)',
                })}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {brand.mandiCity} · Morning 4:00 AM Procurement Lot
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {new Date().toLocaleDateString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">{pickLang(lang, { en: 'Produce', hi: 'उपज नाम (Produce)', mr: 'शेतमाल', hinglish: 'Produce' })}</th>
                  <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Total Demand', hi: 'कस्टमर कुल मांग', mr: 'एकूण मागणी', hinglish: 'Total Demand' })}</th>
                  <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Buffer', hi: 'सुरक्षा बफर', mr: 'बफर', hinglish: 'Buffer' })}</th>
                  <th className="py-3 px-4 font-semibold text-right bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold">
                    {pickLang(lang, { en: 'To Procure', hi: 'मंडी से कुल खरीद (To Procure)', mr: 'मंडी एकूण खरेदी', hinglish: 'To Procure' })}
                  </th>
                  <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Wholesale Rate', hi: 'थोक भाव', mr: 'घाऊक दर', hinglish: 'Wholesale Rate' })}</th>
                  <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Wholesale Cost', hi: 'थोक लागत', mr: 'घाऊक खर्च', hinglish: 'Wholesale Cost' })}</th>
                  <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Revenue', hi: 'ग्राहक वसूली', mr: 'महसूल', hinglish: 'Revenue' })}</th>
                  <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Margin', hi: 'मार्जिन', mr: 'नफा', hinglish: 'Margin' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {procurementTable.map((row) => (
                  <tr key={row.item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                      <SafeProductImg product={row.item} alt={row.item.name.en} className="w-8 h-8 rounded object-cover" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {row.item.name[lang] || row.item.name.en || row.item.name.hi}
                        </div>
                        <div className="text-[11px] text-slate-400">{row.item.origin}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                      {row.demandKg} kg
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      +{row.bufferKg} kg
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 text-sm">
                      {row.totalProcureKg} kg
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      ₹{row.wholesaleRate}/kg
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium">
                      ₹{row.wholesaleCost}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-slate-100 font-bold">
                      ₹{row.customerRevenue}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                      +₹{row.grossMargin}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/90 font-bold border-t-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                <tr>
                  <td className="py-3 px-4">{pickLang(lang, { en: 'Grand Total', hi: 'कुल योग (Grand Total)', mr: 'एकूण बेरीज', hinglish: 'Grand Total' })}</td>
                  <td className="py-3 px-4 text-right font-mono">
                    {procurementTable.reduce((s, r) => s + r.demandKg, 0)} kg
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">
                    +{procurementTable.reduce((s, r) => s + r.bufferKg, 0)} kg
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40 text-base">
                    {grandTotalProcureKg} kg
                  </td>
                  <td className="py-3 px-4 text-right">—</td>
                  <td className="py-3 px-4 text-right font-mono">₹{grandTotalWholesaleCost}</td>
                  <td className="py-3 px-4 text-right font-mono">₹{grandTotalRevenue}</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700 dark:text-emerald-400">
                    +₹{grandTotalMargin}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Mobile Accessories Full Admin Catalog + Price Control + Add New + Picking Sheet */}
      {activeAdminTab === 'accessories' && (
        <div className="space-y-6">
          {/* Mobile Accessories Master Catalog & Direct Price Editor */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-emerald-600" />
                    <span>
                      {pickLang(lang, {
                        en: `Mobile Accessories Master & Price Control (${accessoriesList.length})`,
                        hi: `मोबाइल एक्सेसरीज मास्टर व रेट कंट्रोल (${accessoriesList.length} प्रोडक्ट)`,
                        mr: `मोबाईल ॲक्सेसरीज मास्टर व दर नियंत्रण (${accessoriesList.length})`,
                        hinglish: `Mobile Accessories Master & Rate Control (${accessoriesList.length})`,
                      })}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {pickLang(lang, {
                      en: 'Add new accessories, change customer price, MRP, wholesale cost, photo, and live stock status anytime.',
                      hi: 'यहाँ से किसी भी मोबाइल एक्सेसरी का रेट (Price / MRP / थोक भाव) सीधे बदलें, स्टॉक ऑन/ऑफ करें और नया प्रोडक्ट जोड़ें।',
                      mr: 'येथून कोणत्याही मोबाईल ॲक्सेसरीचा दर (Price / MRP), स्टॉक आणि फोटो थेट बदला किंवा नवीन उत्पादन जोडा.',
                      hinglish: 'Yahan se kisi bhi accessory ka Price, MRP, wholesale rate, photo aur stock directly update karein.',
                    })}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddAccessoryModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 text-amber-300" />
                  <span>
                    {pickLang(lang, {
                      en: 'Add New Accessory',
                      hi: '+ नई मोबाइल एक्सेसरी जोड़ें',
                      mr: '+ नवीन मोबाईल ॲक्सेसरी जोडा',
                      hinglish: '+ New Accessory Add Karein',
                    })}
                  </span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={accCategoryFilter}
                  onChange={(e) => setAccCategoryFilter(e.target.value)}
                  className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="all">{pickLang(lang, { en: 'All Categories', hi: 'सभी श्रेणियाँ', mr: 'सर्व श्रेणी', hinglish: 'All Categories' })}</option>
                  <option value="chargers">Chargers & Cables</option>
                  <option value="audio">Audio & Earbuds</option>
                  <option value="powerbanks">Power Banks</option>
                  <option value="cases">Cases & Covers</option>
                  <option value="mounts">Stands & Mounts</option>
                  <option value="protection">Tempered Glass & Protection</option>
                </select>
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={accSearch}
                    onChange={(e) => setAccSearch(e.target.value)}
                    placeholder={pickLang(lang, {
                      en: 'Search accessory name / brand...',
                      hi: 'एक्सेसरी नाम या ब्रांड खोजें...',
                      mr: 'ॲक्सेसरी नाव किंवा ब्रँड शोधा...',
                      hinglish: 'Accessory name ya brand search karein...',
                    })}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">{pickLang(lang, { en: 'Accessory & Photo', hi: 'प्रोडक्ट व फ़ोटो', mr: 'उत्पादन व फोटो', hinglish: 'Accessory & Photo' })}</th>
                    <th className="py-3 px-4 font-semibold">{pickLang(lang, { en: 'Category', hi: 'श्रेणी', mr: 'श्रेणी', hinglish: 'Category' })}</th>
                    <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Selling Price (₹)', hi: 'बिक्री मूल्य (₹)', mr: 'विक्री किंमत (₹)', hinglish: 'Selling Price (₹)' })}</th>
                    <th className="py-3 px-4 font-semibold text-right">MRP (₹)</th>
                    <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Wholesale (₹)', hi: 'थोक भाव (₹)', mr: 'घाऊक दर (₹)', hinglish: 'Wholesale (₹)' })}</th>
                    <th className="py-3 px-4 font-semibold text-center">{pickLang(lang, { en: 'Stock Status', hi: 'स्टॉक', mr: 'स्टॉक', hinglish: 'Stock Status' })}</th>
                    <th className="py-3 px-4 font-semibold text-center">{pickLang(lang, { en: 'Actions', hi: 'कार्रवाई', mr: 'कृती', hinglish: 'Actions' })}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {accessoriesList
                    .filter((a) => accCategoryFilter === 'all' || a.category === accCategoryFilter)
                    .filter((a) => {
                      const q = accSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        a.name.en.toLowerCase().includes(q) ||
                        a.name.hi.toLowerCase().includes(q) ||
                        a.brand.toLowerCase().includes(q)
                      );
                    })
                    .map((acc) => (
                      <tr key={acc.id} className={!acc.inStock ? 'opacity-70 bg-rose-50/20 dark:bg-rose-950/10' : ''}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative group shrink-0">
                              <SafeProductImg
                                product={localAccessoryImages[acc.id] ? { ...acc, image: localAccessoryImages[acc.id] } : acc}
                                alt={acc.name.en}
                                isAccessory
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setPhotoModalProduct({
                                    id: acc.id,
                                    name: acc.name[lang] || acc.name.en,
                                    image: localAccessoryImages[acc.id] || resolveProductVisualAsset(acc),
                                    type: 'accessory',
                                    category: acc.category,
                                  });
                                  setIsPhotoModalOpen(true);
                                }}
                                className="absolute inset-0 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                title={pickLang(lang, { en: 'Change photo', hi: 'फोटो बदलें', mr: 'फोटो बदला', hinglish: 'Change photo' })}
                              >
                                <Camera className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[190px]">
                                {acc.name[lang] || acc.name.en || acc.name.hi}
                              </div>
                              <div className="text-[10.5px] text-slate-400">
                                {acc.brand} · {acc.warranty}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 capitalize">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                            {acc.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            min={1}
                            value={acc.price}
                            onChange={(e) =>
                              updateAccessoryItem(acc.id, { price: parseFloat(e.target.value) || 0 })
                            }
                            className="w-20 px-2 py-1 text-right font-mono font-bold bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded text-slate-900 dark:text-slate-100"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            min={1}
                            value={acc.mrp}
                            onChange={(e) =>
                              updateAccessoryItem(acc.id, { mrp: parseFloat(e.target.value) || 0 })
                            }
                            className="w-20 px-2 py-1 text-right font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            min={1}
                            value={acc.wholesaleCost}
                            onChange={(e) =>
                              updateAccessoryItem(acc.id, { wholesaleCost: parseFloat(e.target.value) || 0 })
                            }
                            className="w-20 px-2 py-1 text-right font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                          />
                          <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                            +₹{acc.price - acc.wholesaleCost}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => updateAccessoryItem(acc.id, { inStock: !acc.inStock })}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                              acc.inStock
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {acc.inStock
                              ? pickLang(lang, { en: 'In Stock', hi: '🟢 उपलब्ध', mr: '🟢 उपलब्ध', hinglish: 'In Stock' })
                              : pickLang(lang, { en: 'Out of Stock', hi: '🔴 खत्म', mr: '🔴 संपले', hinglish: 'Out of Stock' })}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingAccessory(acc)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 cursor-pointer"
                              title={pickLang(lang, { en: 'Edit Full Details', hi: 'विवरण संपादित करें', mr: 'तपशील संपादित करा', hinglish: 'Edit Details' })}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {confirmDeleteAccId === acc.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteAccessoryItem(acc.id);
                                    setConfirmDeleteAccId(null);
                                  }}
                                  className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  {pickLang(lang, { en: 'Delete', hi: 'हटाएं', mr: 'हटवा', hinglish: 'Delete' })}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteAccId(null)}
                                  className="p-1 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteAccId(acc.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded cursor-pointer"
                                title={pickLang(lang, { en: 'Delete Accessory', hi: 'एक्सेसरी हटाएं', mr: 'ॲक्सेसरी हटवा', hinglish: 'Delete Accessory' })}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Warehouse Picking Sheet for Ordered Accessories */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  {pickLang(lang, {
                    en: 'Mobile Accessories Ordered Picking Sheet',
                    hi: 'मोबाइल एक्सेसरीज आज की पिकिंग शीट (Ordered Picking Sheet)',
                    mr: 'मोबाईल ॲक्सेसरीज आजची पिकिंग शीट',
                    hinglish: 'Mobile Accessories Ordered Picking Sheet',
                  })}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pickLang(lang, {
                    en: 'Dispatch items ready for morning packing',
                    hi: 'सुबह की पैकिंग के लिए तैयार डिस्पैच सूची',
                    mr: 'सकाळच्या पॅकिंगसाठी तयार वस्तू',
                    hinglish: 'Morning packing ke liye ready dispatch items',
                  })}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700">
                {accessorySummary.length} {pickLang(lang, { en: 'Products Ordered', hi: 'उत्पाद ऑर्डर', mr: 'उत्पादने ऑर्डर', hinglish: 'Products Ordered' })}
              </span>
            </div>

            {accessorySummary.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                {pickLang(lang, {
                  en: 'No accessories ordered yet today. Manage rates and live stock in the catalog above.',
                  hi: 'आज के ग्राहकों ने अभी कोई एक्सेसरी ऑर्डर नहीं की है (ऊपर से आप रेट व स्टॉक मैनेज कर सकते हैं)।',
                  mr: 'आज ग्राहकांनी अद्याप कोणतीही ॲक्सेसरी ऑर्डर केलेली नाही.',
                  hinglish: 'Aaj kisi customer ne accessory order nahi ki hai (upar se rate aur stock manage karein).',
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">{pickLang(lang, { en: 'Accessory Name', hi: 'एक्सेसरी नाम', mr: 'ॲक्सेसरी नाव', hinglish: 'Accessory Name' })}</th>
                      <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Total Units', hi: 'कुल पीस (Units)', mr: 'एकूण नग', hinglish: 'Total Units' })}</th>
                      <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Wholesale Rate', hi: 'थोक दर', mr: 'घाऊक दर', hinglish: 'Wholesale Rate' })}</th>
                      <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Customer Price', hi: 'ग्राहक दर', mr: 'ग्राहक दर', hinglish: 'Customer Price' })}</th>
                      <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Wholesale Cost', hi: 'थोक लागत', mr: 'घाऊक खर्च', hinglish: 'Wholesale Cost' })}</th>
                      <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Revenue', hi: 'ग्राहक वसूली', mr: 'महसूल', hinglish: 'Revenue' })}</th>
                      <th className="py-3 px-4 font-semibold text-right">{pickLang(lang, { en: 'Margin', hi: 'मार्जिन', mr: 'नफा', hinglish: 'Margin' })}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                    {accessorySummary.map((row) => (
                      <tr key={row.accessory.id}>
                        <td className="py-3 px-4 font-bold">{row.accessory.name[lang] || row.accessory.name.en}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{row.totalUnits} pcs</td>
                        <td className="py-3 px-4 text-right font-mono">₹{row.accessory.wholesaleCost}</td>
                        <td className="py-3 px-4 text-right font-mono">₹{row.accessory.price}</td>
                        <td className="py-3 px-4 text-right font-mono">₹{row.wholesaleTotal}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">₹{row.revenueTotal}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">+₹{row.margin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Flat-Wise Doorstep Packing & Delivery Checklist */}
      {activeAdminTab === 'dispatch' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <span>
                    {pickLang(lang, {
                      en: 'Flat-Wise Packing & Dispatch Console',
                      hi: 'फ्लैट-वार पैकिंग व डिलीवरी चेकलिस्ट (Dispatch Console)',
                      mr: 'फ्लॅटनुसार पॅकिंग व डिलिव्हरी कन्सोल',
                      hinglish: 'Flat-Wise Packing & Dispatch Console',
                    })}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pickLang(lang, {
                    en: 'Pack live customer orders, load delivery vans, and mark doorstep deliveries complete.',
                    hi: 'यहाँ से वास्तविक ग्राहक आर्डरों को पैक करें, वैन में लोड करें और फ्लैट पर डिलीवर मार्क करें।',
                    mr: 'येथून ग्राहकांच्या ऑर्डर्स पॅक करा, व्हॅनमध्ये लोड करा आणि डिलिव्हरी पूर्ण चिन्हांकित करा.',
                    hinglish: 'Yahan se live customer orders pack karein, van mein load karein aur delivered mark karein.',
                  })}
                </p>
              </div>

              {/* Verified Authentic Orders Badge */}
              <div className="flex items-center bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold gap-2 text-emerald-800 dark:text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>
                  {pickLang(lang, {
                    en: `Verified Customer Orders (${orders.length})`,
                    hi: `100% असली ग्राहक ऑर्डर सूची (${orders.length})`,
                    mr: `सत्यापित ग्राहक ऑर्डर्स (${orders.length})`,
                    hinglish: `Verified Customer Orders (${orders.length})`,
                  })}
                </span>
              </div>
            </div>

            {/* Sub-filters by order state */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs overflow-x-auto">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded font-semibold shrink-0 transition-colors ${
                  filterStatus === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500'
                }`}
              >
                {pickLang(lang, { en: `All (${filteredOrders.length})`, hi: `कुल (${filteredOrders.length})`, mr: `एकूण (${filteredOrders.length})`, hinglish: `All (${filteredOrders.length})` })}
              </button>
              <button
                onClick={() => setFilterStatus('ordered')}
                className={`px-2.5 py-1 rounded font-semibold shrink-0 transition-colors ${
                  filterStatus === 'ordered' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500'
                }`}
              >
                {pickLang(lang, {
                  en: `Pending Packing (${orders.filter((o) => o.status === 'ordered').length})`,
                  hi: `📦 पैकिंग बाकी (${orders.filter((o) => o.status === 'ordered').length})`,
                  mr: `📦 पॅकिंग बाकी (${orders.filter((o) => o.status === 'ordered').length})`,
                  hinglish: `Pending Packing (${orders.filter((o) => o.status === 'ordered').length})`,
                })}
              </button>
              <button
                onClick={() => setFilterStatus('packed')}
                className={`px-2.5 py-1 rounded font-semibold shrink-0 transition-colors ${
                  filterStatus === 'packed' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500'
                }`}
              >
                {pickLang(lang, {
                  en: `Packed Ready (${orders.filter((o) => o.status === 'packed').length})`,
                  hi: `🎒 पैक्ड तैयार (${orders.filter((o) => o.status === 'packed').length})`,
                  mr: `🎒 पॅक तयार (${orders.filter((o) => o.status === 'packed').length})`,
                  hinglish: `Packed Ready (${orders.filter((o) => o.status === 'packed').length})`,
                })}
              </button>
              <button
                onClick={() => setFilterStatus('out_for_delivery')}
                className={`px-2.5 py-1 rounded font-semibold shrink-0 transition-colors ${
                  filterStatus === 'out_for_delivery' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500'
                }`}
              >
                {pickLang(lang, {
                  en: `Out for Delivery (${orders.filter((o) => o.status === 'out_for_delivery').length})`,
                  hi: `🚚 वैन में रवाना (${orders.filter((o) => o.status === 'out_for_delivery').length})`,
                  mr: `🚚 वितरणासाठी रवाना (${orders.filter((o) => o.status === 'out_for_delivery').length})`,
                  hinglish: `Out for Delivery (${orders.filter((o) => o.status === 'out_for_delivery').length})`,
                })}
              </button>
              <button
                onClick={() => setFilterStatus('delivered')}
                className={`px-2.5 py-1 rounded font-semibold shrink-0 transition-colors ${
                  filterStatus === 'delivered' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500'
                }`}
              >
                {pickLang(lang, {
                  en: `Delivered (${orders.filter((o) => o.status === 'delivered').length})`,
                  hi: `✅ डिलीवर हुआ (${orders.filter((o) => o.status === 'delivered').length})`,
                  mr: `✅ वितरित (${orders.filter((o) => o.status === 'delivered').length})`,
                  hinglish: `Delivered (${orders.filter((o) => o.status === 'delivered').length})`,
                })}
              </button>
              <button
                onClick={() => setFilterStatus('cancelled')}
                className={`px-2.5 py-1 rounded font-semibold shrink-0 transition-colors ${
                  filterStatus === 'cancelled' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {pickLang(lang, {
                  en: `Cancelled (${orders.filter((o) => o.status === 'cancelled').length})`,
                  hi: `❌ कैंसिल (${orders.filter((o) => o.status === 'cancelled').length})`,
                  mr: `❌ रद्द (${orders.filter((o) => o.status === 'cancelled').length})`,
                  hinglish: `Cancelled (${orders.filter((o) => o.status === 'cancelled').length})`,
                })}
              </button>
            </div>
          </div>

          {/* Empty state when no orders are pending */}
          {filteredOrders.length === 0 && (
            <div className="p-8 text-center bg-slate-50/70 dark:bg-slate-850/60 m-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-14 h-14 mx-auto bg-emerald-100 dark:bg-emerald-950/80 rounded-full flex items-center justify-center text-emerald-600 mb-3">
                <Package className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {pickLang(lang, {
                  en: 'No active customer orders pending right now',
                  hi: 'वर्तमान में कोई सक्रिय ग्राहक आर्डर पेंडिंग नहीं है',
                  mr: 'सध्या कोणतीही सक्रिय ग्राहक ऑर्डर प्रलंबित नाही',
                  hinglish: 'Abhi koi active customer order pending nahi hai',
                })}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {pickLang(lang, {
                  en: 'As soon as a customer places a basket order, it appears live here with flat number and phone for morning dispatch.',
                  hi: 'जैसे ही कोई ग्राहक वेबसाइट या ऐप से अपनी थैली का आर्डर दर्ज करेगा, वह तुरंत यहाँ फ्लैट नंबर व मोबाइल नंबर के साथ पैकिंग और डिलीवरी के लिए लाइव आ जाएगा।',
                  mr: 'ग्राहकाने ऑर्डर नोंदवताच फ्लॅट क्रमांक आणि मोबाईल नंबरसह पॅकिंगसाठी येथे थेट दिसेल.',
                  hinglish: 'Jaise hi koi customer order book karega, flat number aur phone ke saath yahan packing ke liye live dikhega.',
                })}
              </p>
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredOrders.map((order) => {
              const isDelivered = order.status === 'delivered';
              const isPacked = order.status === 'packed' || order.status === 'out_for_delivery' || isDelivered;

              return (
                <div key={order.id} className="p-4 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center font-bold text-emerald-700">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {order.flatNumber} · {order.customerName}
                          </h4>
                          <span className="text-xs font-mono text-slate-400">#{order.id}</span>
                          {order.isSampleOrder ? (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold">
                              {pickLang(lang, { en: 'Society Batch Order', hi: '👥 सोसायटी बैच आर्डर', mr: 'सोसायटी बॅच ऑर्डर', hinglish: 'Society Batch Order' })}
                            </span>
                          ) : (
                            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              <span>{pickLang(lang, { en: 'Real Customer Order', hi: '🟢 वास्तविक ग्राहक आर्डर', mr: '🟢 खरा ग्राहक ऑर्डर', hinglish: 'Real Customer Order' })}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                          <span>{order.phone}</span>
                          <span>·</span>
                          <span className="text-emerald-700 font-medium">{order.deliverySlot}</span>
                          <span>·</span>
                          <span className="text-slate-400 font-mono">{order.targetDeliveryDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Delivery Actions */}
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      {order.status === 'ordered' && (
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(order.id, 'packed')}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Package className="w-4 h-4" />
                          <span>{pickLang(lang, { en: 'Pack Bag (Mark Packed)', hi: '📦 बैग पैक करें (Mark Packed)', mr: '📦 बॅग पॅक करा', hinglish: 'Pack Bag (Mark Packed)' })}</span>
                        </button>
                      )}

                      {order.status === 'packed' && (
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Truck className="w-4 h-4" />
                          <span>{pickLang(lang, { en: 'Out for Delivery', hi: '🚚 गाड़ी निकली (Out for Delivery)', mr: '🚚 वितरणासाठी रवाना', hinglish: 'Out for Delivery' })}</span>
                        </button>
                      )}

                      {order.status === 'out_for_delivery' && (
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <CheckSquare className="w-4 h-4" />
                          <span>{pickLang(lang, { en: 'Mark Delivered', hi: '✅ फ्लैट पर डिलीवर हुआ (Mark Delivered)', mr: '✅ फ्लॅटवर वितरित', hinglish: 'Mark Delivered' })}</span>
                        </button>
                      )}

                      {order.status === 'delivered' && (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>{pickLang(lang, { en: 'Delivered at Doorstep', hi: '✅ फ्लैट पर डिलीवर हो चुका है', mr: '✅ फ्लॅटवर वितरित झाले', hinglish: 'Delivered at Doorstep' })}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order.id, 'ordered')}
                            className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                            title="Revert status if clicked by mistake"
                          >
                            {pickLang(lang, { en: 'Reset', hi: 'रीसेट', mr: 'रीसेट', hinglish: 'Reset' })}
                          </button>
                        </div>
                      )}

                      {order.status === 'cancelled' && (
                        <span className="px-3 py-1.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded-lg text-xs font-bold">
                          ❌ {pickLang(lang, { en: `Cancelled (${order.cancelReason || 'Cancelled'})`, hi: `ऑर्डर रद्द (${order.cancelReason || 'Cancelled'})`, mr: `ऑर्डर रद्द (${order.cancelReason || 'Cancelled'})`, hinglish: `Cancelled (${order.cancelReason || 'Cancelled'})` })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Packaged items box */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-3 text-xs space-y-3">
                    {order.produceItems.length > 0 && (
                      <div>
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <span>{pickLang(lang, { en: '🥦 Weighed Produce:', hi: '🥦 ताज़ी सब्ज़ियां व फल (Weighed Produce):', mr: '🥦 ताज्या भाज्या व फळे:', hinglish: '🥦 Weighed Produce:' })}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {order.produceItems.map((it, idx) => (
                            <div key={idx} className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-between">
                              <span className="font-medium truncate">{it.name[lang] || it.name.en || it.name.hi}</span>
                              <span className="font-bold text-emerald-700 font-mono shrink-0 ml-2">{it.quantityKg} kg</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {order.accessoryItems.length > 0 && (
                      <div>
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <span>{pickLang(lang, { en: '⚡ Tech Accessories:', hi: '⚡ मोबाइल एक्सेसरीज (Tech Accessories):', mr: '⚡ मोबाईल ॲक्सेसरीज:', hinglish: '⚡ Tech Accessories:' })}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {order.accessoryItems.map((acc, idx) => (
                            <div key={idx} className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-between">
                              <span className="font-medium truncate">{acc.name[lang] || acc.name.en}</span>
                              <span className="font-bold text-sky-700 font-mono shrink-0 ml-2">{acc.quantity} pcs</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                      <span>Total Items: {order.totalProduceWeightKg} kg produce + {order.totalAccessoriesCount} accessories</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={getWhatsAppBillUrl(order.phone, generateOrderWhatsAppBillText(order, brand))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="Send official itemized bill to customer via WhatsApp"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>WhatsApp Bill</span>
                        </a>
                        {onOpenInvoice && (
                          <button
                            type="button"
                            onClick={() => onOpenInvoice(order)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 dark:bg-emerald-950 text-white rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                            title="View official printable tax invoice & Kotak UPI QR code"
                          >
                            <FileText className="w-3 h-3 text-emerald-400" />
                            <span>Invoice & Kotak QR</span>
                          </button>
                        )}
                        <span className="text-emerald-700 text-sm font-mono font-bold">₹{order.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: 24x7 11 PM Batch Monitor */}
      {activeAdminTab === 'batches' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              24x7 Order Engine & 11:00 PM Daily Mandi Cutoff Monitor
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/30">
              <div className="font-bold text-emerald-900 dark:text-emerald-300 text-sm mb-1">
                {pickLang(lang, {
                  en: 'Batch A: Confirmed for Tomorrow Morning (10 AM Delivery)',
                  hi: 'Batch A: कल सुबह 10 AM डिलीवरी बैच (Confirmed)',
                  mr: 'Batch A: उद्या सकाळी १० वा. डिलिव्हरी (Confirmed)',
                  hinglish: 'Batch A: Confirmed for Tomorrow Morning (10 AM Delivery)',
                })}
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-3">
                {pickLang(lang, {
                  en: 'All orders booked prior to 11:00 PM nightly cutoff are locked into the 4:00 AM APMC Mandi procurement lot.',
                  hi: 'रात 11:00 PM से पहले दर्ज सभी ऑर्डर सुबह 4:00 AM APMC मंडी खरीद बैच में लॉक किए जाते हैं।',
                  mr: 'रात्री ११:०० PM पूर्वी नोंदवलेल्या सर्व ऑर्डर्स सकाळी ४:०० AM APMC मंडी खरेदी बॅचमध्ये लॉक केल्या जातात.',
                  hinglish: 'Raat 11:00 PM cutoff se pehle book sabhi orders subah 4:00 AM APMC procurement lot mein lock hote hain.',
                })}
              </p>
              <div className="text-emerald-800 dark:text-emerald-300 font-bold font-mono">
                {pickLang(lang, {
                  en: `Active Orders in Batch: ${orders.filter((o) => o.cutoffBatch === 'tomorrow_morning').length} orders`,
                  hi: `इस बैच में सक्रिय आर्डर: ${orders.filter((o) => o.cutoffBatch === 'tomorrow_morning').length}`,
                  mr: `या बॅचमधील सक्रिय ऑर्डर्स: ${orders.filter((o) => o.cutoffBatch === 'tomorrow_morning').length}`,
                  hinglish: `Active Orders in Batch: ${orders.filter((o) => o.cutoffBatch === 'tomorrow_morning').length}`,
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
                {pickLang(lang, {
                  en: 'Batch B: Queued for Day-After-Tomorrow Morning Lot',
                  hi: 'Batch B: परसों सुबह की मंडी खेप (Queued)',
                  mr: 'Batch B: परवा सकाळची मंडी बॅच (Queued)',
                  hinglish: 'Batch B: Queued for Day-After-Tomorrow Morning',
                })}
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-3">
                {pickLang(lang, {
                  en: 'Orders placed after 11:00 PM automatically roll over to the subsequent morning procurement cycle.',
                  hi: 'रात 11:00 PM के बाद के ऑर्डर स्वतः अगली सुबह की मंडी खरीद चक्र में शामिल हो जाते हैं।',
                  mr: 'रात्री ११:०० PM नंतरच्या ऑर्डर्स आपोआप पुढील सकाळच्या मंडी खरेदी चक्रात जातात.',
                  hinglish: '11:00 PM ke baad ke orders automatically agle din ke morning cycle mein shift ho jaate hain.',
                })}
              </p>
              <div className="text-slate-700 dark:text-slate-300 font-bold font-mono">
                {pickLang(lang, {
                  en: `Active Orders in Next Batch: ${orders.filter((o) => o.cutoffBatch === 'day_after_morning').length} orders`,
                  hi: `अगले बैच में सक्रिय आर्डर: ${orders.filter((o) => o.cutoffBatch === 'day_after_morning').length}`,
                  mr: `पुढील बॅचमधील ऑर्डर्स: ${orders.filter((o) => o.cutoffBatch === 'day_after_morning').length}`,
                  hinglish: `Active Orders in Next Batch: ${orders.filter((o) => o.cutoffBatch === 'day_after_morning').length}`,
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Registered Customer Accounts Directory (Merged Firestore + Backend — NO Passwords) */}
      {activeAdminTab === 'users' && (() => {
        const q = userSearchQuery.trim().toLowerCase();
        const filteredUsers = registeredUsers.filter((u) => {
          if (!q) return true;
          return (
            u.name.toLowerCase().includes(q) ||
            u.id.toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.phone || '').toLowerCase().includes(q) ||
            (u.fullAddress || '').toLowerCase().includes(q)
          );
        });

        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                    {pickLang(lang, {
                      en: `${registeredUsers.length} Registered`,
                      hi: `${registeredUsers.length} रजिस्टर्ड यूज़र`,
                      mr: `${registeredUsers.length} नोंदणीकृत ग्राहक`,
                      hinglish: `${registeredUsers.length} Registered Users`,
                    })}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
                    Backend: {userSyncStats.backendCount} · Firestore: {userSyncStats.firestoreCount}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    {pickLang(lang, {
                      en: 'Passwords hidden (encrypted)',
                      hi: 'पासवर्ड सुरक्षित व गोपनीय हैं',
                      mr: 'पासवर्ड सुरक्षित व गोपनीय आहेत',
                      hinglish: 'Passwords hidden & encrypted',
                    })}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1.5">
                  {pickLang(lang, {
                    en: 'Registered Customer Accounts Directory',
                    hi: 'रजिस्टर्ड ग्राहक अकाउंट्स सूची (ID / Gmail / मोबाइल)',
                    mr: 'नोंदणीकृत ग्राहक खाती यादी (ID / Gmail / मोबाईल)',
                    hinglish: 'Registered Customer Accounts Directory',
                  })}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pickLang(lang, {
                    en: 'Live merged directory of accounts stored in Cloud Firestore and the app backend.',
                    hi: 'Cloud Firestore और बैकएंड से सिंक किए गए सभी सत्यापित ग्राहक अकाउंट्स यहाँ दिखते हैं।',
                    mr: 'Cloud Firestore आणि बॅकएंडवरून सिंक केलेली सर्व ग्राहक खाती येथे दिसतात.',
                    hinglish: 'Cloud Firestore aur backend se sync hue sabhi customer accounts yahan dikhte hain.',
                  })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder={pickLang(lang, {
                      en: 'Search name, Gmail, phone, ID...',
                      hi: 'नाम, Gmail, नंबर या ID खोजें...',
                      mr: 'नाव, Gmail, नंबर किंवा ID शोधा...',
                      hinglish: 'Name, Gmail, phone ya ID search karein...',
                    })}
                    className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 w-56 sm:w-64"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchRegisteredUsers}
                  disabled={isLoadingUsers}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  <span>{pickLang(lang, { en: 'Refresh', hi: 'रीफ़्रेश', mr: 'रिफ्रेश', hinglish: 'Refresh' })}</span>
                </button>
              </div>
            </div>

            {/* Honest Persistence Info Banner */}
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-[11.5px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {pickLang(lang, {
                  en: 'Persistence Note: Temporary server local cache resets whenever the container restarts, whereas Firebase Firestore permanently preserves every registered customer account across restarts.',
                  hi: 'डेटा सुरक्षा सूचना: कंटेनर रीस्टार्ट होने पर सर्वर की लोकल फ़ाइल रीसेट हो जाती है, लेकिन Firebase Firestore में हर ग्राहक का अकाउंट स्थायी रूप से सुरक्षित रहता है।',
                  mr: 'डेटा सुरक्षितता सूचना: सर्व्हर रीस्टार्ट झाल्यावर तात्पुरता लोकल डेटा रीसेट होतो, परंतु Firebase Firestore मध्ये प्रत्येक खाते कायमस्वरूपी सुरक्षित राहते.',
                  hinglish: 'Data Info: Server restart hone par temporary local file reset ho sakti hai, lekin Firebase Firestore mein har customer account permanently saved rehta hai.',
                })}
              </span>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/40">
                <Users className="w-9 h-9 text-slate-400 mx-auto mb-2.5" />
                <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                  {registeredUsers.length === 0
                    ? pickLang(lang, {
                        en: 'No customer accounts have been registered yet.',
                        hi: 'अभी तक किसी भी ग्राहक ने नया अकाउंट रजिस्टर नहीं किया है।',
                        mr: 'अद्याप कोणत्याही ग्राहकाने खाते नोंदवलेले नाही.',
                        hinglish: 'Abhi tak kisi bhi customer ne account register nahi kiya hai.',
                      })
                    : pickLang(lang, {
                        en: 'No matching registered accounts found.',
                        hi: 'खोज से मेल खाने वाला कोई रजिस्टर्ड अकाउंट नहीं मिला।',
                        mr: 'शोधण्याशी जुळणारे कोणतेही खाते सापडले नाही.',
                        hinglish: 'Search se match hone wala koi registered account nahi mila.',
                      })}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {pickLang(lang, {
                    en: 'When someone registers through Create Account, their User ID, Email/Gmail, Mobile Number, and Address automatically sync to Firestore and appear here.',
                    hi: 'जब भी कोई Create Account से नया अकाउंट बनाएगा, उसका User ID, Email/Gmail, मोबाइल नंबर और पता तुरंत यहाँ दिखाई देगा।',
                    mr: 'कोणीही Create Account द्वारे खाते तयार करताच त्यांचा तपशील येथे आपोआप दिसेल.',
                    hinglish: 'Jab bhi koi Create Account se signup karega, unka User ID, Gmail, Mobile aur Address yahan turant dikhega.',
                  })}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {u.name}
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                              u.source === 'merged'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : u.source === 'firestore'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {u.source === 'merged' ? 'Synced' : u.source === 'firestore' ? 'Firestore' : 'Backend'}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                          ID: {u.id}
                        </div>
                      </div>
                      <span className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {u.createdAt ? new Date(u.createdAt).toLocaleString('en-IN') : ''}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono break-all">{u.email || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono font-bold tabular-nums">{u.phone}</span>
                        {u.secondaryPhone && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            / {u.secondaryPhone}
                          </span>
                        )}
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{u.fullAddress}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB: User Activity Logger Console */}
      {activeAdminTab === 'activity' && (() => {
        const q = activitySearchQuery.trim().toLowerCase();
        const eventCategories = [
          { id: 'ALL', label: pickLang(lang, { en: 'All Events', hi: 'सभी', mr: 'सर्व', hinglish: 'All Events' }) },
          { id: 'AUTH_REGISTER', label: pickLang(lang, { en: 'Sign Ups', hi: 'नए अकाउंट', mr: 'नवीन खाती', hinglish: 'Sign Ups' }) },
          { id: 'AUTH_LOGIN', label: pickLang(lang, { en: 'Sign Ins', hi: 'लॉगिन', mr: 'लॉगिन', hinglish: 'Sign Ins' }) },
          { id: 'AUTH_FAILED', label: pickLang(lang, { en: 'Blocked Attempts', hi: 'ब्लॉक लॉगिन', mr: 'ब्लॉक लॉगिन', hinglish: 'Blocked Attempts' }) },
          { id: 'TERMS_ACCEPTED', label: pickLang(lang, { en: 'Terms Accepted', hi: 'शर्तें स्वीकृत', mr: 'अटी मान्य', hinglish: 'Terms Accepted' }) },
          { id: 'PAGE_VIEW', label: pickLang(lang, { en: 'Navigation', hi: 'पेज विज़िट', mr: 'पेज भेट', hinglish: 'Navigation' }) },
          { id: 'SHARE_LINK', label: pickLang(lang, { en: 'Shared Links', hi: 'लिंक शेयर', mr: 'शेअर लिंक', hinglish: 'Shared Links' }) },
        ];

        const filteredLogs = activityLogs.filter((entry) => {
          if (activityFilterType !== 'ALL' && entry.eventType !== activityFilterType) return false;
          if (!q) return true;
          return (
            entry.actionTitle.toLowerCase().includes(q) ||
            (entry.userName || '').toLowerCase().includes(q) ||
            (entry.userEmail || '').toLowerCase().includes(q) ||
            (entry.userPhone || '').toLowerCase().includes(q) ||
            (entry.details || '').toLowerCase().includes(q) ||
            entry.eventType.toLowerCase().includes(q)
          );
        });

        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <span>{activityLogs.length} Events Logged</span>
                  <span aria-hidden="true">·</span>
                  <span>Real Audit Trail</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {pickLang(lang, {
                    en: 'User Activity Logger',
                    hi: 'यूज़र एक्टिविटी लॉगर (लाइव गतिविधि रिकॉर्ड)',
                    mr: 'युझर अ‍ॅक्टिव्हिटी लॉग',
                    hinglish: 'User Activity Logger',
                  })}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pickLang(lang, {
                    en: 'Chronological feed of sign-ups, logins, rejected attempts, terms acceptance, and shared links.',
                    hi: 'साइन-अप, सफल/असफल लॉगिन, नियम स्वीकृति, पेज विज़िट और लिंक शेयर की समय-वार रिपोर्ट।',
                    mr: 'साइन-अप, लॉगिन, नियम मंजुरी आणि लिंक शेअरची वेळेनुसार नोंद.',
                    hinglish: 'Sign-ups, logins, blocked attempts, T&C aur shared links ki live feed.',
                  })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={activitySearchQuery}
                    onChange={(e) => setActivitySearchQuery(e.target.value)}
                    placeholder={pickLang(lang, {
                      en: 'Search user, phone, event...',
                      hi: 'यूज़र, Gmail या गतिविधि खोजें...',
                      mr: 'युझर, Gmail किंवा कृती शोधा...',
                      hinglish: 'User, phone ya event search karein...',
                    })}
                    className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 w-56"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchActivityLogs}
                  disabled={isLoadingActivity}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingActivity ? 'animate-spin' : ''}`} />
                  <span>{pickLang(lang, { en: 'Refresh', hi: 'रीफ़्रेश', mr: 'रिफ्रेश', hinglish: 'Refresh' })}</span>
                </button>
                {!confirmClearLogs ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClearLogs(true)}
                    disabled={activityLogs.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{pickLang(lang, { en: 'Clear Logs', hi: 'लॉग साफ़ करें', mr: 'लॉग साफ करा', hinglish: 'Clear Logs' })}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleClearActivityLogs}
                      className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                    >
                      {pickLang(lang, { en: 'Confirm Clear', hi: 'पक्का साफ़ करें', mr: 'खात्रीने साफ करा', hinglish: 'Confirm Clear' })}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearLogs(false)}
                      className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      {pickLang(lang, { en: 'Cancel', hi: 'रद्द', mr: 'रद्द', hinglish: 'Cancel' })}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Event Type Segmented Filter */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
              {eventCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActivityFilterType(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activityFilterType === cat.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {filteredLogs.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/40">
                <Activity className="w-9 h-9 text-slate-400 mx-auto mb-2.5" />
                <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                  {pickLang(lang, {
                    en: 'No activity logs recorded yet.',
                    hi: 'अभी कोई एक्टिविटी लॉग दर्ज नहीं हुआ है।',
                    mr: 'अद्याप कोणताही अ‍ॅक्टिव्हिटी लॉग नोंदलेला नाही.',
                    hinglish: 'Abhi koi activity log record nahi hua hai.',
                  })}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {pickLang(lang, {
                    en: 'Every sign up, sign in, failed login attempt, T&C acceptance, and navigation event appears here.',
                    hi: 'हर साइन-अप, लॉगिन, नियम स्वीकृति व नेविगेशन गतिविधि तुरंत यहाँ दिखाई देगी।',
                    mr: 'प्रत्येक साइन-अप, लॉगिन, अटी मंजुरी आणि नेव्हिगेशन येथे दिसेल.',
                    hinglish: 'Har signup, login, failed attempt, T&C acceptance aur page view yahan live dikhega.',
                  })}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {filteredLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 bg-white dark:bg-slate-900/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          {entry.eventType}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {entry.actionTitle}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        {entry.userName && <span>{entry.userName}</span>}
                        {entry.userEmail && <span className="font-mono">{entry.userEmail}</span>}
                        {entry.userPhone && <span className="font-mono">{entry.userPhone}</span>}
                        {entry.details && (
                          <span className="text-slate-500 dark:text-slate-400">{entry.details}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                      <div>{new Date(entry.timestamp).toLocaleString('en-IN')}</div>
                      {entry.deviceSummary && (
                        <div className="text-[10px] text-slate-400">{entry.deviceSummary}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB: RBAC Security & Admin Audit Log */}
      {activeAdminTab === 'audit' && (() => {
        const q = auditSearchQuery.trim().toLowerCase();
        const filteredAuditLogs = auditLogs.filter((entry) => {
          if (auditFilterStatus !== 'ALL' && entry.status !== auditFilterStatus) return false;
          if (!q) return true;
          return (
            entry.action.toLowerCase().includes(q) ||
            entry.resource.toLowerCase().includes(q) ||
            entry.actorName.toLowerCase().includes(q) ||
            entry.actorEmail.toLowerCase().includes(q) ||
            (entry.details || '').toLowerCase().includes(q)
          );
        });

        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <Shield className="w-4 h-4" />
                  <span>
                    {pickLang(lang, {
                      en: 'RBAC Protected Audit Trail',
                      hi: 'RBAC सुरक्षित एडमिन ऑडिट लॉग',
                      mr: 'RBAC सुरक्षित अ‍ॅडमिन ऑडिट लॉग',
                      hinglish: 'RBAC Protected Admin Audit Trail',
                    })}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{auditLogs.length} {pickLang(lang, { en: 'Entries', hi: 'रिकॉर्ड', mr: 'नोंदी', hinglish: 'Entries' })}</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {pickLang(lang, {
                    en: 'Admin Audit Log (Allowed & Denied Access)',
                    hi: 'एडमिन ऑडिट लॉग (स्वीकृत व अवरुद्ध एक्सेस)',
                    mr: 'अ‍ॅडमिन ऑडिट लॉग (मंजूर व नाकारलेला अ‍ॅक्सेस)',
                    hinglish: 'Admin Audit Log (Allowed & Denied Access)',
                  })}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pickLang(lang, {
                    en: 'Server-signed HMAC RBAC trace recording every admin session, mutation, and blocked unauthorized request.',
                    hi: 'हर एडमिन लॉगिन, बदलाव और अनधिकृत ब्लॉक प्रयास की सर्वर-प्रमाणित सुरक्षा रिपोर्ट।',
                    mr: 'प्रत्येक अ‍ॅडमिन सत्र, बदल आणि अनधिकृत अ‍ॅक्सेसच्या प्रयत्नाची सुरक्षित नोंद.',
                    hinglish: 'Har admin session, inventory change aur unauthorized request block ki live server audit report.',
                  })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    placeholder={pickLang(lang, {
                      en: 'Search actor, action, route...',
                      hi: 'एक्टर, एक्शन या रूट खोजें...',
                      mr: 'अ‍ॅक्टर, कृती किंवा रूट शोधा...',
                      hinglish: 'Actor, action ya resource search karein...',
                    })}
                    className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 w-56"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchAuditLogs()}
                  disabled={isLoadingAudit}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`} />
                  <span>{pickLang(lang, { en: 'Refresh', hi: 'रीफ़्रेश', mr: 'रिफ्रेश', hinglish: 'Refresh' })}</span>
                </button>
                {!confirmClearAudit ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClearAudit(true)}
                    disabled={auditLogs.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{pickLang(lang, { en: 'Clear Logs', hi: 'लॉग साफ़ करें', mr: 'लॉग साफ करा', hinglish: 'Clear Logs' })}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleClearAuditLogs}
                      className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                    >
                      {pickLang(lang, { en: 'Confirm Clear', hi: 'पक्का साफ़ करें', mr: 'खात्रीने साफ करा', hinglish: 'Confirm Clear' })}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearAudit(false)}
                      className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      {pickLang(lang, { en: 'Cancel', hi: 'रद्द', mr: 'रद्द', hinglish: 'Cancel' })}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Filter by Status (ALL / allowed / denied) */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
              {(['ALL', 'allowed', 'denied'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setAuditFilterStatus(st);
                    fetchAuditLogs(st);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    auditFilterStatus === st
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL'
                    ? pickLang(lang, { en: 'All Access Events', hi: 'सभी इवेंट्स', mr: 'सर्व इव्हेंट्स', hinglish: 'All Access Events' })
                    : st === 'allowed'
                    ? pickLang(lang, { en: 'Allowed', hi: 'स्वीकृत (Allowed)', mr: 'मंजूर (Allowed)', hinglish: 'Allowed' })
                    : pickLang(lang, { en: 'Denied / Blocked', hi: 'अवरुद्ध (Denied)', mr: 'नाकारले (Denied)', hinglish: 'Denied / Blocked' })}
                </button>
              ))}
            </div>

            {filteredAuditLogs.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/40">
                <Shield className="w-9 h-9 text-slate-400 mx-auto mb-2.5" />
                <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                  {pickLang(lang, {
                    en: 'No admin audit logs match the current filter.',
                    hi: 'वर्तमान फ़िल्टर के लिए कोई ऑडिट लॉग नहीं मिला।',
                    mr: 'सध्याच्या फिल्टरसाठी कोणताही ऑडिट लॉग सापडला नाही.',
                    hinglish: 'Current filter ke liye koi admin audit log nahi mila.',
                  })}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {filteredAuditLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 bg-white dark:bg-slate-900/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            entry.status === 'allowed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {entry.status}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {entry.action}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                        <span className="font-mono text-[11px] text-indigo-700 dark:text-indigo-400">
                          {entry.resource}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-semibold">
                          {entry.actorName} ({entry.actorEmail})
                        </span>
                        {entry.details && (
                          <span className="text-slate-500 dark:text-slate-400">· {entry.details}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                      <div>{new Date(entry.timestamp).toLocaleString('en-IN')}</div>
                      {entry.ip && <div className="text-[10px] text-slate-400">IP: {entry.ip}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 5: Complete Vegetable & Fruits Master Catalog & Stock Management */}
      {activeAdminTab === 'master' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          {/* Header & Main Control Bar */}
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {pickLang(lang, {
                      en: 'Vegetables & Fruits Master Catalog',
                      hi: 'पूर्ण सब्ज़ियाँ व फल उत्पाद मास्टर (Vegetables & Fruits Master List)',
                      mr: 'संपूर्ण भाज्या व फळे उत्पादन मास्टर',
                      hinglish: 'Vegetables & Fruits Master Catalog',
                    })}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {pickLang(lang, {
                    en: `${produceList.length} verified items · Manage customer prices, mandi wholesale rates, stock & seasonal status.`,
                    hi: `कुल ${produceList.length} सत्यापित उत्पाद · ग्राहक मूल्य, थोक खरीद भाव, स्टॉक और मौसमी स्थिति एडमिन द्वारा सीधे नियंत्रित की जा सकती है।`,
                    mr: `एकूण ${produceList.length} सत्यापित उत्पादने · ग्राहक दर, घाऊक भाव, स्टॉक व हंगामी स्थिती नियंत्रित करा.`,
                    hinglish: `Total ${produceList.length} verified products · Customer rate, wholesale price, stock aur seasonal status directly manage karein.`,
                  })}
                </p>
              </div>

              {/* Action Buttons: Export CSV, Add Product, Reset */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={exportProduceMasterCsv}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Export complete 25-field product master database to CSV / Excel"
                >
                  <Download className="w-4 h-4" />
                  <span>{pickLang(lang, { en: 'Export CSV / Excel', hi: '📥 Export to CSV / Excel', mr: '📥 CSV / Excel निर्यात', hinglish: 'Export CSV / Excel' })}</span>
                </button>
                {onOpenAIStudio && (
                  <button
                    type="button"
                    onClick={onOpenAIStudio}
                    className="px-3 py-2 bg-linear-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                    title={pickLang(lang, { en: 'Source new products & photos with AI Studio', hi: 'AI से नया उत्पाद खोजें, भाषा सत्यापित करें और फोटो सहित लाइव स्टोर में जोड़ें', mr: 'AI द्वारे नवीन उत्पादन व फोटो जोडा', hinglish: 'AI se naya product aur photo store mein jodein' })}
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{pickLang(lang, { en: 'AI Product Studio', hi: '✨ AI प्रोडक्ट स्टूडियो व सोर्सिंग', mr: '✨ AI उत्पादन स्टुडिओ', hinglish: 'AI Product Studio & Sourcing' })}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>{pickLang(lang, { en: 'Add Product', hi: 'नया उत्पाद जोड़ें', mr: 'नवीन उत्पादन जोडा', hinglish: '+ New Product Add Karein' })}</span>
                </button>
                {confirmResetCatalog ? (
                  <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-2 py-1 rounded-lg">
                    <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                      {pickLang(lang, { en: 'Confirm reset?', hi: 'रीसेट कन्फर्म?', mr: 'रीसेट खात्री?', hinglish: 'Confirm reset?' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        resetProduceToMaster();
                        setConfirmResetCatalog(false);
                      }}
                      className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold"
                    >
                      {pickLang(lang, { en: 'Yes, Reset', hi: 'हाँ, रीसेट करें', mr: 'हो, रीसेट करा', hinglish: 'Yes, Reset' })}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmResetCatalog(false)}
                      className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-semibold"
                    >
                      {pickLang(lang, { en: 'Cancel', hi: 'नहीं', mr: 'नाही', hinglish: 'Cancel' })}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmResetCatalog(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    title="Reset to default Master catalog"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{pickLang(lang, { en: 'Reset', hi: 'रीसेट', mr: 'रीसेट', hinglish: 'Reset' })}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Catalog Breakdown & Image Health Strip */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold text-slate-500 uppercase">{pickLang(lang, { en: 'Total Items', hi: 'कुल उत्पाद (Total)', mr: 'एकूण उत्पादने', hinglish: 'Total Items' })}</div>
                <div className="text-xl font-black text-slate-900 dark:text-slate-100">{produceList.length}</div>
                <div className="text-[10px] text-emerald-600 font-medium">{pickLang(lang, { en: 'Verified catalog', hi: 'सत्यापित कैटलॉग', mr: 'सत्यापित कॅटलॉग', hinglish: 'Verified catalog' })}</div>
              </div>
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">{pickLang(lang, { en: 'Vegetables', hi: 'सब्ज़ियाँ (Vegetables)', mr: 'भाज्या (Vegetables)', hinglish: 'Vegetables' })}</div>
                <div className="text-xl font-black text-emerald-800 dark:text-emerald-300">
                  {produceList.filter((p) => p.category === 'vegetables' || p.category === 'vegetable').length}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium">{pickLang(lang, { en: 'Daily fresh greens', hi: 'हरी व दैनिक सब्ज़ी', mr: 'ताज्या भाज्या', hinglish: 'Fresh daily veggies' })}</div>
              </div>
              <div className="bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">{pickLang(lang, { en: 'Fruits', hi: 'फल (Fruits)', mr: 'फळे (Fruits)', hinglish: 'Fruits' })}</div>
                <div className="text-xl font-black text-amber-800 dark:text-amber-300">
                  {produceList.filter((p) => p.category === 'fruits' || p.category === 'fruit' || p.category === 'citrus').length}
                </div>
                <div className="text-[10px] text-amber-700 font-medium">{pickLang(lang, { en: 'Seasonal & fresh fruits', hi: 'मौसमी व ताज़े फल', mr: 'हंगामी ताजी फळे', hinglish: 'Seasonal & fresh fruits' })}</div>
              </div>
              <div className="bg-teal-50/70 dark:bg-teal-950/30 p-2.5 rounded-lg border border-teal-200 dark:border-teal-800">
                <div className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase">{pickLang(lang, { en: 'Leafy / Herbs', hi: 'पत्तेदार / हर्ब्स', mr: 'पालेभाज्या', hinglish: 'Leafy / Herbs' })}</div>
                <div className="text-xl font-black text-teal-800 dark:text-teal-300">
                  {produceList.filter((p) => p.category === 'leafy' || p.category === 'herbs').length}
                </div>
                <div className="text-[10px] text-teal-700 font-medium">{pickLang(lang, { en: 'Bunch / Gaddi items', hi: 'गड्डी / जुडी उत्पाद', mr: 'जुडी उत्पादने', hinglish: 'Bunch / Gaddi items' })}</div>
              </div>
              <div className="bg-purple-50/70 dark:bg-purple-950/30 p-2.5 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase">{pickLang(lang, { en: 'Roots', hi: 'कंदमूल (Roots)', mr: 'कंदमुळे (Roots)', hinglish: 'Roots' })}</div>
                <div className="text-xl font-black text-purple-800 dark:text-purple-300">
                  {produceList.filter((p) => p.category === 'roots').length}
                </div>
                <div className="text-[10px] text-purple-700 font-medium">{pickLang(lang, { en: 'Potato, Onion, Carrot', hi: 'आलू, कांदा, गाजर', mr: 'बटाटा, कांदा, गाजर', hinglish: 'Aloo, Kanda, Gajar' })}</div>
              </div>
              <button
                type="button"
                onClick={() => setMissingPhotoFilter(!missingPhotoFilter)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  missingPhotoFilter
                    ? 'bg-rose-100 dark:bg-rose-950 border-rose-400 text-rose-900 dark:text-rose-200 ring-2 ring-rose-400'
                    : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 hover:bg-rose-100/50'
                }`}
              >
                <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase flex items-center justify-between">
                  <span>{pickLang(lang, { en: 'Needs Photo', hi: 'तस्वीर बाकी', mr: 'फोटो बाकी', hinglish: 'Needs Photo' })}</span>
                  <Camera className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="text-xl font-black text-rose-800 dark:text-rose-300">
                  {produceList.filter((p) => !hasVerifiedProductPhoto(p.id)).length}
                </div>
                <div className="text-[10px] text-rose-700 font-bold underline mt-0.5">
                  {missingPhotoFilter
                    ? pickLang(lang, { en: 'Clear filter', hi: '✕ फ़िल्टर हटाएं', mr: '✕ फिल्टर काढा', hinglish: 'Clear filter' })
                    : pickLang(lang, { en: 'Show missing photos', hi: '📷 केवल बिना फोटो देखें', mr: '📷 फोटो नसलेले पहा', hinglish: 'Show missing photos' })}
                </div>
              </button>
            </div>

            {/* Quick Text Price & Tier Setter (#1 = 35) */}
            <div className="mt-4">
              <QuickPriceSetter />
            </div>

            {/* Recommended Missing Produce from Local Shops and APMC */}
            <div className="mt-4 p-3.5 bg-linear-to-r from-amber-50 to-orange-50 dark:from-slate-800/80 dark:to-slate-850 rounded-xl border border-amber-200 dark:border-amber-900/60">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {pickLang(lang, {
                      en: 'Recommended Market Produce (1-Click Add to Store):',
                      hi: 'दुकानों व मंडी में मिलने वाले अनुशंसित उत्पाद (1-क्लिक में स्टोर में जोड़ें):',
                      mr: 'मंडीतील शिफारस केलेली उत्पादने (१-क्लिक जोडा):',
                      hinglish: 'Market Recommended Produce (1-Click Add to Store):',
                    })}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  {pickLang(lang, { en: 'Admin quick add', hi: 'एडमिन सीधे शामिल कर सकते हैं', mr: 'अ‍ॅडमिन थेट जोडू शकतात', hinglish: 'Admin quick add' })}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {RECOMMENDED_MISSING_PRODUCE.filter((rec) => !produceList.some((p) => p.id === rec.id)).map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <SafeProductImg product={item as ProduceItem} alt={item.name?.en || item.name?.hi || ''} className="w-9 h-9 rounded object-cover shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.name?.[lang] || item.name?.en || item.name?.hi}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">₹{item.pricePerKg}/{item.stockUnit || 'kg'}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addProduceItem(item as ProduceItem)}
                      className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 hover:bg-emerald-200 rounded-md transition-colors shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{pickLang(lang, { en: 'Add', hi: 'जोड़ें', mr: 'जोडा', hinglish: 'Add' })}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters & Search Row */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Category Dropdown */}
                <select
                  value={masterCategoryFilter}
                  onChange={(e) => setMasterCategoryFilter(e.target.value)}
                  className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-emerald-600"
                >
                  <option value="all">{pickLang(lang, { en: 'All Categories', hi: 'सभी श्रेणियाँ (All Categories)', mr: 'सर्व श्रेणी', hinglish: 'All Categories' })}</option>
                  <option value="vegetables">{pickLang(lang, { en: 'Vegetables', hi: 'सामान्य सब्ज़ियाँ (Vegetables)', mr: 'भाज्या (Vegetables)', hinglish: 'Vegetables' })}</option>
                  <option value="leafy">{pickLang(lang, { en: 'Leafy Greens', hi: 'पत्तेदार भाजी (Leafy Greens)', mr: 'पालेभाज्या (Leafy)', hinglish: 'Leafy Greens' })}</option>
                  <option value="roots">{pickLang(lang, { en: 'Roots & Tubers', hi: 'जड़ वाली सब्ज़ियाँ (Roots)', mr: 'कंदमुळे (Roots)', hinglish: 'Roots & Tubers' })}</option>
                  <option value="citrus">{pickLang(lang, { en: 'Citrus Fruits', hi: 'खट्टे फल (Citrus)', mr: 'आंबट फळे (Citrus)', hinglish: 'Citrus Fruits' })}</option>
                  <option value="fruits">{pickLang(lang, { en: 'Fruits', hi: 'सामान्य फल (Fruits)', mr: 'फळे (Fruits)', hinglish: 'Fruits' })}</option>
                  <option value="herbs">{pickLang(lang, { en: 'Fresh Herbs', hi: 'ताज़ी जड़ी-बूटियाँ (Herbs)', mr: 'ताज्या औषधी वनस्पती', hinglish: 'Fresh Herbs' })}</option>
                  <option value="sprouts">{pickLang(lang, { en: 'Sprouts & Legumes', hi: 'अंकुरित व फलियाँ (Sprouts)', mr: 'कडधान्य व शेंगा', hinglish: 'Sprouts & Legumes' })}</option>
                  <option value="other">{pickLang(lang, { en: 'Other Food', hi: 'अन्य खाद्य उत्पाद (Other)', mr: 'इतर उत्पादने', hinglish: 'Other Food' })}</option>
                </select>

                {/* Stock Status Filter */}
                <select
                  value={masterStockFilter}
                  onChange={(e) => setMasterStockFilter(e.target.value as any)}
                  className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-emerald-600"
                >
                  <option value="all">{pickLang(lang, { en: 'All Stock Status', hi: 'सभी स्टॉक स्थिति (All Status)', mr: 'सर्व स्टॉक स्थिती', hinglish: 'All Stock Status' })}</option>
                  <option value="in_stock">{pickLang(lang, { en: 'In Stock', hi: '🟢 उपलब्ध स्टॉक (In Stock)', mr: '🟢 उपलब्ध (In Stock)', hinglish: 'In Stock' })}</option>
                  <option value="out_of_stock">{pickLang(lang, { en: 'Out of Stock', hi: '🔴 स्टॉक खत्म (Out of Stock)', mr: '🔴 संपले (Out of Stock)', hinglish: 'Out of Stock' })}</option>
                  <option value="seasonal">{pickLang(lang, { en: 'Seasonal Only', hi: '⭐ केवल मौसमी (Seasonal)', mr: '⭐ हंगामी (Seasonal)', hinglish: 'Seasonal Only' })}</option>
                </select>

                <span className="text-xs text-slate-500 font-mono">
                  {pickLang(lang, {
                    en: `Showing: ${filteredMasterList.length} / ${produceList.length}`,
                    hi: `दिखाए गए: ${filteredMasterList.length} / ${produceList.length}`,
                    mr: `दिसत आहेत: ${filteredMasterList.length} / ${produceList.length}`,
                    hinglish: `Showing: ${filteredMasterList.length} / ${produceList.length}`,
                  })}
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={masterSearch}
                  onChange={(e) => setMasterSearch(e.target.value)}
                  placeholder={pickLang(lang, {
                    en: 'Search name (EN/HI/MR) or ID...',
                    hi: 'नाम (हिंदी/मराठी/EN) या ID खोजें...',
                    mr: 'नाव (मराठी/हिंदी/EN) किंवा ID शोधा...',
                    hinglish: 'Name (EN/HI/MR) ya ID search karein...',
                  })}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Master Database Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">{pickLang(lang, { en: 'Product & Photo', hi: 'उत्पाद व फ़ोटो', mr: 'उत्पादन व फोटो', hinglish: 'Product & Photo' })}</th>
                  <th className="py-3 px-4 font-semibold">{pickLang(lang, { en: 'Category / Subcategory', hi: 'श्रेणी / उपश्रेणी', mr: 'श्रेणी / उपश्रेणी', hinglish: 'Category' })}</th>
                  <th className="py-3 px-4 font-semibold text-right">
                    {pickLang(lang, { en: 'Customer Price (₹/kg)', hi: 'ग्राहक मूल्य (₹/kg)', mr: 'ग्राहक दर (₹/kg)', hinglish: 'Customer Price (₹/kg)' })}
                    <span className="block text-[10px] text-emerald-600 font-normal">{pickLang(lang, { en: 'Edit inline', hi: 'सीधे बदलें', mr: 'थेट बदला', hinglish: 'Edit inline' })}</span>
                  </th>
                  <th className="py-3 px-4 font-semibold text-right">
                    {pickLang(lang, { en: 'Offer / Discount (₹)', hi: 'ऑफर / छूट (₹)', mr: 'सूट / ऑफर (₹)', hinglish: 'Offer Price (₹)' })}
                    <span className="block text-[10px] text-amber-600 font-normal">{pickLang(lang, { en: 'Discount rate', hi: 'डिस्काउंट रेट', mr: 'सूट दर', hinglish: 'Discount rate' })}</span>
                  </th>
                  <th className="py-3 px-4 font-semibold text-right">
                    {pickLang(lang, { en: 'Wholesale Rate (₹/kg)', hi: 'थोक खरीद भाव (₹/kg)', mr: 'घाऊक खरेदी दर (₹/kg)', hinglish: 'Wholesale Rate (₹/kg)' })}
                    <span className="block text-[10px] text-slate-400 font-normal">{pickLang(lang, { en: 'Mandi rate', hi: 'मंडी भाव', mr: 'मंडी भाव', hinglish: 'Mandi rate' })}</span>
                  </th>
                  <th className="py-3 px-4 font-semibold text-right">
                    {pickLang(lang, { en: 'Available Stock', hi: 'उपलब्ध स्टॉक', mr: 'उपलब्ध स्टॉक', hinglish: 'Available Stock' })}
                    <span className="block text-[10px] text-slate-400 font-normal">{pickLang(lang, { en: 'With unit', hi: 'इकाई सहित', mr: 'युनिटसह', hinglish: 'With unit' })}</span>
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">{pickLang(lang, { en: 'Stock Status', hi: 'स्टॉक स्थिति', mr: 'स्टॉक स्थिती', hinglish: 'Stock Status' })}</th>
                  <th className="py-3 px-4 font-semibold text-center">{pickLang(lang, { en: 'Season', hi: 'मौसम (Season)', mr: 'हंगाम (Season)', hinglish: 'Season' })}</th>
                  <th className="py-3 px-4 font-semibold text-center">{pickLang(lang, { en: 'Actions', hi: 'कार्रवाई', mr: 'कृती', hinglish: 'Actions' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredMasterList.map((product) => {
                  const isInStock = product.isAvailable !== false;
                  const isSeasonal = Boolean(product.isSeasonal);

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        !isInStock ? 'opacity-70 bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Product Name & Visual */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative group shrink-0">
                            <SafeProductImg
                              product={product}
                              alt={product.name.en}
                              className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-750"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPhotoModalProduct({
                                  id: product.id,
                                  name: product.name[lang] || product.name.en || product.name.hi,
                                  image: resolveProductVisualAsset(product),
                                  type: 'produce',
                                  category: product.category,
                                });
                                setIsPhotoModalOpen(true);
                              }}
                              className="absolute inset-0 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[8px] font-bold"
                              title={pickLang(lang, { en: 'Change or upload photo', hi: 'फोटो बदलें या अपलोड करें', mr: 'फोटो बदला', hinglish: 'Change photo' })}
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>{pickLang(lang, { en: 'Change', hi: 'बदलें', mr: 'बदला', hinglish: 'Change' })}</span>
                            </button>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.5 rounded font-mono font-bold">
                                #{produceList.findIndex((p) => p.id === product.id) + 1}
                              </span>
                              <span>{product.name[lang] || product.name.en || product.name.hi}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({product.id})</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span>EN: {product.name.en}</span>
                              <span>·</span>
                              <span>MR: {product.name.mr}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setPhotoModalProduct({
                                    id: product.id,
                                    name: product.name[lang] || product.name.en || product.name.hi,
                                    image: resolveProductVisualAsset(product),
                                    type: 'produce',
                                    category: product.category,
                                  });
                                  setIsPhotoModalOpen(true);
                                }}
                                className={`text-[10px] px-2 py-0.5 rounded font-bold inline-flex items-center gap-1 transition-colors ${
                                  hasVerifiedProductPhoto(product.id)
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200 animate-pulse'
                                }`}
                              >
                                <Camera className="w-3 h-3" />
                                <span>
                                  {hasVerifiedProductPhoto(product.id)
                                    ? pickLang(lang, { en: 'Change Photo', hi: '📷 फोटो बदलें', mr: '📷 फोटो बदला', hinglish: 'Change Photo' })
                                    : pickLang(lang, { en: 'Upload Photo', hi: '⚠️ तस्वीर अपलोड करें', mr: '⚠️ फोटो अपलोड करा', hinglish: 'Upload Photo' })}
                                </span>
                              </button>
                              {product.pricingUnit && product.pricingUnit !== 'kg' && (
                                <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold">
                                  {product.pricingUnit === 'gaddi'
                                    ? pickLang(lang, { en: '🌿 Bunch / Gaddi', hi: '🌿 गड्डी / जुडी', mr: '🌿 जुडी', hinglish: '🌿 Gaddi / Bunch' })
                                    : pickLang(lang, { en: '🥥 Piece', hi: '🥥 नग / पीस', mr: '🥥 नग', hinglish: '🥥 Piece' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Subcategory */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                          {product.category}
                        </span>
                        {product.subcategory && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                            {product.subcategory}
                          </div>
                        )}
                      </td>

                      {/* Customer Selling Price (Inline Edit) */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <span className="text-slate-400">₹</span>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={product.pricePerKg}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateProduceItem(product.id, { pricePerKg: val });
                            }}
                            className="w-16 px-1.5 py-1 text-right font-mono font-bold text-slate-900 dark:text-slate-100 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded focus:outline-emerald-600"
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {pickLang(lang, { en: `Market: ₹${product.localMarketPricePerKg}`, hi: `बाज़ार: ₹${product.localMarketPricePerKg}`, mr: `बाजार: ₹${product.localMarketPricePerKg}`, hinglish: `Market: ₹${product.localMarketPricePerKg}` })}
                        </div>
                      </td>

                      {/* Discount / Offer Price (Inline Edit) */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <span className="text-slate-400">₹</span>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={product.discountPrice ?? ''}
                            placeholder={pickLang(lang, { en: 'No offer', hi: 'छूट नहीं', mr: 'सूट नाही', hinglish: 'No offer' })}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              updateProduceItem(product.id, { discountPrice: val });
                            }}
                            className="w-16 px-1.5 py-1 text-right font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded focus:outline-emerald-600"
                          />
                        </div>
                        {product.discountPrice && product.discountPrice < product.pricePerKg && (
                          <div className="text-[10px] text-amber-600 font-bold mt-0.5">
                            {Math.round(((product.pricePerKg - product.discountPrice) / product.pricePerKg) * 100)}% {pickLang(lang, { en: 'OFF', hi: 'छूट', mr: 'सूट', hinglish: 'OFF' })}
                          </div>
                        )}
                      </td>

                      {/* Mandi Purchase Wholesale Price (Inline Edit) */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <span className="text-slate-400">₹</span>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={product.wholesalePricePerKg}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateProduceItem(product.id, { wholesalePricePerKg: val });
                            }}
                            className="w-16 px-1.5 py-1 text-right font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-emerald-600"
                          />
                        </div>
                        <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                          {pickLang(lang, { en: `Margin: +₹${product.pricePerKg - product.wholesalePricePerKg}`, hi: `मार्जिन: +₹${product.pricePerKg - product.wholesalePricePerKg}`, mr: `नफा: +₹${product.pricePerKg - product.wholesalePricePerKg}`, hinglish: `Margin: +₹${product.pricePerKg - product.wholesalePricePerKg}` })}
                        </div>
                      </td>

                      {/* Stock & Unit (Inline Edit) */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={product.availableStock ?? 50}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateProduceItem(product.id, { availableStock: val });
                            }}
                            className="w-14 px-1.5 py-1 text-right font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-emerald-600"
                          />
                          <span className="text-[11px] text-slate-500 font-mono">{product.stockUnit || 'kg'}</span>
                        </div>
                      </td>

                      {/* In Stock / Out of Stock Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleProduceAvailability(product.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-2xs ${
                            isInStock
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200'
                          }`}
                          title="Click to toggle availability"
                        >
                          {isInStock
                            ? pickLang(lang, { en: 'In Stock', hi: '🟢 उपलब्ध (In Stock)', mr: '🟢 उपलब्ध', hinglish: 'In Stock' })
                            : pickLang(lang, { en: 'Out of Stock', hi: '🔴 खत्म (Out of Stock)', mr: '🔴 संपले', hinglish: 'Out of Stock' })}
                        </button>
                      </td>

                      {/* Seasonal Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleProduceSeasonal(product.id)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                            isSeasonal
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                          title="Click to toggle seasonal product flag"
                        >
                          {isSeasonal
                            ? pickLang(lang, { en: '⭐ Seasonal', hi: '⭐ मौसमी (Seasonal)', mr: '⭐ हंगामी', hinglish: '⭐ Seasonal' })
                            : pickLang(lang, { en: 'Regular', hi: 'नियमित', mr: 'नियमित', hinglish: 'Regular' })}
                        </button>
                      </td>

                      {/* Action Buttons: Edit & Delete */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(product)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded"
                            title="Edit Full Product Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {confirmDeleteProductId === product.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteProduceItem(product.id);
                                  setConfirmDeleteProductId(null);
                                }}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                                title="Confirm delete"
                              >
                                {pickLang(lang, { en: 'Delete', hi: 'हटाएं', mr: 'हटवा', hinglish: 'Delete' })}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteProductId(null)}
                                className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded"
                                title="Cancel"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteProductId(product.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded"
                              title="Remove Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Edit Product Full Details */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {pickLang(lang, {
                    en: `Edit Product Details (${editingProduct.name.en})`,
                    hi: `उत्पाद विवरण संपादित करें (${editingProduct.name.en})`,
                    mr: `उत्पादन तपशील संपादित करा (${editingProduct.name.en})`,
                    hinglish: `Edit Product Details (${editingProduct.name.en})`,
                  })}
                </h3>
                <span className="text-xs text-slate-500 font-mono">ID: #{editingProduct.id}</span>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'English Name', hi: 'अंग्रेज़ी नाम (English)', mr: 'इंग्रजी नाव', hinglish: 'English Name' })}</label>
                  <input
                    type="text"
                    value={editingProduct.name.en}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        name: { ...editingProduct.name, en: e.target.value },
                      })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Hindi Name', hi: 'हिंदी नाम (Hindi)', mr: 'हिंदी नाव', hinglish: 'Hindi Name' })}</label>
                  <input
                    type="text"
                    value={editingProduct.name.hi}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        name: { ...editingProduct.name, hi: e.target.value },
                      })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Marathi Name', hi: 'मराठी नाम (Marathi)', mr: 'मराठी नाव', hinglish: 'Marathi Name' })}</label>
                  <input
                    type="text"
                    value={editingProduct.name.mr}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        name: { ...editingProduct.name, mr: e.target.value },
                      })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Customer Price (₹/kg)', hi: 'ग्राहक बिक्री मूल्य (₹/kg)', mr: 'ग्राहक विक्री दर (₹/kg)', hinglish: 'Customer Price (₹/kg)' })}</label>
                  <input
                    type="number"
                    value={editingProduct.pricePerKg}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        pricePerKg: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Mandi Wholesale (₹/kg)', hi: 'मंडी थोक खरीद भाव (₹/kg)', mr: 'मंडी घाऊक दर (₹/kg)', hinglish: 'Mandi Wholesale (₹/kg)' })}</label>
                  <input
                    type="number"
                    value={editingProduct.wholesalePricePerKg}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        wholesalePricePerKg: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Available Stock', hi: 'उपलब्ध स्टॉक (Stock)', mr: 'उपलब्ध स्टॉक', hinglish: 'Available Stock' })}</label>
                  <input
                    type="number"
                    value={editingProduct.availableStock ?? 50}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        availableStock: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Variety', hi: 'किस्म (Variety)', mr: 'प्रकार (Variety)', hinglish: 'Variety' })}</label>
                  <input
                    type="text"
                    value={editingProduct.variety || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        variety: e.target.value,
                      })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Origin / Mandi', hi: 'उत्पत्ति / मंडी (Origin)', mr: 'मूळ / मंडी (Origin)', hinglish: 'Origin / Mandi' })}</label>
                  <input
                    type="text"
                    value={editingProduct.origin}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        origin: e.target.value,
                      })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Quality Grade', hi: 'गुणवत्ता ग्रेड (Grade)', mr: 'दर्जा (Grade)', hinglish: 'Quality Grade' })}</label>
                  <select
                    value={editingProduct.qualityGrade || 'Grade-A'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        qualityGrade: e.target.value as any,
                      })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="Premium">Premium</option>
                    <option value="Grade-A">Grade-A</option>
                    <option value="Regular">Regular</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={editingProduct.isAvailable !== false}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        isAvailable: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>{pickLang(lang, { en: 'In Stock', hi: 'स्टॉक में उपलब्ध है (In Stock)', mr: 'स्टॉक उपलब्ध', hinglish: 'In Stock' })}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-700 dark:text-amber-400">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.isSeasonal)}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        isSeasonal: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span>{pickLang(lang, { en: '⭐ Seasonal Product', hi: '⭐ मौसमी उत्पाद (Seasonal)', mr: '⭐ हंगामी उत्पादन', hinglish: '⭐ Seasonal Product' })}</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Description', hi: 'विवरण (Description)', mr: 'वर्णन (Description)', hinglish: 'Description' })}</label>
                <textarea
                  rows={2}
                  value={editingProduct.description?.[lang] || editingProduct.description?.en || editingProduct.description?.hi || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: {
                        ...editingProduct.description,
                        hi: e.target.value,
                        en: editingProduct.description?.en || e.target.value,
                        mr: editingProduct.description?.mr || e.target.value,
                        hinglish: editingProduct.description?.hinglish || e.target.value,
                      },
                    })
                  }
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
                >
                  {pickLang(lang, { en: 'Cancel', hi: 'रद्द करें', mr: 'रद्द करा', hinglish: 'Cancel' })}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateProduceItem(editingProduct.id, editingProduct);
                    setEditingProduct(null);
                  }}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs"
                >
                  {pickLang(lang, { en: 'Save Changes', hi: 'परिवर्तन सहेजें (Save Changes)', mr: 'बदल जतन करा', hinglish: 'Save Changes' })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Product */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>{pickLang(lang, { en: 'Add New Produce', hi: 'नया उत्पाद जोड़ें (Add New Produce)', mr: 'नवीन उत्पादन जोडा', hinglish: 'Add New Produce' })}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Product ID (Unique)', hi: 'उत्पाद ID (Unique)', mr: 'उत्पादन ID (Unique)', hinglish: 'Product ID (Unique)' })}</label>
                  <input
                    type="text"
                    placeholder="e.g. veg_custom_produce"
                    value={newProductForm.id || ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, id: e.target.value.toLowerCase().trim() })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Category', hi: 'मुख्य श्रेणी (Category)', mr: 'मुख्य श्रेणी (Category)', hinglish: 'Category' })}</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="vegetables">{pickLang(lang, { en: 'Vegetables', hi: 'सामान्य सब्ज़ियाँ (Vegetables)', mr: 'भाज्या (Vegetables)', hinglish: 'Vegetables' })}</option>
                    <option value="leafy">{pickLang(lang, { en: 'Leafy Greens', hi: 'पत्तेदार भाजी (Leafy)', mr: 'पालेभाज्या (Leafy)', hinglish: 'Leafy Greens' })}</option>
                    <option value="roots">{pickLang(lang, { en: 'Roots', hi: 'जड़ वाली सब्ज़ियाँ (Roots)', mr: 'कंदमुळे (Roots)', hinglish: 'Roots' })}</option>
                    <option value="citrus">{pickLang(lang, { en: 'Citrus Fruits', hi: 'खट्टे फल (Citrus)', mr: 'आंबट फळे (Citrus)', hinglish: 'Citrus Fruits' })}</option>
                    <option value="fruits">{pickLang(lang, { en: 'Fruits', hi: 'सामान्य फल (Fruits)', mr: 'फळे (Fruits)', hinglish: 'Fruits' })}</option>
                    <option value="herbs">{pickLang(lang, { en: 'Herbs', hi: 'जड़ी-बूटियाँ (Herbs)', mr: 'औषधी वनस्पती (Herbs)', hinglish: 'Herbs' })}</option>
                    <option value="sprouts">{pickLang(lang, { en: 'Sprouts', hi: 'अंकुरित व फलियाँ (Sprouts)', mr: 'कडधान्य (Sprouts)', hinglish: 'Sprouts' })}</option>
                    <option value="other">{pickLang(lang, { en: 'Other Food', hi: 'अन्य उत्पाद (Other)', mr: 'इतर उत्पादने', hinglish: 'Other Food' })}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Name (EN)</label>
                  <input
                    type="text"
                    value={newProductForm.name?.en || ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: { ...newProductForm.name!, en: e.target.value } })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Name (HI)</label>
                  <input
                    type="text"
                    value={newProductForm.name?.hi || ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: { ...newProductForm.name!, hi: e.target.value } })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Name (MR)</label>
                  <input
                    type="text"
                    value={newProductForm.name?.mr || ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: { ...newProductForm.name!, mr: e.target.value } })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Selling Price (₹/kg)', hi: 'बिक्री मूल्य (₹/kg)', mr: 'विक्री दर (₹/kg)', hinglish: 'Selling Price (₹/kg)' })}</label>
                  <input
                    type="number"
                    value={newProductForm.pricePerKg}
                    onChange={(e) => setNewProductForm({ ...newProductForm, pricePerKg: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Wholesale Rate (₹/kg)', hi: 'खरीद भाव (₹/kg)', mr: 'घाऊक दर (₹/kg)', hinglish: 'Wholesale Rate (₹/kg)' })}</label>
                  <input
                    type="number"
                    value={newProductForm.wholesalePricePerKg}
                    onChange={(e) => setNewProductForm({ ...newProductForm, wholesalePricePerKg: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Stock (Kg)', hi: 'स्टॉक (Kg)', mr: 'स्टॉक (Kg)', hinglish: 'Stock (Kg)' })}</label>
                  <input
                    type="number"
                    value={newProductForm.availableStock}
                    onChange={(e) => setNewProductForm({ ...newProductForm, availableStock: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 rounded-lg"
                >
                  {pickLang(lang, { en: 'Cancel', hi: 'रद्द करें', mr: 'रद्द करा', hinglish: 'Cancel' })}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newProductForm.name?.en && !newProductForm.name?.hi) {
                      return;
                    }
                    const fallbackEn = newProductForm.name?.en || newProductForm.name?.hi || 'Custom Produce';
                    const autoId =
                      (newProductForm.id || '').trim() ||
                      `prod_${fallbackEn.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'custom'}_${Date.now().toString().slice(-4)}`;
                    const fullItem: ProduceItem = {
                      id: autoId,
                      name: {
                        en: fallbackEn,
                        hi: newProductForm.name?.hi || fallbackEn,
                        mr: newProductForm.name?.mr || newProductForm.name?.hi || fallbackEn,
                        hinglish: fallbackEn,
                      },
                      category: newProductForm.category || 'vegetables',
                      subcategory: newProductForm.subcategory || 'Fresh',
                      variety: newProductForm.variety || 'Desi',
                      pricePerKg: newProductForm.pricePerKg || 40,
                      wholesalePricePerKg: newProductForm.wholesalePricePerKg || 25,
                      localMarketPricePerKg: (newProductForm.pricePerKg || 40) + 15,
                      availableStock: newProductForm.availableStock || 50,
                      stockUnit: newProductForm.stockUnit || 'kg',
                      pricingUnit: (newProductForm.stockUnit as any) || 'kg',
                      minIncrementKg: newProductForm.stockUnit === 'piece' || newProductForm.stockUnit === 'gaddi' ? 1 : 0.25,
                      defaultKg: 0.5,
                      origin: newProductForm.origin || 'APMC Vashi Wholesale Mandi',
                      isAvailable: true,
                      isSeasonal: Boolean(newProductForm.isSeasonal),
                      mandiTierBagKg: 25,
                      baseCommunityDemandKg: 10,
                      image: newProductForm.image || '/assets/images/fresh_fruits_basket_1793421532041.jpg',
                      description: newProductForm.description as any,
                      freshnessGuarantee: newProductForm.freshnessGuarantee as any,
                      adminApprovalStatus: 'approved',
                      lastUpdated: new Date().toISOString().split('T')[0],
                    };
                    addProduceItem(fullItem);
                    setIsAddModalOpen(false);
                  }}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold"
                >
                  {pickLang(lang, { en: 'Save Product', hi: 'उत्पाद सहेजें (Add Product)', mr: 'उत्पादन जतन करा', hinglish: 'Save Product' })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Mobile Accessory Details */}
      {editingAccessory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {pickLang(lang, {
                  en: `Edit Mobile Accessory (${editingAccessory.name.en})`,
                  hi: `मोबाइल एक्सेसरी संपादित करें (${editingAccessory.name.en})`,
                  mr: `मोबाईल ॲक्सेसरी संपादित करा (${editingAccessory.name.en})`,
                  hinglish: `Edit Mobile Accessory (${editingAccessory.name.en})`,
                })}
              </h3>
              <button onClick={() => setEditingAccessory(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Name (English)</label>
                <input
                  type="text"
                  value={editingAccessory.name.en}
                  onChange={(e) => setEditingAccessory({ ...editingAccessory, name: { ...editingAccessory.name, en: e.target.value } })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Name (Hindi)</label>
                <input
                  type="text"
                  value={editingAccessory.name.hi}
                  onChange={(e) => setEditingAccessory({ ...editingAccessory, name: { ...editingAccessory.name, hi: e.target.value } })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Brand</label>
                <input
                  type="text"
                  value={editingAccessory.brand}
                  onChange={(e) => setEditingAccessory({ ...editingAccessory, brand: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Warranty</label>
                <input
                  type="text"
                  value={editingAccessory.warranty}
                  onChange={(e) => setEditingAccessory({ ...editingAccessory, warranty: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Selling Price (₹)', hi: 'बिक्री मूल्य (₹)', mr: 'विक्री किंमत (₹)', hinglish: 'Selling Price (₹)' })}</label>
                <input
                  type="number"
                  value={editingAccessory.price}
                  onChange={(e) => setEditingAccessory({ ...editingAccessory, price: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">MRP (₹)</label>
                <input
                  type="number"
                  value={editingAccessory.mrp}
                  onChange={(e) => setEditingAccessory({ ...editingAccessory, mrp: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">{pickLang(lang, { en: 'Wholesale Cost (₹)', hi: 'थोक लागत (₹)', mr: 'घाऊक खर्च (₹)', hinglish: 'Wholesale Cost (₹)' })}</label>
                <input
                  type="number"
                  value={editingAccessory.wholesaleCost}
                  onChange={(e) => setEditingAccessory({ ...editingAccessory, wholesaleCost: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setEditingAccessory(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer">
                {pickLang(lang, { en: 'Cancel', hi: 'रद्द करें', mr: 'रद्द करा', hinglish: 'Cancel' })}
              </button>
              <button
                type="button"
                onClick={() => {
                  updateAccessoryItem(editingAccessory.id, editingAccessory);
                  setEditingAccessory(null);
                }}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold cursor-pointer"
              >
                {pickLang(lang, { en: 'Save', hi: 'सेव करें', mr: 'जतन करा', hinglish: 'Save' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Add Brand-New Mobile Accessory */}
      {isAddAccessoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span>{pickLang(lang, { en: 'Add New Mobile Accessory', hi: 'नई मोबाइल एक्सेसरी जोड़ें', mr: 'नवीन मोबाईल ॲक्सेसरी जोडा', hinglish: 'Add New Mobile Accessory' })}</span>
              </h3>
              <button onClick={() => setIsAddAccessoryModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Name (EN)*</label>
                <input
                  type="text"
                  placeholder="e.g. 65W Fast GaN Charger"
                  value={newAccessoryForm.name?.en || ''}
                  onChange={(e) => setNewAccessoryForm({ ...newAccessoryForm, name: { ...newAccessoryForm.name!, en: e.target.value } })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Name (HI)</label>
                <input
                  type="text"
                  placeholder="65W Fast GaN Charger"
                  value={newAccessoryForm.name?.hi || ''}
                  onChange={(e) => setNewAccessoryForm({ ...newAccessoryForm, name: { ...newAccessoryForm.name!, hi: e.target.value } })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Category</label>
                <select
                  value={newAccessoryForm.category || 'chargers'}
                  onChange={(e) => setNewAccessoryForm({ ...newAccessoryForm, category: e.target.value as AccessoryCategory })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="chargers">Chargers & Cables</option>
                  <option value="audio">Audio & Earbuds</option>
                  <option value="powerbanks">Power Banks</option>
                  <option value="cases">Cases & Covers</option>
                  <option value="mounts">Stands & Mounts</option>
                  <option value="protection">Tempered Glass & Protection</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Brand & Warranty</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAccessoryForm.brand || 'MARCO Tech'}
                    onChange={(e) => setNewAccessoryForm({ ...newAccessoryForm, brand: e.target.value })}
                    className="w-1/2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <input
                    type="text"
                    value={newAccessoryForm.warranty || '6 Months'}
                    onChange={(e) => setNewAccessoryForm({ ...newAccessoryForm, warranty: e.target.value })}
                    className="w-1/2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  value={newAccessoryForm.price || 299}
                  onChange={(e) => setNewAccessoryForm({ ...newAccessoryForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">MRP (₹)</label>
                <input
                  type="number"
                  value={newAccessoryForm.mrp || 599}
                  onChange={(e) => setNewAccessoryForm({ ...newAccessoryForm, mrp: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Wholesale Cost (₹)</label>
                <input
                  type="number"
                  value={newAccessoryForm.wholesaleCost || 165}
                  onChange={(e) => setNewAccessoryForm({ ...newAccessoryForm, wholesaleCost: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddAccessoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
              >
                {pickLang(lang, { en: 'Cancel', hi: 'रद्द करें', mr: 'रद्द करा', hinglish: 'Cancel' })}
              </button>
              <button
                type="button"
                onClick={() => {
                  const enName = (newAccessoryForm.name?.en || newAccessoryForm.name?.hi || '').trim();
                  if (!enName) return;
                  const hiName = (newAccessoryForm.name?.hi || enName).trim();
                  const slug = enName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                  const fullAcc: MobileAccessoryItem = {
                    id: `acc_${slug || 'item'}_${Date.now().toString().slice(-4)}`,
                    name: {
                      en: enName,
                      hi: hiName,
                      mr: newAccessoryForm.name?.mr || hiName,
                      hinglish: enName,
                    },
                    category: (newAccessoryForm.category || 'chargers') as AccessoryCategory,
                    brand: newAccessoryForm.brand || 'MARCO Tech',
                    price: Math.max(10, Number(newAccessoryForm.price) || 299),
                    mrp: Math.max(10, Number(newAccessoryForm.mrp) || 599),
                    wholesaleCost: Math.max(5, Number(newAccessoryForm.wholesaleCost) || 165),
                    warranty: newAccessoryForm.warranty || '6 Months Replacement',
                    specs: Array.isArray(newAccessoryForm.specs) ? newAccessoryForm.specs : ['Fast Performance', 'Verified Stock'],
                    rating: 4.8,
                    inStock: true,
                    founderVerified: true,
                    isNewArrival: true,
                    image: newAccessoryForm.image || '/assets/images/mobile_fast_chargers.jpg',
                    description: {
                      en: newAccessoryForm.description?.en || `${enName} verified mobile tech accessory.`,
                      hi: newAccessoryForm.description?.hi || `${hiName} सत्यापित मोबाइल एक्सेसरी।`,
                      mr: newAccessoryForm.description?.mr || hiName,
                      hinglish: enName,
                    },
                  };
                  addAccessoryItem(fullAcc);
                  setIsAddAccessoryModalOpen(false);
                }}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold cursor-pointer"
              >
                {pickLang(lang, { en: 'Save Accessory', hi: 'एक्सेसरी सहेजें (Save Accessory)', mr: 'ॲक्सेसरी जतन करा', hinglish: 'Save Accessory' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Admin Top 10 Buyers Profit & AI Reward Studio */}
      {activeAdminTab === 'buyers_analytics' && <AdminBuyersAnalyticsTab />}

      {/* Master Admin Feature Switchboard & Storefront UI Sample Themes */}
      {activeAdminTab === 'features' && (
        <AdminFeatureControlsTab onOpenSamplesGallery={onOpenSamplesGallery} />
      )}

      {/* Referral & Cashback Control Center Tab */}
      {activeAdminTab === 'referrals' && <ReferralRewardsManager />}

      {/* Product Image Uploader Modal for Produce & Accessories */}
      <ProductImageUploaderModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        product={photoModalProduct}
        onSaveImage={handleSaveProductImage}
      />
    </div>
  );
};

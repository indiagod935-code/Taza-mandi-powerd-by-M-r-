import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CustomerOrder } from '../types';
import { SafeProductImg } from './SafeProductImg';
import { OrderFeedbackCard } from './OrderFeedbackCard';
import { LiveMandiDeliveryMap } from './LiveMandiDeliveryMap';
import { pickLang } from '../utils/i18nHelper';
import {
  Truck,
  Clock,
  CheckCircle2,
  Package,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Smartphone,
  Leaf,
  Phone,
  Copy,
  Check,
  Zap,
  Building2,
  Calendar,
  AlertTriangle,
  ShoppingBag,
  Share2,
  FileText,
  QrCode,
  ExternalLink,
  XCircle,
  Volume2,
} from 'lucide-react';
import {
  OFFICIAL_UPI_CONFIG,
  generateUpiUrl,
  generateUpiQrCodeUrl,
  generateOrderWhatsAppBillText,
  getWhatsAppBillUrl,
} from '../utils/billingUtils';

interface OrderTrackingDashboardProps {
  initialOrderId?: string | null;
  onGoToMarket: () => void;
  onOpenInvoice?: (order: CustomerOrder) => void;
  isAdminAuthorized?: boolean;
}

type DispatchStageKey = 'ordered' | 'procured_at_mandi' | 'packed' | 'out_for_delivery' | 'delivered';

interface MandiStageInfo {
  key: DispatchStageKey;
  stepNumber: number;
  timeSlot: string;
  title: { en: string; hi: string; mr: string };
  location: string;
  description: { en: string; hi: string; mr: string };
  badgeText: string;
}

const MANDI_DISPATCH_STAGES: MandiStageInfo[] = [
  {
    key: 'ordered',
    stepNumber: 1,
    timeSlot: '11:00 PM',
    title: {
      en: '11 PM Cutoff & Batch Freeze',
      hi: 'रात 11 बजे कटऑफ व मांग संकलन',
      mr: 'रात्री ११ कटऑफ व एकूण मागणी संकलन',
    },
    location: 'Society Virtual Hub · Navi Mumbai',
    description: {
      en: 'Society orders locked. Exact kilograms aggregated into wholesale gunny bags with +1-2 kg safety buffer.',
      hi: 'सोसायटी के सभी फ्लैटों के ऑर्डर एकत्र। 1-2 किलो अतिरिक्त बफर के साथ थोक बोरी मांग फ्रीज की गई।',
      mr: 'सोसायटीच्या सर्व फ्लॅट्सच्या ऑर्डर्स लॉक. १-२ किलो सेफ्टी बफरसह घाऊक गोणी मागणी निश्चित केली.',
    },
    badgeText: 'Zero-Waste Batch Locked',
  },
  {
    key: 'procured_at_mandi',
    stepNumber: 2,
    timeSlot: '04:00 AM',
    title: {
      en: 'APMC Vashi Dawn Sourcing & Inspection',
      hi: 'सुबह 4 बजे वाशी एपीएमसी मंडी से सीधा उठाव',
      mr: 'पहाटे ४ वाजता वाशी एपीएमसी घाऊक लिलाव खरेदी',
    },
    location: 'APMC Market Yard 2, Vashi',
    description: {
      en: 'Ground specialists bidding directly on fresh night farmer trucks from Nashik & Pune. Grade-A quality verified.',
      hi: 'नाशिक, पुणे से रात में आई गाड़ियों से सीधे आढ़त पर बोली लगाकर ए-ग्रेड ताज़ी सब्जियां व फल खरीदे जा रहे हैं।',
      mr: 'नाशिक व पुण्यातून आलेल्या ताज्या गाड्यांमधून थेट लिलावातून उच्च दर्जाच्या भाज्या व फळे खरेदी सुरू.',
    },
    badgeText: 'Grade-A Mandi Certified',
  },
  {
    key: 'packed',
    stepNumber: 3,
    timeSlot: '07:30 AM',
    title: {
      en: 'Sanitized Weighing & MARCO 100 Bagging',
      hi: 'सटीक तौल, जूट थैली पैकिंग व मार्को 100 किट',
      mr: 'अचूक वजन, जूट पिशवी पॅकिंग व मार्को १०० ॲक्सेसरीज',
    },
    location: 'Society Sorting Micro-Hub',
    description: {
      en: 'Produce measured on calibrated digital scales to exact requested weights (1kg, 1.5kg, 4kg). Accessories packed.',
      hi: 'ग्राहक के बताए अनुसार (1.5 किग्रा, 4 किग्रा आदि) डिजिटल तराजू पर तौलकर सांस लेने वाली जूट की थैली में पैक किया गया।',
      mr: 'ग्राहकाच्या अचूक मागणीनुसार (१.५ किलो, ४ किलो) डिजिटल काट्यावर वजन करून जूट बॅगमध्ये पॅक केले.',
    },
    badgeText: 'Digital Calibrated Weighing',
  },
  {
    key: 'out_for_delivery',
    stepNumber: 4,
    timeSlot: '09:00 AM',
    title: {
      en: 'Out for Society Doorstep Delivery',
      hi: 'सोसायटी परिसर में डिलीवरी वैन रवाना',
      mr: 'सोसायटी आवारात डिलिव्हरी व्हॅन दाखल',
    },
    location: 'सोसायटी परिसर व फ्लैट डिलीवरी',
    description: {
      en: 'Electric Delivery Van arrived at society gate. Gate pass OTP verified. Partner heading up to flat doorstep.',
      hi: 'इलेक्ट्रिक डिलीवरी वैन सोसाइटी गेट पर पहुंची। सिक्योरिटी गेट पास ओटीपी सत्यापित। फ्लैट के दरवाजे पर डिलीवरी जारी।',
      mr: 'इलेक्ट्रिक डिलिव्हरी व्हॅन मुख्य गेटवर दाखल. सुरक्षा ओटीपी पास मंजूर. फ्लॅटच्या दाराकडे रवाना.',
    },
    badgeText: 'In Transit · Van MH-43-AK-2044',
  },
  {
    key: 'delivered',
    stepNumber: 5,
    timeSlot: '10:00 AM',
    title: {
      en: 'Delivered at Doorstep',
      hi: 'दरवाजे पर सफलतापूर्वक डिलीवर',
      mr: 'दारात सुरक्षितपणे सुपूर्द केले',
    },
    location: 'Customer Flat Doorstep',
    description: {
      en: 'Fresh produce & verified MARCO 100 accessories safely handed over. Zero stale inventory guarantee fulfilled.',
      hi: 'खेत और मंडी की ताज़गी सीधे आपके घर पहुंची। 0% बासी माल और थोक बचत की गारंटी पूरी हुई।',
      mr: 'ताजी भाजीपाला व मार्को १०० वस्तू यशस्वीरीत्या सुपूर्द. शून्य शिळा साठा हमी पूर्ण!',
    },
    badgeText: 'Doorstep Handover Complete',
  },
];

export const OrderTrackingDashboard: React.FC<OrderTrackingDashboardProps> = ({
  initialOrderId,
  onGoToMarket,
  onOpenInvoice,
  isAdminAuthorized = false,
}) => {
  const {
    orders,
    updateOrderStatus,
    confirmOrderDeliveryAndPayment,
    cancelOrder,
    isBefore11PmCutoff,
    timeUntil11Pm,
    toggleCutoffOverride,
    lang,
    brand,
  } = useApp();

  // Active selected order
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    if (initialOrderId && orders.some((o) => o.id === initialOrderId)) {
      return initialOrderId;
    }
    return orders.length > 0 ? orders[0].id : '';
  });

  const [copiedOtp, setCopiedOtp] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [confirmToast, setConfirmToast] = useState<string | null>(null);


  // Time remaining countdown till 10:00 AM delivery
  const [etaCountdown, setEtaCountdown] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 8,
    minutes: 42,
    seconds: 15,
  });

  // Ensure selected order is valid if orders change
  useEffect(() => {
    if (initialOrderId && orders.some((o) => o.id === initialOrderId)) {
      setSelectedOrderId(initialOrderId);
    } else if (!orders.some((o) => o.id === selectedOrderId) && orders.length > 0) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, initialOrderId, selectedOrderId]);

  // Live countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || orders[0];
  }, [orders, selectedOrderId]);

  // Find index of current stage
  const currentStageIndex = useMemo(() => {
    if (!activeOrder) return 0;
    const stageMap: Record<CustomerOrder['status'], number> = {
      ordered: 0,
      procured_at_mandi: 1,
      packed: 2,
      out_for_delivery: 3,
      delivered: 4,
      cancelled: 0,
    };
    return stageMap[activeOrder.status] ?? 0;
  }, [activeOrder]);

  // Order status follows strict real-life store operations (Zero fake auto-simulation)


  // Stage step handlers
  const handleNextStage = () => {
    if (!activeOrder) return;
    const stageKeys: DispatchStageKey[] = [
      'ordered',
      'procured_at_mandi',
      'packed',
      'out_for_delivery',
      'delivered',
    ];
    if (currentStageIndex < stageKeys.length - 1) {
      updateOrderStatus(activeOrder.id, stageKeys[currentStageIndex + 1]);
    }
  };

  const handlePrevStage = () => {
    if (!activeOrder) return;
    const stageKeys: DispatchStageKey[] = [
      'ordered',
      'procured_at_mandi',
      'packed',
      'out_for_delivery',
      'delivered',
    ];
    if (currentStageIndex > 0) {
      updateOrderStatus(activeOrder.id, stageKeys[currentStageIndex - 1]);
    }
  };

  const handleResetStage = () => {
    if (!activeOrder) return;
    updateOrderStatus(activeOrder.id, 'ordered');
  };

  const copyGateOtp = () => {
    navigator.clipboard?.writeText('TM-7842');
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  if (!activeOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Package className="w-16 h-16 mx-auto text-slate-400 mb-4 animate-bounce" />
        <h1 className="text-xl sm:text-2xl font-display font-black text-slate-800 dark:text-slate-100">
          {lang === 'hi'
            ? 'ट्रैक करने के लिए अभी कोई आर्डर नहीं है'
            : lang === 'mr'
            ? 'ट्रॅक करण्यासाठी सध्या कोणतीही ऑर्डर नाही'
            : 'No Orders Placed Yet to Track'}
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          {lang === 'hi'
            ? 'सुबह 4 बजे वाशी मंडी डिस्पैच और लाइव डिलीवरी देखने के लिए अपनी ताज़ी सब्ज़ियों व फलों का पहला आर्डर दर्ज करें।'
            : lang === 'mr'
            ? 'सकाळी ४ वा. वाशी मंडी डिस्पॅच आणि थेट डिलिव्हरी पाहण्यासाठी तुमची पहिली ताजी ऑर्डर नोंदवा.'
            : 'Place your first customized quantity vegetable or fruit order to view live 4 AM APMC Mandi dispatch tracking.'}
        </p>
        <button
          onClick={onGoToMarket}
          className="mt-6 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow-md transition-colors inline-flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>
            {lang === 'hi'
              ? 'ताज़ा सब्ज़ियाँ व फल खरीदें'
              : lang === 'mr'
              ? 'ताजी भाजी व फळे पहा'
              : 'Explore Fresh Produce'}
          </span>
        </button>
      </div>
    );
  }

  // Calculate ETA strings based on 11 PM cutoff batch
  const isPre11PmOrder = activeOrder.cutoffBatch === 'tomorrow_morning';
  const expectedDateText = isPre11PmOrder
    ? 'Tomorrow Morning, 10:00 AM'
    : 'Day-After-Tomorrow Morning, 10:00 AM';

  const cutoffExplanation = isPre11PmOrder
    ? 'Order was locked before the 11:00 PM cutoff. Sourcing scheduled in tonight’s 4:00 AM APMC dawn auction.'
    : 'Order was placed after the 11:00 PM cutoff. Rolled over into the next midnight consolidation run.';

  // Transit percentage for the visual route bar
  const transitProgressPercent = Math.min(100, Math.max(10, currentStageIndex * 25));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Order Switcher Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>
                  {lang === 'hi'
                    ? 'लाइव मंडी सप्लाई चेन'
                    : lang === 'mr'
                    ? 'थेट मंडी सप्लाय चेन'
                    : 'Live Mandi Supply Chain'}
                </span>
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-500">
                {brand.mandiCity} ➔ {brand.societyName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-slate-100">
              {lang === 'hi'
                ? 'लाइव मंडी डिस्पैच व डिलीवरी ट्रैकिंग'
                : lang === 'mr'
                ? 'थेट एपीएमसी मंडी डिस्पॅच व डिलिव्हरी ट्रॅकर'
                : 'Real-time Mandi Dispatch & Doorstep Tracker'}
            </h1>
          </div>

          {/* Order Selector Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'hi' ? 'ऑर्डर चुनें:' : lang === 'mr' ? 'ऑर्डर निवडा:' : 'Select Order:'}
            </span>
            {orders.map((ord) => {
              const isSelected = ord.id === activeOrder.id;
              return (
                <button
                  key={ord.id}
                  onClick={() => setSelectedOrderId(ord.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <span>#{ord.id}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      ord.status === 'cancelled'
                        ? 'bg-rose-500'
                        : ord.status === 'delivered'
                        ? 'bg-emerald-400'
                        : ord.status === 'out_for_delivery'
                        ? 'bg-sky-400 animate-pulse'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-[10px] opacity-80 uppercase font-sans">
                    ({ord.status.replace(/_/g, ' ')})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Order Summary Ribbon */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="text-slate-500 text-[11px] font-medium">Customer & Destination</div>
            <div className="font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
              {activeOrder.customerName}
            </div>
            <div className="text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold truncate">
              {activeOrder.flatNumber}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="text-slate-500 text-[11px] font-medium">Order Placed Time</div>
            <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {activeOrder.orderedAt}
            </div>
            <div className="text-slate-500 text-[11px]">24x7 Continuous Intake</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="text-slate-500 text-[11px] font-medium">Mandi Cutoff Batch</div>
            <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPre11PmOrder ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>{isPre11PmOrder ? 'Pre-11 PM (Batch A)' : 'Post-11 PM (Batch B)'}</span>
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {isPre11PmOrder ? 'Tonight 4 AM Auction' : 'Next Night Auction'}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="text-slate-500 text-[11px] font-medium">Total Manifest & Bill</div>
            <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
              {activeOrder.totalProduceWeightKg} kg + {activeOrder.totalAccessoriesCount} tech
            </div>
            <div className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px] font-mono">
              ₹{activeOrder.totalAmount} Total
            </div>
          </div>
        </div>
      </div>

      {/* Hero ETA & 11 PM Cutoff Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Expected Arrival Time & Live Countdown Clock */}
        <div className="lg:col-span-7 bg-linear-to-br from-emerald-900 via-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-7 shadow-lg relative overflow-hidden border border-emerald-800/50">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Calculated Expected Arrival (ETA)</span>
                </span>
                <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2.5 py-0.5 rounded-full font-bold">
                  {activeOrder.deliverySlot}
                </span>
              </div>

              <div className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-white">
                {expectedDateText}
              </div>

              <p className="mt-2 text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-xl">
                {cutoffExplanation}
              </p>
            </div>

            {/* Real-time Countdown Counter Block */}
            <div className="mt-6 pt-5 border-t border-emerald-800/60">
              <div className="text-xs text-emerald-300 font-semibold mb-2">
                Estimated Delivery Window Countdown:
              </div>
              <div className="grid grid-cols-3 gap-3 max-w-xs font-mono">
                <div className="bg-black/40 backdrop-blur border border-emerald-700/50 rounded-xl p-3 text-center">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {String(etaCountdown.hours).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] uppercase font-sans text-emerald-400 mt-0.5">Hours</div>
                </div>
                <div className="bg-black/40 backdrop-blur border border-emerald-700/50 rounded-xl p-3 text-center">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {String(etaCountdown.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] uppercase font-sans text-emerald-400 mt-0.5">Mins</div>
                </div>
                <div className="bg-black/40 backdrop-blur border border-emerald-700/50 rounded-xl p-3 text-center">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-300">
                    {String(etaCountdown.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] uppercase font-sans text-emerald-400 mt-0.5">Secs</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: 11:00 PM Cutoff Rule & Simulation Controls */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>11:00 PM Cutoff Rule Engine</span>
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isBefore11PmCutoff
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {isBefore11PmCutoff ? 'Cutoff Window Open' : 'Post-Cutoff Queue'}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isBefore11PmCutoff
                ? 'Tomorrow Morning 10 AM Run'
                : 'Day-After Morning 10 AM Run'}
            </h3>

            <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Daily Cutoff Deadline:</span>
                <strong className="text-slate-900 dark:text-slate-100">11:00 PM IST (Night)</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Time until next 11 PM cutoff:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {timeUntil11Pm}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Wholesale Mandi Auction Start:</span>
                <strong className="text-slate-900 dark:text-slate-100">03:30 AM - 04:00 AM</strong>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
              Wholesale Mandi lots operate on strict early-dawn auction schedules. Aggregating orders by 11 PM enables zero-loss wholesale bidding and bulk sack procurement.
            </p>
          </div>

          {/* Real Operational Controls (Admin-Only) + Customer Cancellation */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>
                {isAdminAuthorized
                  ? lang === 'hi'
                    ? 'दुकान व्यवस्थापक स्थिति नियंत्रण:'
                    : lang === 'mr'
                    ? 'स्टोअर व्यवस्थापक स्थिती नियंत्रण:'
                    : 'Store Operations Controls:'
                  : pickLang(lang, {
                      en: 'Live Order Status:',
                      hi: 'ऑर्डर लाइव स्थिति:',
                      mr: 'ऑर्डर थेट स्थिती:',
                      hinglish: 'Order Live Status:',
                    })}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                activeOrder.status === 'cancelled'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950'
              }`}>
                {activeOrder.status === 'cancelled' ? 'Cancelled:' : lang === 'hi' ? 'लाइव स्टेटस:' : 'Live Status:'} #{activeOrder.id}
              </span>
            </div>

            {activeOrder.status === 'cancelled' ? (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <div>
                  <div className="font-bold">
                    {pickLang(lang, {
                      en: 'Order Cancelled',
                      hi: 'यह ऑर्डर रद्द कर दिया गया है',
                      mr: 'ही ऑर्डर रद्द केली आहे',
                      hinglish: 'Order Cancel Ho Chuka Hai',
                    })}
                  </div>
                  {activeOrder.cancelReason && (
                    <div className="text-[11px] opacity-85">{activeOrder.cancelReason} · {activeOrder.cancelledAt}</div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {isAdminAuthorized && (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handlePrevStage}
                        disabled={currentStageIndex === 0}
                        className="py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                        title={lang === 'hi' ? 'पिछला चरण' : lang === 'mr' ? 'मागील टप्पा' : 'Previous Stage'}
                      >
                        {lang === 'hi' ? '◀ पिछला चरण' : lang === 'mr' ? '◀ मागील टप्पा' : '◀ Prev Stage'}
                      </button>

                      <button
                        onClick={handleNextStage}
                        disabled={currentStageIndex === MANDI_DISPATCH_STAGES.length - 1}
                        className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                        title={lang === 'hi' ? 'अगला चरण अपडेट करें' : lang === 'mr' ? 'पुढील टप्पा अपडेट करा' : 'Advance Stage'}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'hi'
                            ? 'अगले चरण में बढ़ाएं ▶'
                            : lang === 'mr'
                            ? 'पुढील टप्प्यावर न्या ▶'
                            : 'Advance Next Stage ▶'}
                        </span>
                      </button>

                      <button
                        onClick={handleResetStage}
                        className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        title={lang === 'hi' ? 'चरण 1 पर रीसेट करें' : lang === 'mr' ? 'टप्पा १ वर रीसेट करा' : 'Reset to Stage 1'}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {!(activeOrder.status === 'delivered' && activeOrder.paymentConfirmed) && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = confirmOrderDeliveryAndPayment(activeOrder.id);
                          setConfirmToast(res.message);
                          setTimeout(() => setConfirmToast(null), 5000);
                        }}
                        className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {pickLang(lang, {
                            en: 'Confirm Delivery & Payment Receipt',
                            hi: 'डिलीवरी व पेमेंट कन्फ़र्म करें',
                            mr: 'डिलिव्हरी व पेमेंट कन्फर्म करा',
                          })}
                        </span>
                      </button>
                    )}

                    {confirmToast && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold">
                        {confirmToast}
                      </div>
                    )}
                  </>
                )}

                {activeOrder.status !== 'delivered' && (
                  showCancelConfirm ? (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-rose-800 dark:text-rose-200">
                        {pickLang(lang, {
                          en: 'Cancel this order?',
                          hi: 'क्या यह ऑर्डर रद्द करें?',
                          mr: 'ही ऑर्डर रद्द करायची का?',
                          hinglish: 'Order cancel karein?',
                        })}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(false)}
                          className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                        >
                          {pickLang(lang, { en: 'No', hi: 'नहीं', mr: 'नाही', hinglish: 'Nahi' })}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            cancelOrder(activeOrder.id, 'Cancelled from Tracking Dashboard');
                            setShowCancelConfirm(false);
                          }}
                          className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold"
                        >
                          {pickLang(lang, { en: 'Confirm Cancel', hi: 'हाँ रद्द करें', mr: 'हो रद्द करा', hinglish: 'Cancel Karein' })}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>
                        {pickLang(lang, {
                          en: 'Cancel This Order',
                          hi: 'यह ऑर्डर कैंसिल करें',
                          mr: 'ही ऑर्डर रद्द करा',
                          hinglish: 'Yeh Order Cancel Karein',
                        })}
                      </span>
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>


      {/* Google Maps Platform Live Transit Corridor Map */}
      <div className="space-y-4">
        <LiveMandiDeliveryMap
          transitProgressPercent={transitProgressPercent}
          deliveryStage={activeOrder.status}
          orderId={activeOrder.id}
        />

        {/* Live Animated Transit Route & Micro-Milestones */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Live Transit Corridor: APMC Vashi ➔ Palm Beach ➔ Society Gate</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                वाशी एपीएमसी मार्केट यार्ड ➔ {brand.societyName} सीधा ताज़ी खेत व मंडी डिलीवरी मार्ग
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                Progress: {transitProgressPercent}%
              </span>
            </div>
          </div>

          {/* Route Progress Bar with Checkpoints */}
          <div className="relative pt-6 pb-4">
          {/* Track Bar Background */}
          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-emerald-600 via-teal-500 to-emerald-400 transition-all duration-700 ease-out"
              style={{ width: `${transitProgressPercent}%` }}
            />
          </div>

          {/* Animated Van Marker */}
          <div
            className="absolute top-1 transform -translate-x-1/2 transition-all duration-700 ease-out"
            style={{ left: `${transitProgressPercent}%` }}
          >
            <div className="bg-emerald-700 text-white p-1.5 rounded-full shadow-lg border-2 border-white dark:border-slate-900 flex items-center justify-center animate-pulse">
              <Truck className="w-4 h-4" />
            </div>
          </div>

          {/* 5 Milestone Checkpoints on Route */}
          <div className="grid grid-cols-5 gap-1 mt-5 text-center text-xs">
            <div className={`space-y-1 ${currentStageIndex >= 0 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
              <div className="w-3 h-3 mx-auto rounded-full bg-current mb-1 ring-4 ring-emerald-100 dark:ring-emerald-950"></div>
              <div className="text-[11px] truncate">1. 11 PM Cutoff</div>
              <div className="text-[10px] text-slate-400 font-normal">Order Batched</div>
            </div>

            <div className={`space-y-1 ${currentStageIndex >= 1 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
              <div className="w-3 h-3 mx-auto rounded-full bg-current mb-1"></div>
              <div className="text-[11px] truncate">2. 4 AM APMC</div>
              <div className="text-[10px] text-slate-400 font-normal">Dawn Auction</div>
            </div>

            <div className={`space-y-1 ${currentStageIndex >= 2 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
              <div className="w-3 h-3 mx-auto rounded-full bg-current mb-1"></div>
              <div className="text-[11px] truncate">3. Sorting Hub</div>
              <div className="text-[10px] text-slate-400 font-normal">Weighed & Packed</div>
            </div>

            <div className={`space-y-1 ${currentStageIndex >= 3 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
              <div className="w-3 h-3 mx-auto rounded-full bg-current mb-1"></div>
              <div className="text-[11px] truncate">4. Society Gate</div>
              <div className="text-[10px] text-slate-400 font-normal">Gate Pass Verified</div>
            </div>

            <div className={`space-y-1 ${currentStageIndex >= 4 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
              <div className="w-3 h-3 mx-auto rounded-full bg-current mb-1"></div>
              <div className="text-[11px] truncate">5. Doorstep Handover</div>
              <div className="text-[10px] text-slate-400 font-normal">Delivered 10 AM</div>
            </div>
          </div>
        </div>

        {/* Courier / Vehicle Dispatch Details Card */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
              KS
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                Kailash Shinde (Driver Lead)
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span>★ 4.9 Rating</span>
                <span>·</span>
                <span>1,240+ Society Drops</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                Mahindra Zor Grand EV
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Van #MH-43-AK-2044 · Green EV
              </div>
            </div>
          </div>

          {/* Society Gate OTP Pass */}
          <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div>
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Society Gate Pass OTP
              </div>
              <div className="font-mono font-black text-emerald-900 dark:text-emerald-100 text-base mt-0.5 tracking-wider">
                TM-7842
              </div>
            </div>
            <button
              onClick={copyGateOtp}
              className="p-2 bg-white dark:bg-slate-900 rounded-lg text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 transition-colors"
              title="Copy Security OTP"
            >
              {copiedOtp ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Delivered Freshness & Delivery Rating */}
      {activeOrder.status === 'delivered' && (
        <OrderFeedbackCard order={activeOrder} stage="delivered" />
      )}

      {/* Mandi Supply Chain Stage-by-Stage Stepper */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {lang === 'hi'
                ? 'मंडी से आपके दरवाजे तक के 5 मुख्य चरण'
                : lang === 'mr'
                ? 'एपीएमसी ते घरापर्यंतचे ५ टप्पे'
                : '5-Stage APMC Mandi Sourcing Pipeline'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict 0% stale stock policy: every gram is sourced only after orders are consolidated.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-700 dark:text-slate-300">
            Stage {currentStageIndex + 1} of {MANDI_DISPATCH_STAGES.length}
          </span>
        </div>

        <div className="space-y-4">
          {MANDI_DISPATCH_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const isUpcoming = idx > currentStageIndex;

            return (
              <div
                key={stage.key}
                onClick={
                  isAdminAuthorized
                    ? () => updateOrderStatus(activeOrder.id, stage.key)
                    : undefined
                }
                className={`p-4 rounded-xl border transition-all ${
                  isAdminAuthorized ? 'cursor-pointer' : ''
                } ${
                  isCurrent
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                    : isCompleted
                    ? 'bg-slate-50 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 opacity-90'
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 opacity-65'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Status Node Icon */}
                  <div className="shrink-0 mt-0.5">
                    {isCompleted ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        ✓
                      </div>
                    ) : isCurrent ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs ring-4 ring-emerald-200 dark:ring-emerald-900 animate-pulse">
                        {stage.stepNumber}
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs">
                        {stage.stepNumber}
                      </div>
                    )}
                  </div>

                  {/* Stage Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {stage.title[lang as 'hi' | 'mr'] || stage.title.en}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                          {stage.timeSlot}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            try {
                              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                                window.speechSynthesis.cancel();
                                const titleText = stage.title[lang as 'hi' | 'mr'] || stage.title.en;
                                const descText = stage.description[lang as 'hi' | 'mr'] || stage.description.en;
                                const utt = new SpeechSynthesisUtterance(`${titleText}. ${descText}`);
                                utt.lang = lang === 'en' || lang === 'hinglish' ? 'en-IN' : 'hi-IN';
                                utt.rate = 1.02;
                                window.speechSynthesis.speak(utt);
                              }
                            } catch {}
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10.5px] font-bold cursor-pointer"
                          title={pickLang(lang, { en: 'Listen to stage info', hi: 'सुनें', mr: 'ऐका' })}
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>
                            {pickLang(lang, {
                              en: 'Listen',
                              hi: 'सुनें',
                              mr: 'ऐका',
                              hinglish: 'Listen',
                            })}
                          </span>
                        </button>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 self-start sm:self-auto">
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>{stage.badgeText}</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      {stage.description[lang as 'hi' | 'mr'] || stage.description.en}
                    </div>

                    <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 flex-wrap">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{stage.location}</span>
                      {isCurrent && (
                        <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">
                          {isAdminAuthorized
                            ? '◀ Currently Active Stage (Click any stage to update)'
                            : pickLang(lang, {
                                en: '◀ Currently Active Stage',
                                hi: '◀ वर्तमान सक्रिय चरण',
                                mr: '◀ सध्याचा सक्रिय टप्पा',
                              })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Manifest & Visual Produce Integrity Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Order Packing Manifest & Visual Verification</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified visual mapping: only the single requested produce or accessory item is loaded into your bag.
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            Order #{activeOrder.id} · {activeOrder.customerName}
          </div>
        </div>

        {/* Fresh Produce Items in this Order */}
        {activeOrder.produceItems.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fresh Farm Produce ({activeOrder.totalProduceWeightKg} kg):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeOrder.produceItems.map((item, idx) => {
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center gap-3"
                  >
                    <div className="relative shrink-0">
                      <SafeProductImg
                        product={item.produceId}
                        alt={item.name.en}
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-750 shadow-xs"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {item.name[lang as 'hi' | 'mr'] || item.name.hi || item.name.en}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ₹{item.pricePerKg}/kg · Single-Item Verified
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          {item.quantityKg} kg
                        </span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          ₹{item.itemTotal}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile Accessories in this Order */}
        {activeOrder.accessoryItems.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>MARCO 100 Mobile Accessories ({activeOrder.totalAccessoriesCount} items):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeOrder.accessoryItems.map((acc, idx) => {
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center gap-3"
                  >
                    <div className="relative shrink-0">
                      <SafeProductImg
                        product={acc.accessoryId}
                        alt={acc.name.en}
                        isAccessory
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-750 shadow-xs"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-sky-600 text-white rounded-full p-0.5">
                        <Zap className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {acc.name[lang as 'hi' | 'mr'] || acc.name.en}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        MARCO 100 Certified · 6-Mo Warranty
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <span className="font-mono font-bold text-sky-700 dark:text-sky-300">
                          {acc.quantity} pcs
                        </span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          ₹{acc.itemTotal}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bill & Wholesale Savings Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            <span>Payment Mode: </span>
            <strong className="text-slate-800 dark:text-slate-200">
              Kotak UPI QR / Cash on Doorstep
            </strong>
          </div>
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
              Estimated Wholesale Savings: ~₹140
            </span>
            <span className="font-black text-slate-900 dark:text-slate-100 text-base font-mono">
              Total: ₹{activeOrder.totalAmount}
            </span>
          </div>
        </div>

        {/* WhatsApp Bill & Kotak UPI Invoice Action Bar */}
        <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>Kotak UPI: <strong className="font-mono text-slate-700 dark:text-slate-300">{OFFICIAL_UPI_CONFIG.upiId}</strong></span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={getWhatsAppBillUrl(activeOrder.phone, generateOrderWhatsAppBillText(activeOrder, brand))}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              title="Send itemized bill to customer WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'व्हाट्सएप बिल' : lang === 'mr' ? 'व्हॉट्सअॅप बिल' : 'WhatsApp Bill'}</span>
            </a>
            {onOpenInvoice && (
              <button
                type="button"
                onClick={() => onOpenInvoice(activeOrder)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-900/60 dark:hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                title="View full tax invoice and live Kotak UPI QR code"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'hi' ? 'पक्का बिल व Kotak QR' : lang === 'mr' ? 'बिल व QR कोड' : 'Invoice & Kotak QR'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
